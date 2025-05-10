
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAlephium } from "@/hooks/use-alephium";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, RefreshCcw, Wallet } from "lucide-react";
import { toast } from "sonner";
import TokenBalanceItem from "@/components/wallet/TokenBalanceItem";
import { Separator } from "@/components/ui/separator";
import { AlephiumConnectButton } from "@/lib/alephium";

const WalletPage = () => {
  const { 
    isConnected,
    address,
    formatAddress,
    balances,
    isLoading,
    refreshBalances,
    getExplorerAddressUrl
  } = useAlephium();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    setIsRefreshing(false);
  };
  
  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    }
  };

  const mainBalance = balances[0]?.balance || "0";
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet
            </h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading || !isConnected}
              >
                <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </header>
        
        <div className="max-w-3xl mx-auto px-4 py-6">
          {!isConnected ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                <Wallet className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Connect your Alephium wallet to view your balances and transactions
                </p>
                <AlephiumConnectButton.Custom>
                  {({ isConnecting, openConnectModal }) => (
                    <Button 
                      onClick={openConnectModal} 
                      disabled={isConnecting} 
                      className="mt-4"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                  )}
                </AlephiumConnectButton.Custom>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tokens">Tokens</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Wallet Overview</CardTitle>
                    <CardDescription>
                      View and manage your Alephium wallet
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Address */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Address</h3>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                        <span className="text-sm flex-1 break-all">
                          {address}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyAddress}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => window.open(getExplorerAddressUrl(address!), '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Balance */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Balance</h3>
                      <div className="p-6 bg-muted rounded-md flex justify-center items-center">
                        <div className="text-center">
                          <div className="text-4xl font-bold">{mainBalance}</div>
                          <div className="text-lg mt-1">ALPH</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="pt-4">
                      <AlephiumConnectButton.Custom>
                        {({ disconnect }) => (
                          <Button 
                            onClick={() => disconnect()} 
                            variant="outline" 
                            className="w-full"
                          >
                            Disconnect Wallet
                          </Button>
                        )}
                      </AlephiumConnectButton.Custom>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tokens">
                <Card>
                  <CardHeader>
                    <CardTitle>Token Balances</CardTitle>
                    <CardDescription>
                      View all tokens in your wallet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {balances[0]?.tokens.map((token) => (
                        <div key={token.id}>
                          <TokenBalanceItem token={token} />
                          <Separator className="my-2" />
                        </div>
                      ))}
                      {(!balances[0]?.tokens || balances[0]?.tokens.length === 0) && (
                        <div className="text-center py-10 text-muted-foreground">
                          No tokens found in your wallet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>
                      View your recent transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-10 text-muted-foreground">
                      Transaction history will be available in a future update
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
