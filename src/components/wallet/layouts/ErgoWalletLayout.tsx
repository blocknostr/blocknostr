
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddressDisplay from "../AddressDisplay";

interface ErgoWalletLayoutProps {
  address: string;
}

const ErgoWalletLayout: React.FC<ErgoWalletLayoutProps> = ({ address }) => {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-background">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="font-bold text-blue-500">E</span>
            </div>
            <div>
              <CardTitle>Ergo Wallet</CardTitle>
              <p className="text-sm text-muted-foreground">View your ERG holdings</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AddressDisplay address={address} label="Connected Wallet" />
          
          <div className="mt-6 p-4 bg-muted rounded-lg text-center">
            <p className="text-lg font-medium">Ergo Integration</p>
            <p className="text-sm text-muted-foreground mt-1">
              Full Ergo blockchain integration coming soon to BlockNoster!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErgoWalletLayout;

