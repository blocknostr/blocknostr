
import React, { useState } from "react";
import { nostrService } from "@/lib/nostr";
import CreateNoteForm from "./CreateNoteForm";
import FollowingFeed from "./FollowingFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useGlobalFeed } from "@/hooks/useGlobalFeed";
import GlobalFeedContent from "./feed/GlobalFeedContent";
import GlobalFeedLoading from "./feed/GlobalFeedLoading";
import GlobalFeedEmpty from "./feed/GlobalFeedEmpty";

interface MainFeedProps {
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const MainFeed = ({ activeHashtag, onClearHashtag }: MainFeedProps) => {
  const [activeTab, setActiveTab] = useState("global");
  const isLoggedIn = !!nostrService.publicKey;
  const isMobile = useIsMobile();
  
  const {
    events,
    profiles,
    repostData,
    loading,
    hasMore,
    loadMoreEvents,
    handleRetweetStatusChange
  } = useGlobalFeed({ activeHashtag });
  
  const {
    loadMoreRef,
    loading: scrollLoading,
    setLoading,
    hasMore: scrollHasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { initialLoad: true });

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
      
      <CreateNoteForm />
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mt-4"
      >
        <TabsList className={cn(
          "w-full mb-4",
          isMobile ? "grid grid-cols-2" : ""
        )}>
          <TabsTrigger value="global" className="flex-1">Global</TabsTrigger>
          <TabsTrigger 
            value="following" 
            className="flex-1" 
            disabled={!isLoggedIn}
          >
            Following
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          {activeHashtag && events.length === 0 && !loading && (
            <GlobalFeedEmpty activeHashtag={activeHashtag} />
          )}
          
          {loading && events.length === 0 ? (
            <GlobalFeedLoading activeHashtag={activeHashtag} />
          ) : (
            <GlobalFeedContent
              events={events}
              profiles={profiles}
              repostData={repostData}
              loadMoreRef={loadMoreRef}
              loading={loading || scrollLoading}
              onRetweetStatusChange={handleRetweetStatusChange}
            />
          )}
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
      </Tabs>
    </div>
  );
};

export default MainFeed;
