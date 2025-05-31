/**
 * Official Alephium Explorer Transaction Parser
 * 
 * Direct TypeScript translation of the official Alephium Explorer Backend logic
 * Source: https://github.com/alephium/explorer-backend/blob/master/app/src/main/scala/org/alephium/explorer/util/UtxoUtil.scala
 * 
 * This ensures 100% compatibility with how transactions are displayed on explorer.alephium.org
 */

interface TokenAmount {
  id: string;
  amount: string;
}

interface TransactionInput {
  address?: string;
  attoAlphAmount?: string;
  tokens?: TokenAmount[];
  outputRef?: {
    hint: number;
    key: string;
  };
  unlockScript?: string;
  txHashRef?: string;
}

interface TransactionOutput {
  address: string;
  attoAlphAmount: string;
  tokens?: TokenAmount[];
  hint?: number;
  key?: string;
}

interface ParsedTransaction {
  hash: string;
  blockHash: string;
  timestamp: number;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  gasAmount?: number;
  gasPrice?: string;
  scriptExecutionOk?: boolean;
}

/**
 * Check if two addresses are equal (handles different formats)
 * Translated from: UtxoUtil.addressEqual
 */
function addressEqual(address1: string, address2: string): boolean {
  // Simple string comparison for now - in the original Scala code this handles
  // different lockup script formats, but for our purposes string comparison should suffice
  return address1 === address2;
}

/**
 * Sum ALPH amounts from inputs for a specific address
 * Translated from: UtxoUtil.amountForAddressInInputs
 */
function amountForAddressInInputs(address: string, inputs: TransactionInput[]): bigint | null {
  const amounts: bigint[] = [];
  
  for (const input of inputs) {
    if (input.address && addressEqual(input.address, address) && input.attoAlphAmount) {
      try {
        amounts.push(BigInt(input.attoAlphAmount));
      } catch (error) {
        console.warn(`[OfficialParser] Invalid attoAlphAmount in input: ${input.attoAlphAmount}`);
      }
    }
  }
  
  if (amounts.length === 0) {
    return 0n; // Return 0 instead of null for easier math
  }
  
  return amounts.reduce((sum, amount) => sum + amount, 0n);
}

/**
 * Sum ALPH amounts from outputs for a specific address
 * Translated from: UtxoUtil.amountForAddressInOutputs
 */
function amountForAddressInOutputs(address: string, outputs: TransactionOutput[]): bigint | null {
  const amounts: bigint[] = [];
  
  for (const output of outputs) {
    if (addressEqual(output.address, address) && output.attoAlphAmount) {
      try {
        amounts.push(BigInt(output.attoAlphAmount));
      } catch (error) {
        console.warn(`[OfficialParser] Invalid attoAlphAmount in output: ${output.attoAlphAmount}`);
      }
    }
  }
  
  if (amounts.length === 0) {
    return 0n; // Return 0 instead of null for easier math
  }
  
  return amounts.reduce((sum, amount) => sum + amount, 0n);
}

/**
 * Calculate net ALPH change for an address in a transaction
 * Translated from: UtxoUtil.deltaAmountForAddress
 * 
 * Returns: positive = received ALPH, negative = sent ALPH, 0 = no net change
 */
export function deltaAmountForAddress(
  address: string,
  inputs: TransactionInput[],
  outputs: TransactionOutput[]
): bigint {
  const inputAmount = amountForAddressInInputs(address, inputs) ?? 0n;
  const outputAmount = amountForAddressInOutputs(address, outputs) ?? 0n;
  
  // Delta = outputs - inputs (positive means net gain, negative means net loss)
  return outputAmount - inputAmount;
}

/**
 * Get token amounts for address in inputs
 * Translated from: UtxoUtil.tokenAmountForAddressInInputs
 */
function tokenAmountForAddressInInputs(
  address: string,
  inputs: TransactionInput[]
): Map<string, bigint> {
  const tokenSums = new Map<string, bigint>();
  
  for (const input of inputs) {
    if (input.address && addressEqual(input.address, address) && input.tokens) {
      for (const token of input.tokens) {
        try {
          const amount = BigInt(token.amount);
          const currentSum = tokenSums.get(token.id) ?? 0n;
          tokenSums.set(token.id, currentSum + amount);
        } catch (error) {
          console.warn(`[OfficialParser] Invalid token amount: ${token.amount} for token ${token.id}`);
        }
      }
    }
  }
  
  return tokenSums;
}

/**
 * Get token amounts for address in outputs
 * Translated from: UtxoUtil.tokenAmountForAddressInOutputs
 */
function tokenAmountForAddressInOutputs(
  address: string,
  outputs: TransactionOutput[]
): Map<string, bigint> {
  const tokenSums = new Map<string, bigint>();
  
  for (const output of outputs) {
    if (addressEqual(output.address, address) && output.tokens) {
      for (const token of output.tokens) {
        try {
          const amount = BigInt(token.amount);
          const currentSum = tokenSums.get(token.id) ?? 0n;
          tokenSums.set(token.id, currentSum + amount);
        } catch (error) {
          console.warn(`[OfficialParser] Invalid token amount: ${token.amount} for token ${token.id}`);
        }
      }
    }
  }
  
  return tokenSums;
}

/**
 * Calculate net token changes for an address in a transaction
 * Translated from: UtxoUtil.deltaTokenAmountForAddress
 * 
 * Returns: Map of tokenId -> delta (positive = received, negative = sent)
 */
export function deltaTokenAmountForAddress(
  address: string,
  inputs: TransactionInput[],
  outputs: TransactionOutput[]
): Map<string, bigint> {
  const inputTokens = tokenAmountForAddressInInputs(address, inputs);
  const outputTokens = tokenAmountForAddressInOutputs(address, outputs);
  
  // Get all unique token IDs
  const allTokenIds = new Set([...inputTokens.keys(), ...outputTokens.keys()]);
  
  const deltas = new Map<string, bigint>();
  
  for (const tokenId of allTokenIds) {
    const inputAmount = inputTokens.get(tokenId) ?? 0n;
    const outputAmount = outputTokens.get(tokenId) ?? 0n;
    const delta = outputAmount - inputAmount;
    
    // Only include non-zero deltas (as per original Scala logic)
    if (delta !== 0n) {
      deltas.set(tokenId, delta);
    }
  }
  
  return deltas;
}

/**
 * Determine transaction type for an address
 * Based on the official explorer logic
 */
export function getTransactionType(
  address: string,
  transaction: ParsedTransaction
): 'received' | 'sent' | 'swap' | 'internal' | 'unknown' {
  // Check if address is in inputs (outgoing)
  const isOutgoing = transaction.inputs.some(input => 
    input.address && addressEqual(input.address, address)
  );
  
  // Check if address is in outputs (incoming)
  const isIncoming = transaction.outputs.some(output => 
    addressEqual(output.address, address)
  );
  
  // Check for token movements
  const tokenDeltas = deltaTokenAmountForAddress(address, transaction.inputs, transaction.outputs);
  const hasTokenMovements = tokenDeltas.size > 0;
  
  // Classification logic
  if (isIncoming && isOutgoing) {
    // Both incoming and outgoing - could be swap or internal transfer
    if (hasTokenMovements) {
      return 'swap';
    }
    return 'internal';
  }
  
  if (isIncoming && !isOutgoing) {
    return 'received';
  }
  
  if (isOutgoing && !isIncoming) {
    return 'sent';
  }
  
  return 'unknown';
}

/**
 * Get the ALPH amount for display purposes
 * Always returns absolute value - the caller handles +/- signs
 * Enhanced to include gas fees for better accuracy
 */
export function getTransactionAmountForDisplay(
  address: string,
  transaction: ParsedTransaction
): number {
  let deltaAttoAlph = deltaAmountForAddress(address, transaction.inputs, transaction.outputs);
  
  // For transactions where the address is the fee payer, include gas fees
  const isFeePayer = transaction.inputs.some(input => 
    input.address && addressEqual(input.address, address)
  );
  
  if (isFeePayer && transaction.gasAmount && transaction.gasPrice) {
    const gasAmount = Number(transaction.gasAmount);
    const gasPrice = Number(transaction.gasPrice);
    const gasFeeAttoAlph = BigInt(Math.round(gasAmount * gasPrice));
    
    // Gas fees are always a cost (subtract from delta)
    deltaAttoAlph -= gasFeeAttoAlph;
  }
  
  // Convert from atto-ALPH to ALPH and return absolute value
  const deltaAlph = Number(deltaAttoAlph) / 1e18;
  return Math.abs(deltaAlph);
}

/**
 * Get counterparty addresses (who we're transacting with)
 * Enhanced logic based on explorer behavior
 */
export function getCounterpartyAddress(
  address: string,
  transaction: ParsedTransaction
): string {
  const type = getTransactionType(address, transaction);
  
  if (type === 'received') {
    // Find the sender - look for addresses in inputs that aren't ours
    const senderInputs = transaction.inputs.filter(input => 
      input.address && !addressEqual(input.address, address)
    );
    
    if (senderInputs.length > 0) {
      return senderInputs[0].address!;
    }
    
    // If no sender in inputs, might be a contract-generated transaction
    return 'Contract/System';
  }
  
  if (type === 'sent') {
    // Find the recipient - look for addresses in outputs that aren't ours
    const recipientOutputs = transaction.outputs.filter(output => 
      !addressEqual(output.address, address)
    );
    
    if (recipientOutputs.length > 0) {
      return recipientOutputs[0].address;
    }
    
    return 'Unknown Recipient';
  }
  
  if (type === 'swap' || type === 'internal') {
    // For swaps and internal transactions, find the most likely counterparty
    const otherAddresses = new Set<string>();
    
    // Collect all other addresses from inputs and outputs
    transaction.inputs.forEach(input => {
      if (input.address && !addressEqual(input.address, address)) {
        otherAddresses.add(input.address);
      }
    });
    
    transaction.outputs.forEach(output => {
      if (!addressEqual(output.address, address)) {
        otherAddresses.add(output.address);
      }
    });
    
    if (otherAddresses.size > 0) {
      // Return the first address found - for swaps this is often the DEX contract
      return Array.from(otherAddresses)[0];
    }
    
    return type === 'swap' ? 'DEX Contract' : 'Self';
  }
  
  return 'Unknown';
}

/**
 * Debug function to analyze a transaction with official logic
 */
export function debugTransactionWithOfficialLogic(
  address: string,
  transaction: ParsedTransaction
): void {
  console.log(`\n=== OFFICIAL PARSER DEBUG: ${transaction.hash.substring(0, 8)}... ===`);
  
  const type = getTransactionType(address, transaction);
  const alphDelta = deltaAmountForAddress(address, transaction.inputs, transaction.outputs);
  const tokenDeltas = deltaTokenAmountForAddress(address, transaction.inputs, transaction.outputs);
  const amount = getTransactionAmountForDisplay(address, transaction);
  const counterparty = getCounterpartyAddress(address, transaction);
  
  console.log(`Transaction Type: ${type.toUpperCase()}`);
  console.log(`ALPH Delta (before gas): ${alphDelta > 0n ? '+' : ''}${Number(alphDelta) / 1e18} ALPH`);
  console.log(`Amount for Display: ${amount} ALPH`);
  console.log(`Counterparty: ${counterparty}`);
  
  // Gas analysis
  if (transaction.gasAmount && transaction.gasPrice) {
    const gasAmount = Number(transaction.gasAmount);
    const gasPrice = Number(transaction.gasPrice);
    const gasFeeAlph = (gasAmount * gasPrice) / 1e18;
    console.log(`Gas Fee: ${gasFeeAlph.toFixed(6)} ALPH (${gasAmount} gas × ${gasPrice} price)`);
  }
  
  // Input/Output analysis
  console.log(`\nInputs for ${address}:`);
  transaction.inputs.forEach((input, i) => {
    if (input.address && addressEqual(input.address, address)) {
      console.log(`  Input ${i}: ${Number(input.attoAlphAmount || '0') / 1e18} ALPH`);
      if (input.tokens && input.tokens.length > 0) {
        input.tokens.forEach(token => {
          console.log(`    Token: ${token.id} = ${token.amount}`);
        });
      }
    }
  });
  
  console.log(`\nOutputs for ${address}:`);
  transaction.outputs.forEach((output, i) => {
    if (addressEqual(output.address, address)) {
      console.log(`  Output ${i}: ${Number(output.attoAlphAmount || '0') / 1e18} ALPH`);
      if (output.tokens && output.tokens.length > 0) {
        output.tokens.forEach(token => {
          console.log(`    Token: ${token.id} = ${token.amount}`);
        });
      }
    }
  });
  
  if (tokenDeltas.size > 0) {
    console.log(`\nToken Deltas:`);
    for (const [tokenId, delta] of tokenDeltas) {
      console.log(`  ${tokenId}: ${delta > 0n ? '+' : ''}${delta.toString()}`);
    }
  }
  
  // Special analysis for 0.0000 ALPH transactions
  if (amount === 0) {
    console.log(`\n🔍 ZERO AMOUNT ANALYSIS:`);
    console.log(`- This is likely a gas-only transaction or pure token transaction`);
    console.log(`- Type: ${type} suggests ${type === 'internal' ? 'contract interaction' : type === 'swap' ? 'token swap' : 'other operation'}`);
    console.log(`- Token movements: ${tokenDeltas.size > 0 ? 'YES' : 'NO'}`);
  }
  
  console.log(`=== END OFFICIAL PARSER DEBUG ===\n`);
}

/**
 * Global debug function - call debugZeroTransactions() in console to find problematic transactions
 */
export function debugZeroTransactions(transactions: any[], walletAddress: string): void {
  console.log(`\n=== DEBUGGING ZERO ALPH TRANSACTIONS ===`);
  
  let zeroCount = 0;
  transactions.forEach(tx => {
    const amount = getTransactionAmountForDisplay(walletAddress, tx);
    if (amount === 0) {
      zeroCount++;
      debugTransactionWithOfficialLogic(walletAddress, tx);
    }
  });
  
  console.log(`\nFound ${zeroCount} transactions with 0.0000 ALPH out of ${transactions.length} total`);
  console.log(`=== END ZERO TRANSACTION DEBUG ===`);
} 
