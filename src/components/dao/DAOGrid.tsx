
import React from "react";
import DAOCard from "./DAOCard";
import { DAO } from "@/types/dao";

interface DAOGridProps {
  daos: DAO[];
  currentUserPubkey: string;
}

const DAOGrid: React.FC<DAOGridProps> = ({ daos, currentUserPubkey }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {daos.map(dao => (
        <DAOCard 
          key={dao.id}
          dao={dao}
          isMember={dao.members.includes(currentUserPubkey)}
          currentUserPubkey={currentUserPubkey}
        />
      ))}
    </div>
  );
};

export default DAOGrid;
