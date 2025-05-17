
import React, { useState, useEffect, useRef } from "react";
import { Loader2, Search, Plus, AlertCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DAOGrid from "./DAOGrid";
import DAOEmptyState from "./DAOEmptyState";
import { DAO } from "@/types/dao";
import CreateDAODialog from "./CreateDAODialog";
import { useDAO } from "@/hooks/useDAO";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { toast } from "sonner";

interface DAOListProps {
  type: "discover" | "my-daos" | "trending";
}

const ITEMS_PER_PAGE = 6;

const DAOList: React.FC<DAOListProps> = ({ type }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const {
    daos,
    myDaos,
    trendingDaos,
    loading,
    loadingMyDaos,
    loadingTrending,
    createDAO,
    currentUserPubkey,
    refreshDaos
  } = useDAO();
  
  // Determine which list and loading state to use based on type
  const getDaoList = () => {
    switch (type) {
      case "my-daos": 
        return myDaos;
      case "trending": 
        return trendingDaos;
      default: 
        return daos;
    }
  };
  
  const getLoadingState = () => {
    switch (type) {
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
  
  // Get virtualized list of DAOs
  const virtualizedDaos = filteredDaos.slice(0, displayLimit);
  
  // Connection check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Wait 5 seconds and check if we have any data
        await new Promise(resolve => setTimeout(resolve, 5000));
        if (!isLoading && type === "discover" && daos.length === 0) {
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
  }, [isLoading, daos.length, type]);
  
  // Intersection observer for infinite scrolling
  useIntersectionObserver({
    target: loadMoreRef,
    onIntersect: () => {
      if (displayLimit < filteredDaos.length && !isLoading) {
        setDisplayLimit(prev => Math.min(prev + ITEMS_PER_PAGE, filteredDaos.length));
      }
    },
    enabled: displayLimit < filteredDaos.length
  });
  
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
  
  // Reset display limit when search changes
  useEffect(() => {
    setDisplayLimit(ITEMS_PER_PAGE);
  }, [searchTerm]);

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

      {isLoading && daoList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Loading DAOs from Nostr network...</p>
        </div>
      ) : filteredDaos.length > 0 ? (
        <>
          <DAOGrid daos={virtualizedDaos} currentUserPubkey={currentUserPubkey || ""} />
          
          {/* Load more indicator */}
          {displayLimit < filteredDaos.length && (
            <div 
              ref={loadMoreRef} 
              className="flex justify-center items-center py-4"
            >
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      ) : (
        <DAOEmptyState onCreateDAO={() => setCreateDialogOpen(true)} />
      )}
    </div>
  );
};

export default DAOList;
