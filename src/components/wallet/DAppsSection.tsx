
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Star, ArrowRight } from "lucide-react";
import { toast } from "@/lib/toast";

// Hardcoded dApps that we always want to show
const staticDapps = [
  {
    name: "Ayin Finance",
    description: "Lending protocol for Alephium",
    url: "https://app.ayin.finance",
    category: "DeFi",
    status: "production",
    featured: true
  },
  {
    name: "Guppy DEX",
    description: "Decentralized exchange for Alephium",
    url: "https://app.guppy.fi",
    category: "DEX",
    status: "production",
    featured: true
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
    status: "beta",
    featured: true
  }
];

// Categories for filtering
const categories = ["All", "DeFi", "NFT", "DEX", "Social", "Gaming", "Tools"];

const DAppsSection = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Use only static dApps (LinxLabs API removed)
  const allDapps = staticDapps;
  
  // Filter dApps by category
  const filteredDapps = React.useMemo(() => {
    if (activeCategory === "All") return allDapps;
    return allDapps.filter(dapp => dapp.category === activeCategory);
  }, [allDapps, activeCategory]);

  // Get featured dApps
  const featuredDapps = React.useMemo(() => {
    return allDapps.filter(dapp => (dapp as any).featured);
  }, [allDapps]);

  return (
    <div className="space-y-8">
      {/* Featured DApps Section */}
      {featuredDapps.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Star className="h-4 w-4 mr-2 text-yellow-500" />
            Featured DApps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredDapps.map((dapp) => (
              <Card key={`featured-${dapp.name}`} className="overflow-hidden border-none shadow-md bg-gradient-to-br from-primary/20 via-primary/10 to-background">
                <CardContent className="p-0">
                  <div className="p-4">
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
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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
          {filteredDapps.length === 0 ? (
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
    </div>
  );
};

export default DAppsSection;

