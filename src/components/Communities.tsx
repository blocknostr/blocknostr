import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService, EVENT_KINDS } from "@/lib/nostr";
import { Community } from "./community/CommunityCard";
import SearchBar from "./community/SearchBar";
import CreateCommunityDialog from "./community/CreateCommunityDialog";
import CommunitiesGrid from "./community/CommunitiesGrid";
import { formatSerialNumber } from "@/lib/community-utils";
import { toast } from "sonner";

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectingRelays, setConnectingRelays] = useState(false);

  const currentUserPubkey = nostrService.publicKey;
  // Use the adapter method from the service directly
  const isLoggedIn = nostrService.isLoggedIn();
  
  // Connect to relays and fetch communities
  const connectAndFetch = useCallback(async () => {
    try {
      setConnectingRelays(true);
      
      // Use the service method directly
      if (!nostrService.hasConnectedRelays()) {
        await nostrService.connectToUserRelays();
      }
      
      setConnectingRelays(false);
      
      // If still no relays connected, show an error
      if (!nostrService.hasConnectedRelays()) {
        toast.error("Failed to connect to relays. Please try again later.");
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error connecting to relays:", error);
      toast.error("Failed to connect to relays. Please try again later.");
      setConnectingRelays(false);
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    const loadCommunities = async () => {
      try {
        setLoading(true);
        await connectAndFetch();
        
        // Subscribe to community events
        const communitySubId = nostrService.subscribe(
          [
            {
              kinds: [EVENT_KINDS.COMMUNITY],
              limit: 30
            }
          ],
          handleCommunityEvent
        );
        
        setLoading(false);
        
        return () => {
          nostrService.unsubscribe(communitySubId);
        };
      } catch (error) {
        console.error("Error loading communities:", error);
        toast.error("Error loading communities. Please try again later.");
        setLoading(false);
      }
    };
    
    loadCommunities();
  }, [connectAndFetch]);
  
  const handleCommunityEvent = (event: NostrEvent) => {
    try {
      if (!event || !event.id) return;
      
      // Find the unique identifier tag
      const idTag = event.tags?.find(tag => tag?.length >= 2 && tag[0] === 'd');
      if (!idTag) return;
      const uniqueId = idTag[1];
      
      // Parse community data - handle possible JSON parse errors
      let communityData: any = {};
      try {
        communityData = event.content ? JSON.parse(event.content) : {};
      } catch (parseError) {
        console.error("Error parsing community JSON:", parseError);
        // Skip malformed community data
        return;
      }
      
      // Skip communities without a proper name or with the name 'Unnamed Community'
      if (!communityData.name || communityData.name.trim() === '' || communityData.name === 'Unnamed Community') {
        return;
      }
      
      // Get members from tags
      const memberTags = event.tags?.filter(tag => tag?.length >= 2 && tag[0] === 'p') || [];
      const members = memberTags.map(tag => tag[1]);
      
      const community: Community = {
        id: event.id,
        name: communityData.name,
        description: communityData.description || '',
        image: communityData.image || '',
        creator: event.pubkey || '',
        createdAt: event.created_at,
        members,
        uniqueId
      };
      
      setCommunities(prev => {
        // Check if we already have this community by ID
        if (prev.some(c => c.id === community.id)) {
          return prev;
        }
        
        // Check if we have a community with the same uniqueId but older
        const existingIndex = prev.findIndex(c => c.uniqueId === uniqueId);
        if (existingIndex >= 0) {
          // Replace if this one is newer
          if (prev[existingIndex].createdAt < community.createdAt) {
            const updated = [...prev];
            updated[existingIndex] = community;
            return updated;
          }
          return prev;
        }
        
        // Otherwise add as new
        return [...prev, community];
      });
    } catch (e) {
      console.error("Error processing community event:", e);
    }
  };
  
  // Assign serial numbers to communities
  const communitiesWithNumbers = communities.map((community, index) => ({
    ...community,
    serialNumber: index + 1
  }));
  
  // Filter communities based on search term (name or serial number)
  const filteredCommunities = communitiesWithNumbers.filter(community => {
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Check if searching for a serial number
    if (searchLower.startsWith('#')) {
      // Format the community's serial number for comparison
      const communitySerialFormat = formatSerialNumber(community.serialNumber || 0);
      // Compare with search term, ignoring case
      return communitySerialFormat.toLowerCase().includes(searchLower);
    }
    
    // Otherwise search by name or direct serial number match
    return (
      community.name.toLowerCase().includes(searchLower) || 
      (community.serialNumber && community.serialNumber.toString().includes(searchTerm))
    );
  });
  
  const userCommunities = filteredCommunities.filter(community => 
    community.members.includes(currentUserPubkey || '')
  );
  
  const handleOpenCreateDialog = () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to create a community");
      return;
    }
    
    // Use the service method directly
    if (!nostrService.hasConnectedRelays()) {
      toast.error("No relays connected. Please try again later.");
      connectAndFetch();
      return;
    }
    
    setIsDialogOpen(true);
  };
  
  return (
    <div className="flex flex-col">
      <div className="mb-6 space-y-4">
        <SearchBar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          placeholderText="Search by name or #ABC123" 
        />
        
        <CreateCommunityDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} />
      </div>
      
      {(loading || connectingRelays) && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-muted-foreground">
            {connectingRelays ? "Connecting to relays..." : "Loading communities..."}
          </p>
        </div>
      )}
      
      {!loading && !connectingRelays && (
        <div className="pb-6">
          <CommunitiesGrid 
            communities={communitiesWithNumbers}
            userCommunities={userCommunities}
            filteredCommunities={filteredCommunities}
            loading={loading}
            currentUserPubkey={currentUserPubkey}
            onCreateCommunity={handleOpenCreateDialog}
          />
        </div>
      )}
    </div>
  );
};

export default Communities;
