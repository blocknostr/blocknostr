
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const DAppsSection = () => {
  const dapps = [
    {
      name: "Ayin Finance",
      description: "Lending protocol for Alephium",
      url: "https://app.ayin.finance"
    },
    {
      name: "Guppy DEX",
      description: "Decentralized exchange for Alephium",
      url: "https://app.guppy.fi"
    },
    {
      name: "CheckIn dApp",
      description: "Check-in dApp for the Alephium ecosystem",
      url: "https://checkin-six.vercel.app/"
    },
    {
      name: "NFTA Marketplace",
      description: "NFT marketplace for Alephium",
      url: "https://nfta.vercel.app/"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>DApp Integrations</CardTitle>
        <CardDescription>Interact with Alephium dApps</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dapps.map((dapp) => (
            <Card key={dapp.name} className="overflow-hidden border-none shadow-md">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-primary/30 to-primary/10 p-4">
                  <h3 className="text-md font-medium">{dapp.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{dapp.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 bg-background/80 backdrop-blur-sm"
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
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DAppsSection;
