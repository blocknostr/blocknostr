
import { Users, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyCommunityStateProps {
  message?: string;
  onCreateCommunity?: () => void;
  isSearchResult?: boolean;
}

const EmptyCommunityState = ({ 
  message = "No communities found", 
  onCreateCommunity,
  isSearchResult = false
}: EmptyCommunityStateProps) => {
  return (
    <div className="text-center py-12 rounded-lg bg-muted/30 p-12">
      {isSearchResult ? (
        <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      ) : (
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      )}
      
      <h3 className="text-lg font-medium mb-2">{message}</h3>
      
      <p className="text-muted-foreground mb-6">
        {isSearchResult 
          ? "Try adjusting your search terms or browse all communities" 
          : "Create a new community to get started!"}
      </p>
      
      {onCreateCommunity && (
        <Button onClick={onCreateCommunity}>
          <Plus className="h-4 w-4 mr-2" />
          Create Community
        </Button>
      )}
    </div>
  );
};

export default EmptyCommunityState;
