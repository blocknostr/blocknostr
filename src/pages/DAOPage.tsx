
import React from "react";
import Communities from "@/components/dao/DAOList";
import PageHeader from "@/components/navigation/PageHeader";

const DAOPage = () => {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="DAO"
        showBackButton={false}
      />
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Communities />
      </div>
    </div>
  );
};

export default DAOPage;
