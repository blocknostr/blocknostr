
import { NostrEvent } from "@/lib/nostr";
import { Community } from "@/types/community";
import { Dispatch, SetStateAction } from "react";
import { validateCommunityEvent } from "@/lib/nostr/utils/nip/nip172";

/**
 * Handle community events following NIP-172 specification
 */
export const handleCommunityEvent = (
  event: NostrEvent,
  setCommunity: Dispatch<SetStateAction<Community | null>>
): void => {
  try {
    if (!event.id) return;
    
    // Validate this event follows NIP-172
    const validation = validateCommunityEvent(event);
    if (!validation.valid) {
      console.warn("Invalid community event:", validation.errors);
      // Continue processing but log the warning
    }
    
    // Find the unique identifier tag per NIP-172
    const idTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
    if (!idTag) return;
    const uniqueId = idTag[1];
    
    // Parse community data - handle possible empty or malformed content
    let communityData;
    try {
      communityData = event.content ? JSON.parse(event.content) : {};
    } catch (parseError) {
      console.error("Error parsing community JSON:", parseError);
      // Provide minimal fallback data structure if parsing fails
      communityData = {
        name: 'Unnamed Community',
        description: '',
        image: '',
      };
    }
    
    // Get members from tags per NIP-172
    const memberTags = event.tags.filter(tag => tag.length >= 2 && tag[0] === 'p');
    const members = memberTags.map(tag => tag[1]);
    
    // Check for moderator roles in tags per NIP-172
    const moderatorTags = event.tags.filter(tag => 
      tag.length >= 3 && tag[0] === 'p' && tag[2] === 'moderator'
    );
    const moderators = moderatorTags.map(tag => tag[1]);
    
    const community: Community = {
      id: event.id,
      name: communityData.name || 'Unnamed Community',
      description: communityData.description || '',
      image: communityData.image || '',
      creator: event.pubkey || '',
      createdAt: event.created_at,
      members,
      moderators,
      uniqueId,
      isPrivate: communityData.isPrivate || false,
      guidelines: communityData.guidelines || '',
      tags: communityData.tags || []
    };
    
    setCommunity(community);
  } catch (e) {
    console.error("Error processing community event:", e);
  }
};
