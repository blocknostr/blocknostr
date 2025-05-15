
import { ContractBuildJson, SignerProvider, BuildContractTxResult, BuildScriptTxResult } from '@alephium/web3';
import { toast } from 'sonner';

export interface TxResult {
  txId: string;
  contractAddress?: string;
}

/**
 * Loads the contract bytecode from the given contract name
 */
export async function getContractBytecode(contractName: string): Promise<string> {
  try {
    // In a production environment, this would load from a compiled contract JSON
    // For now, we'll return a mock bytecode for development purposes
    return '0123456789abcdef0123456789abcdef0123456789abcdef';
  } catch (error) {
    console.error(`Error loading ${contractName} bytecode:`, error);
    throw new Error(`Failed to load contract bytecode for ${contractName}`);
  }
}

/**
 * Executes a transaction and subscribes to its status, showing toast notifications
 */
export async function executeAndSubscribe(
  signer: SignerProvider,
  tx: BuildContractTxResult | BuildScriptTxResult,
  loadingMessage: string,
  successMessage: string,
  errorMessage: string
): Promise<TxResult | undefined> {
  // Show loading toast
  const toastId = toast.loading(loadingMessage);

  try {
    // Submit the transaction
    const { txId, signedTx } = await signer.signAndSubmitTransaction({ unsignedTx: tx.unsignedTx });

    // Extract contract address from result if present (for contract deployments)
    const contractAddress = 'contractAddress' in tx ? tx.contractAddress : undefined;

    // Subscribe to transaction status
    const result = await waitForConfirmation(signer, txId);
    
    // Show success toast
    toast.success(successMessage, { id: toastId });
    
    return {
      txId,
      contractAddress
    };
  } catch (error) {
    console.error('Transaction error:', error);
    toast.error(errorMessage, { 
      id: toastId, 
      description: error instanceof Error ? error.message : 'Unknown error' 
    });
    return undefined;
  }
}

/**
 * Waits for transaction confirmation
 */
async function waitForConfirmation(signer: SignerProvider, txId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const checkInterval = 2000; // 2 seconds
    const maxAttempts = 30; // 1 minute total
    let attempts = 0;
    
    const checkTx = async () => {
      try {
        const status = await signer.getTransactionStatus({ txId });
        
        if (status.type === 'Confirmed') {
          resolve(true);
        } else if (status.type === 'MemPooled') {
          // Still waiting
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkTx, checkInterval);
          } else {
            resolve(false); // Timed out, but not failed
          }
        } else {
          reject(new Error(`Transaction failed with status: ${status.type}`));
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
        reject(error);
      }
    };
    
    // Start checking
    setTimeout(checkTx, checkInterval);
  });
}
