
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import TokenDistributionChart from "@/components/wallet/charts/TokenDistributionChart";
import BalanceHistoryChart from "@/components/wallet/charts/BalanceHistoryChart";
import TokenList from "@/components/wallet/TokenList";
import TransactionsList from "@/components/wallet/TransactionsList";
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
    <div className="space-y-4">
      {/* Main Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Balance Card - Takes more space */}
        <WalletBalanceCard 
          address={address} 
          onRefresh={() => setRefreshFlag(refreshFlag + 1)}
          className="md:col-span-6 lg:col-span-5" 
        />
        
        {/* Balance History Chart */}
        <Card className="md:col-span-6 lg:col-span-7">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base">Balance History</CardTitle>
          </CardHeader>
          <CardContent className="h-[180px] p-2">
            <BalanceHistoryChart address={address} />
          </CardContent>
        </Card>
      </div>
      
      {/* Holdings & Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Stats mini cards */}
        <div className="grid grid-cols-2 gap-3 md:col-span-5 lg:col-span-4">
          <Card className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-background">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Transactions</div>
              {isStatsLoading ? (
                <div className="h-6 w-12 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-lg font-bold">{formatNumber(walletStats.transactionCount)}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 via-green-400/5 to-background">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Assets</div>
              {isStatsLoading ? (
                <div className="h-6 w-12 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-lg font-bold">{formatNumber(walletStats.tokenCount)}</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Token Distribution */}
        <Card className="md:col-span-7 lg:col-span-8">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base">Token Allocation</CardTitle>
          </CardHeader>
          <CardContent className="h-[180px] p-2">
            <TokenDistributionChart address={address} />
          </CardContent>
        </Card>
      </div>
      
      {/* Asset Detail Tabs */}
      <Tabs defaultValue="tokens" className="w-full">
        <TabsList className="grid grid-cols-4 max-w-md">
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="dapps">DApps</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tokens" className="mt-2">
          <TokenList address={address} />
        </TabsContent>
        
        <TabsContent value="nfts" className="mt-2">
          <NFTGallery address={address} />
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-2">
          <TransactionsList address={address} />
        </TabsContent>

        <TabsContent value="dapps" className="mt-2">
          <DAppsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletDashboard;
