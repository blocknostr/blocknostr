import React, { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings2, RefreshCw } from "lucide-react";
import { useNostr } from "@/contexts/NostrContext";
import CreateNoteForm from "@/components/CreateNoteForm";
import GlobalFeed from "@/components/feed/GlobalFeed";
import FollowingFeed from "@/components/FollowingFeed";
import CustomizeGlobalFeedDialog from "@/components/feed/CustomizeGlobalFeedDialog";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { toast } from "sonner";

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("global");
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { publicKey } = useNostr();
  const isLoggedIn = !!publicKey;

  const { preferences, updateNestedPreference } = useUserPreferences();

  const handleRefresh = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
    toast.info(`Refreshing ${activeTab} feed...`);
  }, [activeTab]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Top controls: Refresh and Customize */}
      <div className="flex justify-end items-center mb-4 space-x-2">
        <Button variant="ghost" size="icon" onClick={handleRefresh} aria-label="Refresh feed">
          <RefreshCw className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsCustomizeOpen(true)} aria-label="Customize feed">
          <Settings2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Create Note Form */}
      {isLoggedIn && (
        <div className="mb-6">
          <CreateNoteForm />
        </div>
      )}

      {/* Feed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="global" className="flex-1">Global</TabsTrigger>
          <TabsTrigger value="following" className="flex-1" disabled={!isLoggedIn}>Following</TabsTrigger>
        </TabsList>
        <TabsContent value="global" className="mt-4">
          <GlobalFeed key={`global-feed-${refreshKey}`} />
        </TabsContent>
        <TabsContent value="following" className="mt-4">
          {isLoggedIn ? (
            <FollowingFeed key={`following-feed-${refreshKey}`} />
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                Log in to see posts from people you follow.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Customize Global Feed Dialog */}
      <CustomizeGlobalFeedDialog 
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultHashtags={preferences.feedFilters?.globalFeedTags || []}
        onSave={(hashtags) => {
          updateNestedPreference('feedFilters', 'globalFeedTags', hashtags);
          toast.success("Global feed preferences saved!");
        }}
      />
    </div>
  );
};

export default HomePage;
