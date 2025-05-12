
import React from "react";
import { AlertCircle, KeyRound, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const ManualTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50/30 dark:bg-amber-900/10 rounded-lg border border-amber-200/30 dark:border-amber-800/30">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Manual login coming soon</h3>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              For the best security and experience, we recommend using a browser extension for now.
            </p>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="key" className="w-full">
        <TabsList className="grid grid-cols-2 mb-3 w-full h-8">
          <TabsTrigger value="key" className="text-xs h-7">Private Key</TabsTrigger>
          <TabsTrigger value="qr" className="text-xs h-7">QR Code</TabsTrigger>
        </TabsList>
        
        <TabsContent value="key" className="mt-2">
          <div className="p-4 border border-border/50 rounded-lg bg-muted/20">
            <div className="flex items-center mb-3">
              <KeyRound className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-sm font-medium">Private Key</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Enter your private key (nsec) to access your Nostr account. This method is less secure than using an extension.
            </p>
            <div className="space-y-2">
              <input 
                type="password" 
                placeholder="nsec1..." 
                className="w-full p-2 text-sm border border-border rounded bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                disabled={true}
              />
              <Button 
                className="w-full bg-muted/80 text-muted-foreground hover:bg-muted/90"
                disabled={true}
              >
                Coming Soon
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="qr" className="mt-2">
          <div className="p-4 border border-border/50 rounded-lg bg-muted/20">
            <div className="flex items-center mb-3">
              <QrCode className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-sm font-medium">QR Code</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Scan with a mobile Nostr app to connect. Ideal if you use mobile wallets like Amethyst or Damus.
            </p>
            <div className="h-32 flex items-center justify-center border border-dashed border-border/50 rounded bg-background/50">
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManualTab;
