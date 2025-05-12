
import React from 'react';
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";

const YouPageLoading: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your profile...</span>
      </div>
    </div>
  );
};

export default YouPageLoading;
