
'use client';

import NotebinContainer from "@/components/notebin/NotebinContainer";
import PageHeader from "@/components/navigation/PageHeader";

export default function NotebinPage() {
  return (
    <>
      <PageHeader 
        title="Notebin" 
        showBackButton={true}
      />
      
      <div className="flex-1">
        <NotebinContainer />
      </div>
    </>
  );
}
