
import { NostrEvent } from "@/lib/nostr";
import { Community } from "@/types/community";
import { Dispatch, SetStateAction } from "react";

export const handleCommunityEvent = (
  event: NostrEvent,
  setCommunity: Dispatch<SetStateAction<Community | null>>
): void => {
  try {
    if (!event.id) return;
    
    // Find the unique identifier tag
    const idTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
    if (!idTag) return;
    const uniqueId = idTag[1];
    
    // Parse community data
    const communityData = JSON.parse(event.content);
    
    // Get members from tags
    const memberTags = event.tags.filter(tag => tag.length >= 2 && tag[0] === 'p');
    const members = memberTags.map(tag => tag[1]);
    
    const community: Community = {
      id: event.id,
      name: communityData.name || 'Unnamed Community',
      description: communityData.description || '',
      image: communityData.image || '',
      creator: event.pubkey || '',
      createdAt: event.created_at,
      members,
      uniqueId
    };
    
    setCommunity(community);
  } catch (e) {
    console.error("Error processing community event:", e);
  }
};
