
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAlephiumDApps, DAppProject } from "@/lib/api/dappsApi";
import { toast } from "@/components/ui/sonner";

// Fallback dApps that we show if API fails
const fallbackDapps = [
  {
    id: "ayin",
    name: "Ayin Finance",
    description: "Lending protocol for Alephium",
    url: "https://app.ayin.finance",
    category: "DeFi",
    status: "production"
  },
  {
    id: "guppy",
    name: "Guppy DEX",
    description: "Decentralized exchange for Alephium",
    url: "https://app.guppy.fi",
    category: "DEX",
    status: "production"
  },
  {
    id: "checkin",
    name: "CheckIn dApp",
    description: "Check-in dApp for the Alephium ecosystem",
    url: "https://checkin-six.vercel.app/",
    category: "Social",
    status: "beta"
  },
  {
    id: "nfta",
    name: "NFTA Marketplace",
    description: "NFT marketplace for Alephium",
    url: "https://nfta.vercel.app/",
    category: "NFT",
    status: "beta"
  }
];

// Categories for filtering
const categories = ["All", "DeFi", "NFT", "DEX", "Social", "Gaming", "Tools"];

const DAppsSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Fetch dApps from alph.land API
  const { data: alphLandDapps, isLoading, error } = useQuery({
    queryKey: ['alph-land-dapps'],
    queryFn: fetchAlephiumDApps,
    meta: {
      onSettled: (data, error) => {
        if (error) toast.error("Failed to fetch DApps from alph.land")
      }
    }
  });

  // Use the API data or fallback to static list
  const allDapps = React.useMemo(() => {
    if (!alphLandDapps || alphLandDapps.length === 0) return fallbackDapps;
    return alphLandDapps;
  }, [alphLandDapps]);
  
  // Filter dApps by category
  const filteredDapps = React.useMemo(() => {
    if (activeCategory === "All") return allDapps;
    return allDapps.filter(dapp => dapp.category === activeCategory);
  }, [allDapps, activeCategory]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>DApp Integrations</CardTitle>
        <CardDescription>Interact with Alephium dApps from alph.land</CardDescription>
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
              <Card key={dapp.id || dapp.name} className="overflow-hidden border-none shadow-md">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-primary/30 to-primary/10 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {dapp.logo && (
                          <img 
                            src={dapp.logo} 
                            alt={`${dapp.name} logo`}
                            className="w-8 h-8 rounded-full object-cover bg-background" 
                          />
                        )}
                        <div>
                          <h3 className="text-md font-medium">{dapp.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{dapp.description}</p>
                        </div>
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
