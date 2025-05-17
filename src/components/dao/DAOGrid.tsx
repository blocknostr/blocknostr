
import React from "react";
import DAOCard from "./DAOCard";
import { DAO } from "@/types/dao";

interface DAOGridProps {
  daos: DAO[];
  currentUserPubkey: string;
}

const DAOGrid: React.FC<DAOGridProps> = ({ daos, currentUserPubkey }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {daos.map(dao => (
        <DAOCard 
          key={dao.id}
          dao={dao}
          currentUserPubkey={currentUserPubkey}
        />
      ))}
    </div>
  );
};

export default DAOGrid;
