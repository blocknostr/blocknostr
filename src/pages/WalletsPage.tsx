
import React, { useState, useEffect } from "react";
import { useWallet } from "@alephium/web3-react";
import { Wallet, ExternalLink, Blocks, Apps, ChartLineUp } from "lucide-react";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AddressDisplay from "@/components/wallet/AddressDisplay";
import WalletDashboard from "@/components/wallet/WalletDashboard";
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
  const [walletAddress, setWalletAddress] = useState<string>(FIXED_ADDRESS);
  const [refreshFlag, setRefreshFlag] = useState<number>(0);
  const [walletStats, setWalletStats] = useState<WalletStats>({
    transactionCount: 0,
    receivedAmount: 0,
    sentAmount: 0,
    tokenCount: 0
  });
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("portfolio");
  
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
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">
              {connected ? "Alephium Wallet" : "Alephium Portfolio Tracker"}
            </h2>
            <p className="text-muted-foreground">
              {connected 
                ? "Manage your Alephium assets and dApps" 
                : "Viewing public wallet data"}
            </p>
          </div>
          
          {connected && (
            <Button variant="outline" size="sm" onClick={handleDisconnect} className="h-9">
              Disconnect Wallet
            </Button>
          )}
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

        <Tabs defaultValue="portfolio" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 max-w-md mb-6">
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <ChartLineUp className="h-4 w-4" />
              <span>My Portfolio</span>
            </TabsTrigger>
            <TabsTrigger value="dapps" className="flex items-center gap-2">
              <Apps className="h-4 w-4" />
              <span>My dApps</span>
            </TabsTrigger>
            <TabsTrigger value="alephium" className="flex items-center gap-2">
              <Blocks className="h-4 w-4" />
              <span>My Alephium</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-0 space-y-6">
            <WalletDashboard
              address={walletAddress}
              isLoggedIn={connected}
              walletStats={walletStats}
              isStatsLoading={isStatsLoading}
              refreshFlag={refreshFlag}
              setRefreshFlag={setRefreshFlag}
              activeTab="portfolio"
            />
          </TabsContent>

          <TabsContent value="dapps" className="mt-0 space-y-6">
            <WalletDashboard
              address={walletAddress}
              isLoggedIn={connected}
              walletStats={walletStats}
              isStatsLoading={isStatsLoading}
              refreshFlag={refreshFlag}
              setRefreshFlag={setRefreshFlag}
              activeTab="dapps"
            />
          </TabsContent>

          <TabsContent value="alephium" className="mt-0 space-y-6">
            <WalletDashboard
              address={walletAddress}
              isLoggedIn={connected}
              walletStats={walletStats}
              isStatsLoading={isStatsLoading}
              refreshFlag={refreshFlag}
              setRefreshFlag={setRefreshFlag}
              activeTab="alephium"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WalletsPage;
