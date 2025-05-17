
/**
 * DAO related type definitions
 */

export interface DAO {
  id: string;
  name: string;
  description: string;
  image?: string;
  creator: string;
  createdAt: number;
  members: string[];
  moderators: string[];
  treasury: {
    balance: number;
    tokenSymbol: string;
  };
  proposals: number;
  activeProposals: number;
  tags: string[];
  isPrivate?: boolean;
  guidelines?: string;
}

export interface DAOProposal {
  id: string;
  daoId: string;
  creator: string;
  createdAt: number;
  title: string;
  description: string;
  options: string[];
  votes: Record<string, number>; // pubkey -> option index
  status: 'active' | 'completed' | 'cancelled';
  endTime?: number;
}

export interface DAOVote {
  proposalId: string;
  voter: string;
  optionIndex: number;
  timestamp: number;
}

export interface DAOMember {
  pubkey: string;
  role: 'member' | 'moderator' | 'creator';
  joinedAt: number;
  profile?: {
    displayName?: string;
    name?: string;
    nip05?: string;
    picture?: string;
  };
}
