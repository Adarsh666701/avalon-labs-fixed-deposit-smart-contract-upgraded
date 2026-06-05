'use client';

import { PortfolioSummary } from '@/utils/contracts';
import { formatETH, formatNumber } from '@/utils/formatting';

interface PortfolioStatsProps {
  summary: PortfolioSummary | null;
  loading: boolean;
}

export const PortfolioStats = ({ summary, loading }: PortfolioStatsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Active Positions',
      value: summary ? formatNumber(Number(summary.totalActivePositions)) : '0',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-900',
    },
    {
      label: 'Principal Locked',
      value: summary ? `${formatETH(summary.totalPrincipalLocked)} ETH` : '0 ETH',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-900',
    },
    {
      label: 'Accrued Interest',
      value: summary ? `${formatETH(summary.totalAccruedInterest)} ETH` : '0 ETH',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-900',
    },
    {
      label: 'Claimable',
      value: summary ? `${formatETH(summary.totalClaimable)} ETH` : '0 ETH',
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`rounded-lg border-2 p-6 ${stat.color}`}>
          <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
          <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};
