
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyCommunityStateProps {
  onCreateCommunity: () => void;
}

const EmptyCommunityState = ({ onCreateCommunity }: EmptyCommunityStateProps) => {
  return (
    <div className="text-center col-span-full rounded-lg bg-muted/30 p-12">
      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h3 className="text-lg font-medium mb-2">No communities found</h3>
      <p className="text-muted-foreground mb-6">Create a new community to get started!</p>
      <Button onClick={onCreateCommunity}>
        <Plus className="h-4 w-4 mr-2" />
        Create Community
      </Button>
    </div>
  );
};

export default EmptyCommunityState;
