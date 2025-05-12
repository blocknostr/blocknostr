
/**
 * Utility for handling NIP-36 content warnings
 * Implements NIP-36 (Sensitive Content)
 * 
 * @deprecated Use the nip36 module directly instead
 */

import {
  hasContentWarning,
  getContentWarningReasons,
  addContentWarning
} from './nip/nip36';

export class ContentWarningUtils {
  /**
   * Check if an event has a content warning tag
   * @param event Nostr event to check
   * @returns Boolean indicating if event has content warning
   * @deprecated Use hasContentWarning from nip36 directly
   */
  static hasContentWarning = hasContentWarning;
  
  /**
   * Get content warning reasons from an event
   * @param event Nostr event to check
   * @returns Array of content warning reasons or empty array if none
   * @deprecated Use getContentWarningReasons from nip36 directly
   */
  static getContentWarningReasons = getContentWarningReasons;
  
  /**
   * Add content warning tag to event
   * @param event Event to modify
   * @param reason Optional reason for the content warning
   * @returns Modified event with content warning
   * @deprecated Use addContentWarning from nip36 directly
   */
  static addContentWarning = addContentWarning;
}
