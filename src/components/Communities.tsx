import { useState, useEffect } from "react";
import { NostrEvent, nostrService, EVENT_KINDS } from "@/lib/nostr";
import { Community } from "./community/CommunityCard";
import SearchBar from "./community/SearchBar";
import CreateCommunityDialog from "./community/CreateCommunityDialog";
import CommunitiesGrid from "./community/CommunitiesGrid";
import { formatSerialNumber } from "@/lib/community-utils";
import { useWallet } from "@alephium/web3-react";
import { Button } from "./ui/button";
import { Coins } from "lucide-react";
import { AlephiumCommunity } from "@/lib/alephium/communityService";

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [onChainCommunities, setOnChainCommunities] = useState<AlephiumCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterBlockchain, setFilterBlockchain] = useState<'all' | 'onchain' | 'offchain'>('all');

  const currentUserPubkey = nostrService.publicKey;
  const wallet = useWallet();
  
  // Load communities from Nostr
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
  
  // Load on-chain communities (this would normally query an indexer service)
  useEffect(() => {
    const loadOnChainCommunities = async () => {
      // This would be replaced with actual blockchain queries
      // For now, we're mocking the data
      
      // Mock data for demonstration
      const mockOnChainCommunities: AlephiumCommunity[] = [
        {
          contractId: '1a2b3c4d5e6f',
          txId: '123456789abcdef',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'Alephium DAO',
          description: 'Official Alephium community DAO',
          creator: '0x1234567890abcdef1234567890abcdef12345678',
          memberCount: 42,
          isPrivate: false,
          createdAt: Date.now() / 1000 - 86400 * 7, // 7 days ago
          members: [],
          moderators: []
        },
        {
          contractId: '2a3b4c5d6e7f',
          txId: '234567890abcdef1',
          address: '0x2345678901abcdef2345678901abcdef23456789',
          name: 'DeFi Enthusiasts',
          description: 'Community for DeFi lovers on Alephium',
          creator: '0x2345678901abcdef2345678901abcdef23456789',
          memberCount: 28,
          isPrivate: true,
          createdAt: Date.now() / 1000 - 86400 * 3, // 3 days ago
          members: [],
          moderators: []
        }
      ];
      
      setOnChainCommunities(mockOnChainCommunities);
    };
    
    loadOnChainCommunities();
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
        uniqueId,
        // Add a flag to indicate blockchain-enabled communities
        onChain: !!communityData.txId // If there's a txId, it's an on-chain community
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
  
  // Filter communities based on search term and blockchain filter
  const filteredCommunities = communitiesWithNumbers.filter(community => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = searchLower === '' || 
      community.name.toLowerCase().includes(searchLower) || 
      (community.serialNumber && community.serialNumber.toString().includes(searchTerm)) ||
      (searchLower.startsWith('#') && formatSerialNumber(community.serialNumber || 0).toLowerCase().includes(searchLower));
    
    // Apply blockchain filter
    if (filterBlockchain === 'onchain' && !community.onChain) {
      return false;
    }
    if (filterBlockchain === 'offchain' && community.onChain) {
      return false;
    }
    
    return matchesSearch;
  });
  
  const userCommunities = filteredCommunities.filter(community => 
    community.members.includes(currentUserPubkey || '')
  );
  
  return (
    <div className="flex flex-col">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            placeholderText="Search by name or #ABC123" 
          />
          
          <div className="flex gap-2">
            <Button 
              variant={filterBlockchain === 'all' ? 'default' : 'outline'} 
              onClick={() => setFilterBlockchain('all')}
              size="sm"
            >
              All
            </Button>
            <Button 
              variant={filterBlockchain === 'onchain' ? 'default' : 'outline'} 
              onClick={() => setFilterBlockchain('onchain')}
              size="sm"
            >
              <Coins className="h-4 w-4 mr-2" />
              On-chain
            </Button>
            <Button 
              variant={filterBlockchain === 'offchain' ? 'default' : 'outline'} 
              onClick={() => setFilterBlockchain('offchain')}
              size="sm"
            >
              Off-chain
            </Button>
          </div>
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
          onCreateCommunity={() => setIsDialogOpen(true)}
          onChainCommunities={onChainCommunities}  // Pass on-chain communities
          filterBlockchain={filterBlockchain}
          walletStatus={wallet.connectionStatus}
        />
      </div>
    </div>
  );
};

export default Communities;
