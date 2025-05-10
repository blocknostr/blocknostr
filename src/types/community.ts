
export interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
}

export interface Proposal {
  id: string;
  communityId: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  creator: string;
  votes: Record<string, number>;
}

export interface KickProposal {
  id: string;
  communityId: string;
  targetMember: string;
  votes: string[];
  createdAt: number;
}
