
// Alephium network IDs mapped to names
export const NETWORKS = {
  0: 'mainnet',
  1: 'testnet',
  2: 'devnet'
};

// Storage keys
export const STORAGE_KEYS = {
  CONNECTED_ADDRESS: 'alephium_address',
  PREFERRED_NETWORK: 'alephium_network'
};

// Event types
export const WALLET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ACCOUNTS_CHANGED: 'accountsChanged',
  NETWORK_CHANGED: 'networkChanged',
  ERROR: 'error'
};

// Error messages
export const ERROR_MESSAGES = {
  NO_EXTENSION: 'Alephium wallet extension not found. Please install it first.',
  CONNECTION_FAILED: 'Failed to connect to wallet',
  TRANSACTION_FAILED: 'Transaction failed',
  SIGN_FAILED: 'Failed to sign message'
};
