
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import TokenDistributionChart from "@/components/wallet/charts/TokenDistributionChart";
import BalanceHistoryChart from "@/components/wallet/charts/BalanceHistoryChart";
import TransactionActivityChart from "@/components/wallet/charts/TransactionActivityChart";
import NetworkStatsCard from "@/components/wallet/NetworkStatsCard";
import TokenList from "@/components/wallet/TokenList";
import TransactionsList from "@/components/wallet/TransactionsList";
import RecentActivityCard from "@/components/wallet/RecentActivityCard";
import NFTGallery from "@/components/wallet/NFTGallery";
import DAppsSection from "@/components/wallet/DAppsSection";
import { formatNumber } from "@/lib/utils/formatters";

interface WalletDashboardProps {
  address: string;
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
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({ 
  address, 
  isLoggedIn, 
  walletStats, 
  isStatsLoading,
  refreshFlag,
  setRefreshFlag
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <WalletBalanceCard 
          address={address} 
          onRefresh={() => setRefreshFlag(refreshFlag + 1)}
          className="lg:col-span-2" 
        />
        
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Transactions</CardTitle>
            <CardDescription className="text-xs">Total activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">{formatNumber(walletStats.transactionCount)}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              Lifetime transactions
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 via-green-400/5 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Token Assets</CardTitle>
            <CardDescription className="text-xs">Your assets</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">{formatNumber(walletStats.tokenCount)}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              Distinct token types
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Balance History</CardTitle>
            <CardDescription>Your portfolio value over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <BalanceHistoryChart address={address} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Token Distribution</CardTitle>
            <CardDescription>Value by token type</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <TokenDistributionChart address={address} />
          </CardContent>
        </Card>
      </div>

      {/* NFT Gallery Section */}
      <NFTGallery address={address} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaction Activity</CardTitle>
            <CardDescription>Recent transaction volume</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <TransactionActivityChart address={address} />
          </CardContent>
        </Card>
        
        <NetworkStatsCard />
      </div>
      
      <Tabs defaultValue="tokens" className="w-full">
        <TabsList className="grid grid-cols-5 max-w-md mb-4">
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="dapps">DApps</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tokens" className="mt-0">
          <TokenList address={address} />
        </TabsContent>
        
        <TabsContent value="nfts" className="mt-0">
          <NFTGallery address={address} />
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-0">
          <TransactionsList address={address} />
        </TabsContent>

        <TabsContent value="dapps" className="mt-0">
          <DAppsSection />
        </TabsContent>
        
        <TabsContent value="activity" className="mt-0">
          <RecentActivityCard address={address} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletDashboard;
