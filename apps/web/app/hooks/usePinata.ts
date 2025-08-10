import { useState } from 'react';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export function usePinata() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pinJSONToIPFS = async (jsonData: any): Promise<string> => {
    try {
      setUploading(true);
      setError(null);

      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': process.env.PINATA_API_KEY || '',
          'pinata_secret_api_key': process.env.PINATA_API_SECRET || ''
        },
        body: JSON.stringify(jsonData)
      });

      if (!response.ok) {
        throw new Error(`Failed to pin to IPFS: ${response.statusText}`);
      }

      const data: PinataResponse = await response.json();
      return `ipfs://${data.IpfsHash}`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pin to IPFS';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return {
    pinJSONToIPFS,
    uploading,
    error
  };
}
