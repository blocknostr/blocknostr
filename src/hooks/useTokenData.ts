
import { useState, useEffect } from "react";
import { fetchTokenList } from "@/lib/api/tokenMetadata";
import { fetchTokenTransactions } from "@/lib/api/alephiumApi";
import { TokenMetadata } from "@/lib/api/tokenMetadata";

export interface TokenTransaction {
  hash: string;
  timestamp: number;
  blockHash: string;
  inputs: Array<{address: string; amount: string; tokens?: Array<{id: string; amount: string}>}>;
  outputs: Array<{address: string; amount: string; tokens?: Array<{id: string; amount: string}>}>;
}

export interface EnrichedTokenData extends TokenMetadata {
  transactions: TokenTransaction[];
  isLoading: boolean;
  lastUpdated: number;
  walletAddresses?: string[]; // Wallets that hold this token
}

/**
 * Hook to fetch and manage token data with live updates
 * @param trackedWallets Optional array of wallet addresses to prioritize
 * @param refreshInterval Time in ms between refreshes
 */
export const useTokenData = (trackedWallets: string[] = [], refreshInterval = 5 * 60 * 1000) => {
  const [tokenData, setTokenData] = useState<Record<string, EnrichedTokenData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [prioritizedTokenIds, setPrioritizedTokenIds] = useState<string[]>([]);
  const [ownedTokens, setOwnedTokens] = useState<Set<string>>(new Set());

  // Fetch token list initially
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const tokens = await fetchTokenList();
        const tokenIdList = Object.keys(tokens);
        setTokenIds(tokenIdList);
        
        // Initialize token data structure
        const initialTokenData: Record<string, EnrichedTokenData> = {};
        tokenIdList.forEach(id => {
          initialTokenData[id] = {
            ...tokens[id],
            transactions: [],
            isLoading: true,
            lastUpdated: Date.now()
          };
        });
        
        setTokenData(initialTokenData);
      } catch (error) {
        console.error("Failed to fetch token list:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTokens();
  }, []);

  // Identify tokens in tracked wallets
  useEffect(() => {
    if (tokenIds.length === 0 || trackedWallets.length === 0) return;

    const fetchWalletTokens = async () => {
      try {
        // Make API calls to get tokens for each tracked wallet
        const walletTokenPromises = trackedWallets.map(async (walletAddress) => {
          try {
            // This would be a call to fetch tokens for a specific wallet
            // For example: const walletTokens = await getAddressTokens(walletAddress);
            // Here we're assuming there's an API that returns tokens for a wallet
            const walletResponse = await fetch(`https://backend.mainnet.alephium.org/addresses/${walletAddress}/tokens`);
            if (!walletResponse.ok) {
              console.error(`Failed to fetch tokens for wallet ${walletAddress}`);
              return [];
            }
            const walletTokens = await walletResponse.json();
            return walletTokens.map((token: any) => token.id);
          } catch (error) {
            console.error(`Error fetching tokens for wallet ${walletAddress}:`, error);
            return [];
          }
        });

        const results = await Promise.all(walletTokenPromises);
        
        // Flatten and deduplicate token IDs
        const ownedTokenIds = new Set<string>();
        results.forEach(walletTokenIds => {
          walletTokenIds.forEach((id: string) => ownedTokenIds.add(id));
        });
        
        setOwnedTokens(ownedTokenIds);
        
        // Prioritize owned tokens, followed by others
        const owned = tokenIds.filter(id => ownedTokenIds.has(id));
        const others = tokenIds.filter(id => !ownedTokenIds.has(id));
        
        // Limit the number of non-owned tokens we'll fetch data for to avoid overwhelming the API
        const prioritizedIds = [...owned, ...others.slice(0, 10)];
        setPrioritizedTokenIds(prioritizedIds);

        // Update token data with wallet information
        setTokenData(current => {
          const updated = {...current};
          owned.forEach(tokenId => {
            if (updated[tokenId]) {
              updated[tokenId] = {
                ...updated[tokenId],
                walletAddresses: trackedWallets
              };
            }
          });
          return updated;
        });
      } catch (error) {
        console.error("Failed to identify tokens in tracked wallets:", error);
      }
    };
    
    fetchWalletTokens();
  }, [tokenIds, trackedWallets]);

  // Fetch transactions for each token, prioritizing those in tracked wallets
  useEffect(() => {
    if (prioritizedTokenIds.length === 0) return;
    
    const fetchTokensData = async () => {
      let updatedTokens = {...tokenData};
      let updatesMade = false;
      
      // Process tokens in batches to avoid overwhelming the API
      for (let i = 0; i < prioritizedTokenIds.length; i++) {
        const tokenId = prioritizedTokenIds[i];
        const token = updatedTokens[tokenId];
        
        if (!token) continue;
        
        try {
          updatedTokens[tokenId] = {
            ...token,
            isLoading: true
          };
          setTokenData({...updatedTokens});
          
          // Fetch latest transactions for this token
          const transactions = await fetchTokenTransactions(tokenId, ownedTokens.has(tokenId) ? 20 : 5);
          
          // Only update if we got new data
          if (transactions.length > 0) {
            updatedTokens[tokenId] = {
              ...token,
              transactions,
              isLoading: false,
              lastUpdated: Date.now()
            };
            updatesMade = true;
          } else {
            updatedTokens[tokenId] = {
              ...token,
              isLoading: false
            };
          }
        } catch (error) {
          console.error(`Failed to fetch data for token ${tokenId}:`, error);
          updatedTokens[tokenId] = {
            ...token,
            isLoading: false
          };
        }
        
        // Small delay between token requests to prevent rate limiting
        if (i < prioritizedTokenIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      if (updatesMade) {
        setTokenData({...updatedTokens});
        setLastUpdated(Date.now());
      }
    };
    
    // Initial fetch
    fetchTokensData();
    
    // Set up periodic refresh
    const intervalId = setInterval(() => {
      console.log("Refreshing token transactions data...");
      fetchTokensData();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [prioritizedTokenIds, ownedTokens]);

  return {
    tokenData,
    isLoading,
    lastUpdated,
    ownedTokenIds: [...ownedTokens],
    refreshTokens: () => setLastUpdated(Date.now())
  };
};
