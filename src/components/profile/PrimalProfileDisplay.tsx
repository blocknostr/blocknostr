import { useState, useEffect } from "react";
import { useNostr } from "@/contexts/NostrContext";
// Assuming SimpleMainLayout is a valid component, if not, this might need adjustment
// import SimpleMainLayout from "@/components/layout/SimpleMainLayout"; 
import NoteFeed from "@/components/feed/NoteFeed";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link, User, Edit, CheckCircle, AlertTriangle, Zap, Calendar, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import { nip19 } from "nostr-tools";
import { NostrProfile } from "@/lib/nostr/types";

interface PrimalProfileDisplayProps {
  routePubkey?: string;
}

const PrimalProfileDisplay: React.FC<PrimalProfileDisplayProps> = ({ routePubkey }) => {
  const {
    isAuthenticated,
    profile: contextProfile,
    publicKey: authenticatedUserKey,
    isLoading: isContextProfileLoading,
    fetchProfile,
  } = useNostr();

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileToDisplay, setProfileToDisplay] = useState<NostrProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); // Local loading state for external profiles

  const isOwnProfile = !routePubkey || routePubkey === authenticatedUserKey;

  useEffect(() => {
    const loadProfile = async () => {
      console.log("[PrimalProfileDisplay] loadProfile triggered. routePubkey:", routePubkey, "isOwnProfile:", isOwnProfile, "isAuthenticated:", isAuthenticated, "isContextProfileLoading:", isContextProfileLoading);
      
      if (isOwnProfile) {
        console.log("[PrimalProfileDisplay] Loading own profile. contextProfile:", contextProfile);
        if (isAuthenticated) {
          setProfileToDisplay(contextProfile);
        } else {
          setProfileToDisplay(null);
        }
        // Use context's loading state for own profile, as it's managed by NostrContext
        setIsLoadingProfile(isContextProfileLoading); 
      } else if (routePubkey) {
        let hexPubkeyToFetch: string | null = null;
        if (routePubkey.startsWith('npub1')) {
          try {
            const decoded = nip19.decode(routePubkey);
            if (decoded.type === 'npub') {
              hexPubkeyToFetch = decoded.data as string;
              console.log("[PrimalProfileDisplay] Decoded npub", routePubkey, "to hex:", hexPubkeyToFetch);
            } else {
              console.warn("[PrimalProfileDisplay] Invalid npub format after decoding:", routePubkey, "decoded type:", decoded.type);
            }
          } catch (e) {
            console.error("[PrimalProfileDisplay] Error decoding npub:", routePubkey, e);
          }
        } else if (/^[0-9a-fA-F]{64}$/.test(routePubkey)) { // Basic check for 64-char hex
          hexPubkeyToFetch = routePubkey;
          console.log("[PrimalProfileDisplay] routePubkey appears to be hex:", hexPubkeyToFetch);
        } else {
          console.warn("[PrimalProfileDisplay] routePubkey is not a valid npub or hex:", routePubkey);
        }

        if (hexPubkeyToFetch) {
          console.log("[PrimalProfileDisplay] Fetching external profile for hex pubkey:", hexPubkeyToFetch);
          setIsLoadingProfile(true); // Set local loading true for this fetch operation
          try {
            if (fetchProfile) {
              const fetchedProfile = await fetchProfile(hexPubkeyToFetch);
              console.log("[PrimalProfileDisplay] Fetched external profile data for", hexPubkeyToFetch, ":", fetchedProfile);
              setProfileToDisplay(fetchedProfile);
            } else {
              console.warn("[PrimalProfileDisplay] fetchProfile function not available in NostrContext");
              setProfileToDisplay(null);
            }
          } catch (error) {
            console.error("[PrimalProfileDisplay] Error loading external profile for", hexPubkeyToFetch, ":", error);
            setProfileToDisplay(null);
          } finally {
            setIsLoadingProfile(false);
            console.log("[PrimalProfileDisplay] Finished loading external profile for", hexPubkeyToFetch, ". isLoadingProfile (local) is now false.");
          }
        } else {
          console.warn("[PrimalProfileDisplay] Could not resolve a valid hex pubkey from routePubkey:", routePubkey, ". Setting profile to null.");
          setProfileToDisplay(null);
          setIsLoadingProfile(false); // Ensure local loading stops
        }
      } else {
        // No routePubkey and not own profile (should not happen if logic is correct, but handle defensively)
        console.log("[PrimalProfileDisplay] No routePubkey and not own profile. Setting profile to null.");
        setProfileToDisplay(null);
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [routePubkey, contextProfile, isAuthenticated, authenticatedUserKey, fetchProfile, isOwnProfile, isContextProfileLoading]);
  
  // Determine overall loading state
  // For own profile, rely on context's loading state. For external, rely on local isLoadingProfile.
  const isLoading = isOwnProfile ? isContextProfileLoading : isLoadingProfile;
  console.log("[PrimalProfileDisplay] Render state check. isLoading (combined):", isLoading, "profileToDisplay:", profileToDisplay, "isOwnProfile:", isOwnProfile, "isAuthenticated:", isAuthenticated, "routePubkey:", routePubkey, "isContextProfileLoading:", isContextProfileLoading, "isLoadingProfile (local):", isLoadingProfile);

  if (isLoading) {
    console.log("[PrimalProfileDisplay] Rendering Skeleton. isOwnProfile:", isOwnProfile, "isContextProfileLoading:", isContextProfileLoading, "isLoadingProfile (local):", isLoadingProfile);
    return (
      <div className="space-y-4 p-4 md:p-6">
        {/* Banner Skeleton */}
        <Skeleton className="h-48 w-full rounded-lg" />
        {/* Profile Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start gap-4 -mt-16 sm:-mt-20 px-4">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
          <div className="pt-4 sm:pt-20 flex-grow space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32 mt-4 sm:mt-20" /> {/* Edit button placeholder */}
        </div>
        {/* Bio Skeleton */}
        <div className="px-4 space-y-2 mt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        {/* Metadata Skeleton */}
        <div className="px-4 flex flex-wrap gap-4 mt-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
        {/* Tabs Skeleton */}
        <Skeleton className="h-10 w-full mt-6" />
        <Skeleton className="h-20 w-full mt-4" />
      </div>
    );
  }

  if (!isOwnProfile && !profileToDisplay && !isLoading) {
    console.log("[PrimalProfileDisplay] Rendering 'Profile not found' message.");
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center text-center p-4">
        <div>
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <p className="text-muted-foreground">
            The user profile for the specified public key could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  if (isOwnProfile && !isAuthenticated && !isLoading) {
    console.log("[PrimalProfileDisplay] Rendering 'Please login' message.");
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center text-center p-4">
        <div>
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Please login</h1>
          <p className="text-muted-foreground mb-6">Login to view your profile and connect with others.</p>
          <Button asChild>
            <a href="/">Go to Login</a>
          </Button>
        </div>
      </div>
    );
  }
  
  const displayProfileData = profileToDisplay;
  const currentPubkeyForFeed = isOwnProfile ? authenticatedUserKey : profileToDisplay?.pubkey;

  if (!displayProfileData && !isLoading) {
    console.log("[PrimalProfileDisplay] Rendering 'Profile Unavailable' message.");
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center text-center p-4">
        <div>
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Profile Unavailable</h1>
          <p className="text-muted-foreground">
            This profile could not be displayed. If this is your profile, please try logging in.
          </p>
          {!isAuthenticated && isOwnProfile && (
            <Button asChild className="mt-4">
              <a href="/">Go to Login</a>
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  const npub = displayProfileData?.npub || (displayProfileData?.pubkey ? nip19.npubEncode(displayProfileData.pubkey) : null);
  const displayName = displayProfileData?.displayName || displayProfileData?.name || "Anonymous";
  const nip05Id = displayProfileData?.nip05?.startsWith("_@") 
                  ? displayProfileData.nip05.substring(2) 
                  : displayProfileData?.nip05;

  console.log("[PrimalProfileDisplay] Proceeding to render profile data for:", displayName, "npub:", npub);

  return (
    // Removed SimpleMainLayout as ProfilePage.tsx will likely handle the overall page structure
    <div className="w-full mx-auto">
      {/* Banner Image */}
      <div
        className="h-48 md:h-64 bg-cover bg-center rounded-b-lg"
        style={{
          backgroundImage: displayProfileData?.banner
            ? `url(${displayProfileData.banner})`
            : 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)', // Default gradient
        }}
      />

      {/* Profile Header */}
      <div className="px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 -mt-16 sm:-mt-20">
          {/* Avatar */}
          <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-background bg-muted overflow-hidden shrink-0">
            {displayProfileData?.picture ? (
              <img
                src={displayProfileData.picture}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-full w-full p-8 text-muted-foreground" />
            )}
          </div>

          {/* Name, NIP-05, Edit Button */}
          <div className="pt-4 sm:pt-20 flex-grow flex flex-col sm:flex-row justify-between items-start w-full">
            <div className="flex-grow">
              <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
              {displayProfileData?.name && displayProfileData.name.toLowerCase() !== displayName.toLowerCase() && (
                <p className="text-sm text-muted-foreground">@{displayProfileData.name}</p>
              )}
              {npub && <p className="text-xs text-muted-foreground mt-1 font-mono">{`${npub.substring(0,12)}...${npub.substring(npub.length - 6)}`}</p>}
              
              {/* NIP-05 Verification Badge */}
              {displayProfileData?.nip05 && (
                <Badge
                  variant={
                    displayProfileData.nip05Verified === undefined ? "outline" : 
                    displayProfileData.nip05Verified ? "secondary" : "destructive"
                  }
                  className="mt-2 flex items-center gap-1 w-fit"
                  title={
                    displayProfileData.nip05Verified === undefined ? "NIP-05 Verification Pending" :
                    displayProfileData.nip05Verified ? `Verified: ${nip05Id}` : `NIP-05 Verification Failed: ${nip05Id}`
                  }
                >
                  {displayProfileData.nip05Verified === true && <CheckCircle className="h-3 w-3" />}
                  {displayProfileData.nip05Verified === false && <AlertTriangle className="h-3 w-3" />}
                  <span className="truncate max-w-[200px]">{nip05Id}</span>
                </Badge>
              )}
            </div>
            
            {isOwnProfile && isAuthenticated && (
              <Button onClick={() => setEditProfileOpen(true)} variant="outline" className="mt-4 sm:mt-0 shrink-0">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Bio */}
        {displayProfileData?.about && (
          <p className="mt-4 text-sm md:text-base">{displayProfileData.about}</p>
        )}
        {!displayProfileData?.about && (
           <p className="mt-4 text-sm text-muted-foreground">No bio yet.</p>
        )}


        {/* Profile Metadata (Website, Joined Date, Location, LUD-16) */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {displayProfileData?.website && (
            <div className="flex items-center">
              <Link className="h-4 w-4 mr-1.5 shrink-0" />
              <a
                href={displayProfileData.website.startsWith('http') ? displayProfileData.website : `http://${displayProfileData.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline truncate"
                title={displayProfileData.website}
              >
                {displayProfileData.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {/* Placeholder for Joined Date - actual data would require event timestamp */}
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1.5 shrink-0" />
            <span>Joined (date unavailable)</span> {/* Placeholder */}
          </div>
          {/* Placeholder for Location - not a standard NIP-01 field */}
          {/* <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1.5 shrink-0" />
            <span>Location (unavailable)</span> 
          </div> */}
          {displayProfileData?.lud16 && (
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-1.5 shrink-0" />
              <span className="truncate" title={displayProfileData.lud16}>{displayProfileData.lud16}</span>
            </div>
          )}
        </div>

        {/* Stats - Placeholder as this data is not directly available from NIP-01 */}
        {/* 
        <div className="mt-4 flex gap-x-6 text-sm">
          <div>
            <span className="font-bold text-foreground">--</span>
            <span className="text-muted-foreground ml-1">Following</span>
          </div>
          <div>
            <span className="font-bold text-foreground">--</span>
            <span className="text-muted-foreground ml-1">Followers</span>
          </div>
        </div>
        */}
      </div>

      {/* Tabs for Posts, Replies, Media, Likes */}
      <div className="mt-6 md:mt-8 px-0 md:px-6">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="replies" disabled>Replies</TabsTrigger> {/* Placeholder: disabled */}
            <TabsTrigger value="media" disabled>Media</TabsTrigger>   {/* Placeholder: disabled */}
            <TabsTrigger value="likes" disabled>Likes</TabsTrigger>   {/* Placeholder: disabled */}
          </TabsList>
          <TabsContent value="posts" className="mt-4">
            {currentPubkeyForFeed ? (
              <NoteFeed pubkey={currentPubkeyForFeed} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Cannot load posts: Public key is unavailable.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="replies" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>Replies are not yet implemented.</p>
            </div>
          </TabsContent>
          <TabsContent value="media" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>Media tab is not yet implemented.</p>
            </div>
          </TabsContent>
          <TabsContent value="likes" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>Liked posts are not yet implemented.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isOwnProfile && isAuthenticated && (
        <EditProfileDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
        />
      )}
    </div>
  );
};

export default PrimalProfileDisplay;
