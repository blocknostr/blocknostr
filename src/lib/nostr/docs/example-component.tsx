import React, { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

/**
 * Example component demonstrating the proper use of the adapter pattern
 */
export function ProfileWithRelays({ pubkey }: { pubkey: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [relays, setRelays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Use data adapter to get profile
        const profileData = await nostrService.data.getUserProfile(pubkey);
        
        // Use relay adapter to get user relays
        const relayData = await nostrService.relay.getRelaysForUser(pubkey);
        
        setProfile(profileData);
        setRelays(relayData ? Object.keys(relayData) : []);
      } catch (err) {
        setError("Failed to load user data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [pubkey]);

  const handleFollow = async () => {
    try {
      // Use social adapter for follow action
      const success = await nostrService.social.followUser(pubkey);
      
      if (success) {
        alert("User followed successfully!");
      }
    } catch (err) {
      console.error("Error following user:", err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>{profile?.display_name || profile?.name || 'Unknown User'}</h2>
      
      {profile?.picture && (
        <img 
          src={profile.picture} 
          alt="Profile" 
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
      )}
      
      <p>{profile?.about || 'No bio available'}</p>
      
      <div>
        <h3>Relays:</h3>
        <ul>
          {relays.map(relay => (
            <li key={relay}>{relay}</li>
          ))}
        </ul>
      </div>
      
      <button onClick={handleFollow}>Follow User</button>
    </div>
  );
}

/**
 * Alternative implementation using direct method calls (legacy approach)
 * This demonstrates the same functionality but with the older API style
 */
export function LegacyProfileWithRelays({ pubkey }: { pubkey: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [relays, setRelays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Direct method call (legacy approach)
        const profileData = await nostrService.getUserProfile(pubkey);
        
        // Direct method call (legacy approach)
        const relayData = await nostrService.getRelaysForUser(pubkey);
        
        setProfile(profileData);
        setRelays(relayData ? Object.keys(relayData) : []);
      } catch (err) {
        setError("Failed to load user data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [pubkey]);

  const handleFollow = async () => {
    try {
      // Direct method call (legacy approach)
      const success = await nostrService.followUser(pubkey);
      
      if (success) {
        alert("User followed successfully!");
      }
    } catch (err) {
      console.error("Error following user:", err);
    }
  };

  return (
    <div>
      <h2>{profile?.display_name || profile?.name || 'Unknown User'}</h2>
      
      {profile?.picture && (
        <img 
          src={profile.picture} 
          alt="Profile" 
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
      )}
      
      <p>{profile?.about || 'No bio available'}</p>
      
      <div>
        <h3>Relays:</h3>
        <ul>
          {relays.map(relay => (
            <li key={relay}>{relay}</li>
          ))}
        </ul>
      </div>
      
      <button onClick={handleFollow}>Follow User</button>
    </div>
  );
}
