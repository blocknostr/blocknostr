
export interface SavedWallet {
  address: string;
  label: string;
  dateAdded: number;
}

export type WalletType = "Bitcoin" | "Alephium" | "Ergo";
