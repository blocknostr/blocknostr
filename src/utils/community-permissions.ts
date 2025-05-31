
import { MemberRole } from "@/api/types/community";

/**
 * Determines if a user has a specific role in a community
 */
export const hasRole = (
  userPubkey: string | null, 
  communityMembers: string[], 
  communityCreator: string,
  communityModerators: string[] = []
): MemberRole | null => {
  if (!userPubkey) return null;
  
  if (userPubkey === communityCreator) {
    return 'creator';
  }
  
  if (communityModerators?.includes(userPubkey)) {
    return 'moderator';
  }
  
  if (communityMembers.includes(userPubkey)) {
    return 'member';
  }
  
  return null;
};

/**
 * Checks if a user can perform actions based on their role and tenure
 */
export const canPerformAction = (
  action: 'create_proposal' | 'vote' | 'kick_propose' | 'invite' | 'moderate' | 'set_guidelines' | 'edit_metadata',
  userPubkey: string | null,
  communityMembers: string[],
  communityCreator: string,
  communityModerators: string[] = [],
  memberJoinTimes: Record<string, number> = {},
  minJoinTimeMs: number = 0 // Default: no waiting period
): boolean => {
  if (!userPubkey) return false;
  
  const role = hasRole(userPubkey, communityMembers, communityCreator, communityModerators);
  
  // Creator can do everything
  if (role === 'creator') return true;
  
  // Not a member
  if (!role) return false;
  
  // Moderator permissions
  if (role === 'moderator') {
    switch (action) {
      case 'create_proposal':
      case 'vote':
      case 'kick_propose':
      case 'invite':
      case 'moderate':
        return true;
      case 'set_guidelines':
      case 'edit_metadata':
        return false; // Only creator can edit these
      default:
        return false;
    }
  }
  
  // Regular member permissions
  if (role === 'member') {
    // Check tenure requirements if applicable
    if (minJoinTimeMs > 0 && userPubkey in memberJoinTimes) {
      const joinTime = memberJoinTimes[userPubkey];
      const now = Date.now();
      const membershipDuration = now - joinTime;
      
      if (membershipDuration < minJoinTimeMs) {
        return false; // Member hasn't been in the community long enough
      }
    }
    
    switch (action) {
      case 'create_proposal':
      case 'vote':
        return true;
      case 'kick_propose':
        return true; // Regular members can propose kicks, but with rate limits
      case 'invite':
        return true; // Anyone can invite
      case 'moderate':
      case 'set_guidelines':
      case 'edit_metadata':
        return false;
      default:
        return false;
    }
  }
  
  return false;
};

/**
 * Determines if throttling should prevent an action
 */
export const isThrottled = (
  action: 'create_proposal' | 'kick_propose',
  userPubkey: string,
  userActions: { timestamp: number, type: string }[],
  throttleSettings: { proposalsPerDay?: number, kicksPerWeek?: number } = {}
): boolean => {
  if (!userPubkey) return true;
  
  const now = Date.now();
  
  switch (action) {
    case 'create_proposal': {
      const proposalsPerDay = throttleSettings.proposalsPerDay || 5; // Default: 5 proposals per day
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      const recentProposals = userActions.filter(a => 
        a.type === 'create_proposal' && a.timestamp > oneDayAgo
      );
      
      return recentProposals.length >= proposalsPerDay;
    }
    
    case 'kick_propose': {
      const kicksPerWeek = throttleSettings.kicksPerWeek || 3; // Default: 3 kicks per week
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      const recentKicks = userActions.filter(a => 
        a.type === 'kick_propose' && a.timestamp > oneWeekAgo
      );
      
      return recentKicks.length >= kicksPerWeek;
    }
    
    default:
      return false;
  }
};

/**
 * Get proposal requirements based on community size
 */
export const getProposalRequirements = (
  memberCount: number,
  proposalCategory?: string
): { minQuorum: number, durationDays: number } => {
  // Set minimum quorum based on community size
  let minQuorum = 0.2; // Default: 20% 
  
  if (memberCount > 100) {
    minQuorum = 0.1; // Over 100 members: only need 10%
  } else if (memberCount > 25) {
    minQuorum = 0.15; // 25-100 members: need 15% 
  }
  
  // Governance proposals require higher quorum
  if (proposalCategory === 'governance') {
    minQuorum = Math.max(minQuorum, 0.25); // At least 25% for governance
  }
  
  // Set duration based on community size and type
  let durationDays = 7; // Default: one week
  
  if (proposalCategory === 'governance') {
    durationDays = 14; // Two weeks for governance
  } else if (proposalCategory === 'poll') {
    durationDays = 3; // Three days for polls
  }
  
  return { minQuorum, durationDays };
};

