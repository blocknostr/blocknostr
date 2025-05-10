
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

interface Comment {
  id?: string;
  content: string;
  author: string;
  created_at: number;
}

export const useComments = (eventId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  
  // Fetch replies when component mounts
  useEffect(() => {
    const fetchReplies = async () => {
      setIsLoading(true);
      
      // Subscribe to replies using #e tag filter
      const subId = nostrService.subscribe(
        [{
          kinds: [1], // Regular notes (kind 1)
          "#e": [eventId], // Filter by reference to parent event
          limit: 50
        }],
        (event) => {
          // Process each reply event
          const isReply = event.tags.some(tag => 
            tag[0] === 'e' && tag[1] === eventId && (tag[3] === 'reply' || !tag[3])
          );
          
          if (isReply) {
            // Add to comments if not already present
            setComments(prev => {
              // Check if we already have this comment
              if (prev.some(c => c.id === event.id)) {
                return prev;
              }
              
              const newComment = {
                id: event.id,
                content: event.content,
                author: event.pubkey || '',
                created_at: event.created_at
              };
              
              // Fetch profile data for the comment author
              if (event.pubkey) {
                fetchProfileData(event.pubkey);
              }
              
              // Add new comment and sort by creation time (newest first)
              return [...prev, newComment].sort((a, b) => b.created_at - a.created_at);
            });
          }
        }
      );
      
      setIsLoading(false);
      
      // Cleanup subscription
      return () => {
        nostrService.unsubscribe(subId);
      };
    };
    
    fetchReplies();
  }, [eventId]);
  
  const fetchProfileData = (authorPubkey: string) => {
    // Only fetch if we don't already have it
    if (profiles[authorPubkey]) return;
    
    const metadataSubId = nostrService.subscribe(
      [{
        kinds: [0],
        authors: [authorPubkey],
        limit: 1
      }],
      (event) => {
        try {
          const metadata = JSON.parse(event.content);
          setProfiles(prev => ({
            ...prev,
            [authorPubkey]: metadata
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
  
  const addComment = (id: string, content: string) => {
    const newCommentObj = { 
      id,
      content, 
      author: nostrService.publicKey || '',
      created_at: Math.floor(Date.now() / 1000)
    };
    
    setComments(prev => [newCommentObj, ...prev]);
  };
  
  const removeComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };
  
  return { 
    comments,
    profiles,
    isLoading,
    addComment,
    removeComment,
    fetchProfileData
  };
};
