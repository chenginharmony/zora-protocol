"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { getProfile, getProfileCoins } from "@zoralabs/coins-sdk";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { formatEther } from "viem";
import CoinStatsCard from "@/components/CoinStatsCard";

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
}

export default function ProfilePage() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [creatorCoin, setCreatorCoin] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfileData() {
      if (!address) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch profile data
        const profileResponse = await getProfile({
          identifier: address
        });

        if (profileResponse.data?.profile) {
          setProfile(profileResponse.data.profile);

          // If there's a creator coin, fetch its details
          if (profileResponse.data.profile.creatorCoin?.address) {
            const coinsResponse = await getProfileCoins({
              identifier: address
            });

            const coinData = coinsResponse.data?.profile?.createdCoins?.edges?.[0]?.node;
            if (coinData) {
              setCreatorCoin({
                name: coinData.name,
                symbol: coinData.symbol,
                marketCap: coinData.marketCap,
                volume24h: coinData.volume24h,
                uniqueHolders: coinData.uniqueHolders,
                address: coinData.address
              });
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch profile data");
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
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

        {/* Creator Coin Information */}
        {creatorCoin ? (
          <Card>
            <CardHeader>
              <CardTitle>Creator Coin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{creatorCoin.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Symbol</p>
                  <p className="font-medium">{creatorCoin.symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Market Cap</p>
                  <p className="font-medium">
                    {creatorCoin.marketCap 
                      ? `$${Number(formatEther(BigInt(creatorCoin.marketCap))).toLocaleString()}` 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">24h Volume</p>
                  <p className="font-medium">
                    {creatorCoin.volume24h 
                      ? `$${Number(formatEther(BigInt(creatorCoin.volume24h))).toLocaleString()}` 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unique Holders</p>
                  <p className="font-medium">{creatorCoin.uniqueHolders || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contract Address</p>
                  <p className="font-medium truncate">{creatorCoin.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-lg mb-4">You haven't created a Creator Coin yet</p>
                <a 
                  href="/create-coin" 
                  className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Create Your Coin
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
