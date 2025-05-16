
import { NodeProvider } from '@alephium/web3';

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
 */
export const getAddressTransactions = async (address: string, limit = 20) => {
  try {
    const result = await nodeProvider.addresses.getAddressesAddressTransactions(address, { limit });
    return result;
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
    const utxos = await getAddressUtxos(address);
    
    // Extract token information from UTXOs
    const tokenMap: Record<string, { id: string, amount: number, name?: string, symbol?: string }> = {};
    
    for (const utxo of utxos) {
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
