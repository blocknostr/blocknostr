
import { Loader2 } from "lucide-react";

const CommunityLoading = () => {
  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </div>
    </div>
  );
};

export default CommunityLoading;

