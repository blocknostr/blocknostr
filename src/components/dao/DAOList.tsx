import { useState, useEffect } from "react";
import { NostrEvent, nostrService, EVENT_KINDS } from "@/lib/nostr";
import { Community } from "../community/CommunityCard";
import SearchBar from "../community/SearchBar";
import CreateDAODialog from "./CreateDAODialog";
import DAOGrid from "./DAOGrid";
import { formatSerialNumber } from "@/lib/community-utils";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { PlusCircle } from "lucide-react";
import { useNostrAuth } from "@/hooks/useNostrAuth"; 
import { useNostrRelays } from "@/hooks/useNostrRelays";

const DAOList = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Use our new hooks for authentication and relay management
  const { isLoggedIn, currentUserPubkey } = useNostrAuth();
  const { isConnected, connectToRelays } = useNostrRelays();
  
  useEffect(() => {
    const loadCommunities = async () => {
      try {
        // Use our improved relay connection function
        const connected = await connectToRelays({
          showToast: true,
          fallbackRelays: [
            "wss://relay.damus.io",
            "wss://nos.lol",
            "wss://relay.nostr.band",
            "wss://relay.snort.social"
          ]
        });
        
        if (!connected) {
          toast.error("Failed to connect to any relays", {
            description: "Please try refreshing the page or check your network connection"
          });
        }
        
        // Subscribe to community events (NIP-172)
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
        toast.error("Failed to load DAOs", {
          description: "There was an error connecting to relays. Please try again."
        });
        setLoading(false);
      }
    };
    
    loadCommunities();
  }, [connectToRelays]);
  
  const handleCommunityEvent = (event: NostrEvent) => {
    try {
      if (!event.id) return;
      
      // Find the unique identifier tag (NIP-172)
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
      
      // Get members from tags per NIP-172
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
    // Verify login status with our auth hook
    if (!isLoggedIn) {
      toast.error("You must be logged in to create a DAO", {
        description: "Please login first using the button in the header"
      });
      return;
    }
    
    // Verify relay connections with our relay hook
    if (!isConnected) {
      try {
        const connected = await connectToRelays();
        
        if (!connected) {
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
            New DAO
          </Button>
        </div>
        
        <CreateDAODialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} />
      </div>
      
      <div className="pb-6">
        <DAOGrid 
          communities={communitiesWithNumbers}
          userCommunities={userCommunities}
          filteredCommunities={filteredCommunities}
          loading={loading}
          currentUserPubkey={currentUserPubkey}
          onCreateCommunity={handleCreateCommunityClick}
          searchTerm={searchTerm}  // Add the searchTerm prop here
        />
      </div>
    </div>
  );
};

export default DAOList;
