
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import TokenDistributionChart from "@/components/wallet/charts/TokenDistributionChart";
import BalanceHistoryChart from "@/components/wallet/charts/BalanceHistoryChart";
import NetworkStatsCard from "@/components/wallet/NetworkStatsCard";
import TokenList from "@/components/wallet/TokenList";
import TransactionsList from "@/components/wallet/TransactionsList";
import NFTGallery from "@/components/wallet/NFTGallery";
import DAppsSection from "@/components/wallet/DAppsSection";
import { formatNumber } from "@/lib/utils/formatters";
import { TrendingUp, Layers } from "lucide-react";

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      {/* Left column - Balance + Assets */}
      <div className="lg:col-span-6 xl:col-span-5 space-y-3">
        <div className="flex gap-3">
          {/* Main Balance Card */}
          <WalletBalanceCard 
            address={address} 
            onRefresh={() => setRefreshFlag(refreshFlag + 1)}
            className="flex-1"
          />
          
          {/* Quick Stats */}
          <div className="flex flex-col gap-3">
            <Card className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-background">
              <CardContent className="p-3 flex flex-col justify-center h-[72px]">
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1.5 rounded-full bg-blue-500/10">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </div>
                {isStatsLoading ? (
                  <div className="h-5 w-12 bg-muted animate-pulse rounded" />
                ) : (
                  <div className="flex items-baseline gap-1">
                    <div className="text-lg font-bold">{formatNumber(walletStats.transactionCount)}</div>
                    <div className="text-xs text-muted-foreground">Txs</div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/10 via-green-400/5 to-background">
              <CardContent className="p-3 flex flex-col justify-center h-[72px]">
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1.5 rounded-full bg-green-500/10">
                    <Layers className="h-3.5 w-3.5 text-green-500" />
                  </div>
                </div>
                {isStatsLoading ? (
                  <div className="h-5 w-12 bg-muted animate-pulse rounded" />
                ) : (
                  <div className="flex items-baseline gap-1">
                    <div className="text-lg font-bold">{formatNumber(walletStats.tokenCount)}</div>
                    <div className="text-xs text-muted-foreground">Assets</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Network Stats Card */}
        <NetworkStatsCard />
      </div>
      
      {/* Right column - Charts + Content */}
      <div className="lg:col-span-6 xl:col-span-7 space-y-3">
        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Balance History Chart */}
          <Card className="h-[150px]">
            <CardContent className="p-3 h-full">
              <h3 className="text-xs font-medium mb-1">Balance History</h3>
              <div className="h-[calc(100%-20px)]">
                <BalanceHistoryChart address={address} />
              </div>
            </CardContent>
          </Card>
          
          {/* Asset Distribution Chart */}
          <Card className="h-[150px]">
            <CardContent className="p-3 h-full">
              <h3 className="text-xs font-medium mb-1">Asset Distribution</h3>
              <div className="h-[calc(100%-20px)]">
                <TokenDistributionChart address={address} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs Section */}
        <Card className="overflow-hidden">
          <Tabs defaultValue="tokens" className="w-full">
            <div className="border-b px-2 pt-1">
              <TabsList className="grid grid-cols-4 max-w-md h-9">
                <TabsTrigger value="tokens" className="text-xs">Tokens</TabsTrigger>
                <TabsTrigger value="nfts" className="text-xs">NFTs</TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs">History</TabsTrigger>
                <TabsTrigger value="dapps" className="text-xs">DApps</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="max-h-[220px] overflow-y-auto">
              <TabsContent value="tokens" className="mt-0 p-0">
                <TokenList address={address} />
              </TabsContent>
              
              <TabsContent value="nfts" className="mt-0 p-0">
                <NFTGallery address={address} />
              </TabsContent>
              
              <TabsContent value="transactions" className="mt-0 p-0">
                <TransactionsList address={address} />
              </TabsContent>
              
              <TabsContent value="dapps" className="mt-0 p-0">
                <DAppsSection />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default WalletDashboard;
