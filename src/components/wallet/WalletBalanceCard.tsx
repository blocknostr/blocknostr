
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
  
  // Format balance with commas for thousands
  const formatBalance = (balanceStr: string | null) => {
    if (!balanceStr) return "0.00";
    
    // Convert from ALPH units (smallest denomination) to ALPH
    const balanceInALPH = parseFloat(balanceStr) / 10**18;
    return balanceInALPH.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };
  
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
