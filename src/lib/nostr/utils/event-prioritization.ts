
import { NostrEvent } from "../types";

/**
 * Utility for scoring and prioritizing events for better feed quality
 */
export const eventPrioritization = {
  /**
   * Score a NostrEvent based on various quality factors
   * Higher score = higher priority in feed
   * 
   * @param event The event to score
   * @returns A numerical score (0-100)
   */
  scoreEvent(event: NostrEvent): number {
    if (!event) return 0;
    
    let score = 50; // Base score
    
    // Factor 1: Has content with reasonable length
    if (event.content) {
      if (event.content.length > 20) score += 5;
      if (event.content.length > 100) score += 3;
      if (event.content.length > 300) score -= 5; // Very long posts might be less engaging
    } else {
      score -= 10; // No content is a red flag
    }
    
    // Factor 2: Has media
    if (event.tags?.some(tag => 
      tag[0] === 'image' || 
      tag[0] === 'media' || 
      (tag[0] === 'r' && /\.(jpg|jpeg|png|gif|webp|mp4)$/i.test(tag[1]))
    )) {
      score += 10; // Media posts tend to be more engaging
    }
    
    // Factor 3: Recency (events within last 3 hours get bonus)
    const threeHoursAgo = Math.floor(Date.now() / 1000) - (3 * 60 * 60);
    if (event.created_at && event.created_at > threeHoursAgo) {
      score += 7;
    }
    
    // Factor 4: Has reasonable tag count (not spam)
    const tagCount = event.tags?.length || 0;
    if (tagCount > 0 && tagCount <= 10) {
      score += 3;
    } else if (tagCount > 20) {
      score -= 8; // Too many tags might indicate spam
    }
    
    // Factor 5: Has p tags (mentions others - might be more engaging)
    if (event.tags?.some(tag => tag[0] === 'p')) {
      score += 5;
    }
    
    // Factor 6: Has e tags (replies/references - might be part of conversation)
    if (event.tags?.some(tag => tag[0] === 'e')) {
      score += 3;
    }
    
    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, score));
  },
  
  /**
   * Sort events by priority score
   * 
   * @param events Array of events to sort
   * @returns Sorted array with highest priority events first
   */
  prioritizeEvents(events: NostrEvent[]): NostrEvent[] {
    if (!events || events.length === 0) return [];
    
    // Score all events
    const scoredEvents = events.map(event => ({
      event,
      score: this.scoreEvent(event)
    }));
    
    // Sort by score (highest first)
    scoredEvents.sort((a, b) => b.score - a.score);
    
    // Return just the events in prioritized order
    return scoredEvents.map(item => item.event);
  }
};

export default eventPrioritization;
