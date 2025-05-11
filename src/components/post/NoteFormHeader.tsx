
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NoteFormHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NoteFormHeader: React.FC<NoteFormHeaderProps> = ({ 
  activeTab, 
  setActiveTab 
}) => {
  return (
    <TabsList className="mb-2 w-full bg-transparent border-b p-0 h-auto">
      <TabsTrigger 
        value="compose" 
        className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-1 text-sm"
      >
        Compose
      </TabsTrigger>
      <TabsTrigger 
        value="templates" 
        className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-1 text-sm"
      >
        Quick Replies
      </TabsTrigger>
    </TabsList>
  );
};

export default NoteFormHeader;
