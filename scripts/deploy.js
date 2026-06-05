const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Fixed Deposit Protocol Deployment");
  console.log(`Network  : ${network.name} (chainId: ${network.chainId})`);
  console.log(`Deployer : ${deployer.address}`);
  console.log(`Balance  : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  const AccessController = await ethers.getContractFactory("AccessController");
  const access = await AccessController.deploy(deployer.address);
  await access.waitForDeployment();

  const InterestModel = await ethers.getContractFactory("InterestModel");
  const interestModel = await InterestModel.deploy(await access.getAddress());
  await interestModel.waitForDeployment();

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(await access.getAddress());
  await treasury.waitForDeployment();

  const DepositManager = await ethers.getContractFactory("DepositManager");
  const manager = await upgrades.deployProxy(
    DepositManager,
    [await access.getAddress(), deployer.address, await interestModel.getAddress(), await treasury.getAddress()],
    { kind: "uups", initializer: "initialize" }
  );
  await manager.waitForDeployment();

  const DepositNFT = await ethers.getContractFactory("DepositNFT");
  const nft = await DepositNFT.deploy(
    "Fixed Deposit Position",
    "FDP",
    await access.getAddress(),
    await manager.getAddress()
  );
  await nft.waitForDeployment();

  // Set real NFT contract on manager after deployment.
  await (await manager.setDepositNFT(await nft.getAddress())).wait();
  await (await manager.setInterestModel(await interestModel.getAddress())).wait();
  await (await manager.setTreasury(await treasury.getAddress())).wait();

  // Grant manager role to DepositManager for treasury accounting hooks.
  await (await access.grantRole(await access.MANAGER_ROLE(), await manager.getAddress())).wait();

  // Wire DepositNFT manager if needed.
  await (await nft.setManager(await manager.getAddress())).wait();

  // Configure default lock periods.
  await (await interestModel.setRateBps(ethers.ZeroAddress, 30 * 24 * 60 * 60, 500)).wait();
  await (await interestModel.setRateBps(ethers.ZeroAddress, 90 * 24 * 60 * 60, 800)).wait();
  await (await interestModel.setRateBps(ethers.ZeroAddress, 180 * 24 * 60 * 60, 1200)).wait();

  console.log("\nDeployed Contracts:");
  console.log(`AccessController : ${await access.getAddress()}`);
  console.log(`InterestModel    : ${await interestModel.getAddress()}`);
  console.log(`Treasury         : ${await treasury.getAddress()}`);
  console.log(`DepositNFT       : ${await nft.getAddress()}`);
  console.log(`DepositManager   : ${await manager.getAddress()}`);

  const seedAmount = network.chainId === 31337n ? ethers.parseEther("1") : ethers.parseEther("0.1");
  await deployer.sendTransaction({ to: await treasury.getAddress(), value: seedAmount });
  console.log(`Treasury seeded  : ${ethers.formatEther(seedAmount)} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
