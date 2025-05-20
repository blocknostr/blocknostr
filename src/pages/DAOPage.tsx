import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import DAOList from "@/components/dao/DAOList";
import { Gavel, Compass } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiscoverDAOs from "@/components/dao/DiscoverDAOs";
import { useLocation } from "react-router-dom";

const DAOPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>("myDaos");
  
  // Check if we have a state with activeTab from navigation
  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state after using it to prevent it from persisting on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  return (
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
  );
};

export default DAOPage;
