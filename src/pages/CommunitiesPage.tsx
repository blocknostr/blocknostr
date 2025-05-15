
import React from "react";
import Communities from "@/components/Communities";
import PageHeader from "@/components/navigation/PageHeader";
import { Coins } from "lucide-react";

const CommunitiesPage = () => {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="DAOs & Communities"
        showBackButton={false}
        icon={<Coins className="h-5 w-5 text-amber-500" />}
      />
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Communities />
      </div>
    </div>
  );
};

export default CommunitiesPage;
