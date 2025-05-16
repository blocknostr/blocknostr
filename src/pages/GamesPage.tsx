
import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NostrPetGame from "@/components/games/nosterpet/NostrPetGame";
import ComingSoonGames from "@/components/games/ComingSoonGames";
import { useWallet } from "@alephium/web3-react";

const GamesPage = () => {
  const { connectionStatus } = useWallet();
  const isConnected = connectionStatus === 'connected';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="BlockNoster Games"
        description="Play blockchain games that integrate Alephium, Nostr, and Bitcoin"
      />
      
      <Tabs defaultValue="nosterpet" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="nosterpet">NostrPet</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Games</TabsTrigger>
        </TabsList>
        
        <TabsContent value="nosterpet" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-primary">NostrPet</span> 
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">BETA</span>
              </CardTitle>
              <CardDescription>
                Raise a virtual pet that lives on the Alephium blockchain and integrates with your Nostr identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <NostrPetGame />
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                  <p className="font-semibold mb-2">Wallet Connection Required</p>
                  <p>Please connect your Alephium wallet from the Wallets page to play NostrPet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-6">
          <ComingSoonGames />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamesPage;
