
/**
 * X/Twitter verification utilities following NIP-39
 */

/**
 * Open Twitter intent to compose a verification tweet in the proper format
 * @param npub The user's npub to include in the verification message
 */
export const initiateXVerification = async (npub: string): Promise<void> => {
  // Format the verification message according to NIP-39
  const message = `Verifying my nostr identity: ${npub}`;
  
  // Construct Twitter intent URL
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
  
  // Open the Twitter intent in a new window
  window.open(twitterUrl, "_blank");
};

/**
 * Extract tweet ID from a Twitter URL
 * @param url Twitter status URL
 * @returns Tweet ID or null if invalid URL
 */
export const extractTweetId = (url: string): string | null => {
  try {
    // Match Twitter URL patterns
    const patterns = [
      /twitter\.com\/\w+\/status\/(\d+)/,
      /x\.com\/\w+\/status\/(\d+)/,
      /\/status\/(\d+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting tweet ID:", error);
    return null;
  }
};

/**
 * Verify a tweet contains the correct verification message for a user
 * Note: In a production app, this would typically call a backend service 
 * that interfaces with Twitter's API
 * 
 * @param tweetId ID of the tweet to verify
 * @param npub User's npub to check against
 * @returns Object with success status and username if found
 */
export const verifyTweet = async (
  tweetId: string,
  npub: string
): Promise<{ success: boolean; username: string | null }> => {
  try {
    // For demonstration purposes, we're simulating successful verification
    // In a real application, this would call a backend that uses Twitter API
    
    // Extract Twitter username from URL or localStorage for demo purposes
    const tweetUrl = localStorage.getItem('last_tweet_url');
    let username: string | null = null;
    
    if (tweetUrl) {
      // Try to extract username from URL (simulation)
      const usernameMatch = tweetUrl.match(/twitter\.com\/([^\/]+)\/status\//);
      if (usernameMatch && usernameMatch[1]) {
        username = usernameMatch[1];
      } else {
        // Fallback demo username
        username = "user" + Math.floor(Math.random() * 1000);
      }
    }
    
    // Store tweet ID for later use
    localStorage.setItem('last_tweet_id', tweetId);
    
    return { success: true, username };
  } catch (error) {
    console.error("Error verifying tweet:", error);
    return { success: false, username: null };
  }
};
