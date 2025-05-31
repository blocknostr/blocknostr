import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  MapPin, 
  Link as LinkIcon, 
  Calendar,
  Check,
  UserPlus,
  MessageSquare,
  Edit,
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { ProfileData } from '@/lib/services/profile/types';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useFollowUserMutation, useUnfollowUserMutation } from '@/api/rtk/nostrApi';
import { nostrService } from '@/lib/nostr';
import { toast } from '@/lib/toast';
import ProfileEditModal from './ProfileEditModal';
import ProfileAvatar from './ProfileAvatar';
import ProfileDisplayName from './ProfileDisplayName';
import { cn } from '@/lib/utils';
import { validateImageUrl } from '@/lib/utils/image-utils';
import { useWallet } from '@alephium/web3-react';
import { useLocalStorage } from '@/hooks/ui/use-local-storage';
import { useGetContactListQuery } from '@/api/rtk/profileApi';
import { profileApiUtils } from '@/api/rtk/profileApi';

interface ProfileHeaderProps {
  pubkey: string;
  isOwnProfile: boolean;
  onUpdate: (updates: Partial<ProfileData>) => void;
  onRefresh: () => void;
  // Profile data passed from parent to prevent duplicate API calls
  profile?: ProfileData | null;
  isLoading?: boolean;
  isError?: boolean;
  displayName?: string | null;
  name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  lud16?: string;
  followerCount?: number;
  followingCount?: number;
  noteCount?: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  pubkey,
  isOwnProfile,
  onUpdate,
  onRefresh,
  profile,
  isLoading,
  isError,
  displayName,
  name,
  about,
  picture,
  banner,
  website,
  lud16,
  followerCount,
  followingCount,
  noteCount
}) => {
  const dispatch = useAppDispatch();
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [copyState, setCopyState] = useState<{[key: string]: boolean}>({});

  // Get wallet connection (multiple approaches)
  const wallet = useWallet();
  const [selectedWalletAddress] = useLocalStorage<string>("blocknoster_selected_wallet", "");
  const [showWalletInProfile] = useLocalStorage("privacy_show_wallet_in_profile", true);

  // ✅ FIXED: Properly access data from props (no duplicate API calls)
  const profileData = useMemo(() => {
    if (!profile && !displayName && !name && !picture && !banner) {
      // ✅ ENHANCED: Show meaningful fallback when no profile data exists at all
      return {
        displayName: `User ${pubkey.slice(0, 8)}`,
        name: '',
        about: '',
        picture: '',
        banner: '',
        website: '',
        lud16: '',
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        createdAt: Date.now() - (365 * 24 * 60 * 60 * 1000), // Default to 1 year ago
        isFollowing: false,
        mutualConnections: 0,
      };
    }
    
    return {
      // Basic info - use props directly with enhanced fallbacks
      displayName: displayName || name || `User ${pubkey.slice(0, 8)}`,
      name: name || '',
      about: about || '',
      picture: picture || '',
      banner: validateImageUrl(banner) || '', // Validate banner URL
      website: website || '',
      lud16: lud16 || '',
      
      // Stats - use props directly
      followerCount: followerCount || 0,
      followingCount: followingCount || 0,
      postCount: noteCount || 0,
      
      // Dates - handle missing createdAt properly
      createdAt: profile?.createdAt || profile?.metadata?.created_at || Date.now() - (365 * 24 * 60 * 60 * 1000), // Default to 1 year ago if no date
      
      // Additional fields
      isFollowing: profile?.isFollowing || false,
      mutualConnections: profile?.mutualConnections || 0,
    };
  }, [profile, displayName, name, about, picture, banner, website, lud16, followerCount, followingCount, noteCount, pubkey]);

  // ✅ ENHANCED LOADING STATE: Better handling of loading vs no data
  const isProfileLoading = isLoading && !profileData;
  const shouldShowContent = profileData; // Always show content if we have any data (including fallbacks)
  
  // ✅ IMPROVED DISPLAY NAME: Use profileData directly
  const finalDisplayName = useMemo(() => {
    // If loading, show loading state
    if (isLoading && !profileData) return null;
    
    // Use processed display name from profileData (includes fallbacks)
    return profileData?.displayName || 'Anonymous';
  }, [isLoading, profileData?.displayName]);

  // Generate npub and hex for display
  const npub = useMemo(() => {
    return pubkey ? nostrService.getNpubFromHex(pubkey) : '';
  }, [pubkey]);

  // Get wallet address if connected - try multiple approaches
  const walletAddress = useMemo(() => {
    // ✅ SECURITY FIX: Only show wallet address for current user's own profile
    // We cannot and should not display other users' wallet addresses
    if (!isOwnProfile) {
      return '';
    }

    // Priority 1: Connected wallet from useWallet hook
    if (wallet.connectionStatus === 'connected' && wallet.account?.address) {
      return wallet.account.address;
    }

    // Priority 2: Selected wallet from localStorage (fallback)
    if (selectedWalletAddress) {
      return selectedWalletAddress;
    }

    return '';
  }, [wallet.account?.address, wallet.connectionStatus, selectedWalletAddress, isOwnProfile]);

  // Copy handler for npub, hex, and wallet
  const handleCopy = useCallback((id: string, value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopyState(prev => ({ ...prev, [id]: true }));
    
    toast.success(`${label} copied`, {
      description: `${label} has been copied to your clipboard`
    });
    
    setTimeout(() => {
      setCopyState(prev => ({ ...prev, [id]: false }));
    }, 2000);
  }, []);

  // Debug logging to track profile state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProfileHeader] Profile state change:', {
        pubkey: pubkey.slice(0, 8),
        // Props data
        propsData: {
          displayName,
          name,
          about,
          picture: !!picture,
          banner: !!banner,
          website,
          lud16,
          followerCount,
          followingCount,
          noteCount,
        },
        // Raw profile object
        rawProfile: profile ? {
          hasMetadata: !!profile.metadata,
          hasStats: !!profile.stats,
          createdAt: profile.createdAt,
          metadataCreatedAt: profile.metadata?.created_at,
          metadataKeys: profile.metadata ? Object.keys(profile.metadata) : [],
          statsKeys: profile.stats ? Object.keys(profile.stats) : [],
          topLevelKeys: Object.keys(profile),
        } : null,
        // Processed data
        processedData: profileData,
        // Loading states
        isLoading,
        isProfileLoading,
        shouldShowContent,
        isError,
      });
    }
  }, [profile, profileData, displayName, name, about, picture, banner, website, lud16, followerCount, followingCount, noteCount, isLoading, pubkey, isProfileLoading, shouldShowContent, isError]);

  // ProfileHeader is now passive - no fetching, only display
  // Let ProfilePageRedux handle all profile fetching
  // This eliminates race conditions and ensures single source of truth

  // ✅ MIGRATED: Use RTK Query to get current user's contacts instead of slice
  const currentUserPubkey = nostrService.publicKey;
  const { 
    data: contactList = { contacts: [] },
    isLoading: contactsLoading,
    refetch: refetchContacts
  } = useGetContactListQuery(currentUserPubkey, {
    skip: !currentUserPubkey || !pubkey || isOwnProfile
  });

  // Extract contact IDs for follow checking
  const myContactsIds = useMemo(() => {
    // contactList.contacts is an array of pubkey strings, not objects
    return contactList?.contacts || [];
  }, [contactList]);

  React.useEffect(() => {
    if (pubkey && !contactsLoading) {
      const isFollowingUser = myContactsIds.includes(pubkey);
      console.log('[ProfileHeader] Follow state check:', {
        pubkey: pubkey.slice(0, 8),
        isFollowingUser,
        myContactsCount: myContactsIds.length,
        myContacts: myContactsIds.map(id => id.slice(0, 8)),
        contactListData: contactList
      });
      setIsFollowing(isFollowingUser);
    }
  }, [pubkey, myContactsIds, contactsLoading, contactList]);

  // Memoize follow/unfollow handler
  const handleFollowToggle = useCallback(async () => {
    if (!pubkey) return;
    
    setActionLoading(true);
    try {
      if (isFollowing) {
        console.log('[ProfileHeader] Attempting to unfollow:', pubkey.slice(0, 8));
        await unfollowUser(pubkey).unwrap();
        setIsFollowing(false);
        // ✅ REFRESH: Refetch contact list to update follow status
        if (refetchContacts) {
          setTimeout(() => refetchContacts(), 500);
        }
      } else {
        console.log('[ProfileHeader] Attempting to follow:', pubkey.slice(0, 8));
        await followUser(pubkey).unwrap();
        setIsFollowing(true);
        // ✅ REFRESH: Refetch contact list to update follow status
        if (refetchContacts) {
          setTimeout(() => refetchContacts(), 500);
        }
      }
    } catch (error) {
      console.error('[ProfileHeader] Follow/unfollow error:', error);
      // Show user-friendly error message
      alert(error?.data || error?.error || 'Operation failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [pubkey, isFollowing, followUser, unfollowUser, refetchContacts]);

  // Memoize message handler
  const handleMessage = useCallback(() => {
    if (pubkey) {
      // TODO: Navigate to DM with user
      toast.info('Messaging feature coming soon!');
    }
  }, [pubkey]);

  // Memoize edit handler
  const handleEdit = useCallback(() => {
    setEditModalOpen(true);
  }, []);

  // Memoize profile update handler
  const handleProfileUpdate = useCallback(async (updates: Partial<ProfileData>) => {
    try {
      console.log('[ProfileHeader] Received profile updates, delegating to Redux:', updates);
      
      // Simply pass the updates to the parent component's updateProfile method
      // which will handle the publishing, local state update, and refresh
      await onUpdate(updates);
      
      // ✅ RACE CONDITION FIX: Immediate cache invalidation + refetch (no delays)
      dispatch(profileApiUtils.invalidateProfile(pubkey));
      
      // Trigger immediate refetch to get fresh data
      setTimeout(() => {
        onRefresh();
      }, 100); // Minimal delay to ensure invalidation completes
      
    } catch (error) {
      console.error('[ProfileHeader] Profile update error:', error);
      throw error; // Re-throw so the modal can handle the error
    }
  }, [onUpdate, dispatch, pubkey, onRefresh]);

  // ✅ ENHANCED: Force refresh handler for manual cache invalidation
  const handleForceRefresh = useCallback(() => {
    console.log('[ProfileHeader] Force refreshing profile for:', pubkey.slice(0, 8));
    
    // ✅ RACE CONDITION FIX: Immediate invalidation + refetch (no delays)
    dispatch(profileApiUtils.invalidateProfile(pubkey));
    
    // Immediate refetch
    onRefresh();
    if (!isOwnProfile) {
      refetchContacts();
    }
    
    toast.success("Profile refreshed!");
  }, [dispatch, pubkey, onRefresh, refetchContacts, isOwnProfile]);

  // Memoize date formatting function
  const formatDate = useCallback((timestamp?: number) => {
    if (!timestamp || timestamp === 0) return 'Unknown';
    
    // Handle Unix timestamps (seconds) vs JavaScript timestamps (milliseconds)
    const date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
    
    // Validate the date
    if (isNaN(date.getTime())) return 'Unknown';
    
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, []);

  // Memoize modal close handler
  const handleModalClose = useCallback(() => {
    setEditModalOpen(false);
  }, []);

  // Memoize website hostname
  const websiteHostname = useMemo(() => {
    if (!profileData?.website) return null;
    try {
      return new URL(profileData.website).hostname;
    } catch {
      return profileData.website;
    }
  }, [profileData?.website]);

  if (!shouldShowContent) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="text-center text-muted-foreground mt-4">
            Loading profile data...
          </div>
        </div>
      </Card>
    );
  }

  // ✅ ENHANCED: Only show loading for display name if we're actually loading and have no data
  if (isLoading && !profileData) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="text-center text-muted-foreground mt-4">
            Loading profile metadata...
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden w-full max-w-full">
        {/* Banner */}
        <div 
          className="h-48 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden"
          style={{
            backgroundImage: profileData.banner ? `url(${profileData.banner})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '12rem', // 192px minimum height
            width: '100%',
            display: 'block'
          }}
        >
          {/* Ensure banner covers full space with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20" />
          {/* Additional overlay for better text readability if banner image exists */}
          {profileData.banner && (
            <div className="absolute inset-0 bg-black/10" />
          )}
        </div>

        {/* Profile Content */}
        <div className="p-6 -mt-24 relative">{/* Adjusted margin for taller banner */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 w-full max-w-full">
            {/* Avatar and basic info */}
            <div className="flex flex-col md:flex-row items-start md:items-end gap-4 min-w-0 flex-1">
              <ProfileAvatar 
                pubkey={pubkey}
                size="xl"
                className="h-24 w-24 border-4 border-background shadow-xl flex-shrink-0"
                displayName={profileData?.displayName}
                name={profileData?.name}
                picture={profileData?.picture}
              />

              <div className="space-y-2 min-w-0 flex-1 max-w-full">
                {/* Display name and username on same line */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold truncate">
                    <ProfileDisplayName 
                      pubkey={pubkey}
                      fallbackStyle="user"
                      maxLength={25}
                      displayName={profileData?.displayName}
                      name={profileData?.name}
                      nip05={profileData?.lud16} // Using lud16 as nip05 for now
                    />
                  </h1>
                  {profileData?.name && profileData?.displayName !== profileData?.name && (
                    <span className="text-xl text-muted-foreground truncate">@{profileData.name}</span>
                  )}
                </div>

                {/* Npub and Joined info on second line */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1 truncate">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <code className="font-mono text-xs truncate">
                      {npub.slice(0, 16)}...{npub.slice(-8)}
                    </code>
                  </span>
                  <span className="flex items-center gap-1 truncate">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Joined {formatDate(profileData.createdAt)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isOwnProfile ? (
                <Button onClick={handleEdit} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleFollowToggle}
                    disabled={actionLoading}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button onClick={handleMessage} variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Bio and additional info */}
          <div className="mt-6 space-y-4 w-full max-w-full">
            {profileData.about && (
              <p className="text-foreground leading-relaxed break-words">{profileData.about}</p>
            )}
            
            {/* Show note for minimal profiles */}
            {!profileData.displayName && !profileData.name && !profileData.about && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground break-words">
                  This user hasn't published profile information yet, but their activity shows they're active on the network.
                  {isOwnProfile && (
                    <span className="block mt-1 font-medium">
                      Click "Edit Profile" to add your information!
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Links and additional info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {profileData.website && (
                <a 
                  href={profileData.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors truncate"
                >
                  <LinkIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{websiteHostname}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              )}
            </div>

            {/* Nostr Identity Section */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {/* Npub */}
              <div className="flex items-center gap-1">
                <span className="font-medium">npub:</span>
                <code className="font-mono text-xs">
                  {npub.slice(0, 16)}...{npub.slice(-8)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0 transition-all duration-200",
                    copyState["npub"] ? "bg-green-500/10 text-green-600" : "hover:bg-muted"
                  )}
                  onClick={() => handleCopy("npub", npub, "Npub")}
                  title="Copy npub"
                >
                  {copyState["npub"] ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {/* Hex Pubkey */}
              <div className="flex items-center gap-1">
                <span className="font-medium">hex:</span>
                <code className="font-mono text-xs">
                  {pubkey.slice(0, 8)}...{pubkey.slice(-8)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0 transition-all duration-200",
                    copyState["hex"] ? "bg-green-500/10 text-green-600" : "hover:bg-muted"
                  )}
                  onClick={() => handleCopy("hex", pubkey, "Hex pubkey")}
                  title="Copy hex pubkey"
                >
                  {copyState["hex"] ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {/* Alephium Wallet Address - Only show for own profile */}
              {showWalletInProfile && isOwnProfile && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">alph:</span>
                  <code className="font-mono text-xs">
                    {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}` : 'not connected'}
                  </code>
                  {walletAddress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 w-6 p-0 transition-all duration-200",
                        copyState["wallet"] ? "bg-green-500/10 text-green-600" : "hover:bg-muted"
                      )}
                      onClick={() => handleCopy("wallet", walletAddress, "Wallet address")}
                      title="Copy your Alephium wallet address"
                    >
                      {copyState["wallet"] ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-1">
                <span className="font-semibold">{profileData.followingCount || 0}</span>
                <span className="text-muted-foreground">Following</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{profileData.followerCount || 0}</span>
                <span className="text-muted-foreground">Followers</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{profileData.postCount || 0}</span>
                <span className="text-muted-foreground">Posts</span>
              </div>
              {profileData.mutualConnections && profileData.mutualConnections > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{profileData.mutualConnections}</span>
                  <span className="text-muted-foreground">Mutual</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={editModalOpen}
        onClose={handleModalClose}
        profile={profileData}
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
};

export default ProfileHeader; 

