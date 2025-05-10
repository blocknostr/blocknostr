import { useState, useEffect } from "react";
import { NostrEvent, nostrService, EVENT_KINDS } from "@/lib/nostr";
import { Community } from "./community/CommunityCard";
import SearchBar from "./community/SearchBar";
import CreateCommunityDialog from "./community/CreateCommunityDialog";
import CommunitiesGrid from "./community/CommunitiesGrid";
import { formatSerialNumber } from "@/lib/community-utils";

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const currentUserPubkey = nostrService.publicKey;
  
  useEffect(() => {
    const loadCommunities = async () => {
      await nostrService.connectToUserRelays();
      
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
        // Provide minimal fallback data structure if parsing fails
        communityData = {
          name: 'Unnamed Community',
          description: '',
          image: '',
        };
      }
      
      // Get members from tags
      const memberTags = event.tags.filter(tag => tag.length >= 2 && tag[0] === 'p');
      const members = memberTags.map(tag => tag[1]);
      
      const community: Community = {
        id: event.id,
        name: communityData.name || 'Unnamed Community',
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
  
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-auto">
      <div className="p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Communities</h1>
          <CreateCommunityDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} />
        </div>
        
        <SearchBar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          placeholderText="Search by name or #ABC123" 
        />
      </div>
      
      <div className="flex-1 p-4">
        <CommunitiesGrid 
          communities={communitiesWithNumbers}
          userCommunities={userCommunities}
          filteredCommunities={filteredCommunities}
          loading={loading}
          currentUserPubkey={currentUserPubkey}
          onCreateCommunity={() => setIsDialogOpen(true)}
        />
      </div>
    </div>
  );
};

export default Communities;
