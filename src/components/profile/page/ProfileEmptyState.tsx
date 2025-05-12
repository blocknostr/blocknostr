
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ProfileEmptyStateProps {
  isCurrentUser: boolean;
  handleRefresh: () => void;
}

const ProfileEmptyState: React.FC<ProfileEmptyStateProps> = ({
  isCurrentUser,
  handleRefresh,
}) => {
  return (
    <div className="text-center py-8 text-muted-foreground">
      {isCurrentUser ? (
        <p>You haven't posted anything yet.</p>
      ) : (
        <p>This user hasn't posted anything yet.</p>
      )}
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={handleRefresh}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
};

export default ProfileEmptyState;
