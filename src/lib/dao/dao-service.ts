
/**
 * Leave a DAO/community
 */
async leaveDAO(daoId: string): Promise<boolean> {
  try {
    // Get the current user's pubkey
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    // First fetch the DAO to get current data
    const dao = await this.getDAOById(daoId);
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
    const event = await this.getDAOEventById(daoId);
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
    
    await nostrService.publishEvent(eventData);
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
async deleteDAO(daoId: string): Promise<boolean> {
  try {
    // Get the current user's pubkey
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      throw new Error("User not authenticated");
    }
    
    // First fetch the DAO to get current data
    const dao = await this.getDAOById(daoId);
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
    
    await nostrService.publishEvent(eventData);
    console.log(`Successfully deleted DAO ${daoId}`);
    
    // Clear the cache for this DAO
    setTimeout(() => daoCache.clearAll(), 1000);
    
    return true;
  } catch (error) {
    console.error("Error deleting DAO:", error);
    return false;
  }
}
