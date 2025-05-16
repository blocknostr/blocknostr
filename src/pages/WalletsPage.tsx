
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
import { WalletSummary } from "@/components/wallet/WalletSummary";

// Define an extended signer interface for type safety
interface ExtendedSigner {
  disconnect?: () => void;
  requestDisconnection?: () => void;
}

// Specify the fixed address if we want to track a specific wallet
const FIXED_ADDRESS = "raLUPHsewjm1iA2kBzRKXB2ntbj3j4puxbVvsZD8iK3r";

const WalletsPage = () => {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState("overview");
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string>(FIXED_ADDRESS);
  
  // Check if wallet is connected and set correct wallet address
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

  useEffect(() => {
    // Fetch balance data for the current address
    const fetchBalance = async () => {
      setIsLoading(true);
      
      try {
        // Fetch balance from Alephium Explorer API
        const response = await fetch(`https://backend.mainnet.alephium.org/addresses/${walletAddress}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch balance: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Set the balance from the API response
        setBalance(data.balance?.toString() || "0");
      } catch (error) {
        console.error('Error fetching balance:', error);
        
        // If address is the fixed one and there's an error, show an informative message
        if (walletAddress === FIXED_ADDRESS) {
          toast.info("Using data from a tracked wallet", {
            description: "Connect your own wallet for your personal balance"
          });
          
          // For display purposes, set a placeholder balance
          setBalance("1234560000000000000");
        } else {
          toast.error("Could not fetch wallet balance", {
            description: "Please try again later"
          });
          setBalance("0");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have an address
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress]);

  const handleDisconnect = () => {
    if (wallet.signer) {
      try {
        // Cast the signer to our extended interface
        const extendedSigner = wallet.signer as unknown as ExtendedSigner;
        
        // Check and call appropriate disconnect method if available
        if (extendedSigner.disconnect) {
          extendedSigner.disconnect();
        } else if (extendedSigner.requestDisconnection) {
          extendedSigner.requestDisconnection();
        } else {
          toast.error("Wallet disconnection failed", {
            description: "Your wallet doesn't implement a compatible disconnect method"
          });
          return;
        }
        
        toast.info("Wallet disconnected");
        
        // Reset to fixed address after disconnect
        setWalletAddress(FIXED_ADDRESS);
      } catch (error) {
        console.error("Disconnection error:", error);
        toast.error("Disconnection failed", {
          description: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  };

  // Decide whether to show connect screen or wallet dashboard
  if (!connected && !FIXED_ADDRESS) {
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

  // Show wallet dashboard with either connected wallet or fixed address data
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {connected ? "Your Alephium Wallet" : "Alephium Wallet Tracker"}
          </h2>
          {connected && <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>}
          {!connected && (
            <Button variant="outline" onClick={() => {
              toast.info("Connect your own wallet", {
                description: "Currently viewing a tracked wallet"
              });
            }}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Your Wallet
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

        <WalletBalanceCard balance={balance} isLoading={isLoading} address={walletAddress} />

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
                          {isLoading ? "Loading..." : `${(BigInt(balance || "0") / BigInt(10 ** 18)).toString()} ALPH`}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          {isLoading ? "Loading..." : "Last transaction: Check transactions tab"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
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
            
            {/* Add the new WalletSummary component here */}
            <WalletSummary />
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Perform common wallet operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                    onClick={() => {
                      toast.info("This feature is coming soon");
                    }}
                  >
                    <ArrowUpDown className="h-5 w-5" />
                    <span>Send / Receive</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                    asChild
                  >
                    <a 
                      href={`https://richlist.alephium.world/addresses/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Coins className="h-5 w-5" />
                      <span>View Richlist</span>
                    </a>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                    onClick={() => {
                      toast.info("This feature is coming soon");
                    }}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Buy ALPH</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                    onClick={() => setActiveTab("transactions")}
                  >
                    <History className="h-5 w-5" />
                    <span>Transaction History</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <TransactionsList address={walletAddress} />
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
                  <p className="text-sm text-muted-foreground break-all">
                    {connected ? wallet.account?.address : `Tracking: ${walletAddress}`}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-medium">Network</h3>
                  <p className="text-sm text-muted-foreground">Mainnet</p>
                  <p className="text-xs text-muted-foreground">Advanced network settings are available in your wallet application</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {connected ? (
                  <Button variant="outline" onClick={handleDisconnect}>Disconnect Wallet</Button>
                ) : (
                  <Button variant="outline" disabled>Not Connected</Button>
                )}
                <Button variant="default" onClick={() => toast.info("This feature is coming soon")}>Export Data</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WalletsPage;
