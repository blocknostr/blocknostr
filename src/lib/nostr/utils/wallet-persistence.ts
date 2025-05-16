
import { EVENT_KINDS } from "../constants";
import { nostrService } from "../index";
import { SavedWallet, WalletList } from "@/types/wallet";
import { handleError } from "@/lib/utils/errorHandling";

// Custom kind for storing wallet addresses (using a high number in the replaceable range)
const WALLET_LIST_KIND = 30078;

/**
 * Save wallet list to Nostr as a replaceable event
 */
export async function saveWalletList(walletList: WalletList): Promise<boolean> {
  if (!nostrService.publicKey) {
    console.warn("Cannot save wallets: not logged in");
    return false;
  }

  try {
    // Create a NIP-01 compliant event
    const event = {
      kind: WALLET_LIST_KIND, // Custom kind for wallet list
      content: JSON.stringify(walletList),
      tags: [["d", "alephium-wallet-list"]] // Use 'd' tag for making it replaceable per NIP-01
    };

    // Publish to relays
    const eventId = await nostrService.publishEvent(event);
    return !!eventId;
  } catch (error) {
    handleError(error, {
      toastMessage: "Failed to save wallet list",
      logMessage: "Error saving wallet list"
    });
    return false;
  }
}

/**
 * Load wallet list from Nostr
 */
export async function loadWalletList(): Promise<WalletList | null> {
  if (!nostrService.publicKey) {
    console.warn("Cannot load wallets: not logged in");
    return null;
  }

  try {
    // Query relays for the latest wallet list event
    const filter = {
      kinds: [WALLET_LIST_KIND],
      authors: [nostrService.publicKey],
      "#d": ["alephium-wallet-list"]
    };

    // Fix: Pass filter as part of an array of filters
    const events = await nostrService.getEvents([filter]);
    if (!events || events.length === 0) {
      return null;
    }

    // Sort by created_at to get the most recent event
    const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];

    // Parse the content
    return JSON.parse(latestEvent.content);
  } catch (error) {
    handleError(error, {
      toastMessage: "Failed to load wallet list",
      logMessage: "Error loading wallet list"
    });
    return null;
  }
}

/**
 * Add a wallet to the list and save
 */
export async function addWallet(address: string, label: string): Promise<boolean> {
  try {
    const currentList = await loadWalletList() || { wallets: [], activeWalletIndex: 0 };
    
    // Check if we've reached the maximum number of wallets
    if (currentList.wallets.length >= 6) {
      throw new Error("Maximum number of wallets (6) reached");
    }
    
    // Check if the wallet already exists
    if (currentList.wallets.some(w => w.address === address)) {
      throw new Error("This wallet is already in your list");
    }
    
    // Add the new wallet
    const newWallet: SavedWallet = {
      address,
      label,
      addedAt: Math.floor(Date.now() / 1000),
      lastUsed: Math.floor(Date.now() / 1000)
    };
    
    // Add to list and save
    currentList.wallets.push(newWallet);
    return await saveWalletList(currentList);
  } catch (error) {
    handleError(error, {
      toastMessage: typeof error === "object" && error !== null && "message" in error 
        ? error.message as string 
        : "Failed to add wallet",
      logMessage: "Error adding wallet"
    });
    return false;
  }
}

/**
 * Remove a wallet from the list and save
 */
export async function removeWallet(address: string): Promise<boolean> {
  try {
    const currentList = await loadWalletList();
    if (!currentList) return false;
    
    // Find the index of the wallet to remove
    const walletIndex = currentList.wallets.findIndex(w => w.address === address);
    if (walletIndex === -1) return false;
    
    // Remove the wallet
    currentList.wallets.splice(walletIndex, 1);
    
    // Adjust active wallet index if needed
    if (currentList.wallets.length === 0) {
      currentList.activeWalletIndex = 0;
    } else if (currentList.activeWalletIndex >= currentList.wallets.length) {
      currentList.activeWalletIndex = currentList.wallets.length - 1;
    }
    
    return await saveWalletList(currentList);
  } catch (error) {
    handleError(error, {
      toastMessage: "Failed to remove wallet",
      logMessage: "Error removing wallet"
    });
    return false;
  }
}

/**
 * Set a wallet as active
 */
export async function setActiveWallet(index: number): Promise<boolean> {
  try {
    const currentList = await loadWalletList();
    if (!currentList || index >= currentList.wallets.length || index < 0) return false;
    
    // Update last used time
    currentList.wallets[index].lastUsed = Math.floor(Date.now() / 1000);
    
    // Set as active
    currentList.activeWalletIndex = index;
    
    return await saveWalletList(currentList);
  } catch (error) {
    handleError(error, {
      toastMessage: "Failed to set active wallet",
      logMessage: "Error setting active wallet"
    });
    return false;
  }
}
