
import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProposals, setLoadingProposals] = useState<boolean>(true);
  
  const currentUserPubkey = nostrService.publicKey;
  
  // Fetch DAOs for general discovery page
  useEffect(() => {
    async function fetchDaos() {
      if (daoId) return; // Skip if viewing a specific DAO
      
      setLoading(true);
      try {
        // Fetch general DAOs
        const daos = await daoService.getDAOs();
        setDaos(daos);
        
        // If user is logged in, fetch their DAOs
        if (currentUserPubkey) {
          const userDaos = await daoService.getUserDAOs(currentUserPubkey);
          setMyDaos(userDaos);
        }
        
        // Fetch trending DAOs
        const trending = await daoService.getTrendingDAOs();
        setTrendingDaos(trending);
      } catch (error) {
        console.error("Error fetching DAOs:", error);
        toast.error("Failed to load DAOs");
      } finally {
        setLoading(false);
      }
    }
    
    fetchDaos();
  }, [daoId, currentUserPubkey]);
  
  // Fetch specific DAO if daoId is provided
  useEffect(() => {
    async function fetchDao() {
      if (!daoId) return;
      
      setLoading(true);
      try {
        const dao = await daoService.getDAOById(daoId);
        setCurrentDao(dao);
        
        // Also fetch proposals
        setLoadingProposals(true);
        const daoProposals = await daoService.getDAOProposals(daoId);
        setProposals(daoProposals);
        setLoadingProposals(false);
      } catch (error) {
        console.error(`Error fetching DAO ${daoId}:`, error);
        toast.error("Failed to load DAO details");
      } finally {
        setLoading(false);
      }
    }
    
    fetchDao();
  }, [daoId]);
  
  // Create new DAO
  const createDAO = async (name: string, description: string, tags: string[] = []) => {
    try {
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
      const proposalId = await daoService.createProposal(daoId, title, description, options, durationDays);
      
      if (proposalId) {
        toast.success("Successfully created proposal");
        
        // Refetch proposals if we're viewing this DAO
        if (currentDao?.id === daoId) {
          const updatedProposals = await daoService.getDAOProposals(daoId);
          setProposals(updatedProposals);
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
  
  // Vote on a proposal
  const voteOnProposal = async (proposalId: string, optionIndex: number) => {
    try {
      const success = await daoService.voteOnProposal(proposalId, optionIndex);
      
      if (success) {
        toast.success("Vote recorded");
        
        // Update proposals state with new vote
        if (currentDao) {
          const updatedProposals = await daoService.getDAOProposals(currentDao.id);
          setProposals(updatedProposals);
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
  
  // Join a DAO
  const joinDAO = async (daoId: string) => {
    try {
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
  
  return {
    daos,
    myDaos,
    trendingDaos,
    currentDao,
    proposals,
    loading,
    loadingProposals,
    createDAO,
    createProposal,
    voteOnProposal,
    joinDAO,
    isMember,
    isModerator,
    isCreator,
    currentUserPubkey
  };
}
