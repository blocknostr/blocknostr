export interface SavedWallet {
  address: string;
  label: string;
  dateAdded: number;
}

export type WalletType = "Bitcoin" | "Alephium" | "Ethereum" | "Solana";

// Wallet entry for tracking token ownership across multiple wallets
export interface TokenWallet {
  address: string;
  amount: string;
}

// Extended token interface with wallet tracking
export interface EnrichedTokenWithWallets {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  amount: string;
  formattedAmount: string;
  logoURI?: string;
  isNFT: boolean;
  usdValue?: number;
  wallets: TokenWallet[]; // Replace walletAddresses with structured wallets array
  priceSource?: 'market' | 'estimate'; // Add the missing priceSource property
}

// Bitcoin specific interfaces
export interface BTCTransaction {
  txid: string;
  confirmations: number;
  time: number;
  amount: number;
  type: 'sent' | 'received';
  fee?: number;
  block_height?: number;
  inputs?: Array<{address: string; value: number}>;
  outputs?: Array<{address: string; value: number}>;
}

export interface BTCBalance {
  confirmedBalance: number;
  unconfirmedBalance: number;
  totalBalance: number;
}

export interface BTCAddressValidation {
  isValid: boolean;
  network: 'mainnet' | 'testnet' | null;
  type: 'p2pkh' | 'p2sh' | 'bech32' | null;
}

// Ethereum specific interfaces
export interface ETHToken {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  tokenAddress: string;
  logo?: string;
}

export interface ETHTransaction {
  hash: string;
  timeStamp: number;
  value: string;
  gasPrice: string;
  from: string;
  to: string;
  isError: string;
}

// Solana specific interfaces
export interface SOLToken {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  mint: string;
  logo?: string;
}

export interface SOLTransaction {
  signature: string;
  blockTime: number;
  slot: number;
  fee: number;
  amount: number;
  type: 'sent' | 'received';
}

// Address format validation helpers
export interface AddressValidator {
  isValidAddress: (address: string) => boolean;
  formatAddress: (address: string) => string;
  generateDemoAddress: () => string;
  network: string;
}
