import React, { useState, useEffect } from "react";
import { useWallet } from "@alephium/web3-react";
import { Wallet, ExternalLink, PlusCircle } from "lucide-react";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AddressDisplay from "@/components/wallet/AddressDisplay";
import WalletDashboard from "@/components/wallet/WalletDashboard";
import { getAddressTransactions, getAddressTokens } from "@/lib/api/alephiumApi";
import { useSavedWallets, SavedWallet } from "@/hooks/use-saved-wallets";
import WalletSelector from "@/components/wallet/WalletSelector";
import AddWalletDialog from "@/components/wallet/AddWalletDialog";

// Interface for wallet stats
interface WalletStats {
  transactionCount: number;
  receivedAmount: number;
  sentAmount: number;
  tokenCount: number;
}

const WalletsPage = () => {
  const wallet = useWallet();
  const [refreshFlag, setRefreshFlag] = useState<number>(0);
  const [walletStats, setWalletStats] = useState<WalletStats>({
    transactionCount: 0,
    receivedAmount: 0,
    sentAmount: 0,
    tokenCount: 0
  });
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  
  // Get wallet management functions from our hook
  const {
    savedWallets,
    activeWallet,
    activeWalletIndex,
    addWallet,
    removeWallet,
    setActiveWallet,
    updateWalletConnection,
    updateWalletLabel
  } = useSavedWallets();
  
  // Check if wallet is connected
  const connected = wallet.connectionStatus === 'connected';

  // When web3 wallet connects
  useEffect(() => {
    if (connected && wallet.account) {
      const connectedAddress = wallet.account.address;
      
      // Check if this wallet is already saved
      const existingWallet = savedWallets.find(w => w.address === connectedAddress);
      
      if (existingWallet) {
        // Update connection status
        updateWalletConnection(connectedAddress, true);
        // Make this wallet active
        setActiveWallet(connectedAddress);
      } else {
        // Add the newly connected wallet
        addWallet(connectedAddress, "Connected Wallet", true);
        // It will become active automatically if it's the first wallet
      }
      
      // Notify user of successful connection
      toast.success("Wallet connected successfully", {
        description: `Connected to ${connectedAddress.substring(0, 6)}...${connectedAddress.substring(connectedAddress.length - 4)}`
      });
    }
  }, [connected, wallet.account]);
  
  // Add default wallet if none exists
  useEffect(() => {
    if (savedWallets.length === 0) {
      // Default wallet address
      const defaultAddress = "raLUPHsewjm1iA2kBzRKXB2ntbj3j4puxbVvsZD8iK3r";
      addWallet(defaultAddress, "Default Demo Wallet");
    }
  }, [savedWallets.length]);

  // Effect to fetch wallet statistics
  useEffect(() => {
    const fetchWalletStats = async () => {
      if (!activeWallet) return;
      
      setIsStatsLoading(true);
      try {
        // Fetch transactions and tokens for the active wallet
        const transactions = await getAddressTransactions(activeWallet.address, 50);
        const tokens = await getAddressTokens(activeWallet.address);
        
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
  }, [activeWallet, refreshFlag]);

  const handleDisconnect = async () => {
    try {
      if (wallet.signer && (wallet.signer as any).requestDisconnect) {
        await (wallet.signer as any).requestDisconnect();
        toast.info("Wallet disconnected");
        
        // Update wallet connection status in our saved wallets
        if (wallet.account) {
          updateWalletConnection(wallet.account.address, false);
        }
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
    if (!activeWallet) return 'unknown';
    
    // If any output is to this address, it's incoming
    const isIncoming = tx.outputs.some((output: any) => output.address === activeWallet.address);
    // If any input is from this address, it's outgoing
    const isOutgoing = tx.inputs.some((input: any) => input.address === activeWallet.address);
    
    if (isIncoming && !isOutgoing) return 'received';
    if (isOutgoing) return 'sent';
    return 'unknown';
  };
  
  // Calculate amount transferred to/from this address
  const getTransactionAmount = (tx: any) => {
    if (!activeWallet) return 0;
    
    const type = getTransactionType(tx);
    
    if (type === 'received') {
      // Sum all outputs to this address
      const amount = tx.outputs
        .filter((output: any) => output.address === activeWallet.address)
        .reduce((sum: number, output: any) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    } else if (type === 'sent') {
      // This is a simplification - for accurate accounting we'd need to track change outputs
      const amount = tx.outputs
        .filter((output: any) => output.address !== activeWallet.address)
        .reduce((sum: number, output: any) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    }
    
    return 0;
  };

  // Handle wallet selection
  const handleSelectWallet = (address: string) => {
    setActiveWallet(address);
    setRefreshFlag(refreshFlag + 1); // Trigger data refresh
  };

  // Handle adding a new wallet
  const handleAddWallet = (address: string, label: string) => {
    addWallet(address, label);
    setRefreshFlag(refreshFlag + 1); // Trigger data refresh
  };

  // Handle wallet label update
  const handleLabelUpdate = (address: string, newLabel: string) => {
    updateWalletLabel(address, newLabel);
  };

  // Decide whether to show connect screen or wallet dashboard
  if (savedWallets.length === 0) {
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
          
          <div className="flex flex-col items-center mt-6">
            <Button
              variant="outline" 
              onClick={() => setAddDialogOpen(true)}
              className="flex items-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Wallet to Track
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              You can add any Alephium wallet to monitor its activity
            </p>
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
        
        <AddWalletDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onAddWallet={handleAddWallet}
          existingWallets={savedWallets}
        />
      </div>
    );
  }

  // Show wallet dashboard with the active wallet
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
          
          <div className="flex items-center gap-2">
            <WalletSelector 
              wallets={savedWallets}
              activeWalletIndex={activeWalletIndex}
              onSelectWallet={handleSelectWallet}
              onAddWallet={handleAddWallet}
              onRemoveWallet={removeWallet}
            />
            
            {connected && (
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="h-9">
                Disconnect Wallet
              </Button>
            )}
          </div>
        </div>

        {/* Tracked Wallets section */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-3">Tracked Wallets</h3>
            <div className="grid gap-2">
              {savedWallets.map((wallet) => (
                <AddressDisplay 
                  key={wallet.address}
                  wallet={wallet}
                  onLabelEdit={handleLabelUpdate}
                  className={wallet.address === activeWallet?.address ? "ring-1 ring-primary/30" : ""}
                />
              ))}
              
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full flex items-center justify-center"
                onClick={() => setAddDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        {activeWallet && (
          <AddressDisplay 
            wallet={activeWallet} 
            onLabelEdit={handleLabelUpdate}
          />
        )}

        {!connected && (
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-sm">
              <p className="flex items-start gap-2 text-amber-800 dark:text-amber-400">
                <ExternalLink className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>
                  {activeWallet ? (
                    <>
                      Currently tracking wallet <strong>{activeWallet.address.substring(0, 8)}...{activeWallet.address.substring(activeWallet.address.length - 8)}</strong>.
                      Connect your own wallet to see your personal balance and transactions.
                    </>
                  ) : (
                    <>
                      No wallet selected. Please select or add a wallet to track.
                    </>
                  )}
                </span>
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <WalletConnectButton />
          </div>
        </div>

        {activeWallet && (
          <WalletDashboard
            address={activeWallet.address}
            isLoggedIn={connected && activeWallet.isConnected}
            walletStats={walletStats}
            isStatsLoading={isStatsLoading}
            refreshFlag={refreshFlag}
            setRefreshFlag={setRefreshFlag}
          />
        )}
      </div>
      
      <AddWalletDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAddWallet={handleAddWallet}
        existingWallets={savedWallets}
      />
    </div>
  );
};

export default WalletsPage;
