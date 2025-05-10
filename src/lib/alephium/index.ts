
import AlephiumWalletManager from './wallet';

// Create and export singleton instance
const alephiumService = new AlephiumWalletManager();

export { alephiumService };
export * from './types';
