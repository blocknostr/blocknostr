import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../index';

/**
 * Middleware for handling DAO real-time updates
 */
const daoRealtimeMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);
  
  // Handle real-time proposal updates
  if (action.type === 'daoProposals/updateVoteCounts') {
    const { proposalId, votes } = action.payload;
    
    // Emit proposal vote updates
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('dao-proposal-updated', {
        detail: { proposalId, votes },
      }));
    }
  }
  
  // Handle DAO membership changes
  if (action.type?.includes('joinDAO/fulfilled') || action.type?.includes('leaveDAO/fulfilled')) {
    const state = store.getState();
    
    // Update DAO metrics
    store.dispatch({
      type: 'daoCommunities/updateMetrics',
      payload: {
        userMemberships: state.daoCommunities.myDAOs?.ids.length || 0,
        lastUpdate: Date.now(),
      },
    });
    
    // Emit membership changes
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('dao-membership-changed', {
        detail: action.payload,
      }));
    }
  }
  
  // Handle proposal status changes
  if (action.type === 'daoProposals/updateProposalStatus') {
    const { proposalId, status } = action.payload;
    
    // Emit proposal status changes
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('dao-proposal-status-changed', {
        detail: { proposalId, status },
      }));
    }
  }
  
  return result;
};

export default daoRealtimeMiddleware; 
