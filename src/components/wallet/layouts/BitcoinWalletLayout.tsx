
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bitcoin, RefreshCw, QrCode, Copy, CheckCircle2 } from "lucide-react";
import AddressDisplay from "../AddressDisplay";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";
import { validateBitcoinAddress, generateBitcoinQRCode } from "@/lib/bitcoin/bitcoinUtils";
import { BTCBalance, BTCTransaction } from "@/types/wallet";
import { Badge } from "@/components/ui/badge";

interface BitcoinWalletLayoutProps {
  address: string;
}

const BitcoinWalletLayout: React.FC<BitcoinWalletLayoutProps> = ({ address }) => {
  const [activeTab, setActiveTab] = useState("portfolio");
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<BTCBalance | null>(null);
  const [transactions, setTransactions] = useState<BTCTransaction[]>([]);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [demoMode, setDemoMode] = useLocalStorage("bitcoin_demo_mode", true);
  const [addressInfo, setAddressInfo] = useState<{isValid: boolean; type: string | null}>({
    isValid: false, 
    type: null
  });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Validate the Bitcoin address when it changes
  useEffect(() => {
    const validateAddress = async () => {
      const result = await validateBitcoinAddress(address);
      setAddressInfo(result);
      
      // Generate QR code for valid addresses
      if (result.isValid) {
        try {
          const qrCodeData = await generateBitcoinQRCode(address);
          setQrCode(qrCodeData);
        } catch (error) {
          console.error("Error generating QR code:", error);
        }
      }
    };
    
    validateAddress();
  }, [address]);

  useEffect(() => {
    fetchBTCData();
    fetchBTCPrice();
  }, [address]);

  const fetchBTCData = async () => {
    setIsLoading(true);
    
    try {
      if (demoMode) {
        // In demo mode, use mock data
        setTimeout(() => {
          setBalance({
            confirmedBalance: 0.0512,
            unconfirmedBalance: 0.0012,
            totalBalance: 0.0524
          });
          setTransactions([
            { 
              txid: "3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
              confirmations: 6,
              time: Date.now() / 1000 - 3600,
              amount: 0.005,
              type: "received",
              block_height: 800123
            },
            {
              txid: "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s",
              confirmations: 120,
              time: Date.now() / 1000 - 86400,
              amount: 0.0012,
              type: "sent",
              fee: 0.00001,
              block_height: 800100
            }
          ]);
          setIsLoading(false);
        }, 1000);
      } else {
        try {
          // Try to fetch using blockstream.info API
          const response = await fetch(`https://blockstream.info/api/address/${address}`);
          
          if (!response.ok) throw new Error("Failed to fetch BTC data");
          
          const data = await response.json();
          
          // Format the data appropriately
          setBalance({
            confirmedBalance: data.chain_stats.funded_txo_sum / 100000000,
            unconfirmedBalance: data.mempool_stats.funded_txo_sum / 100000000,
            totalBalance: (data.chain_stats.funded_txo_sum + data.mempool_stats.funded_txo_sum) / 100000000
          });
          
          // Fetch transactions
          const txResponse = await fetch(`https://blockstream.info/api/address/${address}/txs`);
          
          if (txResponse.ok) {
            const txData = await txResponse.json();
            const formattedTransactions: BTCTransaction[] = txData.slice(0, 10).map((tx: any) => {
              // Determine if transaction is incoming or outgoing
              const isIncoming = tx.vout.some((output: any) => 
                output.scriptpubkey_address === address
              );
              
              // Calculate amount
              let amount = 0;
              if (isIncoming) {
                amount = tx.vout
                  .filter((output: any) => output.scriptpubkey_address === address)
                  .reduce((sum: number, output: any) => sum + output.value, 0) / 100000000;
              } else {
                amount = tx.vout
                  .filter((output: any) => output.scriptpubkey_address !== address)
                  .reduce((sum: number, output: any) => sum + output.value, 0) / 100000000;
              }
              
              return {
                txid: tx.txid,
                confirmations: tx.status.confirmed ? tx.status.block_height : 0,
                time: tx.status.block_time || Date.now() / 1000,
                amount: amount,
                type: isIncoming ? 'received' : 'sent',
                block_height: tx.status.block_height
              };
            });
            
            setTransactions(formattedTransactions);
          }
        } catch (error) {
          console.error("Error fetching from Blockstream API:", error);
          
          // Fallback to demo data
          setBalance({
            confirmedBalance: 0.0512,
            unconfirmedBalance: 0.0012,
            totalBalance: 0.0524
          });
          
          setTransactions([
            { 
              txid: "3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
              confirmations: 6,
              time: Date.now() / 1000 - 3600,
              amount: 0.005,
              type: "received"
            },
            {
              txid: "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s",
              confirmations: 120,
              time: Date.now() / 1000 - 86400,
              amount: 0.0012,
              type: "sent"
            }
          ]);
          
          toast.error("Using fallback data for Bitcoin wallet", {
            description: "Could not connect to Bitcoin network"
          });
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching Bitcoin data:", error);
      toast.error("Failed to fetch Bitcoin data");
      setIsLoading(false);
    }
  };

  const fetchBTCPrice = async () => {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
      if (!response.ok) throw new Error("Failed to fetch BTC price");
      const data = await response.json();
      setBtcPrice(data.bitcoin.usd);
    } catch (error) {
      console.error("Error fetching BTC price:", error);
      // Default price if API fails
      setBtcPrice(58000);
    }
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
    toast.success(`${!demoMode ? "Demo" : "Live"} mode activated`);
    fetchBTCData();
  };
  
  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(address);
    setIsCopied(true);
    toast.success("Address copied to clipboard");
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-background">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Bitcoin className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <CardTitle>Bitcoin Wallet</CardTitle>
                <p className="text-sm text-muted-foreground">View your BTC holdings</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchBTCData}
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
          <div className="flex flex-col gap-2">
            <AddressDisplay address={address} label="BTC Address" />
            
            {/* Address validation status */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <div className={`h-2 w-2 rounded-full ${addressInfo.isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {addressInfo.isValid ? (
                <span>Valid {addressInfo.type || 'Bitcoin'} address</span>
              ) : (
                <span>Invalid Bitcoin address format</span>
              )}
              
              {addressInfo.type && (
                <Badge variant="outline" className="text-[10px] h-5 ml-1">
                  {addressInfo.type}
                </Badge>
              )}
            </div>
          </div>
          
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
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <div className="flex items-baseline">
                    <h2 className="text-3xl font-bold">{balance?.totalBalance.toFixed(8)}</h2>
                    <span className="ml-2 text-lg font-medium text-orange-500">BTC</span>
                  </div>
                  <p className="text-sm font-medium">
                    ≈ ${balance ? (balance.totalBalance * btcPrice).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) : "0.00"} USD
                  </p>
                </div>
                
                <div className="grid grid-cols-2 mt-4 gap-4">
                  <div className="p-3 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Confirmed</p>
                    <p className="font-medium">{balance?.confirmedBalance.toFixed(8)} BTC</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Unconfirmed</p>
                    <p className="font-medium">{balance?.unconfirmedBalance.toFixed(8)} BTC</p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="transactions" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
                  <TabsTrigger value="send" className="flex-1">Send</TabsTrigger>
                  <TabsTrigger value="receive" className="flex-1">Receive</TabsTrigger>
                </TabsList>
                
                <TabsContent value="transactions" className="mt-4">
                  {transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map(tx => (
                        <div key={tx.txid} className="p-3 border rounded-lg flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">
                              {tx.type === "received" ? "Received" : "Sent"} BTC
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.time * 1000).toLocaleString()}
                            </p>
                            {tx.block_height && (
                              <p className="text-xs text-muted-foreground">
                                Block: {tx.block_height}
                              </p>
                            )}
                          </div>
                          <div className={`text-right ${tx.type === "received" ? "text-green-500" : "text-red-500"}`}>
                            <p className="font-medium">{tx.type === "received" ? "+" : "-"}{tx.amount.toFixed(8)}</p>
                            <p className="text-xs">{tx.confirmations} confirmations</p>
                            {tx.fee && <p className="text-xs text-muted-foreground">Fee: {tx.fee.toFixed(8)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No transactions found for this address
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="send">
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">
                      Send functionality will be implemented in a future update.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="receive">
                  <div className="p-4">
                    <div className="bg-muted p-4 rounded-lg text-center mb-4 relative">
                      <p className="font-mono text-sm break-all">{address}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 p-0"
                        onClick={copyAddressToClipboard}
                      >
                        {isCopied ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      {qrCode ? (
                        <div className="h-48 w-48 flex items-center justify-center bg-white p-2 rounded-lg">
                          <img src={qrCode} alt="Bitcoin Address QR Code" className="max-w-full max-h-full" />
                        </div>
                      ) : (
                        <div className="h-48 w-48 border-2 border-dashed rounded-lg flex items-center justify-center">
                          <QrCode className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                      )}
                    </div>
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

export default BitcoinWalletLayout;
