// My Communities Page - Dedicated page for community discovery and management
// Uses community-focused terminology while maintaining all DAO functionality

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Users, 
  Search
} from "lucide-react";
import { useDAOCommunities, useMyDAOs, useCreateDAO } from "@/hooks/api/useDAORedux";
import CommunitiesGrid from "./components/CommunitiesGrid";
import CreateCommunityDialog from "./components/CreateCommunityDialog";
import { toast } from "@/lib/toast";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nostrService } from "@/lib/nostr";

const MyCommunitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("discover");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const navigate = useNavigate();
  
  const currentUserPubkey = nostrService.publicKey;
  const isLoggedIn = !!currentUserPubkey;

  // Redux hooks for DAO data
  const {
    daos: generalDAOs,
    loading: generalLoading,
    error: generalError,
    refetch: refetchGeneral
  } = useDAOCommunities({ 
    limit: 50, 
    enabled: true 
  });

  const {
    daos: myDaos,
    loading: loadingMyDaos,
    error: myDaosError,
    refetch: refetchMyDAOs
  } = useMyDAOs(currentUserPubkey || '', isLoggedIn);

  // Debug logging
  console.log('[MyCommunitiesPage] Debug info:', {
    currentUserPubkey,
    isLoggedIn,
    generalDAOsLength: generalDAOs.length,
    generalLoading,
    generalError,
    myDaosLength: myDaos.length,
    loadingMyDaos,
    myDaosError,
    activeTab,
    generalDAOs: generalDAOs.slice(0, 2), // Show first 2 general DAOs
    myDaos: myDaos.slice(0, 2) // Show first 2 user DAOs for debugging
  });

  const {
    createDAO,
    loading: createLoading,
    error: createError
  } = useCreateDAO();

  // Use appropriate data based on tab
  const daos = generalDAOs;
  const loading = generalLoading;

  // Get communities for discover tab
  const discoverCommunities = useMemo(() => {
    if (!searchTerm) return daos;
    
    return daos.filter(dao => 
      dao.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [daos, searchTerm]);

  // Filter communities based on search term for "My Communities" tab
  const filteredMyDaos = useMemo(() => {
    if (!searchTerm) return myDaos;
    return myDaos.filter(dao => 
      dao.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [myDaos, searchTerm]);

  // Calculate tab counts (simplified without trending tab)
  const tabCounts = useMemo(() => ({
    discover: discoverCommunities.length || daos.length,
    myDaos: myDaos.length
  }), [discoverCommunities.length, daos.length, myDaos.length]);

  const handleCreateCommunity = async (name: string, description: string, tags: string[], avatar?: string, banner?: string) => {
    try {
      const communityId = await createDAO(name, description, tags, avatar, banner);
      if (communityId) {
        toast.success("Community created successfully!", {
          description: "Redirecting to your new community..."
        });
        setIsCreateOpen(false);
        
        // Navigate to the new community page immediately
        setTimeout(() => {
          navigate(`/communities/${communityId}`);
        }, 500);
        
        return communityId;
      }
      return null;
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community");
      return null;
    }
  };

  const handleJoinCommunity = async (communityId: string, communityName: string) => {
    try {
      // TODO: Implement join functionality in Redux
      toast.success(`Join functionality coming soon for ${communityName}!`);
      
      // Navigate to the community page
      setTimeout(() => {
        navigate(`/communities/${communityId}`);
      }, 1000);
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };

  const handleTabChange = useCallback((value: string) => {
    console.log(`[MyCommunitiesPage] User manually changed tab to: ${value}`);
    setActiveTab(value);
    setIsInitialLoad(false); // Mark that user has interacted
    
    // Clear search when switching tabs
    setSearchTerm("");
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  }, []);

  // Consolidated initialization effect to prevent race conditions
  useEffect(() => {
    let isMounted = true;
    
    const initializeUser = async () => {
      // Get the current user pubkey from nostr service
      const finalUserPubkey = nostrService.publicKey;
      const finalIsLoggedIn = !!finalUserPubkey;
      
      // Set default tab based on user login status - ONLY on initial load
      if (isInitialLoad) {
        if (finalUserPubkey && activeTab === "discover") {
          console.log("[MyCommunitiesPage] Setting initial default tab to my-communities for logged in user");
          setActiveTab("my-communities");
        } else if (!finalUserPubkey && activeTab === "my-communities") {
          console.log("[MyCommunitiesPage] Setting initial default tab to discover for logged out user");
          setActiveTab("discover");
        }
        setIsInitialLoad(false);
      }
      
      // Trigger initial data fetch for My DAOs when user is logged in
      if (finalUserPubkey && finalIsLoggedIn) {
        console.log("[MyCommunitiesPage] Triggering initial fetch for My DAOs");
        refetchMyDAOs();
      }
      
      // Always trigger general DAOs fetch
      console.log("[MyCommunitiesPage] Triggering initial fetch for general DAOs");
      refetchGeneral();
    };
    
    initializeUser();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="space-y-3">
        {/* Header - more compact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Communities
            </h1>
            <p className="text-muted-foreground text-sm">
              Discover, join, and participate in decentralized communities on Nostr
            </p>
          </div>
          
          <CreateCommunityDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onCreateCommunity={handleCreateCommunity}
          >
            <Button size="default" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Community
            </Button>
          </CreateCommunityDialog>
        </div>

        {/* Search - more compact */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search communities by name, description, or tags..."
              className="pl-10 pr-4 h-9"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Main Content - more compact */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {currentUserPubkey && (
              <TabsTrigger value="my-communities" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Communities
                {tabCounts.myDaos > 0 && (
                  <span className="ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                    {tabCounts.myDaos}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discover
              {tabCounts.discover > 0 && (
                <span className="ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                  {tabCounts.discover}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab - reduced spacing */}
          <TabsContent value="discover" className="space-y-4 mt-4">
            {searchTerm ? (
              // Search Results
              <CommunitiesGrid
                communities={discoverCommunities}
                currentUserPubkey={currentUserPubkey || ""}
                onJoinCommunity={handleJoinCommunity}
                loading={loading}
                title={`Search Results for "${searchTerm}"`}
                emptyMessage={`No communities found for "${searchTerm}"`}
                emptyActionLabel="Create Community"
                onEmptyAction={() => setIsCreateOpen(true)}
              />
            ) : (
              // All Communities Content
              <CommunitiesGrid
                communities={discoverCommunities}
                currentUserPubkey={currentUserPubkey || ""}
                onJoinCommunity={handleJoinCommunity}
                loading={loading}
                variant="default"
                title="🌍 All Communities"
                emptyMessage="No communities found"
                emptyActionLabel="Create Community"
                onEmptyAction={() => setIsCreateOpen(true)}
                itemsPerPage={6}
              />
            )}
          </TabsContent>

          {/* My Communities Tab - reduced spacing */}
          {currentUserPubkey && (
            <TabsContent value="my-communities" className="space-y-4 mt-4">
              <CommunitiesGrid
                communities={filteredMyDaos}
                currentUserPubkey={currentUserPubkey}
                onJoinCommunity={handleJoinCommunity}
                loading={loadingMyDaos}
                variant="default"
                title="My Communities"
                emptyMessage={searchTerm ? `No communities found for "${searchTerm}"` : "You haven't joined any communities yet"}
                emptyActionLabel={searchTerm ? "Clear search" : "Discover Communities"}
                onEmptyAction={() => {
                  if (searchTerm) {
                    setSearchTerm("");
                  } else {
                    setActiveTab("discover");
                  }
                }}
                onCreateAction={() => setIsCreateOpen(true)}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default MyCommunitiesPage; 
