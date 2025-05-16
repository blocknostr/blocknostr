import { SimplePool, getEventHash, Event, Filter } from 'nostr-tools';
import { TokenMetadata, fetchTokenList } from './tokenMetadata';

// Transaction interfaces
export interface TokenTransaction {
  hash: string;
  timestamp: number;
  blockHash: string;
  inputs: Array<{
    address: string;
    amount: string;
    tokens?: Array<{
      id: string;
      amount: string;
    }>;
  }>;
  outputs: Array<{
    address: string;
    amount: string;
    tokens?: Array<{
      id: string;
      amount: string;
    }>;
  }>;
}

interface TransactionCache {
  [tokenId: string]: {
    lastTxHash?: string;
    transactions: TokenTransaction[];
    lastFetched: number;
  };
}

// Constants
const TRANSACTIONS_API = 'https://backend.mainnet.alephium.org/tokens';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const NOSTR_RELAYS = ['wss://relay.damus.io', 'wss://nos.lol'];

// In-memory cache for transactions
const transactionCache: TransactionCache = {};

// Nostr connection pool for receiving real-time updates
let nostrPool: SimplePool | null = null;

/**
 * Initialize the Nostr pool for receiving transaction updates
 */
const initNostrPool = (): SimplePool => {
  if (!nostrPool) {
    nostrPool = new SimplePool();
    console.log('Initialized Nostr pool for transaction streaming');
  }
  return nostrPool;
};

/**
 * Fetch transactions for a specific token ID
 */
export const fetchTokenTransactions = async (
  tokenId: string,
  page: number = 1,
  limit: number = 20,
  forceRefresh: boolean = false
): Promise<TokenTransaction[]> => {
  // Check cache first if not forcing refresh
  const currentTime = Date.now();
  if (
    !forceRefresh &&
    transactionCache[tokenId] &&
    currentTime - transactionCache[tokenId].lastFetched < CACHE_DURATION
  ) {
    return transactionCache[tokenId].transactions;
  }

  try {
    const url = `${TRANSACTIONS_API}/${tokenId}/transactions?page=${page}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const transactions: TokenTransaction[] = Array.isArray(data) ? data : [];
    
    // Update cache
    transactionCache[tokenId] = {
      lastTxHash: transactions.length > 0 ? transactions[0].hash : undefined,
      transactions,
      lastFetched: currentTime
    };
    
    return transactions;
  } catch (error) {
    console.error(`Error fetching transactions for token ${tokenId}:`, error);
    // Return cached data if available, otherwise empty array
    return transactionCache[tokenId]?.transactions || [];
  }
};

/**
 * Subscribe to real-time transaction updates for a token
 */
export const subscribeToTokenTransactions = (
  tokenId: string,
  symbol: string,
  callback: (transaction: TokenTransaction) => void
): (() => void) => {
  const pool = initNostrPool();
  
  // Create filter for Alephium token transactions
  const filter: Filter = {
    kinds: [30000],
    '#d': ['alephium-token-transaction'],
    '#token_id': [tokenId]
  };
  
  console.log(`Subscribing to token transactions for ${tokenId} (${symbol})`);
  
  // Fixed: SimplePool.subscribe expects relays array, filter object, and optional options
  const sub = pool.subscribe(NOSTR_RELAYS, [filter], { id: `token-tx-${tokenId}` });
  
  // Set up event handler with manual event handling
  const eventHandler = (event: Event) => {
    try {
      // Parse transaction from event content
      const transaction: TokenTransaction = JSON.parse(event.content);
      
      // Update cache with new transaction
      if (!transactionCache[tokenId]) {
        transactionCache[tokenId] = {
          transactions: [],
          lastFetched: Date.now()
        };
      }
      
      // Only add if it's a new transaction
      if (!transactionCache[tokenId].transactions.some(tx => tx.hash === transaction.hash)) {
        transactionCache[tokenId].transactions.unshift(transaction);
        transactionCache[tokenId].lastTxHash = transaction.hash;
        
        // Call the callback with the new transaction
        callback(transaction);
      }
    } catch (error) {
      console.error('Error processing Nostr event:', error);
    }
  };
  
  // Register event handler
  sub.eose = () => console.log(`Initial sync complete for ${tokenId}`);
  sub.onevent = eventHandler;
  
  // Return unsubscribe function
  return () => {
    sub.close();
  };
};

/**
 * Fetch transactions for all tokens
 */
export const fetchAllTokenTransactions = async (
  limit: number = 10
): Promise<Record<string, TokenTransaction[]>> => {
  try {
    // Get all tokens first
    const tokens = await fetchTokenList();
    const result: Record<string, TokenTransaction[]> = {};
    
    // Fetch transactions for each token in parallel
    const promises = Object.values(tokens).map(async (token) => {
      const transactions = await fetchTokenTransactions(token.id, 1, limit);
      result[token.id] = transactions;
    });
    
    await Promise.all(promises);
    return result;
  } catch (error) {
    console.error('Error fetching all token transactions:', error);
    return {};
  }
};

/**
 * Subscribe to transactions for all tokens
 */
export const subscribeToAllTokenUpdates = (
  callback: (tokenId: string, symbol: string, transaction: TokenTransaction) => void
): (() => void) => {
  const pool = initNostrPool();
  
  // Create filter for all Alephium token transactions
  const filter: Filter = {
    kinds: [30000],
    '#d': ['alephium-token-transaction']
  };
  
  console.log('Subscribing to all token transactions');
  
  // Fixed: SimplePool.subscribe expects relays array, filter object, and optional options
  const sub = pool.subscribe(NOSTR_RELAYS, [filter], { id: 'all-token-tx' });
  
  // Set up event handler
  const eventHandler = (event: Event) => {
    try {
      // Get token ID from tags
      const tokenIdTag = event.tags.find(tag => tag[0] === 'token_id');
      const symbolTag = event.tags.find(tag => tag[0] === 'symbol');
      
      if (tokenIdTag && tokenIdTag[1]) {
        const tokenId = tokenIdTag[1];
        const symbol = symbolTag && symbolTag[1] ? symbolTag[1] : 'UNKNOWN';
        
        // Parse transaction from event content
        const transaction: TokenTransaction = JSON.parse(event.content);
        
        // Update cache
        if (!transactionCache[tokenId]) {
          transactionCache[tokenId] = {
            transactions: [],
            lastFetched: Date.now()
          };
        }
        
        // Only add if it's a new transaction
        if (!transactionCache[tokenId].transactions.some(tx => tx.hash === transaction.hash)) {
          transactionCache[tokenId].transactions.unshift(transaction);
          transactionCache[tokenId].lastTxHash = transaction.hash;
          
          // Call the callback with the new transaction
          callback(tokenId, symbol, transaction);
        }
      }
    } catch (error) {
      console.error('Error processing Nostr event:', error);
    }
  };
  
  // Register event handler
  sub.eose = () => console.log('Initial sync complete for all tokens');
  sub.onevent = eventHandler;
  
  // Return unsubscribe function
  return () => {
    sub.close();
  };
};

/**
 * Clean up resources
 */
export const cleanupTokenTransactions = (): void => {
  if (nostrPool) {
    nostrPool.close(NOSTR_RELAYS);
    nostrPool = null;
  }
};
