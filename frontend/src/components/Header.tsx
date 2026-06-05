'use client';

import { useWalletConnection } from '@/hooks/usePortfolio';
import { useState } from 'react';
import { WalletConnect } from './WalletConnect';

export const Header = ({ onRefresh }: { onRefresh?: () => void }) => {
  const { connected } = useWalletConnection();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {connected ? 'Your deposits and accrued interest' : 'Connect wallet to view your portfolio'}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {connected && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition font-medium"
            >
              {refreshing ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          )}
          <WalletConnect />
        </div>
      </div>
    </div>
  );
};
