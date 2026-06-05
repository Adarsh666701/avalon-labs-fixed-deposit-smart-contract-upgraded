# Frontend - Fixed Deposit Portfolio Dashboard

A modern React/Next.js frontend for the Fixed Deposit Protocol with real-time portfolio tracking, deposit management, and Web3 wallet integration.

## Features

### 🎨 User Interface
- Clean, responsive dashboard with Tailwind CSS
- Real-time portfolio statistics
- Active positions and deposit history tabs
- Position cards with detailed information
- Wallet connection/disconnection

### 💼 Portfolio Management
- **Active Positions**: View all non-withdrawn deposits
- **Deposit History**: Complete transaction history
- **Portfolio Stats**: Summary of all positions
- **Claimable Amounts**: Real-time calculation
- **Maturity Tracking**: Time remaining until withdrawal

### 🔗 Web3 Integration
- MetaMask wallet connection
- Auto-detect network and account changes
- Read-only contract interactions (no gas fees for viewing)
- Real-time balance fetching

### 📊 Position Information
Each position displays:
- Token ID and asset type (ETH/ERC-20)
- Principal amount locked
- Accrued interest earned
- Maturity date and time remaining
- Claimable amount
- Current status (Active/Ready to Claim/Claimed)

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- MetaMask or compatible Web3 wallet
- Hardhat backend running locally or Sepolia testnet access

### Installation

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
# Update .env.local with your contract addresses
```

4. Update contract addresses in `src/constants/contracts.ts`:
```typescript
export const CONTRACT_ADDRESSES = {
  LOCALHOST: {
    DepositManager: '0x...',
    // Update with your deployed addresses
  },
};
```

### Running the Dashboard

Development mode:
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

Production build:
```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main dashboard page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── Layout.tsx        # Page layout wrapper
│   │   ├── Header.tsx        # Dashboard header
│   │   ├── WalletConnect.tsx # Wallet connection button
│   │   ├── Tabs.tsx          # Tab navigation
│   │   ├── PortfolioStats.tsx # Summary statistics
│   │   ├── PositionCard.tsx  # Individual position card
│   │   └── PositionsGrid.tsx # Grid of positions
│   ├── hooks/
│   │   └── usePortfolio.ts   # Custom React hooks
│   ├── utils/
│   │   ├── formatting.ts     # Display formatting utilities
│   │   └── contracts.ts      # Contract interaction
│   └── constants/
│       ├── contracts.ts      # Contract addresses
│       └── abis.ts           # Contract ABIs
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Key Components

### WalletConnect
Handles wallet connection/disconnection with MetaMask.

**Props:**
- None (uses context)

**Features:**
- Auto-connect detection
- Network detection
- Connection status display

### PortfolioStats
Displays aggregated portfolio metrics in stat cards.

**Props:**
- `summary: PortfolioSummary | null`
- `loading: boolean`

**Stats:**
- Total active positions
- Principal locked
- Accrued interest
- Total claimable

### PositionCard
Individual deposit position with details and actions.

**Props:**
- `position: PortfolioPosition`
- `onRedeem?: (tokenId: bigint) => void`
- `redeemLoading?: boolean`

**Displays:**
- Principal and interest
- Maturity date and time remaining
- Claimable amount
- Redeem button (if matured)

### PositionsGrid
Grid layout for multiple position cards.

**Props:**
- `positions: PortfolioPosition[]`
- `loading: boolean`
- `title: string`
- `onRedeem?: (tokenId: bigint) => void`

## Custom Hooks

### usePortfolio
Fetches and manages portfolio data.

```typescript
const {
  activePositions,
  depositHistory,
  summary,
  loading,
  error,
  refetch
} = usePortfolio(userAddress, chainId);
```

### useWalletConnection
Manages wallet connection state.

```typescript
const {
  address,
  connected,
  chainId,
  connect,
  disconnect
} = useWalletConnection();
```

## Utility Functions

### Formatting Utilities (`src/utils/formatting.ts`)
- `formatETH(wei)` - Convert wei to readable ETH
- `formatNumber(num)` - Format large numbers
- `formatTimestamp(ts)` - Format Unix timestamp
- `calculateAPR(bps)` - Convert basis points to percentage
- `truncateAddress(addr)` - Shorten address for display
- `daysRemaining(seconds)` - Calculate days until maturity

### Contract Utilities (`src/utils/contracts.ts`)
- `getProvider(chainId)` - Get ethers provider
- `getDepositManagerContract(chainId)` - Get contract instance
- `fetchActivePositions(address, chainId)` - Get active positions
- `fetchDepositHistory(address, chainId)` - Get all deposits
- `fetchPortfolioSummary(address, chainId)` - Get summary stats
- `getClaimableAmount(tokenId, chainId)` - Calculate claimable
- `getTimeUntilMaturity(tokenId, chainId)` - Get time remaining

## Configuration

### Network Configuration
Update `src/constants/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  SEPOLIA: {
    DepositManager: '0x...',
    DepositNFT: '0x...',
    // ... other addresses
  },
  LOCALHOST: {
    // Local deployment addresses
  },
};
```

### RPC Endpoints
Configured in `src/constants/contracts.ts`:
- Sepolia: Unifra public RPC
- Localhost: http://127.0.0.1:8545

## Frontend to Backend Integration

### Current Implementation (Read-Only)
The frontend currently supports:
- ✅ Viewing portfolio positions
- ✅ Checking deposit history
- ✅ Calculating accrued interest
- ✅ Determining maturity status
- ✅ Wallet connection

### To Enable Redemptions
Implement the redeem flow in `src/app/page.tsx`:

```typescript
const handleRedeem = async (tokenId: bigint) => {
  // 1. Create signer from provider
  const signer = await provider.getSigner();
  
  // 2. Get manager contract with signer
  const manager = new ethers.Contract(
    DEPOSIT_MANAGER,
    DEPOSIT_MANAGER_ABI,
    signer
  );
  
  // 3. Call redeem
  const tx = await manager.redeem(tokenId);
  await tx.wait();
  
  // 4. Refresh portfolio
  await refetch();
};
```

## Styling

### Tailwind CSS
All components use Tailwind CSS with custom configuration:
- Primary color: Blue (#6366f1)
- Secondary color: Purple (#8b5cf6)
- Success color: Green (#10b981)
- Warning color: Amber (#f59e0b)
- Danger color: Red (#ef4444)

### CSS Classes
Global utility classes in `src/app/globals.css`:
- `.btn`, `.btn-primary`, `.btn-secondary`, etc.
- `.card`, `.card-hover`
- Text color utilities

## Debugging

### Console Logs
All hooks and utilities include detailed console logging for debugging.

### Toast Notifications
Using `react-hot-toast` for user feedback:
```typescript
import toast from 'react-hot-toast';

toast.success('Success message');
toast.error('Error message');
```

## Performance Optimizations

- **Auto-refresh**: Portfolio data refreshes every 30 seconds
- **Skeleton loading**: Loading states with skeleton screens
- **Lazy loading**: Components load on demand
- **Memoization**: useCallback for event handlers

## Browser Support

- Chrome/Edge: Latest versions
- Firefox: Latest versions
- Safari: Latest versions
- Requires Web3 wallet (MetaMask, etc.)

## Troubleshooting

### Wallet Not Connecting
- Ensure MetaMask is installed
- Check network is set to Localhost or Sepolia
- Try disconnecting and reconnecting

### No Positions Showing
- Verify connected address owns deposits
- Check contract addresses in `.env.local`
- Ensure hardhat node is running (for localhost)
- Check browser console for errors

### Data Not Updating
- Click "Refresh" button
- Check network connection
- Verify RPC endpoint is accessible
- Check contract addresses are correct

## Future Enhancements

- [ ] Redemption functionality with transaction signing
- [ ] Deposit creation UI
- [ ] Portfolio charts and analytics
- [ ] Deposit NFT transfer UI
- [ ] Transaction history
- [ ] Multi-chain support
- [ ] Dark mode theme
- [ ] Mobile optimization

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify contract addresses and network configuration
3. Ensure wallet is connected to correct network
4. Check backend hardhat node is running

---

**Built with Next.js, React, ethers.js, and Tailwind CSS**
