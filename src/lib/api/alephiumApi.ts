
import { NodeProvider } from '@alephium/web3';
import { getTokenMetadata, fetchTokenList, getFallbackTokenData, formatTokenAmount } from './tokenMetadata';
import { formatNumber } from '@/lib/utils/formatters';

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
  try {
    const result = await nodeProvider.addresses.getAddressesAddressBalance(address);
    
    return {
      balance: Number(result.balance) / 10**18,
      lockedBalance: Number(result.lockedBalance) / 10**18,
      utxoNum: result.utxoNum
    };
  } catch (error) {
    console.error('Error fetching address balance:', error);
    throw error;
  }
};

/**
 * Gets transaction history for an address
 * This uses a custom implementation since the direct transaction method is not available
 */
export const getAddressTransactions = async (address: string, limit = 20) => {
  try {
    // For now, we'll fetch UTXOs and use them to construct a simplified transaction history
    // In a production app, you might want to use the explorer API or build a more sophisticated solution
    const response = await nodeProvider.addresses.getAddressesAddressUtxos(address);
    
    // The API returns an object with a 'utxos' property that contains the array we need
    // Check if we have the expected structure
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
        amount: utxo.amount || '0'
      }],
      outputs: [{
        address: address,
        amount: utxo.amount || '0'
      }],
      // Add tokens information if available
      tokens: utxo.tokens || []
    }));
    
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
  // Add the missing properties that are used in TokenList.tsx
  usdValue?: number;
  tokenPrice?: number;
}

/**
 * Checks if a token is likely an NFT based on its properties
 */
const isLikelyNFT = (token: any) => {
  // Check for standard NFT properties
  if (token.standard && ['INFT', 'NFT', 'ERC721', 'ERC1155'].includes(token.standard)) {
    return true;
  }
  
  // Check for common NFT indicators in the token ID or symbol
  if ((token.symbol && /NFT|TOKEN|COIN|COLLECTION/i.test(token.symbol)) || 
      (token.name && /NFT|TOKEN|COIN|COLLECTION/i.test(token.name))) {
    return true;
  }
  
  // Check if the token appears to be non-fungible based on its amount
  if (token.amount === "1" || token.amount === 1) {
    return true;
  }
  
  return false;
};

/**
 * Fetch basic NFT metadata from token URI if available
 */
const fetchNFTMetadata = async (tokenURI?: string) => {
  if (!tokenURI) return null;
  
  try {
    // If token URI is an IPFS link, convert to HTTP gateway
    const formattedURI = tokenURI.startsWith('ipfs://')
      ? `https://ipfs.io/ipfs/${tokenURI.substring(7)}`
      : tokenURI;
    
    const response = await fetch(formattedURI);
    if (!response.ok) throw new Error(`Failed to fetch metadata: ${response.status}`);
    
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
};

/**
 * Gets token balances for an address by checking UTXOs
 * and enriches them with metadata from the token list
 */
export const getAddressTokens = async (address: string): Promise<EnrichedToken[]> => {
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
    
    for (const utxo of utxoArray) {
      if (utxo.tokens && utxo.tokens.length > 0) {
        for (const token of utxo.tokens) {
          const tokenId = token.id;
          
          if (!tokenMap[tokenId]) {
            // Get metadata from the token list or use fallback
            const metadata = tokenMetadataMap[tokenId] || getFallbackTokenData(tokenId);
            
            // Check if this token is likely an NFT
            const nftStatus = isLikelyNFT(metadata);
            
            tokenMap[tokenId] = {
              id: tokenId,
              amount: "0",
              name: metadata.name,
              nameOnChain: metadata.nameOnChain,
              symbol: metadata.symbol || (nftStatus ? 'NFT' : `TOKEN-${tokenId.substring(0, 6)}`),
              symbolOnChain: metadata.symbolOnChain,
              decimals: metadata.decimals,
              logoURI: metadata.logoURI,
              description: metadata.description,
              formattedAmount: '',
              isNFT: nftStatus,
              tokenURI: metadata.tokenURI || metadata.uri,
              imageUrl: metadata.image || metadata.imageUrl,
              // Initialize the new properties with default values
              usdValue: 0,
              tokenPrice: 0
            };
            
            // Try to fetch additional NFT metadata if it's an NFT
            if (nftStatus && (metadata.tokenURI || metadata.uri)) {
              fetchNFTMetadata(metadata.tokenURI || metadata.uri).then(nftMetadata => {
                if (nftMetadata && tokenMap[tokenId]) {
                  tokenMap[tokenId].name = nftMetadata.name || tokenMap[tokenId].name;
                  tokenMap[tokenId].description = nftMetadata.description || tokenMap[tokenId].description;
                  tokenMap[tokenId].imageUrl = nftMetadata.image || tokenMap[tokenId].imageUrl;
                  tokenMap[tokenId].attributes = nftMetadata.attributes;
                }
              }).catch(err => {
                console.error(`Error fetching metadata for token ${tokenId}:`, err);
              });
            }
          }
          
          // Add the amount as string to avoid precision issues
          tokenMap[tokenId].amount = (BigInt(tokenMap[tokenId].amount) + BigInt(token.amount)).toString();
        }
      }
    }
    
    // Convert the map to an array and format amounts
    const result = Object.values(tokenMap).map(token => ({
      ...token,
      formattedAmount: token.isNFT 
        ? token.amount // Don't format NFT amounts (they're usually just "1")
        : formatTokenAmount(token.amount, token.decimals)
    }));
    
    console.log("Enriched tokens with NFT status:", result);
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
 * Supports both ECDSA (default) and Schnorr signature types
 */
export const sendTransaction = async (
  fromAddress: string,
  toAddress: string,
  amountInAlph: number,
  signer: any
) => {
  try {
    if (!signer) {
      throw new Error("Signer object is invalid");
    }

    // Convert ALPH to nanoALPH
    const amountInNanoAlph = (amountInAlph * 10**18).toString();
    
    // Get the from group
    const addressInfo = await nodeProvider.addresses.getAddressesAddressGroup(fromAddress);
    const fromGroup = addressInfo.group;
    
    console.log("Building transaction for address:", fromAddress);
    
    // Get the public key from the signer if possible
    let fromPublicKey = '';
    let signatureType = undefined; // Default to undefined, will be auto-detected by API
    
    try {
      if (signer.account && signer.account.publicKey) {
        fromPublicKey = signer.account.publicKey;
        console.log("Using wallet's public key:", fromPublicKey);
        
        // Check if it's likely a Schnorr key (32 bytes = 64 hex chars)
        if (fromPublicKey.startsWith('0x')) {
          fromPublicKey = fromPublicKey.substring(2); // Remove 0x prefix if present
        }
        
        if (fromPublicKey.length === 64) {
          console.log("Detected Schnorr public key format (32 bytes)");
          signatureType = 'schnorr'; // Explicitly set signature type for Schnorr
        } else if (fromPublicKey.length === 66) {
          console.log("Detected ECDSA public key format (33 bytes)");
          signatureType = 'default'; // Explicitly set signature type for ECDSA
        } else {
          console.warn(`Unusual public key length: ${fromPublicKey.length} chars. Using as provided.`);
        }
      } else if (signer.publicKey) {
        fromPublicKey = signer.publicKey;
        console.log("Using signer's public key:", fromPublicKey);
        
        // Apply the same length check
        if (fromPublicKey.startsWith('0x')) {
          fromPublicKey = fromPublicKey.substring(2);
        }
        
        if (fromPublicKey.length === 64) {
          signatureType = 'schnorr';
        } else if (fromPublicKey.length === 66) {
          signatureType = 'default';
        }
      } else {
        console.warn("No public key available in signer, this may cause issues when building the transaction");
      }
    } catch (error) {
      console.warn("Error accessing public key:", error);
    }
    
    // Build the transaction request object based on available data
    const txBuildRequest: any = {
      destinations: [{
        address: toAddress,
        attoAlphAmount: amountInNanoAlph
      }]
    };
    
    // Only add fromPublicKey if we have it
    if (fromPublicKey) {
      txBuildRequest.fromPublicKey = fromPublicKey;
      
      // Add signature type if we could determine it
      if (signatureType) {
        txBuildRequest.sigType = signatureType;
      }
    }
    
    console.log("Transaction build request:", txBuildRequest);
    
    // Build unsigned transaction with the proper params
    const unsignedTx = await nodeProvider.transactions.postTransactionsBuild(txBuildRequest);
    
    console.log("Transaction built successfully:", unsignedTx);
    
    // Sign the transaction
    const signature = await signer.signTransactionWithSignature(unsignedTx);
    console.log("Transaction signed successfully");
    
    // Submit the transaction
    const result = await nodeProvider.transactions.postTransactionsSubmit({
      unsignedTx: unsignedTx.unsignedTx,
      signature: signature
    });
    
    console.log("Transaction submitted successfully:", result);
    return result;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

/**
 * Fetches balance history for an address
 * This is a simulated function since we don't have real historical data
 */
export const fetchBalanceHistory = async (address: string, days: number = 30) => {
  // In a real application, you would fetch this from an indexer or API
  // For now, we'll generate sample data
  try {
    // Attempt to get current balance
    const currentBalance = await getAddressBalance(address);
    
    // Generate historical data based on current balance
    const data = [];
    const now = new Date();
    let balance = currentBalance.balance * 0.7; // Start at 70% of current balance
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some randomness to simulate balance changes
      // More recent days should trend toward the current balance
      const volatility = i / days; // Higher volatility in the past
      const changePercent = (Math.random() - 0.45) * volatility * 0.1;
      balance = balance * (1 + changePercent);
      
      // Final day should be exact current balance
      if (i === 0) {
        balance = currentBalance.balance;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        balance: balance.toFixed(4)
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error generating balance history:', error);
    throw error;
  }
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
  fetchLatestTokenTransactions
};
