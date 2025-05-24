
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { unifiedProfileService } from "@/lib/services/UnifiedProfileService";

interface NoteFormAvatarProps {
  pubkey: string | null;
}

const NoteFormAvatar: React.FC<NoteFormAvatarProps> = ({ pubkey }) => {
  const [profile, setProfile] = React.useState<Record<string, any> | null>(null);
  const [loading, setLoading] = React.useState(!!pubkey);
  
  React.useEffect(() => {
    if (!pubkey) return;
    
    // Fetch profile without delay
    const fetchProfile = async () => {
      try {
        const profileData = await unifiedProfileService.getProfile(pubkey);
        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error fetching profile for avatar:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
    
    // Subscribe to profile updates
    const unsubscribe = unifiedProfileService.subscribeToUpdates(pubkey, (updatedProfile) => {
      if (updatedProfile) {
        setProfile(updatedProfile);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [pubkey]);
  
  if (!pubkey) return null;
  
  // Get avatar information
  const avatarFallback = pubkey.substring(0, 2).toUpperCase();
  const picture = profile?.picture || '';
  
  return (
    <Avatar className={cn(
      "h-10 w-10 ring-2 ring-background/50 ring-offset-1 transition-all duration-300",
      "hover:ring-primary/20 hover:scale-105",
      loading ? "opacity-90" : "opacity-100"
    )}>
      {picture ? (
        <AvatarImage 
          src={picture} 
          alt="Your avatar" 
          className="transition-opacity duration-300"
        />
      ) : null}
      <AvatarFallback className="font-medium bg-primary/5 text-primary/80">
        {avatarFallback}
      </AvatarFallback>
    </Avatar>
  );
};

export default NoteFormAvatar;
