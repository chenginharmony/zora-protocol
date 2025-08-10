import { useEffect, useState } from 'react';
import { Address } from 'viem';
import { getProfile, getProfileCoins } from '@zoralabs/coins-sdk';
import { publicClient } from '../config/wagmi';
import { formatEther } from 'viem';

interface MarketStats {
  marketCap: string;
  volume24h: string;
  holders: number;
  price: string;
  priceChange24h: string;
}

export function useMarketStats(coinAddress?: Address) {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!coinAddress) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getMarketStats({ coinAddress });
        
        if (response.data) {
          setStats({
            marketCap: formatEther(response.data.marketCap || '0'),
            volume24h: formatEther(response.data.volume24h || '0'),
            holders: Number(response.data.uniqueHolders || '0'),
            price: formatEther(response.data.price || '0'),
            priceChange24h: response.data.priceChange24h || '0'
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [coinAddress]);

  return { stats, loading, error };
}
