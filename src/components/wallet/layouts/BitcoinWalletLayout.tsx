
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bitcoin } from "lucide-react";
import AddressDisplay from "../AddressDisplay";

interface BitcoinWalletLayoutProps {
  address: string;
}

const BitcoinWalletLayout: React.FC<BitcoinWalletLayoutProps> = ({ address }) => {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-background">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Bitcoin className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <CardTitle>Bitcoin Wallet</CardTitle>
              <p className="text-sm text-muted-foreground">View your BTC holdings</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AddressDisplay address={address} label="Connected Wallet" />
          
          <div className="mt-6 p-4 bg-muted rounded-lg text-center">
            <p className="text-lg font-medium">Bitcoin Integration</p>
            <p className="text-sm text-muted-foreground mt-1">
              Full Bitcoin integration coming soon to BlockNoster!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BitcoinWalletLayout;

