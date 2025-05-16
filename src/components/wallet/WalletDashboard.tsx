import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BalanceHistoryChart from "@/components/wallet/charts/BalanceHistoryChart";
import TokenList from "@/components/wallet/TokenList";
import TransactionsList from "@/components/wallet/TransactionsList";
import NFTGallery from "@/components/wallet/NFTGallery";
import DAppsSection from "@/components/wallet/DAppsSection";
import { formatNumber, formatCurrency } from "@/lib/utils/formatters";
import NetworkActivityCard from "@/components/wallet/NetworkActivityCard";
import { WifiOff, Wifi, DollarSign, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { getAlephiumPrice } from "@/lib/api/coingeckoApi";
import { getAddressBalance, getAddressTokens } from "@/lib/api/alephiumApi";
import { Skeleton } from "@/components/ui/skeleton";
import NetworkStatsCard from "@/components/wallet/NetworkStatsCard";

interface SavedWallet {
  address: string;
  label: string;
  dateAdded: number;
}

interface WalletDashboardProps {
  address: string;
  allWallets?: SavedWallet[];
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
  allWallets = [],
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
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [priceData, setPriceData] = useState<{
    price: number;
    priceChange24h: number;
  }>({ price: 0, priceChange24h: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [allTokens, setAllTokens] = useState<Record<string, any>>({});
  const [totalTokenCount, setTotalTokenCount] = useState(0);

  // Function to update API status that can be passed to child components
  const updateApiStatus = (isLive: boolean) => {
    setApiStatus({ isLive, lastChecked: new Date() });
  };

  // Fetch balance and tokens for all wallets
  useEffect(() => {
    const fetchAllBalances = async () => {
      if (allWallets.length === 0) return;
      
      setIsLoading(true);
      
      try {
        const walletAddresses = allWallets.map(wallet => wallet.address);
        const balancePromises = walletAddresses.map(addr => getAddressBalance(addr));
        const tokenPromises = walletAddresses.map(addr => getAddressTokens(addr));
        const pricePromise = getAlephiumPrice();
        
        const [balanceResults, tokenResults, priceResult] = await Promise.all([
          Promise.allSettled(balancePromises),
          Promise.allSettled(tokenPromises),
          pricePromise
        ]);
        
        // Process balances
        const newBalances: Record<string, number> = {};
        balanceResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            newBalances[walletAddresses[index]] = result.value.balance;
          } else {
            console.error(`Failed to fetch balance for ${walletAddresses[index]}:`, result.reason);
            newBalances[walletAddresses[index]] = 0;
          }
        });
        setBalances(newBalances);
        
        // Process tokens - aggregate all tokens across wallets
        const tokenMap: Record<string, any> = {};
        let totalTokens = 0;
        
        tokenResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const walletAddress = walletAddresses[index];
            const tokens = result.value;
            
            // Count unique tokens for this wallet
            totalTokens += tokens.length;
            
            // Aggregate token data across wallets
            tokens.forEach(token => {
              const tokenId = token.id;
              
              if (!tokenMap[tokenId]) {
                tokenMap[tokenId] = {
                  ...token,
                  wallets: [{ address: walletAddress, amount: token.amount }]
                };
              } else {
                // Token exists in map, add this wallet's amount
                tokenMap[tokenId].wallets.push({ address: walletAddress, amount: token.amount });
                
                // Update total amount for this token (as BigInt to handle large numbers)
                const currentAmount = BigInt(tokenMap[tokenId].amount || "0");
                const additionalAmount = BigInt(token.amount || "0");
                tokenMap[tokenId].amount = (currentAmount + additionalAmount).toString();
                
                // Recalculate formatted amount with new total
                tokenMap[tokenId].formattedAmount = token.isNFT 
                  ? tokenMap[tokenId].amount 
                  : (Number(tokenMap[tokenId].amount) / 10**token.decimals).toLocaleString(
                      undefined, 
                      { minimumFractionDigits: 0, maximumFractionDigits: token.decimals }
                    );
              }
            });
          }
        });
        
        setAllTokens(tokenMap);
        setTotalTokenCount(Object.keys(tokenMap).length);
        
        setPriceData({
          price: priceResult.price,
          priceChange24h: priceResult.priceChange24h
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllBalances();
  }, [allWallets, refreshFlag]);

  // Calculate total balance and USD value
  const totalAlphBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
  const portfolioValue = totalAlphBalance * priceData.price;

  // Render appropriate content based on the active tab
  if (activeTab === "portfolio") {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Portfolio Overview</CardTitle>
                <CardDescription>Combined balance of all tracked wallets</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline">
                    <div className="text-3xl font-bold">
                      {totalAlphBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>
                    <div className="ml-2 text-lg font-medium text-primary">ALPH</div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-sm font-medium flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatCurrency(portfolioValue)}
                    </div>
                    <div 
                      className={`flex items-center text-xs ${
                        priceData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {priceData.priceChange24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {priceData.priceChange24h.toFixed(2)}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span>Tokens:</span>
                    <span className="font-medium">{totalTokenCount}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="h-[250px]">
              <BalanceHistoryChart address={address} />
            </div>
            
            {allWallets.length > 1 && !isLoading && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Individual Wallet Balances</h4>
                <div className="space-y-1.5">
                  {allWallets.map(wallet => (
                    <div key={wallet.address} className="flex justify-between items-center text-xs">
                      <div className="truncate max-w-[180px] text-muted-foreground">
                        {wallet.label || wallet.address.substring(0, 8) + '...'}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>
                          {(balances[wallet.address] || 0).toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 4 
                          })}
                        </span>
                        <span className="text-muted-foreground">ALPH</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="tokens" className="w-full">
          <TabsList className="grid grid-cols-3 max-w-md mb-4">
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tokens" className="mt-0">
            <TokenList address={address} allTokens={Object.values(allTokens)} refreshFlag={refreshFlag} />
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
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>Combined balance of all tracked wallets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <div className="text-3xl font-bold">
              {totalAlphBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
            <div className="ml-2 text-lg font-medium">ALPH</div>
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            {formatCurrency(portfolioValue)}
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            Tokens: {totalTokenCount}
          </div>
        </CardContent>
      </Card>
      
      <TokenList address={address} allTokens={Object.values(allTokens)} refreshFlag={refreshFlag} />
      
      <TransactionsList address={address} />
    </div>
  );
};

export default WalletDashboard;
