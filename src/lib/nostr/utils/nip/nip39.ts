
import { NostrEvent } from "../../types";
import { validateNip01Event } from "./nip01";

/**
 * NIP-39: External identity verification utility
 * https://github.com/nostr-protocol/nips/blob/master/39.md
 */

/**
 * Check for X/Twitter verification in profile data using NIP-39 standard
 * @param profileData The profile data object
 * @returns Object with verification status and info
 */
export function checkXVerification(profileData: any): {
  xVerified: boolean;
  xVerifiedInfo: { username: string; tweetId: string } | null;
} {
  if (!profileData) {
    return { xVerified: false, xVerifiedInfo: null };
  }
  
  // First, check for NIP-39 "i" tags in the event
  if (profileData.tags && Array.isArray(profileData.tags)) {
    const twitterTag = profileData.tags.find((tag: any[]) => 
      Array.isArray(tag) && tag.length >= 3 && tag[0] === 'i' && tag[1]?.startsWith('twitter:')
    );
    
    if (twitterTag) {
      const username = twitterTag[1].split(':')[1]; // Extract username from "twitter:username"
      const tweetId = twitterTag[2]; // Tweet ID is in position 2
      
      return {
        xVerified: true,
        xVerifiedInfo: { username, tweetId }
      };
    }
  }
  
  // Fall back to legacy verification if no NIP-39 tag found
  if (profileData.twitter_verified) {
    return {
      xVerified: true,
      xVerifiedInfo: { 
        username: profileData.twitter || '', 
        tweetId: profileData.twitter_proof || '' 
      }
    };
  }
  
  return { xVerified: false, xVerifiedInfo: null };
}

/**
 * Validates external identity verification claim according to NIP-39
 */
export function validateNip39Claim(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic event validation
  const baseValidation = validateNip01Event(event);
  if (!baseValidation.valid) {
    return baseValidation;
  }
  
  // Must be kind 0 (metadata)
  if (event.kind !== 0) {
    errors.push('External identity claim must be in a kind 0 event');
    return { valid: false, errors };
  }
  
  // Look for 'i' tags with proper structure
  const iTags = event.tags.filter(tag => tag[0] === 'i');
  
  if (iTags.length === 0) {
    errors.push('No external identity claims (i tags) found');
    return { valid: false, errors };
  }
  
  for (let i = 0; i < iTags.length; i++) {
    const iTag = iTags[i];
    
    // Tag format should be ['i', '<platform>:<identity>', '<proof>', '<additional-url>?']
    if (iTag.length < 3) {
      errors.push(`Identity tag at index ${i} must have at least a platform:identifier and proof`);
      continue;
    }
    
    // Check platform:identity format
    const platformIdentity = iTag[1];
    if (!platformIdentity.includes(':')) {
      errors.push(`Identity tag at index ${i} has invalid format - must be platform:identifier`);
      continue;
    }
    
    // For Twitter/X claims, verify if the format follows 'twitter:username'
    const [platform, identifier] = platformIdentity.split(':');
    if (platform === 'twitter' && (!identifier || identifier.trim() === '')) {
      errors.push(`Twitter identity tag at index ${i} has invalid username`);
    }
    
    // Proof should be a tweet ID or URL
    const proof = iTag[2];
    if (!proof || proof.trim() === '') {
      errors.push(`Identity tag at index ${i} has invalid proof`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
