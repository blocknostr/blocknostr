import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { daoService } from "@/lib/dao/dao-service";
import { DAO, DAOProposal } from "@/types/dao";
import { nostrService } from "@/lib/nostr";
import { SimplePool, Filter, Event } from "nostr-tools";
import { EVENT_KINDS } from "@/lib/nostr/constants";

// Define DAO-specific event kinds
const DAO_KINDS = {
  COMMUNITY: EVENT_KINDS.COMMUNITY,
  PROPOSAL: EVENT_KINDS.PROPOSAL,
  VOTE: EVENT_KINDS.VOTE
};

export function useDAO(daoId?: string) {
  const [daos, setDaos] = useState<DAO[]>([]);
  const [myDaos, setMyDaos] = useState<DAO[]>([]);
  const [trendingDaos, setTrendingDaos] = useState<DAO[]>([]);
  const [currentDao, setCurrentDao] = useState<DAO | null>(null);
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [kickProposals, setKickProposals] = useState<any[]>([]);
  
  // Set loading states to true initially
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMyDaos, setLoadingMyDaos] = useState<boolean>(true);
  const [loadingTrending, setLoadingTrending] = useState<boolean>(true);
  const [loadingProposals, setLoadingProposals] = useState<boolean>(true);
  const [loadingKickProposals, setLoadingKickProposals] = useState<boolean>(true);
  
  // Pool for direct subscriptions
  const poolRef = useRef<SimplePool>(new SimplePool());
  const activeSubscriptions = useRef<string[]>([]);
  
  const currentUserPubkey = nostrService.publicKey;
  
  // Use the more direct Nostr subscription approach similar to Communities
  const subscribeToDAOs = useCallback((filters: Filter[], callback: (event: Event) => void) => {
    if (!poolRef.current) return '';
    
    const relays = [
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.nostr.band"
    ];
    
    // Create a subscription that processes events as they arrive
    const sub = poolRef.current.sub(relays, filters);
    
    // Set up event handlers
    sub.on('event', (event: Event) => {
      callback(event);
    });
    
    // Set loading state to false immediately to show UI faster
    setLoading(false);
    
    // Store subscription ID
    const subId = sub.id;
    activeSubscriptions.current.push(subId);
    
    return subId;
  }, []);
  
  // Subscribe to general DAOs
  const fetchGeneralDAOs = useCallback(async () => {
    if (daoId) return; // Skip if viewing a specific DAO
    
    // Try to get from cache first for immediate display
    const cachedDAOs = await daoService.getDAOs();
    if (cachedDAOs && cachedDAOs.length > 0) {
      setDaos(cachedDAOs);
      setLoading(false);
    }
    
    // Set up subscription for real-time updates
    const filter: Filter = {
      kinds: [DAO_KINDS.COMMUNITY],
      limit: 30
    };
    
    subscribeToDAOs([filter], (event) => {
      try {
        const dao = daoService.parseDaoEvent(event);
        if (dao && dao.name && dao.name !== "Unnamed DAO") {
          setDaos(prev => {
            // Check if this DAO is already in the list
            const exists = prev.some(d => d.id === dao.id);
            if (!exists) {
              return [...prev, dao].sort((a, b) => b.createdAt - a.createdAt);
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Error processing DAO event:", error);
      }
    });
  }, [daoId, subscribeToDAOs]);
  
  // Subscribe to user's DAOs
  const fetchMyDAOs = useCallback(async () => {
    if (daoId || !currentUserPubkey) return;
    
    // Try to get from cache first for immediate display
    const cachedUserDAOs = await daoService.getUserDAOs(currentUserPubkey);
    if (cachedUserDAOs && cachedUserDAOs.length > 0) {
      setMyDaos(cachedUserDAOs);
      setLoadingMyDaos(false);
    } else {
      setLoadingMyDaos(false); // Set to false immediately if no cached data
    }
    
    // Set up subscription for real-time updates
    const filter: Filter = {
      kinds: [DAO_KINDS.COMMUNITY],
      '#p': [currentUserPubkey],
      limit: 30
    };
    
    subscribeToDAOs([filter], (event) => {
      try {
        const dao = daoService.parseDaoEvent(event);
        if (dao && dao.name) {
          setMyDaos(prev => {
            const exists = prev.some(d => d.id === dao.id);
            if (!exists) {
              return [...prev, dao].sort((a, b) => b.createdAt - a.createdAt);
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Error processing user DAO event:", error);
      }
    });
  }, [daoId, currentUserPubkey, subscribeToDAOs]);
  
  // Fetch trending DAOs - keep this approach since it needs sorting
  const fetchTrendingDAOs = useCallback(async () => {
    if (daoId) return;
    
    try {
      const trending = await daoService.getTrendingDAOs();
      setTrendingDaos(trending);
    } catch (error) {
      console.error("Error fetching trending DAOs:", error);
    } finally {
      setLoadingTrending(false);
    }
  }, [daoId]);
  
  // Fetch specific DAO
  const fetchDaoDetails = useCallback(async () => {
    if (!daoId) return;
    
    // Try to get from cache first
    const dao = await daoService.getDAOById(daoId);
    if (dao) {
      setCurrentDao(dao);
      setLoading(false);
      
      // Fetch proposals in the background
      setLoadingProposals(true);
      const proposals = await daoService.getDAOProposals(daoId);
      setProposals(proposals);
      setLoadingProposals(false);
      
      // Fetch kick proposals in the background
      setLoadingKickProposals(true);
      const kickProps = await daoService.getDAOKickProposals(daoId);
      setKickProposals(kickProps);
      setLoadingKickProposals(false);
    } else {
      // If no cached data, set up subscription
      setLoading(true);
      
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        ids: [daoId],
      };
      
      subscribeToDAOs([filter], (event) => {
        try {
          const dao = daoService.parseDaoEvent(event);
          if (dao) {
            setCurrentDao(dao);
            setLoading(false);
            
            // Now fetch proposals
            fetchProposals(daoId);
          }
        } catch (error) {
          console.error("Error processing DAO details event:", error);
          setLoading(false);
        }
      });
    }
  }, [daoId, subscribeToDAOs]);
  
  // Set up a separate subscription for proposals
  const fetchProposals = useCallback((daoId: string) => {
    // Try to get from cache first
    const cachedProposals = daoService.getProposals(daoId);
    if (cachedProposals) {
      setProposals(cachedProposals);
      setLoadingProposals(false);
    }
    
    const filter: Filter = {
      kinds: [DAO_KINDS.PROPOSAL],
      '#e': [daoId],
    };
    
    subscribeToDAOs([filter], async (event) => {
      try {
        const proposal = daoService.parseProposalEvent(event, daoId);
        if (proposal) {
          // Get votes for this proposal
          const votes = await daoService.getVotesForProposal(proposal.id);
          proposal.votes = votes;
          
          setProposals(prev => {
            // Update if exists, add if new
            const exists = prev.some(p => p.id === proposal.id);
            if (exists) {
              return prev.map(p => p.id === proposal.id ? { ...proposal } : p);
            } else {
              return [...prev, proposal].sort((a, b) => b.createdAt - a.createdAt);
            }
          });
          
          setLoadingProposals(false);
        }
      } catch (error) {
        console.error("Error processing proposal event:", error);
      }
    });
  }, [subscribeToDAOs]);
  
  // Initialize data based on context
  useEffect(() => {
    if (daoId) {
      fetchDaoDetails();
    } else {
      fetchGeneralDAOs();
    }
    
    // Clean up subscriptions on unmount
    return () => {
      if (poolRef.current) {
        activeSubscriptions.current.forEach(subId => {
          try {
            poolRef.current.close([subId]);
          } catch (e) {
            console.error("Error closing subscription:", e);
          }
        });
        activeSubscriptions.current = [];
      }
    };
  }, [daoId, fetchDaoDetails, fetchGeneralDAOs]);
  
  // Refresh function - simplified to just clear cache and restart subscriptions
  const refreshDaos = useCallback(async () => {
    // Close existing subscriptions
    if (poolRef.current) {
      activeSubscriptions.current.forEach(subId => {
        try {
          poolRef.current.close([subId]);
        } catch (e) {
          console.error("Error closing subscription:", e);
        }
      });
      activeSubscriptions.current = [];
    }
    
    // Clear cache
    const daoCache = await import('@/lib/dao/dao-cache');
    daoCache.daoCache.clearAll();
    
    // Reset states
    setDaos([]);
    setMyDaos([]);
    setTrendingDaos([]);
    
    // Restart appropriate subscriptions
    if (daoId) {
      fetchDaoDetails();
    } else {
      fetchGeneralDAOs();
    }
    
    return true;
  }, [daoId, fetchDaoDetails, fetchGeneralDAOs]);
  
  // Create new DAO
  const createDAO = async (name: string, description: string, tags: string[] = []) => {
    try {
      console.log(`Creating new DAO: ${name}`);
      
      if (!name.trim()) {
        toast.error("DAO name is required");
        return null;
      }
      
      if (!currentUserPubkey) {
        toast.error("You must be logged in to create a DAO");
        return null;
      }
      
      const daoId = await daoService.createDAO(name, description, tags);
      
      if (daoId) {
        toast.success("Successfully created DAO");
        // Refetch DAOs
        const updatedDaos = await daoService.getDAOs();
        setDaos(updatedDaos);
        
        if (currentUserPubkey) {
          const userDaos = await daoService.getUserDAOs(currentUserPubkey);
          setMyDaos(userDaos);
        }
        return daoId;
      } else {
        toast.error("Failed to create DAO");
        return null;
      }
    } catch (error) {
      console.error("Error creating DAO:", error);
      toast.error("Failed to create DAO");
      return null;
    }
  };
  
  // Create a proposal
  const createProposal = async (
    daoId: string, 
    title: string, 
    description: string, 
    options: string[],
    durationDays: number = 7
  ) => {
    try {
      console.log(`Creating proposal for DAO ${daoId}: ${title}`);
      
      if (!title.trim()) {
        toast.error("Proposal title is required");
        return null;
      }
      
      if (!currentUserPubkey) {
        toast.error("You must be logged in to create a proposal");
        return null;
      }
      
      if (!options || options.length < 2) {
        toast.error("At least two options are required");
        return null;
      }
      
      const proposalId = await daoService.createProposal(daoId, title, description, options, durationDays);
      
      if (proposalId) {
        toast.success("Successfully created proposal");
        
        // Refetch proposals if we're viewing this DAO
        if (currentDao?.id === daoId) {
          setLoadingProposals(true);
          const updatedProposals = await daoService.getDAOProposals(daoId);
          setProposals(updatedProposals);
          setLoadingProposals(false);
        }
        return proposalId;
      } else {
        toast.error("Failed to create proposal");
        return null;
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal");
      return null;
    }
  };
  
  // Vote on a proposal with immediate UI update
  const voteOnProposal = async (proposalId: string, optionIndex: number) => {
    try {
      console.log(`Voting on proposal ${proposalId}, option ${optionIndex}`);
      
      if (!currentUserPubkey) {
        toast.error("You must be logged in to vote");
        return false;
      }
      
      const success = await daoService.voteOnProposal(proposalId, optionIndex);
      
      if (success) {
        toast.success("Vote recorded");
        
        // Optimistic update - immediately update the local state
        if (currentUserPubkey) {
          setProposals(currentProposals => {
            return currentProposals.map(p => {
              if (p.id === proposalId) {
                // Create a new votes object with the current user's vote
                const updatedVotes = { ...p.votes, [currentUserPubkey]: optionIndex };
                return { ...p, votes: updatedVotes };
              }
              return p;
            });
          });
        }
        
        // Background refresh for accurate data
        if (currentDao) {
          daoService.getDAOProposals(currentDao.id)
            .then(updatedProposals => {
              setProposals(updatedProposals);
            })
            .catch(err => {
              console.error("Error refreshing proposals:", err);
            });
        }
        return true;
      } else {
        toast.error("Failed to record vote");
        return false;
      }
    } catch (error) {
      console.error("Error voting on proposal:", error);
      toast.error("Failed to record vote");
      return false;
    }
  };
  
  // Vote on kick proposal with optimistic update
  const voteOnKickProposal = async (proposalId: string, optionIndex: number) => {
    try {
      console.log(`Voting on kick proposal ${proposalId}, option ${optionIndex}`);
      
      // Optimistic update for kick proposals
      if (currentUserPubkey) {
        setKickProposals(currentProposals => {
          return currentProposals.map(p => {
            if (p.id === proposalId) {
              const updatedVotes = { ...p.votes, [currentUserPubkey]: optionIndex };
              return { ...p, votes: updatedVotes };
            }
            return p;
          });
        });
      }
      
      // Use standard voting mechanism
      return await voteOnProposal(proposalId, optionIndex);
    } catch (error) {
      console.error("Error voting on kick proposal:", error);
      toast.error("Failed to record vote");
      return false;
    }
  };
  
  // Join a DAO
  const joinDAO = async (daoId: string) => {
    try {
      console.log(`Joining DAO ${daoId}`);
      
      if (!currentUserPubkey) {
        toast.error("You must be logged in to join a DAO");
        return false;
      }
      
      const success = await daoService.joinDAO(daoId);
      
      if (success) {
        toast.success("Successfully joined DAO");
        
        // If we're currently viewing this DAO, update it
        if (currentDao?.id === daoId) {
          const updatedDao = await daoService.getDAOById(daoId);
          setCurrentDao(updatedDao);
        }
        
        // Update myDaos list
        if (currentUserPubkey) {
          const userDaos = await daoService.getUserDAOs(currentUserPubkey);
          setMyDaos(userDaos);
        }
        
        return true;
      } else {
        toast.error("Failed to join DAO");
        return false;
      }
    } catch (error) {
      console.error("Error joining DAO:", error);
      toast.error("Failed to join DAO");
      return false;
    }
  };
  
  // Update DAO privacy setting
  const updateDAOPrivacy = async (isPrivate: boolean) => {
    try {
      if (!currentDao || !currentUserPubkey) return false;
      
      // Only creator can update privacy
      if (currentDao.creator !== currentUserPubkey) {
        toast.error("Only the DAO creator can update privacy settings");
        return false;
      }
      
      console.log(`Setting DAO ${currentDao.id} privacy to ${isPrivate}`);
      
      const success = await daoService.updateDAOMetadata(
        currentDao.id,
        { type: "privacy", isPrivate }
      );
      
      if (success) {
        // Update local state
        setCurrentDao(prev => {
          if (!prev) return null;
          return { ...prev, isPrivate };
        });
        return true;
      } else {
        toast.error("Failed to update privacy settings");
        return false;
      }
    } catch (error) {
      console.error("Error updating DAO privacy:", error);
      toast.error("Failed to update privacy settings");
      return false;
    }
  };
  
  // Update DAO guidelines
  const updateDAOGuidelines = async (guidelines: string) => {
    try {
      if (!currentDao || !currentUserPubkey) return false;
      
      // Only creator can update guidelines
      if (currentDao.creator !== currentUserPubkey) {
        toast.error("Only the DAO creator can update guidelines");
        return false;
      }
      
      console.log(`Updating guidelines for DAO ${currentDao.id}`);
      
      const success = await daoService.updateDAOMetadata(
        currentDao.id,
        { type: "guidelines", content: guidelines }
      );
      
      if (success) {
        // Update local state
        setCurrentDao(prev => {
          if (!prev) return null;
          return { ...prev, guidelines };
        });
        return true;
      } else {
        toast.error("Failed to update guidelines");
        return false;
      }
    } catch (error) {
      console.error("Error updating DAO guidelines:", error);
      toast.error("Failed to update guidelines");
      return false;
    }
  };
  
  // Update DAO tags
  const updateDAOTags = async (tags: string[]) => {
    try {
      if (!currentDao || !currentUserPubkey) return false;
      
      // Only creator can update tags
      if (currentDao.creator !== currentUserPubkey) {
        toast.error("Only the DAO creator can update tags");
        return false;
      }
      
      console.log(`Updating tags for DAO ${currentDao.id}:`, tags);
      
      const success = await daoService.updateDAOMetadata(
        currentDao.id,
        { type: "tags", content: tags }
      );
      
      if (success) {
        // Update local state
        setCurrentDao(prev => {
          if (!prev) return null;
          return { ...prev, tags };
        });
        return true;
      } else {
        toast.error("Failed to update tags");
        return false;
      }
    } catch (error) {
      console.error("Error updating DAO tags:", error);
      toast.error("Failed to update tags");
      return false;
    }
  };
  
  // Add DAO moderator
  const addDAOModerator = async (pubkey: string) => {
    try {
      if (!currentDao || !currentUserPubkey) return false;
      
      // Only creator can add moderators
      if (currentDao.creator !== currentUserPubkey) {
        toast.error("Only the DAO creator can add moderators");
        return false;
      }
      
      // Check if already a moderator
      if (currentDao.moderators.includes(pubkey)) {
        toast.error("This user is already a moderator");
        return false;
      }
      
      // Check if pubkey is valid
      if (!pubkey.match(/^[0-9a-f]{64}$/)) {
        toast.error("Invalid pubkey format");
        return false;
      }
      
      console.log(`Adding moderator ${pubkey} to DAO ${currentDao.id}`);
      
      const success = await daoService.updateDAORoles(
        currentDao.id,
        { role: "moderator", action: "add", pubkey }
      );
      
      if (success) {
        // Update local state
        setCurrentDao(prev => {
          if (!prev) return null;
          const moderators = [...prev.moderators, pubkey];
          return { ...prev, moderators };
        });
        return true;
      } else {
        toast.error("Failed to add moderator");
        return false;
      }
    } catch (error) {
      console.error("Error adding DAO moderator:", error);
      toast.error("Failed to add moderator");
      return false;
    }
  };
  
  // Remove DAO moderator
  const removeDAOModerator = async (pubkey: string) => {
    try {
      if (!currentDao || !currentUserPubkey) return false;
      
      // Only creator can remove moderators
      if (currentDao.creator !== currentUserPubkey) {
        toast.error("Only the DAO creator can remove moderators");
        return false;
      }
      
      console.log(`Removing moderator ${pubkey} from DAO ${currentDao.id}`);
      
      const success = await daoService.updateDAORoles(
        currentDao.id,
        { role: "moderator", action: "remove", pubkey }
      );
      
      if (success) {
        // Update local state
        setCurrentDao(prev => {
          if (!prev) return null;
          const moderators = prev.moderators.filter(mod => mod !== pubkey);
          return { ...prev, moderators };
        });
        return true;
      } else {
        toast.error("Failed to remove moderator");
        return false;
      }
    } catch (error) {
      console.error("Error removing DAO moderator:", error);
      toast.error("Failed to remove moderator");
      return false;
    }
  };
  
  // Create DAO invite link
  const createDAOInvite = async (daoId: string) => {
    try {
      if (!currentUserPubkey) return null;
      
      console.log(`Creating invite link for DAO ${daoId}`);
      
      const inviteId = await daoService.createDAOInvite(daoId);
      
      if (inviteId) {
        // Generate shareable link
        const inviteLink = `https://${window.location.host}/dao/invite/${inviteId}`;
        return inviteLink;
      } else {
        toast.error("Failed to create invite link");
        return null;
      }
    } catch (error) {
      console.error("Error creating DAO invite:", error);
      toast.error("Failed to create invite link");
      return null;
    }
  };
  
  // Create kick proposal
  const createKickProposal = async (daoId: string, memberToKick: string, reason: string) => {
    try {
      if (!currentUserPubkey) return false;
      
      console.log(`Creating kick proposal for member ${memberToKick} in DAO ${daoId}`);
      
      // For kick proposals, use standard proposal mechanism with special options
      const title = `Remove member ${memberToKick.substring(0, 8)}...`;
      const description = `Reason for removal: ${reason}`;
      const options = ["Yes, remove member", "No, keep member"];
      
      // Create a special proposal with kick metadata
      const proposalId = await daoService.createKickProposal(
        daoId,
        title,
        description,
        options,
        memberToKick
      );
      
      if (proposalId) {
        // Refresh proposals after creating kick proposal
        if (currentDao) {
          const updatedProposals = await daoService.getDAOProposals(daoId);
          setProposals(updatedProposals);
        }
        return true;
      } else {
        toast.error("Failed to create kick proposal");
        return false;
      }
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      toast.error("Failed to create kick proposal");
      return false;
    }
  };
  
  // Check if user is a member
  const isMember = useCallback((dao: DAO): boolean => {
    return !!currentUserPubkey && dao.members.includes(currentUserPubkey);
  }, [currentUserPubkey]);
  
  // Check if user is a moderator
  const isModerator = useCallback((dao: DAO): boolean => {
    return !!currentUserPubkey && dao.moderators.includes(currentUserPubkey);
  }, [currentUserPubkey]);
  
  // Check if user is the creator
  const isCreator = useCallback((dao: DAO): boolean => {
    return !!currentUserPubkey && dao.creator === currentUserPubkey;
  }, [currentUserPubkey]);
  
  return {
    daos,
    myDaos,
    trendingDaos,
    currentDao,
    proposals,
    kickProposals,
    loading,
    loadingMyDaos,
    loadingTrending,
    loadingProposals,
    loadingKickProposals,
    createDAO: daoService.createDAO.bind(daoService),
    createProposal: daoService.createProposal.bind(daoService),
    voteOnProposal: daoService.voteOnProposal.bind(daoService),
    joinDAO: daoService.joinDAO.bind(daoService),
    updateDAOPrivacy: daoService.updateDAOMetadata.bind(daoService),
    updateDAOGuidelines: daoService.updateDAOGuidelines.bind(daoService),
    updateDAOTags: daoService.updateDAOTags.bind(daoService),
    addDAOModerator: daoService.addDAOModerator.bind(daoService),
    removeDAOModerator: daoService.removeDAOModerator.bind(daoService),
    createDAOInvite: daoService.createDAOInvite.bind(daoService),
    createKickProposal: daoService.createKickProposal.bind(daoService),
    voteOnKickProposal: daoService.voteOnKickProposal.bind(daoService),
    isMember,
    isModerator,
    isCreator,
    currentUserPubkey,
    refreshDaos,
    fetchDaoDetails,
    // Expose these methods for lazy loading
    fetchGeneralDAOs,
    fetchMyDAOs,
    fetchTrendingDAOs
  };
}
