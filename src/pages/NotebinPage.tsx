
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import NotebinHeader from "@/components/notebin/NotebinHeader";
import NotebinContainer from "@/components/notebin/NotebinContainer";

const NotebinPage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar - conditionally shown */}
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden ${sidebarVisible ? 'block' : 'hidden'}`} 
           onClick={() => setSidebarVisible(false)}>
        <div className="w-64 h-full bg-background border-r" onClick={e => e.stopPropagation()}>
          <Sidebar />
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <NotebinHeader toggleSidebar={toggleSidebar} />
        <NotebinContainer />
      </div>
    </div>
  );
};

export default NotebinPage;
