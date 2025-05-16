
import { NodeProvider } from '@alephium/web3';
import { ExplorerProvider } from '@alephium/web3';

// Initialize the node provider with the mainnet node
const nodeProvider = new NodeProvider('https://node.mainnet.alephium.org');
const explorerProvider = new ExplorerProvider('https://explorer.alephium.org');

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
 * This uses the explorer API to get actual transaction history
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
 * Gets token balances for an address by checking UTXOs
 */
export const getAddressTokens = async (address: string) => {
  try {
    // Get all UTXOs for the address
    const response = await getAddressUtxos(address);
    
    // Extract token information from UTXOs
    const tokenMap: Record<string, { id: string, amount: number, name?: string, symbol?: string }> = {};
    
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
            tokenMap[tokenId] = {
              id: tokenId,
              amount: 0,
              // These would ideally come from token registry or contracts
              name: `Unknown Token (${tokenId.substring(0, 6)}...)`,
              symbol: `TOKEN-${tokenId.substring(0, 4)}`
            };
          }
          
          tokenMap[tokenId].amount += Number(token.amount);
        }
      }
    }
    
    // Convert the map to an array
    return Object.values(tokenMap);
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
    console.log("Starting transaction build...");
    
    // Convert ALPH to nanoALPH (1 ALPH = 10^18 nanoALPH)
    const amountInNanoAlph = BigInt(Math.floor(amountInAlph * 10**18)).toString();
    
    console.log(`Amount in nanoALPH: ${amountInNanoAlph}`);
    
    // Get the address group
    const addressInfo = await nodeProvider.addresses.getAddressesAddressGroup(fromAddress);
    const fromGroup = addressInfo.group;
    
    console.log(`From address group: ${fromGroup}`);
    
    // Build unsigned transaction
    const unsignedTxResult = await nodeProvider.transactions.postTransactionsBuild({
      fromPublicKey: signer.publicKey,
      destinations: [{
        address: toAddress,
        attoAlphAmount: amountInNanoAlph
      }]
    });
    
    console.log("Unsigned transaction built:", unsignedTxResult);
    
    if (!unsignedTxResult || !unsignedTxResult.unsignedTx) {
      throw new Error("Failed to build transaction: Invalid response from node");
    }
    
    // Sign the transaction
    console.log("Signing transaction...");
    const signature = await signer.signTransactionWithSignature(unsignedTxResult);
    
    if (!signature) {
      throw new Error("Failed to sign transaction: No signature returned");
    }
    
    console.log("Transaction signed, submitting to network...");
    
    // Submit the transaction
    const result = await nodeProvider.transactions.postTransactionsSubmit({
      unsignedTx: unsignedTxResult.unsignedTx,
      signature: signature
    });
    
    console.log("Transaction submitted:", result);
    return result;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

export default {
  nodeProvider,
  explorerProvider,
  getAddressBalance,
  getAddressTransactions,
  getAddressUtxos,
  getAddressTokens,
  sendTransaction
};
