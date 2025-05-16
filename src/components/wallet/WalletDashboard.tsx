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
import NFTGallery from "@/components/wallet/NFTGallery";
import DAppsSection from "@/components/wallet/DAppsSection";
import { formatNumber } from "@/lib/utils/formatters";
import NetworkActivityCard from "@/components/wallet/NetworkActivityCard";

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
  activeTab?: string;
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({ 
  address, 
  isLoggedIn, 
  walletStats, 
  isStatsLoading,
  refreshFlag,
  setRefreshFlag,
  activeTab = "portfolio"
}) => {
  // Render appropriate content based on the active tab
  if (activeTab === "portfolio") {
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
        
        <Tabs defaultValue="tokens" className="w-full">
          <TabsList className="grid grid-cols-3 max-w-md mb-4">
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
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
        </Tabs>
      </div>
    );
  }
  
  if (activeTab === "dapps") {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2">Explore Alephium dApps</h3>
          <p className="text-muted-foreground">Discover and interact with decentralized applications on the Alephium blockchain</p>
        </div>
        
        <DAppsSection />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-background">
            <CardHeader>
              <CardTitle>My Favorite dApps</CardTitle>
              <CardDescription>Quick access to your most used applications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Connect your wallet to see your favorite dApps
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-background">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent dApp interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Connect your wallet to see your recent activity
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (activeTab === "alephium") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Network stats card spans 2 columns */}
          <NetworkStatsCard className="md:col-span-2" />
          
          {/* Network activity card */}
          <NetworkActivityCard />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Network Transaction Activity</CardTitle>
              <CardDescription>Transaction volume over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <TransactionActivityChart address={address} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Network Overview</CardTitle>
              <CardDescription>Global Alephium statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Total Addresses</p>
                    <p className="text-sm font-medium">152,789</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Active Nodes</p>
                    <p className="text-sm font-medium">324</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Market Cap</p>
                    <p className="text-sm font-medium">$46.5M</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Tokens Created</p>
                    <p className="text-sm font-medium">385</p>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex gap-2">
                    <a 
                      href="https://richlist.alephium.world/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Richlist
                    </a>
                    <span className="text-xs text-muted-foreground">•</span>
                    <a 
                      href="https://www.alephium.world/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Network Stats
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TransactionsList address={address} />
          <TokenList address={address} />
        </div>
      </div>
    );
  }
  
  // Default fallback content
  return (
    <div className="space-y-6">
      <WalletBalanceCard 
        address={address} 
        onRefresh={() => setRefreshFlag(refreshFlag + 1)}
      />
      
      <TokenList address={address} />
      
      <TransactionsList address={address} />
    </div>
  );
};

export default WalletDashboard;
