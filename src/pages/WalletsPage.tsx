import React, { useState, useEffect } from "react";
import { useWallet } from "@alephium/web3-react";
import { Wallet, ExternalLink, Blocks, LayoutGrid, ChartLine, PieChart, BarChart, RefreshCw } from "lucide-react";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AddressDisplay from "@/components/wallet/AddressDisplay";
import WalletManager from "@/components/wallet/WalletManager";
import { getAddressTransactions, getAddressTokens } from "@/lib/api/alephiumApi";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { WalletType, SavedWallet } from "@/types/wallet";
import WalletTypeSelector from "@/components/wallet/WalletTypeSelector";
import AlephiumWalletLayout from "@/components/wallet/layouts/AlephiumWalletLayout";
import BitcoinWalletLayout from "@/components/wallet/layouts/BitcoinWalletLayout";
import EthereumWalletLayout from "@/components/wallet/layouts/EthereumWalletLayout";
import SolanaWalletLayout from "@/components/wallet/layouts/SolanaWalletLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokenData } from "@/hooks/useTokenData";
import { generateBitcoinAddressFromBase } from "@/lib/bitcoin/bitcoinUtils";

// Interface for wallet stats
interface WalletStats {
  transactionCount: number;
  receivedAmount: number;
  sentAmount: number;
  tokenCount: number;
}

const WalletsPage = () => {
  const wallet = useWallet();
  const [savedWallets, setSavedWallets] = useLocalStorage<SavedWallet[]>("blocknoster_saved_wallets", []);
  const [walletAddress, setWalletAddress] = useLocalStorage<string>("blocknoster_selected_wallet", "");
  const [refreshFlag, setRefreshFlag] = useState<number>(0);
  const [walletStats, setWalletStats] = useState<WalletStats>({
    transactionCount: 0,
    receivedAmount: 0,
    sentAmount: 0,
    tokenCount: 0
  });
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("portfolio");
  const [selectedWalletType, setSelectedWalletType] = useLocalStorage<WalletType>("blocknoster_wallet_type", "Alephium");
  const [walletConnections, setWalletConnections] = useState<{[key in WalletType]: boolean}>({
    Alephium: false,
    Bitcoin: false,
    Ethereum: false,
    Solana: false
  });
  
  // Get token data for Portfolio view
  const { 
    tokenData, 
    isLoading: isTokenLoading, 
    ownedTokenIds,
    alphPrice,
    tokenPrices,
    refreshTokens
  } = useTokenData(
    savedWallets.map(w => w.address), 
    5 * 60 * 1000 // 5 minutes refresh
  );
  
  // Check if wallet is connected
  const connected = wallet.connectionStatus === 'connected';

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setRefreshFlag(prev => prev + 1);
      console.log("Auto-refreshing wallet data");
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    return () => clearInterval(refreshInterval); // Cleanup on unmount
  }, []);

  // Initialize with connected wallet or first saved wallet
  useEffect(() => {
    if (connected && wallet.account) {
      // If user wallet is connected, use that address
      setWalletAddress(wallet.account.address);
      
      // Add the connected wallet to saved wallets if it doesn't exist
      if (!savedWallets.some(w => w.address === wallet.account?.address)) {
        setSavedWallets(prev => [
          ...prev, 
          { 
            address: wallet.account!.address, 
            label: "Connected Wallet", 
            dateAdded: Date.now() 
          }
        ]);
      }
      
      // Update connection status
      setWalletConnections(prev => ({
        ...prev,
        Alephium: true
      }));
      
      // Notify user of successful connection
      toast.success("Wallet connected successfully", {
        description: `Connected to ${wallet.account.address.substring(0, 6)}...${wallet.account.address.substring(wallet.account.address.length - 4)}`
      });
    } else if (savedWallets.length > 0 && !walletAddress) {
      // If no wallet is connected but we have saved wallets, use the first one
      setWalletAddress(savedWallets[0].address);
    } else if (!walletAddress) {
      // Default demo wallet if no connected wallet and no saved wallets
      const defaultAddress = "raLUPHsewjm1iA2kBzRKXB2ntbj3j4puxbVvsZD8iK3r";
      setWalletAddress(defaultAddress);
      
      // Add default wallet to saved wallets
      if (!savedWallets.some(w => w.address === defaultAddress)) {
        setSavedWallets([{ 
          address: defaultAddress, 
          label: "Demo Wallet", 
          dateAdded: Date.now() 
        }]);
      }
    }
  }, [connected, wallet.account, savedWallets]);

  // Effect to fetch wallet statistics
  useEffect(() => {
    const fetchWalletStats = async () => {
      if (!walletAddress || selectedWalletType !== "Alephium") {
        setIsStatsLoading(false);
        return;
      }
      
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
  }, [walletAddress, refreshFlag, selectedWalletType]);

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
      
      // Update connection status
      setWalletConnections(prev => ({
        ...prev,
        Alephium: false
      }));
      
      // Select the first saved wallet after disconnect
      if (savedWallets.length > 0) {
        setWalletAddress(savedWallets[0].address);
      }
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

  // Generate demo addresses for other chains based on current address
  const generateDemoAddresses = () => {
    if (!walletAddress) return {
      bitcoin: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", // Satoshi's address
      ethereum: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // Vitalik's address
      solana: "JUP6LpbGmQwi6umT72QkXsEqvXwNYqEqYrGhc6FMHDQ"  // Jupiter address
    };
    
    // For Bitcoin, use the TrustWallet compatible generator
    const bitcoin = generateBitcoinAddressFromBase(walletAddress);
    
    return {
      bitcoin,
      ethereum: `0x${walletAddress.substring(2, 42)}`,
      solana: walletAddress.substring(0, 40)
    };
  };

  // Handle wallet type change
  const handleWalletTypeChange = (type: WalletType) => {
    setSelectedWalletType(type);
    if (type === "Alephium") {
      // For Alephium, we already have the full setup
      setActiveTab("portfolio");
    } else {
      // For other chains, we'll start with a clean slate
      setActiveTab("portfolio");
    }
  };

  // Calculate portfolio total value across all tokens
  const calculatePortfolioTotal = () => {
    let total = 0;
    
    Object.values(tokenData).forEach(token => {
      if (token.usdValue) {
        total += token.usdValue;
      }
    });
    
    return total;
  };

  // Format large numbers for display
  const formatLargeNumber = (num: number) => {
    if (num > 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num > 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  // Demo wallet addresses
  const demoAddresses = generateDemoAddresses();

  // Decide whether to show connect screen or wallet dashboard
  if (!connected && savedWallets.length === 0 && !walletAddress) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Blockchain Portfolio Manager</h2>
          <p className="text-muted-foreground max-w-md">
            Connect your wallet to track balances, view transactions, send crypto, and interact with dApps.
          </p>
          
          <div className="w-full max-w-md my-8">
            <WalletConnectButton />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Portfolio Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor your crypto balances in real-time</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Send & Receive</h3>
              <p className="text-sm text-muted-foreground">Transfer tokens with ease</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">DApp Integration</h3>
              <p className="text-sm text-muted-foreground">Interact with blockchain dApps directly</p>
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

  // Show wallet dashboard with either connected wallet or saved address data
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-3xl font-bold tracking-tight">
                Blockchain Wallet
              </h2>
              <WalletTypeSelector 
                selectedWallet={selectedWalletType} 
                onSelectWallet={handleWalletTypeChange}
                walletConnections={walletConnections}
              />
            </div>
            <p className="text-muted-foreground">
              {connected 
                ? `Manage your ${selectedWalletType} assets and dApps` 
                : `Viewing portfolio data for all tracked ${selectedWalletType} wallets`}
            </p>
          </div>
          
          <div className="flex gap-2">
            <WalletConnectButton />
            
            {connected && (
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="h-9">
                Disconnect Wallet
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {selectedWalletType === "Alephium" && (
              <Tabs defaultValue="portfolio" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 max-w-md mb-6">
                  <TabsTrigger value="portfolio" className="flex items-center gap-2">
                    <ChartLine className="h-4 w-4" />
                    <span>My Portfolio</span>
                  </TabsTrigger>
                  <TabsTrigger value="dapps" className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <span>My dApps</span>
                  </TabsTrigger>
                  <TabsTrigger value="alephium" className="flex items-center gap-2">
                    <Blocks className="h-4 w-4" />
                    <span>My Alephium</span>
                  </TabsTrigger>
                </TabsList>

                {/* Improved Portfolio View */}
                <TabsContent value="portfolio" className="space-y-6">
                  {/* Portfolio Summary */}
                  <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Portfolio Overview</CardTitle>
                        <Button variant="outline" size="sm" onClick={refreshTokens} className="h-8">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                      <CardDescription>Your combined assets across all wallets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isTokenLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-12 w-48" />
                          <Skeleton className="h-[200px] w-full" />
                        </div>
                      ) : (
                        <>
                          <div className="mb-6">
                            <div className="text-2xl font-bold">
                              {formatLargeNumber(calculatePortfolioTotal())}
                            </div>
                            <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                          </div>
                          
                          {/* Asset Distribution Chart */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="col-span-2">
                              <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm font-medium">Asset Distribution</CardTitle>
                              </CardHeader>
                              <CardContent className="py-2">
                                <div className="h-[200px] flex items-center justify-center">
                                  <div className="text-center text-muted-foreground text-sm">
                                    <PieChart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    Asset distribution chart
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                              </CardHeader>
                              <CardContent className="py-2">
                                <div className="h-[200px] flex items-center justify-center">
                                  <div className="text-center text-muted-foreground text-sm">
                                    <BarChart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    Performance chart
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          
                          {/* Top Assets Table */}
                          <div>
                            <h3 className="text-lg font-medium mb-3">Top Assets</h3>
                            <div className="rounded-lg border overflow-hidden">
                              <div className="bg-muted/50 grid grid-cols-5 px-4 py-2 text-xs font-medium text-muted-foreground">
                                <div className="col-span-2">Asset</div>
                                <div className="text-right">Price</div>
                                <div className="text-right">Holdings</div>
                                <div className="text-right">Value</div>
                              </div>
                              
                              {Object.values(tokenData)
                                .sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0))
                                .slice(0, 5)
                                .map(token => (
                                  <div key={token.id} className="grid grid-cols-5 px-4 py-3 border-t text-sm">
                                    <div className="col-span-2 flex items-center">
                                      {token.logoURI ? (
                                        <img 
                                          src={token.logoURI} 
                                          alt={token.symbol} 
                                          className="w-6 h-6 mr-2 rounded-full"
                                        />
                                      ) : (
                                        <div className="w-6 h-6 mr-2 rounded-full bg-primary/10 flex items-center justify-center">
                                          <span className="text-xs">{token.symbol?.substring(0, 1)}</span>
                                        </div>
                                      )}
                                      <div>
                                        <div className="font-medium">{token.symbol}</div>
                                        <div className="text-xs text-muted-foreground">{token.name}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {token.priceSource === 'market' ? (
                                        <div>${(token.usdValue || 0) / Number(token.amount) * Math.pow(10, token.decimals)}</div>
                                      ) : (
                                        <div className="text-muted-foreground">-</div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      {token.formattedAmount} {token.symbol}
                                    </div>
                                    <div className="text-right font-medium">
                                      ${token.usdValue?.toFixed(2) || '-'}
                                    </div>
                                  </div>
                                ))}
                                
                              {Object.keys(tokenData).length === 0 && (
                                <div className="px-4 py-6 text-center text-muted-foreground">
                                  No assets found in tracked wallets
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  
                  <AlephiumWalletLayout
                    address={walletAddress}
                    allWallets={savedWallets}
                    isLoggedIn={connected}
                    walletStats={walletStats}
                    isStatsLoading={isStatsLoading}
                    refreshFlag={refreshFlag}
                    setRefreshFlag={setRefreshFlag}
                    activeTab={activeTab}
                  />
                </TabsContent>
                
                <TabsContent value="dapps">
                  {/* Keep existing dApps content */}
                </TabsContent>
                
                <TabsContent value="alephium">
                  {/* Keep existing alephium content */}
                </TabsContent>
              </Tabs>
            )}

            {selectedWalletType === "Bitcoin" && (
              <BitcoinWalletLayout address={demoAddresses.bitcoin} />
            )}

            {selectedWalletType === "Ethereum" && (
              <EthereumWalletLayout address={demoAddresses.ethereum} />
            )}
            
            {selectedWalletType === "Solana" && (
              <SolanaWalletLayout address={demoAddresses.solana} />
            )}
          </div>

          <div>
            <WalletManager 
              currentAddress={walletAddress} 
              onSelectWallet={setWalletAddress} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletsPage;
