# Fixed Deposit Protocol - Complete Documentation

## 📁 Project Structure

```
fixed-deposit-protocol/
├── contracts/                  # Smart contracts
│   ├── DepositManager.sol     # UUPS upgradeable manager
│   ├── DepositNFT.sol         # ERC-721 position tokens
│   ├── InterestModel.sol      # Dynamic rate engine
│   ├── Treasury.sol           # Reserve management
│   ├── AccessController.sol   # Role-based access
│   ├── interfaces/            # Contract interfaces
│   ├── libraries/             # Utility libraries
│   └── mocks/                 # Test tokens
├── test/                      # Comprehensive test suite (43 tests)
├── scripts/
│   └── deploy.js             # Deployment script
├── frontend/                  # Next.js portfolio dashboard
│   ├── src/
│   │   ├── app/              # Pages and layout
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utility functions
│   │   └── constants/        # Configuration
│   └── README.md             # Frontend documentation
├── package.json
├── hardhat.config.js
└── README.md
```

## 🚀 Quick Start

### Backend Setup (Hardhat)

1. **Install dependencies:**
```bash
npm install
```

2. **Compile contracts:**
```bash
npm run compile
```

3. **Run local hardhat node:**
```bash
npx hardhat node
```

4. **In another terminal, deploy:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

5. **Run tests:**
```bash
npm test
```

### Frontend Setup (Next.js)

1. **Navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.local.example .env.local
# Update with contract addresses from deployment
```

4. **Start development server:**
```bash
npm run dev
```

5. **Visit dashboard:**
Open http://localhost:3000

---

## 📊 Smart Contract Architecture

### Core Contracts

| Contract | Purpose | Status |
|----------|---------|--------|
| DepositManager | Central protocol hub, UUPS upgradeable | ✅ Deployed |
| DepositNFT | ERC-721 position tokens | ✅ Deployed |
| InterestModel | Dynamic APR configuration | ✅ Deployed |
| Treasury | Reserve & liability tracking | ✅ Deployed |
| AccessController | Role-based access control | ✅ Deployed |

### Key Features Implemented

- ✅ **NFT-Based Deposits**: Each deposit = unique ERC-721 token
- ✅ **Transferable Ownership**: Trade positions between wallets
- ✅ **Dynamic Interest Rates**: Configurable per-asset, per-duration
- ✅ **Early Withdrawal Penalties**: Redirect to treasury as profit
- ✅ **Treasury Management**: Liability tracking + surplus calculation
- ✅ **Multi-Asset Support**: ETH + any ERC-20 token
- ✅ **RBAC**: 7 roles for granular access control
- ✅ **Upgradeable**: UUPS proxy pattern for future improvements
- ✅ **Security Hardening**: Reentrancy guards, pause mechanism

### Contract Interactions

```
User
  ↓
DepositManager
  ├→ DepositNFT (mint/burn positions)
  ├→ InterestModel (get rates)
  └→ Treasury (track liabilities, payout funds)
```

---

## 📱 Frontend Features

### Dashboard Views

1. **Portfolio Stats** - Summary metrics
   - Total active positions
   - Principal locked
   - Accrued interest
   - Claimable amount

2. **Active Positions** - Current deposits
   - Principal and interest
   - Maturity date & time remaining
   - Status badge (Active/Ready/Claimed)
   - One-click redeem button

3. **Deposit History** - Complete transaction history
   - All deposits (active & withdrawn)
   - Historical rates and amounts
   - Redemption status tracking

### User Experience

- **Wallet Integration**: MetaMask auto-detection
- **Real-Time Updates**: 30-second auto-refresh
- **Responsive Design**: Mobile-optimized UI
- **Toast Notifications**: Instant user feedback
- **Loading States**: Skeleton screens during data fetch

---

## 🧪 Testing

### Test Coverage: 43 Tests

#### Categories:
- **Core Functionality** (3 tests)
  - NFT minting & transfer
  - Early withdrawal penalties
  - Multi-asset deposits

- **Edge Cases** (7 tests)
  - Invalid inputs validation
  - Below minimum deposits
  - Non-existent deposits

- **Permission Violations** (7 tests)
  - Access control enforcement
  - Role-based restrictions
  - Admin-only operations

- **Treasury Scenarios** (2 tests)
  - Liability tracking
  - Insolvency handling

- **Early Withdrawals** (3 tests)
  - Penalty calculation
  - Surplus retention
  - Disabled withdrawals

- **NFT Transfers** (3 tests)
  - Single & multi transfers
  - Ownership verification

- **Multi-User** (3 tests)
  - Concurrent deposits
  - Concurrent redemptions

- **Portfolio Dashboard** (11 tests)
  - Position listing
  - Interest calculations
  - Maturity tracking
  - History records

- **Pause/Rate Limits** (4 tests)
  - Emergency shutdown
  - Withdrawal windows

### Run Tests

```bash
npm test

# Output: 43 passing (7s)
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|-----------------|
| **Reentrancy** | ReentrancyGuard on all state changes |
| **Access Control** | OpenZeppelin AccessControl (7 roles) |
| **State Safety** | Checks-Effects-Interactions pattern |
| **Emergency Pause** | Pausable mechanism for shutdowns |
| **Treasury Solvency** | Liability tracking prevents overdrafts |
| **Rate Limits** | Per-asset withdrawal windows |
| **Upgrade Safety** | UUPS with authorized upgrader only |
| **Token Safety** | SafeERC20 for all transfers |

---

## 💼 API Reference

### Deposit Functions

#### `depositETH(uint256 lockDuration) → uint256 tokenId`
Deposit ETH for fixed term
```solidity
uint tokenId = manager.depositETH(30 * 24 * 60 * 60); // 30 days
```

#### `depositToken(address asset, uint256 amount, uint256 lockDuration) → uint256`
Deposit ERC-20 token
```solidity
uint tokenId = manager.depositToken(usdc, 1000e6, 90 * 24 * 60 * 60);
```

### Portfolio View Functions

#### `getUserActivePositions(address user) → PortfolioPosition[]`
Get all active deposits for user
```javascript
const positions = await manager.getUserActivePositions(userAddress);
// Returns: [{ tokenId, asset, principal, interest, matured, ... }]
```

#### `getUserDepositHistory(address user) → PortfolioPosition[]`
Get complete deposit history
```javascript
const history = await manager.getUserDepositHistory(userAddress);
```

#### `getUserPortfolioSummary(address user) → PortfolioSummary`
Get aggregated metrics
```javascript
const summary = await manager.getUserPortfolioSummary(userAddress);
// Returns: { totalPositions, principalLocked, accruedInterest, claimable }
```

#### `getClaimableAmount(uint256 tokenId) → uint256`
Get currently claimable amount
```javascript
const amount = await manager.getClaimableAmount(tokenId);
```

#### `getTimeUntilMaturity(uint256 tokenId) → uint256`
Get seconds remaining until maturity
```javascript
const seconds = await manager.getTimeUntilMaturity(tokenId);
```

### Redemption

#### `redeem(uint256 tokenId)`
Claim mature deposit or withdraw with penalty
```solidity
manager.redeem(tokenId); // Burns NFT, transfers funds
```

---

## 🎯 Configuration

### Lock Durations & Rates

```
Default ETH Rates:
├─ 30 days  → 5% APR
├─ 90 days  → 8% APR
└─ 180 days → 12% APR
```

### Early Withdrawal

```
Default ETH:
├─ Penalty: 3% of principal
└─ Redirected to treasury surplus
```

### Admin Functions

```
setMinDeposit(asset, amount)
setEarlyWithdrawalPenalty(asset, penaltyBps)
setWithdrawalLimit(asset, limitBps, windowDuration)
setInterestModel(newModel)
setTreasury(newTreasury)
pause() / unpause()
```

---

## 🌐 Network Configuration

### Sepolia Testnet
- RPC: https://eth-sepolia-public.unifra.io
- Chain ID: 11155111
- Update contract addresses in `constants/contracts.ts`

### Localhost
- RPC: http://127.0.0.1:8545
- Chain ID: 31337
- Deployed addresses shown in deploy script

---

## 📈 Frontend Components

### PortfolioStats
Displays 4 key metrics in card layout
```tsx
<PortfolioStats summary={summary} loading={loading} />
```

### PositionCard
Individual position with redeem action
```tsx
<PositionCard 
  position={position} 
  onRedeem={handleRedeem}
  redeemLoading={redeemLoading}
/>
```

### PositionsGrid
Grid of position cards
```tsx
<PositionsGrid 
  positions={positions}
  loading={loading}
  title="Active Positions"
  onRedeem={handleRedeem}
/>
```

### WalletConnect
Connect/disconnect wallet
```tsx
<WalletConnect />
```

---

## 🛠️ Development

### Add New Feature

1. Update smart contract in `contracts/`
2. Update ABI in `frontend/src/constants/abis.ts`
3. Add utility function in `frontend/src/utils/contracts.ts`
4. Create/update component in `frontend/src/components/`
5. Add tests in `test/`

### Deploy New Version

```bash
# 1. Compile
npm run compile

# 2. Deploy
npx hardhat run scripts/deploy.js --network <network>

# 3. Update frontend addresses
# Edit frontend/.env.local

# 4. Redeploy frontend
cd frontend && npm run build
```

---

## 🐛 Troubleshooting

### Contracts Won't Compile
```bash
# Clear cache
npx hardhat clean
npm run compile
```

### Tests Failing
```bash
# Check hardhat node running
npx hardhat node

# In another terminal
npm test
```

### Frontend Shows "No Positions"
1. Verify wallet is connected
2. Check contract addresses in `.env.local`
3. Confirm connected account owns deposits
4. Check browser console for errors

### Wallet Won't Connect
1. Install MetaMask extension
2. Set network to Localhost or Sepolia
3. Refresh page
4. Try disconnect/reconnect

---

## 📚 Resources

### Smart Contracts
- [Solidity Docs](https://docs.soliditylang.org)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [UUPS Proxy Pattern](https://eips.ethereum.org/EIPS/eip-1822)

### Frontend
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [ethers.js Docs](https://docs.ethers.org)
- [Tailwind CSS](https://tailwindcss.com)

### Testing
- [Hardhat Docs](https://hardhat.org/docs)
- [Chai Assertion Library](https://www.chaijs.com)
- [OpenZeppelin Test Helpers](https://docs.openzeppelin.com/test-helpers)

---

## 📄 License

MIT License © Avalon Labs

---

## 🎓 Next Steps

### For Production Deployment

1. **Security Audit**
   - Professional smart contract audit (recommended)
   - Frontend security review
   - Penetration testing

2. **Mainnet Preparation**
   - Deploy to Ethereum mainnet
   - Setup monitoring & alerting
   - Configure governance (optional timelock)

3. **Advanced Features**
   - Yield farming integration
   - Liquidity mining rewards
   - NFT marketplace
   - Cross-chain bridges

4. **Analytics**
   - On-chain analytics dashboard
   - User statistics
   - Protocol metrics

---

## 💬 Support

For questions or issues:
1. Check documentation above
2. Review test cases for usage examples
3. Check browser console for error messages
4. Verify contract addresses and network settings

**Happy depositing! 🚀**
