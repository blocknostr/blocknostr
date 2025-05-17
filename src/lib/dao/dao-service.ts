
import { nostrService } from "@/lib/nostr";
import { daoCache } from "./dao-cache";
import { DAO_KINDS, EventKinds } from "@/lib/nostr/constants";
import { DAO, DAOProposal } from "@/types/dao";

/**
 * Leave a DAO/community
 */
async function leaveDAO(daoId: string): Promise<boolean> {
  try {
    // Get the current user's pubkey
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    // First fetch the DAO to get current data
    const dao = await getDAOById(daoId);
    if (!dao) {
      console.error("DAO not found:", daoId);
      throw new Error("DAO not found");
    }
    
    // Check if user is a member
    if (!dao.members.includes(pubkey)) {
      console.log("Not a member of this DAO");
      return false;
    }
    
    // Cannot leave if creator
    if (dao.creator === pubkey) {
      console.error("Creator cannot leave DAO");
      throw new Error("As the creator, you cannot leave your own DAO. Transfer ownership or delete it instead.");
    }
    
    console.log(`User ${pubkey} leaving DAO ${daoId}`);
    
    // Extract the unique identifier from d tag if available
    let uniqueId = daoId;
    const event = await getDAOEventById(daoId);
    if (event) {
      const dTag = event.tags.find(tag => tag[0] === 'd');
      if (dTag && dTag[1]) {
        uniqueId = dTag[1];
      }
    }
    
    // Remove user from members list
    const updatedMembers = dao.members.filter(member => member !== pubkey);
    
    // Also remove from moderators if applicable
    const updatedModerators = dao.moderators.filter(mod => mod !== pubkey);
    
    // Create updated DAO data
    const updatedData = {
      name: dao.name,
      description: dao.description,
      creator: dao.creator,
      createdAt: dao.createdAt,
      image: dao.image,
      treasury: dao.treasury,
      proposals: dao.proposals,
      activeProposals: dao.activeProposals,
      tags: dao.tags,
      guidelines: dao.guidelines,
      isPrivate: dao.isPrivate
    };
    
    // NIP-72 compliant event for leaving
    const eventData = {
      kind: DAO_KINDS.COMMUNITY,
      content: JSON.stringify(updatedData),
      tags: [
        ["d", uniqueId], // Same unique identifier
        ...updatedMembers.map(member => ["p", member]), // Include remaining members
        ...updatedModerators.map(mod => ["p", mod, "moderator"]) // Include remaining moderators
      ]
    };
    
    console.log("Publishing leave DAO event:", eventData);
    
    const result = await nostrService.publishEvent(eventData);
    console.log(`Successfully left DAO ${daoId}`);
    
    return true;
  } catch (error) {
    console.error("Error leaving DAO:", error);
    return false;
  }
}

/**
 * Delete a DAO (creator only)
 */
async function deleteDAO(daoId: string): Promise<boolean> {
  try {
    // Get the current user's pubkey
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    // First fetch the DAO to get current data
    const dao = await getDAOById(daoId);
    if (!dao) {
      console.error("DAO not found:", daoId);
      throw new Error("DAO not found");
    }
    
    // Only creator can delete
    if (dao.creator !== pubkey) {
      console.error("Only creator can delete DAO");
      throw new Error("Only the creator can delete this DAO");
    }
    
    // Can only delete if creator is the only member
    if (dao.members.length !== 1 || dao.members[0] !== pubkey) {
      console.error("Cannot delete DAO with other members");
      throw new Error("You can only delete the DAO if you're the only member");
    }
    
    console.log(`Creator ${pubkey} deleting DAO ${daoId}`);
    
    // Publish a deletion event
    // There's no standard NIP for deletion, but we can use a special content flag
    const deletionData = {
      deleted: true,
      deletedAt: Math.floor(Date.now() / 1000),
      deletedBy: pubkey,
      originalName: dao.name
    };
    
    const eventData = {
      kind: DAO_KINDS.COMMUNITY,
      content: JSON.stringify(deletionData),
      tags: [
        ["e", daoId, "deleted"], // Reference to deleted event
        ["d", `deleted_${daoId.substring(0, 10)}_${Math.floor(Date.now() / 1000)}`] // New unique ID
      ]
    };
    
    console.log("Publishing DAO deletion event:", eventData);
    
    const result = await nostrService.publishEvent(eventData);
    console.log(`Successfully deleted DAO ${daoId}`);
    
    // Clear the cache for this DAO
    setTimeout(() => daoCache.clearAll(), 1000);
    
    return true;
  } catch (error) {
    console.error("Error deleting DAO:", error);
    return false;
  }
}

/**
 * Get DAO by ID
 */
async function getDAOById(daoId: string): Promise<DAO | null> {
  try {
    return await daoCache.getItem(daoId, async () => {
      const event = await nostrService.getEventById(daoId);
      if (!event) {
        console.warn(`DAO event not found: ${daoId}`);
        return null;
      }
      
      const dao = parseDAOEvent(event);
      if (!dao) {
        console.warn(`Could not parse DAO event: ${daoId}`);
        return null;
      }
      
      return dao;
    });
  } catch (error) {
    console.error(`Error fetching DAO ${daoId}:`, error);
    return null;
  }
}

/**
 * Get DAO event by ID
 */
async function getDAOEventById(daoId: string) {
  try {
    return await nostrService.getEventById(daoId);
  } catch (error) {
    console.error(`Error fetching DAO event ${daoId}:`, error);
    return null;
  }
}

/**
 * Get all DAOs
 */
async function getDAOs(): Promise<DAO[]> {
  try {
    const events = await nostrService.getEvents({
      filter: {
        kinds: [DAO_KINDS.COMMUNITY],
        limit: 100
      }
    });
    
    const daos = events.map(event => parseDAOEvent(event)).filter(Boolean) as DAO[];
    
    // Sort by creation date (newest first)
    daos.sort((a, b) => b.createdAt - a.createdAt);
    
    // Assign serial numbers based on creation date
    daos.forEach((dao, index) => {
      dao.serialNumber = index + 1;
    });
    
    return daos;
  } catch (error) {
    console.error("Error fetching DAOs:", error);
    return [];
  }
}

/**
 * Get DAOs created by a specific user
 */
async function getUserDAOs(pubkey: string): Promise<DAO[]> {
  try {
    const events = await nostrService.getEvents({
      filter: {
        kinds: [DAO_KINDS.COMMUNITY],
        authors: [pubkey],
        limit: 100
      }
    });
    
    const daos = events.map(event => parseDAOEvent(event)).filter(Boolean) as DAO[];
    
    // Sort by creation date (newest first)
    daos.sort((a, b) => b.createdAt - a.createdAt);
    
    return daos;
  } catch (error) {
    console.error(`Error fetching DAOs for user ${pubkey}:`, error);
    return [];
  }
}

/**
 * Get trending DAOs (most members)
 */
async function getTrendingDAOs(): Promise<DAO[]> {
  try {
    const daos = await getDAOs();
    
    // Sort by number of members (descending)
    daos.sort((a, b) => b.members.length - a.members.length);
    
    return daos.slice(0, 10); // Top 10
  } catch (error) {
    console.error("Error fetching trending DAOs:", error);
    return [];
  }
}

/**
 * Create a new DAO/community
 */
async function createDAO(name: string, description: string, tags: string[] = []): Promise<string | null> {
  try {
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    // Basic DAO data
    const daoData = {
      name,
      description,
      image: "",
      creator: pubkey,
      createdAt: now,
      members: [pubkey],
      moderators: [],
      treasury: {
        balance: 0,
        tokenSymbol: "NSTR"
      },
      proposals: 0,
      activeProposals: 0,
      tags: tags,
      guidelines: "",
      isPrivate: false
    };
    
    // NIP-72 compliant event
    const eventData = {
      kind: DAO_KINDS.COMMUNITY,
      content: JSON.stringify(daoData),
      tags: [
        ["d", now.toString()], // Unique identifier (timestamp)
        ["p", pubkey, "creator"], // Creator pubkey
        ...tags.map(tag => ["t", tag]) // Add tags
      ]
    };
    
    console.log("Publishing create DAO event:", eventData);
    
    const eventResult = await nostrService.publishEvent(eventData);
    
    if (eventResult && typeof eventResult === 'object' && eventResult.id) {
      console.log(`Successfully created DAO ${name} with ID ${eventResult.id}`);
      return eventResult.id;
    } else {
      console.error("Failed to create DAO");
      return null;
    }
  } catch (error) {
    console.error("Error creating DAO:", error);
    return null;
  }
}

/**
 * Update DAO metadata (privacy, guidelines, tags)
 */
async function updateDAOMetadata(
  daoId: string,
  update: { type: "privacy" | "guidelines" | "tags"; isPrivate?: boolean; content?: string | string[] }
): Promise<boolean> {
  try {
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    // Fetch existing DAO data
    const dao = await getDAOById(daoId);
    if (!dao) {
      console.error("DAO not found:", daoId);
      return false;
    }
    
    // Only creator can update metadata
    if (dao.creator !== pubkey) {
      console.error("Only creator can update DAO metadata");
      return false;
    }
    
    // Extract the unique identifier from d tag if available
    let uniqueId = daoId;
    const event = await getDAOEventById(daoId);
    if (event) {
      const dTag = event.tags.find(tag => tag[0] === 'd');
      if (dTag && dTag[1]) {
        uniqueId = dTag[1];
      }
    }
    
    // Update data based on type
    let updatedData = { ...dao };
    
    if (update.type === "privacy") {
      updatedData.isPrivate = update.isPrivate ?? false;
    } else if (update.type === "guidelines") {
      updatedData.guidelines = update.content as string ?? "";
    } else if (update.type === "tags") {
      updatedData.tags = update.content as string[] ?? [];
    }
    
    // NIP-72 compliant event for metadata update
    const eventData = {
      kind: DAO_KINDS.COMMUNITY,
      content: JSON.stringify(updatedData),
      tags: [
        ["d", uniqueId], // Same unique identifier
        ...dao.members.map(member => ["p", member]), // Include existing members
        ...dao.moderators.map(mod => ["p", mod, "moderator"]), // Include existing moderators
        ...updatedData.tags.map(tag => ["t", tag]) // Updated tags
      ]
    };
    
    console.log("Publishing update DAO metadata event:", eventData);
    
    const result = await nostrService.publishEvent(eventData);
    console.log(`Successfully updated DAO ${daoId} metadata`);
    
    // Clear the cache for this DAO
    setTimeout(() => daoCache.clearItem(daoId), 1000);
    
    return true;
  } catch (error) {
    console.error("Error updating DAO metadata:", error);
    return false;
  }
}

/**
 * Update DAO roles (add/remove moderator)
 */
async function updateDAORoles(
  daoId: string,
  update: { role: "moderator"; action: "add" | "remove"; pubkey: string }
): Promise<boolean> {
  try {
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    // Fetch existing DAO data
    const dao = await getDAOById(daoId);
    if (!dao) {
      console.error("DAO not found:", daoId);
      return false;
    }
    
    // Only creator can update roles
    if (dao.creator !== pubkey) {
      console.error("Only creator can update DAO roles");
      return false;
    }
    
    // Extract the unique identifier from d tag if available
    let uniqueId = daoId;
    const event = await getDAOEventById(daoId);
    if (event) {
      const dTag = event.tags.find(tag => tag[0] === 'd');
      if (dTag && dTag[1]) {
        uniqueId = dTag[1];
      }
    }
    
    let updatedModerators = [...dao.moderators];
    
    if (update.role === "moderator") {
      if (update.action === "add") {
        updatedModerators.push(update.pubkey);
      } else if (update.action === "remove") {
        updatedModerators = updatedModerators.filter(mod => mod !== update.pubkey);
      }
    }
    
    // Create updated DAO data
    const updatedData = {
      name: dao.name,
      description: dao.description,
      creator: dao.creator,
      createdAt: dao.createdAt,
      image: dao.image,
      treasury: dao.treasury,
      proposals: dao.proposals,
      activeProposals: dao.activeProposals,
      tags: dao.tags,
      guidelines: dao.guidelines,
      isPrivate: dao.isPrivate
    };
    
    // NIP-72 compliant event for roles update
    const eventData = {
      kind: DAO_KINDS.COMMUNITY,
      content: JSON.stringify(updatedData),
      tags: [
        ["d", uniqueId], // Same unique identifier
        ...dao.members.map(member => ["p", member]), // Include existing members
        ...updatedModerators.map(mod => ["p", mod, "moderator"]), // Updated moderators
        ...dao.tags.map(tag => ["t", tag]) // Keep existing tags
      ]
    };
    
    console.log("Publishing update DAO roles event:", eventData);
    
    const result = await nostrService.publishEvent(eventData);
    console.log(`Successfully updated DAO ${daoId} roles`);
    
    // Clear the cache for this DAO
    setTimeout(() => daoCache.clearItem(daoId), 1000);
    
    return true;
  } catch (error) {
    console.error("Error updating DAO roles:", error);
    return false;
  }
}

/**
 * Create a new proposal
 */
async function createProposal(
  daoId: string,
  title: string,
  description: string,
  options: string[],
  durationDays: number = 7
): Promise<string | null> {
  try {
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    const now = Math.floor(Date.now() / 1000);
    const endsAt = now + (durationDays * 24 * 60 * 60); // Ends in X days
    
    // Basic proposal data
    const proposalData: Omit<DAOProposal, 'id' | 'votes' | 'status'> = {
      daoId,
      title,
      description,
      options,
      createdAt: now,
      endsAt,
      creator: pubkey
    };
    
    // NIP-72 compliant event
    const eventData = {
      kind: DAO_KINDS.PROPOSAL,
      content: JSON.stringify(proposalData),
      tags: [
        ["e", daoId, "root"], // Reference to community
        ["p", pubkey, "creator"], // Creator pubkey
        ...options.map((option, index) => ["o", option, index.toString()]) // Voting options
      ]
    };
    
    console.log("Publishing create proposal event:", eventData);
    
    const eventResult = await nostrService.publishEvent(eventData);
    
    if (eventResult && typeof eventResult === 'object' && eventResult.id) {
      console.log(`Successfully created proposal ${title} with ID ${eventResult.id}`);
      return eventResult.id;
    } else {
      console.error("Failed to create proposal");
      return null;
    }
  } catch (error) {
    console.error("Error creating proposal:", error);
    return null;
  }
}

/**
 * Create a kick proposal
 */
async function createKickProposal(
  daoId: string,
  memberToKick: string,
  reason: string
): Promise<boolean> {
  try {
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    const now = Math.floor(Date.now() / 1000);
    const endsAt = now + (7 * 24 * 60 * 60); // Ends in 7 days
    
    // Basic proposal data
    const proposalData: Omit<DAOProposal, 'id' | 'votes' | 'status'> = {
      daoId,
      title: `Kick ${memberToKick.substring(0, 8)}...?`,
      description: `Reason: ${reason}`,
      options: ["Yes", "No"],
      createdAt: now,
      endsAt,
      creator: pubkey
    };
    
    // NIP-72 compliant event
    const eventData = {
      kind: DAO_KINDS.PROPOSAL,
      content: JSON.stringify(proposalData),
      tags: [
        ["e", daoId, "root"], // Reference to community
        ["p", pubkey, "creator"], // Creator pubkey
        ["p", memberToKick, "kick"], // Member to kick
        ["reason", reason], // Reason for kick
        ...proposalData.options.map((option, index) => ["o", option, index.toString()]) // Voting options
      ]
    };
    
    console.log("Publishing create kick proposal event:", eventData);
    
    const eventResult = await nostrService.publishEvent(eventData);
    
    if (eventResult && typeof eventResult === 'object' && eventResult.id) {
      console.log(`Successfully created kick proposal for ${memberToKick} with ID ${eventResult.id}`);
      return true;
    } else {
      console.error("Failed to create kick proposal");
      return false;
    }
  } catch (error) {
    console.error("Error creating kick proposal:", error);
    return false;
  }
}

/**
 * Vote on a proposal
 */
async function voteOnProposal(proposalId: string, optionIndex: number): Promise<boolean> {
  try {
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    // Voting event
    const eventData = {
      kind: DAO_KINDS.VOTE,
      content: JSON.stringify({
        proposalId,
        voter: pubkey,
        optionIndex
      }),
      tags: [
        ["e", proposalId, "proposal"], // Reference to proposal
        ["p", pubkey, "voter"], // Voter pubkey
        ["option", optionIndex.toString()] // Selected option
      ]
    };
    
    console.log("Publishing vote event:", eventData);
    
    const result = await nostrService.publishEvent(eventData);
    console.log(`Successfully voted on proposal ${proposalId}`);
    
    return true;
  } catch (error) {
    console.error("Error voting on proposal:", error);
    return false;
  }
}

/**
 * Get proposals for a specific DAO
 */
async function getDAOProposals(daoId: string): Promise<DAOProposal[]> {
  try {
    const events = await nostrService.getEvents({
      filter: {
        kinds: [DAO_KINDS.PROPOSAL],
        "#e": [daoId], // Proposals for this DAO
        limit: 100
      }
    });
    
    const proposals = events.map(event => parseProposalEvent(event)).filter(Boolean) as DAOProposal[];
    
    // Sort by creation date (newest first)
    proposals.sort((a, b) => b.createdAt - a.createdAt);
    
    return proposals;
  } catch (error) {
    console.error(`Error fetching proposals for DAO ${daoId}:`, error);
    return [];
  }
}

/**
 * Get kick proposals for a specific DAO
 */
async function getDAOKickProposals(daoId: string): Promise<DAOProposal[]> {
  try {
    const events = await nostrService.getEvents({
      filter: {
        kinds: [DAO_KINDS.PROPOSAL],
        "#e": [daoId], // Proposals for this DAO
        "#reason": [], // Kick proposals with a reason tag
        limit: 100
      }
    });
    
    const proposals = events.map(event => parseProposalEvent(event)).filter(Boolean) as DAOProposal[];
    
    // Sort by creation date (newest first)
    proposals.sort((a, b) => b.createdAt - a.createdAt);
    
    return proposals;
  } catch (error) {
    console.error(`Error fetching kick proposals for DAO ${daoId}:`, error);
    return [];
  }
}

/**
 * Join a DAO/community
 */
async function joinDAO(daoId: string): Promise<boolean> {
  try {
    // Get the current user's pubkey
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    // First fetch the DAO to get current data
    const dao = await getDAOById(daoId);
    if (!dao) {
      console.error("DAO not found:", daoId);
      throw new Error("DAO not found");
    }
    
    // Check if user is already a member
    if (dao.members.includes(pubkey)) {
      console.log("Already a member of this DAO");
      return false;
    }
    
    console.log(`User ${pubkey} joining DAO ${daoId}`);
    
    // Extract the unique identifier from d tag if available
    let uniqueId = daoId;
    const event = await getDAOEventById(daoId);
    if (event) {
      const dTag = event.tags.find(tag => tag[0] === 'd');
      if (dTag && dTag[1]) {
        uniqueId = dTag[1];
      }
    }
    
    // Add user to members list
    const updatedMembers = [...dao.members, pubkey];
    
    // Create updated DAO data
    const updatedData = {
      name: dao.name,
      description: dao.description,
      creator: dao.creator,
      createdAt: dao.createdAt,
      image: dao.image,
      treasury: dao.treasury,
      proposals: dao.proposals,
      activeProposals: dao.activeProposals,
      tags: dao.tags,
      guidelines: dao.guidelines,
      isPrivate: dao.isPrivate
    };
    
    // NIP-72 compliant event for joining
    const eventData = {
      kind: DAO_KINDS.COMMUNITY,
      content: JSON.stringify(updatedData),
      tags: [
        ["d", uniqueId], // Same unique identifier
        ...updatedMembers.map(member => ["p", member]), // Include updated members
        ...dao.moderators.map(mod => ["p", mod, "moderator"]) // Include existing moderators
      ]
    };
    
    console.log("Publishing join DAO event:", eventData);
    
    const result = await nostrService.publishEvent(eventData);
    console.log(`Successfully joined DAO ${daoId}`);
    
    return true;
  } catch (error) {
    console.error("Error joining DAO:", error);
    return false;
  }
}

/**
 * Create DAO invite
 */
async function createDAOInvite(daoId: string): Promise<string | null> {
  try {
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    const now = Math.floor(Date.now() / 1000);
    const inviteId = `dao-invite-${daoId.substring(0, 10)}-${now}`;
    
    // Invite event (custom kind)
    const eventData = {
      kind: DAO_KINDS.INVITE,
      content: JSON.stringify({
        daoId,
        creator: pubkey,
        createdAt: now
      }),
      tags: [
        ["e", daoId, "root"], // Reference to community
        ["p", pubkey, "creator"] // Creator pubkey
      ]
    };
    
    console.log("Publishing DAO invite event:", eventData);
    
    const eventResult = await nostrService.publishEvent(eventData);
    
    if (eventResult && typeof eventResult === 'object' && eventResult.id) {
      console.log(`Successfully created invite for DAO ${daoId} with ID ${eventResult.id}`);
      return eventResult.id;
    } else {
      console.error("Failed to create invite");
      return null;
    }
  } catch (error) {
    console.error("Error creating DAO invite:", error);
    return null;
  }
}

/**
 * Parse a DAO event into a DAO object
 */
function parseDAOEvent(event: any): DAO | null {
  try {
    const content = JSON.parse(event.content);
    
    // Ensure required fields are present
    if (!content.name || !content.description || !content.creator || !content.createdAt) {
      console.warn("Missing required fields in DAO event content");
      return null;
    }
    
    const dao: DAO = {
      id: event.id,
      name: content.name,
      description: content.description,
      image: content.image || "",
      creator: content.creator,
      createdAt: content.createdAt,
      members: content.members || [],
      moderators: content.moderators || [],
      treasury: content.treasury || { balance: 0, tokenSymbol: "NSTR" },
      proposals: content.proposals || 0,
      activeProposals: content.activeProposals || 0,
      tags: content.tags || [],
      guidelines: content.guidelines || "",
      isPrivate: content.isPrivate || false
    };
    
    return dao;
  } catch (error) {
    console.error("Error parsing DAO event:", error);
    return null;
  }
}

/**
 * Parse a proposal event into a DAOProposal object
 */
function parseProposalEvent(event: any): DAOProposal | null {
  try {
    const content = JSON.parse(event.content);
    
    // Ensure required fields are present
    if (!content.daoId || !content.title || !content.description || !content.options || !content.createdAt || !content.endsAt || !content.creator) {
      console.warn("Missing required fields in proposal event content");
      return null;
    }
    
    const proposal: DAOProposal = {
      id: event.id,
      daoId: content.daoId,
      title: content.title,
      description: content.description,
      options: content.options,
      createdAt: content.createdAt,
      endsAt: content.endsAt,
      creator: content.creator,
      votes: {}, // Initialize empty votes object
      status: "active" // Default status
    };
    
    return proposal;
  } catch (error) {
    console.error("Error parsing proposal event:", error);
    return null;
  }
}

// Export the functions as part of the daoService
export const daoService = {
  leaveDAO,
  deleteDAO,
  getDAOById,
  getDAOEventById,
  getDAOs,
  getUserDAOs,
  getTrendingDAOs,
  createDAO,
  updateDAOMetadata,
  updateDAORoles,
  createProposal,
  createKickProposal,
  voteOnProposal,
  getDAOProposals,
  getDAOKickProposals,
  joinDAO,
  createDAOInvite
};
