import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@alephium/web3-react";
import { Wallet, ExternalLink, Blocks, LayoutGrid, ChartLine, Database } from "lucide-react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import AddressDisplay from "@/components/wallet/AddressDisplay";
import WalletManager from "@/components/wallet/WalletManager";

import { getAddressTransactions, getAddressTokens } from "@/api/external/cachedAlephiumApi";
import { clearTokenCache } from "@/api/external/alephiumApi";
import { useLocalStorage } from "@/hooks/ui/use-local-storage";
import { useWalletCache } from "@/hooks/business/useWalletCache";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WalletType, SavedWallet } from "@/api/types/wallet";
import WalletTypeSelector from "@/components/wallet/WalletTypeSelector";
import AlephiumWalletLayout from "@/components/wallet/layouts/AlephiumWalletLayout";
import BitcoinWalletLayout from "@/components/wallet/layouts/BitcoinWalletLayout";
import ErgoWalletLayout from "@/components/wallet/layouts/ErgoWalletLayout";
import { nostrService } from "@/lib/nostr";

// Interface for wallet stats
interface WalletStats {
  transactionCount: number;
  receivedAmount: number;
  sentAmount: number;
  tokenCount: number;
}

const WalletsPage = () => {
  const wallet = useWallet();
  
  // Use the new cache system instead of basic localStorage
  const {
    savedWallets,
    addWallet,
    removeWallet,
    updateWallet,
    isWalletStale,
    forceRefreshWallet,
    restoreWalletsFromNostr,
    isOnline
  } = useWalletCache();
  
  const [walletAddress, setWalletAddress] = useLocalStorage<string>("blocknoster_selected_wallet", "");
  const [refreshFlag, setRefreshFlag] = useState<number>(0);

  const [walletStats, setWalletStats] = useState<WalletStats>({
    transactionCount: 0,
    receivedAmount: 0,
    sentAmount: 0,
    tokenCount: 0
  });
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("portfolio");
  const [selectedWalletType, setSelectedWalletType] = useLocalStorage<WalletType>("blocknoster_wallet_type", "Alephium");
  
  // Check if wallet is connected
  const connected = wallet.connectionStatus === 'connected';

  // Initialize with connected wallet or first saved wallet
  useEffect(() => {
    console.log("🔍 [WalletsPage] WALLET INITIALIZATION useEffect triggered:", { 
      connected, 
      walletAccount: wallet.account?.address, 
      savedWalletsCount: savedWallets.length,
      nostrPublicKey: nostrService.publicKey,
      savedWalletAddresses: savedWallets.map(w => ({ address: w.address, label: w.label, network: w.network, locked: w.locked?.isLocked }))
    });

    // Fix existing wallets that don't have network property set correctly
    const walletsToFix = savedWallets.filter(w => 
      (w.label === "Connected Wallet" && (!w.network || w.network === "")) ||
      (!w.network || w.network === "")
    );
    
    if (walletsToFix.length > 0) {
      console.log("🔧 [WalletsPage] Fixing wallets with missing network:", walletsToFix);
      
      // Update wallets directly to prevent duplicate key issues
      walletsToFix.forEach(wallet => {
        // Create updated wallet
        const updatedWallet = {
          ...wallet,
          network: "Alephium" as WalletType,
          label: wallet.label || "Connected Wallet"
        };
        
        // Use a direct update approach
        const updatedWallets = savedWallets.map(w => 
          w.address === wallet.address ? updatedWallet : w
        );
        
        // Update via localStorage directly to avoid React timing issues
        localStorage.setItem("blocknoster_saved_wallets", JSON.stringify(updatedWallets));
        
        console.log(`🔧 [WalletsPage] Fixed wallet network for ${wallet.address}`);
      });
      
      // Force a page refresh to reload with fixed data
      window.location.reload();
      return;
    }

    if (connected && wallet.account) {
      // If user wallet is connected, use that address
      console.log("🔗 [WalletsPage] Wallet connected, setting address:", wallet.account.address);
      setWalletAddress(wallet.account.address);
      
      // Add the connected wallet using the cache system if it doesn't exist
      const existingWallet = savedWallets.find(w => w.address === wallet.account?.address);
      if (!existingWallet) {
        console.log("➕ [WalletsPage] Adding connected wallet to saved wallets:", wallet.account.address);
        addWallet({ 
          address: wallet.account.address, 
          label: "Connected Wallet", 
          dateAdded: Date.now(),
          network: "Alephium", // Default to Alephium for connected wallets
          isWatchOnly: false
        });
      } else {
        console.log("✅ [WalletsPage] Connected wallet already in saved wallets:", existingWallet);
      }
      
      // Notify user of successful connection
      toast.success("Wallet connected successfully", {
        description: `Connected to ${wallet.account.address.substring(0, 6)}...${wallet.account.address.substring(wallet.account.address.length - 4)}`
      });
    } else if (savedWallets.length > 0 && !walletAddress) {
      // If no wallet is connected but we have saved wallets, use the first one
      console.log("📱 [WalletsPage] Using first saved wallet:", savedWallets[0]);
      setWalletAddress(savedWallets[0].address);
    } else if (!walletAddress && savedWallets.length === 0) {
      // Check if user is logged into Nostr but has no local wallets
      if (nostrService.publicKey) {
        console.log("🔑 [WalletsPage] User logged into Nostr but no local wallets - restoration will be attempted by useWalletCache");
        // Don't add default wallet yet - let the restoration happen first
        // If restoration doesn't find any wallets, we'll add default wallet later
        return;
      }
      
      // 🚫 REMOVED: Don't add default wallet when not logged in
      // When not logged into Nostr, there should be no selected wallet at all
      console.log("🚫 [WalletsPage] Not logged into Nostr - no wallets will be shown");
      setWalletAddress(""); // Ensure no wallet is selected
    }
  }, [connected, wallet.account, savedWallets, addWallet, removeWallet, walletAddress]);

  // 🚫 REMOVED: Timeout logic that added hardcoded default wallet
  // When logged into Nostr but no wallets found, should show empty state, not add fake wallet

  // 🚫 REMOVED: Immediate restoration is now handled by WalletManager and useWalletCache
  // This prevents duplicate restoration attempts

  // 🎯 AUTO-SELECT FIRST WALLET: When wallets are restored, auto-select the first one
  useEffect(() => {
    if (savedWallets.length > 0 && !walletAddress) {
      console.log("🎯 [WalletsPage] Auto-selecting first available wallet:", savedWallets[0]);
      setWalletAddress(savedWallets[0].address);
    }
  }, [savedWallets.length, walletAddress, setWalletAddress]);

  // Update existing "Demo Wallet" labels to "Connected Wallet"
  useEffect(() => {
    const demoWallet = savedWallets.find(wallet => wallet.label === "Demo Wallet");
    
    if (demoWallet) {
      // Update by removing and re-adding outside of render cycle
      const updateWallet = async () => {
        removeWallet(demoWallet.address);
        // Wait a bit to ensure removal is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        addWallet({
          address: demoWallet.address,
          label: "Connected Wallet",
          dateAdded: demoWallet.dateAdded,
          network: demoWallet.network,
          isWatchOnly: demoWallet.isWatchOnly
        });
      };
      
      updateWallet();
    }
  }, []); // Only run once on mount

  // Effect to fetch wallet statistics with better caching and rate limiting
  useEffect(() => {
    const fetchWalletStats = async () => {
      if (!walletAddress || selectedWalletType !== "Alephium") {
        setIsStatsLoading(false);
        return;
      }
      
      // Rate limit: don't fetch if we've fetched recently (within 30 seconds)
      const now = Date.now();
      const lastFetchKey = `lastStatsFetch_${walletAddress}`;
      const lastFetch = sessionStorage.getItem(lastFetchKey);
      if (lastFetch && (now - parseInt(lastFetch)) < 30000) {
        console.log(`[WalletsPage] Rate limiting stats fetch for ${walletAddress}`);
        setIsStatsLoading(false);
        return;
      }
      
      setIsStatsLoading(true);
      sessionStorage.setItem(lastFetchKey, now.toString());
      
      try {
        console.log(`[WalletsPage] Fetching stats for ${walletAddress}`);
        
        // Use rate-limited API with better error handling
        const [transactions, tokens] = await Promise.allSettled([
          getAddressTransactions(walletAddress, 50),
          getAddressTokens(walletAddress)
        ]);
        
        let transactionData: any[] = [];
        let tokenData: any[] = [];
        
        if (transactions.status === 'fulfilled') {
          transactionData = transactions.value || [];
        } else {
          console.warn(`[WalletsPage] Failed to fetch transactions:`, transactions.reason?.message);
          // Don't fail completely, just use empty array
        }
        
        if (tokens.status === 'fulfilled') {
          tokenData = tokens.value || [];
        } else {
          console.warn(`[WalletsPage] Failed to fetch tokens:`, tokens.reason?.message);
          // Don't fail completely, just use empty array
        }
        
        // Calculate stats from transactions
        let received = 0;
        let sent = 0;
        
        transactionData.forEach(tx => {
          const type = getTransactionType(tx);
          const amount = getTransactionAmount(tx);
          
          if (type === 'received') {
            received += amount;
          } else if (type === 'sent') {
            sent += amount;
          }
        });
        
        setWalletStats({
          transactionCount: transactionData.length,
          receivedAmount: received,
          sentAmount: sent,
          tokenCount: tokenData.length
        });
        
        // Note: Wallet data successfully fetched (even if partial)
        
      } catch (error: any) {
        console.error("[WalletsPage] Error fetching wallet stats:", error.message);
        
        // Handle rate limiting gracefully
        if (error.message?.includes('Rate limited')) {
          toast.error("Rate limited - using cached data", {
            description: "Please wait before refreshing again"
          });
        }
        
        // Note: Failed to refresh wallet data
      } finally {
        setIsStatsLoading(false);
      }
    };
    
    fetchWalletStats();
  }, [walletAddress, refreshFlag, selectedWalletType]);

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
      
      // Select the first saved wallet after disconnect
      if (savedWallets.length > 0) {
        setWalletAddress(savedWallets[0].address);
      }
    } catch (error) {
      console.error("Disconnection error:", error);
      toast.error("Disconnection failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  
  // Helper to determine if transaction is incoming or outgoing (memoized)
  const getTransactionType = useCallback((tx: any) => {
    // If any output is to this address, it's incoming
    const isIncoming = tx.outputs.some((output: any) => output.address === walletAddress);
    // If any input is from this address, it's outgoing
    const isOutgoing = tx.inputs.some((input: any) => input.address === walletAddress);
    
    if (isIncoming && !isOutgoing) return 'received';
    if (isOutgoing) return 'sent';
    return 'unknown';
  }, [walletAddress]);
  
  // Calculate amount transferred to/from this address (memoized)
  const getTransactionAmount = useCallback((tx: any) => {
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
  }, [walletAddress, getTransactionType]);

  // Always show wallet dashboard - no special landing page
  // The dashboard will gracefully handle empty states
  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-3xl font-bold tracking-tight">
                Blockchain Wallet
              </h2>
              <WalletTypeSelector 
                selectedWallet={selectedWalletType} 
                onSelectWallet={setSelectedWalletType} 
              />
              {/* Cache status indicator */}
              {isWalletStale(walletAddress) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Database className="h-4 w-4 text-orange-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Wallet data is stale - click refresh</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-muted-foreground">
              {connected 
                ? `Manage your ${selectedWalletType} assets and dApps` 
                : savedWallets.length > 0
                  ? `Viewing portfolio data for all tracked ${selectedWalletType} wallets`
                  : `Connect your ${selectedWalletType} wallet or add addresses to get started`}
            </p>
          </div>
          
          <div className="flex gap-2">
            {connected && (
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="h-9">
                Disconnect Wallet
              </Button>
            )}
          </div>
        </div>

        <div className="w-full">
          {selectedWalletType === "Alephium" && (
            <Tabs defaultValue="portfolio" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full mb-6">
                <TabsTrigger value="portfolio" className="flex items-center gap-2">
                  <ChartLine className="h-4 w-4" />
                  <span>My Portfolio</span>
                </TabsTrigger>
                <TabsTrigger value="dapps" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span>My dApps</span>
                </TabsTrigger>
                <TabsTrigger value="alephium" className="flex items-center gap-2">
                  <Blocks className="h-4 w-4" />
                  <span>My Alephium</span>
                </TabsTrigger>
              </TabsList>

              <AlephiumWalletLayout
                address={walletAddress}
                allWallets={savedWallets}
                isLoggedIn={connected}
                walletStats={walletStats}
                isStatsLoading={isStatsLoading}
                refreshFlag={refreshFlag}
                setRefreshFlag={setRefreshFlag}
                activeTab={activeTab}
                // Pass wallet manager props for the popup
                walletManagerProps={{
                  currentAddress: walletAddress,
                  onSelectWallet: setWalletAddress,
                  savedWallets: savedWallets,
                  onAddWallet: addWallet,
                  onRemoveWallet: removeWallet,
                  onUpdateWallet: updateWallet,
                  isWalletStale: isWalletStale,
                  onForceRefresh: forceRefreshWallet,
                  onRestoreWallets: restoreWalletsFromNostr,
                  isOnline: isOnline,
                  selectedWalletType: selectedWalletType
                }}
              />
            </Tabs>
          )}

          {selectedWalletType === "Bitcoin" && (
            <BitcoinWalletLayout address={walletAddress} />
          )}

          {selectedWalletType === "Ergo" && (
            <ErgoWalletLayout address={walletAddress} />
          )}
        </div>

      </div>
      

    </div>
  );
};

export default WalletsPage;

