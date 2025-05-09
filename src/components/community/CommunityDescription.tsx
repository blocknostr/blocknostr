
import React from "react";
import { Users } from "lucide-react";

interface CommunityDescriptionProps {
  description: string;
  membersCount: number;
  createdAt: number;
}

const CommunityDescription = ({ 
  description, 
  membersCount, 
  createdAt 
}: CommunityDescriptionProps) => {
  return (
    <>
      <p className="text-muted-foreground mb-4">
        {description || "No description provided."}
      </p>
      
      <div className="flex items-center text-sm text-muted-foreground">
        <Users className="h-4 w-4 mr-1" />
        <span>{membersCount} members</span>
        <span className="mx-1">•</span>
        <span>Created {new Date(createdAt * 1000).toLocaleDateString()}</span>
      </div>
    </>
  );
};

export default CommunityDescription;
