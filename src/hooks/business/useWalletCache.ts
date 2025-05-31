import { useState, useEffect, useCallback, useRef } from 'react';
import { SavedWallet, WalletCacheConfig, CacheStatus } from '@/api/types/wallet';
import { useLocalStorage } from '@/hooks/ui/use-local-storage';
import { toast } from '@/lib/toast';
import { nostrService } from '@/lib/nostr';

// Simplified wallet cache hook - removed complex caching logic
export function useWalletCache() {
  const [savedWallets, setSavedWallets] = useLocalStorage<SavedWallet[]>("blocknoster_saved_wallets", []);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  // Track restoration state to prevent concurrent operations
  const restorationInProgress = useRef(false);
  // Track if restoration has been attempted/completed in this session
  const restorationCompleted = useRef(false);
  // 🚀 NEW: Track previous Nostr state for better transition detection
  const previousNostrKey = useRef<string | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add a new wallet (simplified)
  const addWallet = useCallback((wallet: Omit<SavedWallet, 'cacheMetadata'>) => {
    const newWallet: SavedWallet = {
      ...wallet,
      // Add minimal cache metadata
      cacheMetadata: {
        cachedAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        lastRefresh: Date.now(),
        refreshInterval: 60 * 60 * 1000, // 1 hour
        version: '1.0.0',
        isStale: false,
        autoRefresh: false,
        retryCount: 0,
        maxRetries: 3,
      }
    };

    setSavedWallets(prev => [...prev, newWallet]);
    toast.success(`Added ${wallet.label}`);
    return newWallet;
  }, [setSavedWallets]);

  // Remove a wallet
  const removeWallet = useCallback((address: string) => {
    setSavedWallets(prev => {
      const filtered = prev.filter(w => w.address !== address);
      // If we're removing all wallets, reset restoration state
      if (filtered.length === 0) {
        restorationCompleted.current = false;
        console.log('[WalletCache] All wallets removed - reset restoration state');
      }
      return filtered;
    });
    toast.success("Wallet removed");
  }, [setSavedWallets]);

  // Update wallet
  const updateWallet = useCallback((address: string, updates: Partial<SavedWallet>) => {
    setSavedWallets(prev => prev.map(wallet => {
      if (wallet.address === address) {
        return { ...wallet, ...updates };
      }
      return wallet;
    }));
  }, [setSavedWallets]);

  // Simplified wallet staleness check
  const isWalletStale = useCallback((address: string): boolean => {
    const wallet = savedWallets.find(w => w.address === address);
    if (!wallet?.cacheMetadata) return true;
    
    const now = Date.now();
    return now > wallet.cacheMetadata.expiresAt;
  }, [savedWallets]);

  // Simplified refresh (just update timestamp)
  const forceRefreshWallet = useCallback(async (address: string) => {
    const now = Date.now();
    updateWallet(address, {
      cacheMetadata: {
        cachedAt: now,
        expiresAt: now + (60 * 60 * 1000), // 1 hour
        lastRefresh: now,
        refreshInterval: 60 * 60 * 1000,
        version: '1.0.0',
        isStale: false,
        autoRefresh: false,
        retryCount: 0,
        maxRetries: 3,
      }
    });
    toast.success("Wallet data refreshed");
    return true;
  }, [updateWallet]);

  // Restore wallets from Nostr events (simplified)
  const restoreWalletsFromNostr = useCallback(async () => {
    if (!nostrService.publicKey) {
      console.log('[WalletCache] No Nostr key available for wallet restoration');
      toast.error('Please connect to Nostr first');
      return;
    }

    if (restorationInProgress.current) {
      console.log('[WalletCache] Restoration already in progress - skipping duplicate attempt');
      return;
    }

    restorationInProgress.current = true;

    try {
      console.log('[WalletCache] 🔍 Searching for locked wallets...');
      console.log('[WalletCache] Current user pubkey:', nostrService.publicKey);
      
      // Query for wallet events (kind 30078) from current user
      const query = {
        kinds: [30078],
        authors: [nostrService.publicKey],
        limit: 50
      };
      
      console.log('[WalletCache] Query filter:', query);
      const walletEvents = await nostrService.queryEvents([query]);
      console.log(`[WalletCache] Found ${walletEvents.length} total events`);
      
      // Filter events to only include our app's wallet events
      const appWalletEvents = walletEvents.filter(event => {
        const hasAppTag = event.tags.some(tag => 
          tag.length >= 2 && tag[0] === 'app' && tag[1] === 'blocknostr'
        );
        const hasWalletDTag = event.tags.some(tag => 
          tag.length >= 2 && tag[0] === 'd' && tag[1].startsWith('wallet:')
        );
        return hasAppTag && hasWalletDTag;
      });
      
      console.log(`[WalletCache] Found ${appWalletEvents.length} blocknostr wallet events`);

      if (appWalletEvents.length === 0) {
        toast.info('No locked wallets found on Nostr relays');
        restorationCompleted.current = true;
        return;
      }

      // 🔥 BATCH PROCESSING: Collect all changes first, then apply them all at once
      const now = Date.now();
      const walletsToAdd: SavedWallet[] = [];
      const walletsToUpdate: { address: string; updates: Partial<SavedWallet> }[] = [];

      console.log(`[WalletCache] 📦 Processing ${appWalletEvents.length} events in batch mode...`);

      // Process each wallet event and collect changes
      for (const event of appWalletEvents) {
        try {
          const walletData = JSON.parse(event.content);
          const addressTag = event.tags.find(tag => tag[0] === 'wallet_address');
          const address = addressTag?.[1] || walletData.address;
          
          if (!address) {
            console.warn('[WalletCache] Wallet event missing address:', event.id);
            continue;
          }

          // Check if wallet already exists
          const existingWallet = savedWallets.find(w => w.address === address);
          
          if (existingWallet) {
            // Update existing wallet with lock information if needed
            if (!existingWallet.locked?.isLocked) {
              walletsToUpdate.push({
                address,
                updates: {
                  locked: {
                    isLocked: true,
                    eventId: event.id,
                    lockedAt: event.created_at * 1000
                  }
                }
              });
              console.log(`[WalletCache] 🔄 Queued lock status update for: ${address}`);
            }
          } else {
            // Create new wallet for batch addition
            const restoredWallet: SavedWallet = {
              address: address,
              label: walletData.label || 'Restored Wallet',
              dateAdded: walletData.dateAdded || (event.created_at * 1000),
              network: walletData.network || 'Alephium',
              isWatchOnly: walletData.isWatchOnly ?? true,
              locked: {
                isLocked: true,
                eventId: event.id,
                lockedAt: event.created_at * 1000
              },
              cacheMetadata: {
                cachedAt: now,
                expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours
                lastRefresh: now,
                refreshInterval: 60 * 60 * 1000,
                version: '1.0.0',
                isStale: false,
                autoRefresh: false,
                retryCount: 0,
                maxRetries: 3,
              }
            };

            walletsToAdd.push(restoredWallet);
            console.log(`[WalletCache] ➕ Queued wallet for restoration: ${restoredWallet.label} (${address})`);
          }
        } catch (error) {
          console.error('[WalletCache] Failed to parse wallet event:', event.id, error);
        }
      }

      // 🚀 APPLY ALL CHANGES IN A SINGLE BATCH
      console.log(`[WalletCache] 🚀 Applying batch changes: ${walletsToAdd.length} new wallets, ${walletsToUpdate.length} updates`);

      if (walletsToAdd.length > 0 || walletsToUpdate.length > 0) {
        setSavedWallets(currentWallets => {
          let updatedWallets = [...currentWallets];

          // Apply updates to existing wallets
          if (walletsToUpdate.length > 0) {
            const updateMap = new Map(walletsToUpdate.map(({ address, updates }) => [address, updates]));
            updatedWallets = updatedWallets.map(wallet => {
              const updates = updateMap.get(wallet.address);
              if (updates) {
                return {
                  ...wallet,
                  ...updates,
                  // Merge nested objects properly
                  locked: updates.locked ? { ...wallet.locked, ...updates.locked } : wallet.locked
                };
              }
              return wallet;
            });
          }

          // Add new wallets (with duplicate check)
          if (walletsToAdd.length > 0) {
            const existingAddresses = new Set(updatedWallets.map(w => w.address));
            const newWallets = walletsToAdd.filter(w => !existingAddresses.has(w.address));
            updatedWallets = [...updatedWallets, ...newWallets];
          }

          return updatedWallets;
        });
      }

      // Mark restoration as completed
      restorationCompleted.current = true;
      
      // Show success message
      const totalChanges = walletsToAdd.length + walletsToUpdate.length;
      if (totalChanges > 0) {
        if (walletsToAdd.length > 0 && walletsToUpdate.length > 0) {
          toast.success(`🎉 Restored ${walletsToAdd.length} wallet(s) and updated ${walletsToUpdate.length} existing wallet(s)`, {
            description: `All wallets synchronized from Nostr in a single batch`
          });
        } else if (walletsToAdd.length > 0) {
          toast.success(`🎉 Restored ${walletsToAdd.length} locked wallet(s) from Nostr`, {
            description: `All wallets loaded instantly`
          });
        } else {
          toast.success(`🔄 Updated ${walletsToUpdate.length} existing wallet(s) with lock status`);
        }
        console.log(`[WalletCache] ✅ Successfully batch-processed ${totalChanges} wallets (${walletsToAdd.length} new, ${walletsToUpdate.length} updated)`);
      } else {
        console.log('[WalletCache] No changes needed - all wallets already up to date');
      }
      
    } catch (error) {
      console.error('[WalletCache] Failed to restore wallets from Nostr:', error);
      toast.error('Failed to restore locked wallets from Nostr');
    } finally {
      restorationInProgress.current = false;
    }
  }, [nostrService.publicKey, savedWallets, setSavedWallets]);

  // 🚀 SIMPLIFIED AUTO-RESTORE: Focus on clear login transitions only
  useEffect(() => {
    const currentNostrKey = nostrService.publicKey;
    const wasLoggedOut = !previousNostrKey.current;
    const isNowLoggedIn = !!currentNostrKey;
    const hasNoWallets = savedWallets.length === 0;
    const notCompleted = !restorationCompleted.current;
    const notInProgress = !restorationInProgress.current;

    console.log('[WalletCache] 🔍 Auto-restore state check:', {
      previousKey: previousNostrKey.current ? 'present' : 'null',
      currentKey: currentNostrKey ? 'present' : 'null',
      wasLoggedOut,
      isNowLoggedIn,
      transition: wasLoggedOut && isNowLoggedIn ? 'LOGIN DETECTED' : 'no transition',
      hasNoWallets,
      notCompleted,
      notInProgress,
      shouldTrigger: wasLoggedOut && isNowLoggedIn && hasNoWallets && notCompleted && notInProgress
    });

    // Only auto-restore on clear login transition (simplified conditions)
    if (wasLoggedOut && isNowLoggedIn && hasNoWallets && notCompleted && notInProgress) {
      console.log('[WalletCache] 🚀 LOGIN TRANSITION auto-restoration triggered from useWalletCache');
      // Add small delay to let other components (like WalletManager) handle it first
      setTimeout(() => {
        if (!restorationInProgress.current && !restorationCompleted.current && savedWallets.length === 0) {
          console.log('[WalletCache] 🚀 Executing delayed auto-restoration');
          restoreWalletsFromNostr();
        } else {
          console.log('[WalletCache] 🚀 Auto-restoration skipped - already handled by another component');
        }
      }, 500); // 500ms delay to let WalletManager go first
    }

    // Update previous state
    previousNostrKey.current = currentNostrKey;
  }, [nostrService.publicKey, savedWallets.length, restoreWalletsFromNostr]);

  // Reset restoration state
  const resetRestorationState = useCallback(() => {
    restorationCompleted.current = false;
    restorationInProgress.current = false;
    console.log('[WalletCache] 🔄 Restoration state reset');
  }, []);

  return {
    // Basic wallet management
    savedWallets,
    addWallet,
    removeWallet,
    updateWallet,
    
    // Simple operations
    isWalletStale,
    forceRefreshWallet,
    
    // Nostr restoration
    restoreWalletsFromNostr,
    resetRestorationState,
    
    // Status
    isOnline,
  };
} 

