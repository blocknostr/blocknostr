
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";

const CommunityLoading = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </div>
    </div>
  );
};

export default CommunityLoading;
