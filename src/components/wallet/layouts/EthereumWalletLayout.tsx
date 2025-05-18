
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Wallet } from "lucide-react";
import AddressDisplay from "../AddressDisplay";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EthereumWalletLayoutProps {
  address: string;
}

interface ETHBalance {
  eth: number;
  tokens: Array<{
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    tokenAddress: string;
    logo?: string;
  }>;
}

const EthereumWalletLayout: React.FC<EthereumWalletLayoutProps> = ({ address }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<ETHBalance | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [demoMode, setDemoMode] = useLocalStorage("ethereum_demo_mode", true);

  useEffect(() => {
    fetchETHData();
    fetchETHPrice();
  }, [address]);

  const fetchETHData = async () => {
    setIsLoading(true);
    
    try {
      if (demoMode) {
        // Demo mode with mock data
        setTimeout(() => {
          setBalance({
            eth: 1.245,
            tokens: [
              {
                symbol: "USDT",
                name: "Tether USD",
                balance: "325.75",
                decimals: 6,
                tokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
                logo: "https://cryptologos.cc/logos/tether-usdt-logo.png"
              },
              {
                symbol: "UNI",
                name: "Uniswap",
                balance: "12.5",
                decimals: 18,
                tokenAddress: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                logo: "https://cryptologos.cc/logos/uniswap-uni-logo.png"
              }
            ]
          });
          setTransactions([
            {
              hash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s",
              timeStamp: Math.floor(Date.now() / 1000) - 3600,
              value: "0.125",
              gasPrice: "50",
              from: "0xabcdef1234567890abcdef1234567890abcdef12",
              to: address,
              isError: "0"
            },
            {
              hash: "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s1a",
              timeStamp: Math.floor(Date.now() / 1000) - 86400,
              value: "0.05",
              gasPrice: "45",
              from: address,
              to: "0x1234567890abcdef1234567890abcdef12345678",
              isError: "0"
            }
          ]);
          setIsLoading(false);
        }, 1000);
      } else {
        // Would integrate with Etherscan API or other providers
        // Required API key for full implementation
        const etherscanApiKey = "YourEtherscanApiKey"; // Would normally be stored securely
        const baseUrl = "https://api.etherscan.io/api";
        
        try {
          // Get ETH balance
          const balanceResponse = await fetch(
            `${baseUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanApiKey}`
          );
          
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            if (balanceData.status === "1") {
              // Get token balances
              const tokenResponse = await fetch(
                `${baseUrl}?module=account&action=tokenbalance&address=${address}&tag=latest&apikey=${etherscanApiKey}`
              );
              
              let tokens = [];
              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                if (tokenData.status === "1" && Array.isArray(tokenData.result)) {
                  tokens = tokenData.result;
                }
              }
              
              setBalance({
                eth: parseInt(balanceData.result) / 1e18,
                tokens
              });
              
              // Get transactions
              const txResponse = await fetch(
                `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`
              );
              
              if (txResponse.ok) {
                const txData = await txResponse.json();
                if (txData.status === "1") {
                  setTransactions(txData.result.slice(0, 10));
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching from Etherscan:", error);
          toast.error("Failed to fetch Ethereum data from Etherscan");
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching Ethereum data:", error);
      toast.error("Failed to fetch Ethereum data");
      setIsLoading(false);
    }
  };

  const fetchETHPrice = async () => {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
      if (!response.ok) throw new Error("Failed to fetch ETH price");
      const data = await response.json();
      setEthPrice(data.ethereum.usd);
    } catch (error) {
      console.error("Error fetching ETH price:", error);
      // Default price if API fails
      setEthPrice(3500);
    }
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
    toast.success(`${!demoMode ? "Demo" : "Live"} mode activated`);
    fetchETHData();
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-background">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1.75L5.75 12.25L12 16L18.25 12.25L12 1.75Z" fill="currentColor"/>
                  <path d="M12 16L5.75 12.25L12 22.25L18.25 12.25L12 16Z" fill="currentColor" fillOpacity="0.6"/>
                </svg>
              </div>
              <div>
                <CardTitle>Ethereum Wallet</CardTitle>
                <p className="text-sm text-muted-foreground">View your ETH & ERC20 tokens</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchETHData}
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
          <AddressDisplay address={address} label="ETH Address" />
          
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
                  <p className="text-sm text-muted-foreground">ETH Balance</p>
                  <div className="flex items-baseline">
                    <h2 className="text-3xl font-bold">{balance?.eth.toFixed(4)}</h2>
                    <span className="ml-2 text-lg font-medium text-blue-500">ETH</span>
                  </div>
                  <p className="text-sm font-medium">
                    ≈ ${balance ? (balance.eth * ethPrice).toLocaleString(undefined, {
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
                          <div key={token.tokenAddress} className="p-3 border rounded-lg flex justify-between items-center">
                            <div className="flex items-center">
                              {token.logo ? (
                                <img src={token.logo} alt={token.symbol} className="h-8 w-8 mr-3 rounded-full" />
                              ) : (
                                <div className="h-8 w-8 mr-3 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-500">{token.symbol.substring(0, 2)}</span>
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
                          <div key={tx.hash} className="p-3 border rounded-lg">
                            <div className="flex justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  {tx.from.toLowerCase() === address.toLowerCase() ? "Sent" : "Received"} ETH
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(parseInt(tx.timeStamp) * 1000).toLocaleString()}
                                </p>
                              </div>
                              <div className={`text-right ${tx.from.toLowerCase() === address.toLowerCase() ? "text-red-500" : "text-green-500"}`}>
                                <p className="font-medium">
                                  {tx.from.toLowerCase() === address.toLowerCase() ? "-" : "+"}
                                  {(parseInt(tx.value) / 1e18).toFixed(6)} ETH
                                </p>
                                <p className="text-xs">Gas: {(parseInt(tx.gasPrice) / 1e9)} Gwei</p>
                              </div>
                            </div>
                            <div className="mt-2 text-xs flex justify-between text-muted-foreground">
                              <span>From: {formatAddress(tx.from)}</span>
                              <span>To: {formatAddress(tx.to)}</span>
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

export default EthereumWalletLayout;
