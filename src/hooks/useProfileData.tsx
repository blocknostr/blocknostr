
import { useState, useEffect } from 'react';
import { NostrEvent, nostrService, Relay } from '@/lib/nostr';
import { toast } from 'sonner';

interface UseProfileDataProps {
  npub: string | undefined;
  currentUserPubkey: string | null;
}

export function useProfileData({ npub, currentUserPubkey }: UseProfileDataProps) {
  const [profileData, setProfileData] = useState<any | null>(null);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [replies, setReplies] = useState<NostrEvent[]>([]);
  const [media, setMedia] = useState<NostrEvent[]>([]);
  const [reposts, setReposts] = useState<{ 
    originalEvent: NostrEvent; 
    repostEvent: NostrEvent;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [relays, setRelays] = useState<Relay[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [originalPostProfiles, setOriginalPostProfiles] = useState<Record<string, any>>({});
  
  const isCurrentUser = currentUserPubkey && 
                       (npub ? nostrService.getHexFromNpub(npub) === currentUserPubkey : false);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!npub && !currentUserPubkey) return;
      
      try {
        setLoading(true);
        
        // Connect to relays if not already connected
        await nostrService.connectToUserRelays();
        
        // Convert npub to hex if needed
        let hexPubkey = npub || '';
        if (npub && npub.startsWith('npub1')) {
          hexPubkey = nostrService.getHexFromNpub(npub);
        } else if (!npub && currentUserPubkey) {
          hexPubkey = currentUserPubkey;
        }
        
        if (!hexPubkey) {
          toast.error("Invalid profile identifier");
          setLoading(false);
          return;
        }
        
        // Fetch profile metadata directly
        const profileMetadata = await nostrService.getUserProfile(hexPubkey);
        if (profileMetadata) {
          setProfileData(profileMetadata);
        }
        
        // Subscribe to user's notes (kind 1)
        const notesSubId = nostrService.subscribe(
          [
            {
              kinds: [1],
              authors: [hexPubkey],
              limit: 50
            }
          ],
          (event) => {
            setEvents(prev => {
              // Check if we already have this event
              if (prev.some(e => e.id === event.id)) {
                return prev;
              }
              
              // Add new event and sort by creation time (newest first)
              return [...prev, event].sort((a, b) => b.created_at - a.created_at);
            });

            // Check if note contains media
            try {
              if (event.content.includes("https://") && 
                 (event.content.includes(".jpg") || 
                  event.content.includes(".jpeg") || 
                  event.content.includes(".png") || 
                  event.content.includes(".gif"))) {
                setMedia(prev => {
                  if (prev.some(e => e.id === event.id)) return prev;
                  return [...prev, event].sort((a, b) => b.created_at - a.created_at);
                });
              }
            } catch (err) {
              console.error("Error processing media:", err);
            }
          }
        );

        // Subscribe to user's reposts (kind 6)
        const repostsSubId = nostrService.subscribe(
          [
            {
              kinds: [6],
              authors: [hexPubkey],
              limit: 50
            }
          ],
          (repostEvent) => {
            try {
              // Try to parse the content first (some clients store event as JSON)
              let originalEventId: string | null = null;
              let originalEventPubkey: string | null = null;

              try {
                const content = JSON.parse(repostEvent.content);
                if (content.event && content.event.id) {
                  originalEventId = content.event.id;
                  originalEventPubkey = content.event.pubkey;
                }
              } catch (e) {
                // If parsing fails, try to get event reference from tags
                const eventReference = repostEvent.tags.find(tag => tag[0] === 'e');
                if (eventReference && eventReference[1]) {
                  originalEventId = eventReference[1];
                  
                  // Find pubkey reference
                  const pubkeyReference = repostEvent.tags.find(tag => tag[0] === 'p');
                  originalEventPubkey = pubkeyReference ? pubkeyReference[1] : null;
                }
              }

              if (originalEventId) {
                // Fetch the original event
                fetchOriginalPost(originalEventId, originalEventPubkey, repostEvent);
              }
            } catch (error) {
              console.error("Error processing repost:", error);
            }
          }
        );

        // Fetch follower/following data
        const contactsSubId = nostrService.subscribe(
          [
            {
              kinds: [3],
              authors: [hexPubkey],
              limit: 1
            }
          ],
          (event) => {
            try {
              // Extract tags with 'p' which indicate following
              const followingList = event.tags
                .filter(tag => tag[0] === 'p')
                .map(tag => tag[1]);
              
              setFollowing(followingList);
            } catch (e) {
              console.error('Failed to parse contacts:', e);
            }
          }
        );

        // Fetch followers (other users who have this user in their contacts)
        const followersSubId = nostrService.subscribe(
          [
            {
              kinds: [3],
              "#p": [hexPubkey],
              limit: 50
            }
          ],
          (event) => {
            const followerPubkey = event.pubkey;
            setFollowers(prev => {
              if (prev.includes(followerPubkey)) return prev;
              return [...prev, followerPubkey];
            });
          }
        );
        
        setLoading(false);
        
        return () => {
          nostrService.unsubscribe(notesSubId);
          nostrService.unsubscribe(repostsSubId);
          nostrService.unsubscribe(contactsSubId);
          nostrService.unsubscribe(followersSubId);
        };
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Could not load profile data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchProfileData();
    
    // Load relay status if this is the current user
    if (isCurrentUser) {
      const relayStatus = nostrService.getRelayStatus();
      setRelays(relayStatus);
    }
  }, [npub, isCurrentUser, currentUserPubkey]);

  const fetchOriginalPost = (eventId: string, pubkey: string | null, repostEvent: NostrEvent) => {
    // Subscribe to the original event by ID
    const eventSubId = nostrService.subscribe(
      [
        {
          ids: [eventId],
          kinds: [1]
        }
      ],
      (originalEvent) => {
        setReposts(prev => {
          if (prev.some(r => r.originalEvent.id === originalEvent.id)) {
            return prev;
          }
          
          const newRepost = {
            originalEvent,
            repostEvent
          };
          
          return [...prev, newRepost].sort(
            (a, b) => b.repostEvent.created_at - a.repostEvent.created_at
          );
        });
        
        // Fetch profile data for the original author if we don't have it yet
        if (originalEvent.pubkey && !originalPostProfiles[originalEvent.pubkey]) {
          const metadataSubId = nostrService.subscribe(
            [
              {
                kinds: [0],
                authors: [originalEvent.pubkey],
                limit: 1
              }
            ],
            (event) => {
              try {
                const metadata = JSON.parse(event.content);
                setOriginalPostProfiles(prev => ({
                  ...prev,
                  [originalEvent.pubkey]: metadata
                }));
              } catch (e) {
                console.error('Failed to parse profile metadata for repost:', e);
              }
            }
          );
          
          // Cleanup subscription after a short time
          setTimeout(() => {
            nostrService.unsubscribe(metadataSubId);
          }, 5000);
        }
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(eventSubId);
    }, 5000);
  };

  return {
    profileData,
    events,
    replies,
    media,
    reposts,
    loading,
    relays,
    setRelays,
    followers,
    following,
    originalPostProfiles,
    isCurrentUser
  };
}
