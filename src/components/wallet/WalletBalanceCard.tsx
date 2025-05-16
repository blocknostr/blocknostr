
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins } from "lucide-react";
import { toast } from "sonner";

interface WalletBalanceCardProps {
  balance: string | null;
  isLoading: boolean;
  address?: string;
}

const WalletBalanceCard = ({ balance, isLoading, address }: WalletBalanceCardProps) => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Format balance with proper decimal precision
  const formatBalance = (balanceStr: string | null) => {
    if (!balanceStr) return "0.00";
    
    try {
      // Convert from ALPH units (smallest denomination) to ALPH using BigInt to handle large numbers
      const balanceInBaseUnits = BigInt(balanceStr);
      const divisor = BigInt(10 ** 18); // ALPH has 18 decimals
      
      // Integer part
      const integerPart = balanceInBaseUnits / divisor;
      
      // Fractional part
      const fractionalBigInt = balanceInBaseUnits % divisor;
      
      if (fractionalBigInt === 0n) {
        // No fractional part
        return integerPart.toString();
      }
      
      // Format fractional part with proper decimal places
      let fractionalStr = fractionalBigInt.toString().padStart(18, '0');
      
      // Trim trailing zeros
      while (fractionalStr.endsWith('0') && fractionalStr.length > 2) {
        fractionalStr = fractionalStr.slice(0, -1);
      }
      
      // Limit to max 4 decimal places for display
      if (fractionalStr.length > 4) {
        fractionalStr = fractionalStr.slice(0, 4);
      }
      
      return `${integerPart}.${fractionalStr}`;
    } catch (error) {
      console.error("Error formatting balance:", error);
      return "Error";
    }
  };
  
  useEffect(() => {
    // Update the timestamp when balance changes or component mounts
    if (!isLoading) {
      setLastUpdated(new Date());
    }
  }, [balance, isLoading]);
  
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl">Wallet Balance</CardTitle>
          <CardDescription>Your current Alephium balance</CardDescription>
        </div>
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Coins className="h-6 w-6 text-primary" />
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
            <div className="text-3xl font-bold">{formatBalance(balance)} ALPH</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletBalanceCard;
