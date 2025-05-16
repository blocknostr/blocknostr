
import React, { useState } from "react";
import DAOList from "@/components/dao/DAOList";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAOPage = () => {
  const [activeTab, setActiveTab] = useState<string>("discover");
  
  return (
    <div className="flex flex-col">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <PageHeader 
          heading="Decentralized Autonomous Organizations"
          description="Discover and participate in on-chain governance"
        />
        
        <Tabs 
          defaultValue="discover" 
          className="w-full mt-6" 
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="w-full sm:w-auto mb-4">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="my-daos">My DAOs</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>
          
          <TabsContent value="discover" className="mt-2">
            <DAOList type="discover" />
          </TabsContent>
          
          <TabsContent value="my-daos" className="mt-2">
            <DAOList type="my-daos" />
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
