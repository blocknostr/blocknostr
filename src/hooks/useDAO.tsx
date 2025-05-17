import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { daoService } from "@/lib/dao/dao-service";
import { DAO, DAOProposal } from "@/types/dao";
import { nostrService } from "@/lib/nostr";
import { Event } from "nostr-tools";

export function useDAO(daoId?: string) {
  // State for storing DAOs
  const [daos, setDaos] = useState<DAO[]>([]);
  const [myDaos, setMyDaos] = useState<DAO[]>([]);
  const [trendingDaos, setTrendingDaos] = useState<DAO[]>([]);
  const [currentDao, setCurrentDao] = useState<DAO | null>(null);
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [kickProposals, setKickProposals] = useState<any[]>([]);
  
  // Loading states for progressive rendering
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMyDaos, setLoadingMyDaos] = useState<boolean>(true);
  const [loadingTrending, setLoadingTrending] = useState<boolean>(true);
  const [loadingProposals, setLoadingProposals] = useState<boolean>(true);
  const [loadingKickProposals, setLoadingKickProposals] = useState<boolean>(true);
  
  // Track subscriptions for cleanup
  const subscriptionsRef = useRef<(() => void)[]>([]);
  const userSubscriptionRef = useRef<(() => void) | null>(null);
  const daoSubscriptionRef = useRef<(() => void) | null>(null);
  const proposalSubscriptionRef = useRef<(() => void) | null>(null);
  
  // Current user
  const currentUserPubkey = nostrService.publicKey;
  
  // Subscribe to general DAOs
  const subscribeToDAOs = useCallback(() => {
    if (daoId) return; // Skip if viewing a specific DAO
    
    console.log("Subscribing to general DAOs");
    setLoading(true);
    
    // Initially, try to get DAOs from cache to populate UI faster
    daoService.getDAOs().then(cachedDaos => {
      if (cachedDaos.length > 0) {
        setDaos(cachedDaos);
      }
    });
    
    // Set up subscription for real-time updates
    const unsubscribe = daoService.subscribeToDAOs((dao) => {
      setDaos(prevDaos => {
        // Only add if not already in the list
        const exists = prevDaos.some(d => d.id === dao.id);
        if (exists) {
          return prevDaos.map(d => d.id === dao.id ? dao : d);
        } else {
          return [dao, ...prevDaos];
        }
      });
      setLoading(false);
    });
    
    subscriptionsRef.current.push(unsubscribe);
    
    // Set loading to false after a timeout even if no data received
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [daoId]);
  
  // Subscribe to user's DAOs
  const subscribeToMyDAOs = useCallback(() => {
    if (daoId || !currentUserPubkey) return; // Skip if viewing a specific DAO or not logged in
    
    console.log("Subscribing to user DAOs");
    setLoadingMyDaos(true);
    
    // Initially, try to get DAOs from cache to populate UI faster
    daoService.getUserDAOs(currentUserPubkey).then(cachedDaos => {
      if (cachedDaos.length > 0) {
        setMyDaos(cachedDaos);
      }
    });
    
    // Set up subscription for real-time updates
    const unsubscribe = daoService.subscribeToUserDAOs(currentUserPubkey, (dao) => {
      setMyDaos(prevDaos => {
        // Only add if not already in the list
        const exists = prevDaos.some(d => d.id === dao.id);
        if (exists) {
          return prevDaos.map(d => d.id === dao.id ? dao : d);
        } else {
          return [dao, ...prevDaos];
        }
      });
      setLoadingMyDaos(false);
    });
    
    userSubscriptionRef.current = unsubscribe;
    subscriptionsRef.current.push(unsubscribe);
    
    // Set loading to false after a timeout even if no data received
    const timeout = setTimeout(() => {
      setLoadingMyDaos(false);
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [daoId, currentUserPubkey]);
  
  // Subscribe to trending DAOs
  const subscribeToTrendingDAOs = useCallback(() => {
    if (daoId) return; // Skip if viewing a specific DAO
    
    console.log("Fetching trending DAOs");
    setLoadingTrending(true);
    
    // Trending DAOs don't have a real-time subscription model
    // We'll just fetch them once since they don't change frequently
    daoService.getTrendingDAOs().then(trending => {
      setTrendingDaos(trending);
      setLoadingTrending(false);
    }).catch(error => {
      console.error("Error fetching trending DAOs:", error);
      setLoadingTrending(false);
    });
    
    // No unsubscribe function needed since this is just a one-time fetch
    return () => {};
  }, [daoId]);
  
  // Subscribe to a specific DAO
  const subscribeToDAO = useCallback(() => {
    if (!daoId) return () => {};
    
    console.log(`Subscribing to DAO ${daoId}`);
    setLoading(true);
    
    // Initially, try to get DAO from cache
    daoService.getDAOById(daoId).then(dao => {
      if (dao) {
        setCurrentDao(dao);
        setLoading(false);
      }
    });
    
    // Set up subscription for real-time updates
    const unsubscribe = daoService.subscribeToDAO(daoId, (dao) => {
      if (dao) {
        setCurrentDao(dao);
        setLoading(false);
      }
    });
    
    daoSubscriptionRef.current = unsubscribe;
    subscriptionsRef.current.push(unsubscribe);
    
    // Set loading to false after a timeout even if no data received
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [daoId]);
  
  // Subscribe to DAO proposals
  const subscribeToProposals = useCallback(() => {
    if (!daoId) return () => {};
    
    console.log(`Subscribing to proposals for DAO ${daoId}`);
    setLoadingProposals(true);
    
    // Initially, try to get proposals from cache
    daoService.getDAOProposals(daoId).then(cachedProposals => {
      setProposals(cachedProposals);
      setLoadingProposals(false);
      
      // Identify kick proposals
      const kickProps = cachedProposals.filter(proposal => {
        try {
          const content = JSON.parse(proposal.description);
          return content.type === "kick" && content.targetPubkey;
        } catch (e) {
          return false;
        }
      }).map(proposal => {
        try {
          const content = JSON.parse(proposal.description);
          return {
            ...proposal,
            targetPubkey: content.targetPubkey
          };
        } catch (e) {
          return null;
        }
      }).filter(p => p !== null);
      
      setKickProposals(kickProps);
      setLoadingKickProposals(false);
    });
    
    // Set up subscription for real-time updates
    const unsubscribe = daoService.subscribeToDAOProposals(daoId, (proposal) => {
      setProposals(prevProposals => {
        // Update or add the proposal
        const exists = prevProposals.some(p => p.id === proposal.id);
        
        if (exists) {
          return prevProposals.map(p => p.id === proposal.id ? proposal : p);
        } else {
          return [proposal, ...prevProposals];
        }
      });
      
      // Check if it's a kick proposal and update accordingly
      try {
        const content = JSON.parse(proposal.description);
        if (content.type === "kick" && content.targetPubkey) {
          const kickProposal = {
            ...proposal,
            targetPubkey: content.targetPubkey
          };
          
          setKickProposals(prevKickProposals => {
            const exists = prevKickProposals.some(p => p.id === proposal.id);
            
            if (exists) {
              return prevKickProposals.map(p => p.id === proposal.id ? kickProposal : p);
            } else {
              return [kickProposal, ...prevKickProposals];
            }
          });
        }
      } catch (e) {
        // Not a kick proposal or invalid JSON
      }
    });
    
    proposalSubscriptionRef.current = unsubscribe;
    subscriptionsRef.current.push(unsubscribe);
    
    // Set loading to false after a timeout even if no data received
    const timeout = setTimeout(() => {
      setLoadingProposals(false);
      setLoadingKickProposals(false);
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [daoId]);
  
  // Set up subscriptions based on the view
  useEffect(() => {
    const unsubFuncs: (() => void)[] = [];
    
    if (daoId) {
      // Viewing a specific DAO
      unsubFuncs.push(subscribeToDAO());
      unsubFuncs.push(subscribeToProposals());
    } else {
      // Viewing DAOs list
      unsubFuncs.push(subscribeToDAOs());
      unsubFuncs.push(subscribeToMyDAOs());
      subscribeToTrendingDAOs(); // This doesn't return an unsubscribe function
    }
    
    return () => {
      // Clean up all subscriptions
      unsubFuncs.forEach(unsub => unsub && unsub());
      
      // Also clean up any references
      if (userSubscriptionRef.current) {
        userSubscriptionRef.current();
        userSubscriptionRef.current = null;
      }
      
      if (daoSubscriptionRef.current) {
        daoSubscriptionRef.current();
        daoSubscriptionRef.current = null;
      }
      
      if (proposalSubscriptionRef.current) {
        proposalSubscriptionRef.current();
        proposalSubscriptionRef.current = null;
      }
      
      subscriptionsRef.current.forEach(unsub => unsub());
      subscriptionsRef.current = [];
    };
  }, [daoId, currentUserPubkey, subscribeToDAOs, subscribeToMyDAOs, subscribeToTrendingDAOs, subscribeToDAO, subscribeToProposals]);
  
  // Direct fetch methods for lazy loading
  const fetchGeneralDAOs = useCallback(async () => {
    if (daoId) return; // Skip if viewing a specific DAO
    
    setLoading(true);
    try {
      const fetchedDaos = await daoService.getDAOs();
      setDaos(fetchedDaos);
    } catch (error) {
      console.error("Error fetching general DAOs:", error);
    } finally {
      setLoading(false);
    }
  }, [daoId]);
  
  const fetchMyDAOs = useCallback(async () => {
    if (daoId || !currentUserPubkey) return; // Skip if viewing a specific DAO or not logged in
    
    setLoadingMyDaos(true);
    try {
      const userDaos = await daoService.getUserDAOs(currentUserPubkey);
      setMyDaos(userDaos);
    } catch (error) {
      console.error("Error fetching user DAOs:", error);
    } finally {
      setLoadingMyDaos(false);
    }
  }, [daoId, currentUserPubkey]);
  
  const fetchTrendingDAOs = useCallback(async () => {
    if (daoId) return; // Skip if viewing a specific DAO
    
    setLoadingTrending(true);
    try {
      const trending = await daoService.getTrendingDAOs();
      setTrendingDaos(trending);
    } catch (error) {
      console.error("Error fetching trending DAOs:", error);
    } finally {
      setLoadingTrending(false);
    }
  }, [daoId]);
  
  // Refresh function to manually trigger data reload
  const refreshDaos = useCallback(async () => {
    if (daoId) {
      // Refresh the current DAO
      fetchDaoDetails();
    } else {
      // Clear all caches
      const daoCache = await import('@/lib/dao/dao-cache');
      daoCache.daoCache.clearAll();
      
      // Refetch data
      await fetchGeneralDAOs();
      if (currentUserPubkey) {
        await fetchMyDAOs();
      }
      await fetchTrendingDAOs();
    }
    
    return true;
  }, [daoId, fetchGeneralDAOs, fetchMyDAOs, fetchTrendingDAOs, currentUserPubkey]);
  
  // Fetch DAO details (for direct API access when needed)
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
        const proposals = await daoService.getDAOProposals(daoId);
        setProposals(proposals);
        setLoadingProposals(false);
        
        // Process kick proposals
        const kickProps = proposals.filter(proposal => {
          try {
            const content = JSON.parse(proposal.description);
            return content.type === "kick" && content.targetPubkey;
          } catch (e) {
            return false;
          }
        }).map(proposal => {
          try {
            const content = JSON.parse(proposal.description);
            return {
              ...proposal,
              targetPubkey: content.targetPubkey
            };
          } catch (e) {
            return null;
          }
        }).filter(p => p !== null);
        
        setKickProposals(kickProps);
        setLoadingKickProposals(false);
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
        refreshDaos();
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
    options: string[]
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
      
      // Verify user is a member
      if (currentDao && !isMember(currentDao)) {
        toast.error("Only members can create proposals");
        return null;
      }
      
      // Use the correct parameter count (removed durationDays)
      const proposalId = await daoService.createProposal(daoId, title, description, options);
      
      if (proposalId) {
        toast.success("Successfully created proposal");
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
      
      // Verify user is a member
      if (currentDao && !isMember(currentDao)) {
        toast.error("Only members can vote on proposals");
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
      
      if (!currentUserPubkey) {
        toast.error("You must be logged in to vote");
        return false;
      }
      
      // Verify user is a member
      if (currentDao && !isMember(currentDao)) {
        toast.error("Only members can vote on kick proposals");
        return false;
      }
      
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
      
      // Use specialized kick voting mechanism
      const voteId = await daoService.voteOnKickProposal(proposalId, optionIndex);
      return !!voteId;
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
        
        // Refresh DAO data
        if (currentDao?.id === daoId) {
          await fetchDaoDetails();
        }
        
        // Update myDaos list
        await fetchMyDAOs();
        
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
  
  // Leave a DAO
  const leaveDAO = async (daoId: string) => {
    try {
      console.log(`Leaving DAO ${daoId}`);
      
      if (!currentUserPubkey) {
        toast.error("You must be logged in to leave a DAO");
        return false;
      }
      
      // Verify user is a member but not the creator
      if (currentDao) {
        if (!isMember(currentDao)) {
          toast.error("You are not a member of this DAO");
          return false;
        }
        
        if (isCreator(currentDao)) {
          toast.error("Creator cannot leave their own DAO. You may delete it instead.");
          return false;
        }
      }
      
      const success = await daoService.leaveDAO(daoId);
      
      if (success) {
        toast.success("Successfully left DAO");
        
        // Refresh DAO data and my DAOs
        await refreshDaos();
        
        return true;
      } else {
        toast.error("Failed to leave DAO");
        return false;
      }
    } catch (error: any) {
      console.error("Error leaving DAO:", error);
      toast.error(error.message || "Failed to leave DAO");
      return false;
    }
  };
  
  // Delete a DAO (creator only)
  const deleteDAO = async (daoId: string) => {
    try {
      console.log(`Deleting DAO ${daoId}`);
      
      if (!currentUserPubkey) {
        toast.error("You must be logged in to delete a DAO");
        return false;
      }
      
      // Verify user is the creator
      if (currentDao && !isCreator(currentDao)) {
        toast.error("Only the creator can delete a DAO");
        return false;
      }
      
      const success = await daoService.deleteDAO(daoId);
      
      if (success) {
        toast.success("Successfully deleted DAO");
        
        // Refresh all DAOs
        await refreshDaos();
        
        return true;
      } else {
        toast.error("Failed to delete DAO");
        return false;
      }
    } catch (error: any) {
      console.error("Error deleting DAO:", error);
      toast.error(error.message || "Failed to delete DAO");
      return false;
    }
  };
  
  // Update DAO privacy setting
  const updateDAOPrivacy = async (isPrivate: boolean) => {
    try {
      if (!currentDao || !currentUserPubkey) return false;
      
      // Only creator can update privacy
      if (!isCreator(currentDao)) {
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
      if (!isCreator(currentDao)) {
        toast.error("Only the DAO creator can update guidelines");
        return false;
      }
      
      console.log(`Updating guidelines for DAO ${currentDao.id}`);
      
      const success = await daoService.updateDAOGuidelines(currentDao.id, guidelines);
      
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
      if (!isCreator(currentDao)) {
        toast.error("Only the DAO creator can update tags");
        return false;
      }
      
      console.log(`Updating tags for DAO ${currentDao.id}:`, tags);
      
      const success = await daoService.updateDAOTags(currentDao.id, tags);
      
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
      if (!isCreator(currentDao)) {
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
      
      const success = await daoService.addDAOModerator(currentDao.id, pubkey);
      
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
      if (!isCreator(currentDao)) {
        toast.error("Only the DAO creator can remove moderators");
        return false;
      }
      
      console.log(`Removing moderator ${pubkey} from DAO ${currentDao.id}`);
      
      const success = await daoService.removeDAOModerator(currentDao.id, pubkey);
      
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
      
      // Verify user has permission (creator or moderator)
      if (currentDao && !isCreator(currentDao) && !isModerator(currentDao)) {
        toast.error("Only creators and moderators can create invite links");
        return null;
      }
      
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
      
      // Verify user has permission (member)
      if (currentDao && !isMember(currentDao)) {
        toast.error("Only members can propose to kick other members");
        return false;
      }
      
      // Can't kick creator
      if (currentDao && currentDao.creator === memberToKick) {
        toast.error("Cannot kick the DAO creator");
        return false;
      }
      
      // Can't kick yourself
      if (currentUserPubkey === memberToKick) {
        toast.error("Cannot kick yourself. Use 'Leave DAO' instead.");
        return false;
      }
      
      console.log(`Creating kick proposal for member ${memberToKick} in DAO ${daoId}`);
      
      // For kick proposals, use standard proposal mechanism with special options
      const title = `Remove member ${memberToKick.substring(0, 8)}...`;
      const description = JSON.stringify({
        type: "kick",
        reason: reason,
        targetPubkey: memberToKick
      });
      
      // Create a special proposal with kick metadata (use only 3 arguments as expected)
      const proposalId = await daoService.createKickProposal(
        daoId,
        title,
        description
      );
      
      if (proposalId) {
        toast.success("Successfully created kick proposal");
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
  
  // Role/permission check functions
  
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
  
  // Check if user is creator or moderator (has admin privileges)
  const isAdmin = (dao: DAO): boolean => {
    return isCreator(dao) || isModerator(dao);
  };
  
  // Check if creator is the only member (for dao delete validation)
  const isCreatorOnlyMember = (dao: DAO): boolean => {
    return dao.members.length === 1 && dao.members[0] === dao.creator;
  };
  
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
    leaveDAO,
    deleteDAO,
    updateDAOPrivacy,
    updateDAOGuidelines,
    updateDAOTags,
    addDAOModerator,
    removeDAOModerator,
    createDAOInvite,
    createKickProposal,
    voteOnKickProposal,
    // Permission helpers
    isMember,
    isModerator,
    isCreator,
    isAdmin,
    isCreatorOnlyMember,
    // Utils
    currentUserPubkey,
    refreshDaos,
    fetchDaoDetails,
    // Expose these methods for lazy loading
    fetchGeneralDAOs,
    fetchMyDAOs,
    fetchTrendingDAOs
  };
}
