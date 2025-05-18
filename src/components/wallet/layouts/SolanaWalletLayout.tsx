
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import AddressDisplay from "../AddressDisplay";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SolanaWalletLayoutProps {
  address: string;
}

interface SOLBalance {
  sol: number;
  tokens: Array<{
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    mint: string;
    logo?: string;
  }>;
}

const SolanaWalletLayout: React.FC<SolanaWalletLayoutProps> = ({ address }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<SOLBalance | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [demoMode, setDemoMode] = useLocalStorage("solana_demo_mode", true);

  useEffect(() => {
    fetchSOLData();
    fetchSOLPrice();
  }, [address]);

  const fetchSOLData = async () => {
    setIsLoading(true);
    
    try {
      if (demoMode) {
        // Demo mode with mock data
        setTimeout(() => {
          setBalance({
            sol: 12.345,
            tokens: [
              {
                symbol: "USDC",
                name: "USD Coin",
                balance: "150.25",
                decimals: 6,
                mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
              },
              {
                symbol: "RAY",
                name: "Raydium",
                balance: "45.75",
                decimals: 6,
                mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
                logo: "https://cryptologos.cc/logos/raydium-ray-logo.png"
              },
              {
                symbol: "STEP",
                name: "Step Finance",
                balance: "250",
                decimals: 9,
                mint: "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT",
                logo: null
              }
            ]
          });
          setTransactions([
            {
              signature: "5rL7SYMGXr8waxdP8zc1vLQnzgWT4wNEfT8TNFHGZSYVnQXojJ9ZQXWYYpZF9LUZ3LMXJaNu78KN8QY6BDjF5c9i",
              blockTime: Math.floor(Date.now() / 1000) - 3600,
              slot: 150205548,
              fee: 5000,
              amount: 0.5,
              type: "received"
            },
            {
              signature: "2uvgodsCLHhFUoNiRSRNT7K2PZdMC9grdQRv9i5CQhDxLRrZ6HAS2FhZ66g5tbhVcsfMUfcNJtbfSLYKAESy4XSX",
              blockTime: Math.floor(Date.now() / 1000) - 86400,
              slot: 150105548,
              fee: 5000,
              amount: 1.25,
              type: "sent"
            }
          ]);
          setIsLoading(false);
        }, 1000);
      } else {
        // Would integrate with Solana web3.js or a Solana blockchain API
        // Example implementation would be here, connecting to Solana mainnet
        try {
          // This would be replaced with actual Solana API calls
          // For example using @solana/web3.js:
          /*
          const connection = new Connection("https://api.mainnet-beta.solana.com");
          const publicKey = new PublicKey(address);
          const solBalance = await connection.getBalance(publicKey);
          const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
          */
          
          toast.error("Live mode not implemented in this version");
          setDemoMode(true);
          fetchSOLData(); // Refetch in demo mode
          return;
        } catch (error) {
          console.error("Error fetching from Solana:", error);
          toast.error("Failed to fetch Solana data");
        }
      }
    } catch (error) {
      console.error("Error fetching Solana data:", error);
      setIsLoading(false);
    }
  };

  const fetchSOLPrice = async () => {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
      if (!response.ok) throw new Error("Failed to fetch SOL price");
      const data = await response.json();
      setSolPrice(data.solana.usd);
    } catch (error) {
      console.error("Error fetching SOL price:", error);
      // Default price if API fails
      setSolPrice(125);
    }
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
    toast.success(`${!demoMode ? "Demo" : "Live"} mode activated`);
    fetchSOLData();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-background">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 15.5L16.5 4H19L7.5 15.5H5Z" fill="currentColor"/>
                  <path d="M5 8.5L16.5 20H19L7.5 8.5H5Z" fill="currentColor"/>
                  <path d="M12 12L5 8.5V15.5L12 12Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <CardTitle>Solana Wallet</CardTitle>
                <p className="text-sm text-muted-foreground">View your SOL & SPL tokens</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchSOLData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleDemoMode}
                className="text-xs"
              >
                {demoMode ? "Demo Mode" : "Live Mode"}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <AddressDisplay address={address} label="SOL Address" />
          
          {isLoading ? (
            <div className="mt-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <>
              <div className="mt-6 p-6 bg-card rounded-lg border shadow-sm">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SOL Balance</p>
                  <div className="flex items-baseline">
                    <h2 className="text-3xl font-bold">{balance?.sol.toFixed(4)}</h2>
                    <span className="ml-2 text-lg font-medium text-purple-500">SOL</span>
                  </div>
                  <p className="text-sm font-medium">
                    ≈ ${balance ? (balance.sol * solPrice).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) : "0.00"} USD
                  </p>
                </div>
              </div>

              <Tabs defaultValue="tokens" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="tokens" className="flex-1">Tokens</TabsTrigger>
                  <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
                  <TabsTrigger value="nfts" className="flex-1">NFTs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tokens" className="mt-4">
                  {balance?.tokens && balance.tokens.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {balance.tokens.map(token => (
                          <div key={token.mint} className="p-3 border rounded-lg flex justify-between items-center">
                            <div className="flex items-center">
                              {token.logo ? (
                                <img src={token.logo} alt={token.symbol} className="h-8 w-8 mr-3 rounded-full" />
                              ) : (
                                <div className="h-8 w-8 mr-3 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-purple-500">{token.symbol.substring(0, 2)}</span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{token.symbol}</p>
                                <p className="text-xs text-muted-foreground">{token.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{token.balance}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No tokens found for this address
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="transactions" className="mt-4">
                  {transactions.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {transactions.map(tx => (
                          <div key={tx.signature} className="p-3 border rounded-lg">
                            <div className="flex justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  {tx.type} SOL
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(tx.blockTime * 1000).toLocaleString()}
                                </p>
                              </div>
                              <div className={`text-right ${tx.type === "sent" ? "text-red-500" : "text-green-500"}`}>
                                <p className="font-medium">
                                  {tx.type === "sent" ? "-" : "+"}
                                  {tx.amount} SOL
                                </p>
                                <p className="text-xs">Fee: {tx.fee / 1e9} SOL</p>
                              </div>
                            </div>
                            <div className="mt-2 text-xs flex justify-between text-muted-foreground">
                              <span>Slot: {tx.slot}</span>
                              <span>Sig: {tx.signature.substring(0, 8)}...</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No transactions found for this address
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="nfts">
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">
                      NFT gallery will be implemented in a future update.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SolanaWalletLayout;
