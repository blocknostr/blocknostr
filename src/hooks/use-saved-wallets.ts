
import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from 'sonner';
import { handleError } from '@/lib/utils/errorHandling';

export interface SavedWallet {
  address: string;
  label: string;
  isConnected: boolean;
  dateAdded: number;
}

export function useSavedWallets() {
  const [savedWallets, setSavedWallets] = useLocalStorage<SavedWallet[]>('blocknoster-saved-wallets', []);
  const [activeWalletIndex, setActiveWalletIndex] = useLocalStorage<number>('blocknoster-active-wallet', 0);

  // Get active wallet
  const activeWallet = savedWallets[activeWalletIndex] || null;

  // Add a new wallet
  const addWallet = (address: string, label: string = '', isConnected: boolean = false) => {
    try {
      // Check if wallet already exists
      if (savedWallets.some(wallet => wallet.address === address)) {
        toast.error("Wallet already exists", {
          description: "This wallet address is already saved"
        });
        return false;
      }

      // Add new wallet
      const newWallet: SavedWallet = {
        address,
        label: label || `Wallet ${savedWallets.length + 1}`,
        isConnected,
        dateAdded: Date.now()
      };

      const updated = [...savedWallets, newWallet];
      setSavedWallets(updated);
      
      // If this is the first wallet, set it as active
      if (updated.length === 1) {
        setActiveWalletIndex(0);
      }

      toast.success("Wallet added successfully");
      return true;
    } catch (error) {
      handleError(error, {
        toastMessage: "Failed to add wallet",
        logMessage: "Error adding wallet"
      });
      return false;
    }
  };

  // Remove a wallet
  const removeWallet = (address: string) => {
    try {
      const walletIndex = savedWallets.findIndex(wallet => wallet.address === address);
      
      if (walletIndex === -1) {
        toast.error("Wallet not found");
        return false;
      }

      // Remove the wallet
      const updated = savedWallets.filter((_, index) => index !== walletIndex);
      setSavedWallets(updated);

      // If we removed the active wallet, set to the first available
      if (walletIndex === activeWalletIndex) {
        setActiveWalletIndex(updated.length > 0 ? 0 : -1);
      } 
      // If we removed a wallet before the active one, adjust the index
      else if (walletIndex < activeWalletIndex) {
        setActiveWalletIndex(activeWalletIndex - 1);
      }

      toast.success("Wallet removed");
      return true;
    } catch (error) {
      handleError(error, {
        toastMessage: "Failed to remove wallet",
        logMessage: "Error removing wallet"
      });
      return false;
    }
  };

  // Set a wallet as active
  const setActiveWallet = (address: string) => {
    try {
      const index = savedWallets.findIndex(wallet => wallet.address === address);
      
      if (index === -1) {
        toast.error("Wallet not found");
        return false;
      }

      setActiveWalletIndex(index);
      toast.success("Wallet activated");
      return true;
    } catch (error) {
      handleError(error, {
        toastMessage: "Failed to set active wallet",
        logMessage: "Error setting active wallet"
      });
      return false;
    }
  };

  // Update wallet connected status
  const updateWalletConnection = (address: string, isConnected: boolean) => {
    const walletIndex = savedWallets.findIndex(wallet => wallet.address === address);
    
    if (walletIndex === -1) return;

    const updated = [...savedWallets];
    updated[walletIndex] = { ...updated[walletIndex], isConnected };
    setSavedWallets(updated);
  };

  // Update wallet label
  const updateWalletLabel = (address: string, label: string) => {
    try {
      const walletIndex = savedWallets.findIndex(wallet => wallet.address === address);
      
      if (walletIndex === -1) {
        toast.error("Wallet not found");
        return false;
      }

      const updated = [...savedWallets];
      updated[walletIndex] = { ...updated[walletIndex], label };
      setSavedWallets(updated);

      toast.success("Wallet label updated");
      return true;
    } catch (error) {
      handleError(error, {
        toastMessage: "Failed to update wallet label",
        logMessage: "Error updating wallet label"
      });
      return false;
    }
  };

  return {
    savedWallets,
    activeWallet,
    activeWalletIndex,
    addWallet,
    removeWallet,
    setActiveWallet,
    updateWalletConnection,
    updateWalletLabel
  };
}
