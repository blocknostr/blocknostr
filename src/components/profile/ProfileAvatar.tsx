import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { validateImageUrl } from '@/lib/utils/image-utils';

interface ProfileAvatarProps {
  pubkey: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackClassName?: string;
  showFallback?: boolean;
  // Required profile data - no more duplicate fetching
  displayName?: string | null;
  name?: string;
  picture?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
};

/**
 * 🚀 OPTIMIZED ProfileAvatar - Race Conditions Eliminated
 * Now purely prop-based - no internal API calls
 * Parent components must provide profile data
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  pubkey,
  size = 'md',
  className,
  fallbackClassName,
  showFallback = true,
  displayName,
  name,
  picture
}) => {
  // Memoize avatar data to prevent unnecessary recalculations
  const avatarData = useMemo(() => {
    const getDisplayName = () => {
      if (displayName && displayName !== 'Anonymous') return displayName;
      if (name) return name;
      // Return formatted pubkey instead of "Anonymous"
      return `User ${pubkey.slice(0, 8)}`;
    };

    const getAvatarFallback = () => {
      if (displayName && displayName !== 'Anonymous') {
        const cleanName = displayName.trim();
        return cleanName.charAt(0).toUpperCase();
      }
      if (name) {
        const cleanName = name.trim();
        return cleanName.charAt(0).toUpperCase();
      }
      // Use 'U' for User when no name is available
      return 'U';
    };

    // Validate image URL to prevent ERR_ADDRESS_INVALID
    const validatedPicture = validateImageUrl(picture);

    return {
      displayName: getDisplayName(),
      fallback: getAvatarFallback(),
      picture: validatedPicture
    };
  }, [displayName, name, picture, pubkey]);

  if (!showFallback && !avatarData.picture) {
    return null;
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ''}`}>
      {avatarData.picture && (
        <AvatarImage 
          src={avatarData.picture} 
          alt={avatarData.displayName}
          className="object-cover"
        />
      )}
      <AvatarFallback 
        className={`text-sm font-medium ${fallbackClassName || ''}`}
        title={avatarData.displayName}
      >
        {avatarData.fallback}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar; 
