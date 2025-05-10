
import { useAlephium } from "@/hooks/use-alephium";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RefreshCcw, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import TokenBalanceItem from "./TokenBalanceItem";

const WalletMenu = () => {
  const { address, formatAddress, balances, isLoading, refreshBalances, disconnectWallet, getExplorerAddressUrl } = useAlephium();
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
  
  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  const mainBalance = balances[0]?.balance || "0";
  
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Wallet</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex flex-col space-y-4">
          {/* Address */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {address ? formatAddress(address) : "Not connected"}
              </span>
              {address && (
                <>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyAddress}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => window.open(getExplorerAddressUrl(address), '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Balance */}
          <div>
            <span className="text-sm text-muted-foreground">Balance</span>
            <div className="text-2xl font-bold">{mainBalance} ALPH</div>
          </div>
          
          <Separator />
          
          {/* Tokens */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Tokens</span>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {balances[0]?.tokens.map((token) => (
                <TokenBalanceItem key={token.id} token={token} />
              ))}
              {(!balances[0]?.tokens || balances[0]?.tokens.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No tokens found
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button onClick={handleDisconnect} variant="outline" className="w-full">
          Disconnect
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WalletMenu;
