
// NIP-72 compliant DAO/Community types
export interface DAO {
  id: string;            // Event ID of the community definition event
  name: string;          // Community name
  description: string;   // Community description
  image: string;         // Community image URL
  creator: string;       // Pubkey of the community creator
  createdAt: number;     // Timestamp of community creation
  members: string[];     // List of member pubkeys
  moderators: string[];  // List of moderator pubkeys (NIP-72)
  guidelines?: string;   // Community guidelines (optional)
  isPrivate?: boolean;   // Whether the community is private (invitation only)
  treasury: {
    balance: number;
    tokenSymbol: string;
  };
  proposals: number;     // Total number of proposals
  activeProposals: number; // Number of active proposals
  tags: string[];       // Community tags
}

export interface DAOProposal {
  id: string;           // Event ID of the proposal
  daoId: string;        // Reference to community
  title: string;        // Proposal title
  description: string;  // Proposal description
  options: string[];    // Voting options
  createdAt: number;    // Timestamp of proposal creation
  endsAt: number;       // Timestamp when voting ends
  creator: string;      // Pubkey of the proposal creator
  author?: string;      // Alias for creator (for compatibility)
  votes: Record<string, number>; // Mapping of pubkey to option index
  status: "active" | "passed" | "rejected" | "canceled";
  closesAt?: number;    // Alias for endsAt (for compatibility)
}

export interface DAOMember {
  pubkey: string;
  joinedAt: number;
  role: 'creator' | 'moderator' | 'member';
}

export interface DAOInvite {
  id: string;
  daoId: string;
  creatorPubkey: string;
  createdAt: number;
  expiresAt?: number;
  maxUses?: number;
  usedCount: number;
}
