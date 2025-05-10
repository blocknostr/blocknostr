
export interface AlephiumWalletState {
  connected: boolean;
  address: string | null;
  balance: string | null;
  network: string | null;
  connecting: boolean;
  error: string | null;
}

export interface Transaction {
  hash: string;
  amount: string;
  timestamp: number;
  from: string;
  to: string;
  status: 'confirmed' | 'pending' | 'failed';
  type: 'send' | 'receive' | 'contract';
}

export interface WalletEvent {
  type: 'connect' | 'disconnect' | 'accountsChanged' | 'networkChanged' | 'error';
  data?: any;
}

// Add typings for the Alephium extension window object
declare global {
  interface Window {
    alephium?: {
      enable(): Promise<string[]>;
      isConnected(): Promise<boolean>;
      address: {
        activeAddress: string | null;
        sign(message: string): Promise<string>;
      };
      transactions: {
        send(params: {
          from: string;
          to: string;
          amount: string;
        }): Promise<{ txId: string }>;
      };
      getBalance(address: string): Promise<{ balance: string }>;
      subscribeBalanceChange(callback: (balance: string) => void): () => void;
      getNetwork(): Promise<{ networkId: number, nodeUrl: string }>;
    };
  }
}
