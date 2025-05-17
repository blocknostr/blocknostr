
import React, { useState, useEffect, useRef } from "react";
import { Loader2, Search, Plus, AlertCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DAOGrid from "./DAOGrid";
import DAOEmptyState from "./DAOEmptyState";
import { DAO } from "@/types/dao";
import CreateDAODialog from "./CreateDAODialog";
import { useDAO } from "@/hooks/useDAO";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { toast } from "sonner";
import DAOCarousel from "./DAOCarousel";
import { nostrService } from "@/lib/nostr";
import { Users } from "lucide-react";

const ITEMS_PER_PAGE = 6;

const DAOList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("trending");
  
  const isLoggedIn = !!nostrService.publicKey;
  
  const {
    daos,
    myDaos,
    trendingDaos,
    loading,
    loadingMyDaos,
    loadingTrending,
    createDAO,
    currentUserPubkey,
    refreshDaos,
    fetchGeneralDAOs,
    fetchMyDAOs,
    fetchTrendingDAOs
  } = useDAO();
  
  // Lazy load only the data for the current tab
  useEffect(() => {
    const loadTabData = async () => {
      switch (activeTab) {
        case "my-daos":
          if (currentUserPubkey) {
            await fetchMyDAOs();
          }
          break;
        case "trending":
          await fetchTrendingDAOs();
          break;
      }
    };
    
    loadTabData();
  }, [activeTab, currentUserPubkey, fetchMyDAOs, fetchTrendingDAOs]);
  
  // Determine which list and loading state to use based on active tab
  const getDaoList = () => {
    switch (activeTab) {
      case "my-daos": 
        return myDaos;
      case "trending": 
        return trendingDaos;
      default: 
        return daos;
    }
  };
  
  const getLoadingState = () => {
    switch (activeTab) {
      case "my-daos": 
        return loadingMyDaos;
      case "trending": 
        return loadingTrending;
      default: 
        return loading;
    }
  };
  
  const daoList = getDaoList();
  const isLoading = getLoadingState();
  
  // Filter by search term
  const filteredDaos = searchTerm 
    ? daoList.filter(dao => 
        dao.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        dao.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dao.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : daoList;
  
  // Split the DAOs into carousel and remaining display portions
  const carouselDaos = filteredDaos.slice(0, ITEMS_PER_PAGE);
  const remainingDaos = filteredDaos.slice(ITEMS_PER_PAGE);
  
  // Connection check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Wait 5 seconds and check if we have any data
        await new Promise(resolve => setTimeout(resolve, 5000));
        if (!isLoading && daoList.length === 0) {
          console.warn("No DAOs loaded after timeout, possible connection issue");
          setConnectionError(true);
        } else {
          setConnectionError(false);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };
    
    checkConnection();
  }, [isLoading, daoList.length]);
  
  const handleCreateDAO = async (name: string, description: string, tags: string[]) => {
    const daoId = await createDAO(name, description, tags);
    if (daoId) {
      setCreateDialogOpen(false);
    }
  };
  
  const handleRetryConnection = () => {
    setConnectionError(false);
    refreshDaos();
  };
  
  const handleRefreshDAOs = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    toast.info("Refreshing DAOs...");
    
    try {
      await refreshDaos();
      toast.success("DAOs refreshed successfully");
    } catch (error) {
      console.error("Error refreshing DAOs:", error);
      toast.error("Failed to refresh DAOs");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleLogin = () => {
    nostrService.login().then(() => {
      window.location.reload(); // Refresh after login
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search DAOs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={handleRefreshDAOs}
            disabled={isRefreshing || isLoading}
            className="w-full sm:w-auto"
            title="Refresh DAOs"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="w-full sm:w-auto"
            disabled={!currentUserPubkey}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create DAO
          </Button>
        </div>
        
        <CreateDAODialog 
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreateDAO={handleCreateDAO}
        />
      </div>
      
      {/* Connection error alert */}
      {connectionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Unable to connect to Nostr relays or no DAOs found. Please check your connection and try again.
            </span>
            <Button variant="outline" onClick={handleRetryConnection} size="sm" className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs 
        defaultValue="trending" 
        className="w-full" 
        onValueChange={handleTabChange}
      >
        <TabsList className="w-full sm:w-auto mb-4">
          <TabsTrigger value="my-daos" disabled={!isLoggedIn}>
            <Users className="h-4 w-4 mr-2" />
            My DAOs
          </TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-daos" className="mt-2">
          {activeTab === "my-daos" && (
            isLoggedIn ? (
              isLoading ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Loading your DAOs...</p>
                </div>
              ) : filteredDaos.length > 0 ? (
                <div className="space-y-8">
                  <DAOCarousel daos={carouselDaos} currentUserPubkey={currentUserPubkey || ""} />
                  
                  {remainingDaos.length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-medium mb-4">Additional DAOs</h3>
                      <DAOGrid daos={remainingDaos} currentUserPubkey={currentUserPubkey || ""} />
                    </div>
                  )}
                </div>
              ) : (
                <DAOEmptyState onCreateDAO={() => setCreateDialogOpen(true)} />
              )
            ) : (
              <div className="text-center py-16">
                <h3 className="text-lg font-medium mb-2">Login to view your DAOs</h3>
                <p className="text-muted-foreground mb-6">
                  You need to be logged in to view and manage your DAOs.
                </p>
                <Button onClick={handleLogin}>Login with Nostr</Button>
              </div>
            )
          )}
        </TabsContent>
        
        <TabsContent value="trending" className="mt-2">
          {activeTab === "trending" && (
            isLoading ? (
              <div className="flex flex-col items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Loading trending DAOs from Nostr network...</p>
              </div>
            ) : filteredDaos.length > 0 ? (
              <div className="space-y-8">
                <DAOCarousel daos={carouselDaos} currentUserPubkey={currentUserPubkey || ""} />
                
                {remainingDaos.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Additional DAOs</h3>
                    <DAOGrid daos={remainingDaos} currentUserPubkey={currentUserPubkey || ""} />
                  </div>
                )}
              </div>
            ) : (
              <DAOEmptyState onCreateDAO={() => setCreateDialogOpen(true)} />
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DAOList;
