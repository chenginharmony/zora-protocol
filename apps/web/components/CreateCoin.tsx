"use client";

import * as React from 'react';
import { createCoinCall, DeployCurrency, ValidMetadataURI, InitialPurchaseCurrency } from "@zoralabs/coins-sdk";
import { Address, parseEther } from "viem";
import { useWriteContract, useSimulateContract } from "wagmi";
import { base } from "viem/chains";

export function CreateCoinForm() {
  const [formData, setFormData] = React.useState({
    name: "",
    symbol: "",
    uri: "",
    recipientAddress: "",
    loading: false,
    error: "",
    success: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      error: ""
    }));
  };

  // Create configuration for contract call
  const getCoinParams = () => ({
    name: formData.name,
    symbol: formData.symbol,
    uri: formData.uri as ValidMetadataURI,
    payoutRecipient: formData.recipientAddress as Address,
    currency: DeployCurrency.ZORA,
    chainId: base.id,
    initialPurchase: {
      currency: InitialPurchaseCurrency.ETH,
      amount: parseEther("0.01"),
    },
  });

  const contractCallParams = React.useMemo(() => {
    try {
      return createCoinCall(getCoinParams());
    } catch (error) {
      console.error('Error preparing contract call:', error);
      return null;
    }
  }, [formData.name, formData.symbol, formData.uri, formData.recipientAddress]);

  const { data: simulateData, error: simulateError } = useSimulateContract(
    contractCallParams ? {
      ...contractCallParams,
    } : undefined
  );
  
  const { writeContract, status, error: writeError } = useWriteContract(simulateData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (writeContract) {
      setFormData(prev => ({ ...prev, loading: true, error: "" }));
      try {
        await writeContract();
        setFormData(prev => ({ ...prev, success: true }));
      } catch (error) {
        setFormData(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : "Failed to create coin" 
        }));
      } finally {
        setFormData(prev => ({ ...prev, loading: false }));
      }
    }
  };

  if (formData.success) {
    return (
      <div className="text-center p-4 bg-green-100 rounded">
        <h3 className="text-xl font-bold text-green-800">Creator Coin Created Successfully!</h3>
        <p className="mt-2">Your coin has been created and is now ready to use.</p>
        <button
          onClick={() => setFormData(prev => ({ ...prev, success: false }))}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Create Another Coin
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Coin Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="My Creator Coin"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Symbol</label>
        <input
          type="text"
          name="symbol"
          value={formData.symbol}
          onChange={handleInputChange}
          placeholder="MCC"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Metadata URI</label>
        <input
          type="text"
          name="uri"
          value={formData.uri}
          onChange={handleInputChange}
          placeholder="ipfs://..."
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-xs text-gray-500">
          IPFS URI for your coin's metadata (image, description, etc.)
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Payout Recipient Address</label>
        <input
          type="text"
          name="recipientAddress"
          value={formData.recipientAddress}
          onChange={handleInputChange}
          placeholder="0x..."
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {(simulateError || writeError || formData.error) && (
        <div className="p-3 text-red-500 bg-red-50 rounded">
          {simulateError?.message || writeError?.message || formData.error}
        </div>
      )}

      <button
        type="submit"
        disabled={!writeContract || status === 'pending' || formData.loading}
        className="w-full py-3 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {status === 'pending' || formData.loading ? 'Creating...' : 'Create Creator Coin'}
      </button>
    </form>
  );
}
