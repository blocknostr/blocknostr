
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NostrEvent, nostrService } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";
import NoteCardComments from "@/components/note/NoteCardComments";

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<NostrEvent | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      setLoading(true);
      
      try {
        // Connect to relays
        await nostrService.connectToRelays();
        
        // Subscribe to the specific event
        const subId = nostrService.subscribe(
          [{ ids: [id], limit: 1 }],
          (fetchedEvent) => {
            setEvent(fetchedEvent);
            
            // Fetch profile data for the author
            const metadataSubId = nostrService.subscribe(
              [
                {
                  kinds: [0],
                  authors: [fetchedEvent.pubkey],
                  limit: 1
                }
              ],
              (profileEvent) => {
                try {
                  const metadata = JSON.parse(profileEvent.content);
                  setProfileData(metadata);
                } catch (e) {
                  console.error('Failed to parse profile metadata:', e);
                }
                
                nostrService.unsubscribe(metadataSubId);
              }
            );
            
            nostrService.unsubscribe(subId);
            setLoading(false);
          }
        );
        
        // If no event is found after some time, stop loading
        setTimeout(() => {
          if (loading) {
            setLoading(false);
          }
        }, 5000);
      } catch (error) {
        console.error("Error fetching event:", error);
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  // Handle replies being added to a post
  const handleReplyAdded = () => {
    // Could refetch the post or update local state
    console.log("Reply added to post");
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">Post</h1>
          </div>
        </header>
        
        <div className="max-w-2xl mx-auto px-4 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-pulse">
                <div className="bg-muted rounded-md h-24 w-96 mb-4"></div>
                <div className="bg-muted rounded-md h-4 w-48 mb-2"></div>
                <div className="bg-muted rounded-md h-4 w-64"></div>
              </div>
            </div>
          ) : !event ? (
            <div className="py-20 text-center">
              <h2 className="text-xl font-semibold mb-2">Post not found</h2>
              <p className="text-muted-foreground mb-6">
                The post you're looking for doesn't exist or may have been deleted.
              </p>
              <Button onClick={handleBack}>Go Back</Button>
            </div>
          ) : (
            <>
              <NoteCard 
                event={event} 
                profileData={profileData}
                onDelete={handleBack}
              />
              
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-4">Responses</h2>
                <NoteCardComments 
                  eventId={event.id} 
                  pubkey={event.pubkey}
                  onReplyAdded={handleReplyAdded}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostPage;
