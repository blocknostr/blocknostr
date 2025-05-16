
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAddressBalance } from "@/lib/api/alephiumApi"; 
import { toast } from "sonner";

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
  const [priceChange, setPriceChange] = useState<number>(2.8); // Mock data for price change
  
  const fetchBalance = async () => {
    if (!address) return;
    
    setIsLoading(true);
    
    try {
      const data = await getAddressBalance(address);
      setBalance(data.balance);
      setLockedBalance(data.lockedBalance);
      setLastUpdated(new Date());

      // Generate random price change for demo
      setPriceChange(Math.random() * 6 - 2); // Random between -2% and +4%
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error("Could not fetch wallet balance", {
        description: "Please try again later"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBalance();
  }, [address]);

  const handleRefresh = () => {
    fetchBalance();
    if (onRefresh) onRefresh();
  };

  // Format price with 2 decimal places
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };
  
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
              disabled={isLoading}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
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
                <div className="text-sm text-muted-foreground">
                  Est. Value: $
                  {balance !== null ? formatPrice(balance * 0.78) : "0.00"}
                </div>
                <div 
                  className={`flex items-center text-xs ${
                    priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {priceChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(priceChange).toFixed(2)}%
                </div>
              </div>
              
              {lockedBalance !== null && lockedBalance > 0 && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary/30 mr-1.5"></span>
                  {lockedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ALPH locked
                </div>
              )}
              
              <p className="text-[10px] text-muted-foreground mt-4">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalanceCard;
