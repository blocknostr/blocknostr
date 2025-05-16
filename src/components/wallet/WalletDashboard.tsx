
import React, { useState } from "react";
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
import { WifiOff, Wifi } from "lucide-react";

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
  const [apiStatus, setApiStatus] = useState<{ isLive: boolean; lastChecked: Date }>({
    isLive: false,
    lastChecked: new Date()
  });

  // Function to update API status that can be passed to child components
  const updateApiStatus = (isLive: boolean) => {
    setApiStatus({ isLive, lastChecked: new Date() });
  };

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
        {/* Network data status indicator */}
        <div className="flex items-center justify-between mb-4 bg-muted/40 rounded-lg p-3">
          <div className="flex items-center gap-2">
            {apiStatus.isLive ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <h3 className="text-sm font-medium">
                Network Data: {apiStatus.isLive ? "Live" : "Simulation"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Last checked: {apiStatus.lastChecked.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="text-xs">
            {apiStatus.isLive ? (
              <span className="inline-flex items-center text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse mr-1.5" />
                Connected to Alephium Explorer
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
                <WifiOff className="h-3 w-3 mr-1.5" />
                Using fallback data
              </span>
            )}
          </div>
        </div>
        
        {/* Network stats card with all the important data */}
        <NetworkStatsCard className="w-full" onStatusUpdate={updateApiStatus} />
        
        {/* Address growth chart */}
        <NetworkActivityCard className="w-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Network Security</CardTitle>
              <CardDescription>How Alephium maintains security through PoLW</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Alephium uses a unique Proof of Less Work (PoLW) consensus algorithm that reduces energy 
                consumption to 1/8th of Bitcoin's traditional PoW while maintaining the same security guarantees.
              </p>
              <div className="rounded-md bg-muted p-3 text-sm">
                <h4 className="font-medium mb-1">BlockFlow Architecture</h4>
                <p>Alephium combines sharding with a DAG structure called BlockFlow to achieve high throughput 
                and security. The network is divided into 4 groups with 16 parallel chains.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Token Economics</CardTitle>
              <CardDescription>ALPH token distribution and utility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The ALPH token is used for transaction fees, smart contract execution, staking, and governance.
              </p>
              <div className="rounded-md bg-muted p-3 text-sm">
                <h4 className="font-medium mb-1">Supply Information</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Max Supply: 1 billion ALPH</li>
                  <li>Circulating Supply: ~110 million ALPH</li>
                  <li>Emission Schedule: Halving every 4 years</li>
                </ul>
              </div>
            </CardContent>
          </Card>
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
