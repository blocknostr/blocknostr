
import { useState, useEffect } from "react";
import { fetchTokenList } from "@/lib/api/tokenMetadata";
import { fetchTokenTransactions, getAddressTokens, EnrichedToken } from "@/lib/api/alephiumApi";

export interface TokenTransaction {
  hash: string;
  timestamp: number;
  blockHash: string;
  inputs: Array<{address: string; amount: string; tokens?: Array<{id: string; amount: string}>}>;
  outputs: Array<{address: string; amount: string; tokens?: Array<{id: string; amount: string}>}>;
  tokenId?: string; // Added for when we enrich transactions
}

export interface EnrichedTokenData extends EnrichedToken {
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

  // Identify tokens in tracked wallets and fetch token metadata
  useEffect(() => {
    const fetchWalletTokens = async () => {
      if (trackedWallets.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log("Fetching tokens for tracked wallets:", trackedWallets);
        
        // Use the correct getAddressTokens function from alephiumApi.ts
        const walletTokenPromises = trackedWallets.map(walletAddress => 
          getAddressTokens(walletAddress).catch(err => {
            console.error(`Error fetching tokens for wallet ${walletAddress}:`, err);
            return []; // Return empty array on error for this wallet
          })
        );
        
        const allWalletsTokenResults = await Promise.all(walletTokenPromises);
        console.log("All wallet token results:", allWalletsTokenResults);
        
        // Process tokens - aggregate all tokens across wallets
        const tokenMap: Record<string, EnrichedTokenData> = {};
        const ownedTokenIds = new Set<string>();
        
        allWalletsTokenResults.forEach((walletTokens, walletIndex) => {
          const walletAddress = trackedWallets[walletIndex];
          
          // Process each token from this wallet
          walletTokens.forEach((token: EnrichedToken) => {
            const tokenId = token.id;
            ownedTokenIds.add(tokenId);
            
            if (!tokenMap[tokenId]) {
              // First time we're seeing this token
              tokenMap[tokenId] = {
                ...token,
                transactions: [],
                isLoading: true,
                lastUpdated: Date.now(),
                walletAddresses: [walletAddress]
              };
            } else {
              // Token exists in map, update with this wallet's data
              const currentToken = tokenMap[tokenId];
              
              // Add this wallet to the token's wallets
              if (currentToken.walletAddresses) {
                if (!currentToken.walletAddresses.includes(walletAddress)) {
                  currentToken.walletAddresses.push(walletAddress);
                }
              } else {
                currentToken.walletAddresses = [walletAddress];
              }
              
              // Sum the amount (use BigInt to handle large numbers)
              try {
                const currentAmount = BigInt(currentToken.amount || "0");
                const additionalAmount = BigInt(token.amount || "0");
                currentToken.amount = (currentAmount + additionalAmount).toString();
                
                // Recalculate formatted amount with new total
                currentToken.formattedAmount = token.isNFT 
                  ? currentToken.amount 
                  : (Number(currentToken.amount) / (10 ** token.decimals)).toLocaleString(
                      undefined, 
                      { minimumFractionDigits: 0, maximumFractionDigits: token.decimals }
                    );
              } catch (error) {
                console.error(`Error summing amounts for token ${tokenId}:`, error);
              }
            }
          });
        });
        
        // Get a list of all token IDs
        const allTokenIds = Object.keys(tokenMap);
        setTokenIds(allTokenIds);
        setTokenData(tokenMap);
        setOwnedTokens(ownedTokenIds);
        
        // Prioritize owned tokens for transaction fetching
        const owned = allTokenIds.filter(id => ownedTokenIds.has(id));
        const prioritizedIds = [...owned];
        setPrioritizedTokenIds(prioritizedIds);
        
        setIsLoading(false);
        setLastUpdated(Date.now());
      } catch (error) {
        console.error("Failed to identify tokens in tracked wallets:", error);
        setIsLoading(false);
      }
    };
    
    fetchWalletTokens();
  }, [trackedWallets, refreshFlag]);

  // Trigger refresh
  const [refreshFlag, setRefreshFlag] = useState(0);

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
          
          // Add tokenId to each transaction for reference
          const enrichedTransactions = transactions.map(tx => ({
            ...tx, 
            tokenId
          }));
          
          // Only update if we got new data
          if (enrichedTransactions.length > 0) {
            updatedTokens[tokenId] = {
              ...token,
              transactions: enrichedTransactions,
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
      setRefreshFlag(prev => prev + 1);
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [prioritizedTokenIds, ownedTokens]);

  return {
    tokenData,
    isLoading,
    lastUpdated,
    ownedTokenIds: [...ownedTokens],
    refreshTokens: () => setRefreshFlag(prev => prev + 1)
  };
};
