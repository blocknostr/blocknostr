
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, RefreshCw, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAddressBalance } from "@/lib/api/alephiumApi"; 
import { getAlephiumPrice } from "@/lib/api/coingeckoApi";
import { toast } from "sonner";
import { formatCurrency, formatPercentage } from "@/lib/utils/formatters";
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
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error("Could not fetch wallet balance", {
        description: "Please try again later"
      });
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
    <Card className={`bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 ${className}`}>
      <CardContent className="p-3 h-full">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-medium">Balance</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isLoading || isPriceLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading || isPriceLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ) : (
          <div>
            <div className="flex items-baseline">
              <div className="text-xl font-bold">
                {balance !== null ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "0.00"}
              </div>
              <div className="ml-1.5 text-sm font-medium text-primary">ALPH</div>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-2.5 w-2.5" />
                {usdValue !== null 
                  ? isPriceLoading 
                    ? <Skeleton className="h-3 w-12" />
                    : formatCurrency(usdValue)
                  : "$0.00"
                }
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`flex items-center text-[10px] ${
                        priceData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {priceData.priceChange24h >= 0 ? (
                        <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                      )}
                      {formatPercentage(priceData.priceChange24h)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs p-2">
                    <p>24h price change</p>
                    <p className="text-[10px] text-muted-foreground">Current price: {formatCurrency(priceData.price)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {lockedBalance !== null && lockedBalance > 0 && (
              <div className="text-[10px] text-muted-foreground mt-1 flex items-center">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/30 mr-1"></span>
                {lockedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ALPH locked
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletBalanceCard;
