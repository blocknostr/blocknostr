
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const AboutTab = () => {
  return (
    <Card className="border shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-xl font-semibold">About BlockNoster</CardTitle>
            <CardDescription>
              Information about this application
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted/20 rounded-md">
          <div className="space-y-4">
            <div className="flex justify-between">
              <p className="text-sm font-medium">Version</p>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">About</p>
              <p className="text-sm text-muted-foreground">
                BlockNoster is a decentralized application that combines 
                Alephium's scalable blockchain with Nostr's decentralized communication protocol.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border p-4 rounded-md hover:bg-muted/20 transition-colors">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Alephium Integration</h3>
              <p className="text-sm text-muted-foreground">
                High-throughput blockchain for on-chain operations with sharding technology 
                that provides scalable and secure transaction processing.
              </p>
            </div>
          </div>
          
          <div className="border p-4 rounded-md hover:bg-muted/20 transition-colors">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Nostr Integration</h3>
              <p className="text-sm text-muted-foreground">
                Decentralized protocol for social interactions with censorship-resistant 
                communication features and cryptographic security.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-4">
          <Button variant="outline" size="sm" className="gap-2">
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            <span>Documentation</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AboutTab;

