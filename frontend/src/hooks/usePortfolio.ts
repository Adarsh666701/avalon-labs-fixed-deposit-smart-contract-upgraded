import {
    fetchActivePositions,
    fetchDepositHistory,
    fetchPortfolioSummary,
    PortfolioPosition,
    PortfolioSummary,
} from '@/utils/contracts';
import { useEffect, useState } from 'react';

/**
 * Hook to fetch and manage portfolio data
 */
export const usePortfolio = (userAddress: string | null, chainId: number = 31337) => {
  const [activePositions, setActivePositions] = useState<PortfolioPosition[]>([]);
  const [depositHistory, setDepositHistory] = useState<PortfolioPosition[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    if (!userAddress) return;

    setLoading(true);
    setError(null);

    try {
      const [positions, history, summaryData] = await Promise.all([
        fetchActivePositions(userAddress, chainId),
        fetchDepositHistory(userAddress, chainId),
        fetchPortfolioSummary(userAddress, chainId),
      ]);

      setActivePositions(positions);
      setDepositHistory(history);
      setSummary(summaryData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch portfolio data';
      setError(errorMessage);
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [userAddress, chainId]);

  return {
    activePositions,
    depositHistory,
    summary,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook to track real-time wallet connection
 */
export const useWalletConnection = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [chainId, setChainId] = useState<number>(31337);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setConnected(true);

            const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
            setChainId(parseInt(chainId, 16));
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for connection changes
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setConnected(true);
        } else {
          setAddress(null);
          setConnected(false);
        }
      });

      (window as any).ethereum.on('chainChanged', (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      });
    }
  }, []);

  const connect = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAddress(accounts[0]);
        setConnected(true);

        const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainId, 16));

        return accounts[0];
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
      }
    }
  };

  const disconnect = () => {
    setAddress(null);
    setConnected(false);
  };

  return {
    address,
    connected,
    chainId,
    provider,
    connect,
    disconnect,
  };
};
