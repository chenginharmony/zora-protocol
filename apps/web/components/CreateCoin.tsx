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
    initialPurchase: "0.01",
    loading: false,
    error: "",
    success: false
  });

  // Metadata fields for upload
  const [metadata, setMetadata] = React.useState({
    name: "",
    description: "",
    image: "",
    external_url: ""
  });
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState("");
  const [showPreview, setShowPreview] = React.useState(true);
  // Autofill example metadata
  const handleExampleMetadata = () => {
    setMetadata({
      name: "My Example Coin",
      description: "A token created on Zora",
      image: "https://example.com/image.png",
      external_url: "https://example.com"
    });
  };
  // Download metadata as JSON
  const handleDownloadMetadata = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metadata, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "metadata.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  // Handle metadata field changes
  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  // Upload metadata to IPFS via API
  const handleUploadMetadata = async () => {
    setUploading(true);
    setUploadError("");
    try {
      const res = await fetch("/api/upload-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata)
      });
      const result = await res.json();
      if (result.success && (result.ipfsUrl || result.ipfsHash)) {
        setFormData(prev => ({ ...prev, uri: result.ipfsUrl || result.ipfsHash }));
        setUploadError("");
        if (!result.isAvailable) {
          setUploadError("Upload succeeded, but IPFS propagation may take a few moments. You can use the URI now.");
        }
      } else {
        setUploadError(result.error || "Failed to upload metadata");
      }
    } catch (err) {
      setUploadError("Failed to upload metadata");
    } finally {
      setUploading(false);
    }
  };

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
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4 bg-white rounded-xl shadow-lg p-6">
      {/* Modern Compact Metadata Section */}
      <div className="mb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            name="name"
            value={metadata.name}
            onChange={handleMetadataChange}
            placeholder="Token Name"
            className="p-2 border rounded"
            title="e.g. My Awesome Coin"
          />
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleInputChange}
            placeholder="Symbol"
            className="p-2 border rounded"
            title="e.g. MAC"
          />
          <input
            type="text"
            name="description"
            value={metadata.description}
            onChange={handleMetadataChange}
            placeholder="Description"
            className="p-2 border rounded"
            title="Short summary of your token"
          />
          <input
            type="text"
            name="image"
            value={metadata.image}
            onChange={handleMetadataChange}
            placeholder="Image URL (IPFS or HTTPS)"
            className="p-2 border rounded"
            title="Direct link to your token image"
          />
          <input
            type="text"
            name="external_url"
            value={metadata.external_url}
            onChange={handleMetadataChange}
            placeholder="External URL (optional)"
            className="p-2 border rounded"
            title="Project website or documentation"
          />
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <button
            type="button"
            onClick={handleExampleMetadata}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-xs"
          >
            Example
          </button>
          <button
            type="button"
            onClick={handleDownloadMetadata}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-xs"
          >
            Download JSON
          </button>
          <button
            type="button"
            onClick={handleUploadMetadata}
            disabled={uploading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 text-xs"
          >
            {uploading ? "Uploading..." : "Upload Metadata to IPFS"}
          </button>
        </div>
        {uploadError && <div className="mt-2 text-red-500 text-xs">{uploadError}</div>}
        {formData.uri && (
          <div className="mt-2 text-green-600 text-xs">IPFS URI: {formData.uri}</div>
        )}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="text-xs underline text-blue-500"
          >
            {showPreview ? "Hide" : "Show"} Metadata Preview
          </button>
          {showPreview && (
            <pre className="mt-2 p-2 bg-gray-100 border rounded text-xs overflow-x-auto">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Coin Creation Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <input
          type="text"
          name="recipientAddress"
          value={formData.recipientAddress}
          onChange={handleInputChange}
          placeholder="Payout Recipient Address (0x...)"
          className="p-2 border rounded"
          required
        />
        <input
          type="number"
          name="initialPurchase"
          value={formData.initialPurchase}
          onChange={handleInputChange}
          placeholder="Initial Purchase (ETH)"
          className="p-2 border rounded"
        />
      </div>

      {(simulateError || writeError || formData.error) && (
        <div className="p-3 text-red-500 bg-red-50 rounded text-xs">
          {simulateError?.message || writeError?.message || formData.error}
        </div>
      )}

      <button
        type="submit"
        disabled={!writeContract || status === 'pending' || formData.loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {formData.loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full inline-block"></span>
            <span className="ml-2">Creating Coin...</span>
          </span>
        ) : (
          <span>Create Coin</span>
        )}
      </button>
    </form>
  );
}
