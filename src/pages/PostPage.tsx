
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import NoteCardHeader from '@/components/note/NoteCardHeader';
import NoteCardContent from '@/components/note/NoteCardContent';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import { SocialManager } from '@/lib/nostr/social-manager';
import { toast } from 'sonner';

// This needs to be properly exported as default
const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentNote, setCurrentNote] = useState<any>(null);
  const [profileData, setProfileData] = useState<Record<string, any> | null>(null);
  const [reactionCounts, setReactionCounts] = useState({
    likes: 0,
    reposts: 0,
    replies: 0,
    zaps: 0,
    zapAmount: 0
  });

  const socialManager = new SocialManager();
  
  // Define default relays if nostrService.relays is not available
  const defaultRelays = ["wss://relay.damus.io", "wss://nos.lol"];

  // Fetch the note data on component mount
  useEffect(() => {
    if (!id) return;

    const fetchNote = async () => {
      try {
        setIsLoading(true);
        
        // Connect to relays
        await nostrService.connectToUserRelays();
        
        // Subscribe to the specific note using the ID
        const filters = [{ ids: [id] }];
        
        if (nostrService.subscribe) {
          const { sub } = nostrService.subscribe(filters, (event) => {
            handleEvent(event);
          });
          
          // Cleanup subscription
          return () => {
            if (sub && nostrService.unsubscribe) {
              nostrService.unsubscribe(sub);
            }
          };
        }
      } catch (error) {
        console.error('Error fetching note:', error);
        toast.error('Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [id]);
  
  // Handle received events
  const handleEvent = (event: any) => {
    setCurrentNote(event);
    
    // If we have the event, fetch the author's profile
    if (event && event.pubkey) {
      fetchAuthorProfile(event.pubkey);
    }

    // Also fetch reaction counts
    if (event && event.id) {
      fetchReactionCounts(event.id);
    }
  };

  // Fetch the author's profile data
  const fetchAuthorProfile = async (pubkey: string) => {
    try {
      const profile = await nostrService.getUserProfile(pubkey);
      if (profile) {
        setProfileData(profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Fetch reaction counts for the post
  const fetchReactionCounts = async (eventId: string) => {
    try {
      if (!eventId) return;
      
      // Get reaction counts from the social manager
      const counts = await socialManager.getReactionCounts(eventId);
      setReactionCounts(counts);
    } catch (error) {
      console.error("Error fetching reaction counts:", error);
    }
  };
  
  // Fix the stats section to use the right properties
  const renderStats = () => {
    return (
      <div className="flex gap-4 text-sm text-muted-foreground pb-4 border-b px-4 md:px-6">
        <div title="Replies">
          <span className="font-medium">{reactionCounts.replies || 0}</span> {reactionCounts.replies === 1 ? 'Reply' : 'Replies'}
        </div>
        <div title="Reposts">
          <span className="font-medium">{reactionCounts.reposts || 0}</span> {reactionCounts.reposts === 1 ? 'Repost' : 'Reposts'}
        </div>
        <div title="Likes">
          <span className="font-medium">{reactionCounts.likes || 0}</span> {reactionCounts.likes === 1 ? 'Like' : 'Likes'}
        </div>
        <div title="Zaps">
          <span className="font-medium">{reactionCounts.zaps || 0}</span> {reactionCounts.zaps === 1 ? 'Zap' : 'Zaps'}
        </div>
        {reactionCounts.zapAmount > 0 && (
          <div title="Zap Amount">
            <span className="font-medium">{reactionCounts.zapAmount}</span> sats
          </div>
        )}
      </div>
    );
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentNote) {
    return (
      <div className="container py-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6 text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Post not found</h2>
            <p className="text-muted-foreground">The note you're looking for doesn't exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
      
      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="p-4 md:p-6">
            {/* Note header with author info */}
            <NoteCardHeader 
              pubkey={currentNote?.pubkey} 
              createdAt={currentNote?.created_at} 
              profileData={profileData || undefined}
            />
            
            {/* Note content */}
            <NoteCardContent 
              content={currentNote?.content} 
              tags={currentNote?.tags}
            />
          </div>

          {/* Render stats */}
          {renderStats()}
        </CardContent>
      </Card>

      {/* TODO: Add replies section here */}
    </div>
  );
};

// Add default export
export default PostPage;
