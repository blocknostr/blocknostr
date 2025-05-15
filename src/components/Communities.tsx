
import { useState, useEffect } from "react";
import { NostrEvent, nostrService, EVENT_KINDS } from "@/lib/nostr";
import { Community } from "./community/CommunityCard";
import SearchBar from "./community/SearchBar";
import CreateCommunityDialog from "./community/CreateCommunityDialog";
import CommunitiesGrid from "./community/CommunitiesGrid";
import { formatSerialNumber } from "@/lib/community-utils";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectedToRelays, setConnectedToRelays] = useState(false);

  const currentUserPubkey = nostrService.publicKey;
  
  useEffect(() => {
    const loadCommunities = async () => {
      try {
        // Connect to relays and verify connection status
        const connectedRelays = await nostrService.connectToUserRelays();
        
        if (connectedRelays.length === 0) {
          console.warn("No relays connected, trying default relays");
          await nostrService.connectToDefaultRelays();
        }
        
        const finalRelayUrls = nostrService.getRelayUrls();
        console.log("Connected to relays:", finalRelayUrls);
        
        setConnectedToRelays(finalRelayUrls.length > 0);
        
        if (finalRelayUrls.length === 0) {
          toast.error("Failed to connect to any relays", {
            description: "Please try refreshing the page or check your network connection"
          });
        }
        
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
        console.error("Error connecting to relays:", error);
        toast.error("Failed to load communities", {
          description: "There was an error connecting to relays. Please try again."
        });
        setLoading(false);
      }
    };
    
    loadCommunities();
  }, []);
  
  const handleCommunityEvent = (event: NostrEvent) => {
    try {
      if (!event.id) return;
      
      // Find the unique identifier tag
      const idTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
      if (!idTag) return;
      const uniqueId = idTag[1];
      
      // Parse community data - handle possible JSON parse errors
      let communityData;
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
      const memberTags = event.tags.filter(tag => tag.length >= 2 && tag[0] === 'p');
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
  
  const handleCreateCommunityClick = async () => {
    // Verify login status
    if (!currentUserPubkey) {
      toast.error("You must be logged in to create a community", {
        description: "Please login first using the button in the header"
      });
      return;
    }
    
    // Verify relay connections
    if (!connectedToRelays) {
      try {
        const connectedRelays = await nostrService.connectToUserRelays();
        setConnectedToRelays(connectedRelays.length > 0);
        
        if (connectedRelays.length === 0) {
          toast.error("Cannot connect to relays", {
            description: "Please check your network connection and try again"
          });
          return;
        }
      } catch (error) {
        console.error("Failed to connect to relays:", error);
        toast.error("Connection error", {
          description: "Failed to connect to Nostr relays"
        });
        return;
      }
    }
    
    // Open dialog if checks passed
    setIsDialogOpen(true);
  };
  
  return (
    <div className="flex flex-col">
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            placeholderText="Search by name or #ABC123" 
            className="flex-1"
          />
          
          <Button 
            onClick={handleCreateCommunityClick}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            New Community
          </Button>
        </div>
        
        <CreateCommunityDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} />
      </div>
      
      <div className="pb-6">
        <CommunitiesGrid 
          communities={communitiesWithNumbers}
          userCommunities={userCommunities}
          filteredCommunities={filteredCommunities}
          loading={loading}
          currentUserPubkey={currentUserPubkey}
          onCreateCommunity={handleCreateCommunityClick}
        />
      </div>
    </div>
  );
};

export default Communities;
