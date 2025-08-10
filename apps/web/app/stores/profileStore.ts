import { create } from 'zustand';
import { getProfile, getProfileCoins } from "@zoralabs/coins-sdk";
import { Address } from 'viem';

interface ProfileState {
  loading: boolean;
  error: string | null;
  profile: {
    handle?: string;
    displayName?: string;
    bio?: string;
    avatar?: {
      medium?: string;
    };
    creatorCoin?: {
      address?: string;
      marketCap?: string;
      marketCapDelta24h?: string;
      activated?: boolean;
    };
  } | null;
  createdCoins: Array<{
    name?: string;
    symbol?: string;
    marketCap?: string;
    volume24h?: string;
    uniqueHolders?: number;
    address?: string;
    avatar?: {
      medium?: string;
    };
  }>;
  debugResponse: any;
  fetchProfile: (address: Address) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  loading: false,
  error: null,
  profile: null,
  createdCoins: [],
  debugResponse: null,
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  fetchProfile: async (address) => {
    try {
      set({ loading: true, error: null });
      
      // Fetch profile data
      const profileResponse = await getProfile({ identifier: address });
      
      if (profileResponse.data?.profile) {
        set({ profile: profileResponse.data.profile });
        
        // Fetch all created coins
        const coinsResponse = await getProfileCoins({ identifier: address });
        set({ debugResponse: coinsResponse });
        
        const coins = coinsResponse.data?.profile?.createdCoins?.edges || [];
        set({
          createdCoins: coins.map((edge: any) => ({
            name: edge.node.name,
            symbol: edge.node.symbol,
            marketCap: edge.node.marketCap,
            volume24h: edge.node.volume24h,
            uniqueHolders: edge.node.uniqueHolders,
            address: edge.node.address,
            avatar: edge.node.metadata?.avatar || undefined
          }))
        });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to fetch profile data" });
    } finally {
      set({ loading: false });
    }
  }
}));
