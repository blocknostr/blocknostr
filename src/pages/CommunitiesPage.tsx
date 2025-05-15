
import React from "react";
import Communities from "@/components/Communities";
import PageHeader from "@/components/navigation/PageHeader";
import { CoinIcon } from "lucide-react";

const CommunitiesPage = () => {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title={
          <div className="flex items-center">
            DAOs & Communities
            <CoinIcon className="ml-2 h-5 w-5 text-amber-500" />
          </div>
        }
        showBackButton={false}
      />
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Communities />
      </div>
    </div>
  );
};

export default CommunitiesPage;
