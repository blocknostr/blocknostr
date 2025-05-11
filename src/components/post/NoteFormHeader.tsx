
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
    <div className="mb-2 border-b">
      <div className="flex">
        <button 
          onClick={() => setActiveTab("compose")}
          className={`flex-1 text-sm px-2 py-1 ${activeTab === 'compose' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Compose
        </button>
        <button 
          onClick={() => setActiveTab("templates")}
          className={`flex-1 text-sm px-2 py-1 ${activeTab === 'templates' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Quick Replies
        </button>
      </div>
    </div>
  );
};

export default NoteFormHeader;
