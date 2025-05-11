
import React from "react";
import MainFeed from "@/components/MainFeed";
import { ConnectionStatusBanner } from "@/components/feed/ConnectionStatusBanner";

interface MainContentProps {
  activeHashtag: string | undefined;
  onClearHashtag: () => void;
}

const MainContent: React.FC<MainContentProps> = ({
  activeHashtag,
  onClearHashtag
}) => {
  return (
    <main className="flex-1 border-r min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <ConnectionStatusBanner />
        <MainFeed 
          activeHashtag={activeHashtag} 
          onClearHashtag={onClearHashtag}
        />
      </div>
    </main>
  );
};

export default MainContent;
