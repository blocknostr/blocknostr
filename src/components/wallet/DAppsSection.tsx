
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAlephiumDApps, LinxLabsProject } from "@/lib/api/linxlabsApi";
import { toast } from "@/components/ui/sonner";

// Hardcoded dApps that we always want to show
const staticDapps = [
  {
    name: "Ayin Finance",
    description: "Lending protocol for Alephium",
    url: "https://app.ayin.finance",
    category: "DeFi",
    status: "production"
  },
  {
    name: "Guppy DEX",
    description: "Decentralized exchange for Alephium",
    url: "https://app.guppy.fi",
    category: "DEX",
    status: "production"
  },
  {
    name: "CheckIn dApp",
    description: "Check-in dApp for the Alephium ecosystem",
    url: "https://checkin-six.vercel.app/",
    category: "Social",
    status: "beta"
  },
  {
    name: "NFTA Marketplace",
    description: "NFT marketplace for Alephium",
    url: "https://nfta.vercel.app/",
    category: "NFT",
    status: "beta"
  }
];

// Categories for filtering
const categories = ["All", "DeFi", "NFT", "DEX", "Social", "Tools"];

const DAppsSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Fetch dApps from LinxLabs API with the modified useQuery configuration
  const { data: linxLabsProjects, isLoading, error } = useQuery({
    queryKey: ['linxlabs-dapps'],
    queryFn: fetchAlephiumDApps,
    // Using onSettled instead of onError in @tanstack/react-query v5+
    meta: {
      onError: () => toast.error("Failed to fetch DApps from LinxLabs")
    }
  });

  // Combine static dApps with LinxLabs projects
  const allDapps = React.useMemo(() => {
    if (!linxLabsProjects) return staticDapps;
    
    // Convert LinxLabs projects to our format
    const formattedLinxLabsProjects = linxLabsProjects.map((project: LinxLabsProject) => ({
      name: project.name,
      description: project.description,
      url: project.url,
      category: project.category || "Other",
      logo: project.logo,
      status: project.status
    }));
    
    // Merge with static dApps and remove duplicates (based on URL)
    const combinedDapps = [...staticDapps];
    
    formattedLinxLabsProjects.forEach(project => {
      if (!combinedDapps.some(dapp => dapp.url === project.url)) {
        combinedDapps.push(project);
      }
    });
    
    return combinedDapps;
  }, [linxLabsProjects]);
  
  // Filter dApps by category
  const filteredDapps = React.useMemo(() => {
    if (activeCategory === "All") return allDapps;
    return allDapps.filter(dapp => dapp.category === activeCategory);
  }, [allDapps, activeCategory]);

  return (
    <Card>
      <CardContent className="p-4">
        {/* Categories Filter */}
        <div className="mb-2 overflow-auto">
          <Tabs defaultValue="All" value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="inline-flex h-8 w-auto">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category}
                  value={category}
                  className="text-xs px-3 py-1"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* DApps Grid */}
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary/70" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Failed to load dApps</p>
            <Button variant="outline" size="sm" className="mt-2 text-xs py-1 h-7" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : filteredDapps.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <p>No dApps found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {filteredDapps.slice(0, 6).map((dapp) => (
              <Card key={dapp.name} className="overflow-hidden border-none shadow-sm">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xs font-medium truncate">{dapp.name}</h3>
                      </div>
                      {dapp.status && (
                        <Badge variant={
                          dapp.status === 'production' ? 'default' : 
                          dapp.status === 'beta' ? 'secondary' : 
                          'outline'
                        } className="text-[10px] h-4">
                          {dapp.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="outline" className="text-[10px] bg-background/50">
                        {dapp.category || "Other"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-background/80 backdrop-blur-sm h-6 text-xs py-0 px-2"
                        asChild
                      >
                        <a 
                          href={dapp.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <span>Open</span>
                          <ExternalLink className="ml-1 h-2.5 w-2.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DAppsSection;
