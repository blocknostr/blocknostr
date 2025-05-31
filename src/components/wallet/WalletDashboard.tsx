import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BalanceHistoryChart from "@/components/wallet/charts/BalanceHistoryChart";
import TokenPortfolioTable from "@/components/wallet/TokenPortfolioTable";
import TransactionsList from "@/components/wallet/TransactionsList";
import AllWalletsTransactionsList from "@/components/wallet/AllWalletsTransactionsList";
import NFTGallery from "@/components/wallet/NFTGallery";
import ExplorerTab from "@/components/explorer/ExplorerTab";
import { formatNumber, formatCurrency } from "@/lib/utils/formatters";
import { WifiOff, Wifi, DollarSign, Wallet, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, Clock, Zap, Settings, RefreshCw, Database, Trash2, Bug, Download, Loader2, Search } from "lucide-react";
import { getAddressBalance, getAddressTokens, batchFetchWalletData } from "@/api/external/cachedAlephiumApi";
import { clearTokenCache } from "@/api/external/alephiumApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EnrichedTokenWithWallets, SavedWallet, TokenWallet } from "@/api/types/wallet";
import { fetchTokenList } from "@/api/external/tokenMetadata";
import { getCoinGeckoId, isTokenMapped } from "@/api/external/tokenMappings";

// Redux pricing hooks - now properly utilized for 100% Redux coverage
import { useGetTokenPricesQuery } from "@/api/rtk/walletApi";

import UnifiedNetworkCard from "@/components/wallet/UnifiedNetworkCard";
import WalletManager from "@/components/wallet/WalletManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWalletCache } from "@/hooks/business/useWalletCache";
import { nostrService } from "@/lib/nostr";
import { toast } from "@/lib/toast";
import { formatDistanceToNow } from "date-fns";
import NFTCacheDebug from "@/components/wallet/NFTCacheDebug";

// Phase 1: Enhanced interfaces for better API monitoring
interface APIHealthStatus {
  isHealthy: boolean;
  responseTime: number;
  lastCheck: Date;
  consecutiveFailures: number;
  source: "node" | "explorer" | "hybrid" | "cache";
}

interface EnhancedAPIStatus {
  isLive: boolean;
  lastChecked: Date;
  health: APIHealthStatus;
  errors: {
    balance: string | null;
    tokens: string | null;
    price: string | null;
    network: string | null;
  };
}

interface WalletDashboardProps {
  address: string;
  allWallets?: SavedWallet[];
  isLoggedIn: boolean;
  walletStats: {
    transactionCount: number;
    receivedAmount: number;
    sentAmount: number;
    tokenCount: number;
  };
  isStatsLoading: boolean;
  refreshFlag: number;
  setRefreshFlag: (flag: number) => void;
  activeTab?: string;
  walletManagerProps?: any; // Props for the wallet manager popup
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({ 
  address, 
  allWallets = [],
  isLoggedIn, 
  walletStats, 
  isStatsLoading,
  refreshFlag,
  setRefreshFlag,
  activeTab = "portfolio",
  walletManagerProps
}) => {
  // Phase 1: Enhanced state management with better error tracking
  const [apiStatus, setApiStatus] = useState<EnhancedAPIStatus>({
    isLive: false,
    lastChecked: new Date(),
    health: {
      isHealthy: true,
      responseTime: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      source: "node"
    },
    errors: {
      balance: null,
      tokens: null,
      price: null,
      network: null
    }
  });

  const [balances, setBalances] = useState<Record<string, number>>({});
  const [priceData, setPriceData] = useState<{
    price: number;
    priceChange24h: number;
  }>({ price: 0, priceChange24h: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [allTokens, setAllTokens] = useState<EnrichedTokenWithWallets[]>([]);
  const [totalTokenCount, setTotalTokenCount] = useState(0);
  const [totalTokenValue, setTotalTokenValue] = useState<number>(0);

  // Phase 1: Enhanced retry and circuit breaker state
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);
  const [isInRecoveryMode, setIsInRecoveryMode] = useState(false);

  // Memoize wallet addresses to prevent unnecessary re-renders
  const walletAddresses = useMemo(() => {
    const addresses = allWallets.map(wallet => wallet.address);
    console.log("[Enhanced Dashboard] Memoizing wallet addresses:", addresses);
    return addresses;
  }, [allWallets.map(w => w.address).sort().join(',')]);

  // Phase 1: Enhanced loading state management with exponential backoff
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isCurrentlyFetching, setIsCurrentlyFetching] = useState(false);
  
  // Track collected token IDs for Redux pricing query (include ALPH)
  const [collectedTokenIds, setCollectedTokenIds] = useState<string[]>(['ALPH']);
  
  // Track active tab to optimize NFT loading
  const [currentActiveTab, setCurrentActiveTab] = useState("tokens");
  const [nftsLoadedOnce, setNftsLoadedOnce] = useState(false);
  
  // Use Redux pricing query - properly utilizing Redux for 100% coverage with performance optimization
  const {
    data: tokenPricesData,
    isLoading: isPricingLoading,
    error: pricingError,
    refetch: refetchPrices
  } = useGetTokenPricesQuery(
    { tokenIds: collectedTokenIds },
    { 
      skip: false, // FIXED: Never skip - always fetch ALPH pricing data
      refetchOnMountOrArgChange: true, // FIXED: Ensure data loads on mount
      refetchOnFocus: false,
      refetchOnReconnect: false,
      pollingInterval: 300000, // 5 minutes
    }
  );
  
  // Wallet manager popup state
  const [isWalletPopupOpen, setIsWalletPopupOpen] = useState(false);
  
  // Transaction view state  
  const [transactionView, setTransactionView] = useState<"current" | "all">("current");

  // Phase 1: Enhanced API status updater with health metrics
  const updateApiStatus = (
    isLive: boolean, 
    healthUpdate?: Partial<APIHealthStatus>,
    errorUpdate?: Partial<EnhancedAPIStatus['errors']>
  ) => {
    setApiStatus(prev => ({
      isLive,
      lastChecked: new Date(),
      health: {
        ...prev.health,
        ...healthUpdate,
        lastCheck: new Date()
      },
      errors: {
        ...prev.errors,
        ...errorUpdate
      }
    }));
  };

  // Phase 1: Enhanced error classification and retry logic
  const classifyError = (error: any): { retryable: boolean; severity: 'low' | 'medium' | 'high' } => {
    const message = error?.message?.toLowerCase() || '';
    
    // Enhanced error classification for better robustness
    if (message.includes('429') || message.includes('rate limit')) {
      return { retryable: true, severity: 'medium' };
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return { retryable: true, severity: 'high' };
    }
    if (message.includes('timeout') || message.includes('aborted')) {
      return { retryable: true, severity: 'medium' };
    }
    if (message.includes('404') || message.includes('not found')) {
      return { retryable: false, severity: 'low' };
    }
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return { retryable: true, severity: 'high' };
    }
    if (message.includes('cors') || message.includes('blocked')) {
      return { retryable: false, severity: 'high' };
    }
    
    return { retryable: true, severity: 'medium' };
  };

  // Enhanced recovery function for better robustness
  const attemptRecovery = async () => {
    console.log("[Enhanced Dashboard] 🔄 Attempting recovery...");
    setIsInRecoveryMode(true);
    
    // Clear all caches to force fresh data
    try {
      clearTokenCache();
      
      // Reset retry attempts and recovery state
      setTimeout(() => {
        setRetryAttempts(0);
        setIsInRecoveryMode(false);
        console.log("[Enhanced Dashboard] ✅ Recovery complete, state reset");
      }, 2000);
      
    } catch (error) {
      console.error("[Enhanced Dashboard] ❌ Recovery failed:", error);
      setIsInRecoveryMode(false);
    }
  };

  // Phase 1: Enhanced batch fetch with intelligent retry and circuit breaker
  useEffect(() => {
    const fetchAllBalances = async () => {
      // Prevent multiple simultaneous fetches
      if (isCurrentlyFetching) {
        console.log("[Enhanced Dashboard] Fetch already in progress, skipping");
        return;
      }

      if (walletAddresses.length === 0) {
        setIsLoading(false);
        return;
      }

      // Phase 1: Enhanced rate limiting with exponential backoff
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      const baseInterval = 10000; // 10 seconds base
      const backoffMultiplier = Math.min(Math.pow(1.5, retryAttempts), 8); // Max 8x backoff
      const requiredInterval = baseInterval * backoffMultiplier;
      
      if (timeSinceLastFetch < requiredInterval && lastFetchTime > 0) {
        console.log(`[Enhanced Dashboard] Rate limited, waiting ${requiredInterval - timeSinceLastFetch}ms (attempt ${retryAttempts})`);
        return;
      }
      
      setIsLoading(true);
      setIsCurrentlyFetching(true);
      setLastFetchTime(now);
      
      // Clear previous errors
      updateApiStatus(apiStatus.isLive, undefined, {
        balance: null,
        tokens: null,
        price: null,
        network: null
      });
      
      const startTime = Date.now();
      
      try {
        console.log("[Enhanced Dashboard] Starting enhanced batch fetch for wallets:", walletAddresses);
        
        // Use ALPH price from Redux pricing system with smart waiting - NON-BLOCKING approach
        console.log("[Enhanced Dashboard] 🏁 Getting ALPH price (non-blocking)...");
        let alphPrice = 3.80; // Updated fallback price
        
        // If Redux is currently loading, try to get current cached data or wait briefly
        if (isPricingLoading && !tokenPricesData) {
          console.log("[Enhanced Dashboard] ⏳ Redux pricing loading, will use fallback and update later");
        } else if (tokenPricesData && tokenPricesData['ALPH'] && tokenPricesData['ALPH'].price > 0) {
          alphPrice = tokenPricesData['ALPH'].price;
          console.log("[Enhanced Dashboard] ✅ ALPH price from Redux:", alphPrice);
        } else if (tokenPricesData) {
          console.log("[Enhanced Dashboard] ⚠️ Redux data available but no ALPH price. Available tokens:", Object.keys(tokenPricesData));
          console.log("[Enhanced Dashboard] 💰 Using fallback price, will update when ALPH data arrives");
        } else {
          console.log("[Enhanced Dashboard] 💰 Redux data not yet available, using fallback (will update via useEffect)");
        }
        
        const priceResult = { 
          price: alphPrice, 
          priceChange24h: 0, // Will be updated from CoinGecko if needed
          lastUpdated: new Date() 
        };
        console.log("[Enhanced Dashboard] 🏁 ALPH price ready:", priceResult.price, isPricingLoading ? "(loading)" : "(final)");
        
        // Now fetch other APIs in parallel
        const [batchResults, tokenMetadata] = await Promise.allSettled([
          batchFetchWalletData(walletAddresses, { skipNFTMetadata: currentActiveTab !== 'nfts' }),
          fetchTokenList()
        ]);
        
        const fetchTime = Date.now() - startTime;
        
        // Phase 1: Enhanced price data handling with error classification
        let priceData = { price: 0, priceChange24h: 0 };
        let priceError: string | null = null;
        
        // Use the Redux-sourced price result - 100% Redux architecture achieved
        priceData = priceResult;
        console.log("[Enhanced Dashboard] ✅ Using Redux-sourced ALPH price:", priceData.price);
        
        // Phase 1: Enhanced token metadata handling
        let tokenMetadataMap = {};
        if (tokenMetadata.status === 'fulfilled') {
          tokenMetadataMap = tokenMetadata.value;
        } else {
          console.warn("[Enhanced Dashboard] Token metadata fetch failed:", tokenMetadata.reason?.message);
        }
        
        // Phase 1: Enhanced batch results processing with detailed error tracking
        const newBalances: Record<string, number> = {};
        const tokenMap: Record<string, EnrichedTokenWithWallets> = {};
        let totalTokens = 0;
        let calculatedTotalTokenValue = 0;
        let balanceError: string | null = null;
        let tokensError: string | null = null;
        let results: any = null;
        
        if (batchResults.status === 'fulfilled') {
          results = batchResults.value;
          
          // Process balances with error tracking
          results.balances.forEach((balance, address) => {
            newBalances[address] = balance.balance || 0;
          });
          
          // Process tokens with enhanced error handling and batch pricing
          const processTokensAsync = async () => {
            const processingStartTime = performance.now();
            
            // Build comprehensive token map and collect token IDs for Redux pricing
            const allTokenIds: string[] = ['ALPH']; // Always include ALPH for portfolio value calculation
            
            console.log('[Enhanced Dashboard] 🚀 Starting optimized token processing...');
            console.log(`[Enhanced Dashboard] Active tab: ${currentActiveTab} - NFT processing: ${currentActiveTab === 'nfts' ? 'ENABLED' : 'DISABLED'}`);
            
            for (const [address, tokens] of results.tokens.entries()) {
              console.log(`[Enhanced Dashboard] Processing ${tokens.length} tokens for wallet ${address}`);
              totalTokens += tokens.length;
              
              for (const token of tokens) {
                // Skip NFT processing unless NFTs tab is active
                if (token.isNFT && currentActiveTab !== 'nfts') {
                  console.log(`[Enhanced Dashboard] Skipping NFT ${token.name || token.id.substring(0, 8)} - NFT tab not active`);
                  continue;
                }
                
                if (!tokenMap[token.id] && !token.isNFT) {
                  // Collect all unique regular token IDs (exclude NFTs)
                  allTokenIds.push(token.id);
                }
              }
            }
            
            // Update collected token IDs for Redux query if they changed - PERFORMANCE FIX
            const sortedNewIds = [...allTokenIds].sort();
            const sortedCurrentIds = [...collectedTokenIds].sort();
            
            // Only update if actually different to prevent unnecessary Redux queries
            const idsChanged = JSON.stringify(sortedNewIds) !== JSON.stringify(sortedCurrentIds);
            if (idsChanged && !isPricingLoading) {
              console.log(`[Enhanced Dashboard] Updated token IDs for Redux pricing: ${allTokenIds.length} tokens (including ALPH)`);
              setCollectedTokenIds(allTokenIds);
            } else if (idsChanged && isPricingLoading) {
              console.log(`[Enhanced Dashboard] Token IDs changed but pricing query in progress, deferring update`);
            }
            
            // Use Redux pricing data - properly utilizing Redux for 100% coverage
            console.log(`[Enhanced Dashboard] Using Redux pricing for ${allTokenIds.length} regular tokens`);
            
            let tokenPricesMap = new Map();
            if (tokenPricesData && Object.keys(tokenPricesData).length > 0) {
              // Convert Redux data to Map format for compatibility
              for (const [tokenId, priceData] of Object.entries(tokenPricesData)) {
                tokenPricesMap.set(tokenId, priceData);
              }
              console.log(`[Enhanced Dashboard] ✅ Received ${tokenPricesMap.size} token prices from Redux pricing system`);
            } else if (isPricingLoading) {
              console.log(`[Enhanced Dashboard] 🔄 Redux pricing query loading...`);
            } else if (pricingError) {
              console.warn(`[Enhanced Dashboard] ❌ Redux pricing query failed:`, pricingError);
            } else {
              console.log(`[Enhanced Dashboard] 📭 No pricing data available from Redux`);
            }
            
            // Process all tokens with simplified pricing
            for (const [address, tokens] of results.tokens.entries()) {
              for (const token of tokens) {
                const tokenId = token.id;
                
                // Skip NFT processing unless NFTs tab is active
                if (token.isNFT && currentActiveTab !== 'nfts') {
                  continue;
                }
                
                if (!tokenMap[tokenId]) {
                  // Calculate USD values using batch pricing data
                  let usdValue: number | undefined = undefined;
                  let priceSource: 'market' | 'estimate' = 'estimate';
                  
                  if (!token.isNFT) {
                    const tokenAmountInUnits = Number(token.amount) / (10 ** token.decimals);
                    
                    // Use batch pricing data for all tokens
                    const tokenPriceData = tokenPricesMap.get(tokenId);
                    
                    if (tokenPriceData && tokenPriceData.price > 0) {
                      usdValue = tokenAmountInUnits * tokenPriceData.price;
                      priceSource = tokenPriceData.source === 'coingecko' ? 'market' : 'estimate';
                      console.log(`[Enhanced Dashboard] ${tokenPriceData.symbol} price: $${tokenPriceData.price} from ${tokenPriceData.source}`);
                    } else {
                      // No price available from simplified service
                      usdValue = 0;
                      priceSource = 'estimate';
                      console.log(`[Enhanced Dashboard] No price available for ${token.symbol || token.name || tokenId.substring(0, 8)} (${tokenId.substring(0, 8)}...)`);
                    }
                    
                    if (usdValue !== undefined) {
                      calculatedTotalTokenValue += usdValue;
                    }
                  }
                  
                  tokenMap[tokenId] = {
                    ...token,
                    wallets: [{ address, amount: token.amount }],
                    usdValue: usdValue,
                    priceSource: priceSource
                  } as EnrichedTokenWithWallets;
                } else {
                  // Skip NFT aggregation unless NFTs tab is active  
                  if (token.isNFT && currentActiveTab !== 'nfts') {
                    continue;
                  }
                  
                  // Token aggregation for multiple wallets
                  tokenMap[tokenId].wallets.push({ address, amount: token.amount });
                  
                  try {
                    const currentAmount = BigInt(tokenMap[tokenId].amount || "0");
                    const additionalAmount = BigInt(token.amount || "0");
                    tokenMap[tokenId].amount = (currentAmount + additionalAmount).toString();
                    
                    tokenMap[tokenId].formattedAmount = token.isNFT 
                      ? tokenMap[tokenId].amount 
                      : (Number(tokenMap[tokenId].amount) / 10**token.decimals).toLocaleString(
                          undefined, 
                          { minimumFractionDigits: 0, maximumFractionDigits: token.decimals }
                        );
                    
                    // Recalculate USD value for aggregated tokens
                    if (!token.isNFT) {
                      const tokenAmountInUnits = Number(tokenMap[tokenId].amount) / (10 ** token.decimals);
                      
                      // For aggregated tokens, recalculate using existing pricing
                      const existingPrice = tokenMap[tokenId].usdValue ? 
                        (tokenMap[tokenId].usdValue || 0) / (Number(tokenMap[tokenId].amount.split(',')[0] || tokenMap[tokenId].amount) / (10 ** token.decimals)) : 0;
                      
                      if (existingPrice > 0) {
                        tokenMap[tokenId].usdValue = tokenAmountInUnits * existingPrice;
                      } else {
                        // Use batch pricing if available, or keep zero
                        const tokenPriceData = tokenPricesMap?.get(tokenId);
                        if (tokenPriceData && tokenPriceData.price > 0) {
                          tokenMap[tokenId].usdValue = tokenAmountInUnits * tokenPriceData.price;
                                                      tokenMap[tokenId].priceSource = tokenPriceData.source === 'coingecko' ? 'market' : 'estimate';
                        } else {
                          tokenMap[tokenId].usdValue = 0;
                          tokenMap[tokenId].priceSource = 'estimate';
                        }
                      }
                    }
                  } catch (error) {
                    console.error(`[Enhanced Dashboard] Error aggregating token ${tokenId}:`, error);
                  }
                }
              }
            }
            
            // Recalculate total token value after all processing
            calculatedTotalTokenValue = 0;
            Object.values(tokenMap).forEach(mapToken => {
              if (mapToken.usdValue !== undefined) {
                calculatedTotalTokenValue += mapToken.usdValue;
              }
            });
            
            console.log(`[Enhanced Dashboard] ✅ Optimized processing complete! Total token value: $${calculatedTotalTokenValue.toFixed(2)}`);
            
            const processingTime = performance.now() - processingStartTime;
            console.log(`[Enhanced Dashboard] ⚡ Performance: Token processing completed in ${processingTime.toFixed(2)}ms`);
            console.log(`[Enhanced Dashboard] 📊 Efficiency: ${allTokenIds.length} tokens processed`);
          };
          
          // Execute the async token processing
          await processTokensAsync();
          
          // Enhanced error reporting
          if (results.errors.size > 0) {
            const errorMessages: string[] = [];
            results.errors.forEach((error, address) => {
              console.warn(`  ${address}: ${error}`);
              errorMessages.push(`${address.substring(0, 8)}...: ${error}`);
            });
            balanceError = `Partial data: ${errorMessages.join('; ')}`;
          }
          
        } else {
          const error = classifyError(batchResults.reason);
          balanceError = `${error.severity} error: ${batchResults.reason?.message || 'Failed to fetch wallet data'}`;
          console.error("[Enhanced Dashboard] Batch fetch failed:", batchResults.reason?.message);
        }
        
        // Phase 1: Enhanced state updates with success tracking
        setBalances(newBalances);
        setAllTokens(Object.values(tokenMap));
        setTotalTokenCount(Object.keys(tokenMap).length);
        setTotalTokenValue(calculatedTotalTokenValue);
        setPriceData(priceData);
        
        // Phase 1: Enhanced API status update with comprehensive health metrics
        const isSuccessful = Object.keys(newBalances).length > 0;
        const dataSource: APIHealthStatus['source'] = 
          results?.errors?.size === 0 ? 'hybrid' : 
          results?.errors?.size && results.errors.size < walletAddresses.length ? 'node' : 'cache';
        
        updateApiStatus(isSuccessful, {
          isHealthy: isSuccessful,
          responseTime: fetchTime,
          consecutiveFailures: isSuccessful ? 0 : apiStatus.health.consecutiveFailures + 1,
          source: dataSource
        }, {
          balance: balanceError,
          tokens: tokensError,
          price: priceError
        });
        
        if (isSuccessful) {
          setRetryAttempts(0);
          setLastSuccessfulFetch(new Date());
          setIsInRecoveryMode(false);
          
          // Mark NFTs as loaded if we processed them
          if (currentActiveTab === 'nfts') {
            setNftsLoadedOnce(true);
          }
        }
        
      } catch (error: any) {
        console.error('[Enhanced Dashboard] Critical error during fetch:', error.message);
        const errorClassification = classifyError(error);
        
        updateApiStatus(false, {
          isHealthy: false,
          responseTime: Date.now() - startTime,
          consecutiveFailures: apiStatus.health.consecutiveFailures + 1,
          source: 'cache'
        }, {
          balance: `Critical ${errorClassification.severity} error: ${error.message}`,
          network: errorClassification.retryable ? 'Retrying...' : 'Manual refresh required'
        });
        
        if (errorClassification.retryable) {
          setRetryAttempts(prev => prev + 1);
          setIsInRecoveryMode(true);
        }
      } finally {
        setIsLoading(false);
        setIsCurrentlyFetching(false);
      }
    };
    
    fetchAllBalances();
  }, [walletAddresses.join(','), refreshFlag]);

  // Trigger refresh when switching to NFTs tab for the first time
  useEffect(() => {
    if (currentActiveTab === 'nfts' && !nftsLoadedOnce && !isCurrentlyFetching) {
      console.log("[Enhanced Dashboard] 🖼️ NFTs tab activated for first time - triggering refresh");
      setRefreshFlag(Date.now());
    }
  }, [currentActiveTab, nftsLoadedOnce, isCurrentlyFetching, setRefreshFlag]);

  // Update price data when Redux pricing becomes available - NON-BLOCKING
  useEffect(() => {
    console.log(`[Enhanced Dashboard] 🔍 Redux pricing status - Loading: ${isPricingLoading}, Data: ${tokenPricesData ? Object.keys(tokenPricesData).length : 0} items`);
    
    if (tokenPricesData && tokenPricesData['ALPH'] && tokenPricesData['ALPH'].price > 0) {
      const newPrice = tokenPricesData['ALPH'].price;
      setPriceData(prev => {
        if (prev.price !== newPrice) {
          console.log(`[Enhanced Dashboard] 🔄 Updating ALPH price from Redux: $${newPrice} (was $${prev.price})`);
          return { ...prev, price: newPrice };
        }
        return prev;
      });
    } else if (tokenPricesData) {
      console.log(`[Enhanced Dashboard] ⚠️ Redux data available but no ALPH price:`, tokenPricesData);
    }
  }, [tokenPricesData, isPricingLoading]);

  // Log Redux pricing query status - DEBUGGING
  useEffect(() => {
    console.log(`[Enhanced Dashboard] 💰 Redux pricing query status: tokens=${JSON.stringify(collectedTokenIds)}, loading=${isPricingLoading}, data=${tokenPricesData ? Object.keys(tokenPricesData).length : 0}`);
    
    if (pricingError) {
      console.error(`[Enhanced Dashboard] ❌ Redux pricing error:`, pricingError);
    }
  }, [collectedTokenIds, isPricingLoading, tokenPricesData, pricingError]);

  // Calculate enhanced portfolio metrics
  const totalAlphBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
  const portfolioValue = totalAlphBalance * priceData.price + totalTokenValue;
  const hasErrors = Object.values(apiStatus.errors).some(error => error !== null);
  const hasWarnings = apiStatus.health.consecutiveFailures > 0 || isInRecoveryMode;

  // Render appropriate content based on the active tab
  if (activeTab === "portfolio") {
    return (
      <div className="space-y-6">
        {hasWarnings && !hasErrors && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  {isInRecoveryMode ? 'Recovering from connection issues...' : 
                   `Connection issues detected - retry #${retryAttempts}`}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {apiStatus.health.source}
                  </Badge>
                  {!isInRecoveryMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={attemptRecovery}
                      className="h-6 px-2 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {hasErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Data loading issues detected</div>
                  <div className="text-sm">Some information may be incomplete or outdated</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={attemptRecovery}
                  disabled={isInRecoveryMode}
                  className="h-8 px-3 text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isInRecoveryMode ? 'animate-spin' : ''}`} />
                  {isInRecoveryMode ? 'Recovering...' : 'Force Refresh'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          {/* Simplified animated background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/15 via-purple-400/15 to-cyan-400/15"></div>
          </div>

          <CardHeader className="pb-3 relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 mr-4">
                <CardTitle className="text-lg font-semibold">Portfolio Overview</CardTitle>
                <CardDescription className="text-sm opacity-90 flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    apiStatus.health.isHealthy ? 'bg-green-500' : 'bg-red-500'
                  } animate-pulse`}></span>
                  {apiStatus.health.isHealthy ? 'Live' : 'Degraded'} data • 
                  {apiStatus.health.responseTime}ms • 
                  Updated {apiStatus.lastChecked.toLocaleTimeString()}
                </CardDescription>
              </div>
              
              {/* Simplified Wallet Manager Button */}
              {walletManagerProps && (
                <Dialog open={isWalletPopupOpen} onOpenChange={setIsWalletPopupOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 bg-gradient-to-br from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/15 border-primary/20 backdrop-blur-sm"
                    >
                      <Wallet className="h-4 w-4 mr-2 text-primary" />
                      <span className="font-medium text-sm">Manage Wallets</span>
                      <div className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/20 text-xs font-semibold text-primary">
                        {allWallets.length}
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Wallet Manager
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <WalletManager {...walletManagerProps} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <div className="space-y-4">
                            {/* Portfolio Value Display */}
              <div className="space-y-6">
                {/* Primary Balance Section */}
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-48" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Primary Balance Display */}
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-3">
                          <div className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-primary/80 bg-clip-text text-transparent">
                            {totalAlphBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </div>
                          <div className="text-xl font-semibold text-primary">ALPH</div>
                          {apiStatus.errors.balance && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-xl font-semibold flex items-center gap-2 text-foreground">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            {formatCurrency(portfolioValue)}
                          </div>
                          <div 
                            className={`flex items-center text-sm px-3 py-1 rounded-full backdrop-blur-sm ${
                              priceData.priceChange24h >= 0 
                                ? 'bg-green-500/15 text-green-700 border border-green-500/30' 
                                : 'bg-red-500/15 text-red-700 border border-red-500/30'
                            }`}
                          >
                            {priceData.priceChange24h >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {priceData.priceChange24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Balance History Chart - Full Width */}
                <div className="w-full">
                  <div className="h-[320px] rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 shadow-lg overflow-hidden">
                    <div className="p-3 border-b border-border/20">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Balance History
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            ALPH: <span className="font-semibold text-green-600">${priceData.price.toFixed(2)}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {apiStatus.health.source}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 h-[calc(100%-50px)]">
                      <BalanceHistoryChart 
                        address={address} 
                        alphPrice={priceData.price}
                        showPrice={true}
                        days={30}
                        refreshFlag={refreshFlag}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Tabs for detailed views */}
              <Tabs 
                defaultValue="tokens" 
                value={currentActiveTab}
                onValueChange={setCurrentActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-5 w-full mb-4">
                  <TabsTrigger value="tokens">Tokens</TabsTrigger>
                  <TabsTrigger value="nfts">NFTs</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="explorer" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Explorer
                  </TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                </TabsList>
            
            <TabsContent value="tokens" className="space-y-4 w-full">
              {hasErrors && apiStatus.errors.tokens && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Token data may be incomplete: {apiStatus.errors.tokens}
                  </AlertDescription>
                </Alert>
              )}
              <Card className="h-[420px] flex flex-col w-full">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Token Portfolio
                        {apiStatus.errors.tokens && (
                          <Badge variant="outline" className="text-xs">Partial Data</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Fungible tokens and cryptocurrencies • 
                        Quality: {hasErrors ? 'Degraded' : hasWarnings ? 'Limited' : 'Full'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full animate-pulse ${
                        apiStatus.health.isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <Badge variant="outline" className="text-xs">
                        {allTokens.filter(token => !token.isNFT).length} Tokens
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <div className="h-[300px] overflow-y-auto overflow-x-auto relative token-scroll" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}>
                    <div className="p-4 min-w-[600px]">
                      <TokenPortfolioTable 
                        tokens={allTokens}
                        alphPrice={priceData.price}
                        isLoading={isLoading}
                        className="border-0 shadow-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="nfts" className="space-y-4 w-full">
              {hasErrors && apiStatus.errors.tokens && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    NFT data may be incomplete: {apiStatus.errors.tokens}
                  </AlertDescription>
                </Alert>
              )}
              <Card className="h-[420px] flex flex-col w-full">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        NFT Gallery
                        {apiStatus.errors.tokens && (
                          <Badge variant="outline" className="text-xs">Partial Data</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Non-fungible tokens with enhanced metadata • 
                        Quality: {hasErrors ? 'Degraded' : hasWarnings ? 'Limited' : 'Full'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full animate-pulse ${
                        apiStatus.health.isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <Badge variant="outline" className="text-xs">
                        {currentActiveTab === 'nfts' || nftsLoadedOnce 
                          ? `${allTokens.filter(token => token.isNFT).length} NFTs`
                          : "NFTs (Lazy Load)"
                        }
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <div className="h-[300px] overflow-y-auto overflow-x-auto relative token-scroll" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}>
                                        <div className="p-4">
                      <NFTGallery 
                        address={address} 
                        allTokens={currentActiveTab === 'nfts' ? allTokens.filter(token => token.isNFT) : []} // Only pass NFTs when tab is active
                        updateApiStatus={updateApiStatus}
                        apiHealth={apiStatus.health}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            

            
            <TabsContent value="transactions" className="space-y-4 w-full">
              {hasErrors && apiStatus.errors.balance && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Transaction data may be incomplete: {apiStatus.errors.balance}
                  </AlertDescription>
                </Alert>
              )}
              <Card className="h-[420px] flex flex-col w-full">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Transaction History
                        {apiStatus.errors.balance && (
                          <Badge variant="outline" className="text-xs">Limited Data</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {transactionView === "current" 
                          ? `Recent transactions for current wallet • Network: ${apiStatus.health.source}`
                          : `All transactions from ${allWallets.length} managed wallets • Combined view`
                        } • Health: {apiStatus.health.isHealthy ? 'Good' : 'Degraded'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full animate-pulse ${
                        apiStatus.health.isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <Badge variant="outline" className="text-xs">
                        {transactionView === "current" ? `${walletStats.transactionCount} total` : `${allWallets.length} wallets`}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Transaction View Toggle */}
                  <div className="flex gap-1 mt-3 p-1 bg-muted rounded-lg">
                    <Button
                      variant={transactionView === "current" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setTransactionView("current")}
                      className="flex-1 h-8 text-xs"
                    >
                      This Wallet
                    </Button>
                    <Button
                      variant={transactionView === "all" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setTransactionView("all")}
                      className="flex-1 h-8 text-xs"
                    >
                      All Wallets
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <div className="h-[300px] overflow-y-auto overflow-x-auto relative token-scroll" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}>
                    <div className="p-4">
                      {transactionView === "current" ? (
                        <TransactionsList 
                          address={address} 
                          updateApiStatus={updateApiStatus}
                          apiHealth={apiStatus.health}
                        />
                      ) : (
                        <AllWalletsTransactionsList
                          savedWallets={allWallets}
                          selectedWalletType="Alephium"
                          updateApiStatus={updateApiStatus}
                          apiHealth={apiStatus.health}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="explorer" className="space-y-4 w-full">
              <Card className="h-[420px] flex flex-col w-full">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Alephium Explorer
                      </CardTitle>
                      <CardDescription>
                        Powered by official Alephium Explorer Backend parsing logic • Search transactions and addresses
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full animate-pulse ${
                        apiStatus.health.isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <Badge variant="outline" className="text-xs">
                        Official Parser
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <div className="h-[300px] overflow-y-auto overflow-x-auto relative token-scroll" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}>
                    <div className="p-4">
                      <ExplorerTab selectedAddress={address} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="space-y-4 w-full">
              <ToolsPanel 
                apiStatus={apiStatus}
                hasErrors={hasErrors}
                isInRecoveryMode={isInRecoveryMode}
                retryAttempts={retryAttempts}
                lastSuccessfulFetch={lastSuccessfulFetch}
                allWallets={allWallets}
              />
            </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (activeTab === "dapps") {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2">Explore Alephium dApps</h3>
          <p className="text-muted-foreground">Discover and interact with decentralized applications on the Alephium blockchain</p>
        </div>
        
        <DAppsSection />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-background">
            <CardHeader>
              <CardTitle>My Favorite dApps</CardTitle>
              <CardDescription>Quick access to your most used applications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Connect your wallet to see your favorite dApps
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-background">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent dApp interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Connect your wallet to see your recent activity
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (activeTab === "alephium") {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2">Alephium Network</h3>
          <p className="text-muted-foreground">Network statistics and activity overview</p>
        </div>
        
        <UnifiedNetworkCard updateApiStatus={updateApiStatus} />
      </div>
    );
  }

  // Phase 1: Enhanced fallback for other tabs with error awareness
  return (
    <div className="space-y-6">
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some data may be incomplete due to connection issues. 
            {isInRecoveryMode && " Recovery in progress..."}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Enhanced Wallet Dashboard
            <Badge variant="outline" className="text-xs">
              {apiStatus.health.source}
            </Badge>
          </CardTitle>
          <CardDescription>
            Advanced monitoring and analytics • 
            Status: {apiStatus.health.isHealthy ? 'Healthy' : 'Degraded'} • 
            Response: {apiStatus.health.responseTime}ms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              Enhanced dashboard ready for {activeTab} view
            </div>
            {hasWarnings && (
              <div className="mt-2 text-sm text-yellow-600">
                Operating with {apiStatus.health.consecutiveFailures} recent failures
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ✨ Compact and Minimalistic Tools Panel Component
interface ToolsPanelProps {
  apiStatus: EnhancedAPIStatus;
  hasErrors: boolean;
  isInRecoveryMode: boolean;
  retryAttempts: number;
  lastSuccessfulFetch: Date | null;
  allWallets: SavedWallet[];
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({ 
  apiStatus, 
  hasErrors, 
  isInRecoveryMode, 
  retryAttempts, 
  lastSuccessfulFetch,
  allWallets 
}) => {
  const {
    savedWallets,
    addWallet,
    removeWallet,
    restoreWalletsFromNostr,
    resetRestorationState,
    isOnline
  } = useWalletCache();

  const [isRestoring, setIsRestoring] = useState(false);
  const [autoRestorationTriggered, setAutoRestorationTriggered] = useState(false);
  const [loginTransitionDetected, setLoginTransitionDetected] = useState(false);

  // Monitor for auto-restoration activity
  useEffect(() => {
    if (nostrService.publicKey && savedWallets.length === 0) {
      setAutoRestorationTriggered(true);
      const timer = setTimeout(() => setAutoRestorationTriggered(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [nostrService.publicKey, savedWallets.length]);

  // Monitor for login transitions
  const previousNostrState = useRef<string | null>(null);
  useEffect(() => {
    const currentNostrState = nostrService.publicKey;
    const wasLoggedOut = !previousNostrState.current;
    const isNowLoggedIn = !!currentNostrState;
    
    if (wasLoggedOut && isNowLoggedIn && savedWallets.length === 0) {
      setLoginTransitionDetected(true);
      setTimeout(() => setLoginTransitionDetected(false), 5000);
    }
    
    previousNostrState.current = currentNostrState;
  }, [nostrService.publicKey, savedWallets.length]);

  const handleManualRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreWalletsFromNostr();
    } catch (error) {
      console.error('Manual restore failed:', error);
      toast.error('Manual restore failed');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleResetRestorationState = () => {
    resetRestorationState();
    setAutoRestorationTriggered(false);
    setLoginTransitionDetected(false);
    toast.success('Restoration state reset');
  };

  const handleClearAllWallets = () => {
    savedWallets.forEach(wallet => {
      removeWallet(wallet.address);
    });
    setAutoRestorationTriggered(false);
    toast.success('All wallets cleared');
  };

  const handleAddTestWallet = () => {
    const testAddress = `test${Date.now()}`;
    addWallet({
      address: testAddress,
      label: `Test Wallet ${Date.now()}`,
      dateAdded: Date.now(),
      network: "Alephium",
      isWatchOnly: true
    });
    toast.success('Test wallet added');
  };

  return (
    <Card className="h-[420px] flex flex-col w-full">
      <CardHeader className="pb-3 px-4 pt-3">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Development Tools
          {(isRestoring || autoRestorationTriggered || loginTransitionDetected) && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          )}
        </CardTitle>
        <CardDescription>
          System status, wallet management, and debugging utilities
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        <div className="h-[320px] overflow-y-auto relative" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
        }}>
          <div className="p-4 space-y-4">
            
            {/* Compact System Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  {apiStatus.health.isHealthy ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-xs font-medium">API</span>
                </div>
                <div className="text-sm font-bold">
                  {apiStatus.health.isHealthy ? 'Healthy' : 'Degraded'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {apiStatus.health.responseTime}ms
                </div>
              </div>

              <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs font-medium">Network</span>
                </div>
                <div className="text-sm font-bold">
                  {isOnline ? 'Online' : 'Offline'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {apiStatus.health.consecutiveFailures} failures
                </div>
              </div>

              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`h-2 w-2 rounded-full ${nostrService.publicKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs font-medium">Nostr</span>
                </div>
                <div className="text-sm font-bold">
                  {nostrService.publicKey ? 'Connected' : 'Disconnected'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {savedWallets.length} wallets
                </div>
              </div>

              <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-medium">Rate Limit</span>
                </div>
                <div className="text-sm font-bold">
                  {(() => {
                    try {
                      const rateLimitStats = nostrService.getRateLimiterStats();
                      return `${rateLimitStats.globalActive}/${rateLimitStats.globalMax}`;
                    } catch {
                      return 'N/A';
                    }
                  })()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Active requests
                </div>
              </div>
            </div>

            {/* Active Status Alerts */}
            {(hasErrors || isInRecoveryMode || loginTransitionDetected) && (
              <div className="space-y-2">
                {hasErrors && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-xs font-medium text-red-700">System Issues</span>
                    </div>
                    <div className="text-xs text-red-600">
                      {Object.entries(apiStatus.errors).filter(([, error]) => error).length} active error(s)
                    </div>
                  </div>
                )}

                {isInRecoveryMode && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3 w-3 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-700">Recovery Mode</span>
                    </div>
                    <div className="text-xs text-yellow-600">
                      Attempt #{retryAttempts}
                    </div>
                  </div>
                )}

                {loginTransitionDetected && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />
                      <span className="text-xs font-medium text-blue-700">Auto-Restoring</span>
                    </div>
                    <div className="text-xs text-blue-600">
                      Login detected - restoring wallets
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wallet Debug Info */}
            <div className="p-3 rounded-lg bg-muted/50 border border-muted">
              <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                <Bug className="h-3 w-3" />
                Wallet Debug
              </h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>User: {nostrService.publicKey ? `${nostrService.publicKey.substring(0, 8)}...` : 'Not connected'}</div>
                <div>Total Wallets: {savedWallets.length}</div>
                <div>Locked: {savedWallets.filter(w => w.locked?.isLocked).length}</div>
                <div>Auto-restore: {nostrService.publicKey && savedWallets.length === 0 ? 'Ready' : 'Inactive'}</div>
              </div>
            </div>

            {/* Nostr Rate Limiter Debug */}
            <div className="p-3 rounded-lg bg-muted/50 border border-muted">
              <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                <RefreshCw className="h-3 w-3" />
                Nostr Rate Limiter
              </h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                {(() => {
                  try {
                    const rateLimitStats = nostrService.getRateLimiterStats();
                    const totalQueued = Object.values(rateLimitStats.relayStats).reduce((sum, relay) => sum + relay.queued, 0);
                    return (
                      <>
                        <div>Active: {rateLimitStats.globalActive}/{rateLimitStats.globalMax}</div>
                        <div>Queued: {totalQueued} requests</div>
                        <div>Relays: {Object.keys(rateLimitStats.relayStats).length}</div>
                        <div className="pt-1 space-y-0.5">
                          {Object.entries(rateLimitStats.relayStats).slice(0, 3).map(([relay, stats]) => (
                            <div key={relay} className="text-[10px]">
                              {relay.split('/').pop()}: {stats.active}/{stats.max} (+{stats.queued})
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  } catch {
                    return <div>Rate limiter not available</div>;
                  }
                })()}
              </div>
            </div>

            {/* Token Cache Debug */}
            <div className="p-3 rounded-lg bg-muted/50 border border-muted">
              <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                <Database className="h-3 w-3" />
                Token Cache & API Status
              </h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                {(() => {
                  try {
                    const cacheStats = window.getTokenCacheStats ? window.getTokenCacheStats() : null;
                    if (cacheStats) {
                      return (
                        <>
                          <div>Metadata Cache: {cacheStats.metadata.totalCached} items</div>
                          <div>Type Cache: {cacheStats.tokenTypes.totalCached} items</div>
                          <div>SDK Queue: {cacheStats.sdkRateLimiter.queueLength} pending</div>
                          <div>SDK Active: {cacheStats.sdkRateLimiter.activeRequests}/3 requests</div>
                        </>
                      );
                    }
                    return <div>Cache stats not available</div>;
                  } catch {
                    return <div>Cache monitoring disabled</div>;
                  }
                })()}
              </div>
            </div>

            {/* Current Wallets */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium">Current Wallets ({savedWallets.length})</h4>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {savedWallets.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded text-center">
                    {nostrService.publicKey ? (
                      autoRestorationTriggered ? (
                        <span className="text-blue-600">🔄 Searching for locked wallets...</span>
                      ) : (
                        "No wallets found - Try manual restore"
                      )
                    ) : (
                      "Connect to Nostr to restore locked wallets"
                    )}
                  </div>
                ) : (
                  savedWallets.map((wallet) => (
                    <div key={wallet.address} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{wallet.label}</div>
                        <div className="text-muted-foreground">
                          {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 4)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {wallet.locked?.isLocked && (
                          <div className="px-1 py-0.5 rounded bg-green-500/20 text-green-700 text-[10px] font-medium">
                            Locked
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(wallet.dateAdded, { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Compact Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRestore}
                disabled={isRestoring || !nostrService.publicKey}
                className="h-8 text-xs"
              >
                {isRestoring ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                <span className="ml-1">Restore</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetRestorationState}
                className="h-8 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                <span className="ml-1">Reset</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    nostrService.resetRateLimiter();
                    toast.success('Rate limiter reset');
                  } catch (error) {
                    toast.error('Failed to reset rate limiter');
                  }
                }}
                className="h-8 text-xs"
              >
                <Settings className="h-3 w-3" />
                <span className="ml-1">Reset RL</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTestWallet}
                className="h-8 text-xs"
              >
                <Database className="h-3 w-3" />
                <span className="ml-1">Test Wallet</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAllWallets}
                className="h-8 text-xs col-span-2"
              >
                <Trash2 className="h-3 w-3" />
                <span className="ml-1">Clear All Wallets</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletDashboard;



