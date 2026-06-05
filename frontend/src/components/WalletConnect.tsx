'use client';

import { useWalletConnection } from '@/hooks/usePortfolio';
import { truncateAddress } from '@/utils/formatting';
import { useState } from 'react';

export const WalletConnect = () => {
  const { address, connected, connect, disconnect } = useWalletConnection();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      await connect();
    } catch (error) {
      console.error('Connect error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (connected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 font-medium">{truncateAddress(address)}</p>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
    >
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};
