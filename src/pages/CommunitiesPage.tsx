import React from "react";
import { useState, useEffect } from "react";
import { NostrEvent, nostrService, EVENT_KINDS } from "@/lib/nostr";
import { Community } from "@/components/community/CommunityCard";
import SearchBar from "@/components/community/SearchBar";
import CreateCommunityDialog from "@/components/community/CreateCommunityDialog";
import CommunitiesGrid from "@/components/community/CommunitiesGrid";
import { formatSerialNumber } from "@/lib/community-utils";
import PageHeader from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "sonner";

const ITEMS_PER_PAGE = 12;

const CommunitiesPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

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
  
  // Further filter based on active tab
  const tabFilteredCommunities = 
    activeTab === "mine" 
      ? filteredCommunities.filter(community => community.members.includes(currentUserPubkey || ''))
      : activeTab === "others" 
      ? filteredCommunities.filter(community => !community.members.includes(currentUserPubkey || ''))
      : filteredCommunities;

  // Calculate total pages for pagination
  const totalPages = Math.ceil(tabFilteredCommunities.length / ITEMS_PER_PAGE);
  
  // Get current page items
  const currentItems = tabFilteredCommunities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the page on pagination change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate array of pages for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 3; // Show at most 3 page numbers
    
    if (totalPages <= maxVisiblePages) {
      // If we have 3 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include the first page
      pages.push(1);
      
      // Calculate the range of pages to show around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(startPage + maxVisiblePages - 2, totalPages - 1);
      
      // Adjust if we're near the end
      if (endPage === totalPages - 1) {
        startPage = Math.max(2, endPage - (maxVisiblePages - 2));
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('ellipsis');
      }
      
      // Add the middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }
      
      // Always include the last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader 
        title="Communities" 
        showBackButton={false}
        className="border-b shadow-sm"
        rightContent={
          <Button 
            size="sm" 
            onClick={() => setIsDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        }
      />
      
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="all">All Communities</TabsTrigger>
                <TabsTrigger value="mine">My Communities</TabsTrigger>
                <TabsTrigger value="others">Discover</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="w-full md:w-1/3">
              <SearchBar 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                placeholderText="Search by name or #ABC123" 
              />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="min-h-[50vh]">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, index) => (
                <CommunityCardSkeleton key={index} />
              ))}
            </div>
          ) : tabFilteredCommunities.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No communities found matching your search" : "No communities available"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === "mine" ? 
                  "You haven't joined any communities yet." : 
                  "Create a new community to get started!"}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {currentItems.map(community => (
                  <div key={community.id} className="animate-fade-in">
                    <CommunityCard 
                      community={community}
                      isMember={(community.members || []).includes(currentUserPubkey || '')}
                      currentUserPubkey={currentUserPubkey}
                    />
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === 'ellipsis' ? (
                          <span className="flex h-9 w-9 items-center justify-center">...</span>
                        ) : (
                          <PaginationLink 
                            isActive={currentPage === page} 
                            onClick={() => handlePageChange(page as number)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>
      
      <CreateCommunityDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} />
      <Toaster position="bottom-right" />
    </div>
  );
};

// Add a skeleton placeholder for community cards during loading
const CommunityCardSkeleton = () => (
  <div className="border rounded-lg overflow-hidden bg-card h-[320px]">
    <Skeleton className="h-36 w-full rounded-t-lg" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-20 w-full" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  </div>
);

export default CommunitiesPage;
