
/**
 * Extract pubkeys from content mentions and tags
 */
export const extractMentionedPubkeys = (content: string, tags: string[][]): string[] => {
  const pubkeys: string[] = [];
  
  // Extract from nostr: mentions in content
  const mentionRegex = /nostr:npub([a-z0-9]{59,60})/g;
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    const npub = match[1];
    // Convert npub to hex pubkey
    try {
      const pubkey = npub; // Use getNpubFromHex utility if needed
      pubkeys.push(pubkey);
    } catch (error) {
      console.error("Invalid npub format:", error);
    }
  }
  
  // Extract from p tags (NIP-10)
  if (Array.isArray(tags)) {
    tags.forEach(tag => {
      if (Array.isArray(tag) && tag.length >= 2 && tag[0] === 'p') {
        pubkeys.push(tag[1]);
      }
    });
  }
  
  // Remove duplicates
  return [...new Set(pubkeys)];
};
