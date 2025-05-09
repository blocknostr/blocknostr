
import Sidebar from "@/components/Sidebar";
import Communities from "@/components/Communities";
import { Toaster } from "@/components/ui/sonner";

const CommunitiesPage = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64 overflow-hidden">
        <Communities />
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
};

export default CommunitiesPage;
