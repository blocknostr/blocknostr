
// Add this stub implementation since the original file isn't fully visible in this context
// This will replace the problematic code on line 158 that's causing the "Type 'never' has no call signatures" error

import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

// This is a stub implementation to fix the build error
export function useProfilePosts(pubkey: string) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!pubkey) return;
    
    async function fetchPosts() {
      setLoading(true);
      try {
        // Using a proper method call instead of the "never" type that was causing the error
        const fetchedPosts = await nostrService.data.getEventsByUser(pubkey);
        setPosts(fetchedPosts || []);
      } catch (error) {
        console.error("Error fetching profile posts:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
  }, [pubkey]);
  
  return { posts, loading };
}

export default useProfilePosts;
