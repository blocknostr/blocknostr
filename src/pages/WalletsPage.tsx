
import React, { useState, useEffect } from "react";
import { useWallet } from "@alephium/web3-react";
import { ExternalLink } from "lucide-react";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import AddressDisplay from "@/components/wallet/AddressDisplay";
import WalletDashboard from "@/components/wallet/WalletDashboard";
import { getAddressTransactions, getAddressTokens } from "@/lib/api/alephiumApi";
import { SavedWallet, WalletList } from "@/types/wallet";
import { loadWalletList, addWallet, saveWalletList } from "@/lib/nostr/utils/wallet-persistence";
import AddWalletDialog from "@/components/wallet/AddWalletDialog";
import WalletSelector from "@/components/wallet/WalletSelector";
import { nostrService } from "@/lib/nostr";

// Specify the fixed address if no wallets are saved or user is not logged in
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
  const [walletList, setWalletList] = useState<WalletList>({ wallets: [], activeWalletIndex: 0 });
  const [refreshFlag, setRefreshFlag] = useState<number>(0);
  const [walletStats, setWalletStats] = useState<WalletStats>({
    transactionCount: 0,
    receivedAmount: 0,
    sentAmount: 0,
    tokenCount: 0
  });
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  
  // Check if wallet is connected
  const connected = wallet.connectionStatus === 'connected';
  const isNostrConnected = !!nostrService.publicKey;
  
  // Determine which wallet address to use
  const activeWallet = walletList.wallets[walletList.activeWalletIndex];
  const walletAddress = connected && wallet.account 
    ? wallet.account.address 
    : (activeWallet?.address || FIXED_ADDRESS);

  // Load saved wallets from Nostr
  useEffect(() => {
    const fetchSavedWallets = async () => {
      if (!isNostrConnected) {
        // If not connected to Nostr, use a default with our fixed address
        setWalletList({ wallets: [], activeWalletIndex: 0 });
        return;
      }
      
      const savedList = await loadWalletList();
      if (savedList && savedList.wallets.length > 0) {
        setWalletList(savedList);
      } else {
        // Initialize with empty list
        setWalletList({ wallets: [], activeWalletIndex: 0 });
      }
    };
    
    fetchSavedWallets();
  }, [isNostrConnected]);

  // Effect to handle connected Alephium wallet
  useEffect(() => {
    if (connected && wallet.account) {
      // If Alephium wallet is connected, add it to our list if it's not already there
      const alephiumWalletAddress = wallet.account.address;
      
      // Check if the connected wallet is already in our list
      if (!walletList.wallets.some(w => w.address === alephiumWalletAddress)) {
        // If not logged into Nostr, we'll just use it directly without saving
        if (!isNostrConnected) return;
        
        // If logged in, add it to our list
        addWallet(alephiumWalletAddress, "Connected Wallet").then(success => {
          if (success) {
            loadWalletList().then(updatedList => {
              if (updatedList) {
                setWalletList(updatedList);
              }
            });
          }
        });
      }
      
      // Notify user of successful connection
      toast.success("Wallet connected successfully", {
        description: `Connected to ${alephiumWalletAddress.substring(0, 6)}...${alephiumWalletAddress.substring(alephiumWalletAddress.length - 4)}`
      });
    }
  }, [connected, wallet.account, walletList.wallets, isNostrConnected]);

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
  if (!connected && walletList.wallets.length === 0 && !FIXED_ADDRESS) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Alephium Portfolio Manager</h2>
          <p className="text-muted-foreground max-w-md">
            Connect your Alephium wallet to track balances, view transactions, send ALPH, and interact with dApps.
          </p>
          
          <div className="w-full max-w-md my-8">
            <WalletConnectButton />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Portfolio Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor your ALPH and token balances in real-time</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Send & Receive</h3>
              <p className="text-sm text-muted-foreground">Transfer ALPH and tokens with ease</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">DApp Integration</h3>
              <p className="text-sm text-muted-foreground">Interact with Alephium dApps directly</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Transaction History</h3>
              <p className="text-sm text-muted-foreground">Detailed history of all your activity</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const handleRefreshWallets = async () => {
    const savedList = await loadWalletList();
    if (savedList) {
      setWalletList(savedList);
    }
  };

  // Show wallet dashboard with either connected wallet or fixed address data
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">
              {connected ? "Your Portfolio" : "Alephium Portfolio Tracker"}
            </h2>
            <p className="text-muted-foreground">
              {connected 
                ? "Track and manage your Alephium assets" 
                : "Viewing wallet data"}
            </p>
          </div>
          
          {connected && (
            <div>
              <button 
                onClick={handleDisconnect}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input h-9 px-4 py-2 hover:bg-accent hover:text-accent-foreground"
              >
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>

        {/* Wallet selector - show if logged in or if we have saved wallets */}
        {(isNostrConnected || walletList.wallets.length > 0) && (
          <WalletSelector 
            wallets={walletList.wallets}
            activeWalletIndex={walletList.activeWalletIndex}
            onWalletChange={handleRefreshWallets}
            onAddWallet={() => setIsAddDialogOpen(true)}
            isLoggedIn={isNostrConnected}
          />
        )}

        <AddressDisplay address={walletAddress} />

        {!connected && (
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-sm">
              <p className="flex items-start gap-2 text-amber-800 dark:text-amber-400">
                <ExternalLink className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>
                  Currently tracking wallet <strong>{walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 8)}</strong>.
                  Connect your own wallet to see your personal balance and transactions.
                </span>
              </p>
            </CardContent>
          </Card>
        )}

        <WalletDashboard
          address={walletAddress}
          isLoggedIn={connected}
          walletStats={walletStats}
          isStatsLoading={isStatsLoading}
          refreshFlag={refreshFlag}
          setRefreshFlag={setRefreshFlag}
        />
      </div>
      
      {/* Add Wallet Dialog */}
      <AddWalletDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleRefreshWallets}
      />
    </div>
  );
};

export default WalletsPage;
