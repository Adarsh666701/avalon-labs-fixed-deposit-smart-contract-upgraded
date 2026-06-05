// Minimal ABIs for read-only operations
export const DEPOSIT_MANAGER_ABI = [
  {
    name: 'getUserActivePositions',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        name: 'positions',
        type: 'tuple[]',
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'asset', type: 'address' },
          { name: 'principal', type: 'uint256' },
          { name: 'accruedInterest', type: 'uint256' },
          { name: 'expectedMaturityAmount', type: 'uint256' },
          { name: 'maturityTime', type: 'uint256' },
          { name: 'matured', type: 'bool' },
          { name: 'withdrawn', type: 'bool' },
          { name: 'claimableAmount', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'getUserDepositHistory',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        name: 'positions',
        type: 'tuple[]',
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'asset', type: 'address' },
          { name: 'principal', type: 'uint256' },
          { name: 'accruedInterest', type: 'uint256' },
          { name: 'expectedMaturityAmount', type: 'uint256' },
          { name: 'maturityTime', type: 'uint256' },
          { name: 'matured', type: 'bool' },
          { name: 'withdrawn', type: 'bool' },
          { name: 'claimableAmount', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'getUserPortfolioSummary',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        name: 'summary',
        type: 'tuple',
        components: [
          { name: 'totalActivePositions', type: 'uint256' },
          { name: 'totalPrincipalLocked', type: 'uint256' },
          { name: 'totalAccruedInterest', type: 'uint256' },
          { name: 'totalClaimable', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'getClaimableAmount',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'claimable', type: 'uint256' }],
  },
  {
    name: 'getTimeUntilMaturity',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'timeRemaining', type: 'uint256' }],
  },
  {
    name: 'deposits',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'asset', type: 'address' },
      { name: 'principal', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'maturityTime', type: 'uint256' },
      { name: 'aprBps', type: 'uint256' },
      { name: 'lockDuration', type: 'uint256' },
      { name: 'withdrawn', type: 'bool' },
    ],
  },
  {
    name: 'redeem',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
];

export const DEPOSIT_NFT_ABI = [
  {
    name: 'ownerOf',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
];

export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'symbol', type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'name', type: 'string' }],
  },
];
