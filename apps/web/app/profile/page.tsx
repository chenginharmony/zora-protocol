"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { getProfile, getProfileCoins } from "@zoralabs/coins-sdk";
import { getProfileBalances } from "@zoralabs/coins-sdk";
import { getCoinSwaps } from "@zoralabs/coins-sdk";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { formatEther } from "viem";
import CoinStatsCard from "@/components/CoinStatsCard";
import ActivateCreatorCoin from "@/components/ActivateCreatorCoin";
import { useProfileStore } from "../stores/profileStore";
import MarketStatsCard from "@/components/MarketStatsCard";
import TradingCard from "@/components/TradingCard";

interface ProfileData {
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
  };
}

interface CoinData {
  name?: string;
  symbol?: string;
  marketCap?: string;
  volume24h?: string;
  uniqueHolders?: number;
  address?: string;
  avatar?: {
    medium?: string;
  };
}

export default function ProfilePage() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [createdCoins, setCreatedCoins] = useState<CoinData[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'holdings' | 'activity' | 'social'>('created');
  const [holdings, setHoldings] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [socialInfo, setSocialInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [debugCoinsResponse, setDebugCoinsResponse] = useState<any>(null);
  useEffect(() => {
    async function fetchProfileData() {
      if (!address) return;
      try {
        setLoading(true);
        setError(null);
        // Fetch profile data
        const profileResponse = await getProfile({ identifier: address });
        if (profileResponse.data?.profile) {
          setProfile(profileResponse.data.profile);
          // Fetch all created coins
          const coinsResponse = await getProfileCoins({ identifier: address });
          setDebugCoinsResponse(coinsResponse);
          const coins = coinsResponse.data?.profile?.createdCoins?.edges || [];
          setCreatedCoins(
            coins.map((edge: any) => ({
              name: edge.node.name,
              symbol: edge.node.symbol,
              marketCap: edge.node.marketCap,
              volume24h: edge.node.volume24h,
              uniqueHolders: edge.node.uniqueHolders,
              address: edge.node.address,
              avatar: edge.node.metadata?.avatar || undefined
            }))
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch profile data");
      } finally {
        setLoading(false);
      }
    }
    fetchProfileData();
  }, [address]);

  // Fetch Holdings (coin balances)
  useEffect(() => {
    async function fetchHoldings() {
      if (!address) return;
      try {
        const response = await getProfileBalances({ identifier: address, count: 20 });
        const profile = response.data?.profile;
        if (profile?.coinBalances?.edges) {
          setHoldings(profile.coinBalances.edges.map((edge: any) => edge.node));
        }
      } catch (err) {
        // Ignore errors for now
      }
    }
    fetchHoldings();
  }, [address]);

  // Fetch Activity (coin swaps)
  useEffect(() => {
    async function fetchActivity() {
      if (!address) return;
      try {
        // Example: fetch swaps for each holding
        let allSwaps: any[] = [];
        for (const holding of holdings) {
          if (holding.token?.address) {
            const response = await getCoinSwaps({ address: holding.token.address, chain: holding.token.chainId || 8453, first: 10 });
            const swaps = response.data?.zora20Token?.swapActivities?.edges || [];
            allSwaps = [...allSwaps, ...swaps.map((edge: any) => edge.node)];
          }
        }
        setActivity(allSwaps);
      } catch (err) {
        // Ignore errors for now
      }
    }
    if (holdings.length > 0) fetchActivity();
  }, [address, holdings]);

  // Fetch Social Info
  useEffect(() => {
    async function fetchSocial() {
      if (!address) return;
      try {
        const response = await getProfile({ identifier: address });
        setSocialInfo(response.data?.profile?.socialAccounts || null);
      } catch (err) {
        // Ignore errors for now
      }
    }
    fetchSocial();
  }, [address]);
  }, [address]);

  if (!address) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-lg">Please connect your wallet to view your profile</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-lg">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-lg text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Debug Output */}
      <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-700">
        <div><strong>Wallet Address:</strong> {address}</div>
        <div><strong>Raw Coins API Response:</strong></div>
        <pre className="overflow-x-auto max-h-40">{JSON.stringify(debugCoinsResponse, null, 2)}</pre>
      </div>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>

        {/* Creator Coin Activation */}
        {!profile?.creatorCoin?.activated && (
          <ActivateCreatorCoin />
        )}

        {profile?.creatorCoin?.activated && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            <p className="font-medium">Creator Coin Active</p>
            <p className="text-sm">Your creator coin is active and can be traded.</p>
          </div>
        )}
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              {profile?.avatar?.medium && (
                <img 
                  src={profile.avatar.medium} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {profile?.displayName || profile?.handle || address}
                </h2>
                {profile?.bio && (
                  <p className="text-gray-600 mt-2">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex space-x-4 my-4">
          <button
            className={`px-4 py-2 rounded ${activeTab === 'created' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('created')}
          >
            Created Coins
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === 'holdings' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('holdings')}
          >
            Holdings
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === 'activity' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === 'social' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('social')}
          >
            Social
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'created' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Created Coins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {createdCoins.length === 0 ? (
                <div className="text-center">
                  <p className="text-lg mb-4">You haven't created any coins yet</p>
                  <a 
                    href="/create-coin" 
                    className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Create Your Coin
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {createdCoins.map((coin, idx) => (
                    <div key={coin.address || idx} className="border p-4 rounded-lg bg-white shadow flex items-center gap-4">
                      {/* Coin avatar if available in metadata */}
                      {coin.avatar?.medium && (
                        <img src={coin.avatar.medium} alt={coin.name} className="w-12 h-12 rounded-full" />
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-lg">{coin.name} ({coin.symbol})</div>
                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                          Address: 
                          <a
                            href={`https://sepolia.basescan.org/address/${coin.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {coin.address}
                          </a>
                          <button
                            type="button"
                            className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
                            onClick={() => navigator.clipboard.writeText(coin.address || "")}
                          >
                            Copy
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">Market Cap: {coin.marketCap ? `$${Number(formatEther(BigInt(coin.marketCap))).toLocaleString()}` : 'N/A'}</div>
                        <div className="text-xs text-gray-500 mb-2">24h Volume: {coin.volume24h ? `$${Number(formatEther(BigInt(coin.volume24h))).toLocaleString()}` : 'N/A'}</div>
                        <div className="text-xs text-gray-500 mb-2">Unique Holders: {coin.uniqueHolders || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'holdings' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {holdings.length === 0 ? (
                <div className="text-center text-gray-500">No coin holdings found.</div>
              ) : (
                <div className="space-y-4">
                  {holdings.map((holding: any, idx: number) => (
                    <div key={holding.token?.address || idx} className="border p-4 rounded-lg bg-white shadow flex items-center gap-4">
                      {holding.token?.media?.medium && (
                        <img src={holding.token.media.medium} alt={holding.token.name} className="w-12 h-12 rounded-full" />
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-lg">{holding.token?.name} ({holding.token?.symbol})</div>
                        <div className="text-xs text-gray-500 mb-2">Balance: {holding.amount?.amountDecimal || 'N/A'}</div>
                        <div className="text-xs text-gray-500 mb-2">Value (USD): {holding.valueUsd ? `$${Number(holding.valueUsd).toLocaleString()}` : 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <div className="text-center text-gray-500">No recent activity found.</div>
              ) : (
                <div className="space-y-4">
                  {activity.map((act: any, idx: number) => (
                    <div key={act.id || idx} className="border p-4 rounded-lg bg-white shadow">
                      <div className="font-bold text-lg">{act.activityType} {act.coinAmount} {act.coinSymbol}</div>
                      <div className="text-xs text-gray-500 mb-2">From: {act.senderAddress}</div>
                      <div className="text-xs text-gray-500 mb-2">Timestamp: {act.blockTimestamp}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'social' && (
          <Card>
            <CardHeader>
              <CardTitle>Social Info</CardTitle>
            </CardHeader>
            <CardContent>
              {socialInfo ? (
                <div className="space-y-2">
                  {Object.entries(socialInfo).map(([platform, info]: [string, any]) => (
                    <div key={platform} className="text-gray-700">
                      <span className="font-bold">{platform}:</span> {info?.displayName || JSON.stringify(info)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No social info found.</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
