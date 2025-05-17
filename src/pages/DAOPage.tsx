
import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import DAOList from "@/components/dao/DAOList";
import { Gavel, Compass } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiscoverDAOs from "@/components/dao/DiscoverDAOs";

const DAOPage = () => {
  const [activeTab, setActiveTab] = useState<string>("myDaos");
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <PageHeader 
            title="Decentralized Autonomous Organizations"
            description="Discover and participate in on-chain governance"
            icon={<Gavel />}
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="myDaos">My DAOs</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>
            
            <TabsContent value="myDaos" className="space-y-4">
              <DAOList />
            </TabsContent>
            
            <TabsContent value="discover" className="space-y-4">
              <DiscoverDAOs />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DAOPage;
