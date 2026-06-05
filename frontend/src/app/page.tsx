'use client';

import { Header } from '@/components/Header';
import { Layout } from '@/components/Layout';
import { PortfolioStats } from '@/components/PortfolioStats';
import { PositionsGrid } from '@/components/PositionsGrid';
import { Tabs } from '@/components/Tabs';
import { usePortfolio, useWalletConnection } from '@/hooks/usePortfolio';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { address, connected, chainId } = useWalletConnection();
  const { activePositions, depositHistory, summary, loading, refetch } = usePortfolio(
    connected ? address : null,
    chainId
  );
  const [activeTab, setActiveTab] = useState('active');
  const [redeemLoading, setRedeemLoading] = useState(false);

  const handleRedeem = useCallback(
    async (tokenId: bigint) => {
      if (!connected || !address) {
        toast.error('Please connect your wallet first');
        return;
      }

      setRedeemLoading(true);
      try {
        // This would call the actual redeem function through the contract
        toast.success(`Redemption initiated for deposit #${tokenId.toString()}`);
        // In a real implementation, you'd:
        // 1. Create a contract instance with a signer
        // 2. Call manager.redeem(tokenId)
        // 3. Wait for transaction
        // 4. Refetch portfolio
        await refetch();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to redeem';
        toast.error(`Redemption failed: ${errorMessage}`);
      } finally {
        setRedeemLoading(false);
      }
    },
    [connected, address, refetch]
  );

  const tabs = [
    { label: `💰 Active Positions (${activePositions.length})`, id: 'active' },
    { label: `📜 Deposit History (${depositHistory.length})`, id: 'history' },
  ];

  return (
    <Layout>
      <Header onRefresh={refetch} />

      {connected ? (
        <>
          {/* Portfolio Stats */}
          <div className="mb-8">
            <PortfolioStats summary={summary} loading={loading} />
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content */}
          {activeTab === 'active' && (
            <PositionsGrid
              positions={activePositions}
              loading={loading}
              title="Active Positions"
              onRedeem={handleRedeem}
              redeemLoading={redeemLoading}
            />
          )}

          {activeTab === 'history' && (
            <PositionsGrid
              positions={depositHistory}
              loading={loading}
              title="Deposit History"
            />
          )}
        </>
      ) : (
        <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-12 text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Connect Your Wallet</h2>
          <p className="text-blue-700 mb-6">
            Click the "Connect Wallet" button in the top right to view your portfolio
          </p>
          <div className="inline-block px-6 py-3 bg-blue-100 text-blue-900 rounded-lg">
            👇 Use MetaMask or any Web3 wallet
          </div>
        </div>
      )}
    </Layout>
  );
}
