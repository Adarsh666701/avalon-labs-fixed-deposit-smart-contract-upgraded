'use client';

import { PortfolioPosition } from '@/utils/contracts';
import { PositionCard } from './PositionCard';

interface PositionsGridProps {
  positions: PortfolioPosition[];
  loading: boolean;
  title: string;
  onRedeem?: (tokenId: bigint) => void;
  redeemLoading?: boolean;
}

export const PositionsGrid = ({
  positions,
  loading,
  title,
  onRedeem,
  redeemLoading,
}: PositionsGridProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-lg p-6 animate-pulse h-80"
            />
          ))}
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">No positions found</p>
          <p className="text-gray-400 text-sm mt-2">Start by creating your first deposit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">
        {title} ({positions.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {positions.map((position) => (
          <PositionCard
            key={position.tokenId.toString()}
            position={position}
            onRedeem={onRedeem}
            redeemLoading={redeemLoading}
          />
        ))}
      </div>
    </div>
  );
};
