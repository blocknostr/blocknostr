import { useState, useEffect } from 'react';
import { daoService } from '@/lib/dao/dao-service';
import { nostrService } from '@/lib/nostr';
import { DAO } from '@/api/types/dao';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectDAOById, fetchDAOById } from '@/store/slices/daoCommunitiesSlice';

// Convert DAO to Community format for compatibility
interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
  isPrivate?: boolean;
  moderators?: string[];
  guidelines?: string;
  tags?: string[];
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  creator: string;
  votes: Record<string, number>;
  status: "active" | "passed" | "rejected" | "canceled";
}

export function useCommunity(id: string | undefined) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [kickProposals, setKickProposals] = useState<any[]>([]);
  const [inviteLinks, setInviteLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserPubkey = nostrService.publicKey;
  const dispatch = useAppDispatch();
  
  // Try to get DAO from Redux store first
  const reduxDAO = useAppSelector(state => id ? selectDAOById(state.daoCommunities, id) : null);

  // Convert DAO to Community format
  const convertDAOToCommunity = (dao: DAO): Community => {
    return {
      id: dao.id,
      name: dao.name,
      description: dao.description,
      image: dao.image || '',
      creator: dao.creator,
      createdAt: dao.createdAt,
      members: dao.members,
      uniqueId: dao.id, // Use the same ID as unique ID
      isPrivate: dao.isPrivate,
      moderators: dao.moderators,
      guidelines: dao.guidelines,
      tags: dao.tags
    };
  };

  // Fetch community data
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        
        let dao: DAO | null = null;
        
        // First try to get from Redux store (instant if available)
        if (reduxDAO) {
          console.log('[useCommunity] Using DAO from Redux store:', reduxDAO.id);
          dao = reduxDAO;
          
          // Convert and set community data immediately
          const communityData = convertDAOToCommunity(dao);
          setCommunity(communityData);
          setLoading(false); // Set loading to false immediately for cached data
          
          // Fetch proposals and kick proposals in parallel (non-blocking)
          Promise.all([
            daoService.getDAOProposals(id).catch(() => []),
            daoService.getDAOKickProposals(id).catch(() => [])
          ]).then(([daoProposals, daoKickProposals]) => {
            setProposals(daoProposals);
            setKickProposals(daoKickProposals);
          });
          
          return; // Exit early since we have the data
        }
        
        // If not in Redux store, fetch from network
        console.log('[useCommunity] Fetching DAO from network:', id);
        
        // Try Redux fetch first (with timeout)
        const reduxFetchPromise = dispatch(fetchDAOById(id)).then(result => {
          if (fetchDAOById.fulfilled.match(result)) {
            return result.payload;
          }
          return null;
        }).catch(() => null);
        
        // Fallback to direct DAO service (with timeout)
        const serviceFetchPromise = daoService.getDAOById(id).catch(() => null);
        
        // Race both methods and use whichever responds first
        dao = await Promise.race([reduxFetchPromise, serviceFetchPromise]);
        
        // If race didn't work, try both sequentially with shorter timeouts
        if (!dao) {
          console.log('[useCommunity] Race failed, trying sequential fetch');
          try {
            dao = await Promise.race([
              reduxFetchPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Redux timeout')), 3000))
            ]);
          } catch {
            dao = await Promise.race([
              serviceFetchPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Service timeout')), 3000))
            ]);
          }
        }
        
        if (dao) {
          const communityData = convertDAOToCommunity(dao);
          setCommunity(communityData);
          setLoading(false); // Set loading to false as soon as we have community data
          
          // Fetch proposals and kick proposals in parallel (non-blocking)
          Promise.all([
            daoService.getDAOProposals(id).catch(error => {
              console.log('[useCommunity] No proposals found:', error.message);
              return [];
            }),
            daoService.getDAOKickProposals(id).catch(error => {
              console.log('[useCommunity] No kick proposals found:', error.message);
              return [];
            })
          ]).then(([daoProposals, daoKickProposals]) => {
            setProposals(daoProposals);
            setKickProposals(daoKickProposals);
          });
        } else {
          console.log('[useCommunity] DAO not found:', id);
          setCommunity(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching community:', error);
        setCommunity(null);
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [id, reduxDAO, dispatch]);

  // Computed properties
  const isMember = currentUserPubkey ? community?.members.includes(currentUserPubkey) || false : false;
  const isCreator = currentUserPubkey ? community?.creator === currentUserPubkey : false;
  const isModerator = currentUserPubkey ? community?.moderators?.includes(currentUserPubkey) || false : false;
  const isCreatorOnlyMember = community?.members.length === 1 && isCreator;
  const userRole = isCreator ? 'creator' : isModerator ? 'moderator' : isMember ? 'member' : 'visitor';
  
  // Permissions
  const canCreateProposal = isMember;
  const canKickPropose = isMember && !isCreatorOnlyMember;
  const canModerate = isCreator || isModerator;
  const canSetGuidelines = isCreator;

  // Community actions
  const handleJoinCommunity = async () => {
    if (!id || !currentUserPubkey) return false;
    
    try {
      const success = await daoService.joinDAO(id);
      if (success && community) {
        // Update local state
        setCommunity({
          ...community,
          members: [...community.members, currentUserPubkey]
        });
      }
      return success;
    } catch (error) {
      console.error('Error joining community:', error);
      return false;
    }
  };

  const handleLeaveCommunity = async () => {
    if (!id || !currentUserPubkey) return false;
    
    try {
      const success = await daoService.leaveDAO(id);
      if (success && community) {
        // Update local state
        setCommunity({
          ...community,
          members: community.members.filter(member => member !== currentUserPubkey)
        });
      }
      return success;
    } catch (error) {
      console.error('Error leaving community:', error);
      return false;
    }
  };

  const handleCreateProposal = async (title: string, description: string, options: string[], durationDays: number = 7) => {
    if (!id) return null;
    
    try {
      console.log('[useCommunity] Creating proposal:', { title, description, options, durationDays });
      const proposalId = await daoService.createProposal(id, title, description, options, durationDays);
      
      if (proposalId) {
        console.log('[useCommunity] Proposal created successfully:', proposalId);
        // Refresh proposals
        try {
          const updatedProposals = await daoService.getDAOProposals(id);
          setProposals(updatedProposals);
        } catch (error) {
          console.log('[useCommunity] Error refreshing proposals, using existing list');
        }
      }
      
      return proposalId;
    } catch (error) {
      console.error('Error creating proposal:', error);
      return null;
    }
  };

  const handleCreateKickProposal = async (memberToKick: string, reason: string) => {
    if (!id) return null;
    
    try {
      const proposalId = await daoService.createKickProposal(
        id,
        `Kick Member`,
        `Proposal to remove member from community. Reason: ${reason}`,
        ['Yes', 'No'],
        memberToKick
      );
      
      if (proposalId) {
        // Refresh kick proposals
        const updatedKickProposals = await daoService.getDAOKickProposals(id);
        setKickProposals(updatedKickProposals);
      }
      
      return proposalId;
    } catch (error) {
      console.error('Error creating kick proposal:', error);
      return null;
    }
  };

  const handleVoteOnKick = async (proposalId: string, vote: number) => {
    try {
      const voteId = await daoService.voteOnProposal(proposalId, vote);
      
      if (voteId && id) {
        // Refresh kick proposals
        const updatedKickProposals = await daoService.getDAOKickProposals(id);
        setKickProposals(updatedKickProposals);
      }
      
      return !!voteId;
    } catch (error) {
      console.error('Error voting on kick proposal:', error);
      return false;
    }
  };

  const handleDeleteCommunity = async () => {
    // Not implemented in DAO service yet
    console.log('Delete community not implemented');
    return false;
  };

  const handleCreateInvite = async (expiresIn?: number, maxUses?: number) => {
    if (!id) return null;
    
    try {
      const inviteId = await daoService.createDAOInvite(id, expiresIn, maxUses);
      return inviteId;
    } catch (error) {
      console.error('Error creating invite:', error);
      return null;
    }
  };

  const handleSetPrivate = async (isPrivate: boolean) => {
    if (!id) return false;
    
    try {
      const success = await daoService.updateDAOMetadata(id, {
        type: 'privacy',
        isPrivate
      });
      
      if (success && community) {
        setCommunity({ ...community, isPrivate });
      }
      
      return success;
    } catch (error) {
      console.error('Error setting privacy:', error);
      return false;
    }
  };

  const handleSetGuidelines = async (guidelines: string) => {
    if (!id) return false;
    
    try {
      const success = await daoService.updateDAOMetadata(id, {
        type: 'guidelines',
        content: guidelines
      });
      
      if (success && community) {
        setCommunity({ ...community, guidelines });
      }
      
      return success;
    } catch (error) {
      console.error('Error setting guidelines:', error);
      return false;
    }
  };

  const handleAddModerator = async (pubkey: string) => {
    if (!id) return false;
    
    try {
      const success = await daoService.updateDAORoles(id, {
        role: 'moderator',
        action: 'add',
        pubkey
      });
      
      if (success && community) {
        const moderators = community.moderators || [];
        setCommunity({
          ...community,
          moderators: [...moderators, pubkey]
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error adding moderator:', error);
      return false;
    }
  };

  const handleRemoveModerator = async (pubkey: string) => {
    if (!id) return false;
    
    try {
      const success = await daoService.updateDAORoles(id, {
        role: 'moderator',
        action: 'remove',
        pubkey
      });
      
      if (success && community) {
        const moderators = community.moderators || [];
        setCommunity({
          ...community,
          moderators: moderators.filter(mod => mod !== pubkey)
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error removing moderator:', error);
      return false;
    }
  };

  const handleSetCommunityTags = async (tags: string[]) => {
    if (!id) return false;
    
    try {
      const success = await daoService.updateDAOMetadata(id, {
        type: 'tags',
        content: tags
      });
      
      if (success && community) {
        setCommunity({ ...community, tags });
      }
      
      return success;
    } catch (error) {
      console.error('Error setting tags:', error);
      return false;
    }
  };

  const handleSetAlphaWallet = async (wallet: string) => {
    // Not implemented in DAO service yet
    console.log('Set alpha wallet not implemented');
    return false;
  };

  return {
    community,
    proposals,
    kickProposals,
    inviteLinks,
    loading,
    currentUserPubkey,
    
    // Roles and permissions
    isMember,
    isCreator,
    isModerator,
    isCreatorOnlyMember,
    userRole,
    canCreateProposal,
    canKickPropose,
    canModerate,
    canSetGuidelines,
    
    // Community actions
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateProposal,
    handleCreateKickProposal,
    handleVoteOnKick,
    handleDeleteCommunity,
    handleCreateInvite,
    handleSetPrivate,
    handleSetGuidelines,
    handleAddModerator,
    handleRemoveModerator,
    handleSetCommunityTags,
    handleSetAlphaWallet
  };
} 
