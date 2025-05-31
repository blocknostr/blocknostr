import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppSelector, useAppDispatch } from './redux';
import { selectUseReduxForWallet } from '@/store/slices/appSlice';
import {
  fetchWalletData,
  addWallet,
  removeWallet,
  updateWalletMetadata,
  connectWallet,
  disconnectWallet,
  selectWalletById,
  selectAllWallets
} from '@/store/slices/walletManagementSlice';
import { useWalletCache } from './useWalletCache';
import { useWalletData } from './useWalletData';
import { SavedWallet } from '@/api/types/wallet';
import { ReduxWallet } from '@/store/types';

interface UseWalletOptions {
  autoFetch?: boolean;
  staleTime?: number;
  refreshInterval?: number;
}

/**
 * Unified wallet hook that supports both legacy and Redux implementations
 * based on the feature flag.
 */
export function useWallet(address: string | null | undefined, options: UseWalletOptions = {}) {
  const {
    autoFetch = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refreshInterval = 30 * 1000 // 30 seconds
  } = options;
  
  const dispatch = useAppDispatch();
  const useReduxForWallet = useAppSelector(selectUseReduxForWallet);
  
  // Legacy hooks
  const walletCache = useWalletCache();
  const legacyWalletData = useWalletData(address || null, {
    enableAutoRefresh: autoFetch,
    staleTime,
    refreshInterval
  });
  
  // State for legacy implementation
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  
  // Redux state
  const reduxWallet = useAppSelector(state => 
    address ? selectWalletById(state, address) : null
  );
  const allReduxWallets = useAppSelector(selectAllWallets);
  
  // Legacy fetch implementation
  const fetchLegacyWallet = useCallback(async () => {
    if (!address) return null;
    
    try {
      await legacyWalletData.refresh();
      setLastFetched(Date.now());
      return legacyWalletData.walletSummary;
    } catch (error) {
      console.error('Error fetching wallet with legacy implementation:', error);
      return null;
    }
  }, [address, legacyWalletData]);
  
  // Redux fetch implementation
  const fetchReduxWallet = useCallback(async () => {
    if (!address) return null;
    
    try {
      const resultAction = await dispatch(fetchWalletData({ address }));
      if (fetchWalletData.fulfilled.match(resultAction)) {
        return resultAction.payload;
      }
      return null;
    } catch (error) {
      console.error('Error fetching wallet with Redux:', error);
      return null;
    }
  }, [address, dispatch]);
  
  // Unified fetch function
  const fetchWalletInfo = useCallback(async () => {
    if (!address) return null;
    
    if (useReduxForWallet) {
      return fetchReduxWallet();
    } else {
      return fetchLegacyWallet();
    }
  }, [address, useReduxForWallet, fetchReduxWallet, fetchLegacyWallet]);
  
  // Add wallet
  const addWalletToSystem = useCallback(async (walletDetails: {
    address: string;
    label: string;
    network: string;
    isWatchOnly?: boolean;
  }) => {
    if (useReduxForWallet) {
      try {
        const resultAction = await dispatch(addWallet(walletDetails));
        return addWallet.fulfilled.match(resultAction);
      } catch (error) {
        console.error('Error adding wallet with Redux:', error);
        return false;
      }
    } else {
      try {
        walletCache.addWallet({
          address: walletDetails.address,
          label: walletDetails.label,
          network: walletDetails.network,
          dateAdded: Date.now(),
          isWatchOnly: walletDetails.isWatchOnly ?? true
        });
        return true;
      } catch (error) {
        console.error('Error adding wallet with legacy implementation:', error);
        return false;
      }
    }
  }, [useReduxForWallet, dispatch, walletCache]);
  
  // Remove wallet
  const removeWalletFromSystem = useCallback(async (addressToRemove: string) => {
    if (useReduxForWallet) {
      try {
        await dispatch(removeWallet(addressToRemove));
        return true;
      } catch (error) {
        console.error('Error removing wallet with Redux:', error);
        return false;
      }
    } else {
      try {
        walletCache.removeWallet(addressToRemove);
        return true;
      } catch (error) {
        console.error('Error removing wallet with legacy implementation:', error);
        return false;
      }
    }
  }, [useReduxForWallet, dispatch, walletCache]);
  
  // Connect wallet
  const connectWalletToSystem = useCallback(async (addressToConnect: string) => {
    if (useReduxForWallet) {
      try {
        const resultAction = await dispatch(connectWallet({ address: addressToConnect }));
        return connectWallet.fulfilled.match(resultAction);
      } catch (error) {
        console.error('Error connecting wallet with Redux:', error);
        return false;
      }
    } else {
      try {
        // In legacy implementation, just update the watch-only status
        walletCache.updateWallet(addressToConnect, {
          isWatchOnly: false
        });
        return true;
      } catch (error) {
        console.error('Error connecting wallet with legacy implementation:', error);
        return false;
      }
    }
  }, [useReduxForWallet, dispatch, walletCache]);
  
  // Auto-fetch wallet if needed
  useEffect(() => {
    if (autoFetch && address) {
      fetchWalletInfo();
    }
  }, [autoFetch, address, fetchWalletInfo]);
  
  // Convert wallet formats for consistent return type
  const convertLegacyWallet = useCallback((savedWallet: SavedWallet | null, walletData: any) => {
    if (!savedWallet) return null;
    
    return {
      address: savedWallet.address,
      label: savedWallet.label,
      network: savedWallet.network,
      isWatchOnly: savedWallet.isWatchOnly,
      isConnected: !savedWallet.isWatchOnly,
      dateAdded: savedWallet.dateAdded,
      lastUpdated: walletData?.lastUpdated || Date.now(),
      balance: walletData?.balance || {
        balance: 0,
        lockedBalance: 0,
        utxoNum: 0,
      },
      isReduxWallet: false
    };
  }, []);
  
  // Return appropriate data based on implementation
  return useMemo(() => {
    // Get wallet data from appropriate source
    let wallet = null;
    let isLoading = false;
    let error = null;
    
    if (useReduxForWallet) {
      wallet = reduxWallet ? { ...reduxWallet, isReduxWallet: true } : null;
      isLoading = address ? !!reduxWallet?.loadingBalances : false;
      error = address ? reduxWallet?.walletErrors?.[address] || null : null;
    } else {
      const savedWallet = address ? walletCache.savedWallets.find(w => w.address === address) : null;
      wallet = convertLegacyWallet(savedWallet, legacyWalletData.walletSummary);
      isLoading = legacyWalletData.isLoading;
      error = legacyWalletData.error;
    }
    
    // Get all wallets
    const allWallets = useReduxForWallet 
      ? allReduxWallets.map(w => ({ ...w, isReduxWallet: true }))
      : walletCache.savedWallets.map(w => convertLegacyWallet(w, null)).filter(Boolean);
    
    return {
      wallet,
      allWallets,
      isLoading,
      error,
      fetchWallet: fetchWalletInfo,
      addWallet: addWalletToSystem,
      removeWallet: removeWalletFromSystem,
      connectWallet: connectWalletToSystem,
      isReduxEnabled: useReduxForWallet,
    };
  }, [
    useReduxForWallet,
    reduxWallet,
    allReduxWallets,
    address,
    legacyWalletData,
    walletCache.savedWallets,
    convertLegacyWallet,
    fetchWalletInfo,
    addWalletToSystem,
    removeWalletFromSystem,
    connectWalletToSystem,
  ]);
}

export default useWallet; 
