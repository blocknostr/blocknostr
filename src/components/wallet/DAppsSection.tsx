
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle } from "lucide-react";

interface DAppsSectionProps {
  address: string;
  isLoggedIn: boolean;
}

const DAppsSection: React.FC<DAppsSectionProps> = ({ address, isLoggedIn }) => {
  // Sample dApps that integrate with Alephium
  const dApps = [
    {
      name: "Ayin Finance",
      description: "DeFi lending and borrowing platform",
      url: "https://app.ayin.finance",
      logo: "https://ayinfinance.com/assets/logo.png"
    },
    {
      name: "Alephium DEX",
      description: "Decentralized token exchange",
      url: "https://dex.alephium.org",
      logo: "https://alephium.org/assets/dex-logo.png"
    },
    {
      name: "Bridge",
      description: "Cross-chain asset transfer",
      url: "https://bridge.alephium.org",
      logo: "https://alephium.org/assets/bridge-logo.png"
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alephium dApps</CardTitle>
          <CardDescription>Connect to decentralized applications in the Alephium ecosystem</CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoggedIn ? (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 mb-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Connect your wallet to interact with dApps directly
                </p>
              </div>
            </div>
          ) : null}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dApps.map(dApp => (
              <Card key={dApp.name} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {/* Placeholder for logo */}
                      <span className="font-bold text-primary">{dApp.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{dApp.name}</h3>
                      <p className="text-xs text-muted-foreground">{dApp.description}</p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    disabled={!isLoggedIn}
                    asChild
                  >
                    <a 
                      href={`${dApp.url}?address=${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <span>Open dApp</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DAppsSection;
