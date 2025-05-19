
import React from "react";
import Sidebar from "@/components/Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
