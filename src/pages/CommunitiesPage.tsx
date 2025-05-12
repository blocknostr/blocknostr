
import Sidebar from "@/components/Sidebar";
import Communities from "@/components/Communities";
import { Toaster } from "@/components/ui/sonner";

const CommunitiesPage = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64 overflow-hidden">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="text-xl font-semibold">Communities</h1>
          </div>
        </header>
        
        <div className="flex-1 h-[calc(100vh-3.5rem)] overflow-auto">
          <Communities />
          <Toaster position="bottom-right" />
        </div>
      </div>
    </div>
  );
};

export default CommunitiesPage;
