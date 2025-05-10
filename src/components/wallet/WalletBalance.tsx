
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { alephiumService } from "@/lib/alephium";
import { Skeleton } from "@/components/ui/skeleton";

const WalletBalance = () => {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [address, setAddress] = useState<string | null>(null);
  
  useEffect(() => {
    // Get initial state
    const walletState = alephiumService.state;
    setBalance(walletState.balance);
    setAddress(walletState.address);
    setIsLoading(!walletState.balance);
    
    // Listen for balance changes
    const handleBalanceChange = (data: { balance: string }) => {
      setBalance(data.balance);
      setIsLoading(false);
    };
    
    alephiumService.on('balanceChanged', handleBalanceChange);
    
    // Update balance if needed
    if (walletState.connected && !walletState.balance) {
      alephiumService.updateBalance().finally(() => {
        setIsLoading(false);
      });
    }
    
    return () => {
      alephiumService.off('balanceChanged', handleBalanceChange);
    };
  }, []);
  
  // Format balance for display
  const formatBalance = (balanceStr: string): string => {
    try {
      // Convert from smallest unit to ALPH
      const balanceNum = parseFloat(balanceStr) / 10**18;
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      }).format(balanceNum);
    } catch {
      return '0.00';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Wallet Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Address:</span>
            {address ? (
              <div className="font-mono text-sm bg-muted p-2 rounded mt-1 truncate">
                {address}
              </div>
            ) : (
              <Skeleton className="h-8 w-full mt-1" />
            )}
          </div>
          
          <div>
            <span className="text-sm text-muted-foreground">Balance:</span>
            {isLoading ? (
              <Skeleton className="h-12 w-full mt-1" />
            ) : (
              <div className="flex items-baseline mt-1">
                <span className="text-3xl font-bold">
                  {balance ? formatBalance(balance) : '0.00'}
                </span>
                <span className="ml-2 text-xl">ALPH</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalance;
