
import { useState, useEffect } from "react";
import { nostrService, NostrEvent } from "@/lib/nostr";
import { EnhancedNotification } from "@/types/notification";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [interactionNotifications, setInteractionNotifications] = useState<EnhancedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [interactionsLoading, setInteractionsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [userInteractions, setUserInteractions] = useState<string[]>([]);
  
  // Fetch user's interactions (posts they've liked, replied to, etc.)
  useEffect(() => {
    const fetchUserInteractions = async () => {
      if (!nostrService.publicKey) {
        return;
      }
      
      await nostrService.connectToUserRelays();
      
      // Fetch user's interactions (replies, likes, reposts)
      const subId = nostrService.subscribe(
        [
          {
            kinds: [1, 7], // text notes and reactions
            authors: [nostrService.publicKey],
            limit: 50,
          }
        ],
        (event) => {
          // For replies and reactions, extract the original post IDs
          if (event.kind === 1) { // Text note (could be a reply)
            const replyToEvent = event.tags.find(tag => tag[0] === 'e');
            if (replyToEvent && replyToEvent[1]) {
              setUserInteractions(prev => {
                if (prev.includes(replyToEvent[1])) return prev;
                return [...prev, replyToEvent[1]];
              });
            }
          } else if (event.kind === 7) { // Reaction
            const reactedToEvent = event.tags.find(tag => tag[0] === 'e');
            if (reactedToEvent && reactedToEvent[1]) {
              setUserInteractions(prev => {
                if (prev.includes(reactedToEvent[1])) return prev;
                return [...prev, reactedToEvent[1]];
              });
            }
          }
        }
      );
      
      // Cleanup subscription after a reasonable time
      setTimeout(() => {
        nostrService.unsubscribe(subId);
      }, 8000);
    };
    
    fetchUserInteractions();
  }, []);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!nostrService.publicKey) {
        setLoading(false);
        setInteractionsLoading(false);
        return;
      }
      
      await nostrService.connectToUserRelays();
      
      // Subscribe to mentions of the current user
      const subId = nostrService.subscribe(
        [
          {
            kinds: [1], // text notes
            "#p": [nostrService.publicKey], // with mentions of current user
            limit: 20,
          }
        ],
        (event) => {
          const enhancedEvent = {
            ...event,
            notificationType: "mention" as const
          };
          
          setNotifications(prev => {
            // Check if we already have this notification
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            
            // Add new notification and sort by creation time (newest first)
            return [...prev, enhancedEvent].sort((a, b) => b.created_at - a.created_at);
          });
          
          // Fetch profile data for this pubkey if we don't have it yet
          if (event.pubkey && !profiles[event.pubkey]) {
            fetchProfileData(event.pubkey);
          }
        }
      );

      // After a short delay, start checking for interactions on posts
      setTimeout(() => {
        setLoading(false);
        fetchInteractionNotifications();
      }, 1000);
      
      return () => {
        nostrService.unsubscribe(subId);
      };
    };
    
    const fetchInteractionNotifications = () => {
      if (userInteractions.length === 0) {
        setInteractionsLoading(false);
        return;
      }
      
      // Subscribe to events that reference posts the user has interacted with
      const interactionSubId = nostrService.subscribe(
        [
          {
            kinds: [1], // text notes
            "#e": userInteractions,
            limit: 20,
          }
        ],
        (event) => {
          // Skip events by the current user
          if (event.pubkey === nostrService.publicKey) {
            return;
          }
          
          const enhancedEvent = {
            ...event,
            notificationType: "interaction" as const
          };
          
          setInteractionNotifications(prev => {
            // Check if we already have this notification
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            
            // Add new notification and sort by creation time (newest first)
            return [...prev, enhancedEvent].sort((a, b) => b.created_at - a.created_at);
          });
          
          // Fetch profile data for this pubkey if we don't have it yet
          if (event.pubkey && !profiles[event.pubkey]) {
            fetchProfileData(event.pubkey);
          }
        }
      );
      
      setInteractionsLoading(false);
      
      // Cleanup subscription after a reasonable time
      setTimeout(() => {
        nostrService.unsubscribe(interactionSubId);
      }, 8000);
    };
    
    const fetchProfileData = (pubkey: string) => {
      const metadataSubId = nostrService.subscribe(
        [
          {
            kinds: [0],
            authors: [pubkey],
            limit: 1
          }
        ],
        (event) => {
          try {
            const metadata = JSON.parse(event.content);
            setProfiles(prev => ({
              ...prev,
              [pubkey]: metadata
            }));
          } catch (e) {
            console.error('Failed to parse profile metadata:', e);
          }
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        nostrService.unsubscribe(metadataSubId);
      }, 5000);
    };
    
    fetchNotifications();
  }, [userInteractions, profiles]);

  return {
    notifications,
    interactionNotifications,
    loading,
    interactionsLoading,
    profiles,
    userInteractions
  };
};
