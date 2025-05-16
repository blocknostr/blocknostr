
export interface SavedWallet {
  address: string;
  label: string;
  addedAt: number;
  lastUsed?: number;
}

export interface WalletList {
  wallets: SavedWallet[];
  activeWalletIndex: number;
}
