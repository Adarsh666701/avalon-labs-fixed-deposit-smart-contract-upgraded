import { formatDate, formatDistanceToNow } from 'date-fns';
import { ethers } from 'ethers';

/**
 * Format wei to human-readable ETH
 */
export const formatETH = (wei: bigint | string, decimals: number = 18): string => {
  const value = typeof wei === 'string' ? BigInt(wei) : wei;
  const formatted = ethers.formatUnits(value, decimals);
  return parseFloat(formatted).toFixed(4);
};

/**
 * Format large numbers with commas
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format timestamp to readable date
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

/**
 * Format timestamp to relative time (e.g., "in 5 days")
 */
export const formatRelativeTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Calculate APR percentage
 */
export const calculateAPR = (bps: number): number => {
  return bps / 100; // basis points to percentage
};

/**
 * Get asset symbol and decimals
 */
export const getAssetInfo = (address: string): { symbol: string; decimals: number } => {
  if (address === ethers.ZeroAddress) {
    return { symbol: 'ETH', decimals: 18 };
  }
  // For other tokens, would need to fetch from chain
  return { symbol: 'TOKEN', decimals: 18 };
};

/**
 * Truncate address for display
 */
export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Determine status badge color based on deposit state
 */
export const getStatusColor = (matured: boolean, withdrawn: boolean): string => {
  if (withdrawn) return 'bg-gray-200 text-gray-800';
  if (matured) return 'bg-green-100 text-green-800';
  return 'bg-blue-100 text-blue-800';
};

/**
 * Get status label
 */
export const getStatusLabel = (matured: boolean, withdrawn: boolean): string => {
  if (withdrawn) return 'Withdrawn';
  if (matured) return 'Ready to Claim';
  return 'Active';
};

/**
 * Calculate days remaining
 */
export const daysRemaining = (secondsRemaining: number): number => {
  return Math.ceil(secondsRemaining / (24 * 60 * 60));
};
