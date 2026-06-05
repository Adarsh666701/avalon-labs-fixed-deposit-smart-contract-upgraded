import { DEPOSIT_MANAGER_ABI, ERC20_ABI } from '@/constants/abis';
import { CONTRACT_ADDRESSES, RPC_URLS } from '@/constants/contracts';
import { ethers } from 'ethers';

export interface PortfolioPosition {
  tokenId: bigint;
  asset: string;
  principal: bigint;
  accruedInterest: bigint;
  expectedMaturityAmount: bigint;
  maturityTime: bigint;
  matured: boolean;
  withdrawn: boolean;
  claimableAmount: bigint;
}

export interface PortfolioSummary {
  totalActivePositions: bigint;
  totalPrincipalLocked: bigint;
  totalAccruedInterest: bigint;
  totalClaimable: bigint;
}

/**
 * Get contract provider
 */
export const getProvider = (chainId: number = 31337) => {
  const rpcUrl = chainId === 11155111 ? RPC_URLS.SEPOLIA : RPC_URLS.LOCALHOST;
  return new ethers.JsonRpcProvider(rpcUrl);
};

/**
 * Get DepositManager contract instance
 */
export const getDepositManagerContract = (chainId: number = 31337) => {
  const provider = getProvider(chainId);
  const address = chainId === 11155111 
    ? CONTRACT_ADDRESSES.SEPOLIA.DepositManager 
    : CONTRACT_ADDRESSES.LOCALHOST.DepositManager;
  return new ethers.Contract(address, DEPOSIT_MANAGER_ABI, provider);
};

/**
 * Fetch active positions for user
 */
export const fetchActivePositions = async (
  userAddress: string,
  chainId: number = 31337
): Promise<PortfolioPosition[]> => {
  const contract = getDepositManagerContract(chainId);
  try {
    const positions = await contract.getUserActivePositions(userAddress);
    return positions.map((p: any) => ({
      tokenId: BigInt(p.tokenId.toString()),
      asset: p.asset,
      principal: BigInt(p.principal.toString()),
      accruedInterest: BigInt(p.accruedInterest.toString()),
      expectedMaturityAmount: BigInt(p.expectedMaturityAmount.toString()),
      maturityTime: BigInt(p.maturityTime.toString()),
      matured: p.matured,
      withdrawn: p.withdrawn,
      claimableAmount: BigInt(p.claimableAmount.toString()),
    }));
  } catch (error) {
    console.error('Error fetching active positions:', error);
    return [];
  }
};

/**
 * Fetch deposit history for user
 */
export const fetchDepositHistory = async (
  userAddress: string,
  chainId: number = 31337
): Promise<PortfolioPosition[]> => {
  const contract = getDepositManagerContract(chainId);
  try {
    const positions = await contract.getUserDepositHistory(userAddress);
    return positions.map((p: any) => ({
      tokenId: BigInt(p.tokenId.toString()),
      asset: p.asset,
      principal: BigInt(p.principal.toString()),
      accruedInterest: BigInt(p.accruedInterest.toString()),
      expectedMaturityAmount: BigInt(p.expectedMaturityAmount.toString()),
      maturityTime: BigInt(p.maturityTime.toString()),
      matured: p.matured,
      withdrawn: p.withdrawn,
      claimableAmount: BigInt(p.claimableAmount.toString()),
    }));
  } catch (error) {
    console.error('Error fetching deposit history:', error);
    return [];
  }
};

/**
 * Fetch portfolio summary for user
 */
export const fetchPortfolioSummary = async (
  userAddress: string,
  chainId: number = 31337
): Promise<PortfolioSummary | null> => {
  const contract = getDepositManagerContract(chainId);
  try {
    const summary = await contract.getUserPortfolioSummary(userAddress);
    return {
      totalActivePositions: BigInt(summary.totalActivePositions.toString()),
      totalPrincipalLocked: BigInt(summary.totalPrincipalLocked.toString()),
      totalAccruedInterest: BigInt(summary.totalAccruedInterest.toString()),
      totalClaimable: BigInt(summary.totalClaimable.toString()),
    };
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return null;
  }
};

/**
 * Get claimable amount for a specific deposit
 */
export const getClaimableAmount = async (
  tokenId: number,
  chainId: number = 31337
): Promise<bigint> => {
  const contract = getDepositManagerContract(chainId);
  try {
    const amount = await contract.getClaimableAmount(tokenId);
    return BigInt(amount.toString());
  } catch (error) {
    console.error('Error fetching claimable amount:', error);
    return BigInt(0);
  }
};

/**
 * Get time remaining until maturity
 */
export const getTimeUntilMaturity = async (
  tokenId: number,
  chainId: number = 31337
): Promise<bigint> => {
  const contract = getDepositManagerContract(chainId);
  try {
    const time = await contract.getTimeUntilMaturity(tokenId);
    return BigInt(time.toString());
  } catch (error) {
    console.error('Error fetching time until maturity:', error);
    return BigInt(0);
  }
};

/**
 * Get ERC20 balance
 */
export const getTokenBalance = async (
  tokenAddress: string,
  userAddress: string,
  chainId: number = 31337
): Promise<bigint> => {
  const provider = getProvider(chainId);
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  try {
    const balance = await contract.balanceOf(userAddress);
    return BigInt(balance.toString());
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return BigInt(0);
  }
};

/**
 * Get ETH balance
 */
export const getETHBalance = async (userAddress: string, chainId: number = 31337): Promise<bigint> => {
  const provider = getProvider(chainId);
  try {
    const balance = await provider.getBalance(userAddress);
    return BigInt(balance.toString());
  } catch (error) {
    console.error('Error fetching ETH balance:', error);
    return BigInt(0);
  }
};
