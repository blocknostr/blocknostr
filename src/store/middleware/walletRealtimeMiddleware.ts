import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../index';

/**
 * Middleware for handling wallet real-time updates
 */
const walletRealtimeMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);
  
  // Handle wallet balance updates
  if (action.type === 'walletManagement/updateWalletBalance') {
    const { walletAddress, balance } = action.payload;
    
    // Emit balance updates
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('wallet-balance-updated', {
        detail: { walletAddress, balance },
      }));
    }
  }
  
  // Handle new transactions
  if (action.type === 'walletTransactions/addRecentTransaction') {
    const transactionId = action.payload;
    const state = store.getState();
    const transaction = state.walletTransactions.entities[transactionId];
    
    if (transaction) {
      // Emit new transaction notifications
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('wallet-transaction-received', {
          detail: { transaction },
        }));
      }
      
      // Show browser notification for incoming transactions
      if (transaction.type === 'received' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New Transaction Received', {
          body: `Received ${transaction.amount} tokens`,
          icon: '/icons/wallet.png',
        });
      }
    }
  }
  
  // Handle connection status changes
  if (action.type === 'walletConnections/setActiveConnection') {
    const connectionId = action.payload;
    const state = store.getState();
    const connection = connectionId ? state.walletConnections.entities[connectionId] : null;
    
    // Emit connection changes
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('wallet-connection-changed', {
        detail: { connection },
      }));
    }
  }
  
  return result;
};

export default walletRealtimeMiddleware; 
