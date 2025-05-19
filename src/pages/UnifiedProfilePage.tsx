import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNostr } from '@/contexts/NostrContext';
import NoteFeed from '@/components/feed/NoteFeed';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import { useUnifiedProfileFetcher } from '@/hooks/useUnifiedProfileFetcher';
import { nip19 } from 'nostr-tools';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ProfileHeader: React.FC<{ profile: any; pubkey: string }> = ({ profile, pubkey }) => {
  if (!profile) {
    return (
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-32"></div>
        <CardContent className="pt-0 relative">
          <div className="flex flex-col items-center sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 border-4 border-background -mt-10 relative z-10">
              <User className="h-10 w-10 m-auto text-muted-foreground" />
            </Avatar>
            <div className="mt-4 sm:mt-0 sm:ml-4 text-center sm:text-left">
              <h2 className="font-bold text-xl">Anonymous User</h2>
              <p className="text-muted-foreground text-sm truncate max-w-[200px] sm:max-w-none">
                {pubkey.slice(0, 8)}...{pubkey.slice(-8)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="mb-6 overflow-hidden">      {profile.banner ? (
        <div 
          className="h-32 bg-cover bg-center" 
          style={{ backgroundImage: `url(${profile.banner})` }}
          onError={(e) => {
            console.warn("Banner image failed to load, using gradient fallback");
            const target = e.target as HTMLDivElement;
            target.classList.add("bg-gradient-to-r", "from-blue-400", "to-purple-500");
            target.style.backgroundImage = "";
          }}
        />
      ) : (
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-32"></div>
      )}
      <CardContent className="pt-0 relative">
        <div className="flex flex-col items-center sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20 border-4 border-background -mt-10 relative z-10">
            {profile.picture ? (
              <img 
                src={profile.picture} 
                alt={profile.name || "User"} 
                className="object-cover"                onError={(e) => {
                  console.warn("Profile image failed to load, replacing with default");
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none"; // Hide the img element
                  target.onerror = null;
                  // Parent element will show the User icon as fallback
                }}
              />
            ) : (
              <User className="h-10 w-10 m-auto text-muted-foreground" />
            )}
          </Avatar>
          <div className="mt-4 sm:mt-0 sm:ml-4 text-center sm:text-left">
            <h2 className="font-bold text-xl">
              {profile.display_name || profile.name || "Anonymous User"}
            </h2>
            <p className="text-muted-foreground text-sm truncate max-w-[200px] sm:max-w-none">
              {pubkey.slice(0, 8)}...{pubkey.slice(-8)}
            </p>
            {profile.about && (
              <p className="mt-2 text-sm whitespace-pre-wrap break-words">
                {profile.about}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const UnifiedProfilePage: React.FC = () => {
  const { pubkey: urlPubkey } = useParams<{ pubkey?: string }>();
  const { publicKey: loggedInPubkey, isAuthenticated } = useNostr();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePubkey, setActivePubkey] = useState<string | null>(null);
  const { profiles, fetchProfile, refreshProfile } = useUnifiedProfileFetcher();

  useEffect(() => {
    const initProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        let pubkeyToUse = null;
        if (urlPubkey) {
          try {
            if (urlPubkey.startsWith('npub')) {
              const { data } = nip19.decode(urlPubkey);
              pubkeyToUse = data as string;
            } else {
              pubkeyToUse = urlPubkey;
            }
          } catch (e) {
            setError('Invalid public key format');
            return;
          }
        } else {
          if (!isAuthenticated || !loggedInPubkey) {
            setError('You must be logged in to view your profile');
            return;
          }
          pubkeyToUse = loggedInPubkey;
        }
        if (!pubkeyToUse) {
          setError('No valid public key found');
          return;
        }
        setActivePubkey(pubkeyToUse);
        await fetchProfile(pubkeyToUse);
      } catch (e) {
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    initProfile();
  }, [urlPubkey, loggedInPubkey, isAuthenticated, fetchProfile]);

  const isOwnProfile = isAuthenticated && activePubkey === loggedInPubkey;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
      </div>
    );
  }
  if (loading || !activePubkey) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }  // Handler for profile updates
  const handleProfileUpdate = async () => {
    if (activePubkey) {
      try {
        console.log('UnifiedProfilePage: Refreshing profile after update');
        await refreshProfile(activePubkey);
        // No need for toast here as EditProfileDialog already shows one
      } catch (err) {
        console.error('UnifiedProfilePage: Error refreshing profile', err);
      }
    }
  };

  return (
    <div className="container max-w-3xl mx-auto p-4">
      <ProfileHeader profile={profiles[activePubkey]} pubkey={activePubkey} />
      {isOwnProfile && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Edit Profile
          </Button>
        </div>
      )}
      <NoteFeed pubkey={activePubkey} />
      {isOwnProfile && (
        <EditProfileDialog 
          open={isEditing} 
          onOpenChange={setIsEditing} 
          onProfileUpdate={handleProfileUpdate} 
        />
      )}
    </div>
  );
};

export default UnifiedProfilePage;
