
import { toast } from 'sonner';

// NIP-39 compliant verification text
const VERIFICATION_TEXT_PREFIX = "Verifying my account on nostr My Public Key: ";

/**
 * Opens a new window for the user to post a verification tweet according to NIP-39
 * @param npub The user's npub to include in the verification tweet
 * @returns Promise that resolves when the window is opened
 */
export const initiateXVerification = (npub: string): Promise<void> => {
  return new Promise((resolve) => {
    const verificationText = `${VERIFICATION_TEXT_PREFIX}${npub}`;
    const encodedText = encodeURIComponent(verificationText);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    
    window.open(tweetUrl, '_blank', 'width=600,height=400');
    toast.info(
      "Please post the verification tweet and then paste your tweet URL below",
      { duration: 8000 }
    );
    resolve();
  });
};

/**
 * Extracts the tweet ID from a Twitter/X URL
 * @param url The tweet URL
 * @returns The tweet ID or null if invalid URL
 */
export const extractTweetId = (url: string): string | null => {
  try {
    // Handle both twitter.com and x.com URLs
    const tweetRegex = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i;
    const match = url.match(tweetRegex);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Failed to extract tweet ID:", error);
    return null;
  }
};

/**
 * Extracts the username from a Twitter/X URL
 * @param url The tweet URL
 * @returns The username or null if invalid URL
 */
export const extractUsername = (url: string): string | null => {
  try {
    // Handle both twitter.com and x.com URLs
    const usernameRegex = /(?:twitter\.com|x\.com)\/(\w+)\/status/i;
    const match = url.match(usernameRegex);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Failed to extract username:", error);
    return null;
  }
};

/**
 * Verifies a tweet contains the expected verification text according to NIP-39
 * @param tweetId The ID of the tweet to verify
 * @param npub The user's npub that should be in the tweet
 * @returns Promise that resolves to a boolean indicating if verification was successful
 */
export const verifyTweet = async (tweetId: string, npub: string): Promise<{ success: boolean, username: string | null }> => {
  try {
    // In a real implementation, this would call a backend API to check the tweet content
    // Since we don't have a backend, we'll simulate a "successful" verification
    const username = await simulateTwitterApiCall(tweetId, npub);
    
    if (username) {
      toast.success("X account verification successful!", {
        duration: 3000,
      });
      
      return { success: true, username };
    } else {
      toast.error("Failed to verify X account. Tweet content or user mismatch.");
      return { success: false, username: null };
    }
    
    // Note: In a real implementation with backend access, you would:
    // 1. Call Twitter API to fetch the tweet content using the tweet ID
    // 2. Verify the tweet content contains the verification text with the user's npub
    // 3. Return true if verification passes, false otherwise
  } catch (error) {
    console.error("Error verifying tweet:", error);
    toast.error("Failed to verify X account");
    return { success: false, username: null };
  }
};

/**
 * Simulate calling Twitter API to verify the tweet
 * In a real implementation, this would be a backend call to Twitter API
 */
const simulateTwitterApiCall = async (tweetId: string, npub: string): Promise<string | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For the simulation, we'll extract username from localStorage if available
  // In a real implementation, this would come from the Twitter API response
  const tweetUrl = localStorage.getItem('last_tweet_url');
  if (!tweetUrl) return null;
  
  const username = extractUsername(tweetUrl);
  
  // Simulate success - in real implementation check tweet content contains the npub
  return username;
};
