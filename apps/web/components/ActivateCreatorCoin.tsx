import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { createCoin, type CreateCoinArgs, getProfile } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';
import { DeployCurrency } from '@zoralabs/coins-sdk';
import { useDebug } from '../app/hooks/useDebug';
import { CHAINS } from '../app/config/chains';
import { Hex } from 'viem';
import { usePinata } from '../app/hooks/usePinata'; // Import Pinata hook

export default function ActivateCreatorCoin() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { isDebug } = useDebug();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { pinJSON } = usePinata();

  const generateInitialMetadata = async (address: string) => {
    // Create basic metadata for the coin
    const metadata = {
      name: `${address.slice(0, 6)} Coin`,
      description: 'A creator coin on Zora',
      image: 'ipfs://QmDefaultImageHash', // Default image - should be customizable
      external_url: `https://zora.co/${address}`,
      attributes: [
        {
          trait_type: 'Type',
          value: 'Creator Coin'
        },
        {
          trait_type: 'Creator',
          value: address
        }
      ]
    };

    // Pin metadata to IPFS
    const { uri } = await pinJSON(metadata);
    return uri;
  };

  const handleActivate = async () => {
    if (!address || !walletClient) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if profile exists and doesn't already have a coin
      const profile = await getProfile({ identifier: address });
      if (profile.data?.profile?.creatorCoin?.activated) {
        throw new Error('Creator coin already exists');
      }

      // Generate and pin metadata
      const metadataUri = await generateInitialMetadata(address);

      // Set up coin parameters
      const coinParams: CreateCoinArgs = {
        name: `${address.slice(0, 6)} Coin`,
        symbol: address.slice(2, 6).toUpperCase(),
        uri: metadataUri,
        owners: [address],
        payoutRecipient: address,
        chainId: base.id,
        currency: DeployCurrency.ZORA
      };

      if (isDebug) {
        console.log('Creating coin with params:', coinParams);
      }

      // Create the coin using SDK
      const result = await createCoin(
        coinParams,
        walletClient,
        publicClient,
        {
          gasMultiplier: 120, // 20% buffer on gas
        }
      );

      if (isDebug) {
        console.log('Coin creation result:', {
          hash: result.hash,
          address: result.address,
          deployment: result.deployment
        });
      }

      if (result.deployment?.coin) {
        setSuccess(true);
      } else {
        throw new Error('Failed to extract coin address from transaction receipt');
      }

    } catch (err) {
      console.error('Error activating creator coin:', err);
      setError(err instanceof Error ? err.message : 'Failed to activate creator coin');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">🎉 Creator Coin Activated!</CardTitle>
          <CardDescription className="text-green-700">
            Your creator coin has been activated and is ready for trading.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            You&apos;ll automatically start earning from trades. Check your profile to see your coin in action!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activate Your Creator Coin</CardTitle>
        <CardDescription>
          Launch your own creator coin to start earning from trades and building your community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Activating your coin will:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Enable trading of your creator coin</li>
              <li>Automatically earn $ZORA from every trade</li>
              <li>Vest 50% of coins to you over 5 years</li>
              <li>Make 50% available for trading immediately</li>
            </ul>
          </div>

          {error && (
            <p className="text-sm text-red-500 p-3 bg-red-50 border border-red-200 rounded">
              {error}
            </p>
          )}

          <Button
            onClick={handleActivate}
            disabled={loading}
            className={`w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Activating...' : 'Activate Creator Coin'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
