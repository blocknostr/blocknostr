
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
import { RefreshCw, Wallet, TrendingUp, TrendingDown, Layers } from "lucide-react";

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
      {/* Top Section: Compact Stats + Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Balance Card - Takes more space */}
        <WalletBalanceCard 
          address={address} 
          onRefresh={() => setRefreshFlag(refreshFlag + 1)}
          className="h-full" 
        />
        
        {/* Compact Stats Cards */}
        <div className="grid grid-cols-2 gap-4 h-full">
          <Card className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-background h-full flex flex-col">
            <CardContent className="p-4 flex flex-col h-full justify-center">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <TrendingDown className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              {isStatsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-xl font-bold">{formatNumber(walletStats.transactionCount)}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">Transactions</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 via-green-400/5 to-background h-full flex flex-col">
            <CardContent className="p-4 flex flex-col h-full justify-center">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Layers className="h-4 w-4 text-green-500" />
                </div>
              </div>
              {isStatsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-xl font-bold">{formatNumber(walletStats.tokenCount)}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">Assets</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Token Distribution Chart */}
        <Card className="h-full">
          <CardContent className="p-4 h-full">
            <h3 className="text-sm font-medium mb-1">Asset Distribution</h3>
            <div className="h-[calc(100%-24px)]">
              <TokenDistributionChart address={address} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Middle Section: Balance History Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 h-[240px]">
          <CardContent className="p-4 h-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Balance History</h3>
              <button 
                onClick={() => setRefreshFlag(refreshFlag + 1)}
                className="p-1 rounded-full hover:bg-muted"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
            <div className="h-[calc(100%-30px)]">
              <BalanceHistoryChart address={address} />
            </div>
          </CardContent>
        </Card>
        
        <NetworkStatsCard />
      </div>
      
      {/* Tabs Section for detailed information */}
      <Tabs defaultValue="tokens" className="w-full">
        <TabsList className="grid grid-cols-4 max-w-md mb-2">
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
          <TabsTrigger value="transactions">History</TabsTrigger>
          <TabsTrigger value="dapps">DApps</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tokens" className="mt-0">
          <TokenList address={address} />
        </TabsContent>
        
        <TabsContent value="nfts" className="mt-0">
          <div className="h-[240px] overflow-y-auto">
            <NFTGallery address={address} />
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-0">
          <div className="h-[240px] overflow-y-auto">
            <TransactionsList address={address} />
          </div>
        </TabsContent>

        <TabsContent value="dapps" className="mt-0">
          <div className="h-[240px] overflow-y-auto">
            <DAppsSection />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletDashboard;
