
/**
 * Utility functions for X/Twitter verification using NIP-39
 */

/**
 * Initiate X verification process by opening a tweet composer
 */
export async function initiateXVerification(npub: string): Promise<void> {
  const tweetText = `Verifying my Nostr identity: ${npub}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  
  // Open Twitter intent in a new window
  window.open(tweetUrl, '_blank');
}

/**
 * Extract tweet ID from a tweet URL
 */
export function extractTweetId(tweetUrl: string): string | null {
  // Twitter URL format: https://twitter.com/username/status/1234567890123456789
  // X URL format: https://x.com/username/status/1234567890123456789
  
  try {
    const urlObj = new URL(tweetUrl);
    const pathname = urlObj.pathname;
    
    // Extract tweet ID
    const matches = pathname.match(/\/status\/(\d+)$/);
    if (matches && matches[1]) {
      return matches[1];
    }
    
    return null;
  } catch (error) {
    console.error("Invalid tweet URL:", error);
    return null;
  }
}

/**
 * Verify a tweet contains the required NIP-39 verification content
 * This is a simplified stub implementation
 */
export async function verifyTweet(tweetId: string, npub: string): Promise<{
  success: boolean;
  username: string | null;
}> {
  // In a real implementation, this would call a Twitter API proxy
  // For now, just simulate verification
  console.log(`Verifying tweet ${tweetId} for npub ${npub}`);
  
  // Check if we have a tweet ID in localStorage (for demo purposes)
  const lastTweetUrl = localStorage.getItem('last_tweet_url');
  
  if (lastTweetUrl && lastTweetUrl.includes(tweetId)) {
    // Return a mock success
    return {
      success: true,
      username: 'blocknoster_user'
    };
  }
  
  return {
    success: false,
    username: null
  };
}
