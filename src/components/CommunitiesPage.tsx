
import React from "react";
import Communities from "@/components/Communities";
import { Toaster } from "@/components/ui/sonner";

const CommunitiesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Communities />
      <Toaster position="bottom-right" />
    </div>
  );
};

export default CommunitiesPage;
