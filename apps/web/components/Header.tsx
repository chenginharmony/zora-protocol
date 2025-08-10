import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header: React.FC = () => {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b bg-white">
      <div className="flex items-center gap-6">
        <a href="/profile" className="text-base font-medium text-blue-600 hover:underline">Dashboard</a>
        <span className="text-xl font-bold">Zora Protocol</span>
      </div>
      <ConnectButton />
    </header>
  );
};

export default Header;
