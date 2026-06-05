# Frontend Quick Start Guide

## Installation (5 minutes)

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Copy environment template
```bash
cp .env.local.example .env.local
```

### 4. Update contract addresses
Edit `src/constants/contracts.ts` and add your deployed addresses:
```typescript
export const CONTRACT_ADDRESSES = {
  LOCALHOST: {
    DepositManager: '0x...',      // From hardhat deploy
    DepositNFT: '0x...',
    InterestModel: '0x...',
    Treasury: '0x...',
    AccessController: '0x...',
  },
};
```

### 5. Start development server
```bash
npm run dev
```

### 6. Open in browser
Visit **http://localhost:3000**

---

## First Time Setup

### Backend Required
1. Start Hardhat node: `npx hardhat node` (from root directory)
2. Deploy contracts: `npx hardhat run scripts/deploy.js`
3. Copy contract addresses from deployment output

### Frontend Ready
1. Install dependencies: `npm install` (in frontend/)
2. Update addresses in `src/constants/contracts.ts`
3. Start dev server: `npm run dev`
4. Connect MetaMask to Localhost (127.0.0.1:8545)

---

## Dashboard Walkthrough

### Step 1: Connect Wallet
1. Click "Connect Wallet" button (top right)
2. Select MetaMask in popup
3. Approve connection in MetaMask
4. Your wallet address appears in header

### Step 2: View Portfolio
- **Portfolio Stats**: Shows total deposits, interest, claimable
- **Active Positions**: Lists your current deposits
- **Deposit History**: Shows all past deposits

### Step 3: Understand Position Card
Each card shows:
- 💰 **Principal**: Amount you deposited
- 📈 **Accrued Interest**: Interest earned so far
- 📅 **Maturity Date**: When you can withdraw
- ⏱️ **Time Remaining**: Days until maturity
- ✅ **Claimable Amount**: Total you can withdraw

### Step 4: Claim Mature Deposit
1. Find position with "Ready to Claim" badge
2. Click "Claim Deposit" button
3. Approve in MetaMask
4. Wait for transaction confirmation
5. Funds arrive in wallet

---

## Common Tasks

### View Active Deposits
1. Click "Active Positions" tab
2. See all current deposits
3. Check "Ready to Claim" for mature deposits

### See Deposit History
1. Click "Deposit History" tab
2. View all deposits (active and claimed)
3. See historical amounts and rates

### Check Total Interest
1. Look at "Accrued Interest" stat card
2. Shows total interest across all deposits
3. Updated in real-time

### Transfer Position
1. Positions are NFTs = can be transferred
2. Use MetaMask to send NFT to another wallet
3. New owner can redeem

---

## Troubleshooting

### "Connect Wallet" Button Doesn't Work
- ✅ Install MetaMask extension
- ✅ Refresh the page
- ✅ Check MetaMask is unlocked
- ✅ Try incognito mode

### Wallet Connected But No Positions Show
- ✅ Check you own deposits
- ✅ Verify chain is Localhost (31337)
- ✅ Check contract addresses are correct
- ✅ Try refresh button

### "No Positions Found"
- ✅ Create deposits first (via contract)
- ✅ Use correct wallet address
- ✅ Check backend is running
- ✅ Verify RPC endpoint

### Data Not Updating
- ✅ Click refresh button
- ✅ Check internet connection
- ✅ Verify hardhat node running
- ✅ Check browser console for errors

---

## Browser Extensions Needed

1. **MetaMask** - Web3 wallet
   - Install from metamask.io
   - Create account or import
   - Add Localhost network (optional)

2. Optional but helpful:
   - **React Developer Tools** - Debug components
   - **Redux DevTools** - State management (if added)

---

## Network Setup (Localhost)

### Add Localhost to MetaMask

1. Open MetaMask
2. Click network selector (top left)
3. Click "Add network"
4. Fill in:
   - **Name**: Localhost
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency**: ETH
5. Save and select

### Get Test ETH
When running local hardhat node:
- Each account gets 10,000 test ETH
- Use any account (they're pre-funded)
- No real money needed

---

## Using Multiple Wallets

### Scenario: Test NFT Transfer
1. Open two browser windows (or incognito)
2. Window 1: Connect wallet A (has deposits)
3. Window 2: Connect wallet B (empty)
4. Transfer NFT from A to B
5. Wallet B shows new position

### Switching Wallets in MetaMask
1. Click account selector (top right in MetaMask)
2. Select different account
3. Dashboard auto-updates
4. Reload if needed

---

## Performance Tips

### Faster Loading
- Keep hardhat node running
- Keep frontend dev server running
- Avoid refreshing unnecessarily

### Smooth Experience
- Click refresh button for latest data
- Allow 30 seconds for auto-refresh
- Check console (F12) if issues

---

## Next: Redemption Setup

### To Enable Claiming Deposits
(Currently shows "Ready to Claim" but button needs backend)

1. Edit `src/app/page.tsx`
2. Implement `handleRedeem` function:
   ```typescript
   const handleRedeem = async (tokenId: bigint) => {
     // 1. Get signer
     const signer = provider.getSigner();
     
     // 2. Get manager contract
     const manager = new ethers.Contract(
       DEPOSIT_MANAGER,
       DEPOSIT_MANAGER_ABI,
       signer
     );
     
     // 3. Send transaction
     const tx = await manager.redeem(tokenId);
     await tx.wait();
     
     // 4. Refresh
     await refetch();
   };
   ```

3. Test with mature deposit

---

## File Structure Quick Ref

```
Frontend Key Files:
├── src/app/page.tsx           ← Dashboard page
├── src/components/WalletConnect.tsx ← Wallet button
├── src/components/PositionCard.tsx  ← Position display
├── src/hooks/usePortfolio.ts        ← Data fetching
├── src/utils/contracts.ts           ← Web3 calls
└── src/constants/contracts.ts       ← Addresses
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm start                # Start prod server

# Linting
npm run lint             # Check code quality

# Cleanup
rm -rf .next node_modules
npm install              # Fresh install
```

---

## Getting Help

1. **Check Console** (F12 in browser)
   - Error messages are shown here
   - Network requests visible in Network tab

2. **Backend Issues**
   - Verify hardhat node running
   - Check RPC connection
   - Verify contract addresses

3. **MetaMask Issues**
   - Check wallet balance
   - Verify network selection
   - Try disconnect/reconnect

---

## You're Ready! 🎉

Your portfolio dashboard is now running!
- Dashboard: http://localhost:3000
- Backend: http://localhost:8545
- MetaMask: Connected to Localhost

**Next Step**: Create a test deposit and see it appear on the dashboard!

For detailed documentation, see [frontend/README.md](./README.md)
