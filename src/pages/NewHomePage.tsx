import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings2, Bitcoin } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import NewGlobalFeed from "@/components/feed/NewGlobalFeed";
import NewFollowingFeed from "@/components/feed/NewFollowingFeed";
import { useUserPreferences } from "@/hooks/business/useUserPreferences";
import CustomizeGlobalFeedDialog from "@/components/feed/CustomizeGlobalFeedDialog";
import { useResponsiveState } from "@/hooks/ui/use-responsive-provider";
import { useAuth } from "@/hooks/useAuth";

const NewHomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("global");
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { preferences, updateNestedPreference } = useUserPreferences();
  const { isLoggedIn } = useAuth();
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsiveState();
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS device
    const detectIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(detectIOS);
  }, []);

  // Callback for feed loading state changes
  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setActiveHashtag(undefined);
  };

  // Clear active hashtag filter
  const clearHashtag = () => {
    setActiveHashtag(undefined);
  };

  // Responsive spacing and layout
  const getContainerClasses = () => {
    if (isDesktop) {
      return "w-full max-w-4xl mx-auto"; // Let MainLayout handle centering
    }
    if (isTablet) {
      return "w-full max-w-3xl mx-auto px-4";
    }
    return "w-full px-4"; // Mobile
  };

  const getPaddingClasses = () => {
    if (isDesktop) return "py-6";
    if (isTablet) return "py-4";
    return `py-4 ${isIOS ? 'px-safe' : ''}`;
  };

  return (
    <div 
      className={`${getContainerClasses()} ${getPaddingClasses()}`}
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Login message for users not logged in */}
      {!isLoggedIn && (
        <div className={`mb-8 p-6 rounded-xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border border-primary/10 shadow-lg relative overflow-hidden ${isDesktop ? 'h-[160px]' : 'h-[140px]'}`}>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full translate-y-12 -translate-x-12" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-4 h-full">
            {/* Icon section */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className={`${isDesktop ? 'w-14 h-14' : 'w-12 h-12'} bg-gradient-to-br from-orange-500/20 to-orange-400/10 rounded-2xl flex items-center justify-center border border-orange-500/20 shadow-lg`}>
                  <div className={`${isDesktop ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center`}>
                    <Bitcoin className={`text-white ${isDesktop ? 'w-6 h-6' : 'w-5 h-5'}`} />
                  </div>
                </div>
                {/* Subtle glow effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 via-transparent to-orange-400/20 rounded-3xl blur-xl opacity-50" />
              </div>
            </div>
            
            {/* Content section */}
            <div className="flex-1">
              <div className="space-y-3">
                <h2 className={`${isDesktop ? 'text-2xl' : 'text-xl'} font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent`}>
                  Welcome to BlockNostr
                </h2>
                <p className={`${isDesktop ? 'text-base' : 'text-sm'} text-muted-foreground leading-relaxed`}>
                  Connect your Nostr extension to join the decentralized social network. 
                  Experience censorship-resistant communication powered by relays.
                </p>
                
                {/* Feature highlights */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <div className={`flex items-center gap-1.5 ${isDesktop ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span>Decentralized</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isDesktop ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    <span>Censorship-resistant</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isDesktop ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                    <span>Web3 powered</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CTA section - only show on desktop/tablet for space */}
            {!isMobile && (
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Get started</p>
                  <div className="flex items-center gap-1 text-xs font-medium text-primary">
                    <span>Connect Wallet</span>
                    <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Click Connect in header ↗</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fun promotional banner for logged-in users */}
      {isLoggedIn && (
        <div className={`mb-8 p-6 rounded-xl bg-gradient-to-r from-violet-500/10 via-orange-500/10 to-emerald-500/10 border border-violet-500/20 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${isDesktop ? 'h-[160px]' : 'h-[140px]'}`}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-orange-500/5 to-emerald-500/5 animate-pulse" />
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-orange-500/20 to-transparent rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }} />
          <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }} />
          
          <div className="relative flex items-center justify-between h-full">
            {/* Left side - rotating icons */}
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className={`${isDesktop ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center animate-pulse`}>
                  <span className={`text-white font-bold ${isDesktop ? 'text-base' : 'text-sm'}`}>N</span>
                </div>
                <div className={`${isDesktop ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center`}>
                  <Bitcoin className={`text-white ${isDesktop ? 'w-5 h-5' : 'w-4 h-4'}`} />
                </div>
                <div className={`${isDesktop ? 'w-10 h-10' : 'w-8 h-8'} bg-black rounded-lg flex items-center justify-center animate-pulse overflow-hidden`}>
                  <img 
                    src="https://raw.githubusercontent.com/alephium/alephium-brand-guide/master/logos/svgs/Alephium-Logo-W.svg" 
                    alt="Alephium" 
                    className={`${isDesktop ? 'w-7 h-7' : 'w-6 h-6'}`}
                  />
                </div>
              </div>
            </div>
            
            {/* Center - rotating messages */}
            <div className="flex-1 text-center px-4">
              <div className="space-y-1">
                <h3 className={`${isDesktop ? 'text-2xl' : 'text-xl'} font-bold bg-gradient-to-r from-violet-500 via-orange-500 to-emerald-500 bg-clip-text text-transparent animate-pulse`}>
                  🚀 The Future is Decentralized!
                </h3>
                <p className={`${isDesktop ? 'text-base' : 'text-sm'} text-muted-foreground`}>
                  <span className="inline-block animate-bounce">⚡</span>
                  <span className="mx-1">Nostr. Bitcoin. Altcoins.</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>⚡</span>
                </p>
              </div>
            </div>
            
            {/* Right side - call to action */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-muted-foreground`}>You're part of</p>
                <p className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold bg-gradient-to-r from-violet-500 to-emerald-500 bg-clip-text text-transparent`}>
                  Web5 Revolution
                </p>
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs for switching between feeds */}
      <div className="mb-6 w-full">
        <div className="flex items-center justify-between mb-4">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="flex items-center justify-between">
              <TabsList className="w-full">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsCustomizeOpen(true)}
                  aria-label="Customize feed"
                  className="h-8 w-8 mr-1"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
                <TabsTrigger value="global" className={`${isMobile ? 'flex-1' : 'min-w-[100px]'}`}>Global</TabsTrigger>
                <TabsTrigger value="following" className={`${isMobile ? 'flex-1' : 'min-w-[100px]'}`} disabled={!isLoggedIn}>Following</TabsTrigger>
              </TabsList>
            </div>

            {activeHashtag && (
              <div className="mt-3 flex items-center">
                <div className="text-sm text-muted-foreground">
                  Showing posts with <span className="font-medium">#{activeHashtag}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearHashtag}
                  className="text-xs h-6 ml-2"
                >
                  Clear filter
                </Button>
              </div>
            )}

            {/* Feed content */}
            <TabsContent 
              value="global" 
              className="mt-4 p-0 border-none w-full" 
              style={{ overscrollBehavior: 'contain' }}
            >
              <NewGlobalFeed 
                activeHashtag={activeHashtag} 
                onLoadingChange={handleLoadingChange} 
              />
            </TabsContent>
            
            <TabsContent 
              value="following" 
              className="mt-4 p-0 border-none w-full"
              style={{ overscrollBehavior: 'contain' }}
            >
              {isLoggedIn ? (
                <NewFollowingFeed 
                  activeHashtag={activeHashtag}
                  onLoadingChange={handleLoadingChange}
                />
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Connect your wallet to see posts from people you follow
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Customize Global Feed Dialog */}
      <CustomizeGlobalFeedDialog
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultHashtags={preferences.feedFilters?.globalFeedTags || []}
        onSave={(hashtags) => {
          updateNestedPreference('feedFilters', 'globalFeedTags', hashtags);
        }}
      />
    </div>
  );
};

export default NewHomePage;

