
import React, { useState, useEffect } from "react";
import { Loader2, Search, Compass } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DAOCarousel from "./DAOCarousel";
import { useDAO } from "@/hooks/useDAO";
import { fetchAlephiumDApps } from "@/lib/api/linxlabsApi";
import { DAO } from "@/types/dao";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const DiscoverDAOs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredDAOs, setFeaturedDAOs] = useState<DAO[]>([]);
  const [trendingDAOs, setTrendingDAOs] = useState<DAO[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const { daos, currentUserPubkey, fetchGeneralDAOs, joinDAO } = useDAO();
  
  // Handle joining a DAO with navigate
  const handleJoinDAO = async (daoId: string, daoName: string) => {
    if (!currentUserPubkey) {
      toast.error("Please login to join this DAO");
      return;
    }
    
    try {
      const success = await joinDAO(daoId);
      if (success) {
        toast.success(`Successfully joined ${daoName}!`, {
          description: "Redirecting to DAO page..."
        });
        
        // Navigate to the DAO page
        setTimeout(() => {
          navigate(`/dao/${daoId}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Error joining DAO:", error);
      toast.error("Failed to join the DAO");
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch general DAOs if not loaded
        if (daos.length === 0) {
          await fetchGeneralDAOs();
        }
        
        // Try to get Alephium projects from LinxLabs API to display as DAOs
        const alephiumProjects = await fetchAlephiumDApps();
        
        // Map projects to DAO format
        const projectDAOs = alephiumProjects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description || "An Alephium project",
          image: project.logo || "https://alephium.org/img/logo-simplified.svg",
          creator: "alephium-project",
          createdAt: Date.now() / 1000 - Math.random() * 30 * 24 * 60 * 60, // Random date within last 30 days
          members: Array(Math.floor(Math.random() * 20) + 3).fill(""),
          moderators: ["alephium-mod"],
          treasury: {
            balance: Math.floor(Math.random() * 10000),
            tokenSymbol: "ALPH"
          },
          proposals: Math.floor(Math.random() * 5),
          activeProposals: Math.floor(Math.random() * 3),
          tags: project.tags || [project.category || "DeFi"].filter(Boolean),
          isPrivate: false,
          alephiumProject: project.id
        }));
        
        // Get all available DAOs (combine Nostr DAOs with Alephium projects)
        const allDAOs = [...daos, ...projectDAOs];
        
        if (allDAOs.length > 0) {
          // Featured DAOs - first 3 (prioritize actual DAOs)
          setFeaturedDAOs(allDAOs.slice(0, Math.min(3, allDAOs.length)));
          
          // Trending DAOs - next 4
          setTrendingDAOs(allDAOs.slice(3, Math.min(7, allDAOs.length)));
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
              <DAOCarousel 
                daos={filteredFeaturedDAOs} 
                currentUserPubkey={currentUserPubkey || ""} 
                onJoinDAO={handleJoinDAO}
              />
            </div>
          )}
          
          {/* Trending DAOs */}
          {filteredTrendingDAOs.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-2xl font-semibold">Trending DAOs</h2>
              <DAOCarousel 
                daos={filteredTrendingDAOs} 
                currentUserPubkey={currentUserPubkey || ""} 
                onJoinDAO={handleJoinDAO}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiscoverDAOs;
