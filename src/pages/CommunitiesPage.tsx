
import Sidebar from "@/components/Sidebar";
import Communities from "@/components/Communities";

const CommunitiesPage = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            <h1 className="font-semibold">Communities</h1>
          </div>
        </header>
        
        <div className="flex-1">
          <Communities />
        </div>
      </div>
    </div>
  );
};

export default CommunitiesPage;
