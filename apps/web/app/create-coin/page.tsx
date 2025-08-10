"use client";

import { CreateCoinForm } from '../../components/CreateCoin';

export default function CreateCoinPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Your Creator Coin</h1>
      <CreateCoinForm />
    </div>
  );
}
