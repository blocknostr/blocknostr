
import React, { useState, useEffect } from "react";
import { Loader2, Search, Compass } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DAOCarousel from "./DAOCarousel";
import { useDAO } from "@/hooks/useDAO";
import { fetchAlephiumDApps } from "@/lib/api/linxlabsApi";
import { DAO } from "@/types/dao";

const DiscoverDAOs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredDAOs, setFeaturedDAOs] = useState<DAO[]>([]);
  const [trendingDAOs, setTrendingDAOs] = useState<DAO[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { daos, currentUserPubkey, fetchGeneralDAOs } = useDAO();
  
  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch general DAOs if not loaded
        if (daos.length === 0) {
          await fetchGeneralDAOs();
        }
        
        // In a real app, these would be fetched from backend with specific criteria
        // For now, we'll just simulate different categories from the available DAOs
        
        // Get all available DAOs
        const allDAOs = [...daos];
        
        if (allDAOs.length > 0) {
          // Featured DAOs - first 3
          setFeaturedDAOs(allDAOs.slice(0, 3));
          
          // Trending DAOs - next 4
          setTrendingDAOs(allDAOs.slice(3, 7));
        }
      } catch (error) {
        console.error("Failed to load discover DAOs data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [daos, fetchGeneralDAOs]);
  
  // Filter all DAOs by search term
  const filterDAOs = (daoList: DAO[]) => {
    if (!searchTerm) return daoList;
    
    return daoList.filter(dao => 
      dao.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      dao.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };
  
  // Filtered DAOs
  const filteredFeaturedDAOs = filterDAOs(featuredDAOs);
  const filteredTrendingDAOs = filterDAOs(trendingDAOs);
  
  // Check if any results exist after filtering
  const hasResults = filteredFeaturedDAOs.length > 0 || filteredTrendingDAOs.length > 0;
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Discovering DAOs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
      </div>
      
      {!hasResults && searchTerm ? (
        <div className="text-center py-12">
          <Compass className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No DAOs found</h3>
          <p className="text-muted-foreground mb-6">
            We couldn't find any DAOs matching "{searchTerm}"
          </p>
          <Button variant="outline" onClick={() => setSearchTerm("")}>Clear search</Button>
        </div>
      ) : (
        <>
          {/* Featured DAOs */}
          {filteredFeaturedDAOs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Featured DAOs</h2>
              <DAOCarousel daos={filteredFeaturedDAOs} currentUserPubkey={currentUserPubkey || ""} />
            </div>
          )}
          
          {/* Trending DAOs */}
          {filteredTrendingDAOs.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-2xl font-semibold">Trending DAOs</h2>
              <DAOCarousel daos={filteredTrendingDAOs} currentUserPubkey={currentUserPubkey || ""} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiscoverDAOs;
