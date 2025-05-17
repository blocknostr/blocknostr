
import React from "react";
import WalletDashboard from "../WalletDashboard";
import { SavedWallet } from "@/types/wallet";
import SendTransaction from "../SendTransaction";
import { Card } from "@/components/ui/card";

interface AlephiumWalletLayoutProps {
  address: string;
  allWallets: SavedWallet[];
  isLoggedIn: boolean;
  walletStats: {
    transactionCount: number;
    receivedAmount: number;
    sentAmount: number;
    tokenCount: number;
  };
  isStatsLoading: boolean;
  refreshFlag: number;
  setRefreshFlag: (flag: number) => void;
  activeTab: string;
}

const AlephiumWalletLayout: React.FC<AlephiumWalletLayoutProps> = ({
  address,
  allWallets,
  isLoggedIn,
  walletStats,
  isStatsLoading,
  refreshFlag,
  setRefreshFlag,
  activeTab,
}) => {
  // Only show send transaction in the portfolio tab
  const showSendTransaction = activeTab === "portfolio" && isLoggedIn;

  return (
    <div className="space-y-6">
      {/* Main dashboard content */}
      <WalletDashboard
        address={address}
        allWallets={allWallets}
        isLoggedIn={isLoggedIn}
        walletStats={walletStats}
        isStatsLoading={isStatsLoading}
        refreshFlag={refreshFlag}
        setRefreshFlag={setRefreshFlag}
        activeTab={activeTab}
      />
      
      {/* Show Send Transaction component when on portfolio tab and logged in */}
      {showSendTransaction && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <SendTransaction fromAddress={address} />
        </div>
      )}
    </div>
  );
};

export default AlephiumWalletLayout;
