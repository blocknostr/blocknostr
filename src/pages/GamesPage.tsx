
import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const GamesPage = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Games"
        description="Play games on the Alephium blockchain"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Games Coming Soon</CardTitle>
          <CardDescription>
            BlockNostr games are currently in development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Stay tuned for exciting blockchain games that will be available on this page.
            Games will integrate with your Alephium wallet and Nostr identity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GamesPage;
