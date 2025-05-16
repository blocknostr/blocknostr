
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WalletBalanceCard from "./WalletBalanceCard";
import TokenList from "./TokenList";
import NFTGallery from "./NFTGallery";
import TransactionsList from "./TransactionsList";
import DAppsSection from "./DAppsSection";
import NetworkStatsCard from "./NetworkStatsCard";
import NetworkActivityCard from "./NetworkActivityCard";
import RecentActivityCard from "./RecentActivityCard";
import TokenTransactionsDashboard from "./TokenTransactionsDashboard";

interface SavedWallet {
  address: string;
  label: string;
  dateAdded: number;
}

interface WalletDashboardProps {
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
  activeTab?: string;
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({
  address,
  allWallets,
  isLoggedIn,
  walletStats,
  isStatsLoading,
  refreshFlag,
  setRefreshFlag,
  activeTab = "portfolio"
}) => {
  // If we're in portfolio tab
  if (activeTab === "portfolio") {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <WalletBalanceCard
              address={address}
              isLoggedIn={isLoggedIn}
              refreshFlag={refreshFlag}
            />
          </div>
          <div>
            <RecentActivityCard
              address={address}
              stats={walletStats}
              isLoading={isStatsLoading}
              refreshFlag={refreshFlag}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2">
            <TransactionsList address={address} />
          </div>
          <div>
            <TokenList address={address} />
          </div>
        </div>
        
        <div className="mt-6">
          <NFTGallery address={address} />
        </div>
      </>
    );
  }
  
  // If we're in dapps tab
  else if (activeTab === "dapps") {
    return (
      <>
        <DAppsSection address={address} isLoggedIn={isLoggedIn} />
      </>
    );
  }
  
  // If we're in alephium tab
  else if (activeTab === "alephium") {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <NetworkStatsCard refreshFlag={refreshFlag} />
          </div>
          <div>
            <NetworkActivityCard refreshFlag={refreshFlag} />
          </div>
        </div>
        
        <div className="mt-6">
          <TokenTransactionsDashboard address={address} />
        </div>
      </>
    );
  }
  
  // Default fallback
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>Invalid tab selected</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Please select a valid tab.</p>
      </CardContent>
    </Card>
  );
};

export default WalletDashboard;
