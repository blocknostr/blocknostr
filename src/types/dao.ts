
export interface DAO {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  treasury: {
    balance: number;
    tokenSymbol: string;
  };
  proposals: number;
  activeProposals: number;
  tags: string[];
}

export interface DAOProposal {
  id: string;
  daoId: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  creator: string;
  votes: Record<string, number>;
  status: "active" | "passed" | "rejected" | "canceled";
}
