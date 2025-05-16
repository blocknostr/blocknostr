
import React, { useState } from "react";
import DAOList from "@/components/dao/DAOList";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nostrService } from "@/lib/nostr";
import { Button } from "@/components/ui/button";
import { Gavel, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DAOPage = () => {
  const [activeTab, setActiveTab] = useState<string>("discover");
  const navigate = useNavigate();
  const isLoggedIn = !!nostrService.publicKey;
  
  const handleLogin = () => {
    // Implement login flow
    nostrService.login().then(() => {
      window.location.reload(); // Refresh after login
    });
  };
  
  return (
    <div className="flex flex-col">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <PageHeader 
          title="Decentralized Autonomous Organizations"
          description="Discover and participate in on-chain governance"
          icon={<Gavel />}
          rightContent={
            !isLoggedIn ? (
              <Button onClick={handleLogin}>Login to Create & Join DAOs</Button>
            ) : null
          }
        />
        
        <Tabs 
          defaultValue="discover" 
          className="w-full mt-6" 
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="w-full sm:w-auto mb-4">
            <TabsTrigger value="discover">
              <Gavel className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="my-daos" disabled={!isLoggedIn}>
              <Users className="h-4 w-4 mr-2" />
              My DAOs
            </TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>
          
          <TabsContent value="discover" className="mt-2">
            <DAOList type="discover" />
          </TabsContent>
          
          <TabsContent value="my-daos" className="mt-2">
            {isLoggedIn ? (
              <DAOList type="my-daos" />
            ) : (
              <div className="text-center py-16">
                <h3 className="text-lg font-medium mb-2">Login to view your DAOs</h3>
                <p className="text-muted-foreground mb-6">
                  You need to be logged in to view and manage your DAOs.
                </p>
                <Button onClick={handleLogin}>Login with Nostr</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="trending" className="mt-2">
            <DAOList type="trending" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DAOPage;
