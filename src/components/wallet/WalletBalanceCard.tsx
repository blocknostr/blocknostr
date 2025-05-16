
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAddressBalance } from "@/lib/api/alephiumApi"; 
import { getAlephiumPrice } from "@/lib/api/coingeckoApi";
import { toast } from "sonner";
import { formatCurrency, formatPercentage, formatRelativeTime } from "@/lib/utils/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WalletBalanceCardProps {
  address: string;
  onRefresh?: () => void;
  className?: string;
}

const WalletBalanceCard = ({ address, onRefresh, className = "" }: WalletBalanceCardProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [lockedBalance, setLockedBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [priceData, setPriceData] = useState<{
    price: number;
    priceChange24h: number;
    lastUpdated: Date;
  }>({ price: 0, priceChange24h: 0, lastUpdated: new Date() });
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  
  const fetchBalance = async () => {
    if (!address) return;
    
    setIsLoading(true);
    
    try {
      const data = await getAddressBalance(address);
      setBalance(data.balance);
      setLockedBalance(data.lockedBalance);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error("Could not fetch wallet balance");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrice = async () => {
    setIsPriceLoading(true);
    try {
      const data = await getAlephiumPrice();
      setPriceData(data);
    } catch (error) {
      console.error('Error fetching ALPH price:', error);
    } finally {
      setIsPriceLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBalance();
    fetchPrice();
  }, [address]);

  const handleRefresh = () => {
    fetchBalance();
    fetchPrice();
    if (onRefresh) onRefresh();
  };

  // Calculate USD value
  const usdValue = balance !== null ? balance * priceData.price : null;
  
  return (
    <Card className={`bg-gradient-to-br from-primary/20 to-background border-primary/20 ${className}`}>
      <CardContent className="p-4 relative">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isLoading || isPriceLoading}
          className="h-6 w-6 p-0 absolute right-3 top-3"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isPriceLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Portfolio Balance</div>
          
          {isLoading ? (
            <Skeleton className="h-9 w-32 mb-1" />
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  {formatCurrency(usdValue || 0)}
                </div>
                
                <div className={`text-sm flex items-center ${
                  priceData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {priceData.priceChange24h >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 mr-1" />
                  )}
                  {formatPercentage(priceData.priceChange24h)}
                </div>
              </div>
              
              <div className="flex items-baseline gap-2">
                <div className="text-lg font-semibold">
                  {balance !== null ? balance.toFixed(4) : "0.0000"}
                  <span className="ml-1 text-sm font-medium text-primary">ALPH</span>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-xs text-muted-foreground cursor-help">
                        {isPriceLoading ? "..." : `@ ${priceData.price.toFixed(4)} USD`}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-xs">Price updated: {formatRelativeTime(priceData.lastUpdated)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {lockedBalance !== null && lockedBalance > 0 && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/30 mr-1"></span>
                  {lockedBalance.toFixed(4)} ALPH locked
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalanceCard;
