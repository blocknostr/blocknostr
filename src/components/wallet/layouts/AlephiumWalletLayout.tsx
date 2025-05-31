
import React from "react";
import WalletDashboard from "../WalletDashboard";
import { SavedWallet } from "@/api/types/wallet";

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
  walletManagerProps?: any; // Props for the wallet manager popup
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
  walletManagerProps,
}) => {
  return (
    <WalletDashboard
      address={address}
      allWallets={allWallets}
      isLoggedIn={isLoggedIn}
      walletStats={walletStats}
      isStatsLoading={isStatsLoading}
      refreshFlag={refreshFlag}
      setRefreshFlag={setRefreshFlag}
      activeTab={activeTab}
      walletManagerProps={walletManagerProps}
    />
  );
};

export default AlephiumWalletLayout;

