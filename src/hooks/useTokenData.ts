
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
}

/**
 * Hook to fetch and manage token data with live updates
 */
export const useTokenData = (refreshInterval = 5 * 60 * 1000) => {
  const [tokenData, setTokenData] = useState<Record<string, EnrichedTokenData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [tokenIds, setTokenIds] = useState<string[]>([]);

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

  // Fetch transactions for each token
  useEffect(() => {
    if (tokenIds.length === 0) return;
    
    const fetchTokensData = async () => {
      let updatedTokens = {...tokenData};
      let updatesMade = false;
      
      // Process tokens in batches to avoid overwhelming the API
      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i];
        const token = updatedTokens[tokenId];
        
        if (!token) continue;
        
        try {
          updatedTokens[tokenId] = {
            ...token,
            isLoading: true
          };
          setTokenData({...updatedTokens});
          
          // Fetch latest transactions for this token
          const transactions = await fetchTokenTransactions(tokenId, 10);
          
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
        if (i < tokenIds.length - 1) {
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
  }, [tokenIds]);

  return {
    tokenData,
    isLoading,
    lastUpdated,
    refreshTokens: () => setLastUpdated(Date.now())
  };
};
