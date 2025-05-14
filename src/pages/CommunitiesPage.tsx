
import React from "react";
import Communities from "@/components/Communities";
import PageHeader from "@/components/navigation/PageHeader";

const CommunitiesPage = () => {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Communities"
        showBackButton={false}
      />
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Communities />
      </div>
    </div>
  );
};

export default CommunitiesPage;
