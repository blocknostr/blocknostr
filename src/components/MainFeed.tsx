
import { useState } from "react";
import { nostrService } from "@/lib/nostr";
import CreateNoteForm from "./CreateNoteForm";
import FollowingFeed from "./FollowingFeed";
import GlobalFeed from "./feed/GlobalFeed";
import ForYouFeed from "./feed/ForYouFeed";
import MediaFeed from "./feed/MediaFeed";
import TrendingTopics from "./feed/TrendingTopics";
import SavedHashtags from "./feed/SavedHashtags";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Image } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MainFeedProps {
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const MainFeed = ({ activeHashtag, onClearHashtag }: MainFeedProps) => {
  const [activeTab, setActiveTab] = useState("global");
  const isLoggedIn = !!nostrService.publicKey;
  const isMobile = useIsMobile();

  const handleTopicClick = (topic: string) => {
    if (onClearHashtag) {
      // First clear any existing hashtag
      onClearHashtag();
      
      // Then set the new one - this should be handled by the parent component
      // which will pass it back down as activeHashtag
      if (window.location.pathname === "/") {
        window.dispatchEvent(new CustomEvent('set-hashtag', { detail: topic }));
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-b pb-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Home</h1>
          {activeHashtag && (
            <div className="flex items-center">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-md flex items-center gap-2">
                #{activeHashtag}
                <button 
                  onClick={onClearHashtag} 
                  className="rounded-full hover:bg-primary/20 p-1 transition-colors"
                  title="Clear filter"
                >
                  <X size={14} />
                </button>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* User's saved hashtags for quick access */}
      <SavedHashtags onTopicClick={handleTopicClick} />
      
      {/* Trending topics at the top */}
      <TrendingTopics onTopicClick={handleTopicClick} />
      
      <CreateNoteForm />
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mt-4"
      >
        <TabsList className={cn(
          "w-full mb-4",
          isMobile ? "grid grid-cols-4" : ""
        )}>
          <TabsTrigger value="global" className="flex-1">Global</TabsTrigger>
          <TabsTrigger 
            value="following" 
            className="flex-1" 
            disabled={!isLoggedIn}
          >
            Following
          </TabsTrigger>
          <TabsTrigger value="for-you" className="flex-1">
            For You
          </TabsTrigger>
          <TabsTrigger value="media" className="flex-1">
            <Image className="h-4 w-4 mr-1" />
            Media
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          <GlobalFeed activeHashtag={activeHashtag} />
        </TabsContent>
        
        <TabsContent value="following">
          {!isLoggedIn ? (
            <div className="py-8 text-center text-muted-foreground">
              You need to log in to see posts from people you follow.
            </div>
          ) : (
            <FollowingFeed activeHashtag={activeHashtag} />
          )}
        </TabsContent>
        
        <TabsContent value="for-you">
          <ForYouFeed activeHashtag={activeHashtag} />
        </TabsContent>
        
        <TabsContent value="media">
          <MediaFeed activeHashtag={activeHashtag} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainFeed;
