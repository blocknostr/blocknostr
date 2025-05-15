
import React, { useState, useEffect } from "react";
import { useWallet } from "@alephium/web3-react";
import { Wallet, CreditCard, History, ArrowUpDown, Coins, Settings, ExternalLink } from "lucide-react";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import TransactionsList from "@/components/wallet/TransactionsList";
import AddressDisplay from "@/components/wallet/AddressDisplay";

const WalletsPage = () => {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState("overview");
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const connected = wallet.connectionStatus === 'connected';

  useEffect(() => {
    if (connected && wallet.account) {
      // Simulate fetching balance (replace with actual API call)
      setIsLoading(true);
      setTimeout(() => {
        setBalance("1,234.56");
        setIsLoading(false);
      }, 1000);

      // Notify user of successful connection
      toast.success("Wallet connected successfully", {
        description: `Connected to ${wallet.account.address.substring(0, 6)}...${wallet.account.address.substring(wallet.account.address.length - 4)}`
      });
    } else {
      setBalance(null);
    }
  }, [connected, wallet.account]);

  const handleDisconnect = () => {
    // Disconnect from wallet using available methods
    if (wallet && wallet.signer) {
      try {
        // Try various methods that might be available on the signer
        if (typeof wallet.signer.disconnect === 'function') {
          (wallet.signer as any).disconnect();
        } else if (typeof wallet.signer.requestDisconnection === 'function') {
          (wallet.signer as any).requestDisconnection();
        } else {
          console.warn("No direct disconnect method found on wallet signer");
        }
        toast.info("Wallet disconnected");
      } catch (error) {
        console.error("Failed to disconnect wallet:", error);
      }
    }
  };

  if (!connected || !wallet.account) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Connect Your Alephium Wallet</h2>
          <p className="text-muted-foreground max-w-md">
            Connect your Alephium wallet to track balances, view transactions, and interact with the Alephium blockchain.
          </p>
          
          <div className="w-full max-w-md my-8">
            <WalletConnectButton />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Track Balances</h3>
              <p className="text-sm text-muted-foreground">Monitor your ALPH and token balances in real-time</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">View Transactions</h3>
              <p className="text-sm text-muted-foreground">See your transaction history and pending operations</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Secure Integration</h3>
              <p className="text-sm text-muted-foreground">Connect safely with Alephium's wallet providers</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Cross-Platform</h3>
              <p className="text-sm text-muted-foreground">Works with desktop and mobile Alephium wallets</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Alephium Wallet</h2>
          <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>
        </div>

        <AddressDisplay address={wallet.account.address} />

        <WalletBalanceCard balance={balance} isLoading={isLoading} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 max-w-md">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Overview</CardTitle>
                <CardDescription>Summary of your Alephium assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {isLoading ? "Loading..." : `${balance} ALPH`}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          {isLoading ? "Loading..." : "Last transaction: 2 hours ago"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <a 
                    href={`https://explorer.alephium.org/addresses/${wallet.account.address}`}
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
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Perform common wallet operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
                    <ArrowUpDown className="h-5 w-5" />
                    <span>Send / Receive</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
                    <Coins className="h-5 w-5" />
                    <span>Tokens</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Buy ALPH</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
                    <History className="h-5 w-5" />
                    <span>Transaction History</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <TransactionsList address={wallet.account.address} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Settings</CardTitle>
                <CardDescription>Customize your wallet experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Connected Wallet</h3>
                  <p className="text-sm text-muted-foreground break-all">{wallet.account.address}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-medium">Network</h3>
                  <p className="text-sm text-muted-foreground">Mainnet</p>
                  <p className="text-xs text-muted-foreground">Advanced network settings are available in your wallet application</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDisconnect}>Disconnect Wallet</Button>
                <Button variant="default">Export Data</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WalletsPage;
