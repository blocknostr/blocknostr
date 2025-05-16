
import React from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DAOEmptyStateProps {
  onCreateDAO: () => void;
}

const DAOEmptyState: React.FC<DAOEmptyStateProps> = ({ onCreateDAO }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Users className="h-6 w-6 text-primary" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">No DAOs found</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Couldn't find any DAOs matching your criteria. Create your own DAO to start building a community.
      </p>
      
      <Button onClick={onCreateDAO} className="animate-pulse">
        Create a DAO
      </Button>
    </div>
  );
};

export default DAOEmptyState;
