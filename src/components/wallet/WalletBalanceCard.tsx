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
  
  // Format balance with commas for thousands, respecting ALPH's 18 decimal precision
  const formatBalance = (balanceStr: string | null) => {
    if (!balanceStr) return "0.00";
    
    // Convert from ALPH units (smallest denomination) to ALPH with proper precision
    // ALPH specifically uses 18 decimals
    try {
      const decimals = 18; // ALPH uses 18 decimals
      const rawValue = BigInt(balanceStr);
      const divisor = BigInt(10 ** decimals);
      
      if (rawValue === BigInt(0)) return "0.00";
      
      // Convert to a decimal string with proper precision
      const wholePart = rawValue / divisor;
      const fractionalPart = rawValue % divisor;
      
      // Format the fractional part to have leading zeros if needed
      let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      
      // Trim trailing zeros but keep at least 2 decimal places
      while (fractionalStr.length > 2 && fractionalStr.endsWith('0')) {
        fractionalStr = fractionalStr.slice(0, -1);
      }
      
      // Format the whole part with commas
      const formattedWhole = wholePart.toLocaleString();
      
      return `${formattedWhole}.${fractionalStr.slice(0, 4)}`;
    } catch (error) {
      console.error("[WalletBalanceCard] Error formatting balance:", error);
      return "0.00";
    }
  };
  
  // Update last updated timestamp whenever balance changes
  useEffect(() => {
    if (!isLoading && balance) {
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
