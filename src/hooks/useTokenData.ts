
import { useState, useEffect } from "react";
import { fetchTokenList } from "@/lib/api/tokenMetadata";
import { fetchTokenTransactions, getAddressTokens, EnrichedToken } from "@/lib/api/alephiumApi";
import { EnrichedTokenWithWallets, TokenWallet } from "@/types/wallet";
import { getAlephiumPrice, getMultipleCoinsPrice } from "@/lib/api/coingeckoApi";
import { getCoinGeckoId, getAllCoinGeckoIds, isTokenMapped } from "@/lib/api/tokenMappings";
import { toast } from "sonner";

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
  wallets: TokenWallet[]; // Updated to use the structured wallets array
  usdValue?: number; // Added USD value field
  priceSource?: 'market' | 'estimate'; // Indicates how we got the price
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
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [alphPrice, setAlphPrice] = useState<number>(0);
  const [tokenPrices, setTokenPrices] = useState<Record<string, { 
    price: number; 
    symbol: string;
    priceChange24h: number;
  }>>({});

  // Fetch all token prices from CoinGecko for mapped tokens
  useEffect(() => {
    const fetchTokenPrices = async () => {
      try {
        // Get all CoinGecko IDs we want to track
        const coinIds = getAllCoinGeckoIds();
        
        if (coinIds.length === 0) return;
        
        console.log("Fetching prices for tokens:", coinIds);
        const priceData = await getMultipleCoinsPrice(coinIds);
        
        // Create a map of CoinGecko ID to price data
        const prices: Record<string, { price: number; symbol: string; priceChange24h: number }> = {};
        priceData.forEach(coin => {
          prices[coin.id] = {
            price: coin.price,
            symbol: coin.symbol,
            priceChange24h: coin.priceChange24h
          };
        });
        
        console.log("Fetched token prices:", prices);
        setTokenPrices(prices);
        
        // Update ALPH price from the fetched data if available
        const alphPriceData = prices["alephium"];
        if (alphPriceData) {
          setAlphPrice(alphPriceData.price);
        }
      } catch (error) {
        console.error("Failed to fetch token prices:", error);
        // Fallback to just fetching ALPH price if the multi-price fetch fails
        fetchAlphPrice();
      }
    };
    
    const fetchAlphPrice = async () => {
      try {
        const priceData = await getAlephiumPrice();
        setAlphPrice(priceData.price);
        console.log("Fetched ALPH price:", priceData.price);
      } catch (error) {
        console.error("Failed to fetch ALPH price:", error);
      }
    };

    // Fetch initially and then on interval
    fetchTokenPrices();
    const priceInterval = setInterval(fetchTokenPrices, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(priceInterval);
  }, []);

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
              // Get price based on token ID
              let usdValue: number | undefined = undefined;
              let priceSource: 'market' | 'estimate' = 'estimate';
              
              // For ALPH (special case), amount is the token value
              if (tokenId === "ALPH" || tokenId.toLowerCase() === "alph") {
                const tokenAmountInAlph = Number(token.amount) / (10 ** token.decimals);
                usdValue = tokenAmountInAlph * alphPrice;
                priceSource = 'market';
              } 
              // For tokens with CoinGecko mapping, use market price
              else if (!token.isNFT) {
                const coingeckoId = getCoinGeckoId(tokenId);
                const tokenAmountNormalized = Number(token.amount) / (10 ** token.decimals);
                
                if (coingeckoId && tokenPrices[coingeckoId]) {
                  // Use actual price from CoinGecko
                  usdValue = tokenAmountNormalized * tokenPrices[coingeckoId].price;
                  priceSource = 'market';
                  console.log(`Using market price for ${token.symbol}: $${tokenPrices[coingeckoId].price}`);
                } else {
                  // Fallback for unmapped tokens - use ALPH price as reference with reduced multiplier
                  // This is a rough estimate for tokens without market data
                  usdValue = tokenAmountNormalized * alphPrice * 0.01;
                  priceSource = 'estimate';
                  console.log(`Using estimated price for ${token.symbol || tokenId}: ${alphPrice * 0.01}`);
                }
              }
              
              // First time we're seeing this token
              tokenMap[tokenId] = {
                ...token,
                transactions: [],
                isLoading: true,
                lastUpdated: Date.now(),
                wallets: [{ address: walletAddress, amount: token.amount }],
                usdValue,
                priceSource
              };
            } else {
              // Token exists in map, update with this wallet's data
              const currentToken = tokenMap[tokenId];
              
              // Add this wallet to the token's wallets
              if (currentToken.wallets) {
                currentToken.wallets.push({ address: walletAddress, amount: token.amount });
              } else {
                currentToken.wallets = [{ address: walletAddress, amount: token.amount }];
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
                    
                // Update USD value calculation with new amount
                if (!token.isNFT) {
                  // Calculate updated USD value
                  const tokenAmountInUnits = Number(currentToken.amount) / (10 ** token.decimals);
                  
                  if (tokenId === "ALPH" || tokenId.toLowerCase() === "alph") {
                    currentToken.usdValue = tokenAmountInUnits * alphPrice;
                    currentToken.priceSource = 'market';
                  }
                  // For mapped tokens, use actual CoinGecko price
                  else {
                    const coingeckoId = getCoinGeckoId(tokenId);
                    
                    if (coingeckoId && tokenPrices[coingeckoId]) {
                      currentToken.usdValue = tokenAmountInUnits * tokenPrices[coingeckoId].price;
                      currentToken.priceSource = 'market';
                    } else {
                      // Fallback for tokens without market data
                      currentToken.usdValue = tokenAmountInUnits * alphPrice * 0.01;
                      currentToken.priceSource = 'estimate';
                    }
                  }
                }
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
  }, [trackedWallets, refreshFlag, alphPrice, tokenPrices]);

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
  }, [prioritizedTokenIds, ownedTokens, tokenData]);

  return {
    tokenData,
    isLoading,
    lastUpdated,
    ownedTokenIds: [...ownedTokens],
    refreshTokens: () => setRefreshFlag(prev => prev + 1),
    alphPrice,
    tokenPrices
  };
};
