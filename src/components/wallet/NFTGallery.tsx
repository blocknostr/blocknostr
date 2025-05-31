import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileQuestion, Info, ChevronLeft, ChevronRight, RefreshCw, Database, Clock, CheckCircle } from "lucide-react";
import { getAddressNFTs, EnrichedToken } from "@/api/external/alephiumApi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { truncateAddress } from "@/lib/utils/formatters";
import { EnrichedTokenWithWallets } from "@/api/types/wallet";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { setNFTCacheInstance } from "@/hooks/useNFTCache";

interface NFTGalleryProps {
  address: string;
  allTokens?: (EnrichedTokenWithWallets | EnrichedToken)[]; // Accept both types
  updateApiStatus?: (update: any) => void;
  apiHealth?: any;
}

// Type guard to check if token has LP properties
const hasLPProperties = (token: any): token is EnrichedToken => {
  return 'isLPToken' in token;
};

// Enhanced NFT Cache with IndexedDB for persistence
class NFTCache {
  private static instance: NFTCache;
  private dbName = 'nft_gallery_cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private initialized = false;
  
  // Memory cache for quick access
  private metadataCache = new Map<string, string | null>();
  private imageValidityCache = new Map<string, boolean>();
  private nftDataCache = new Map<string, { nfts: any[], timestamp: number, address: string }>();
  
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for NFT data
  private readonly METADATA_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for metadata

  static getInstance(): NFTCache {
    if (!NFTCache.instance) {
      NFTCache.instance = new NFTCache();
    }
    return NFTCache.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.warn('[NFT Cache] IndexedDB not available, falling back to localStorage');
        this.initialized = true;
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log('[NFT Cache] IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        
        // NFT data store
        if (!db.objectStoreNames.contains('nft_data')) {
          const nftStore = db.createObjectStore('nft_data', { keyPath: 'address' });
          nftStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'tokenId' });
          metadataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Image validity store
        if (!db.objectStoreNames.contains('image_validity')) {
          db.createObjectStore('image_validity', { keyPath: 'url' });
        }
      };
    });
  }

  // NFT Data Management
  async getCachedNFTs(address: string): Promise<{ nfts: any[], timestamp: number } | null> {
    await this.init();
    
    // Check memory cache first
    const memoryCached = this.nftDataCache.get(address);
    if (memoryCached && Date.now() - memoryCached.timestamp < this.CACHE_DURATION) {
      console.log(`[NFT Cache] Memory cache hit for ${address}`);
      return { nfts: memoryCached.nfts, timestamp: memoryCached.timestamp };
    }

    // Check IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['nft_data'], 'readonly');
        const store = transaction.objectStore('nft_data');
        const request = store.get(address);

        return new Promise((resolve) => {
          request.onsuccess = () => {
            const result = request.result;
            if (result && Date.now() - result.timestamp < this.CACHE_DURATION) {
              console.log(`[NFT Cache] IndexedDB cache hit for ${address}`);
              // Store in memory cache
              this.nftDataCache.set(address, result);
              resolve({ nfts: result.nfts, timestamp: result.timestamp });
            } else {
              resolve(null);
            }
          };
          request.onerror = () => resolve(null);
        });
      } catch (error) {
        console.warn('[NFT Cache] IndexedDB read error:', error);
      }
    }

    // Fallback to localStorage
    try {
      const cached = localStorage.getItem(`nft_data_${address}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < this.CACHE_DURATION) {
          console.log(`[NFT Cache] localStorage cache hit for ${address}`);
          this.nftDataCache.set(address, parsed);
          return { nfts: parsed.nfts, timestamp: parsed.timestamp };
        }
      }
    } catch (error) {
      console.warn('[NFT Cache] localStorage read error:', error);
    }

    return null;
  }

  async cacheNFTs(address: string, nfts: any[]): Promise<void> {
    await this.init();
    
    const cacheData = {
      address,
      nfts,
      timestamp: Date.now()
    };

    // Store in memory cache
    this.nftDataCache.set(address, cacheData);

    // Store in IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['nft_data'], 'readwrite');
        const store = transaction.objectStore('nft_data');
        store.put(cacheData);
        console.log(`[NFT Cache] Cached ${nfts.length} NFTs for ${address} in IndexedDB`);
      } catch (error) {
        console.warn('[NFT Cache] IndexedDB write error:', error);
      }
    }

    // Fallback to localStorage
    try {
      localStorage.setItem(`nft_data_${address}`, JSON.stringify(cacheData));
      console.log(`[NFT Cache] Cached ${nfts.length} NFTs for ${address} in localStorage`);
    } catch (error) {
      console.warn('[NFT Cache] localStorage write error:', error);
    }
  }

  // Metadata Management (enhanced)
  async getMetadata(tokenId: string): Promise<string | null | undefined> {
    await this.init();
    
    // Check memory cache first
    if (this.metadataCache.has(tokenId)) {
      return this.metadataCache.get(tokenId);
    }

    // Check IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['metadata'], 'readonly');
        const store = transaction.objectStore('metadata');
        const request = store.get(tokenId);

        return new Promise((resolve) => {
          request.onsuccess = () => {
            const result = request.result;
            if (result && Date.now() - result.timestamp < this.METADATA_CACHE_DURATION) {
              this.metadataCache.set(tokenId, result.imageUrl);
              resolve(result.imageUrl);
            } else {
              resolve(undefined);
            }
          };
          request.onerror = () => resolve(undefined);
        });
      } catch (error) {
        console.warn('[NFT Cache] Metadata read error:', error);
      }
    }

    return undefined;
  }

  async setMetadata(tokenId: string, imageUrl: string | null): Promise<void> {
    await this.init();
    
    this.metadataCache.set(tokenId, imageUrl);

    const metadataData = {
      tokenId,
      imageUrl,
      timestamp: Date.now()
    };

    // Store in IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['metadata'], 'readwrite');
        const store = transaction.objectStore('metadata');
        store.put(metadataData);
      } catch (error) {
        console.warn('[NFT Cache] Metadata write error:', error);
      }
    }
  }

  // Image validity management
  setImageValidity(imageUrl: string, isValid: boolean): void {
    this.imageValidityCache.set(imageUrl, isValid);
  }

  isImageValid(imageUrl: string): boolean | undefined {
    return this.imageValidityCache.get(imageUrl);
  }

  // Cache management
  async clearCache(address?: string): Promise<void> {
    await this.init();
    
    if (address) {
      // Clear specific address cache
      this.nftDataCache.delete(address);
      
      if (this.db) {
        try {
          const transaction = this.db.transaction(['nft_data'], 'readwrite');
          const store = transaction.objectStore('nft_data');
          store.delete(address);
        } catch (error) {
          console.warn('[NFT Cache] Error clearing specific cache:', error);
        }
      }
      
      try {
        localStorage.removeItem(`nft_data_${address}`);
      } catch (error) {
        console.warn('[NFT Cache] localStorage clear error:', error);
      }
    } else {
      // Clear all caches
      this.nftDataCache.clear();
      this.metadataCache.clear();
      this.imageValidityCache.clear();
      
      if (this.db) {
        try {
          const transaction = this.db.transaction(['nft_data', 'metadata', 'image_validity'], 'readwrite');
          transaction.objectStore('nft_data').clear();
          transaction.objectStore('metadata').clear();
          transaction.objectStore('image_validity').clear();
        } catch (error) {
          console.warn('[NFT Cache] Error clearing all cache:', error);
        }
      }
      
      // Clear localStorage
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('nft_data_') || key.startsWith('nft_metadata_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('[NFT Cache] localStorage clear all error:', error);
      }
    }
  }

  async getCacheStats(): Promise<{
    totalAddresses: number;
    totalNFTs: number;
    totalMetadata: number;
    oldestCache: number | null;
    cacheSize: string;
  }> {
    await this.init();
    
    let totalAddresses = 0;
    let totalNFTs = 0;
    let totalMetadata = 0;
    let oldestCache: number | null = null;

    // Count memory cache
    totalAddresses = this.nftDataCache.size;
    totalMetadata = this.metadataCache.size;
    
    this.nftDataCache.forEach(cache => {
      totalNFTs += cache.nfts.length;
      if (!oldestCache || cache.timestamp < oldestCache) {
        oldestCache = cache.timestamp;
      }
    });

    // Estimate cache size
    const memorySize = JSON.stringify([...this.nftDataCache.values()]).length;
    const cacheSize = `${(memorySize / 1024).toFixed(1)} KB`;

    return {
      totalAddresses,
      totalNFTs,
      totalMetadata,
      oldestCache,
      cacheSize
    };
  }
}

// Skeleton loading component for NFT cards
const NFTSkeleton = () => (
  <div className="cursor-pointer group relative rounded-md overflow-hidden border bg-card aspect-square">
    <div className="h-32 w-full bg-muted animate-pulse"></div>
    <div className="p-2 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
      <div className="h-3 bg-white/20 rounded animate-pulse mb-1"></div>
      <div className="h-2 bg-white/10 rounded animate-pulse w-2/3"></div>
    </div>
  </div>
);

const NFTGallery: React.FC<NFTGalleryProps> = ({ address, allTokens, updateApiStatus, apiHealth }) => {
  const [nfts, setNfts] = useState<EnrichedToken[] | EnrichedTokenWithWallets[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<EnrichedToken | EnrichedTokenWithWallets | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [cacheInfo, setCacheInfo] = useState<{ timestamp: number | null; source: 'none' | 'cache' | 'fresh' }>({
    timestamp: null,
    source: 'none'
  });
  const [corsIssues, setCorsIssues] = useState<number>(0);
  const [metadataEnabled, setMetadataEnabled] = useState<boolean>(true); // Allow disabling metadata fetching

  // Constants for carousel layout
  const ROWS = 3;
  const COLUMNS = 4;
  const NFTS_PER_PAGE = ROWS * COLUMNS; // 12 NFTs per page

  // Get cache instance
  const cache = NFTCache.getInstance();
  
  // Register cache instance with hook
  useEffect(() => {
    setNFTCacheInstance(cache);
  }, [cache]);

  // Load cached data on mount (no auto-fetching from API)
  useEffect(() => {
    const loadCachedData = async () => {
      if (!address) return;
      
      console.log(`[NFT Gallery] Loading cached NFTs for ${address}`);
      
      try {
        const cachedData = await cache.getCachedNFTs(address);
        
        if (cachedData) {
          console.log(`[NFT Gallery] Loaded ${cachedData.nfts.length} cached NFTs for ${address}`);
          setNfts(cachedData.nfts);
          setCacheInfo({
            timestamp: cachedData.timestamp,
            source: 'cache'
          });
        } else {
          console.log(`[NFT Gallery] No cached data found for ${address}`);
          // DON'T auto-populate from allTokens on mount - wait for manual refresh
          console.log(`[NFT Gallery] Waiting for manual refresh - not auto-loading from allTokens`);
        }
      } catch (error) {
        console.error('[NFT Gallery] Error loading cached data:', error);
      }
    };

    loadCachedData();
  }, [address]); // Remove allTokens dependency to prevent auto-loading

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    if (!address || isRefreshing) return;
    
    setIsRefreshing(true);
    setCorsIssues(0); // Reset CORS issue counter
    console.log(`[NFT Gallery] Manual refresh started for ${address}`);
    
    try {
      let nftData: any[] = [];
      
      // Priority 1: Use allTokens if available (most efficient)
      if (allTokens && allTokens.length > 0) {
        console.log(`[NFT Gallery] Filtering ${allTokens.length} tokens for NFTs...`);
        
        // Debug: Show all token types
        const tokenTypes = allTokens.map(token => ({
          id: token.id.substring(0, 8),
          name: token.name || 'Unknown',
          isNFT: token.isNFT,
          isLPToken: hasLPProperties(token) ? token.isLPToken || false : false,
          hasTokenURI: !!(token as any).tokenURI,
          tokenURI: (token as any).tokenURI ? (token as any).tokenURI.substring(0, 50) + '...' : null,
          amount: token.amount
        }));
        console.log(`[NFT Gallery] Token breakdown:`, tokenTypes);
        
        // Filter for actual NFTs and tokens with NFT-like metadata
        const nftTokens = allTokens.filter(token => {
          // Definitely an NFT
          if (token.isNFT) return true;
          
          // Check for NFT-like characteristics
          const hasTokenURI = !!(token as any).tokenURI;
          const hasNFTName = token.name && !token.symbol?.includes('LP') && !token.symbol?.includes('POOL');
          const isSmallSupply = token.amount && parseInt(token.amount) === 1; // Many NFTs have supply of 1
          
          // If it has a tokenURI and looks like an NFT, include it
          if (hasTokenURI && (hasNFTName || isSmallSupply)) {
            console.log(`[NFT Gallery] Including token ${token.name} as potential NFT (has tokenURI)`);
            return true;
          }
          
          return false;
        });
        
        console.log(`[NFT Gallery] Found ${nftTokens.length} NFTs/NFT-like tokens from ${allTokens.length} total tokens`);
        
        if (nftTokens.length > 0) {
          console.log(`[NFT Gallery] NFT details:`, nftTokens.map(nft => ({
            id: nft.id.substring(0, 8),
            name: nft.name || 'Unknown NFT',
            symbol: nft.symbol
          })));
        }
        
        nftData = nftTokens;
      } else {
        // Priority 2: Fetch directly from API
        console.log(`[NFT Gallery] No allTokens available, fetching NFTs directly from API for ${address}`);
        nftData = await getAddressNFTs(address);
        console.log(`[NFT Gallery] API returned ${nftData.length} NFTs`);
        
        if (nftData.length > 0) {
          console.log(`[NFT Gallery] API NFT details:`, nftData.map(nft => ({
            id: nft.id?.substring(0, 8) || 'no-id',
            name: nft.name || 'Unknown NFT',
            symbol: nft.symbol
          })));
        }
      }
      
      // Update state
      setNfts(nftData);
      setCacheInfo({
        timestamp: Date.now(),
        source: 'fresh'
      });
      
      // Cache the fresh data
      await cache.cacheNFTs(address, nftData);
      
      console.log(`[NFT Gallery] Refresh completed: ${nftData.length} NFTs cached`);
      
    } catch (error) {
      console.error('[NFT Gallery] Error during refresh:', error);
      if (updateApiStatus) {
        updateApiStatus({
          errors: { tokens: `NFT refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [address, allTokens, isRefreshing, updateApiStatus]);

  // Clear cache function
  const handleClearCache = useCallback(async () => {
    console.log(`[NFT Gallery] Clearing cache for ${address}`);
    await cache.clearCache(address);
    setNfts([]);
    setCacheInfo({ timestamp: null, source: 'none' });
  }, [address]);

  // Calculate total pages needed
  const totalPages = Math.ceil(nfts.length / NFTS_PER_PAGE);
  
  // Get NFTs for current page
  const getCurrentPageNFTs = () => {
    const startIndex = currentPage * NFTS_PER_PAGE;
    const endIndex = startIndex + NFTS_PER_PAGE;
    return nfts.slice(startIndex, endIndex);
  };

  // Navigation functions
  const goToNextPage = () => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Enhanced NFT image component with proper fallback handling and caching
  const NFTImage = ({ nft }: { nft: EnrichedToken | EnrichedTokenWithWallets | any }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [fetchedImageUrl, setFetchedImageUrl] = useState<string | null>(null);
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
    
    // Fetch metadata from tokenURI if no imageUrl is available
    const fetchMetadataFromTokenURI = async (tokenURI: string) => {
      if (isFetchingMetadata) return null;
      
      // Check cache first
      const cachedImageUrl = await cache.getMetadata(nft.id);
      if (cachedImageUrl !== undefined) {
        console.log(`[NFT Cache] Using cached metadata for ${nft.id}:`, cachedImageUrl);
        return cachedImageUrl;
      }
      
      setIsFetchingMetadata(true);
      
      try {
        // Handle data URIs (inline JSON) - support multiple formats
        if (tokenURI.startsWith('data:application/json,') || tokenURI.startsWith('data:application/json;') || tokenURI.startsWith('data:,')) {
          try {
            // Extract JSON part after the comma (handle different data URI formats)
            let jsonStr;
            if (tokenURI.includes(',')) {
              const jsonStart = tokenURI.indexOf(',') + 1;
              jsonStr = tokenURI.substring(jsonStart);
            } else {
              // Fallback for malformed data URIs
              jsonStr = tokenURI.replace(/^data:[^,]*,?/, '');
            }
            
            // Clean up any potential issues
            jsonStr = jsonStr.trim();
            
            // Try parsing without URL decoding first (most common case)
            let metadata;
            try {
              metadata = JSON.parse(jsonStr);
              console.log(`[NFT Metadata] Parsed inline JSON (direct) for ${nft.id}:`, metadata);
            } catch (directParseError) {
              // If direct parsing fails, try with URL decoding
              try {
                const decodedJsonStr = decodeURIComponent(jsonStr);
                metadata = JSON.parse(decodedJsonStr);
                console.log(`[NFT Metadata] Parsed inline JSON (decoded) for ${nft.id}:`, metadata);
              } catch (decodedParseError) {
                console.error(`[NFT Metadata] Both JSON parsing methods failed for ${nft.id}:`, {
                  original: jsonStr,
                  decoded: decodeURIComponent(jsonStr),
                  directError: directParseError.message,
                  decodedError: decodedParseError.message
                });
                throw directParseError; // Throw the original error
              }
            }
            
            const imageUrl = metadata.image || metadata.image_url || metadata.imageUrl || metadata.picture;
            console.log(`[NFT Metadata] Successfully extracted data URI metadata for ${nft.id}:`, { 
              name: metadata.name, 
              imageUrl, 
              hasAttributes: !!metadata.attributes 
            });
            
            // Cache the result
            await cache.setMetadata(nft.id, imageUrl || null);
            return imageUrl;
          } catch (dataUriError) {
            console.error(`[NFT Metadata] Failed to parse data URI for ${nft.id}:`, dataUriError);
            console.log(`[NFT Metadata] Raw tokenURI:`, tokenURI);
            
            // Cache the failure
            await cache.setMetadata(nft.id, null);
            return null;
          }
        }
        
        // Handle regular URLs (Arweave, IPFS, etc.)
        console.log(`[NFT Metadata] Fetching metadata from tokenURI: ${tokenURI}`);
        
        // Use aggressive CORS avoidance - never trigger preflight requests
        let response;
        let fetchSuccessful = false;
        
        // Strategy 1: Pure simple request (guaranteed no preflight)
        try {
          console.log(`[NFT Metadata] Attempting simple request for ${tokenURI}`);
          response = await fetch(tokenURI, {
            method: 'GET',
            mode: 'cors',
            cache: 'default',
            // NO custom headers - this ensures no preflight
          });
          
          if (response.ok) {
            fetchSuccessful = true;
            console.log(`[NFT Metadata] Simple CORS request succeeded for ${tokenURI}`);
          }
        } catch (corsError) {
          console.log(`[NFT Metadata] Simple CORS failed: ${corsError.message}`);
        }
        
        // Strategy 2: no-cors mode (can't read response but might work)
        if (!fetchSuccessful) {
          try {
            console.log(`[NFT Metadata] Trying no-cors mode for ${tokenURI}`);
            response = await fetch(tokenURI, {
              method: 'GET',
              mode: 'no-cors',
              cache: 'default',
            });
            fetchSuccessful = true;
            console.log(`[NFT Metadata] No-cors request completed for ${tokenURI}`);
          } catch (noCorsError) {
            console.log(`[NFT Metadata] No-cors also failed: ${noCorsError.message}`);
          }
        }
        
        // Strategy 3: Try alternative gateways immediately (for IPFS)
        if (!fetchSuccessful && tokenURI.includes('ipfs')) {
          const ipfsHash = tokenURI.includes('ipfs://') ? 
            tokenURI.replace('ipfs://', '') : 
            tokenURI.split('/ipfs/')[1];
            
          if (ipfsHash) {
            const corsGateways = [
              `https://ipfs.io/ipfs/${ipfsHash}`,
              `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
              `https://dweb.link/ipfs/${ipfsHash}`,
            ];
            
            for (const gateway of corsGateways) {
              try {
                console.log(`[NFT Metadata] Trying CORS-friendly IPFS gateway: ${gateway}`);
                response = await fetch(gateway, {
                  method: 'GET',
                  mode: 'cors',
                  cache: 'default',
                });
                
                if (response.ok) {
                  fetchSuccessful = true;
                  console.log(`[NFT Metadata] IPFS gateway success: ${gateway}`);
                  break;
                }
              } catch (gatewayError) {
                console.log(`[NFT Metadata] Gateway ${gateway} failed: ${gatewayError.message}`);
                continue;
              }
            }
          }
        }
        
        // Strategy 4: Use a CORS proxy as last resort (for development/testing)
        if (!fetchSuccessful && process.env.NODE_ENV === 'development') {
          try {
            // Only in development - use a public CORS proxy
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(tokenURI)}`;
            console.log(`[NFT Metadata] Using CORS proxy for ${tokenURI}`);
            
            response = await fetch(proxyUrl, {
              method: 'GET',
              mode: 'cors',
              cache: 'default',
            });
            
            if (response.ok) {
              const proxyData = await response.json();
              if (proxyData.contents) {
                // Create a fake response object with the proxied content
                response = new Response(proxyData.contents, {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                });
                fetchSuccessful = true;
                console.log(`[NFT Metadata] CORS proxy success for ${tokenURI}`);
              }
            }
          } catch (proxyError) {
            console.log(`[NFT Metadata] CORS proxy failed: ${proxyError.message}`);
          }
        }
        
        if (!fetchSuccessful) {
          throw new Error(`All CORS strategies failed for ${tokenURI}`);
        }
        
        // Handle response based on mode
        if (response.type === 'opaque') {
          // No-cors response - we can't read the data, but the request went through
          console.log(`[NFT Metadata] Got opaque response for ${tokenURI} - CORS restricted`);
          // Cache as null since we can't read the metadata
          await cache.setMetadata(nft.id, null);
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let metadata;
        try {
          const text = await response.text();
          metadata = JSON.parse(text);
        } catch (parseError) {
          console.warn(`[NFT Metadata] Failed to parse JSON for ${tokenURI}:`, parseError);
          throw new Error(`Invalid JSON response`);
        }
        
        const imageUrl = metadata.image || metadata.image_url || metadata.imageUrl || metadata.picture;
        
        console.log(`[NFT Metadata] Successfully fetched metadata for ${nft.id}:`, { imageUrl, metadata });
        
        // Cache the result
        await cache.setMetadata(nft.id, imageUrl || null);
        return imageUrl;
      } catch (error) {
        console.error(`[NFT Metadata] Failed to fetch metadata from ${tokenURI}:`, error);
        
        // For CORS errors, try some common workarounds
        if (error.message?.includes('CORS') || error.message?.includes('cors') || error.name === 'TypeError') {
          console.log(`[NFT Metadata] CORS error detected, trying alternative approaches for ${tokenURI}`);
          setCorsIssues(prev => prev + 1);
          
          // Try alternative IPFS gateways if it's an IPFS URL
          if (tokenURI.includes('ipfs://') || tokenURI.includes('/ipfs/')) {
            const ipfsHash = tokenURI.includes('ipfs://') ? 
              tokenURI.replace('ipfs://', '') : 
              tokenURI.split('/ipfs/')[1];
              
            const alternativeGateways = [
              `https://ipfs.io/ipfs/${ipfsHash}`,
              `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
              `https://dweb.link/ipfs/${ipfsHash}`,
              `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
              `https://cf-ipfs.com/ipfs/${ipfsHash}`
            ];
            
            for (const gateway of alternativeGateways) {
              try {
                console.log(`[NFT Metadata] Trying alternative IPFS gateway: ${gateway}`);
                const altResponse = await fetch(gateway, {
                  method: 'GET',
                  mode: 'cors',
                  cache: 'default',
                  // No custom headers to avoid preflight
                });
                
                if (altResponse.ok && altResponse.type !== 'opaque') {
                  const altText = await altResponse.text();
                  const altMetadata = JSON.parse(altText);
                  const altImageUrl = altMetadata.image || altMetadata.image_url || altMetadata.imageUrl;
                  
                  if (altImageUrl) {
                    console.log(`[NFT Metadata] Success with alternative gateway: ${gateway}`);
                    await cache.setMetadata(nft.id, altImageUrl);
                    return altImageUrl;
                  }
                }
              } catch (altError) {
                console.log(`[NFT Metadata] Alternative gateway failed: ${gateway} - ${altError.message}`);
                continue;
              }
            }
          }
        }
        
        // Cache the failure to avoid repeated attempts
        await cache.setMetadata(nft.id, null);
        return null;
      } finally {
        setIsFetchingMetadata(false);
      }
    };
    
    // Generate all possible image URLs for this NFT
    const getImageUrls = (originalUrl: string | undefined) => {
      const urls: string[] = [];
      
      if (!originalUrl) return urls;
      
      // Check if this URL was previously validated
      const isValid = cache.isImageValid(originalUrl);
      if (isValid === false) {
        console.log(`[NFT Cache] Skipping previously failed URL: ${originalUrl}`);
        // Don't include URLs that we know are invalid
      } else {
        // Add the original URL first
        urls.push(originalUrl);
      }
      
      // If it's an IPFS URL, add alternative gateways
      if (originalUrl.includes('ipfs.io/ipfs/')) {
        const hash = originalUrl.split('ipfs.io/ipfs/')[1];
        const alternatives = [
          `https://gateway.pinata.cloud/ipfs/${hash}`,
          `https://cloudflare-ipfs.com/ipfs/${hash}`,
          `https://dweb.link/ipfs/${hash}`,
          `https://cf-ipfs.com/ipfs/${hash}`
        ];
        
        // Only add alternatives that haven't failed before
        alternatives.forEach(alt => {
          if (cache.isImageValid(alt) !== false) {
            urls.push(alt);
          }
        });
      } else if (originalUrl.includes('ipfs://')) {
        const hash = originalUrl.substring(7);
        const alternatives = [
          `https://ipfs.io/ipfs/${hash}`,
          `https://gateway.pinata.cloud/ipfs/${hash}`,
          `https://cloudflare-ipfs.com/ipfs/${hash}`,
          `https://dweb.link/ipfs/${hash}`
        ];
        
        alternatives.forEach(alt => {
          if (cache.isImageValid(alt) !== false) {
            urls.push(alt);
          }
        });
      }
      
      // Add more specific gateway alternatives for Arweave URLs
      if (originalUrl.includes('arweave.net')) {
        const arweaveId = originalUrl.split('/').pop();
        if (arweaveId) {
          const alternatives = [
            `https://gateway.irys.xyz/${arweaveId}`,
            `https://arseed.web3infra.dev/${arweaveId}`
          ];
          
          alternatives.forEach(alt => {
            if (cache.isImageValid(alt) !== false) {
              urls.push(alt);
            }
          });
        }
      }
      
      return [...new Set(urls)]; // Remove duplicates
    };
    
    // Use fetched image URL if available, otherwise use the original (with type safety)
    const effectiveImageUrl = fetchedImageUrl || (nft as any).imageUrl;
    const imageUrls = getImageUrls(effectiveImageUrl);
    const currentImageUrl = imageUrls[currentImageIndex];
    
    // Reset state when NFT changes
    useEffect(() => {
      setCurrentImageIndex(0);
      setImageLoading(true);
      setHasError(false);
      setFetchedImageUrl(null);
      setIsFetchingMetadata(false);
    }, [nft.id]);
    
    // Check cache and fetch metadata from tokenURI if no image is available
    useEffect(() => {
      const attemptMetadataFetch = async () => {
        if (!metadataEnabled) {
          console.log(`[NFT Metadata] Metadata fetching disabled for ${nft.id}`);
          return;
        }
        
        const tokenURI = (nft as any).tokenURI;
        const imageUrl = (nft as any).imageUrl;
        
        if (!imageUrl && tokenURI && !fetchedImageUrl && !isFetchingMetadata) {
          console.log(`[NFT Metadata] No imageUrl found for ${nft.id}, checking cache and fetching from tokenURI: ${tokenURI}`);
          const fetchedUrl = await fetchMetadataFromTokenURI(tokenURI);
          if (fetchedUrl) {
            setFetchedImageUrl(fetchedUrl);
            setImageLoading(true); // Reset loading state for new image
          }
        }
      };
              
        attemptMetadataFetch();
      }, [nft.id, (nft as any).imageUrl, (nft as any).tokenURI, fetchedImageUrl, isFetchingMetadata]);
    
    const handleImageError = () => {
      // Cache the failed URL
      if (currentImageUrl) {
        cache.setImageValidity(currentImageUrl, false);
      }
      
      console.log(`[NFT Image] Failed to load image ${currentImageIndex + 1}/${imageUrls.length} for ${nft.name || nft.id}: ${currentImageUrl}`);
      
      if (currentImageIndex < imageUrls.length - 1) {
        // Try next image URL
        setCurrentImageIndex(prev => prev + 1);
        setImageLoading(true);
        setHasError(false);
      } else {
        // All image sources failed
        console.log(`[NFT Image] All ${imageUrls.length} image sources failed for ${nft.id}`);
        setHasError(true);
        setImageLoading(false);
      }
    };
    
    const handleImageLoad = () => {
      // Cache the successful URL
      if (currentImageUrl) {
        cache.setImageValidity(currentImageUrl, true);
      }
      
      console.log(`[NFT Image] Successfully loaded image for ${nft.name || nft.id}: ${currentImageUrl}`);
      setImageLoading(false);
      setHasError(false);
    };
    
    // If we're still fetching metadata and no image URL is available
    if (isFetchingMetadata || (!currentImageUrl && (nft as any).tokenURI && !hasError)) {
      return (
        <div className="h-32 w-full bg-muted flex items-center justify-center rounded-md">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-1" />
            <div className="text-xs text-center px-2">
              {isFetchingMetadata ? 'Fetching Metadata...' : 'Loading...'}
            </div>
          </div>
        </div>
      );
    }
    
    // If no image URL is available at all
    if (!currentImageUrl) {
      return (
        <div className="h-32 w-full bg-muted flex items-center justify-center rounded-md">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FileQuestion className="h-8 w-8 mb-1" />
            <div className="text-xs text-center px-2">
              {(nft as any).tokenURI ? 'No Image in Metadata' : 'No Image'}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="h-32 w-full bg-muted flex items-center justify-center rounded-md relative overflow-hidden">
        {hasError ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FileQuestion className="h-8 w-8 mb-1" />
            <div className="text-xs text-center px-2">
              Image Failed
              {imageUrls.length > 1 && (
                <div className="text-xs opacity-70 mt-1">
                  Tried {imageUrls.length} sources
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                {imageUrls.length > 1 && currentImageIndex > 0 && (
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {currentImageIndex + 1}/{imageUrls.length}
                  </div>
                )}
              </div>
            )}
            <img 
              key={currentImageUrl} // Force re-render when URL changes
              src={currentImageUrl}
              alt={nft.name || `NFT ${nft.id}`}
              className={`h-32 w-full object-cover rounded-md transition-opacity duration-200 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          </>
        )}
      </div>
    );
  };

  const NFTAttributes = ({ attributes }: { attributes?: any[] }) => {
    if (!attributes || attributes.length === 0) return null;
    
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {attributes.slice(0, 6).map((attr, index) => (
          <div key={index} className="bg-muted/50 p-2 rounded-md text-xs">
            <div className="font-medium text-muted-foreground">{attr.trait_type || attr.name}</div>
            <div>{attr.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const NFTDetailsDialog = () => {
    if (!selectedNFT) return null;
    
    // Type guard to safely access properties
    const nft = selectedNFT as any;
    
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{nft.name || `NFT ${truncateAddress(nft.id)}`}</DialogTitle>
          <DialogDescription>ID: {truncateAddress(nft.id)}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <NFTImage nft={nft} />
          
          {nft.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{nft.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Token ID:</span>
              <div className="font-mono text-xs break-all">{nft.id}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Amount:</span>
              <div>{nft.formattedAmount || nft.amount || '1'}</div>
            </div>
          </div>
          
          {/* Show wallet distribution for tokens with multiple wallets */}
          {'wallets' in nft && nft.wallets && nft.wallets.length > 1 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Distribution</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {nft.wallets.map((wallet: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="font-mono">{truncateAddress(wallet.address)}</span>
                    <span>{wallet.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <NFTAttributes attributes={nft.attributes} />
          
          <div>
            <a 
              href={`https://explorer.alephium.org/tokens/${nft.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View on Explorer
            </a>
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              NFT Gallery
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm max-w-xs">
                      <div className="font-medium mb-1">Cached NFT Gallery</div>
                      <div>• Shows cached data on load</div>
                      <div>• Manual refresh to update</div>
                      <div>• Persistent storage with IndexedDB</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            
            {/* Cache status indicator */}
            {cacheInfo.timestamp && (
              <Badge variant="outline" className="text-xs">
                <div className={`h-2 w-2 rounded-full mr-1 ${
                  cacheInfo.source === 'cache' ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                {cacheInfo.source === 'cache' ? 'Cached' : 'Fresh'}
              </Badge>
            )}
          </div>
          
          {/* Control buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8"
            >
              {isRefreshing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </Button>
            
            {corsIssues > 3 && (
              <Button
                variant={metadataEnabled ? "destructive" : "secondary"}
                size="sm"
                onClick={() => {
                  setMetadataEnabled(!metadataEnabled);
                  setCorsIssues(0);
                }}
                className="h-8"
              >
                <span className="text-xs">
                  {metadataEnabled ? 'Disable Metadata' : 'Enable Metadata'}
                </span>
              </Button>
            )}
            
            {nfts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                className="h-8"
              >
                <Database className="h-3 w-3" />
                <span className="ml-1 text-xs">Clear</span>
              </Button>
            )}
          </div>
        </div>
        
        <CardDescription>
          {nfts.length > 0 ? (
            <>
              {nfts.length} NFT{nfts.length !== 1 ? 's' : ''} found
              {nfts.length > NFTS_PER_PAGE && (
                <span className="ml-2">• Page {currentPage + 1} of {totalPages}</span>
              )}
            </>
          ) : (
            cacheInfo.source === 'none' ? 
              'No cached data - Click refresh to load NFTs' :
              'No NFTs found'
          )}
        </CardDescription>
        
        {/* Cache info section outside CardDescription to avoid nesting issues */}
        {cacheInfo.timestamp && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {cacheInfo.source === 'cache' ? 'Cached' : 'Updated'} {formatDistanceToNow(cacheInfo.timestamp, { addSuffix: true })}
              </span>
              {cacheInfo.source === 'cache' && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Offline Ready
                </Badge>
              )}
              {corsIssues > 0 && (
                <Badge variant="outline" className="text-xs px-1 py-0 text-yellow-600">
                  {corsIssues} CORS issues
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {nfts.length === 0 && cacheInfo.source === 'none' ? (
          // Show empty state when no cache and no data
          <div className="flex justify-center items-center h-80 text-muted-foreground">
            <div className="text-center">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg mb-2">No NFT Data</div>
              <div className="text-sm mb-4">
                Click the refresh button to load your NFT collection
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="min-w-32"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load NFTs
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : nfts.length === 0 ? (
          // Show no NFTs found when we have checked but found none
          <div className="flex justify-center items-center h-80 text-muted-foreground">
            <div className="text-center">
              <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg mb-2">No NFTs Found</div>
              <div className="text-sm">
                This address doesn't have any NFTs
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Carousel Container */}
            <div className="relative">
              {/* NFT Grid - 3 rows × 4 columns - Always show 12 items */}
              <div className="grid grid-cols-4 gap-3 min-h-[400px]">
                {Array.from({ length: NFTS_PER_PAGE }, (_, index) => {
                  const nft = getCurrentPageNFTs()[index];
                  
                  if (!nft) {
                    // Show skeleton for empty slots to maintain grid structure
                    return <NFTSkeleton key={`skeleton-${index}`} />;
                  }
                  
                  return (
                    <Dialog key={nft.id}>
                      <DialogTrigger asChild>
                        <div 
                          className="cursor-pointer group relative rounded-md overflow-hidden border bg-card hover:border-primary transition-colors aspect-square"
                          onClick={() => setSelectedNFT(nft)}
                        >
                          <NFTImage nft={nft} />
                          
                          <div className="p-2 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                            <h3 className="font-medium truncate text-xs text-white">
                              {nft.name || `NFT ${truncateAddress(nft.id)}`}
                            </h3>
                            <p className="text-xs text-gray-300 truncate">
                              {nft.formattedAmount || nft.amount || '1'} {nft.symbol || 'NFT'}
                            </p>
                            {/* Show wallet count if this NFT is spread across multiple wallets */}
                            {'wallets' in nft && nft.wallets && nft.wallets.length > 1 && (
                              <div className="text-xs text-blue-300 mt-1">
                                {nft.wallets.length} wallets
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogTrigger>
                      <NFTDetailsDialog />
                    </Dialog>
                  );
                })}
              </div>
              
              {/* Navigation Controls */}
              {totalPages > 1 && (
                <>
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10"
                    onClick={goToPreviousPage}
                    disabled={totalPages <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10"
                    onClick={goToNextPage}
                    disabled={totalPages <= 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Page Indicators */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <span className="text-sm text-muted-foreground mr-3">
                  {currentPage + 1} of {totalPages}
                </span>
                
                {/* Page Dots */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => goToPage(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentPage 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Go to page ${index + 1}`}
                    />
                  ))}
                </div>
                
                {/* Page Numbers for smaller collections */}
                {totalPages <= 10 && (
                  <div className="flex gap-1 ml-3">
                    {Array.from({ length: totalPages }, (_, index) => (
                      <Button
                        key={index}
                        variant={index === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(index)}
                        className="w-8 h-8 p-0 text-xs"
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Collection Summary */}
            {nfts.length > 0 && (
              <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-medium">Total NFTs:</span>
                    <span className="ml-2">{nfts.length}</span>
                  </div>
                  <div>
                    <span className="font-medium">Showing:</span>
                    <span className="ml-2">
                      {Math.min(currentPage * NFTS_PER_PAGE + 1, nfts.length)} - {Math.min((currentPage + 1) * NFTS_PER_PAGE, nfts.length)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {cacheInfo.source === 'cache' && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Cached</span>
                    </div>
                  )}
                  {cacheInfo.source === 'fresh' && (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span>Fresh</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NFTGallery;
export { NFTCache };

