// Update these with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  SEPOLIA: {
    DepositManager: '0x...',
    DepositNFT: '0x...',
    InterestModel: '0x...',
    Treasury: '0x...',
    AccessController: '0x...',
  },
  LOCALHOST: {
    DepositManager: '0x5FbDB2315678afccb333f8a9c6122f65d8d6b7d5e',
    DepositNFT: '0x9fE46736679d2D9a65F0dd4d1123c3D6e547b513',
    InterestModel: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    Treasury: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    AccessController: '0x0165878A594ca255338adfa4d0221Ac3F6c9C339',
  },
};

export const RPC_URLS = {
  SEPOLIA: 'https://eth-sepolia-public.unifra.io',
  LOCALHOST: 'http://127.0.0.1:8545',
};

export const CHAIN_IDS = {
  SEPOLIA: 11155111,
  LOCALHOST: 31337,
};

// Interest rate configuration (in basis points)
export const INTEREST_RATES = {
  ETH: {
    '30_DAYS': 500,   // 5%
    '90_DAYS': 800,   // 8%
    '180_DAYS': 1200, // 12%
  },
};

// Lock durations (in seconds)
export const LOCK_DURATIONS = {
  '30_DAYS': 30 * 24 * 60 * 60,
  '90_DAYS': 90 * 24 * 60 * 60,
  '180_DAYS': 180 * 24 * 60 * 60,
};

// Display labels
export const DURATION_LABELS = {
  [30 * 24 * 60 * 60]: '30 Days',
  [90 * 24 * 60 * 60]: '90 Days',
  [180 * 24 * 60 * 60]: '180 Days',
};
