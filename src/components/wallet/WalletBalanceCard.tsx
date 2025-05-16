
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAddressBalance } from "@/lib/api/alephiumApi"; 
import { toast } from "sonner";

interface WalletBalanceCardProps {
  address: string;
  onRefresh?: () => void;
}

const WalletBalanceCard = ({ address, onRefresh }: WalletBalanceCardProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [lockedBalance, setLockedBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
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
  
  useEffect(() => {
    fetchBalance();
  }, [address]);

  const handleRefresh = () => {
    fetchBalance();
    if (onRefresh) onRefresh();
  };
  
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl">Portfolio Balance</CardTitle>
          <CardDescription>Your current Alephium holdings</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold">
              {balance !== null ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "0.00"} ALPH
            </div>
            
            {lockedBalance !== null && lockedBalance > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                + {lockedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ALPH locked
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletBalanceCard;
