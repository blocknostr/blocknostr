import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLoginDialog } from "@/hooks/useGlobalLoginDialog";
import { nostrService } from "@/lib/nostr";
import { toast } from "@/lib/toast";
import { useProfilesBatch } from "@/hooks/api/useProfileMigrated";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { cn } from "@/lib/utils";

interface ProfileButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({
  variant = "default",
  size = "default", 
  className = "",
  showText = true
}) => {
  const { isLoggedIn, publicKey, shortPubkey } = useAuth();
  const { openLoginDialog } = useGlobalLoginDialog();

  // Fetch profile data when logged in
  const { profilesMap, isLoading } = useProfilesBatch(
    isLoggedIn && publicKey ? [publicKey] : []
  );

  const profile = publicKey ? profilesMap[publicKey] : null;

  // Add debugging (moved to useEffect to avoid logging on every render)
  useEffect(() => {
    console.log('[ProfileButton] State changed - isLoggedIn:', isLoggedIn, 'shortPubkey:', shortPubkey);
  }, [isLoggedIn, shortPubkey]);

  const handleClick = () => {
    if (isLoggedIn) {
      // Sign out if already logged in
      console.log('[ProfileButton] Signing out...');
      nostrService.signOut();
      toast.success("Signed out successfully", { 
        description: "You have been disconnected from your Nostr account" 
      });
    } else {
      // Open login dialog if not logged in
      console.log('[ProfileButton] Opening login dialog...');
      openLoginDialog();
    }
  };

  if (isLoggedIn && publicKey) {
    // Extract profile data
    const displayName = profile?.metadata?.display_name || profile?.metadata?.name || '';
    const name = profile?.metadata?.name || '';
    const picture = profile?.metadata?.picture || '';
    
    // Determine what name to show
    const profileName = displayName || name || shortPubkey || 'User';

    return (
      <Button 
        variant={variant === "default" ? "ghost" : variant}
        size={size} 
        className={cn(
          "transition-all duration-200 hover:bg-muted/80",
          showText ? "justify-start gap-3 px-3" : "p-2",
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ProfileAvatar
            pubkey={publicKey}
            size="lg"
            displayName={displayName}
            name={name}
            picture={picture}
            className="flex-shrink-0"
          />
          {showText && (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-medium truncate text-lg">
                {profileName}
              </span>
              <LogOut className="h-3 w-3 opacity-70 flex-shrink-0" />
            </div>
          )}
        </div>
      </Button>
    );
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleClick}
    >
      <Wallet className="h-4 w-4 mr-1" />
      {showText && "Connect Wallet"}
    </Button>
  );
};

export default ProfileButton;

