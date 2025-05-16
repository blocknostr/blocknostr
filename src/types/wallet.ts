
export interface SavedWallet {
  address: string;
  label: string;
  dateAdded: number;
}

export type WalletType = "Bitcoin" | "Alephium" | "Ergo";

// Extended token interface with wallet addresses
export interface EnrichedTokenWithWallets {
  id: string;
  name: string; // Removed optional marker to match EnrichedToken
  symbol: string;
  decimals: number;
  amount: string;
  formattedAmount: string;
  logoURI?: string;
  isNFT: boolean;
  usdValue?: number;
  walletAddresses?: string[];
}
