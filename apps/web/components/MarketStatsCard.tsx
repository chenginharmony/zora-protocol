import { Address } from 'viem';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useEffect } from 'react';
import { getProfileCoins } from '@zoralabs/coins-sdk';
import { useQuery } from '@tanstack/react-query';

interface MarketStats {
  marketCap: string;
  volume24h: string;
  holders: number;
  price: string;
  priceChange24h: string;
}

export default function MarketStatsCard({ coinAddress }: { coinAddress: Address }) {
  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['coinMarketData', coinAddress],
    queryFn: async () => {
      const response = await getProfileCoins({
        identifier: coinAddress
      });
      
      if (response.data?.profile?.createdCoins?.edges?.[0]) {
        const coin = response.data.profile.createdCoins.edges[0].node;
        return {
          marketCap: coin.marketCap || '0',
          volume24h: coin.volume24h || '0',
          holders: coin.uniqueHolders || 0,
          price: coin.marketCap ? parseFloat(coin.marketCap) / parseFloat(coin.totalSupply || '1') : 0,
          priceChange24h: coin.marketCapDelta24h || '0'
        };
      }
      return null;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>Market Stats</CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  if (error || !marketData) {
    return (
      <Card>
        <CardHeader>Market Stats</CardHeader>
        <CardContent>Error loading market data</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>Market Stats</CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Market Cap</div>
            <div className="text-lg font-bold">${marketData.marketCap}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">24h Volume</div>
            <div className="text-lg font-bold">${marketData.volume24h}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Price</div>
            <div className="text-lg font-bold">${marketData.price}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">24h Change</div>
            <div className={`text-lg font-bold ${Number(marketData.priceChange24h) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {marketData.priceChange24h}%
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-gray-500">Holders</div>
            <div className="text-lg font-bold">{marketData.holders}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
