
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAlephiumDApps, LinxLabsProject } from "@/lib/api/linxlabsApi";
import { handleError } from "@/lib/utils/errorHandling";

// Hardcoded dApps that we always want to show
const staticDapps = [
  {
    name: "Ayin Finance",
    description: "Lending protocol for Alephium",
    url: "https://app.ayin.finance",
    category: "DeFi"
  },
  {
    name: "Guppy DEX",
    description: "Decentralized exchange for Alephium",
    url: "https://app.guppy.fi",
    category: "DEX"
  },
  {
    name: "CheckIn dApp",
    description: "Check-in dApp for the Alephium ecosystem",
    url: "https://checkin-six.vercel.app/",
    category: "Social"
  },
  {
    name: "NFTA Marketplace",
    description: "NFT marketplace for Alephium",
    url: "https://nfta.vercel.app/",
    category: "NFT"
  }
];

// Categories for filtering
const categories = ["All", "DeFi", "NFT", "DEX", "Social", "Gaming", "Tools"];

const DAppsSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Fetch dApps from LinxLabs API
  const { data: linxLabsProjects, isLoading, error } = useQuery({
    queryKey: ['linxlabs-dapps'],
    queryFn: fetchAlephiumDApps,
    onError: (err) => handleError(err, {
      toastMessage: "Failed to fetch DApps from LinxLabs",
      logMessage: "LinxLabs API error"
    })
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
      <CardHeader>
        <CardTitle>DApp Integrations</CardTitle>
        <CardDescription>Interact with Alephium dApps</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Categories Filter */}
        <div className="mb-4 overflow-auto pb-2">
          <Tabs defaultValue="All" value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="inline-flex h-9 w-auto">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category}
                  value={category}
                  className="text-xs px-3"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* DApps Grid */}
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Failed to load dApps</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : filteredDapps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No dApps found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDapps.map((dapp) => (
              <Card key={dapp.name} className="overflow-hidden border-none shadow-md">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-primary/30 to-primary/10 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-md font-medium">{dapp.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{dapp.description}</p>
                      </div>
                      {dapp.status && (
                        <Badge variant={
                          dapp.status === 'production' ? 'default' : 
                          dapp.status === 'beta' ? 'secondary' : 
                          'outline'
                        } className="text-xs">
                          {dapp.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <Badge variant="outline" className="text-xs bg-background/50">
                        {dapp.category || "Other"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-background/80 backdrop-blur-sm"
                        asChild
                      >
                        <a 
                          href={dapp.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <span>Launch</span>
                          <ExternalLink className="ml-1 h-3 w-3" />
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
