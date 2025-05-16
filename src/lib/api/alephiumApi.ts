import { NodeProvider } from '@alephium/web3';
import { getTokenMetadata, fetchTokenList, getFallbackTokenData, formatTokenAmount } from './tokenMetadata';

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
      }]
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
}

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
            
            tokenMap[tokenId] = {
              id: tokenId,
              amount: "0",
              name: metadata.name,
              nameOnChain: metadata.nameOnChain,
              symbol: metadata.symbol,
              symbolOnChain: metadata.symbolOnChain,
              decimals: metadata.decimals,
              logoURI: metadata.logoURI,
              description: metadata.description,
              formattedAmount: ''
            };
          }
          
          // Add the amount as string to avoid precision issues
          tokenMap[tokenId].amount = (BigInt(tokenMap[tokenId].amount) + BigInt(token.amount)).toString();
        }
      }
    }
    
    // Convert the map to an array and format amounts
    const result = Object.values(tokenMap).map(token => ({
      ...token,
      formattedAmount: formatTokenAmount(token.amount, token.decimals)
    }));
    
    console.log("Enriched tokens with proper decimal formatting:", result);
    return result;
  } catch (error) {
    console.error('Error fetching address tokens:', error);
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

export default {
  nodeProvider,
  getAddressBalance,
  getAddressTransactions,
  getAddressUtxos,
  getAddressTokens,
  sendTransaction
};
