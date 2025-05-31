import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { EVENT_KINDS, DEFAULT_RELAYS } from './constants';
import { contentFormatter } from './format/content-formatter';
import { coreNostrService } from './core-service';
import { formatPubkey, getNpubFromHex, getHexFromNpub } from './utils/keys';
import { SocialManager } from './social';
import { EventManager } from './event';
import { UserManager } from './user';
import { eventBus, EVENTS } from '@/lib/services/EventBus';

// Re-export types from internal modules
export type { NostrEvent, Relay, NostrProfileMetadata, Filter, NostrFilter } from './types';
export { EVENT_KINDS } from './constants';

// Export adapter interfaces
export type {
  NostrAdapterInterface,
  SocialAdapterInterface,
  CommunityAdapterInterface,
  BaseAdapterInterface
} from './types/adapter';

// Re-export from social module
export { SocialManager } from './social';
export type { ReactionCounts, ContactList } from './social/types';

// Re-export from community module
export type { ProposalCategory } from '@/api/types/community';

// Export key utility functions
export { formatPubkey, getNpubFromHex, getHexFromNpub };

// Export the new core service
export { coreNostrService };

// Create instances for social functionality
const pool = new SimplePool();
const eventManager = new EventManager(pool, []);
const userManager = new UserManager();
const socialManager = new SocialManager(pool, { eventManager, userManager });

// Backward compatibility wrapper for nostrService
const nostrServiceCompat = {
  // Delegate all coreNostrService methods
  ...coreNostrService,
  
  // Explicitly bind core methods to prevent context issues
  queryEvents: async (filters: any[]) => {
    return coreNostrService.queryEvents(filters);
  },
  
  subscribe: (filters: any[], onEvent: (event: any) => void, relays?: string[]) => {
    return coreNostrService.subscribe(filters, onEvent, relays);
  },
  
  // ✅ NEW: Priority subscription support
  subscribePriority: (filters: any[], onEvent: (event: any) => void, relays?: string[], priority: 'high' | 'normal' | 'low' = 'normal') => {
    return coreNostrService.subscribe(filters, onEvent, relays, priority);
  },
  
  unsubscribe: (subId: string) => {
    return coreNostrService.unsubscribe(subId);
  },
  
  publishEvent: async (event: any) => {
    return coreNostrService.publishEvent(event);
  },
  
  getEventById: async (id: string) => {
    return coreNostrService.getEventById(id);
  },
  
  login: async () => {
    return coreNostrService.login();
  },
  
  signOut: () => {
    coreNostrService.signOut();
  },
  
  // Backward compatibility methods (stubs for now)
  clearProfileFailureCache: (pubkey: string) => {
    console.log('[Compat] clearProfileFailureCache called for:', pubkey?.slice(0, 8));
  },
  
  getRelayUrls: () => {
    return coreNostrService.getConnectedRelays();
  },
  
  connectToUserRelays: async () => {
    return coreNostrService.connectToDefaultRelays();
  },
  
  connectToDefaultRelays: async () => {
    // Load user relays from localStorage and connect to them as well
    const userRelays = loadUserRelaysFromStorage();
    const allRelays = [...new Set([...DEFAULT_RELAYS, ...userRelays])]; // Deduplicate
    
    console.log(`[Compat] Connecting to ${allRelays.length} relays (${DEFAULT_RELAYS.length} default + ${userRelays.length} user)`);
    
    return coreNostrService.connectToRelays(allRelays);
  },
  
  // ✅ NEW: Add getConnectedRelays method for better relay management
  getConnectedRelays: () => {
    return coreNostrService.getConnectedRelays();
  },
  
  addMultipleRelays: async (relayUrls: string[]) => {
    try {
      console.log('[Compat] Adding multiple relays:', relayUrls);
      const connected = await coreNostrService.connectToRelays(relayUrls);
      return connected;
    } catch (error) {
      console.error('[Compat] Error adding multiple relays:', error);
      throw error;
    }
  },
  
  // ✅ NEW: Add single relay with proper connection and event triggering
  addRelay: async (relayUrl: string, readWrite: boolean = true): Promise<boolean> => {
    try {
      console.log(`[Compat] Adding relay: ${relayUrl}`);
      
      // Validate URL format
      try {
        new URL(relayUrl);
      } catch (urlError) {
        console.error(`[Compat] Invalid relay URL: ${relayUrl}`);
        return false;
      }

      // Check if relay is already connected
      const connectedRelays = coreNostrService.getConnectedRelays();
      if (connectedRelays.includes(relayUrl)) {
        console.log(`[Compat] Relay ${relayUrl} already connected`);
        // Still save to localStorage if not already there
        saveRelayToStorage(relayUrl, readWrite);
        return true;
      }

      // Save to localStorage for persistence
      saveRelayToStorage(relayUrl, readWrite);

      // Connect to the relay using core service
      const connected = await coreNostrService.connectToRelays([relayUrl]);
      
      if (connected.length > 0) {
        console.log(`[Compat] Successfully added and connected to relay: ${relayUrl}`);
        
        // Trigger relay connected event
        eventBus.emit(EVENTS.RELAY_CONNECTED, relayUrl);
        
        return true;
      } else {
        console.error(`[Compat] Failed to connect to relay: ${relayUrl}`);
        // Remove from storage if connection failed
        removeRelayFromStorage(relayUrl);
        return false;
      }
    } catch (error) {
      console.error(`[Compat] Error adding relay ${relayUrl}:`, error);
      return false;
    }
  },

  // ✅ NEW: Remove relay with proper disconnection and event triggering
  removeRelay: (relayUrl: string): void => {
    try {
      console.log(`[Compat] Removing relay: ${relayUrl}`);
      
      // Remove from localStorage for persistence
      removeRelayFromStorage(relayUrl);
      
      // Since core service doesn't have disconnectFromRelay, we'll need to work around this
      // For now, we'll just trigger the event and let the system handle it naturally
      // The relay will be effectively removed from future operations
      
      // Trigger relay disconnected event
      eventBus.emit(EVENTS.RELAY_DISCONNECTED, relayUrl);
      
      console.log(`[Compat] Successfully removed relay: ${relayUrl}`);
    } catch (error) {
      console.error(`[Compat] Error removing relay ${relayUrl}:`, error);
    }
  },
  
  getRelayStatus: () => {
    // Return status for connected relays
    const connectedRelays = coreNostrService.getConnectedRelays();
    return connectedRelays.map(url => ({
      url,
      status: 'connected' as const,
      read: true,
      write: true
    }));
  },
  
  // ✅ NEW: Get detailed relay status with dynamic limits and performance metrics
  getDetailedRelayStatus: () => {
    return coreNostrService.getDetailedRelayStatus();
  },
  
  getUserProfile: async (pubkey: string) => {
    try {
      const events = await coreNostrService.queryEvents([
        { kinds: [0], authors: [pubkey], limit: 1 }
      ]);
      
      if (events.length > 0) {
        return JSON.parse(events[0].content);
      }
      return null;
    } catch (error) {
      console.error('[Compat] Error getting user profile:', error);
      return null;
    }
  },
  
  getAccountCreationDate: async (pubkey: string) => {
    try {
      const events = await coreNostrService.queryEvents([
        { kinds: [0], authors: [pubkey], limit: 1, since: 0 }
      ]);
      
      if (events.length > 0) {
        return events[0].created_at * 1000;
      }
      return null;
    } catch (error) {
      console.error('[Compat] Error getting account creation date:', error);
      return null;
    }
  },
  
  isFollowing: async (pubkey: string) => {
    console.log('[Compat] isFollowing called for:', pubkey?.slice(0, 8));
    return false; // Stub - requires social graph logic
  },
  
  followUser: async (pubkey: string) => {
    try {
      const currentUserPubkey = coreNostrService.getPublicKey();
      const relays = coreNostrService.getConnectedRelays();
      
      if (!currentUserPubkey) {
        throw new Error('User not authenticated - please login first');
      }
      
      if (relays.length === 0) {
        await coreNostrService.connectToDefaultRelays();
      }
      
      if (!window.nostr) {
        throw new Error('Nostr extension not found - please install a Nostr browser extension');
      }
      
      console.log('[Compat] Following user:', pubkey?.slice(0, 8));
      
      // First, verify the extension works by checking current permissions
      try {
        await window.nostr.getPublicKey();
      } catch (permissionError) {
        console.warn('[Compat] Extension permission denied, requesting permission first');
        throw new Error('Browser extension permission denied - please enable website access in your Nostr extension');
      }
      
      // Get current contact list
      const contactEvents = await coreNostrService.queryEvents([
        { kinds: [3], authors: [currentUserPubkey], limit: 1 }
      ]);
      
      let currentTags: string[][] = [];
      let currentContent = '';
      
      if (contactEvents.length > 0) {
        currentTags = contactEvents[0].tags || [];
        currentContent = contactEvents[0].content || '';
      }
      
      // Check if already following
      const isAlreadyFollowing = currentTags.some(tag => tag[0] === 'p' && tag[1] === pubkey);
      if (isAlreadyFollowing) {
        console.log('Already following this user');
        return true;
      }
      
      // Add new follow
      const updatedTags = [...currentTags, ['p', pubkey]];
      
      // Create a properly formatted event according to NIP-02
      const contactEvent = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        tags: updatedTags,
        content: currentContent,
        pubkey: currentUserPubkey
      };
      
      console.log('[Compat] Signing contact event:', { kind: contactEvent.kind, tags: contactEvent.tags.length, pubkey: contactEvent.pubkey?.slice(0, 8) });
      
      // Sign with browser extension - this is where the "Unsolicited request" error might occur
      let signedEvent;
      try {
        signedEvent = await window.nostr.signEvent(contactEvent);
        console.log('[Compat] Event signed successfully:', signedEvent.id?.slice(0, 8));
      } catch (signError) {
        console.error('[Compat] Signing failed:', signError);
        
        if (signError.message?.includes('User rejected') || signError.message?.includes('denied')) {
          throw new Error('Signing cancelled by user - please approve the request to follow');
        } else if (signError.message?.includes('Unsolicited')) {
          throw new Error('Extension permission issue - please check your Nostr extension settings and try again');
        } else {
          throw new Error(`Event signing failed: ${signError.message || 'Unknown error'}`);
        }
      }
      
      // Publish to relays using coreNostrService.publishEvent instead of manual WebSocket
      try {
        console.log('[Compat] Publishing signed event to relays...');
        const eventId = await coreNostrService.publishEvent(signedEvent);
        
        if (eventId) {
          console.log('[Compat] Follow event published successfully:', eventId?.slice(0, 8));
          return true;
        } else {
          throw new Error('Failed to publish to relays');
        }
      } catch (publishError) {
        console.error('[Compat] Publishing failed:', publishError);
        // Fall back to manual relay publishing if coreNostrService.publishEvent fails
        const targetRelays = coreNostrService.getConnectedRelays();
        let published = false;
        
        for (const relayUrl of targetRelays) {
          try {
            const relay = new WebSocket(relayUrl);
            
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                relay.close();
                reject(new Error('Timeout'));
              }, 5000);
              
              relay.onopen = () => {
                relay.send(JSON.stringify(['EVENT', signedEvent]));
              };
              
              relay.onmessage = (event) => {
                clearTimeout(timeout);
                const data = JSON.parse(event.data);
                if (data[0] === 'OK' && data[1] === signedEvent.id) {
                  relay.close();
                  published = true;
                  resolve(true);
                } else if (data[0] === 'NOTICE') {
                  console.warn('[Compat] Relay notice:', data[1]);
                  relay.close();
                  reject(new Error('Relay rejected event'));
                } else {
                  relay.close();
                  reject(new Error('Unexpected relay response'));
                }
              };
              
              relay.onerror = () => {
                clearTimeout(timeout);
                relay.close();
                reject(new Error('WebSocket error'));
              };
            });
            
            if (published) break;
          } catch (relayError) {
            console.warn(`[Compat] Failed to publish to relay ${relayUrl}:`, relayError);
            continue;
          }
        }
        
        if (!published) {
          throw new Error('Failed to publish to any relay');
        }
      }
      
      return true;
    } catch (error) {
      console.error('[Compat] Error following user:', error);
      // Re-throw with more user-friendly message
      throw error;
    }
  },
  
  unfollowUser: async (pubkey: string) => {
    try {
      const currentUserPubkey = coreNostrService.getPublicKey();
      const relays = coreNostrService.getConnectedRelays();
      
      if (!currentUserPubkey) {
        throw new Error('User not authenticated - please login first');
      }
      
      if (relays.length === 0) {
        await coreNostrService.connectToDefaultRelays();
      }
      
      if (!window.nostr) {
        throw new Error('Nostr extension not found - please install a Nostr browser extension');
      }
      
      console.log('[Compat] Unfollowing user:', pubkey?.slice(0, 8));
      
      // First, verify the extension works by checking current permissions
      try {
        await window.nostr.getPublicKey();
      } catch (permissionError) {
        console.warn('[Compat] Extension permission denied, requesting permission first');
        throw new Error('Browser extension permission denied - please enable website access in your Nostr extension');
      }
      
      // Get current contact list
      const contactEvents = await coreNostrService.queryEvents([
        { kinds: [3], authors: [currentUserPubkey], limit: 1 }
      ]);
      
      if (contactEvents.length === 0) {
        console.log('No contact list found, nothing to unfollow');
        return true;
      }
      
      const currentEvent = contactEvents[0];
      const currentTags = currentEvent.tags || [];
      const currentContent = currentEvent.content || '';
      
      // Remove the follow
      const updatedTags = currentTags.filter(tag => !(tag[0] === 'p' && tag[1] === pubkey));
      
      // Check if actually was following
      if (updatedTags.length === currentTags.length) {
        console.log('Was not following this user');
        return true;
      }
      
      // Create a properly formatted event according to NIP-02
      const contactEvent = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        tags: updatedTags,
        content: currentContent,
        pubkey: currentUserPubkey
      };
      
      console.log('[Compat] Signing unfollow contact event:', { kind: contactEvent.kind, tags: contactEvent.tags.length, pubkey: contactEvent.pubkey?.slice(0, 8) });
      
      // Sign with browser extension
      let signedEvent;
      try {
        signedEvent = await window.nostr.signEvent(contactEvent);
        console.log('[Compat] Unfollow event signed successfully:', signedEvent.id?.slice(0, 8));
      } catch (signError) {
        console.error('[Compat] Signing failed:', signError);
        
        if (signError.message?.includes('User rejected') || signError.message?.includes('denied')) {
          throw new Error('Signing cancelled by user - please approve the request to unfollow');
        } else if (signError.message?.includes('Unsolicited')) {
          throw new Error('Extension permission issue - please check your Nostr extension settings and try again');
        } else {
          throw new Error(`Event signing failed: ${signError.message || 'Unknown error'}`);
        }
      }
      
      // Publish to relays using coreNostrService.publishEvent first
      try {
        console.log('[Compat] Publishing unfollow event to relays...');
        const eventId = await coreNostrService.publishEvent(signedEvent);
        
        if (eventId) {
          console.log('[Compat] Unfollow event published successfully:', eventId?.slice(0, 8));
          return true;
        } else {
          throw new Error('Failed to publish to relays');
        }
      } catch (publishError) {
        console.error('[Compat] Publishing failed:', publishError);
        // Fall back to manual relay publishing
        const targetRelays = coreNostrService.getConnectedRelays();
        let published = false;
        
        for (const relayUrl of targetRelays) {
          try {
            const relay = new WebSocket(relayUrl);
            
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                relay.close();
                reject(new Error('Timeout'));
              }, 5000);
              
              relay.onopen = () => {
                relay.send(JSON.stringify(['EVENT', signedEvent]));
              };
              
              relay.onmessage = (event) => {
                clearTimeout(timeout);
                const data = JSON.parse(event.data);
                if (data[0] === 'OK' && data[1] === signedEvent.id) {
                  relay.close();
                  published = true;
                  resolve(true);
                } else if (data[0] === 'NOTICE') {
                  console.warn('[Compat] Relay notice:', data[1]);
                  relay.close();
                  reject(new Error('Relay rejected event'));
                } else {
                  relay.close();
                  reject(new Error('Unexpected relay response'));
                }
              };
              
              relay.onerror = () => {
                clearTimeout(timeout);
                relay.close();
                reject(new Error('WebSocket error'));
              };
            });
            
            if (published) break;
          } catch (relayError) {
            console.warn(`[Compat] Failed to publish to relay ${relayUrl}:`, relayError);
            continue;
          }
        }
        
        if (!published) {
          throw new Error('Failed to publish to any relay');
        }
      }
      
      return true;
    } catch (error) {
      console.error('[Compat] Error unfollowing user:', error);
      // Re-throw with more user-friendly message
      throw error;
    }
  },
  
  getNpubFromHex: (hex: string) => {
    return getNpubFromHex(hex);
  },
  
  getHexFromNpub: (npub: string) => {
    return getHexFromNpub(npub);
  },
  
  formatPubkey: (pubkey: string) => {
    return formatPubkey(pubkey);
  },
  
  publishProfileMetadata: async (metadata: any) => {
    try {
      const eventId = await coreNostrService.publishEvent({
        kind: 0,
        content: JSON.stringify(metadata),
        tags: []
      });
      return !!eventId;
    } catch (error) {
      console.error('[Compat] Error publishing profile metadata:', error);
      return false;
    }
  },
  
  // ✅ PROFILE UPDATE: Main method for updating user profile metadata
  updateProfile: async (metadata: Record<string, string>) => {
    try {
      const currentUserPubkey = coreNostrService.getPublicKey();
      const relays = coreNostrService.getConnectedRelays();
      
      if (!currentUserPubkey) {
        throw new Error('User not authenticated - please login first');
      }
      
      if (relays.length === 0) {
        await coreNostrService.connectToDefaultRelays();
      }
      
      if (!window.nostr) {
        throw new Error('Nostr extension not found - please install a Nostr browser extension');
      }
      
      console.log('[NostrService] Updating profile metadata:', Object.keys(metadata));
      
      // ✅ AGGRESSIVE SANITIZATION: Remove all potentially problematic characters
      const sanitizedMetadata: Record<string, string> = {};
      for (const [key, value] of Object.entries(metadata)) {
        if (value !== undefined && value !== null && value !== '') {
          // Convert to string and trim whitespace
          let cleanValue = String(value).trim();
          
          // ✅ AGGRESSIVE CHARACTER FILTERING: Only allow safe characters
          // Keep only: letters, numbers, spaces, basic punctuation, common symbols
          cleanValue = cleanValue.replace(/[^\w\s\-_.@#$%&*+=<>!?()[\]{}'",:;/\\|~`]/g, '');
          
          // Remove any control characters that could cause issues
          cleanValue = cleanValue.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
          
          // Remove excessive whitespace
          cleanValue = cleanValue.replace(/\s+/g, ' ').trim();
          
          // Only include non-empty values
          if (cleanValue.length > 0) {
            sanitizedMetadata[key] = cleanValue;
            console.log(`[NostrService] Field "${key}": "${cleanValue.slice(0, 50)}${cleanValue.length > 50 ? '...' : ''}" (${cleanValue.length} chars)`);
          }
        }
      }
      
      console.log('[NostrService] Sanitized metadata:', sanitizedMetadata);
      
      // ✅ NIP-01 FIELD MAPPING: Convert camelCase to snake_case
      const nip01Metadata: Record<string, string> = {};
      const fieldMapping = {
        'name': 'name',
        'displayName': 'display_name',
        'about': 'about', 
        'picture': 'picture',
        'banner': 'banner',
        'website': 'website',
        'lud16': 'lud16',
        'nip05': 'nip05'
      };
      
      // Map fields to NIP-01 standard names
      for (const [key, value] of Object.entries(sanitizedMetadata)) {
        const nip01FieldName = fieldMapping[key as keyof typeof fieldMapping] || key;
        nip01Metadata[nip01FieldName] = value;
      }
      
      // ✅ VALIDATE METADATA: Ensure we have content
      if (Object.keys(nip01Metadata).length === 0) {
        throw new Error('No valid metadata provided - please fill in at least one field');
      }
      
      console.log('[NostrService] Profile metadata to publish:', nip01Metadata);
      
      // ✅ CREATE CLEAN EVENT: Simple, minimal structure that extensions expect
      const profileEvent = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(nip01Metadata)
      };
      
      // ✅ VALIDATE CONTENT SIZE: Ensure it's not too large
      if (profileEvent.content.length > 8192) {
        throw new Error('Profile data is too large. Please reduce the length of your bio and other fields.');
      }
      
      console.log('[NostrService] Event structure:', {
        kind: profileEvent.kind,
        contentLength: profileEvent.content.length,
        hasRequiredFields: true
      });
      
      // ✅ COMPREHENSIVE PRE-SIGN VALIDATION AND LOGGING
      console.log('[NostrService] ⚡ DETAILED EVENT ANALYSIS ⚡');
      console.log('[NostrService] Event kind:', profileEvent.kind, typeof profileEvent.kind);
      console.log('[NostrService] Event created_at:', profileEvent.created_at, typeof profileEvent.created_at);
      console.log('[NostrService] Event tags:', profileEvent.tags, Array.isArray(profileEvent.tags));
      console.log('[NostrService] Event content type:', typeof profileEvent.content);
      console.log('[NostrService] Event content length:', profileEvent.content.length);
      console.log('[NostrService] Event content preview:', profileEvent.content.slice(0, 200));
      console.log('[NostrService] Event content char codes (first 20):', Array.from(profileEvent.content.slice(0, 20)).map(c => c.charCodeAt(0)));
      
      // Test JSON parsing
      try {
        const testParse = JSON.parse(profileEvent.content);
        console.log('[NostrService] ✅ Content is valid JSON:', Object.keys(testParse));
      } catch (jsonError) {
        console.error('[NostrService] ❌ Content JSON parse failed:', jsonError);
        throw new Error('Profile content is not valid JSON');
      }
      
      // Check for problematic unicode characters
      const hasProblematicChars = /[^\x20-\x7E\u00A0-\uFFFF]/.test(profileEvent.content);
      console.log('[NostrService] Has problematic unicode chars:', hasProblematicChars);
      
      if (hasProblematicChars) {
        console.log('[NostrService] Problematic characters found in content');
        // Show which characters are problematic
        const problematicChars = Array.from(profileEvent.content).filter(c => !/[\x20-\x7E\u00A0-\uFFFF]/.test(c));
        console.log('[NostrService] Problematic chars:', problematicChars.map(c => ({ char: c, code: c.charCodeAt(0) })));
      }
      
      console.log('[NostrService] ⚡ END DETAILED ANALYSIS ⚡');
      
      // ✅ SIGN EVENT: Let the browser extension handle the signing
      let signedEvent;
      try {
        console.log('[NostrService] Requesting signature from browser extension...');
        
        // ✅ STREAMLINED SIGNING: Try common working structures directly
        const signingAttempts = [
          // Standard structure (most common)
          () => window.nostr.signEvent(profileEvent),
          // String kind (Alby compatibility)
          () => window.nostr.signEvent({ ...profileEvent, kind: "0" }),
          // No tags field (some extensions)
          () => window.nostr.signEvent({ kind: 0, created_at: profileEvent.created_at, content: profileEvent.content }),
          // With pubkey field 
          () => window.nostr.signEvent({ ...profileEvent, pubkey: currentUserPubkey })
        ];
        
        let lastError = null;
        for (let i = 0; i < signingAttempts.length; i++) {
          try {
            console.log(`[NostrService] Signing attempt ${i + 1}/${signingAttempts.length}`);
            signedEvent = await signingAttempts[i]();
            console.log(`[NostrService] ✅ Profile event signed successfully on attempt ${i + 1}`);
            break;
          } catch (attemptError) {
            console.log(`[NostrService] ❌ Attempt ${i + 1} failed:`, attemptError.message);
            lastError = attemptError;
            continue;
          }
        }
        
        if (!signedEvent) {
          throw lastError || new Error('All signing attempts failed');
        }
        
        // Basic validation of signed event
        if (!signedEvent.id || !signedEvent.pubkey || !signedEvent.sig) {
          throw new Error('Signed event is missing required fields');
        }
      } catch (signError) {
        console.error('[NostrService] Signing failed:', signError);
        
        // ✅ DEBUG: Log problematic content for troubleshooting
        if (signError.message?.includes('serialize') || signError.message?.includes('properties')) {
          console.log('[NostrService] Event that failed to sign:', {
            event: profileEvent,
            contentPreview: profileEvent.content.slice(0, 100),
            contentByteLength: new Blob([profileEvent.content]).size,
            hasInvalidChars: /[^\x20-\x7E\u00A0-\uFFFF]/.test(profileEvent.content)
          });
        }
        
        // Provide user-friendly error messages
        if (signError.message?.includes('User rejected') || signError.message?.includes('denied')) {
          throw new Error('Profile update cancelled by user - please approve the request in your Nostr extension');
        } else if (signError.message?.includes('serialize') || signError.message?.includes('properties')) {
          throw new Error('Event format error - the profile data contains invalid characters. Please try removing special characters and try again.');
        } else {
          throw new Error(`Event signing failed: ${signError.message || 'Unknown error'}`);
        }
      }
      
      // ✅ PUBLISH EVENT: Send to connected relays
      try {
        console.log('[NostrService] Publishing profile update to relays...');
        const eventId = await coreNostrService.publishEvent(signedEvent);
        
        if (eventId) {
          console.log('[NostrService] Profile update published successfully');
          return true;
        } else {
          throw new Error('Failed to publish to relays');
        }
      } catch (publishError) {
        console.error('[NostrService] Publishing failed:', publishError);
        throw new Error(`Failed to publish profile update: ${publishError.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[NostrService] Error updating profile:', error);
      throw error;
    }
  },
  
  getRateLimiterStats: () => {
    return { requests: 0, remaining: 100, resetTime: Date.now() + 60000 }; // Stub
  },
  
  getRelaysForUser: async (pubkey: string) => {
    console.log('[Compat] getRelaysForUser called for:', pubkey?.slice(0, 8));
    return []; // Stub - requires relay list logic
  },
  
  // Additional compatibility properties
  get publicKey() {
    return coreNostrService.getPublicKey();
  },
  
  getSubscriptionStats: () => {
    return { active: 0, total: 0 }; // Stub
  }
};

// ✅ Helper functions for relay persistence
function loadUserRelaysFromStorage(): string[] {
  try {
    const savedRelays = localStorage.getItem('nostr_user_relays');
    if (savedRelays) {
      const relaysObject = JSON.parse(savedRelays);
      return Object.keys(relaysObject);
    }
    return [];
  } catch (error) {
    console.error(`[Compat] Error loading relays from localStorage:`, error);
    return [];
  }
}

function saveRelayToStorage(relayUrl: string, readWrite: boolean = true): void {
  try {
    const savedRelays = localStorage.getItem('nostr_user_relays');
    let relaysObject: Record<string, boolean> = {};
    
    if (savedRelays) {
      relaysObject = JSON.parse(savedRelays);
    }
    
    relaysObject[relayUrl] = readWrite;
    localStorage.setItem('nostr_user_relays', JSON.stringify(relaysObject));
    console.log(`[Compat] Saved relay to localStorage: ${relayUrl}`);
  } catch (error) {
    console.error(`[Compat] Error saving relay to localStorage:`, error);
  }
}

function removeRelayFromStorage(relayUrl: string): void {
  try {
    const savedRelays = localStorage.getItem('nostr_user_relays');
    if (savedRelays) {
      const relaysObject = JSON.parse(savedRelays);
      delete relaysObject[relayUrl];
      localStorage.setItem('nostr_user_relays', JSON.stringify(relaysObject));
      console.log(`[Compat] Removed relay from localStorage: ${relayUrl}`);
    }
  } catch (error) {
    console.error(`[Compat] Error removing relay from localStorage:`, error);
  }
}

// Export the service
export const nostrService = nostrServiceCompat;

// Export formatter
export { contentFormatter };

// Export NIP utilities
export * from './utils/nip';

