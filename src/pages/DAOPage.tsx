
import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import DAOList from "@/components/dao/DAOList";
import { Gavel } from "lucide-react";

const DAOPage = () => {
  return (
    <div className="flex flex-col">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <PageHeader 
          title="Decentralized Autonomous Organizations"
          description="Discover and participate in on-chain governance"
          icon={<Gavel />}
        />
        
        <DAOList />
      </div>
    </div>
  );
};

export default DAOPage;
