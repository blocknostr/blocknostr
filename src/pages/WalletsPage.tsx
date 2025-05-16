import React, { useState, useEffect } from "react";
import { useWallet } from "@alephium/web3-react";
import { ExternalLink } from "lucide-react";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AddressDisplay from "@/components/wallet/AddressDisplay";
import WalletDashboard from "@/components/wallet/WalletDashboard";
import { getAddressTransactions, getAddressTokens } from "@/lib/api/alephiumApi";

// Specify the fixed address if we want to track a specific wallet
const FIXED_ADDRESS = "raLUPHsewjm1iA2kBzRKXB2ntbj3j4puxbVvsZD8iK3r";

// Interface for wallet stats
interface WalletStats {
  transactionCount: number;
  receivedAmount: number;
  sentAmount: number;
  tokenCount: number;
}

const WalletsPage = () => {
  const wallet = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>(FIXED_ADDRESS);
  const [refreshFlag, setRefreshFlag] = useState<number>(0);
  const [walletStats, setWalletStats] = useState<WalletStats>({
    transactionCount: 0,
    receivedAmount: 0,
    sentAmount: 0,
    tokenCount: 0
  });
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  
  // Check if wallet is connected
  const connected = wallet.connectionStatus === 'connected';

  useEffect(() => {
    if (connected && wallet.account) {
      // If user wallet is connected, use that address instead of fixed one
      setWalletAddress(wallet.account.address);
      
      // Notify user of successful connection
      toast.success("Wallet connected successfully", {
        description: `Connected to ${wallet.account.address.substring(0, 6)}...${wallet.account.address.substring(wallet.account.address.length - 4)}`
      });
    }
  }, [connected, wallet.account]);

  // Effect to fetch wallet statistics
  useEffect(() => {
    const fetchWalletStats = async () => {
      if (!walletAddress) return;
      
      setIsStatsLoading(true);
      try {
        // Fetch a larger set of transactions for stats calculation
        const transactions = await getAddressTransactions(walletAddress, 50);
        const tokens = await getAddressTokens(walletAddress);
        
        // Calculate stats from transactions
        let received = 0;
        let sent = 0;
        
        transactions.forEach(tx => {
          const type = getTransactionType(tx);
          const amount = getTransactionAmount(tx);
          
          if (type === 'received') {
            received += amount;
          } else if (type === 'sent') {
            sent += amount;
          }
        });
        
        setWalletStats({
          transactionCount: transactions.length,
          receivedAmount: received,
          sentAmount: sent,
          tokenCount: tokens.length
        });
      } catch (error) {
        console.error("Error fetching wallet stats:", error);
        // Keep default zero values on error
      } finally {
        setIsStatsLoading(false);
      }
    };
    
    fetchWalletStats();
  }, [walletAddress, refreshFlag]);

  const handleDisconnect = async () => {
    try {
      if (wallet.signer && (wallet.signer as any).requestDisconnect) {
        await (wallet.signer as any).requestDisconnect();
        toast.info("Wallet disconnected");
      } else {
        toast.error("Wallet disconnection failed", {
          description: "Your wallet doesn't support disconnect method"
        });
        return;
      }
      
      // Reset to fixed address after disconnect
      setWalletAddress(FIXED_ADDRESS);
    } catch (error) {
      console.error("Disconnection error:", error);
      toast.error("Disconnection failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
  
  // Helper to determine if transaction is incoming or outgoing
  const getTransactionType = (tx: any) => {
    // If any output is to this address, it's incoming
    const isIncoming = tx.outputs.some((output: any) => output.address === walletAddress);
    // If any input is from this address, it's outgoing
    const isOutgoing = tx.inputs.some((input: any) => input.address === walletAddress);
    
    if (isIncoming && !isOutgoing) return 'received';
    if (isOutgoing) return 'sent';
    return 'unknown';
  };
  
  // Calculate amount transferred to/from this address
  const getTransactionAmount = (tx: any) => {
    const type = getTransactionType(tx);
    
    if (type === 'received') {
      // Sum all outputs to this address
      const amount = tx.outputs
        .filter((output: any) => output.address === walletAddress)
        .reduce((sum: number, output: any) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    } else if (type === 'sent') {
      // This is a simplification - for accurate accounting we'd need to track change outputs
      const amount = tx.outputs
        .filter((output: any) => output.address !== walletAddress)
        .reduce((sum: number, output: any) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    }
    
    return 0;
  };

  // Decide whether to show connect screen or wallet dashboard
  if (!connected && !FIXED_ADDRESS) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Alephium Portfolio</h2>
          <p className="text-muted-foreground max-w-md">
            Connect your Alephium wallet to track balances and interact with dApps.
          </p>
          
          <div className="w-full max-w-md my-6">
            <WalletConnectButton />
          </div>
        </div>
      </div>
    );
  }

  // Show wallet dashboard with either connected wallet or fixed address data
  return (
    <div className="max-w-7xl mx-auto px-3 py-4">
      <div className="space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
          <h2 className="text-xl font-bold tracking-tight">
            Portfolio Dashboard
          </h2>
          
          {connected && (
            <Button variant="outline" size="sm" onClick={handleDisconnect} className="h-8">
              Disconnect
            </Button>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <AddressDisplay address={walletAddress} />
          
          {!connected && (
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-2 text-xs">
                <div className="flex items-center gap-1 text-amber-800 dark:text-amber-400">
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    Viewing public wallet. <Button variant="link" className="h-auto p-0 text-xs" asChild><WalletConnectButton /></Button>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <WalletDashboard
          address={walletAddress}
          isLoggedIn={connected}
          walletStats={walletStats}
          isStatsLoading={isStatsLoading}
          refreshFlag={refreshFlag}
          setRefreshFlag={setRefreshFlag}
        />
      </div>
    </div>
  );
};

export default WalletsPage;
