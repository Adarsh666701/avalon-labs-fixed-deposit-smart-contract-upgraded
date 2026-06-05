'use client';

import { PortfolioPosition } from '@/utils/contracts';
import { daysRemaining, formatETH, formatRelativeTime, formatTimestamp, getStatusColor, getStatusLabel } from '@/utils/formatting';

interface PositionCardProps {
  position: PortfolioPosition;
  onRedeem?: (tokenId: bigint) => void;
  redeemLoading?: boolean;
}

export const PositionCard = ({ position, onRedeem, redeemLoading }: PositionCardProps) => {
  const statusLabel = getStatusLabel(position.matured, position.withdrawn);
  const statusColor = getStatusColor(position.matured, position.withdrawn);
  const timeRemaining = Number(position.maturityTime) - Math.floor(Date.now() / 1000);
  const daysLeft = daysRemaining(timeRemaining);

  const isETH = position.asset === '0x0000000000000000000000000000000000000000';
  const assetSymbol = isETH ? 'ETH' : 'TOKEN';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            #{position.tokenId.toString()} - {assetSymbol}
          </h3>
          <p className="text-sm text-gray-500 mt-1">NFT ID: {position.tokenId.toString()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">Principal</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {formatETH(position.principal)} {assetSymbol}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">Accrued Interest</p>
          <p className="text-lg font-bold text-green-600 mt-1">
            {formatETH(position.accruedInterest)} {assetSymbol}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">Maturity Date</p>
          <p className="text-sm text-gray-900 mt-1">
            {formatTimestamp(Number(position.maturityTime))}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">Time Remaining</p>
          <p className="text-sm text-gray-900 mt-1">
            {position.matured ? 'Matured' : `${daysLeft} days`}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Claimable Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Claimable Amount</p>
        <p className="text-2xl font-bold text-gray-900">
          {formatETH(position.claimableAmount)} {assetSymbol}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          {position.matured && !position.withdrawn
            ? 'Ready to claim at any time'
            : `Available ${formatRelativeTime(Number(position.maturityTime))}`}
        </p>
      </div>

      {/* Action Button */}
      {position.matured && !position.withdrawn && (
        <button
          onClick={() => onRedeem?.(position.tokenId)}
          disabled={redeemLoading}
          className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
        >
          {redeemLoading ? 'Claiming...' : 'Claim Deposit'}
        </button>
      )}

      {position.withdrawn && (
        <div className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg text-center">
          Claimed
        </div>
      )}

      {!position.matured && (
        <button
          disabled
          className="w-full px-4 py-2 bg-gray-100 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
        >
          Available in {daysLeft} days
        </button>
      )}
    </div>
  );
};
