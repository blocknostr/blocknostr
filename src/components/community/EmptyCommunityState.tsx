
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyCommunityStateProps {
  onCreateCommunity: () => void;
}

const EmptyCommunityState = ({ onCreateCommunity }: EmptyCommunityStateProps) => {
  return (
    <div className="text-center col-span-full rounded-lg border bg-card/50 p-12 shadow-sm animate-fade-in">
      <Users className="h-12 w-12 mx-auto mb-4 text-primary opacity-60" />
      <h3 className="text-lg font-medium mb-2">No communities found</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Communities are where people with similar interests connect, share ideas, and build together.
      </p>
      <Button onClick={onCreateCommunity} className="transition-all hover:scale-105">
        <Plus className="h-4 w-4 mr-2" />
        Create Community
      </Button>
    </div>
  );
};

export default EmptyCommunityState;
