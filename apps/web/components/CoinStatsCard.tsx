"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { Card } from "@/components/ui/card";

interface CoinStatsProps {
  coinAddress?: string;
  marketCap?: string;
  marketCapDelta24h?: string;
  volume24h?: string;
  uniqueHolders?: number;
}

export default function CoinStatsCard({ 
  coinAddress,
  marketCap,
  marketCapDelta24h,
  volume24h,
  uniqueHolders
}: CoinStatsProps) {
  const [dexInfo, setDexInfo] = useState<any>(null);

  useEffect(() => {
    // Fetch DEX info from an API like DexScreener
    async function fetchDexInfo() {
      if (!coinAddress) return;
      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${coinAddress}`);
        const data = await response.json();
        setDexInfo(data);
      } catch (err) {
        console.error("Failed to fetch DEX info:", err);
      }
    }

    fetchDexInfo();
  }, [coinAddress]);

  const marketCapValue = marketCap ? Number(formatEther(BigInt(marketCap))).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  }) : 'N/A';

  const marketCapChange = marketCapDelta24h ? Number(marketCapDelta24h).toFixed(2) + '%' : 'N/A';
  const isPositiveChange = marketCapDelta24h && Number(marketCapDelta24h) > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* Market Cap Card */}
      <Card className="p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Market Cap</h3>
          <span className={`text-sm font-medium ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
            {marketCapChange}
          </span>
        </div>
        <div className="text-2xl font-bold">{marketCapValue}</div>
      </Card>

      {/* Trading Stats Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Trading Stats</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">24h Volume</span>
            <span className="font-medium">
              {volume24h ? Number(formatEther(BigInt(volume24h))).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD'
              }) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Holders</span>
            <span className="font-medium">{uniqueHolders?.toLocaleString() || 'N/A'}</span>
          </div>
        </div>
      </Card>

      {/* DEX Info Card */}
      {dexInfo && (
        <Card className="p-6 col-span-full">
          <h3 className="text-lg font-semibold mb-4">Trading Pairs</h3>
          <div className="space-y-4">
            {dexInfo.pairs?.map((pair: any) => (
              <div key={pair.pairAddress} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{pair.dexName}</div>
                  <div className="text-sm text-gray-500">{pair.baseToken.symbol}/{pair.quoteToken.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${pair.priceUsd}</div>
                  <div className="text-sm text-gray-500">
                    24h Vol: ${Number(pair.volume24h).toLocaleString()}
                  </div>
                </div>
                <a
                  href={pair.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Trade
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Contract Info Card */}
      <Card className="p-6 col-span-full">
        <h3 className="text-lg font-semibold mb-4">Contract Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Contract Address</span>
            <div className="flex items-center space-x-2">
              <a
                href={`https://basescan.org/address/${coinAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 font-medium"
              >
                {coinAddress?.slice(0, 6)}...{coinAddress?.slice(-4)}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(coinAddress || '')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6zm0-2h8a4 4 0 014 4v11a4 4 0 01-4 4H6a4 4 0 01-4-4V5a4 4 0 014-4z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Explorer</span>
            <a
              href={`https://basescan.org/token/${coinAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              View on BaseScan
            </a>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">DexScreener</span>
            <a
              href={`https://dexscreener.com/base/${coinAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              View Pairs
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
