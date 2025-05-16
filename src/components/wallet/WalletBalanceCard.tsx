
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
  refreshFlag?: number; // Add refreshFlag to trigger refreshes from parent
  isLoggedIn?: boolean; // Add isLoggedIn prop
}

const WalletBalanceCard = ({ 
  address, 
  onRefresh, 
  className = "",
  refreshFlag = 0,
  isLoggedIn = false
}: WalletBalanceCardProps) => {
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
      // Don't show toast for price errors to avoid UI clutter
    } finally {
      setIsPriceLoading(false);
    }
  };
  
  // Fetch data when address changes
  useEffect(() => {
    fetchBalance();
    fetchPrice();
  }, [address]);
  
  // Refresh data when refreshFlag changes (triggered by parent)
  useEffect(() => {
    if (refreshFlag > 0) {
      fetchBalance();
      fetchPrice();
    }
  }, [refreshFlag]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchBalance();
      fetchPrice();
      console.log("Auto-refreshing balance data");
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    return () => clearInterval(refreshInterval); // Cleanup on unmount
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
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-base font-medium">Your Balance</h3>
            <p className="text-sm text-muted-foreground">Current holdings</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isLoading || isPriceLoading}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isPriceLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold">
                  {balance !== null ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "0.00"}
                </div>
                <div className="ml-2 text-lg font-medium text-primary">ALPH</div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {usdValue !== null 
                    ? isPriceLoading 
                      ? <Skeleton className="h-4 w-16" />
                      : formatCurrency(usdValue)
                    : "$0.00"
                  }
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`flex items-center text-xs ${
                          priceData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {priceData.priceChange24h >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatPercentage(priceData.priceChange24h)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>24h price change</p>
                      <p className="text-xs text-muted-foreground">Current price: {formatCurrency(priceData.price)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {lockedBalance !== null && lockedBalance > 0 && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary/30 mr-1.5"></span>
                  {lockedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ALPH locked
                  {priceData.price > 0 && (
                    <span className="ml-1">
                      ({formatCurrency(lockedBalance * priceData.price)})
                    </span>
                  )}
                </div>
              )}
              
              <p className="text-[10px] text-muted-foreground mt-4 flex items-center justify-between">
                <span>Price updated: {formatRelativeTime(priceData.lastUpdated)}</span>
                <span>Balance updated: {lastUpdated.toLocaleTimeString()}</span>
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

import { formatRelativeTime } from "@/lib/utils/formatters";
export default WalletBalanceCard;
