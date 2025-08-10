import { useState } from 'react';
import { Address, parseEther } from 'viem';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWalletClient, usePublicClient, useAccount } from 'wagmi';
import { tradeCoin, TradeParameters } from '@zoralabs/coins-sdk';

interface TradingCardProps {
  coinAddress: Address;
  coinName: string;
  currentPrice: string;
}

export default function TradingCard({ coinAddress, coinName, currentPrice }: TradingCardProps) {
  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  const publicClient = usePublicClient();

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);

  const executeTrade = async () => {
    if (!walletClient || !address || !amount) return;
    
    try {
      setIsLoading(true);
      
      const tradeParameters: TradeParameters = isBuying ? {
        sell: { type: "eth" },
        buy: {
          type: "erc20",
          address: coinAddress
        },
        amountIn: parseEther(amount),
        slippage: 0.05, // 5% slippage tolerance
        sender: address
      } : {
        sell: {
          type: "erc20",
          address: coinAddress
        },
        buy: { type: "eth" },
        amountIn: parseEther(amount),
        slippage: 0.05,
        sender: address
      };

      await tradeCoin({
        tradeParameters,
        walletClient,
        publicClient,
        account: address
      });

    } catch (err) {
      console.error('Trade failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate expected output based on amount and current price
  const expectedOutput = amount ? (Number(amount) * Number(currentPrice)).toFixed(6) : '0';

  return (
    <Card>
      <CardHeader>Trade {coinName}</CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Trade Type Selector */}
          <div className="flex gap-2">
            <Button 
              variant={isBuying ? "default" : "outline"}
              onClick={() => setIsBuying(true)}
            >
              Buy
            </Button>
            <Button 
              variant={!isBuying ? "default" : "outline"}
              onClick={() => setIsBuying(false)}
            >
              Sell
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm text-gray-500">
              {isBuying ? "Amount to Buy" : "Amount to Sell"}
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Price Info */}
          <div className="text-sm text-gray-500">
            <div>Current Price: ${currentPrice}</div>
            <div>Expected {isBuying ? "Cost" : "Receive"}: ${expectedOutput}</div>
          </div>

          {/* Execute Trade Button */}
          <Button
            className="w-full"
            onClick={() => executeTrade()}
            disabled={isLoading || !amount || Number(amount) <= 0}
          >
            {isLoading ? "Processing..." : isBuying ? "Buy Now" : "Sell Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
