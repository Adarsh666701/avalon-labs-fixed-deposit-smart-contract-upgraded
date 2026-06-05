# Fixed Deposit Protocol — Production-Grade DeFi Platform

A comprehensive decentralized fixed deposit protocol with NFT-based positions, transferable ownership, dynamic interest rates, treasury management, role-based access control, UUPS upgradeability, and a user portfolio dashboard.

---

## Features Overview

### 1. NFT-Based Fixed Deposits
- Each fixed deposit mints an ERC-721 NFT representing ownership
- NFT holder can redeem the deposit upon maturity
- OpenZeppelin ERC-721 implementation

### 2. Transferable Deposit Ownership
- Fixed deposits can be transferred between wallets via NFT transfers
- Ownership of funds automatically follows NFT ownership
- Supports multi-hop transfers

### 3. Dynamic Interest Rate Engine
- Configurable per-asset and per-duration interest rates
- Interest rates adjustable by governance/admin
- Historical deposits preserve their original rates at creation time
- Supports up to 50% APR maximum

### 4. Early Withdrawal with Penalty
- Optional premature withdrawals allowed before maturity
- Configurable penalty percentages per asset
- Penalties redirected to protocol treasury as surplus reserves
- Penalties retained as treasury profit (do not go to protocol)

### 5. Treasury Management System
- Reserve pool responsible for funding interest payouts
- Tracks liabilities (total promised payouts)
- Calculates available surplus (balance - liabilities)
- Pausable emergency shutdown capability
- Role-based payout and surplus withdrawal controls

### 6. Multi-Asset Support
- Supports ETH (native currency)
- Supports any ERC-20 token (USDC, DAI, custom tokens)
- Per-asset configuration for min deposits, penalties, withdrawal limits

### 7. Role-Based Access Control
- **ADMIN_ROLE**: Full system control
- **TREASURY_MANAGER_ROLE**: Treasury surplus withdrawals
- **AUDITOR_ROLE**: Read-only audit access
- **PAUSER_ROLE**: Emergency pause/unpause
- **UPGRADER_ROLE**: Contract upgrades
- **MANAGER_ROLE**: Internal deposit/payout lifecycle
- **RATE_SETTER_ROLE**: Interest rate configuration
- Uses OpenZeppelin AccessControl

### 8. Upgradeable Contract Architecture
- UUPS (Universal Upgradeable Proxy Standard) for DepositManager
- Transparent design allows future improvements
- Authorized upgrades only via UPGRADER_ROLE

### 9. Security Hardening
- Reentrancy guards on all state-modifying functions
- Pausable emergency shutdown mechanism
- Comprehensive access control restrictions
- Withdrawal rate limits per time window
- Treasury reserve protection (can't overdraft)
- Checks-Effects-Interactions ordering

### 10. User Portfolio Dashboard
- View active positions with principal, interest, maturity dates
- Track deposit history including withdrawn positions
- Aggregated portfolio summary (total locked, accrued interest, claimable)
- Real-time claimable amount calculations
- Time until maturity countdown
- Early withdrawal payout estimates

---

## Contract Architecture

```
contracts/
├── DepositManager.sol           ← UUPS Upgradeable Core Manager
├── DepositNFT.sol               ← ERC-721 Position Tokens
├── InterestModel.sol            ← Dynamic Rate Engine
├── Treasury.sol                 ← Reserve & Liability Management
├── AccessController.sol         ← Role-Based Access Control
├── interfaces/
│   ├── IDepositNFT.sol
│   ├── IInterestModel.sol
│   └── ITreasury.sol
├── libraries/
│   └── InterestMath.sol         ← Interest Calculation Utils
└── mocks/
    └── MockERC20.sol            ← Test Token
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run comprehensive test suite (43 tests)
npm test

# Deploy locally
npx hardhat run scripts/deploy.js

# Deploy to Sepolia testnet
PRIVATE_KEY=<key> npx hardhat run scripts/deploy.js --network sepolia
```

---

## Portfolio Dashboard API

### View Functions

#### `getUserActivePositions(user)`
Returns all non-withdrawn deposits for a user:
```solidity
struct PortfolioPosition {
    uint256 tokenId;
    address asset;
    uint256 principal;
    uint256 accruedInterest;
    uint256 expectedMaturityAmount;
    uint256 maturityTime;
    bool matured;
    bool withdrawn;
    uint256 claimableAmount;
}
```

#### `getUserDepositHistory(user)`
Returns all deposits (including withdrawn) for a user with full history tracking.

#### `getUserPortfolioSummary(user)`
Returns aggregated metrics:
```solidity
struct PortfolioSummary {
    uint256 totalActivePositions;
    uint256 totalPrincipalLocked;
    uint256 totalAccruedInterest;
    uint256 totalClaimable;
}
```

#### `getAccruedInterest(tokenId)`
Calculate interest earned on a specific deposit.

#### `getClaimableAmount(tokenId)`
Get currently claimable amount (principal - penalty if early, full + interest if matured).

#### `getTimeUntilMaturity(tokenId)`
Get seconds remaining until deposit matures (0 if already matured).

#### `expectedPayout(tokenId)`
Get full payout details: principal, interest, maturity payout.

---

## User Deposit Flows

### Deposit ETH
```javascript
const tokenId = await manager.depositETH(30 * DAY, {
  value: ethers.parseEther("1")
});
// Mints NFT at tokenId, tracks in user's portfolio
```

### Deposit ERC-20 Token
```javascript
await usdc.approve(manager.address, amount);
const tokenId = await manager.depositToken(usdc.address, amount, 90 * DAY);
```

### View Portfolio
```javascript
const positions = await manager.getUserActivePositions(userAddress);
const summary = await manager.getUserPortfolioSummary(userAddress);

// Check specific deposit
const claimable = await manager.getClaimableAmount(tokenId);
const timeLeft = await manager.getTimeUntilMaturity(tokenId);
```

### Redeem Deposit
```javascript
// After maturity or with early penalty
await manager.redeem(tokenId);
// Burns NFT, transfers funds to owner
```

### Transfer Ownership
```javascript
// Transfer NFT to new owner
await nft.transferFrom(userAddress, newUserAddress, tokenId);
// New owner can now redeem
```

---

## Test Coverage

### Total: 43 Comprehensive Tests

#### Core Functionality (3 tests)
- ✅ NFT minting and transferability
- ✅ Early withdrawal with penalty
- ✅ ERC20 multi-asset deposits

#### Edge Cases & Invalid Inputs (7 tests)
- ✅ Zero amount deposits rejected
- ✅ Below minimum deposit rejected
- ✅ Invalid lock durations rejected
- ✅ Invalid asset addresses rejected
- ✅ Non-existent deposit redemption rejected
- ✅ Double redemption prevented
- ✅ Expired withdrawal prevention

#### Permission Violations (7 tests)
- ✅ Non-owner cannot redeem NFT
- ✅ Non-admin cannot update settings
- ✅ Non-admin cannot control pause
- ✅ Non-admin cannot modify rates
- ✅ All role restrictions enforced

#### Treasury Insolvency Scenarios (2 tests)
- ✅ Treasury liability tracking
- ✅ Insufficient fund handling

#### Early Withdrawal Scenarios (3 tests)
- ✅ Penalty calculation and application
- ✅ Disabled early withdrawal enforcement
- ✅ Penalty retention as surplus

#### NFT Transfers & Ownership (3 tests)
- ✅ Single and multiple transfers
- ✅ Ownership tracking
- ✅ Invalid address rejection

#### Multi-User Simulations (3 tests)
- ✅ Concurrent deposits
- ✅ Concurrent redemptions
- ✅ Multi-deposit portfolio tracking

#### Portfolio Dashboard Functions (11 tests)
- ✅ Empty portfolio handling
- ✅ Active positions listing
- ✅ Interest accrual calculations
- ✅ Portfolio summary aggregation
- ✅ Claimable amount calculations
- ✅ Maturity date tracking
- ✅ Deposit history with withdrawn status
- ✅ Time until maturity countdown
- ✅ Early withdrawal estimates

#### Withdrawal Rate Limiting (1 test)
- ✅ Per-window rate limit enforcement

#### Pause & Unpause (3 tests)
- ✅ Pause deposit/redemption blocking
- ✅ Resume operations after unpause

---

## Security Features

| Feature | Implementation |
|---------|-----------------|
| Reentrancy Protection | ReentrancyGuard on deposit/redeem |
| Access Control | OpenZeppelin AccessControl with 7 roles |
| State Safety | CEI pattern (checks-effects-interactions) |
| Emergency Shutdown | Pausable mechanism |
| Treasury Solvency | Liability tracking + surplus calculation |
| Rate Limits | Per-asset withdrawal windows |
| Upgrade Safety | UUPS with authorized upgrader only |
| ERC20 Safety | SafeERC20 for token transfers |

---

## Deployment

### Local Network
```bash
npx hardhat run scripts/deploy.js
```
Deploys: AccessController, InterestModel, Treasury, DepositNFT, DepositManager (UUPS proxy)

### Configuration
After deployment, admin must:
1. Set interest rates per asset/duration via InterestModel
2. Set minimum deposits per asset
3. Configure early withdrawal penalties
4. Set withdrawal rate limits (optional)
5. Fund treasury with initial reserves

---

## Example Transaction Flow

```javascript
// 1. User deposits 1 ETH for 30 days
const tx1 = await manager.connect(user).depositETH(30 * DAY, {
  value: ethers.parseEther("1")
});
const receipt1 = await tx1.wait();
const tokenId = 1; // NFT minted

// 2. User can view portfolio
const positions = await manager.getUserActivePositions(user.address);
console.log(positions[0]); // Shows principal, interest, maturity date, etc

// 3. User transfers NFT to another wallet
await nft.connect(user).transferFrom(user.address, newOwner.address, tokenId);

// 4. New owner views their portfolio
const newOwnerPositions = await manager.getUserActivePositions(newOwner.address);

// 5. After 30 days, new owner redeems
await time.increase(30 * DAY);
await manager.connect(newOwner).redeem(tokenId);
// Receives: 1 ETH principal + accrued interest
// NFT burned
```

---

## Parameters & Constants

| Parameter | Value | Adjustable |
|-----------|-------|-----------|
| MIN_DEPOSIT (ETH) | 0.01 ETH | ✅ Per admin |
| MAX_RATE_BPS | 50% | ✅ Per admin |
| EARLY_PENALTY (ETH) | 3% | ✅ Per admin |
| WITHDRAWAL_WINDOW | 1 day | ✅ Per admin |
| BASIS_POINTS | 10,000 | ❌ Fixed |

---

## Governance & Admin Functions

### Interest Rate Management
```javascript
await interestModel.setRateBps(asset, lockDuration, aprBps);
```

### Deposit Parameters
```javascript
await manager.setMinDeposit(asset, minAmount);
await manager.setEarlyWithdrawalPenalty(asset, penaltyBps);
await manager.setWithdrawalLimit(asset, limitBps, windowDuration);
```

### Emergency Controls
```javascript
await manager.pause();    // Stop all deposits/redemptions
await manager.unpause();  // Resume normal operation
```

### Upgrades (UUPS)
```javascript
const newImplementation = await upgrades.prepareUpgrade(proxyAddress, NewManager);
await manager.upgradeTo(newImplementation);
```



