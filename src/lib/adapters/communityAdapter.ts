// Community Type Adapters
// Provides seamless conversion between DAO and Community types for backward compatibility

import type { DAO, DAOProposal } from '@/api/types/dao';
import type { ReduxDAO, ReduxDAOProposal } from '@/store/types';
import type { 
  Community, 
  CommunityProposal, 
  ReduxCommunity, 
  ReduxCommunityProposal,
  CommunityAdapter 
} from '@/api/types/community';

export class CommunityTypeAdapter implements CommunityAdapter {
  // Convert DAO to Community
  fromDAO = (dao: DAO): Community => ({
    id: dao.id,
    name: dao.name,
    description: dao.description,
    image: dao.image,
    creator: dao.creator,
    createdAt: dao.createdAt,
    members: dao.members,
    moderators: dao.moderators,
    bannedMembers: dao.bannedMembers,
    guidelines: dao.guidelines,
    isPrivate: dao.isPrivate,
    treasury: dao.treasury,
    proposalCount: dao.proposals,
    activeProposalCount: dao.activeProposals,
    tags: dao.tags,
  });

  // Convert Community to DAO
  toDAO = (community: Community): DAO => ({
    id: community.id,
    name: community.name,
    description: community.description,
    image: community.image,
    creator: community.creator,
    createdAt: community.createdAt,
    members: community.members,
    moderators: community.moderators,
    bannedMembers: community.bannedMembers,
    guidelines: community.guidelines,
    isPrivate: community.isPrivate,
    treasury: community.treasury,
    proposals: community.proposalCount,
    activeProposals: community.activeProposalCount,
    tags: community.tags,
  });

  // Convert DAO Proposal to Community Proposal
  fromDAOProposal = (proposal: DAOProposal): CommunityProposal => ({
    id: proposal.id,
    communityId: proposal.daoId,
    title: proposal.title,
    description: proposal.description,
    options: proposal.options,
    createdAt: proposal.createdAt,
    endsAt: proposal.endsAt,
    creator: proposal.creator,
    votes: proposal.votes,
    status: proposal.status,
  });

  // Convert Community Proposal to DAO Proposal
  toDAOProposal = (proposal: CommunityProposal): DAOProposal => ({
    id: proposal.id,
    daoId: proposal.communityId,
    title: proposal.title,
    description: proposal.description,
    options: proposal.options,
    createdAt: proposal.createdAt,
    endsAt: proposal.endsAt,
    creator: proposal.creator,
    votes: proposal.votes,
    status: proposal.status,
  });

  // Convert Redux DAO to Redux Community
  fromReduxDAO = (dao: ReduxDAO): ReduxCommunity => ({
    id: dao.id,
    name: dao.name,
    description: dao.description,
    image: dao.image,
    creator: dao.creator,
    createdAt: dao.createdAt,
    members: dao.members,
    moderators: dao.moderators,
    bannedMembers: dao.bannedMembers,
    guidelines: dao.guidelines,
    isPrivate: dao.isPrivate,
    treasury: dao.treasury,
    proposalCount: dao.proposals,
    activeProposalCount: dao.activeProposals,
    tags: dao.tags,
    _meta: dao._meta,
  });

  // Convert Redux Community to Redux DAO
  toReduxDAO = (community: ReduxCommunity): ReduxDAO => ({
    id: community.id,
    name: community.name,
    description: community.description,
    image: community.image,
    creator: community.creator,
    createdAt: community.createdAt,
    members: community.members,
    moderators: community.moderators,
    bannedMembers: community.bannedMembers,
    guidelines: community.guidelines,
    isPrivate: community.isPrivate,
    treasury: community.treasury,
    proposals: community.proposalCount,
    activeProposals: community.activeProposalCount,
    tags: community.tags,
    _meta: community._meta,
  });

  // Convert Redux DAO Proposal to Redux Community Proposal
  fromReduxDAOProposal = (proposal: ReduxDAOProposal): ReduxCommunityProposal => ({
    id: proposal.id,
    communityId: proposal.daoId,
    title: proposal.title,
    description: proposal.description,
    options: proposal.options,
    createdAt: proposal.createdAt,
    endsAt: proposal.endsAt,
    creator: proposal.creator,
    votes: proposal.votes,
    status: proposal.status,
    _meta: proposal._meta,
  });

  // Convert Redux Community Proposal to Redux DAO Proposal
  toReduxDAOProposal = (proposal: ReduxCommunityProposal): ReduxDAOProposal => ({
    id: proposal.id,
    daoId: proposal.communityId,
    title: proposal.title,
    description: proposal.description,
    options: proposal.options,
    createdAt: proposal.createdAt,
    endsAt: proposal.endsAt,
    creator: proposal.creator,
    votes: proposal.votes,
    status: proposal.status,
    _meta: proposal._meta,
  });

  // Batch conversion utilities
  fromDAOArray = (daos: DAO[]): Community[] => daos.map(this.fromDAO);
  toDAOArray = (communities: Community[]): DAO[] => communities.map(this.toDAO);
  
  fromDAOProposalArray = (proposals: DAOProposal[]): CommunityProposal[] => 
    proposals.map(this.fromDAOProposal);
  toDAOProposalArray = (proposals: CommunityProposal[]): DAOProposal[] => 
    proposals.map(this.toDAOProposal);

  fromReduxDAOArray = (daos: ReduxDAO[]): ReduxCommunity[] => 
    daos.map(this.fromReduxDAO);
  toReduxDAOArray = (communities: ReduxCommunity[]): ReduxDAO[] => 
    communities.map(this.toReduxDAO);
}

// Singleton instance for global use
export const communityAdapter = new CommunityTypeAdapter();

// Utility functions for easy access
export const convertDAOToCommunity = (dao: DAO): Community => 
  communityAdapter.fromDAO(dao);

export const convertCommunityToDAO = (community: Community): DAO => 
  communityAdapter.toDAO(community);

export const convertDAOProposalToCommunityProposal = (proposal: DAOProposal): CommunityProposal => 
  communityAdapter.fromDAOProposal(proposal);

export const convertCommunityProposalToDAOProposal = (proposal: CommunityProposal): DAOProposal => 
  communityAdapter.toDAOProposal(proposal);

// Type guards for runtime type checking
export const isDAO = (obj: any): obj is DAO => {
  return obj && typeof obj === 'object' && 
         'id' in obj && 'name' in obj && 'proposals' in obj;
};

export const isCommunity = (obj: any): obj is Community => {
  return obj && typeof obj === 'object' && 
         'id' in obj && 'name' in obj && 'proposalCount' in obj;
};

export const isDAOProposal = (obj: any): obj is DAOProposal => {
  return obj && typeof obj === 'object' && 
         'id' in obj && 'daoId' in obj && 'title' in obj;
};

export const isCommunityProposal = (obj: any): obj is CommunityProposal => {
  return obj && typeof obj === 'object' && 
         'id' in obj && 'communityId' in obj && 'title' in obj;
}; 
