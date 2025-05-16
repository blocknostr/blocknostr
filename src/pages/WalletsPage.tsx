
import React, { useState, useEffect } from "react";
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

// Specify the fixed address if we want to track a specific wallet
const FIXED_ADDRESS = "raLUPHsewjm1iA2kBzRKXB2ntbj3j4puxbVvsZD8iK3r";

const WalletsPage = () => {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState("overview");
  const [walletAddress, setWalletAddress] = useState<string>(FIXED_ADDRESS);
  const [refreshFlag, setRefreshFlag] = useState<number>(0);
  
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
                      <p className="text-2xl font-bold">{Math.floor(Math.random() * 50) + 1}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Received</p>
                      <p className="text-2xl font-bold text-green-500">+{(Math.random() * 500).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Sent</p>
                      <p className="text-2xl font-bold text-blue-500">-{(Math.random() * 300).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Tokens</p>
                      <p className="text-2xl font-bold">{Math.floor(Math.random() * 10) + 1}</p>
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
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => {
                    const isIncoming = Math.random() > 0.5;
                    const amount = (Math.random() * 10).toFixed(2);
                    const timestamp = new Date(Date.now() - i * 86400000 * Math.random());
                    
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${isIncoming ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                            {isIncoming ? (
                              <ArrowDownLeft className={`h-4 w-4 ${isIncoming ? 'text-green-500' : 'text-blue-500'}`} />
                            ) : (
                              <ArrowUpRight className={`h-4 w-4 ${isIncoming ? 'text-green-500' : 'text-blue-500'}`} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{isIncoming ? 'Received' : 'Sent'} ALPH</p>
                            <p className="text-xs text-muted-foreground">
                              {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
