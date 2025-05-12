
'use client';

import Communities from "@/components/Communities";
import { Toaster } from "@/components/ui/sonner";
import PageHeader from "@/components/navigation/PageHeader";

export default function CommunitiesPage() {
  return (
    <>
      <PageHeader 
        title="Communities" 
        showBackButton={true}
      />
      
      <div className="flex-1 overflow-hidden">
        <div className="h-[calc(100vh-3.5rem)] overflow-auto">
          <Communities />
          <Toaster position="bottom-right" />
        </div>
      </div>
    </>
  );
}
