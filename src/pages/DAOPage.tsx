
import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import DAOList from "@/components/dao/DAOList";
import { Gavel } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";

const DAOPage = () => {
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
          
          <DAOList />
        </div>
      </div>
    </div>
  );
};

export default DAOPage;
