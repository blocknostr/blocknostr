
export interface SavedWallet {
  address: string;
  label: string;
  dateAdded: number;
}

export type WalletType = "Bitcoin" | "Alephium" | "Ergo";

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

