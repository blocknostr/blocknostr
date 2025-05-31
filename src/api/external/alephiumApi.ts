import { NodeProvider } from '@alephium/web3';
import { getTokenMetadata, fetchTokenList, getFallbackTokenData, formatTokenAmount, clearTokenListCache, getTokenCacheStats as getTokenListCacheStats } from './tokenMetadata';
import { formatNumber } from '@/lib/utils/formatters';

// Removed complex DEX pricing imports - now using Redux + CoinGecko pricing


/**
 * Token Metadata Cache
 * Caches token metadata with indefinite TTL until manually refreshed
 */
class TokenMetadataCache {
  private cacheKey = 'alephium_token_metadata_cache';
  private memoryCache: Record<string, any> = {};

  /**
   * Get cached metadata for a token
   */
  getMetadata(tokenId: string): any | null {
    // Check memory cache first
    if (this.memoryCache[tokenId]) {
      console.log(`[Token Cache] Memory cache hit for ${tokenId}`);
      return this.memoryCache[tokenId];
    }

    // Check localStorage
    try {
      const cached = localStorage.getItem(`${this.cacheKey}_${tokenId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log(`[Token Cache] LocalStorage cache hit for ${tokenId}`);
        // Store in memory cache for faster access
        this.memoryCache[tokenId] = parsed;
        return parsed;
      }
    } catch (error) {
      console.warn(`[Token Cache] Error reading cache for ${tokenId}:`, error);
    }

    return null;
  }

  /**
   * Cache metadata for a token
   */
  setMetadata(tokenId: string, metadata: any): void {
    try {
      const cacheData = {
        ...metadata,
        cachedAt: Date.now(),
        source: 'cache'
      };

      // Store in memory cache
      this.memoryCache[tokenId] = cacheData;

      // Store in localStorage
      localStorage.setItem(`${this.cacheKey}_${tokenId}`, JSON.stringify(cacheData));
      
      console.log(`[Token Cache] Cached metadata for ${tokenId}`);
    } catch (error) {
      console.warn(`[Token Cache] Error caching metadata for ${tokenId}:`, error);
    }
  }

  /**
   * Clear cache for a specific token
   */
  clearToken(tokenId: string): void {
    delete this.memoryCache[tokenId];
    try {
      localStorage.removeItem(`${this.cacheKey}_${tokenId}`);
      console.log(`[Token Cache] Cleared cache for ${tokenId}`);
    } catch (error) {
      console.warn(`[Token Cache] Error clearing cache for ${tokenId}:`, error);
    }
  }

  /**
   * Clear all cached token metadata
   */
  clearAll(): void {
    this.memoryCache = {};
    try {
      // Get all localStorage keys that match our cache pattern
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.cacheKey)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all matching keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`[Token Cache] Cleared all cached metadata (${keysToRemove.length} items)`);
    } catch (error) {
      console.warn(`[Token Cache] Error clearing all cache:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalCached: number; memoryCount: number; cacheKeys: string[] } {
    const memoryCount = Object.keys(this.memoryCache).length;
    const cacheKeys = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.cacheKey)) {
          cacheKeys.push(key.replace(`${this.cacheKey}_`, ''));
        }
      }
    } catch (error) {
      console.warn(`[Token Cache] Error getting cache stats:`, error);
    }

    return {
      totalCached: cacheKeys.length,
      memoryCount,
      cacheKeys
    };
  }
}

// Initialize the token metadata cache
const tokenMetadataCache = new TokenMetadataCache();

// Initialize the node provider with the mainnet node
const nodeProvider = new NodeProvider('https://node.mainnet.alephium.org');

/**
 * Gets the balance for a specific address in ALPH (not nanoALPH)
 */
export const getAddressBalance = async (address: string): Promise<{
  balance: number;
  lockedBalance: number;
  utxoNum: number;
}> => {
  // ✅ CRITICAL FIX: Validate address before making API calls
  if (!address || address.trim() === '') {
    console.error('[getAddressBalance] Empty address provided');
    throw new Error('Address is required');
  }
  
  // ✅ FIX: More flexible address validation for Alephium
  // Alephium addresses can be 44-58 characters and start with various characters
  if (address.length < 44 || address.length > 58) {
    console.error('[getAddressBalance] Invalid address length:', address, 'Length:', address.length);
    throw new Error('Invalid address format - incorrect length');
  }
  
  // ✅ FIX: Allow addresses that start with 1, r, or other valid prefixes
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
    console.error('[getAddressBalance] Invalid address characters:', address);
    throw new Error('Invalid address format - invalid characters');
  }

  try {
    console.log(`[AlephiumAPI] Fetching balance for address: ${address.slice(0, 8)}...`);
    const response = await nodeProvider.addresses.getAddressesAddressBalance(address);
    
    // Convert from atto to ALPH
    const balance = Number(response.balance) / 1e18;
    const lockedBalance = Number(response.lockedBalance) / 1e18;
    
    console.log(`[AlephiumAPI] ✅ Balance: ${balance} ALPH (${response.utxoNum} UTXOs)`);
    return {
      balance,
      lockedBalance,
      utxoNum: response.utxoNum
    };
  } catch (error: any) {
    console.error('Error fetching address balance:', error);
    throw error;
  }
};

/**
 * Gets transaction history for an address using the Alephium Explorer Backend API
 * Falls back to UTXO-based simplified transactions if Explorer Backend is unavailable
 */
export const getAddressTransactions = async (address: string, limit = 20) => {
  try {
    console.log(`[Explorer Backend] Fetching transaction history for ${address}, limit: ${limit}`);
    
    // Try to use the Explorer Backend API first (more reliable transaction data)
    const EXPLORER_BACKEND_BASE_URL = 'https://backend.mainnet.alephium.org';
    
    try {
      const explorerUrl = `${EXPLORER_BACKEND_BASE_URL}/addresses/${address}/transactions?page=1&limit=${limit}`;
      console.log(`[Explorer Backend] Fetching from: ${explorerUrl}`);
      
      const response = await fetch(explorerUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        // The Explorer backend returns transactions with much richer data
        const transactions = data.map((tx: any) => ({
          hash: tx.hash,
          blockHash: tx.blockHash,
          timestamp: tx.timestamp,
          inputs: tx.inputs || [],
          outputs: tx.outputs || [],
          gasAmount: tx.gasAmount,
          gasPrice: tx.gasPrice,
          scriptExecutionOk: tx.scriptExecutionOk !== false, // Default to true if not specified
          tokens: tx.tokens || [] // Include token transfers if any
        }));
        
        console.log(`[Explorer Backend] Successfully fetched ${transactions.length} transactions`);
        return transactions;
      } else {
        console.warn(`[Explorer Backend] HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (explorerError) {
      console.warn(`[Explorer Backend] Failed to fetch from Explorer backend:`, explorerError);
    }
    
    // Fallback to Node API (limited transaction info)
    console.log(`[Node API] Falling back to Node API for transaction history`);
    
    // For now, we'll fetch UTXOs and use them to construct a simplified transaction history
    const response = await nodeProvider.addresses.getAddressesAddressUtxos(address);
    
    // The API returns an object with a 'utxos' property that contains the array we need
    if (!response || !response.utxos || !Array.isArray(response.utxos)) {
      console.warn('Unexpected UTXO response structure:', response);
      return [];
    }
    
    // Transform UTXOs into a simplified transaction history
    const utxoArray = response.utxos;
    const simplifiedTxs = utxoArray.slice(0, limit).map((utxo: any, index: number) => ({
      hash: utxo.ref?.key || `tx-${index}`,
      blockHash: `block-${index}`, // We don't have this info from UTXOs
      timestamp: Date.now() - index * 3600000, // Fake timestamps, newest first
      inputs: [{
        address: 'unknown', // We don't know the sender from just UTXOs
        attoAlphAmount: utxo.amount || '0',
        amount: utxo.amount || '0' // Keep both for compatibility
      }],
      outputs: [{
        address: address,
        attoAlphAmount: utxo.amount || '0',
        amount: utxo.amount || '0', // Keep both for compatibility
        tokens: utxo.tokens || []
      }],
      gasAmount: 20000, // Default gas amount
      gasPrice: "100000000000", // Default gas price
      scriptExecutionOk: true
    }));
    
    console.log(`[Node API] Fallback: Generated ${simplifiedTxs.length} simplified transactions from UTXOs`);
    return simplifiedTxs;
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    throw error;
  }
};

/**
 * Gets UTXOs for an address
 */
export const getAddressUtxos = async (address: string) => {
  try {
    const result = await nodeProvider.addresses.getAddressesAddressUtxos(address);
    return result;
  } catch (error) {
    console.error('Error fetching address UTXOs:', error);
    throw error;
  }
};

/**
 * Token interface with rich metadata
 */
export interface EnrichedToken {
  id: string;
  amount: string; // Changed from number to string to handle large values correctly
  name: string;
  nameOnChain?: string;
  symbol: string;
  symbolOnChain?: string;
  decimals: number;
  logoURI?: string;
  description?: string;
  formattedAmount: string;
  isNFT: boolean;
  tokenURI?: string;
  imageUrl?: string;
  attributes?: any[];
  // Pricing properties
  usdValue?: number;
  tokenPrice?: number;
  priceSource?: 'market' | 'estimate';

}

/**
 * Checks if a token is an NFT using Alephium's official SDK methods
 * Enhanced with caching and rate limiting to reduce API calls
 */
const isLikelyNFT = async (tokenId: string) => {
  try {
    // Check cache first
    const cachedType = tokenTypeCache.getTokenType(tokenId);
    if (cachedType) {
      console.log(`[Token Type Cache] Cache hit for ${tokenId}: ${cachedType.type}, isNFT: ${cachedType.isNFT}`);
      return cachedType.isNFT;
    }

    console.log(`[Official NFT Detection] Checking token ${tokenId} using SDK methods (rate-limited)`);
    
    // Use rate-limited SDK call
    const tokenType = await sdkRateLimiter.execute(async () => {
      return await nodeProvider.guessStdTokenType(tokenId);
    });
    
    const isNFT = tokenType === 'non-fungible';
    
    // Cache the result
    tokenTypeCache.setTokenType(tokenId, isNFT, tokenType);
    
    console.log(`[Official NFT Detection] Token ${tokenId} type: ${tokenType}, isNFT: ${isNFT} (cached)`);
    return isNFT;
  } catch (error) {
    console.error(`[Official NFT Detection] Error checking token ${tokenId}:`, error);
    
    // Fallback to basic heuristics if the official method fails
    // Check if the error suggests the token might be an NFT but the method failed
    if (error.message && error.message.includes('not found')) {
      console.log(`[Official NFT Detection] Token ${tokenId} not found, assuming not an NFT`);
      // Cache the negative result to avoid repeated API calls
      tokenTypeCache.setTokenType(tokenId, false, 'unknown');
      return false;
    }
    
    // For any other error, assume it's not an NFT to be safe
    console.log(`[Official NFT Detection] Defaulting to false for token ${tokenId} due to error`);
    // Don't cache errors to allow retry later
    return false;
  }
};

/**
 * Checks if a contract is an NFT Collection using Alephium's official SDK methods
 */
const isNFTCollection = async (contractId: string) => {
  try {
    console.log(`[NFT Collection Detection] Checking if ${contractId} is an NFT collection`);
    
    // Use the official SDK method to check if this follows NFT Collection standard
    const isCollection = await nodeProvider.guessFollowsNFTCollectionStd(contractId);
    
    console.log(`[NFT Collection Detection] Contract ${contractId} isNFTCollection: ${isCollection}`);
    return isCollection;
  } catch (error) {
    console.error(`[NFT Collection Detection] Error checking contract ${contractId}:`, error);
    return false;
  }
};

/**
 * Fetch NFT metadata using official Alephium SDK methods
 * Falls back to manual fetching if needed
 */
const fetchNFTMetadata = async (tokenId: string) => {
  try {
    console.log(`[Official NFT Metadata] Fetching metadata for token ${tokenId} using SDK`);
    
    // Use the official SDK method to fetch NFT metadata
    const nftMetadata = await nodeProvider.fetchNFTMetaData(tokenId);
    
    console.log(`[Official NFT Metadata] Raw metadata from SDK:`, nftMetadata);
    
    // The SDK returns metadata with tokenUri and collectionId
    if (nftMetadata && nftMetadata.tokenUri) {
      // Fetch the actual metadata from the token URI
      const metadataResponse = await fetchMetadataFromURI(nftMetadata.tokenUri);
      
      return {
        ...metadataResponse,
        tokenUri: nftMetadata.tokenUri,
        collectionId: nftMetadata.collectionId
      };
    }
    
    return nftMetadata;
  } catch (error) {
    // Reduce noise for expected NFT metadata fetch failures
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      console.debug(`[Official NFT Metadata] Network error for ${tokenId}: ${errorMessage}`);
    } else {
      console.warn(`[Official NFT Metadata] Error fetching official metadata for ${tokenId}:`, errorMessage);
    }
    
    // Fallback to manual detection (this might not work for many tokens)
    return null;
  }
};

/**
 * Decodes hex-encoded strings to UTF-8 text
 * The Alephium SDK sometimes returns hex-encoded names and symbols
 */
const decodeHexString = (hexString: string): string => {
  try {
    // Remove '0x' prefix if present
    const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    
    // Check if it's a valid hex string
    if (!/^[0-9A-Fa-f]*$/.test(cleanHex)) {
      return hexString; // Return as-is if not valid hex
    }
    
    // Convert hex to bytes and then to string
    const bytes = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substr(i, 2), 16));
    }
    
    // Convert bytes to UTF-8 string
    const decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    
    // Return decoded string if it contains printable characters, otherwise return original
    return /^[\x20-\x7E]*$/.test(decoded) ? decoded : hexString;
  } catch (error) {
    console.warn(`[Hex Decoder] Failed to decode hex string ${hexString}:`, error);
    return hexString; // Return original if decoding fails
  }
};

/**
 * Fetch fungible token metadata using official Alephium SDK methods
 * This is the canonical way to get token metadata directly from the blockchain
 * Now includes caching with indefinite TTL
 */
const fetchFungibleTokenMetadata = async (tokenId: string, useCache: boolean = true) => {
  try {
    // Check cache first if enabled
    if (useCache) {
      const cachedMetadata = tokenMetadataCache.getMetadata(tokenId);
      if (cachedMetadata) {
        console.log(`[Official Token Metadata] Using cached metadata for ${tokenId}`);
        return cachedMetadata;
      }
    }

    console.log(`[Official Token Metadata] Fetching fresh metadata for token ${tokenId} using SDK (rate-limited)`);
    
    // Use rate-limited SDK call
    const metadata = await sdkRateLimiter.execute(async () => {
      return await nodeProvider.fetchFungibleTokenMetaData(tokenId);
    });
    
    console.log(`[Official Token Metadata] Raw metadata from SDK:`, metadata);
    
    // Decode hex-encoded names and symbols
    const decodedName = metadata.name ? decodeHexString(metadata.name) : `Token (${tokenId.substring(0, 6)}...)`;
    const decodedSymbol = metadata.symbol ? decodeHexString(metadata.symbol) : `TKN-${tokenId.substring(0, 4)}`;
    
    console.log(`[Official Token Metadata] Decoded metadata for ${tokenId}:`, {
      originalName: metadata.name,
      decodedName,
      originalSymbol: metadata.symbol,
      decodedSymbol,
      decimals: metadata.decimals
    });
    
    const processedMetadata = {
      id: tokenId,
      name: decodedName,
      symbol: decodedSymbol,
      decimals: Number(metadata.decimals) || 0,
      totalSupply: metadata.totalSupply,
      rawName: metadata.name, // Store original hex for reference
      rawSymbol: metadata.symbol // Store original hex for reference
    };

    // Cache the processed metadata
    if (useCache) {
      tokenMetadataCache.setMetadata(tokenId, processedMetadata);
    }
    
    return processedMetadata;
  } catch (error) {
    console.error(`[Official Token Metadata] Error fetching official metadata for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Helper function to fetch metadata from a URI (extracted from the original fetchNFTMetadata)
 * Enhanced to handle various NFT metadata standards and image formats
 * CORS-safe implementation with graceful fallbacks
 */
const fetchMetadataFromURI = async (tokenURI: string) => {
  if (!tokenURI) return null;
  
  try {
    console.log(`[NFT Metadata] Fetching metadata from URI: ${tokenURI}`);
    
    // Enhanced IPFS link conversion with multiple gateways
    let formattedURI = tokenURI;
    const isDevelopment = import.meta.env.DEV;
    
    if (tokenURI.startsWith('ipfs://')) {
      const ipfsHash = tokenURI.substring(7);
      
      if (isDevelopment) {
        // Use proxy in development to bypass CORS
        formattedURI = `/api/ipfs/ipfs/${ipfsHash}`;
        console.log(`[NFT Metadata] Using development proxy for IPFS: ${formattedURI}`);
      } else {
        // Use CORS-friendly IPFS gateways in production
        const ipfsGateways = [
          `https://ipfs.io/ipfs/${ipfsHash}`,
          `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
          `https://dweb.link/ipfs/${ipfsHash}`
        ];
        formattedURI = ipfsGateways[0]; // Start with ipfs.io
      }
    } else if (tokenURI.startsWith('ipfs/')) {
      const ipfsHash = tokenURI.substring(5);
      if (isDevelopment) {
        formattedURI = `/api/ipfs/ipfs/${ipfsHash}`;
        console.log(`[NFT Metadata] Using development proxy for IPFS: ${formattedURI}`);
      } else {
        formattedURI = `https://ipfs.io/ipfs/${ipfsHash}`;
      }
    } else if (tokenURI.startsWith('https://arweave.net/')) {
      if (isDevelopment) {
        // Use proxy for Arweave URLs in development
        const arweavePath = tokenURI.replace('https://arweave.net/', '');
        formattedURI = `/api/arweave/${arweavePath}`;
        console.log(`[NFT Metadata] Using development proxy for Arweave: ${formattedURI}`);
      }
    }
    
    console.log(`[NFT Metadata] Formatted URI: ${formattedURI}`);
    
    // CORS-safe fetch configuration - remove problematic headers
    const response = await fetch(formattedURI, {
      method: 'GET',
      mode: 'cors',
      // Remove problematic headers that cause CORS preflight issues
      headers: {
        'Accept': 'application/json'
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }
    
    const metadata = await response.json();
    console.log(`[NFT Metadata] Raw metadata:`, metadata);
    
    // Enhanced image URL processing to handle various field names and formats
    let imageUrl = null;
    const possibleImageFields = [
      'image', 'image_url', 'imageUrl', 'imageURI', 'image_uri',
      'picture', 'avatar', 'logo', 'icon', 'media', 'artwork',
      'animation_url', 'animationUrl' // For animated NFTs
    ];
    
    for (const field of possibleImageFields) {
      if (metadata[field]) {
        imageUrl = metadata[field];
        break;
      }
    }
    
    // Process the image URL if found
    if (imageUrl) {
      // Convert IPFS image URLs to HTTP gateways (but don't proxy images in development)
      if (imageUrl.startsWith('ipfs://')) {
        const ipfsHash = imageUrl.substring(7);
        imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      } else if (imageUrl.startsWith('ipfs/')) {
        const ipfsHash = imageUrl.substring(5);
        imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      }
      
      console.log(`[NFT Metadata] Processed image URL: ${imageUrl}`);
      metadata.processedImageUrl = imageUrl;
    }
    
    // Enhanced attribute processing
    if (metadata.attributes && Array.isArray(metadata.attributes)) {
      console.log(`[NFT Metadata] Found ${metadata.attributes.length} attributes`);
    }
    
    return {
      ...metadata,
      imageUrl: imageUrl || metadata.image || metadata.imageUrl // Ensure we have the processed image URL
    };
  } catch (error) {
    // Enhanced CORS error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for CORS-specific errors
    const isCorsError = errorMessage.includes('CORS') || 
                       errorMessage.includes('Access-Control') || 
                       errorMessage.includes('preflight') ||
                       errorMessage.includes('not allowed by Access-Control-Allow-Headers');
    
    if (isCorsError) {
      console.debug(`[NFT Metadata] CORS restriction for ${tokenURI.substring(0, 50)}... - Metadata unavailable due to cross-origin policy`);
      
      // Return a minimal metadata object indicating CORS restriction
      return {
        name: "NFT (Metadata Restricted)",
        description: "NFT metadata unavailable due to CORS restrictions",
        image: null,
        corsRestricted: true,
        originalUri: tokenURI
      };
    }
    
    // Reduce noise for common network issues
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      console.debug(`[NFT Metadata] Network error fetching ${tokenURI.substring(0, 50)}...: ${errorMessage}`);
    } else {
      console.warn(`[NFT Metadata] Error fetching metadata from ${tokenURI}:`, error);
    }
    
    // If the primary gateway fails, try alternative IPFS gateways (CORS-safe)
    if (tokenURI.startsWith('ipfs://') && !import.meta.env.DEV) {
      const ipfsHash = tokenURI.substring(7);
      const alternativeGateways = [
        `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
        `https://dweb.link/ipfs/${ipfsHash}`
      ];
      
      let lastError = error;
      for (const gateway of alternativeGateways) {
        try {
          console.debug(`[NFT Metadata] Trying CORS-safe alternative gateway: ${gateway.substring(0, 60)}...`);
          const response = await fetch(gateway, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'application/json' }, // Minimal headers to avoid CORS issues
            signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
          });
          
          if (response.ok) {
            const metadata = await response.json();
            console.log(`[NFT Metadata] ✓ Successfully fetched from CORS-safe gateway`);
            
            // Process image URL from alternative gateway response
            let imageUrl = metadata.image || metadata.image_url || metadata.imageUrl;
            if (imageUrl && imageUrl.startsWith('ipfs://')) {
              const imgHash = imageUrl.substring(7);
              imageUrl = `https://ipfs.io/ipfs/${imgHash}`;
            }
            
            return {
              ...metadata,
              imageUrl: imageUrl || metadata.image || metadata.imageUrl
            };
          }
        } catch (gatewayError) {
          const gatewayErrorMessage = gatewayError instanceof Error ? gatewayError.message : String(gatewayError);
          
          // Check if this is also a CORS error
          if (gatewayErrorMessage.includes('CORS') || gatewayErrorMessage.includes('Access-Control')) {
            console.debug(`[NFT Metadata] CORS restriction on alternative gateway for ${ipfsHash}`);
            continue;
          }
          
          lastError = gatewayError;
          console.debug(`[NFT Metadata] Alternative gateway failed: ${gatewayErrorMessage}`);
          continue;
        }
      }
      
      // Check if all failures were CORS-related
      const allCorsRelated = lastError instanceof Error && 
                           (lastError.message.includes('CORS') || lastError.message.includes('Access-Control'));
      
      if (allCorsRelated) {
        console.debug(`[NFT Metadata] All gateways blocked by CORS for IPFS hash ${ipfsHash}`);
        return {
          name: "NFT (IPFS Restricted)",
          description: "NFT metadata unavailable due to CORS restrictions on IPFS gateways",
          image: null,
          corsRestricted: true,
          originalUri: tokenURI,
          ipfsHash: ipfsHash
        };
      } else {
        console.warn(`[NFT Metadata] All gateways failed for IPFS hash ${ipfsHash}. Last error:`, lastError instanceof Error ? lastError.message : String(lastError));
      }
    }
    
    return null;
  }
};

/**
 * Calculate USD values and token prices using simplified pricing service
 * Primary: Redux + CoinGecko API (via simplePricingService.ts)
 */


/**
 * Gets token balances for an address by checking UTXOs
 * and enriches them with metadata from the token list
 */
export const getAddressTokens = async (address: string, options?: { skipNFTMetadata?: boolean }): Promise<EnrichedToken[]> => {
  try {
    // Fetch token metadata first
    const tokenMetadataMap = await fetchTokenList();
    console.log("Token metadata map:", tokenMetadataMap);
    
    // Get all UTXOs for the address
    const response = await getAddressUtxos(address);
    
    // Extract token information from UTXOs
    const tokenMap: Record<string, EnrichedToken> = {};
    
    // Check if we have the expected structure
    if (!response || !response.utxos || !Array.isArray(response.utxos)) {
      console.warn('Unexpected UTXO response structure:', response);
      return [];
    }
    
    const utxoArray = response.utxos;
    
    // OPTIMIZATION: Collect unique token IDs for batch processing
    const uniqueTokenIds = new Set<string>();
    const tokenAmounts: Record<string, string> = {};
    
    for (const utxo of utxoArray) {
      if (utxo.tokens && utxo.tokens.length > 0) {
        for (const token of utxo.tokens) {
          const tokenId = token.id;
          uniqueTokenIds.add(tokenId);
          
          // Aggregate amounts
          if (tokenAmounts[tokenId]) {
            tokenAmounts[tokenId] = (BigInt(tokenAmounts[tokenId]) + BigInt(token.amount)).toString();
          } else {
            tokenAmounts[tokenId] = token.amount;
          }
        }
      }
    }
    
    console.log(`[Token Processing] Processing ${uniqueTokenIds.size} unique tokens (batch optimization)`);
    
    // OPTIMIZATION: Batch process token types to reduce API calls
    const batchedTokenTypes = new Map<string, { isNFT: boolean; type: string }>();
    const uncachedTokenIds = Array.from(uniqueTokenIds).filter(id => !tokenTypeCache.getTokenType(id));
    
    if (uncachedTokenIds.length > 0) {
      console.log(`[Token Processing] Fetching types for ${uncachedTokenIds.length} uncached tokens`);
      
      // Process in smaller batches to avoid overwhelming the API
      const BATCH_SIZE = 5;
      for (let i = 0; i < uncachedTokenIds.length; i += BATCH_SIZE) {
        const batch = uncachedTokenIds.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (tokenId) => {
          try {
            const cachedType = tokenTypeCache.getTokenType(tokenId);
            if (cachedType) {
              return { tokenId, ...cachedType };
            }
            
            const tokenType = await sdkRateLimiter.execute(async () => {
              return await nodeProvider.guessStdTokenType(tokenId);
            });
            
            const isNFT = tokenType === 'non-fungible';
            tokenTypeCache.setTokenType(tokenId, isNFT, tokenType);
            return { tokenId, isNFT, type: tokenType };
          } catch (error) {
            console.warn(`[Token Processing] Error getting type for ${tokenId}:`, error);
            return { tokenId, isNFT: false, type: 'unknown' };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(result => {
          batchedTokenTypes.set(result.tokenId, { isNFT: result.isNFT, type: result.type });
        });
        
        // Small delay between batches to be nice to the API
        if (i + BATCH_SIZE < uncachedTokenIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    
    // Process tokens with optimized metadata fetching
    for (const tokenId of uniqueTokenIds) {
      // Get token type (from cache or batch result)
      let tokenTypeInfo = tokenTypeCache.getTokenType(tokenId);
      if (!tokenTypeInfo) {
        tokenTypeInfo = batchedTokenTypes.get(tokenId) || { isNFT: false, type: 'unknown' };
      }
      
      const nftStatus = tokenTypeInfo.isNFT;
      
      console.log(`[Token Processing] Processing token ${tokenId}: ${tokenTypeInfo.type}, isNFT: ${nftStatus}`);
      
      // Get metadata based on token type
      let tokenMetadata;
      let officialMetadata = null;
      let metadataSource = 'fallback';
      
      if (nftStatus) {
        console.log(`[Token Processing] Token ${tokenId} is NFT - using NFT metadata`);
        tokenMetadata = tokenMetadataMap[tokenId] || getFallbackTokenData(tokenId);
        metadataSource = tokenMetadataMap[tokenId] ? 'token-list' : 'fallback';
      } else {
        console.log(`[Token Processing] Token ${tokenId} is fungible - fetching official metadata`);
        // For fungible tokens, try to get official metadata first
        officialMetadata = await fetchFungibleTokenMetadata(tokenId);
        
        if (officialMetadata) {
          console.log(`[Token Processing] Official metadata found for ${tokenId}:`, officialMetadata);
          tokenMetadata = {
            ...officialMetadata,
            logoURI: tokenMetadataMap[tokenId]?.logoURI, // Keep logo from token list if available
            description: tokenMetadataMap[tokenId]?.description || officialMetadata.description
          };
          metadataSource = 'official-sdk';
        } else {
          console.log(`[Token Processing] No official metadata for ${tokenId}, using token list fallback`);
          tokenMetadata = tokenMetadataMap[tokenId] || getFallbackTokenData(tokenId);
          metadataSource = tokenMetadataMap[tokenId] ? 'token-list' : 'fallback';
        }
      }
      
      // Use token metadata for display info
      const displayInfo = {
        displayName: tokenMetadata?.name || tokenId,
        displaySymbol: tokenMetadata?.symbol || tokenId.substring(0, 6)
      };
      
      // Process initial image URL from basic metadata
      let initialImageUrl = null;
      
      if (nftStatus) {
        // For NFTs, only use NFT-specific image sources, NOT logoURI (which is for regular tokens)
        initialImageUrl = tokenMetadata.image || tokenMetadata.imageUrl;
        console.log(`[NFT Processing] NFT ${tokenId} - using NFT image sources only: ${initialImageUrl}`);
      } else {
        // For regular tokens, use logoURI
        initialImageUrl = tokenMetadata.logoURI || tokenMetadata.image || tokenMetadata.imageUrl;
      }
      
      // Convert IPFS URLs to HTTP gateways at the initial level
      if (initialImageUrl) {
        if (initialImageUrl.startsWith('ipfs://')) {
          const ipfsHash = initialImageUrl.substring(7);
          initialImageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        } else if (initialImageUrl.startsWith('ipfs/')) {
          const ipfsHash = initialImageUrl.substring(5);
          initialImageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        }
        console.log(`[Token Processing] Processed image URL for ${tokenId}: ${initialImageUrl}`);
      }
      
      tokenMap[tokenId] = {
        id: tokenId,
        amount: tokenAmounts[tokenId] || "0",
        name: displayInfo.displayName,
        nameOnChain: tokenMetadata.nameOnChain,
        symbol: displayInfo.displaySymbol,
        symbolOnChain: tokenMetadata.symbolOnChain,
        decimals: tokenMetadata.decimals,
        logoURI: tokenMetadata.logoURI,
        description: tokenMetadata.description,
        formattedAmount: '',
        isNFT: nftStatus,
        tokenURI: tokenMetadata.tokenURI || tokenMetadata.uri,
        imageUrl: initialImageUrl,
        // Initialize USD value and price properties - will be calculated after amount aggregation
        usdValue: undefined,
        tokenPrice: undefined,
      };
      
      // Log the final token metadata for debugging
      console.log(`[Token Processing] Final metadata for ${tokenId}:`, {
        name: tokenMap[tokenId].name,
        symbol: tokenMap[tokenId].symbol,
        decimals: tokenMap[tokenId].decimals,
        isNFT: tokenMap[tokenId].isNFT,
        source: metadataSource
      });
      
      // Try to fetch enhanced NFT metadata if it's an NFT and metadata fetching is not skipped
      if (nftStatus && !options?.skipNFTMetadata) {
        console.log(`[NFT Processing] Skipping enhanced metadata fetch for NFT ${tokenId} - batch optimization`);
        // Note: We skip enhanced NFT metadata in batch mode to reduce API calls
      } else if (nftStatus && options?.skipNFTMetadata) {
        console.log(`[NFT Processing] Skipping enhanced metadata fetch for NFT ${tokenId} - metadata fetching disabled`);
      }
    }
    
    // RACE CONDITION FIX: Remove pricing calculation from here
    // Pricing is now handled by WalletDashboard to prevent concurrent API calls
    console.log("[Token Processing] ✅ Batch processing complete - handled by WalletDashboard");
    
    // Convert to the final result format without pricing
    const result = Object.values(tokenMap).map(token => ({
      ...token,
      // Pricing properties are initialized but not calculated here (WalletDashboard handles pricing)
      usdValue: undefined,
      tokenPrice: undefined,
      priceSource: undefined,
      formattedAmount: token.isNFT 
        ? token.amount // Don't format NFT amounts (they're usually just "1")
        : formatTokenAmount(token.amount, token.decimals)
    }));
    
    // Enhanced logging for token classification results
    const nfts = result.filter(token => token.isNFT);
    const regularTokens = result.filter(token => !token.isNFT);
    
    console.log("=== TOKEN CLASSIFICATION RESULTS (Batch Optimized) ===");
    console.log(`Total tokens: ${result.length}`);
    console.log(`Regular tokens: ${regularTokens.length}`);
    console.log(`NFTs: ${nfts.length}`);
    console.log("✅ Tokens ready for pricing by WalletDashboard");
    
    if (regularTokens.length > 0) {
      console.log("Regular tokens with metadata sources:", regularTokens.map(token => ({
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        amount: token.amount,
        formattedAmount: token.formattedAmount
      })));
    }
    
    if (nfts.length > 0) {
      console.log("NFTs detected:", nfts.map(nft => ({
        id: nft.id,
        name: nft.name,
        symbol: nft.symbol,
        amount: nft.amount,
        hasImage: !!nft.imageUrl,
        hasTokenURI: !!nft.tokenURI
      })));
    }
    
    console.log("Enriched tokens with batch-optimized SDK methods:", result);
    return result;
  } catch (error) {
    console.error('Error fetching address tokens:', error);
    return [];
  }
};

/**
 * Fetches NFTs owned by an address
 */
export const getAddressNFTs = async (address: string): Promise<EnrichedToken[]> => {
  try {
    // Reuse the getAddressTokens function but filter for NFTs only
    const allTokens = await getAddressTokens(address);
    const nfts = allTokens.filter(token => token.isNFT);
    return nfts;
  } catch (error) {
    console.error('Error fetching address NFTs:', error);
    return [];
  }
};

/**
 * Build and submit a transaction
 */
export const sendTransaction = async (
  fromAddress: string,
  toAddress: string,
  amountInAlph: number,
  signer: any
) => {
  try {
    // Convert ALPH to nanoALPH
    const amountInNanoAlph = (amountInAlph * 10**18).toString();
    
    // Get the from group
    const addressInfo = await nodeProvider.addresses.getAddressesAddressGroup(fromAddress);
    const fromGroup = addressInfo.group;
    
    // Build unsigned transaction
    const unsignedTx = await nodeProvider.transactions.postTransactionsBuild({
      fromPublicKey: signer.publicKey,
      destinations: [{
        address: toAddress,
        attoAlphAmount: amountInNanoAlph
      }]
    });
    
    // Sign the transaction
    const signature = await signer.signTransactionWithSignature(unsignedTx);
    
    // Submit the transaction
    const result = await nodeProvider.transactions.postTransactionsSubmit({
      unsignedTx: unsignedTx.unsignedTx,
      signature: signature
    });
    
    return result;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

// Balance History Cache Interface
interface BalanceHistoryDataPoint {
  date: string;
  balance: number;
  timestamp: number;
  source: 'api' | 'calculated' | 'estimated';
}

interface CachedBalanceHistory {
  data: BalanceHistoryDataPoint[];
  lastUpdated: number;
  address: string;
  days: number;
}

// Local storage cache for balance history
class BalanceHistoryCache {
  private cacheKey = 'alephium_balance_history_cache';
  
  getCache(address: string, days: number): CachedBalanceHistory | null {
    try {
      const cached = localStorage.getItem(`${this.cacheKey}_${address}_${days}`);
      if (!cached) return null;
      
      const data = JSON.parse(cached) as CachedBalanceHistory;
      const age = Date.now() - data.lastUpdated;
      
      // Cache is valid for 1 hour for daily snapshots
      if (age < 60 * 60 * 1000) {
        console.log(`[BalanceHistory] Using cached data for ${address} (${Math.round(age / 1000)}s old)`);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('[BalanceHistory] Error reading cache:', error);
      return null;
    }
  }
  
  setCache(address: string, days: number, data: BalanceHistoryDataPoint[]): void {
    try {
      const cacheData: CachedBalanceHistory = {
        data,
        lastUpdated: Date.now(),
        address,
        days
      };
      localStorage.setItem(`${this.cacheKey}_${address}_${days}`, JSON.stringify(cacheData));
      console.log(`[BalanceHistory] Cached ${data.length} data points for ${address}`);
    } catch (error) {
      console.error('[BalanceHistory] Error writing cache:', error);
    }
  }
  
  clearCache(address?: string): void {
    try {
      if (address) {
        // Clear specific address cache
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`${this.cacheKey}_${address}`)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        // Clear all balance history cache
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(this.cacheKey)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('[BalanceHistory] Error clearing cache:', error);
    }
  }
}

const balanceHistoryCache = new BalanceHistoryCache();

/**
 * Fetches real balance history for an address using Explorer API and transaction-based calculation
 * Features: Local caching, configurable time periods, static daily snapshots
 */
export const fetchBalanceHistory = async (address: string, days: number = 30): Promise<BalanceHistoryDataPoint[]> => {
  // ✅ CRITICAL FIX: Validate address before making API calls
  if (!address || address.trim() === '') {
    console.error('[fetchBalanceHistory] Empty address provided');
    throw new Error('Address is required for balance history');
  }
  
  // ✅ FIX: More flexible address validation for Alephium (match getAddressBalance)
  if (address.length < 44 || address.length > 58) {
    console.error('[fetchBalanceHistory] Invalid address length:', address, 'Length:', address.length);
    throw new Error('Invalid address format - incorrect length');
  }
  
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
    console.error('[fetchBalanceHistory] Invalid address characters:', address);
    throw new Error('Invalid address format - invalid characters');
  }

  console.log(`[BalanceHistory] Fetching ${days} days of history for ${address.slice(0, 8)}...`);
  
  // Check cache first
  const cached = balanceHistoryCache.getCache(address, days);
  if (cached) {
    console.log(`[BalanceHistory] ✅ Using cached data for ${address.slice(0, 8)}`);
    return cached.data;
  }
  
  try {
    // Method 1: Try to fetch from Explorer API (if available)
    const explorerData = await fetchBalanceHistoryFromExplorer(address, days);
    if (explorerData && explorerData.length > 0) {
      console.log(`[BalanceHistory] ✅ Retrieved ${explorerData.length} points from Explorer API`);
      balanceHistoryCache.setCache(address, days, explorerData);
      return explorerData;
    }
    
    // Method 2: Calculate from transaction history (fallback)
    console.log('[BalanceHistory] Explorer API unavailable, calculating from transactions...');
    const calculatedData = await calculateBalanceHistoryFromTransactions(address, days);
    if (calculatedData && calculatedData.length > 0) {
      console.log(`[BalanceHistory] ✅ Calculated ${calculatedData.length} points from transactions`);
      balanceHistoryCache.setCache(address, days, calculatedData);
      return calculatedData;
    }
    
    // Method 3: Enhanced simulation (last resort)
    console.log('[BalanceHistory] Using enhanced simulation as fallback...');
    const simulatedData = await generateEnhancedBalanceHistory(address, days);
    balanceHistoryCache.setCache(address, days, simulatedData);
    return simulatedData;
    
  } catch (error) {
    console.error('[BalanceHistory] Error fetching balance history:', error);
    throw error;
  }
};

/**
 * Method 1: Fetch balance history from Alephium Explorer API
 */
const fetchBalanceHistoryFromExplorer = async (address: string, days: number): Promise<BalanceHistoryDataPoint[] | null> => {
  try {
    const explorerApiBase = "https://explorer.alephium.org/api";
    
    // Try different possible endpoints for historical data
    const endpoints = [
      `${explorerApiBase}/addresses/${address}/balance-history?days=${days}`,
      `${explorerApiBase}/addresses/${address}/history?days=${days}`,
      `${explorerApiBase}/balances/${address}/history?days=${days}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`[BalanceHistory] Trying endpoint: ${endpoint}`);
        
        // ✅ CORS FIX: Try with no-cors mode first, then fall back to cors
        const corsOptions = [
          { headers: { 'Accept': 'application/json' }, mode: 'cors' as RequestMode },
          { headers: { 'Accept': 'application/json' }, mode: 'no-cors' as RequestMode }
        ];
        
        for (const options of corsOptions) {
          try {
            const response = await fetch(endpoint, options);
            
            if (response.ok && response.status === 200) {
              const data = await response.json();
              if (data && Array.isArray(data) && data.length > 0) {
                console.log(`[BalanceHistory] ✅ Success with ${options.mode} mode`);
                return data.map((point: any) => ({
                  date: point.date || point.timestamp?.split('T')[0],
                  balance: parseFloat(point.balance || point.amount || '0'),
                  timestamp: point.timestamp ? new Date(point.timestamp).getTime() : Date.now(),
                  source: 'api' as const
                }));
              }
            }
          } catch (fetchError: any) {
            if (fetchError.message?.includes('cors') || fetchError.message?.includes('CORS')) {
              console.log(`[BalanceHistory] CORS blocked for ${endpoint}, trying fallback...`);
              continue;
            }
            throw fetchError;
          }
        }
      } catch (endpointError: any) {
        console.log(`[BalanceHistory] Endpoint ${endpoint} failed:`, endpointError.message);
        continue;
      }
    }
    
    console.log('[BalanceHistory] All explorer endpoints failed, will use fallback calculation');
    return null;
  } catch (error) {
    console.error('[BalanceHistory] Explorer API error:', error);
    return null;
  }
};

/**
 * Method 2: Calculate balance history from transaction history
 * Enhanced to properly handle token swaps, exchange transactions, and complex multi-input/output scenarios
 */
const calculateBalanceHistoryFromTransactions = async (address: string, days: number): Promise<BalanceHistoryDataPoint[]> => {
  try {
    // Get current balance
    const currentBalance = await getAddressBalance(address);
    
    // Get transaction history (larger limit for better calculation)
    const transactions = await getAddressTransactions(address, Math.max(200, days * 10));
    
    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions available for calculation');
    }
    
    console.log(`[BalanceHistory] Processing ${transactions.length} transactions for accurate balance calculation`);
    
    // Parse and analyze each transaction to calculate accurate ALPH changes
    const processedTransactions = transactions.map(tx => {
      const netAlphChange = calculateNetAlphChange(tx, address);
      return {
        ...tx,
        netAlphChange,
        parsedTimestamp: new Date(tx.timestamp).getTime()
      };
    }).filter(tx => !isNaN(tx.parsedTimestamp))
      .sort((a, b) => a.parsedTimestamp - b.parsedTimestamp); // Sort by timestamp ascending
    
    // Create daily snapshots by working backwards from current balance
    const data: BalanceHistoryDataPoint[] = [];
    const now = new Date();
    let currentCalculatedBalance = currentBalance.balance;
    
    // Start from today and work backwards
    for (let i = 0; i <= days; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - i);
      targetDate.setHours(23, 59, 59, 999); // End of day
      const targetTimestamp = targetDate.getTime();
      
      // Find transactions that occurred after this target date
      const txsAfterDate = processedTransactions.filter(tx => 
        tx.parsedTimestamp > targetTimestamp
      );
      
      // Calculate balance at target date by subtracting future transactions
      let balanceAtDate = currentCalculatedBalance;
      
      // Subtract the net effect of all transactions that happened after this date
      txsAfterDate.forEach(tx => {
        balanceAtDate -= tx.netAlphChange;
      });
      
      // Ensure balance is never negative (might indicate calculation issues)
      balanceAtDate = Math.max(0, balanceAtDate);
      
      data.unshift({
        date: targetDate.toISOString().split('T')[0],
        balance: parseFloat(balanceAtDate.toFixed(6)), // Higher precision for ALPH
        timestamp: targetTimestamp,
        source: 'calculated' as const
      });
    }
    
    // Validate our calculation by checking if the final balance matches current balance
    const calculatedCurrentBalance = data[data.length - 1]?.balance || 0;
    const balanceDifference = Math.abs(calculatedCurrentBalance - currentBalance.balance);
    
    if (balanceDifference > 0.001) { // Allow small rounding differences
      console.warn(`[BalanceHistory] Balance calculation discrepancy detected:`);
      console.warn(`  Calculated: ${calculatedCurrentBalance} ALPH`);
      console.warn(`  Actual: ${currentBalance.balance} ALPH`);
      console.warn(`  Difference: ${balanceDifference} ALPH`);
      console.warn(`  This might indicate complex transactions or missing data`);
    }
    
    console.log(`[BalanceHistory] ✅ Calculated ${data.length} points from ${processedTransactions.length} processed transactions`);
    console.log(`[BalanceHistory] Balance range: ${Math.min(...data.map(d => d.balance)).toFixed(4)} - ${Math.max(...data.map(d => d.balance)).toFixed(4)} ALPH`);
    
    return data;
    
  } catch (error) {
    console.error('[BalanceHistory] Transaction calculation error:', error);
    throw error;
  }
};

/**
 * Calculate the net ALPH change for a specific address in a transaction
 * Based on Alephium Explorer's parsing logic - properly distinguishes ALPH from token movements
 * Reference: https://github.com/alephium/explorer
 */
const calculateNetAlphChange = (transaction: any, targetAddress: string): number => {
  try {
    let netAlphChange = 0;
    let hasTokenMovements = false;
    
    // Process all inputs (ALPH going OUT of the address)
    if (transaction.inputs && Array.isArray(transaction.inputs)) {
      transaction.inputs.forEach((input: any) => {
        if (input.address === targetAddress) {
          // ONLY count actual ALPH amounts, not token values
          // The Explorer shows attoAlphAmount is the pure ALPH amount in atto units
          const alphAmount = parseFloat(input.attoAlphAmount || '0') / 1e18;
          
          if (alphAmount > 0) {
            netAlphChange -= alphAmount;
            console.debug(`[TxParser] ALPH Input: -${alphAmount} ALPH from ${targetAddress.substring(0, 8)}...`);
          }
          
          // Check if this input also contains tokens (but don't count them as ALPH)
          if (input.tokens && Array.isArray(input.tokens) && input.tokens.length > 0) {
            hasTokenMovements = true;
            console.debug(`[TxParser] Token Input: ${input.tokens.length} tokens from ${targetAddress.substring(0, 8)}...`);
          }
        }
      });
    }
    
    // Process all outputs (ALPH coming INTO the address)
    if (transaction.outputs && Array.isArray(transaction.outputs)) {
      transaction.outputs.forEach((output: any) => {
        if (output.address === targetAddress) {
          // ONLY count actual ALPH amounts, not token values
          // The Explorer shows attoAlphAmount is the pure ALPH amount in atto units
          const alphAmount = parseFloat(output.attoAlphAmount || '0') / 1e18;
          
          if (alphAmount > 0) {
            netAlphChange += alphAmount;
            console.debug(`[TxParser] ALPH Output: +${alphAmount} ALPH to ${targetAddress.substring(0, 8)}...`);
          }
          
          // Check if this output also contains tokens (but don't count them as ALPH)
          if (output.tokens && Array.isArray(output.tokens) && output.tokens.length > 0) {
            hasTokenMovements = true;
            console.debug(`[TxParser] Token Output: ${output.tokens.length} tokens to ${targetAddress.substring(0, 8)}...`);
          }
        }
      });
    }
    
    // Account for gas fees if this address initiated the transaction
    // Gas is always paid in ALPH, regardless of token movements
    if (transaction.inputs && Array.isArray(transaction.inputs) && transaction.inputs.length > 0) {
      const firstInput = transaction.inputs[0];
      if (firstInput.address === targetAddress) {
        // This address paid for gas
        const gasAmount = parseFloat(transaction.gasAmount || '0');
        const gasPrice = parseFloat(transaction.gasPrice || '0');
        const totalGasCost = (gasAmount * gasPrice) / 1e18;
        
        if (totalGasCost > 0) {
          netAlphChange -= totalGasCost;
          console.debug(`[TxParser] Gas Cost: -${totalGasCost} ALPH from ${targetAddress.substring(0, 8)}...`);
        }
      }
    }
    
    // Enhanced logging for different transaction types
    if (hasTokenMovements && Math.abs(netAlphChange) > 0) {
      console.log(`[TxParser] Swap/Exchange: ${netAlphChange > 0 ? '+' : ''}${netAlphChange.toFixed(6)} ALPH + tokens for ${targetAddress.substring(0, 8)}... in tx ${transaction.hash?.substring(0, 8)}...`);
    } else if (hasTokenMovements && Math.abs(netAlphChange) === 0) {
      console.debug(`[TxParser] Token-only transaction (no ALPH change) for ${targetAddress.substring(0, 8)}... in tx ${transaction.hash?.substring(0, 8)}...`);
    } else if (Math.abs(netAlphChange) > 1.0) {
      console.log(`[TxParser] ALPH transaction: ${netAlphChange > 0 ? '+' : ''}${netAlphChange.toFixed(6)} ALPH for ${targetAddress.substring(0, 8)}... in tx ${transaction.hash?.substring(0, 8)}...`);
    }
    
    // Handle failed transactions - gas is still consumed even if execution fails
    if (transaction.scriptExecutionOk === false) {
      console.debug(`[TxParser] Failed transaction detected for ${targetAddress.substring(0, 8)}... - gas consumed but execution failed`);
      // Gas cost is already subtracted above, so no additional action needed
    }
    
    return netAlphChange;
    
  } catch (error) {
    console.warn(`[TxParser] Error parsing transaction ${transaction.hash?.substring(0, 8) || 'unknown'}:`, error);
    return 0; // Return 0 for unparseable transactions
  }
};

/**
 * Method 3: Enhanced simulation with more realistic patterns
 */
const generateEnhancedBalanceHistory = async (address: string, days: number): Promise<BalanceHistoryDataPoint[]> => {
  try {
    // Get current balance
    const currentBalance = await getAddressBalance(address);
    
    // Generate more realistic historical data
    const data: BalanceHistoryDataPoint[] = [];
    const now = new Date();
    
    // Start with 70-90% of current balance X days ago
    let balance = currentBalance.balance * (0.7 + Math.random() * 0.2);
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add realistic market-like volatility
      const volatility = 0.05; // 5% daily volatility
      const trend = (days - i) / days * 0.3; // Slight upward trend towards current
      const randomChange = (Math.random() - 0.5) * volatility * 2;
      const trendChange = trend * 0.001; // Small trend component
      
      balance = balance * (1 + randomChange + trendChange);
      
      // Ensure we end at the exact current balance
      if (i === 0) {
        balance = currentBalance.balance;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        balance: parseFloat(balance.toFixed(4)),
        timestamp: date.getTime(),
        source: 'estimated' as const
      });
    }
    
    console.log(`[BalanceHistory] Generated ${data.length} simulated points`);
    return data;
    
  } catch (error) {
    console.error('[BalanceHistory] Enhanced simulation error:', error);
    throw error;
  }
};

// Export cache management functions
export const clearBalanceHistoryCache = (address?: string) => {
  balanceHistoryCache.clearCache(address);
};

export const getBalanceHistoryCacheStats = () => {
  const keys = Object.keys(localStorage).filter(key => key.startsWith('alephium_balance_history_cache'));
  return {
    totalCached: keys.length,
    cacheKeys: keys
  };
};

/**
 * Fetches network statistics from explorer.alephium.org
 * Using similar endpoints as the official explorer
 */
export const fetchNetworkStats = async () => {
  try {
    // First try to get some real data from the node
    const infoResponse = await nodeProvider.infos.getInfosNode();
    const blockflowResponse = await nodeProvider.blockflow.getBlockflowChainInfo({
      fromGroup: 0,
      toGroup: 0
    });
    
    // Use real data when available, but provide reasonable defaults
    const currentHeight = blockflowResponse ? parseInt(String(blockflowResponse.currentHeight || "3752480")) : 3752480;
    
    // Updated API endpoints based on Alephium Explorer GitHub repository
    // The correct Explorer API base URL
    const explorerApiBase = "https://explorer.alephium.org/api";
    
    // Default values in case API calls fail
    let hashRate = "38.2 PH/s";
    let difficulty = "3.51 P";
    let blockTime = "64.0s";
    let totalTransactions = "4.28M";
    let totalSupply = "110.06M ALPH";
    let isLiveData = false; // Flag to indicate if we're using live data
    
    // To track if any API call succeeded
    let anyApiCallSucceeded = false;
    
    // Try to fetch actual network metrics from the Explorer API
    try {
      // Fetch hashrates data using the correct API endpoint
      const hashRateResponse = await fetch(`${explorerApiBase}/hashrates`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (hashRateResponse.ok) {
        anyApiCallSucceeded = true;
        const hashRateData = await hashRateResponse.json();
        if (hashRateData && hashRateData.length > 0) {
          // Get the most recent hashrate data
          const latestHashRateData = hashRateData[hashRateData.length - 1];
          hashRate = `${(latestHashRateData.hashrate / 1e15).toFixed(2)} PH/s`;
          difficulty = `${(latestHashRateData.difficulty / 1e15).toFixed(2)} P`;
        }
      }
      
      // Fetch average block time data
      const blockTimeResponse = await fetch(`${explorerApiBase}/block-times`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (blockTimeResponse.ok) {
        anyApiCallSucceeded = true;
        const blockTimeData = await blockTimeResponse.json();
        if (blockTimeData && blockTimeData.length > 0) {
          // Get the most recent block time data
          const latestBlockTimeData = blockTimeData[blockTimeData.length - 1];
          blockTime = `${latestBlockTimeData.averageTime.toFixed(1)}s`;
        }
      }
      
      // Fetch supply data
      const supplyResponse = await fetch(`${explorerApiBase}/supply`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (supplyResponse.ok) {
        anyApiCallSucceeded = true;
        const supplyData = await supplyResponse.json();
        if (supplyData && supplyData.circulatingSupply) {
          // Format the circulating supply
          const circulatingSupply = supplyData.circulatingSupply / 1e18; // Convert from alph to ALPH
          totalSupply = `${(circulatingSupply / 1e6).toFixed(2)}M ALPH`;
        }
      }
      
      // Fetch total transaction count
      const txCountResponse = await fetch(`${explorerApiBase}/charts/txs`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (txCountResponse.ok) {
        anyApiCallSucceeded = true;
        const txCountData = await txCountResponse.json();
        if (txCountData && txCountData.length > 0) {
          // Sum up all transaction counts
          const totalTxs = txCountData.reduce((sum, item) => sum + item.count, 0);
          totalTransactions = totalTxs > 1e6 
            ? `${(totalTxs / 1e6).toFixed(2)}M` 
            : totalTxs > 1e3 
              ? `${(totalTxs / 1e3).toFixed(1)}K` 
              : totalTxs.toString();
        }
      }

      // If any API call was successful, mark data as live
      isLiveData = anyApiCallSucceeded;
    } catch (explorerError) {
      console.error('Error fetching from explorer API:', explorerError);
      // We'll fall back to our default values
      isLiveData = false;
    }
    
    // Fetch the latest blocks information from the node directly
    let latestBlocks = [
      { hash: "0x" + Math.random().toString(16).substring(2, 10) + "...", timestamp: Date.now() - Math.floor(Math.random() * 60000), height: currentHeight, txNumber: Math.floor(Math.random() * 10) + 1 },
      { hash: "0x" + Math.random().toString(16).substring(2, 10) + "...", timestamp: Date.now() - Math.floor(Math.random() * 60000 + 60000), height: currentHeight - 1, txNumber: Math.floor(Math.random() * 8) + 1 },
      { hash: "0x" + Math.random().toString(16).substring(2, 10) + "...", timestamp: Date.now() - Math.floor(Math.random() * 60000 + 120000), height: currentHeight - 2, txNumber: Math.floor(Math.random() * 12) + 1 }
    ];
    
    try {
      // Attempt to fetch real blocks data from the Explorer API
      const blocksResponse = await fetch(`${explorerApiBase}/blocks?page=1&limit=3`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (blocksResponse.ok) {
        anyApiCallSucceeded = true;
        isLiveData = true;
        const blocksData = await blocksResponse.json();
        if (blocksData && blocksData.blocks && blocksData.blocks.length > 0) {
          latestBlocks = blocksData.blocks.map(block => ({
            hash: block.hash,
            timestamp: new Date(block.timestamp).getTime(),
            height: block.height,
            txNumber: block.txNumber || 0
          }));
        } else {
          // If we couldn't get real blocks data, update the height at least
          if (blockflowResponse && blockflowResponse.currentHeight) {
            const height = parseInt(String(blockflowResponse.currentHeight));
            latestBlocks = latestBlocks.map((block, index) => ({
              ...block,
              height: height - index
            }));
          }
        }
      }
    } catch (blocksError) {
      console.error('Error fetching latest blocks:', blocksError);
      // We'll use the default/sample blocks above
    }
    
    // Get active addresses count from the explorer API
    let activeAddresses = 193500; // Default value
    
    try {
      const addressCountResponse = await fetch(`${explorerApiBase}/addresses/total`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (addressCountResponse.ok) {
        anyApiCallSucceeded = true;
        isLiveData = true;
        const addressData = await addressCountResponse.json();
        if (addressData && typeof addressData.total === 'number') {
          activeAddresses = addressData.total;
        }
      }
    } catch (error) {
      console.error('Error fetching address count:', error);
      // Fall back to default value
    }
    
    // Get token count from the explorer API
    let tokenCount = 385; // Default value
    
    try {
      const tokenCountResponse = await fetch(`${explorerApiBase}/tokens/total`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (tokenCountResponse.ok) {
        anyApiCallSucceeded = true;
        isLiveData = true;
        const tokenData = await tokenCountResponse.json();
        if (tokenData && typeof tokenData.total === 'number') {
          tokenCount = tokenData.total;
        }
      }
    } catch (error) {
      console.error('Error fetching token count:', error);
      // Fall back to default value
    }
    
    return {
      hashRate: hashRate,
      difficulty: difficulty,
      blockTime: blockTime,
      activeAddresses: activeAddresses,
      tokenCount: tokenCount,
      totalTransactions: totalTransactions,
      totalSupply: totalSupply,
      totalBlocks: `${(currentHeight / 1000000).toFixed(2)}M`, // Calculated from real height when possible
      latestBlocks: latestBlocks,
      isLiveData: isLiveData // Add the flag to the returned object
    };
  } catch (error) {
    console.error('Error fetching network stats:', error);
    // Return fallback data if we can't connect
    return {
      hashRate: "38.2 PH/s",
      difficulty: "3.51 P",
      blockTime: "64.0s",
      activeAddresses: 193500,
      tokenCount: 385,
      totalTransactions: "4.28M",
      totalSupply: "110.06M ALPH",
      totalBlocks: "3.75M",
      isLiveData: false, // Mark as fallback data
      latestBlocks: [
        { hash: "0xa1b2c3...", timestamp: Date.now() - 60000, height: 3752480, txNumber: 5 },
        { hash: "0xd4e5f6...", timestamp: Date.now() - 120000, height: 3752479, txNumber: 3 },
        { hash: "0x789012...", timestamp: Date.now() - 180000, height: 3752478, txNumber: 7 }
      ]
    };
  }
};

/**
 * Fetches latest transactions for a specific token ID
 * @param tokenId The token ID to fetch transactions for
 * @param limit Maximum number of transactions to fetch
 */
export const fetchTokenTransactions = async (tokenId: string, limit: number = 20) => {
  try {
    // Try to fetch from the backend API
    const TRANSACTIONS_API = 'https://backend.mainnet.alephium.org/tokens';
    const url = `${TRANSACTIONS_API}/${tokenId}/transactions?page=1&limit=${limit}`;
    
    console.log(`Fetching token transactions for ${tokenId}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn('Unexpected response format for token transactions:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching transactions for token ${tokenId}:`, error);
    
    // Return empty array if we couldn't fetch transactions
    return [];
  }
};

/**
 * Get the latest transactions across all tokens
 * Groups transactions by token and returns the most recent ones
 */
export const fetchLatestTokenTransactions = async (tokenIds: string[], limit: number = 5) => {
  try {
    const allTransactions = [];
    let count = 0;
    
    // Fetch transactions for each token ID
    for (const tokenId of tokenIds) {
      if (count >= limit) break;
      
      const tokenTxs = await fetchTokenTransactions(tokenId, 2);
      if (tokenTxs.length > 0) {
        // Add token ID to the transaction objects
        const enrichedTxs = tokenTxs.map(tx => ({
          ...tx,
          tokenId
        }));
        
        allTransactions.push(...enrichedTxs);
        count += tokenTxs.length;
      }
    }
    
    // Sort by timestamp, newest first
    return allTransactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching latest token transactions:', error);
    return [];
  }
};

/**
 * Token cache management functions
 */
export const clearTokenCache = () => {
  tokenMetadataCache.clearAll();
  tokenTypeCache.clearAll();
  clearTokenListCache();
  console.log("[Cache Management] Cleared all token metadata, type caches, and token list cache");
};

export const clearTokenCacheForToken = (tokenId: string) => {
  tokenMetadataCache.clearToken(tokenId);
  // Clear type cache for specific token
  try {
    const typeCache = tokenTypeCache as any;
    delete typeCache.memoryCache[tokenId];
    localStorage.removeItem(`alephium_token_type_cache_${tokenId}`);
  } catch (error) {
    console.warn("[Cache Management] Error clearing token type cache:", error);
  }
};

export const getTokenCacheStats = () => {
  const metadataStats = tokenMetadataCache.getStats();
  const typeKeys = Object.keys(localStorage).filter(key => key.startsWith('alephium_token_type_cache'));
  const tokenListStats = getTokenListCacheStats();
  
  return {
    metadata: metadataStats,
    tokenTypes: {
      totalCached: typeKeys.length,
      cacheKeys: typeKeys.map(key => key.replace('alephium_token_type_cache_', ''))
    },
    tokenList: tokenListStats,
    sdkRateLimiter: {
      queueLength: (sdkRateLimiter as any).requestQueue?.length || 0,
      activeRequests: (sdkRateLimiter as any).activeRequests || 0
    }
  };
};

export const refreshTokenMetadata = async (tokenId: string) => {
  console.log(`[Token Cache] Manually refreshing metadata for ${tokenId}`);
  // Clear cache for this token and fetch fresh data
  clearTokenCacheForToken(tokenId);
  return await fetchFungibleTokenMetadata(tokenId, true);
};

export const refreshAllTokenMetadata = async (tokenIds: string[]) => {
  console.log(`[Token Cache] Manually refreshing metadata for ${tokenIds.length} tokens`);
  // Clear all cache and fetch fresh data
  clearTokenCache();
  
  const results = [];
  for (const tokenId of tokenIds) {
    try {
      const metadata = await fetchFungibleTokenMetadata(tokenId, true);
      results.push({ tokenId, metadata, success: true });
    } catch (error) {
      results.push({ tokenId, error, success: false });
    }
  }
  
  return results;
};

// Enhanced Token Type Cache with indefinite TTL
class TokenTypeCache {
  private cacheKey = 'alephium_token_type_cache';
  private memoryCache: Record<string, { isNFT: boolean; type: string; cachedAt: number }> = {};

  getTokenType(tokenId: string): { isNFT: boolean; type: string } | null {
    // Check memory cache first
    if (this.memoryCache[tokenId]) {
      return this.memoryCache[tokenId];
    }

    // Check localStorage
    try {
      const cached = localStorage.getItem(`${this.cacheKey}_${tokenId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.memoryCache[tokenId] = parsed;
        return parsed;
      }
    } catch (error) {
      console.warn(`[TokenTypeCache] Error reading cache for ${tokenId}:`, error);
    }

    return null;
  }

  setTokenType(tokenId: string, isNFT: boolean, type: string): void {
    try {
      const cacheData = { isNFT, type, cachedAt: Date.now() };
      
      // Store in memory cache
      this.memoryCache[tokenId] = cacheData;

      // Store in localStorage
      localStorage.setItem(`${this.cacheKey}_${tokenId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn(`[TokenTypeCache] Error caching type for ${tokenId}:`, error);
    }
  }

  clearAll(): void {
    this.memoryCache = {};
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.cacheKey)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn(`[TokenTypeCache] Error clearing cache:`, error);
    }
  }
}

// Initialize the token type cache
const tokenTypeCache = new TokenTypeCache();

// Rate limiting for Alephium SDK calls
class AlephiumSDKRateLimiter {
  private requestQueue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private readonly MAX_CONCURRENT = 3; // Conservative limit for Alephium node
  private readonly MIN_DELAY = 100; // Minimum delay between requests
  private lastRequestTime = 0;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Ensure minimum delay between requests
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.MIN_DELAY) {
            await new Promise(resolve => setTimeout(resolve, this.MIN_DELAY - timeSinceLastRequest));
          }

          this.activeRequests++;
          this.lastRequestTime = Date.now();
          
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.activeRequests < this.MAX_CONCURRENT && this.requestQueue.length > 0) {
      const operation = this.requestQueue.shift()!;
      operation();
    }
  }
}

// Initialize the SDK rate limiter
const sdkRateLimiter = new AlephiumSDKRateLimiter();

export default {
  nodeProvider,
  getAddressBalance,
  getAddressTransactions,
  getAddressUtxos,
  getAddressTokens,
  getAddressNFTs,
  sendTransaction,
  fetchBalanceHistory,
  fetchNetworkStats,
  fetchTokenTransactions,
  fetchLatestTokenTransactions,
  // Cache management
  clearTokenCache,
  clearTokenCacheForToken,
  clearTokenListCache,
  getTokenCacheStats,
  refreshTokenMetadata,
  refreshAllTokenMetadata
};

// Export cache management functions globally for debugging
if (typeof window !== 'undefined') {
  (window as any).getTokenCacheStats = getTokenCacheStats;
  (window as any).clearTokenCache = clearTokenCache;
  (window as any).clearTokenListCache = clearTokenListCache;
}


