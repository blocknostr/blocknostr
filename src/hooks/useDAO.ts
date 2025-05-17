
import { useState, useEffect, useCallback } from 'react';
import { daoService } from '@/lib/dao/dao-service';
import { DAO } from '@/types/dao';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';

export const useDAO = (daoId?: string) => {
  const [daos, setDaos] = useState<DAO[]>([]);
  const [myDaos, setMyDaos] = useState<DAO[]>([]);
  const [trendingDaos, setTrendingDaos] = useState<DAO[]>([]);
  const [currentDao, setCurrentDao] = useState<DAO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMyDaos, setLoadingMyDaos] = useState<boolean>(true);
  const [loadingTrending, setLoadingTrending] = useState<boolean>(true);
  
  const [proposals, setProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState<boolean>(true);
  
  const [kickProposals, setKickProposals] = useState<any[]>([]);
  const [loadingKickProposals, setLoadingKickProposals] = useState<boolean>(true);
  
  // Get the current user's pubkey
  const currentUserPubkey = nostrService.publicKey;
  
  // Fetch general DAOs (for discover tab)
  const fetchGeneralDAOs = useCallback(async () => {
    console.log("Fetching general DAOs...");
    setLoading(true);
    try {
      const fetchedDaos = await daoService.getDAOs();
      setDaos(fetchedDaos);
    } catch (error) {
      console.error("Error fetching DAOs:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch user's DAOs
  const fetchMyDAOs = useCallback(async () => {
    if (!currentUserPubkey) {
      setMyDaos([]);
      setLoadingMyDaos(false);
      return;
    }
    
    console.log("Fetching user DAOs...");
    setLoadingMyDaos(true);
    try {
      const fetchedDaos = await daoService.getUserDAOs(currentUserPubkey);
      setMyDaos(fetchedDaos);
    } catch (error) {
      console.error("Error fetching user DAOs:", error);
    } finally {
      setLoadingMyDaos(false);
    }
  }, [currentUserPubkey]);
  
  // Fetch trending DAOs
  const fetchTrendingDAOs = useCallback(async () => {
    console.log("Fetching trending DAOs...");
    setLoadingTrending(true);
    try {
      const fetchedDaos = await daoService.getTrendingDAOs();
      setTrendingDaos(fetchedDaos);
    } catch (error) {
      console.error("Error fetching trending DAOs:", error);
    } finally {
      setLoadingTrending(false);
    }
  }, []);
  
  // Create a DAO
  const createDAO = useCallback(async (name: string, description: string, tags: string[] = []) => {
    try {
      const daoId = await daoService.createDAO(name, description, tags);
      if (daoId) {
        toast.success(`DAO "${name}" created successfully!`);
        
        // Refresh the DAOs lists
        fetchMyDAOs();
        fetchGeneralDAOs();
        
        return daoId;
      } else {
        toast.error("Failed to create DAO");
        return null;
      }
    } catch (error) {
      console.error("Error creating DAO:", error);
      toast.error("Error creating DAO");
      return null;
    }
  }, [fetchMyDAOs, fetchGeneralDAOs]);
  
  // Join a DAO
  const joinDAO = useCallback(async (daoId: string) => {
    if (!currentUserPubkey) {
      toast.error("Please login to join this DAO");
      return false;
    }
    
    try {
      const success = await daoService.joinDAO(daoId);
      if (success) {
        // Update the current DAO if we're viewing it
        if (daoId === currentDao?.id) {
          const updatedDao = await daoService.getDAOById(daoId);
          setCurrentDao(updatedDao);
        }
        
        // Refresh my DAOs list
        fetchMyDAOs();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error joining DAO:", error);
      toast.error("Failed to join DAO");
      return false;
    }
  }, [currentUserPubkey, currentDao, fetchMyDAOs]);
  
  // Leave a DAO
  const leaveDAO = useCallback(async (daoId: string) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to leave a DAO");
      return false;
    }
    
    try {
      const success = await daoService.leaveDAO(daoId);
      if (success) {
        // Refresh my DAOs list
        fetchMyDAOs();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error leaving DAO:", error);
      toast.error("Failed to leave DAO");
      return false;
    }
  }, [currentUserPubkey, fetchMyDAOs]);
  
  // Delete a DAO
  const deleteDAO = useCallback(async (daoId: string) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to delete a DAO");
      return false;
    }
    
    try {
      const success = await daoService.deleteDAO(daoId);
      if (success) {
        // Refresh DAOs lists
        fetchMyDAOs();
        fetchGeneralDAOs();
        fetchTrendingDAOs();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting DAO:", error);
      toast.error("Failed to delete DAO");
      return false;
    }
  }, [currentUserPubkey, fetchMyDAOs, fetchGeneralDAOs, fetchTrendingDAOs]);
  
  // Create a proposal
  const createProposal = useCallback(async (
    daoId: string, 
    title: string, 
    description: string,
    options: string[] = ["Yes", "No"],
    durationDays: number = 7
  ) => {
    if (!currentUserPubkey) {
      toast.error("Please login to create a proposal");
      return null;
    }
    
    try {
      const proposalId = await daoService.createProposal(daoId, title, description, options, durationDays);
      
      if (proposalId) {
        toast.success("Proposal created successfully");
        
        // Refresh proposals
        const updatedProposals = await daoService.getDAOProposals(daoId);
        setProposals(updatedProposals);
      } else {
        toast.error("Failed to create proposal");
      }
      
      return proposalId;
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Error creating proposal");
      return null;
    }
  }, [currentUserPubkey]);
  
  // Vote on a proposal
  const voteOnProposal = useCallback(async (proposalId: string, optionIndex: number) => {
    try {
      const success = await daoService.voteOnProposal(proposalId, optionIndex);
      if (success) {
        toast.success("Vote recorded successfully");
        
        // Refresh proposals if we're viewing a specific DAO
        if (daoId) {
          const updatedProposals = await daoService.getDAOProposals(daoId);
          setProposals(updatedProposals);
        }
        
        return true;
      } else {
        toast.error("Failed to record vote");
        return false;
      }
    } catch (error) {
      console.error("Error voting on proposal:", error);
      toast.error("Error recording vote");
      return false;
    }
  }, [daoId]);
  
  // Update DAO privacy setting
  const updateDAOPrivacy = useCallback(async (isPrivate: boolean) => {
    if (!daoId) return false;
    
    try {
      const success = await daoService.updateDAOMetadata(daoId, {
        type: "privacy",
        isPrivate
      });
      
      if (success) {
        // Refresh the current DAO
        const updatedDao = await daoService.getDAOById(daoId);
        setCurrentDao(updatedDao);
        
        toast.success("DAO privacy settings updated");
      } else {
        toast.error("Failed to update privacy settings");
      }
      
      return success;
    } catch (error) {
      console.error("Error updating DAO privacy:", error);
      toast.error("Error updating privacy settings");
      return false;
    }
  }, [daoId]);
  
  // Update DAO guidelines
  const updateDAOGuidelines = useCallback(async (guidelines: string) => {
    if (!daoId) return false;
    
    try {
      const success = await daoService.updateDAOMetadata(daoId, {
        type: "guidelines",
        content: guidelines
      });
      
      if (success) {
        // Refresh the current DAO
        const updatedDao = await daoService.getDAOById(daoId);
        setCurrentDao(updatedDao);
        
        toast.success("DAO guidelines updated");
      } else {
        toast.error("Failed to update guidelines");
      }
      
      return success;
    } catch (error) {
      console.error("Error updating DAO guidelines:", error);
      toast.error("Error updating guidelines");
      return false;
    }
  }, [daoId]);
  
  // Update DAO tags
  const updateDAOTags = useCallback(async (tags: string[]) => {
    if (!daoId) return false;
    
    try {
      const success = await daoService.updateDAOMetadata(daoId, {
        type: "tags",
        content: tags
      });
      
      if (success) {
        // Refresh the current DAO
        const updatedDao = await daoService.getDAOById(daoId);
        setCurrentDao(updatedDao);
        
        toast.success("DAO tags updated");
      } else {
        toast.error("Failed to update tags");
      }
      
      return success;
    } catch (error) {
      console.error("Error updating DAO tags:", error);
      toast.error("Error updating tags");
      return false;
    }
  }, [daoId]);
  
  // Add a moderator to DAO
  const addDAOModerator = useCallback(async (pubkey: string) => {
    if (!daoId) return false;
    
    try {
      const success = await daoService.updateDAORoles(daoId, {
        role: "moderator",
        action: "add",
        pubkey
      });
      
      if (success) {
        // Refresh the current DAO
        const updatedDao = await daoService.getDAOById(daoId);
        setCurrentDao(updatedDao);
        
        toast.success("Moderator added successfully");
      } else {
        toast.error("Failed to add moderator");
      }
      
      return success;
    } catch (error) {
      console.error("Error adding moderator:", error);
      toast.error("Error adding moderator");
      return false;
    }
  }, [daoId]);
  
  // Remove a moderator from DAO
  const removeDAOModerator = useCallback(async (pubkey: string) => {
    if (!daoId) return false;
    
    try {
      const success = await daoService.updateDAORoles(daoId, {
        role: "moderator",
        action: "remove",
        pubkey
      });
      
      if (success) {
        // Refresh the current DAO
        const updatedDao = await daoService.getDAOById(daoId);
        setCurrentDao(updatedDao);
        
        toast.success("Moderator removed successfully");
      } else {
        toast.error("Failed to remove moderator");
      }
      
      return success;
    } catch (error) {
      console.error("Error removing moderator:", error);
      toast.error("Error removing moderator");
      return false;
    }
  }, [daoId]);
  
  // Create an invite link
  const createDAOInvite = useCallback(async (daoId: string, expiresIn?: number, maxUses?: number) => {
    try {
      const inviteLink = await daoService.createDAOInvite(daoId, expiresIn, maxUses);
      
      if (!inviteLink) {
        toast.error("Failed to create invite link");
      }
      
      return inviteLink;
    } catch (error) {
      console.error("Error creating invite link:", error);
      toast.error("Error creating invite link");
      return null;
    }
  }, []);
  
  // Create a kick proposal
  const createKickProposal = useCallback(async (daoId: string, memberToKick: string, reason: string) => {
    try {
      const title = `Proposal to remove member`;
      const description = JSON.stringify({
        type: "kick",
        targetPubkey: memberToKick,
        reason
      });
      
      const proposalId = await daoService.createKickProposal(
        daoId,
        title,
        description,
        ["Yes", "No"],
        memberToKick,
        7 // 7 days to vote
      );
      
      if (proposalId) {
        // Refresh kick proposals
        const updatedProposals = await daoService.getDAOKickProposals(daoId);
        setKickProposals(updatedProposals);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      toast.error("Error creating kick proposal");
      return false;
    }
  }, []);
  
  // Vote on kick proposal
  const voteOnKickProposal = useCallback(async (proposalId: string, optionIndex: number) => {
    try {
      const success = await daoService.voteOnProposal(proposalId, optionIndex);
      
      if (success && daoId) {
        // Refresh kick proposals
        const updatedProposals = await daoService.getDAOKickProposals(daoId);
        setKickProposals(updatedProposals);
      }
      
      return success;
    } catch (error) {
      console.error("Error voting on kick proposal:", error);
      toast.error("Error voting on kick proposal");
      return false;
    }
  }, [daoId]);
  
  // Check if user is a member of DAO
  const isMember = useCallback((dao: DAO) => {
    return currentUserPubkey ? dao.members.includes(currentUserPubkey) : false;
  }, [currentUserPubkey]);
  
  // Check if user is the creator of DAO
  const isCreator = useCallback((dao: DAO) => {
    return currentUserPubkey ? dao.creator === currentUserPubkey : false;
  }, [currentUserPubkey]);
  
  // Check if user is a moderator of DAO
  const isModerator = useCallback((dao: DAO) => {
    return currentUserPubkey ? dao.moderators.includes(currentUserPubkey) : false;
  }, [currentUserPubkey]);
  
  // Refresh all DAOs data
  const refreshDaos = useCallback(async () => {
    await Promise.all([
      fetchGeneralDAOs(),
      currentUserPubkey ? fetchMyDAOs() : Promise.resolve(),
      fetchTrendingDAOs()
    ]);
  }, [fetchGeneralDAOs, fetchMyDAOs, fetchTrendingDAOs, currentUserPubkey]);
  
  // Load DAOs on component mount
  useEffect(() => {
    fetchGeneralDAOs();
    fetchTrendingDAOs();
    
    if (currentUserPubkey) {
      fetchMyDAOs();
    }
  }, [fetchGeneralDAOs, fetchMyDAOs, fetchTrendingDAOs, currentUserPubkey]);
  
  // Load specific DAO if daoId provided
  useEffect(() => {
    const fetchDAO = async () => {
      if (daoId) {
        setLoading(true);
        try {
          const dao = await daoService.getDAOById(daoId);
          setCurrentDao(dao);
        } catch (error) {
          console.error("Error fetching DAO:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchDAO();
  }, [daoId]);
  
  // Load proposals for specific DAO
  useEffect(() => {
    const fetchProposals = async () => {
      if (daoId) {
        setLoadingProposals(true);
        try {
          const fetchedProposals = await daoService.getDAOProposals(daoId);
          setProposals(fetchedProposals);
        } catch (error) {
          console.error("Error fetching proposals:", error);
        } finally {
          setLoadingProposals(false);
        }
      }
    };
    
    fetchProposals();
  }, [daoId]);
  
  // Load kick proposals for specific DAO
  useEffect(() => {
    const fetchKickProposals = async () => {
      if (daoId) {
        setLoadingKickProposals(true);
        try {
          const fetchedProposals = await daoService.getDAOKickProposals(daoId);
          setKickProposals(fetchedProposals);
        } catch (error) {
          console.error("Error fetching kick proposals:", error);
        } finally {
          setLoadingKickProposals(false);
        }
      }
    };
    
    fetchKickProposals();
  }, [daoId]);
  
  return {
    daos,
    myDaos,
    trendingDaos,
    currentDao,
    loading,
    loadingMyDaos,
    loadingTrending,
    proposals,
    loadingProposals,
    kickProposals,
    loadingKickProposals,
    currentUserPubkey,
    refreshDaos,
    fetchGeneralDAOs,
    fetchMyDAOs,
    fetchTrendingDAOs,
    createDAO,
    joinDAO,
    leaveDAO,
    deleteDAO,
    createProposal,
    voteOnProposal,
    updateDAOPrivacy,
    updateDAOGuidelines,
    updateDAOTags,
    addDAOModerator,
    removeDAOModerator,
    createDAOInvite,
    createKickProposal,
    voteOnKickProposal,
    isMember,
    isCreator,
    isModerator
  };
};
