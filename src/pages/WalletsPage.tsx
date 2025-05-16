import React, { useState, useEffect, useMemo } from "react";
import { useWallet } from "@alephium/web3-react";
import { Wallet, PieChart, BarChart, LineChart, ArrowUpRight, ArrowDownLeft, Settings, RefreshCw, ExternalLink } from "lucide-react";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import TransactionsList from "@/components/wallet/TransactionsList";
import AddressDisplay from "@/components/wallet/AddressDisplay";
import TokenList from "@/components/wallet/TokenList";
import SendTransaction from "@/components/wallet/SendTransaction";
import DAppsSection from "@/components/wallet/DAppsSection";
import { getAddressTransactions, getAddressTokens } from "@/lib/api/alephiumApi";

// Specify the fixed address if we want to track a specific wallet
const FIXED_ADDRESS = "raLUPHsewjm1iA2kBzRKXB2ntbj3j4puxbVvsZD8iK3r";

// Interface for wallet stats
interface WalletStats {
  transactionCount: number;
  receivedAmount: number;
  sentAmount: number;
  tokenCount: number;
}

const WalletsPage = () => {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState("overview");
  const [walletAddress, setWalletAddress] = useState<string>(FIXED_ADDRESS);
  const [refreshFlag, setRefreshFlag] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isRecentTransactionsLoading, setIsRecentTransactionsLoading] = useState<boolean>(true);
  const [walletStats, setWalletStats] = useState<WalletStats>({
    transactionCount: 0,
    receivedAmount: 0,
    sentAmount: 0,
    tokenCount: 0
  });
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  
  // Check if wallet is connected
  const connected = wallet.connectionStatus === 'connected';

  useEffect(() => {
    if (connected && wallet.account) {
      // If user wallet is connected, use that address instead of fixed one
      setWalletAddress(wallet.account.address);
      
      // Notify user of successful connection
      toast.success("Wallet connected successfully", {
        description: `Connected to ${wallet.account.address.substring(0, 6)}...${wallet.account.address.substring(wallet.account.address.length - 4)}`
      });
    }
  }, [connected, wallet.account]);

  // Effect to fetch recent transactions for the overview tab
  useEffect(() => {
    const fetchRecentTransactions = async () => {
      if (!walletAddress) return;
      
      setIsRecentTransactionsLoading(true);
      try {
        // Fetch just 3 transactions for the recent activity section
        const txs = await getAddressTransactions(walletAddress, 3);
        setRecentTransactions(txs);
      } catch (error) {
        console.error("Error fetching recent transactions:", error);
        // Don't show error toast here as TransactionsList component will handle that
        setRecentTransactions([]);
      } finally {
        setIsRecentTransactionsLoading(false);
      }
    };
    
    fetchRecentTransactions();
  }, [walletAddress, refreshFlag]);

  // Effect to fetch wallet statistics
  useEffect(() => {
    const fetchWalletStats = async () => {
      if (!walletAddress) return;
      
      setIsStatsLoading(true);
      try {
        // Fetch a larger set of transactions for stats calculation
        const transactions = await getAddressTransactions(walletAddress, 50);
        const tokens = await getAddressTokens(walletAddress);
        
        // Calculate stats from transactions
        let received = 0;
        let sent = 0;
        
        transactions.forEach(tx => {
          const type = getTransactionType(tx);
          const amount = getTransactionAmount(tx);
          
          if (type === 'received') {
            received += amount;
          } else if (type === 'sent') {
            sent += amount;
          }
        });
        
        setWalletStats({
          transactionCount: transactions.length,
          receivedAmount: received,
          sentAmount: sent,
          tokenCount: tokens.length
        });
      } catch (error) {
        console.error("Error fetching wallet stats:", error);
        // Keep default zero values on error
      } finally {
        setIsStatsLoading(false);
      }
    };
    
    fetchWalletStats();
  }, [walletAddress, refreshFlag]);

  const handleRefresh = () => {
    setRefreshFlag(prev => prev + 1);
  };

  const handleDisconnect = async () => {
    try {
      if (wallet.signer && (wallet.signer as any).requestDisconnect) {
        await (wallet.signer as any).requestDisconnect();
        toast.info("Wallet disconnected");
      } else {
        toast.error("Wallet disconnection failed", {
          description: "Your wallet doesn't support disconnect method"
        });
        return;
      }
      
      // Reset to fixed address after disconnect
      setWalletAddress(FIXED_ADDRESS);
    } catch (error) {
      console.error("Disconnection error:", error);
      toast.error("Disconnection failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to truncate address
  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };
  
  // Helper to determine if transaction is incoming or outgoing
  const getTransactionType = (tx: any) => {
    // If any output is to this address, it's incoming
    const isIncoming = tx.outputs.some((output: any) => output.address === walletAddress);
    // If any input is from this address, it's outgoing
    const isOutgoing = tx.inputs.some((input: any) => input.address === walletAddress);
    
    if (isIncoming && !isOutgoing) return 'received';
    if (isOutgoing) return 'sent';
    return 'unknown';
  };
  
  // Calculate amount transferred to/from this address
  const getTransactionAmount = (tx: any) => {
    const type = getTransactionType(tx);
    
    if (type === 'received') {
      // Sum all outputs to this address
      const amount = tx.outputs
        .filter((output: any) => output.address === walletAddress)
        .reduce((sum: number, output: any) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    } else if (type === 'sent') {
      // This is a simplification - for accurate accounting we'd need to track change outputs
      const amount = tx.outputs
        .filter((output: any) => output.address !== walletAddress)
        .reduce((sum: number, output: any) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    }
    
    return 0;
  };

  // Format numbers with thousand separators
  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, {
      maximumFractionDigits: 2
    });
  };

  // Decide whether to show connect screen or wallet dashboard
  if (!connected && !FIXED_ADDRESS) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Alephium Portfolio Manager</h2>
          <p className="text-muted-foreground max-w-md">
            Connect your Alephium wallet to track balances, view transactions, send ALPH, and interact with dApps.
          </p>
          
          <div className="w-full max-w-md my-8">
            <WalletConnectButton />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Portfolio Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor your ALPH and token balances in real-time</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Send & Receive</h3>
              <p className="text-sm text-muted-foreground">Transfer ALPH and tokens with ease</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">DApp Integration</h3>
              <p className="text-sm text-muted-foreground">Interact with Alephium dApps directly</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Transaction History</h3>
              <p className="text-sm text-muted-foreground">Detailed history of all your activity</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show wallet dashboard with either connected wallet or fixed address data
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {connected ? "Your Portfolio" : "Alephium Portfolio Tracker"}
          </h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="h-9 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            
            {connected ? (
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="h-9">Disconnect</Button>
            ) : (
              <Button variant="outline" size="sm" className="h-9" asChild>
                <a href="https://alephium.org/#wallets" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span>Get Wallet</span>
                </a>
              </Button>
            )}
          </div>
        </div>

        <AddressDisplay address={walletAddress} />

        {!connected && (
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-sm">
              <p className="flex items-start gap-2 text-amber-800 dark:text-amber-400">
                <ExternalLink className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>
                  Currently tracking wallet <strong>{walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 8)}</strong>.
                  Connect your own wallet to see your personal balance and transactions.
                </span>
              </p>
            </CardContent>
          </Card>
        )}

        <WalletBalanceCard address={walletAddress} onRefresh={handleRefresh} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 max-w-xl">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="tokens" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Tokens</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="dapps" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">DApps</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SendTransaction fromAddress={walletAddress} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Key metrics for your portfolio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      {isStatsLoading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                      ) : (
                        <p className="text-2xl font-bold">{formatNumber(walletStats.transactionCount)}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Received</p>
                      {isStatsLoading ? (
                        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                      ) : (
                        <p className="text-2xl font-bold text-green-500">+{formatNumber(walletStats.receivedAmount)}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Sent</p>
                      {isStatsLoading ? (
                        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                      ) : (
                        <p className="text-2xl font-bold text-blue-500">-{formatNumber(walletStats.sentAmount)}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Tokens</p>
                      {isStatsLoading ? (
                        <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                      ) : (
                        <p className="text-2xl font-bold">{formatNumber(walletStats.tokenCount)}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full" asChild>
                    <a 
                      href={`https://explorer.alephium.org/addresses/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <span>View on Explorer</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {isRecentTransactionsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">No recent transactions found</p>
                ) : (
                  <div className="space-y-4">
                    {recentTransactions.map((tx, i) => {
                      const isIncoming = getTransactionType(tx) === 'received';
                      const amount = getTransactionAmount(tx).toFixed(4);
                      
                      return (
                        <div key={tx.hash} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isIncoming ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                              {isIncoming ? (
                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{isIncoming ? 'Received' : 'Sent'} ALPH</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(tx.timestamp)}
                              </p>
                            </div>
                          </div>
                          <p className={`font-medium ${isIncoming ? 'text-green-500' : 'text-blue-500'}`}>
                            {isIncoming ? '+' : '-'} {amount} ALPH
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" onClick={() => setActiveTab("transactions")}>
                  View All Transactions
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="tokens" className="mt-6">
            <TokenList address={walletAddress} />
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <TransactionsList address={walletAddress} />
          </TabsContent>

          <TabsContent value="dapps" className="mt-6">
            <DAppsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WalletsPage;
