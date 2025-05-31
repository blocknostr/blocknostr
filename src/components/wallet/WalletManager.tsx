import React, { useState, useEffect, useRef, useCallback } from "react";
import { PlusCircle, Trash2, Lock, LockOpen, Database, Clock, Wallet, TrendingUp, TrendingDown, RefreshCw, Search, Filter, MoreVertical, Eye, Star, AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AddressDisplay from "./AddressDisplay";
import { SavedWallet, WalletType } from "@/api/types/wallet";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { getAddressBalance } from "@/api/external/cachedAlephiumApi";
import { nostrService } from "@/lib/nostr";


interface WalletManagerProps {
  currentAddress: string;
  onSelectWallet: (address: string) => void;
  savedWallets: SavedWallet[];
  onAddWallet: (wallet: Omit<SavedWallet, 'cacheMetadata'>) => void;
  onRemoveWallet: (address: string) => void;
  onUpdateWallet: (address: string, updates: Partial<SavedWallet>) => void;
  isWalletStale: (address: string) => boolean;
  onForceRefresh: (address: string) => void;
  onRestoreWallets: () => Promise<void>;
  isOnline: boolean;
  selectedWalletType: WalletType;
}

const WalletManager: React.FC<WalletManagerProps> = ({ 
  currentAddress, 
  onSelectWallet,
  savedWallets,
  onAddWallet,
  onRemoveWallet,
  onUpdateWallet,
  isWalletStale,
  onForceRefresh,
  onRestoreWallets,
  isOnline,
  selectedWalletType
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<WalletType>("Alephium");
  const [searchTerm, setSearchTerm] = useState("");
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});
  const [lockingWallet, setLockingWallet] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // 🚀 NEW: Nostr state monitoring for auto-restoration
  const [isAutoRestoring, setIsAutoRestoring] = useState(false);
  const [loginTransitionDetected, setLoginTransitionDetected] = useState(false);
  const previousNostrState = useRef<string | null>(null);
  const restorationAttempted = useRef(false);

  // 🔄 Auto-restoration handler (MOVED UP - define before use)
  const handleAutoRestore = useCallback(async () => {
    try {
      console.log('🔄 [WalletManager] Executing auto-restoration...');
      setIsAutoRestoring(true);
      await onRestoreWallets();
      
      // Show success feedback
      setTimeout(() => {
        setLoginTransitionDetected(false);
        setIsAutoRestoring(false);
      }, 2000);
      
    } catch (error) {
      console.error('❌ [WalletManager] Auto-restoration failed:', error);
      setIsAutoRestoring(false);
      setLoginTransitionDetected(false);
    }
  }, [onRestoreWallets]);

  // 🔍 Monitor Nostr login state changes for immediate auto-restoration
  useEffect(() => {
    const currentNostrState = nostrService.publicKey;
    const wasLoggedOut = !previousNostrState.current;
    const isNowLoggedIn = !!currentNostrState;
    
    console.log('🔍 [WalletManager] Nostr state check:', {
      previousState: previousNostrState.current ? 'logged-in' : 'logged-out',
      currentState: isNowLoggedIn ? 'logged-in' : 'logged-out',
      savedWalletsCount: savedWallets.length,
      transitionDetected: wasLoggedOut && isNowLoggedIn,
      restorationAttempted: restorationAttempted.current,
      allConditionsMet: wasLoggedOut && isNowLoggedIn && savedWallets.length === 0 && !restorationAttempted.current
    });

    // Detect "not logged in" → "logged in" transition
    if (wasLoggedOut && isNowLoggedIn && savedWallets.length === 0 && !restorationAttempted.current) {
      console.log('🚀 [WalletManager] LOGIN TRANSITION DETECTED - triggering immediate auto-restoration');
      setLoginTransitionDetected(true);
      restorationAttempted.current = true;
      
      // Trigger immediate restoration
      handleAutoRestore();
    }

    // Update previous state
    previousNostrState.current = currentNostrState;
  }, [nostrService.publicKey, savedWallets.length, handleAutoRestore]);

  // Reset restoration state when wallets are cleared or user logs out
  useEffect(() => {
    if (!nostrService.publicKey) {
      // User logged out - reset everything
      restorationAttempted.current = false;
      setIsAutoRestoring(false);
      setLoginTransitionDetected(false);
      previousNostrState.current = null;
      console.log('🔄 [WalletManager] User logged out - reset restoration state');
    } else if (savedWallets.length > 0 && restorationAttempted.current) {
      // Wallets restored - reset only the attempt flag for future use
      restorationAttempted.current = false;
      setIsAutoRestoring(false);
      setLoginTransitionDetected(false);
      console.log('🔄 [WalletManager] Wallets restored - reset attempt flag');
    }
  }, [nostrService.publicKey, savedWallets.length]);

  // 🚀 IMMEDIATE CHECK: Check on mount if user is already logged in with no wallets
  useEffect(() => {
    // Only run once on mount
    if (nostrService.publicKey && savedWallets.length === 0 && !restorationAttempted.current) {
      console.log('🎯 [WalletManager] Mount check - user already logged in with no wallets, triggering auto-restoration');
      setLoginTransitionDetected(true);
      restorationAttempted.current = true;
      handleAutoRestore();
    }
  }, []); // Empty dependency array - run once on mount

  // Fetch balances for wallets
  useEffect(() => {
    const fetchBalances = async () => {
      for (const wallet of savedWallets) {
        if (wallet.network === "Alephium" && !walletBalances[wallet.address] && !loadingBalances[wallet.address]) {
          setLoadingBalances(prev => ({ ...prev, [wallet.address]: true }));
          try {
            const balanceData = await getAddressBalance(wallet.address);
            setWalletBalances(prev => ({ ...prev, [wallet.address]: balanceData.balance || 0 }));
          } catch (error) {
            console.warn(`Failed to fetch balance for ${wallet.address}`);
          } finally {
            setLoadingBalances(prev => ({ ...prev, [wallet.address]: false }));
    }
        }
      }
    };

    fetchBalances();
  }, [savedWallets, walletBalances, loadingBalances]);

  const handleAddWallet = async () => {
    if (!newAddress) {
      toast.error("Please enter a wallet address");
      return;
    }

    // Basic validation based on network
    if (selectedNetwork === "Alephium" && !newAddress.startsWith("1") && !newAddress.startsWith("r")) {
      toast.error("Invalid Alephium address format");
      return;
    }

    if (selectedNetwork === "Bitcoin" && !newAddress.startsWith("1") && !newAddress.startsWith("3") && !newAddress.startsWith("bc1")) {
      toast.error("Invalid Bitcoin address format");
      return;
    }

    // Check if wallet already exists
    if (savedWallets.some(wallet => wallet.address === newAddress)) {
      toast.error("This wallet is already in your list");
      return;
    }

    // Add the new wallet using cache system
    const label = newLabel.trim() || `${selectedNetwork} Wallet ${savedWallets.length + 1}`;
    onAddWallet({
      address: newAddress,
      label,
      dateAdded: Date.now(),
      network: selectedNetwork,
      isWatchOnly: true
    });

    setNewAddress("");
    setNewLabel("");
    setIsAdding(false);

    // Select the new wallet
    onSelectWallet(newAddress);
  };

  const handleRemoveWallet = (address: string) => {
    // Prevent removing the last wallet
    if (savedWallets.length <= 1) {
      toast.error("You must keep at least one wallet for tracking");
      return;
    }
    
    onRemoveWallet(address);
    
    // If removing the currently selected wallet, select another one
    if (address === currentAddress && savedWallets.length > 1) {
      const nextWallet = savedWallets.find(wallet => wallet.address !== address);
      if (nextWallet) {
        onSelectWallet(nextWallet.address);
      }
    }
  };

  const handleSelectWallet = (address: string) => {
    onSelectWallet(address);
  };

  // Lock wallet to Nostr relays
  const handleLockWallet = async (wallet: SavedWallet) => {
    if (!nostrService.publicKey) {
      toast.error("Please connect your Nostr account first");
      return;
    }

    setLockingWallet(wallet.address);

    try {
      // Create wallet registration event
      const walletEvent = {
        kind: 30078, // Application-specific data event (NIP-78)
        tags: [
          ['d', `wallet:${wallet.address}`], // Unique identifier
          ['wallet_type', wallet.network],
          ['wallet_address', wallet.address],
          ['wallet_label', wallet.label],
          ['locked_at', Date.now().toString()],
          ['app', 'blocknostr'] // App identifier
        ],
        content: JSON.stringify({
          address: wallet.address,
          label: wallet.label,
          network: wallet.network,
          dateAdded: wallet.dateAdded,
          isWatchOnly: wallet.isWatchOnly
        })
      };

      const eventId = await nostrService.publishEvent(walletEvent);

      if (eventId) {
        // Update wallet with lock information
        onUpdateWallet(wallet.address, {
          locked: {
            isLocked: true,
            eventId: eventId,
            lockedAt: Date.now()
          }
        });

        toast.success(`Wallet "${wallet.label}" has been registered to Nostr relays`, {
          description: "Your wallet will be restored when you log in with your NPUB on any device"
        });
      } else {
        toast.error("Failed to register wallet to relays");
      }
    } catch (error) {
      console.error("Error locking wallet:", error);
      toast.error("Failed to register wallet to relays");
    } finally {
      setLockingWallet(null);
    }
  };

  // Restore wallets from Nostr relays
  const handleRestoreWallets = async () => {
    if (!nostrService.publicKey) {
      toast.error("Please connect your Nostr account first");
      return;
    }

    setIsRestoring(true);
    try {
      await onRestoreWallets();
    } catch (error) {
      console.error("Error restoring wallets:", error);
      toast.error("Failed to restore wallets from Nostr");
    } finally {
      setIsRestoring(false);
    }
  };

  // Unlock wallet from Nostr relays
  const handleUnlockWallet = async (wallet: SavedWallet) => {
    if (!nostrService.publicKey || !wallet.locked?.eventId) {
      toast.error("Cannot unlock wallet");
      return;
    }

    setLockingWallet(wallet.address);

    try {
      // Create deletion event for the wallet registration
      const deletionEvent = {
        kind: 5, // Deletion event
        tags: [
          ['e', wallet.locked.eventId] // Reference to the event to delete
        ],
        content: 'Wallet unlocked from Nostr persistence'
      };

      const eventId = await nostrService.publishEvent(deletionEvent);

      if (eventId) {
        // Update wallet to remove lock information
        onUpdateWallet(wallet.address, {
          locked: {
            isLocked: false,
            eventId: undefined,
            lockedAt: undefined
          }
        });

        toast.success(`Wallet "${wallet.label}" has been unlocked from Nostr relays`, {
          description: "Wallet is now only stored locally in your cache"
        });
      } else {
        toast.error("Failed to unlock wallet from relays");
      }
    } catch (error) {
      console.error("Error unlocking wallet:", error);
      toast.error("Failed to unlock wallet from relays");
    } finally {
      setLockingWallet(null);
    }
  };

  const getWalletStatus = (wallet: SavedWallet) => {
    if (!isOnline) return { status: "offline", color: "bg-gray-500", text: "Offline" };
    if (!wallet.cacheMetadata) return { status: "unknown", color: "bg-gray-400", text: "Unknown" };
    
    const isStale = isWalletStale(wallet.address);
    if (isStale) {
      return { status: "stale", color: "bg-orange-500", text: "Stale" };
    }
    
    return { status: "fresh", color: "bg-green-500", text: "Fresh" };
  };

  const getNetworkColor = (network: WalletType) => {
    switch (network) {
      case "Bitcoin": return "from-orange-500 to-orange-600";
      case "Alephium": return "from-gray-900 to-black";
      case "Ergo": return "from-green-500 to-green-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const getNetworkIcon = (network: WalletType) => {
    return <Wallet className="h-3 w-3" />;
  };

  // Filter wallets based on search, network filter, and selected wallet type
  const filteredWallets = savedWallets.filter(wallet => {
    const matchesSearch = wallet.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         wallet.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSelectedType = wallet.network === selectedWalletType; // Only show wallets for current blockchain
    
    return matchesSearch && matchesSelectedType;
  });

  // Debug logging for wallet filtering
  useEffect(() => {
    console.log("[WalletManager] Filtering wallets:", {
      selectedWalletType,
      totalWallets: savedWallets.length,
      filteredWallets: filteredWallets.length,
      searchTerm,
      allWallets: savedWallets.map(w => ({ label: w.label, network: w.network, address: w.address.substring(0, 8) })),
      filtered: filteredWallets.map(w => ({ label: w.label, network: w.network, address: w.address.substring(0, 8) }))
    });
  }, [savedWallets, filteredWallets, selectedWalletType, searchTerm]);

  const totalBalance = Object.entries(walletBalances)
    .filter(([address]) => savedWallets.find(w => w.address === address && w.network === selectedWalletType))
    .reduce((sum, [, balance]) => sum + balance, 0);

  const WalletCard = ({ wallet }: { wallet: SavedWallet }) => {
    const isSelected = wallet.address === currentAddress;
    const status = getWalletStatus(wallet);
    const balance = walletBalances[wallet.address] || 0;
    const isLoadingBalance = loadingBalances[wallet.address];

    return (
      <div 
        className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer min-h-[80px] ${
          isSelected 
            ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/20' 
            : 'bg-card/50 border-border/50 hover:bg-card/80 hover:border-border hover:shadow-md'
        }`}
        onClick={() => handleSelectWallet(wallet.address)}
      >
        {/* Fixed upper right corner elements */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r ${getNetworkColor(wallet.network)} text-white text-[10px] font-medium`}>
            {getNetworkIcon(wallet.network)}
            {wallet.network}
          </div>
          {/* Lock status indicator */}
          {wallet.locked?.isLocked && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500 text-white text-[9px] font-medium">
                    <Lock className="w-2 h-2" />
                    Nostr
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div>Registered to Nostr relays</div>
                    <div className="text-muted-foreground">
                      Locked {wallet.locked.lockedAt && formatDistanceToNow(wallet.locked.lockedAt)} ago
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className={`h-2 w-2 rounded-full ${status.color} animate-pulse`}></div>
        </div>

        {/* Horizontal layout */}
        <div className="flex items-start justify-between gap-3 pt-6">
          {/* Left side - Wallet info */}
          <div className="flex-grow min-w-0 space-y-1">
            {/* Wallet name row */}
            <div className="font-semibold text-sm truncate pr-2">{wallet.label}</div>
            
            <div className="text-xs text-muted-foreground font-mono truncate pr-2">
              {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 6)}
            </div>
          </div>
          
          {/* Right side - Balance display */}
          {wallet.network === "Alephium" && (
            <div className="flex-shrink-0 text-right space-y-0.5 min-w-[100px]">
              {isLoadingBalance ? (
                <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto"></div>
              ) : (
                <>
                  <div className="font-bold text-sm">{formatNumber(balance, 2)} ALPH</div>
                  <div className="text-xs text-muted-foreground">
                    ≈ {formatCurrency(balance * 0.5)}
                  </div>
                </>
              )}
              {wallet.cacheMetadata && (
                <div className="text-[9px] text-muted-foreground leading-tight">
                  Updated {formatDistanceToNow(wallet.cacheMetadata.lastRefresh)} ago
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="flex items-center gap-1">
            {/* Lock/Unlock Button */}
            {wallet.locked?.isLocked ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                    disabled={lockingWallet === wallet.address}
                    title="Unlock wallet from Nostr"
                    aria-label="Unlock wallet from Nostr relays"
                  >
                    {lockingWallet === wallet.address ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <LockOpen className="h-5 w-5 text-orange-500" />
                      Unlock Wallet from Nostr
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This wallet is currently registered as a Nostr event on relays, making it publicly discoverable and automatically restored when you log in with your NPUB.
                      <br /><br />
                      <strong>Unlocking will:</strong>
                      <ul className="list-disc ml-4 mt-2">
                        <li>Remove the wallet registration from Nostr relays</li>
                        <li>Keep the wallet only in your local cache</li>
                        <li>Make the wallet private again</li>
                        <li>Require manual re-adding if you switch devices</li>
                      </ul>
                      <br />
                      Are you sure you want to unlock "{wallet.label}"?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlockWallet(wallet);
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Unlock Wallet
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                    disabled={!nostrService.publicKey || lockingWallet === wallet.address}
                    title="Lock wallet to Nostr"
                    aria-label="Lock wallet to Nostr relays"
                  >
                    {lockingWallet === wallet.address ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <LockOpen className="h-3 w-3" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-500" />
                      Lock Wallet to Nostr
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Currently, your wallet "{wallet.label}" is saved only in your local cache, which is safe and relatively private. 
                      <br /><br />
                      <strong>Locking this wallet will:</strong>
                      <ul className="list-disc ml-4 mt-2 mb-2">
                        <li>Register your wallet as a Nostr event on public relays</li>
                        <li>Make your wallet address publicly discoverable</li>
                        <li>Automatically restore the wallet when you log in with your NPUB on any device</li>
                        <li>Enable seamless wallet synchronization across devices</li>
                      </ul>
                      <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <span className="text-sm text-orange-800">
                          <strong>Privacy Notice:</strong> This will make your wallet address visible on public Nostr relays. Only proceed if you're comfortable with this level of transparency.
                        </span>
                      </div>
                      <br />
                      Are you sure you want to proceed with locking this wallet to Nostr relays?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockWallet(wallet);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Lock to Nostr
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Options Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  title="Wallet options"
                  aria-label="Open wallet options menu"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onForceRefresh(wallet.address);
                }}>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Refresh Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(wallet.address);
                  toast.success("Address copied!");
                }}>
                  <Eye className="h-3 w-3 mr-2" />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveWallet(wallet.address);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Remove Wallet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none"></div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-[600px] flex flex-col bg-gradient-to-br from-card/80 to-card/40 border-primary/10">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {selectedWalletType} Wallets 
              <Badge variant="secondary" className="text-xs">{filteredWallets.length}</Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              {loginTransitionDetected ? (
                <span className="text-blue-600">🚀 Detecting Nostr login - auto-restoring wallets...</span>
              ) : (
                <>
                  {selectedWalletType === "Alephium" ? formatCurrency(totalBalance * 0.5) + " total value" : "Manage your " + selectedWalletType + " wallets"} • {isOnline ? "🟢 Online" : "🔴 Offline"}
                  {nostrService.publicKey && savedWallets.length === 0 && !restorationAttempted.current && (
                    <span className="text-green-600"> • Ready for auto-restore</span>
                  )}
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            {/* 🚀 Auto-restoration status indicator */}
            {loginTransitionDetected && (
              <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Auto-restoring...</span>
              </div>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRestoreWallets}
                    disabled={isRestoring || isAutoRestoring || !nostrService.publicKey}
                    className="h-8 w-8 p-0"
                    title="Restore locked wallets from Nostr"
                  >
                    {(isRestoring || isAutoRestoring) ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!nostrService.publicKey ? (
                    <p>Connect to Nostr first to restore locked wallets</p>
                  ) : (isRestoring || isAutoRestoring) ? (
                    <p>{isAutoRestoring ? 'Auto-restoring wallets...' : 'Restoring wallets from Nostr...'}</p>
                  ) : (
                    <p>Restore locked wallets from Nostr relays</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Nostr connection indicator */}
            <div className={`h-2 w-2 rounded-full ${nostrService.publicKey ? 'bg-green-500' : 'bg-red-500'}`} title={nostrService.publicKey ? 'Nostr connected' : 'Nostr disconnected'} />
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setIsAdding(!isAdding)} 
              className="h-8 w-8 p-0"
              title="Add Wallet"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input 
                id="wallet-search-input"
                name="walletSearch"
                placeholder={`Search ${selectedWalletType} wallets...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-8 text-xs"
                aria-label={`Search ${selectedWalletType} wallets`}
              />
            </div>
            <div className={`h-8 px-3 text-xs rounded border bg-gradient-to-r ${getNetworkColor(selectedWalletType)} text-white flex items-center gap-1 font-medium`}>
              {getNetworkIcon(selectedWalletType)}
              {selectedWalletType} Only
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden flex flex-col p-4">
        {/* Add wallet form */}
            {isAdding && (
              <div className="rounded-xl bg-muted/50 p-4 space-y-3 mb-4 border">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="wallet-network-select" className="text-xs font-medium">Network</label>
                    <select 
                      id="wallet-network-select"
                      name="network"
                      value={selectedNetwork}
                      onChange={(e) => setSelectedNetwork(e.target.value as WalletType)}
                      className="w-full h-8 text-xs rounded border bg-background px-2"
                      title="Select blockchain network"
                      aria-label="Select blockchain network"
                    >
                      <option value="Alephium">Alephium</option>
                      <option value="Bitcoin">Bitcoin</option>
                      <option value="Ergo">Ergo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="wallet-label-input" className="text-xs font-medium">Label</label>
                    <Input 
                      id="wallet-label-input"
                      name="walletLabel"
                      placeholder="Wallet nickname" 
                      value={newLabel} 
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="h-8 text-xs"
                      aria-label="Wallet label or nickname"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="wallet-address-input" className="text-xs font-medium">Address</label>
                <Input 
                    id="wallet-address-input"
                    name="walletAddress"
                    placeholder={`Enter ${selectedNetwork} address`}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="h-8 text-xs"
                  aria-label={`${selectedNetwork} wallet address`}
                />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsAdding(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleAddWallet}
                    className="h-7 text-xs"
                  >
                    Add Wallet
                  </Button>
                </div>
              </div>
            )}

            {/* Wallets grid */}
            <div className="flex-grow overflow-y-auto scrollbar-hide">
              {filteredWallets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-medium">No {selectedWalletType} wallets found</p>
                  <p className="text-xs">
                    {selectedWalletType === "Bitcoin" 
                      ? "Connect your Bitcoin wallet or add a Bitcoin address to get started"
                      : selectedWalletType === "Ergo"
                      ? "Connect your Ergo wallet or add an Ergo address to get started" 
                      : "Connect your Alephium extension wallet or add an address to get started"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredWallets.map((wallet) => (
                    <WalletCard key={wallet.address} wallet={wallet} />
                  ))}
                </div>
              )}
            </div>
      </CardContent>
    </Card>
  );
};

export default WalletManager;


