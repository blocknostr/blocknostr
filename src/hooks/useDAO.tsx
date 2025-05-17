import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { daoService } from "@/lib/dao/dao-service";
import { DAO, DAOProposal } from "@/types/dao";
import { nostrService } from "@/lib/nostr";

export function useDAO(daoId?: string) {
  const [daos, setDaos] = useState<DAO[]>([]);
  const [myDaos, setMyDaos] = useState<DAO[]>([]);
  const [trendingDaos, setTrendingDaos] = useState<DAO[]>([]);
  const [currentDao, setCurrentDao] = useState<DAO | null>(null);
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [kickProposals, setKickProposals] = useState<any[]>([]);
  
  // Split loading states for progressive rendering
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMyDaos, setLoadingMyDaos] = useState<boolean>(false);
  const [loadingTrending, setLoadingTrending] = useState<boolean>(false);
  const [loadingProposals, setLoadingProposals] = useState<boolean>(true);
  const [loadingKickProposals, setLoadingKickProposals] = useState<boolean>(true);
  
  // Track data initialization
  const initializedRef = useRef({
    general: false,
    myDaos: false,
    trending: false
  });
  
  const currentUserPubkey = nostrService.publicKey;
  
  // Fetch DAOs for general discovery page in parallel
  const fetchGeneralDAOs = useCallback(async () => {
    if (daoId) return; // Skip if viewing a specific DAO
    if (initializedRef.current.general) return; // Skip if already initialized
    
    initializedRef.current.general = true;
    setLoading(true);
    
    try {
      console.log("Fetching general DAOs...");
      const fetchedDaos = await daoService.getDAOs();
      console.log(`Fetched ${fetchedDaos.length} DAOs`);
      setDaos(fetchedDaos);
    } catch (error) {
      console.error("Error fetching general DAOs:", error);
    } finally {
      setLoading(false);
    }
  }, [daoId]);
  
  // Fetch user DAOs in parallel
  const fetchMyDAOs = useCallback(async () => {
    if (daoId || !currentUserPubkey) return; // Skip if viewing a specific DAO or not logged in
    if (initializedRef.current.myDaos) return; // Skip if already initialized
    
    initializedRef.current.myDaos = true;
    setLoadingMyDaos(true);
    
    try {
      console.log("Fetching user DAOs...");
      const userDaos = await daoService.getUserDAOs(currentUserPubkey);
      console.log(`Fetched ${userDaos.length} user DAOs`);
      setMyDaos(userDaos);
    } catch (error) {
      console.error("Error fetching user DAOs:", error);
    } finally {
      setLoadingMyDaos(false);
    }
  }, [daoId, currentUserPubkey]);
  
  // Fetch trending DAOs in parallel
  const fetchTrendingDAOs = useCallback(async () => {
    if (daoId) return; // Skip if viewing a specific DAO
    if (initializedRef.current.trending) return; // Skip if already initialized
    
    initializedRef.current.trending = true;
    setLoadingTrending(true);
    
    try {
      console.log("Fetching trending DAOs...");
      const trending = await daoService.getTrendingDAOs();
      console.log(`Fetched ${trending.length} trending DAOs`);
      setTrendingDaos(trending);
    } catch (error) {
      console.error("Error fetching trending DAOs:", error);
    } finally {
      setLoadingTrending(false);
    }
  }, [daoId]);
  
  // Refresh function to manually trigger data reload
  const refreshDaos = useCallback(async () => {
    if (daoId) return; // Skip if viewing a specific DAO
    
    // Reset initialization flags
    initializedRef.current = {
      general: false,
      myDaos: false,
      trending: false
    };
    
    // Clear the cache - force a fresh load
    const daoCache = await import('@/lib/dao/dao-cache');
    daoCache.daoCache.clearAll();
    
    // Only fetch the DAOs for the currently active tab
    return true;
  }, [daoId]);
  
  // Fetch specific DAO if daoId is provided
  const fetchDaoDetails = useCallback(async () => {
    if (!daoId) return;
    
    setLoading(true);
    
    try {
      console.log(`Fetching details for DAO ${daoId}...`);
      
      const dao = await daoService.getDAOById(daoId);
      if (dao) {
        console.log("DAO details fetched:", dao.name);
        setCurrentDao(dao);
        // Mark loading as complete once we have the main DAO data
        setLoading(false);
        
        // Now fetch proposals in background
        setLoadingProposals(true);
        fetchDaoProposals(daoId);
        
        // Fetch kick proposals in background
        setLoadingKickProposals(true);
        fetchDaoKickProposals(daoId);
      } else {
        console.error("DAO not found:", daoId);
        toast.error("DAO not found");
        setLoading(false);
      }
    } catch (error) {
      console.error(`Error fetching DAO ${daoId}:`, error);
      toast.error("Failed to load DAO details");
      setLoading(false);
    }
  }, [daoId]);
  
  // Fetch proposals in background
  const fetchDaoProposals = async (daoId: string) => {
    try {
      const daoProposals = await daoService.getDAOProposals(daoId);
      console.log(`Fetched ${daoProposals.length} proposals`);
      setProposals(daoProposals);
    } catch (error) {
      console.error(`Error fetching proposals for DAO ${daoId}:`, error);
    } finally {
      setLoadingProposals(false);
    }
  };
  
  // Fetch kick proposals in background
  const fetchDaoKickProposals = async (daoId: string) => {
    try {
      const kickProps = await daoService.getDAOKickProposals(daoId);
      console.log(`Fetched ${kickProps.length} kick proposals`);
      setKickProposals(kickProps);
    } catch (error) {
      console.error(`Error fetching kick proposals for DAO ${daoId}:`, error);
    } finally {
      setLoadingKickProposals(false);
    }
  };
  
  useEffect(() => {
    fetchDaoDetails();
  }, [fetchDaoDetails]);
  
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
  const isMember = (dao: DAO): boolean => {
    return !!currentUserPubkey && dao.members.includes(currentUserPubkey);
  };
  
  // Check if user is a moderator
  const isModerator = (dao: DAO): boolean => {
    return !!currentUserPubkey && dao.moderators.includes(currentUserPubkey);
  };
  
  // Check if user is the creator
  const isCreator = (dao: DAO): boolean => {
    return !!currentUserPubkey && dao.creator === currentUserPubkey;
  };
  
  // Add refreshProposals function
  const refreshProposals = useCallback(async () => {
    if (!daoId) return;
    
    setLoadingProposals(true);
    try {
      const fetchedProposals = await daoService.getDAOProposals(daoId);
      setProposals(fetchedProposals);
    } catch (error) {
      console.error("Error refreshing proposals:", error);
    } finally {
      setLoadingProposals(false);
    }
  }, [daoId]);
  
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
    createDAO,
    createProposal,
    voteOnProposal,
    joinDAO,
    updateDAOPrivacy,
    updateDAOGuidelines,
    updateDAOTags,
    addDAOModerator,
    removeDAOModerator,
    createDAOInvite,
    createKickProposal,
    voteOnKickProposal,
    isMember,
    isModerator,
    isCreator,
    currentUserPubkey,
    refreshDaos,
    fetchDaoDetails,
    // Expose these methods for lazy loading
    fetchGeneralDAOs,
    fetchMyDAOs,
    fetchTrendingDAOs,
    refreshProposals
  };
}
