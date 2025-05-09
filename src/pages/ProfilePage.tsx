import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NostrEvent, nostrService, Relay } from "@/lib/nostr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NoteCard from "@/components/NoteCard";
import Sidebar from "@/components/Sidebar";
import FollowButton from "@/components/FollowButton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, MessageSquare, Plus } from "lucide-react";

interface ProfileData {
  name?: string;
  display_name?: string;
  picture?: string;
  banner?: string;
  about?: string;
  website?: string;
  nip05?: string;
}

const ProfilePage = () => {
  const { npub } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [relays, setRelays] = useState<Relay[]>([]);
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isAddingRelay, setIsAddingRelay] = useState(false);
  
  const currentUserPubkey = nostrService.publicKey;
  const isCurrentUser = currentUserPubkey && 
                       (npub ? nostrService.getHexFromNpub(npub) === currentUserPubkey : false);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!npub) return;
      
      try {
        // Connect to relays if not already connected
        await nostrService.connectToUserRelays();
        
        // Convert npub to hex if needed
        let hexPubkey = npub;
        if (npub.startsWith('npub1')) {
          hexPubkey = nostrService.getHexFromNpub(npub);
        }
        
        // Subscribe to profile metadata (kind 0)
        const metadataSubId = nostrService.subscribe(
          [
            {
              kinds: [0],
              authors: [hexPubkey],
              limit: 1
            }
          ],
          (event) => {
            try {
              const metadata = JSON.parse(event.content);
              setProfileData(metadata);
            } catch (e) {
              console.error('Failed to parse profile metadata:', e);
            }
          }
        );
        
        // Subscribe to user's notes (kind 1)
        const notesSubId = nostrService.subscribe(
          [
            {
              kinds: [1],
              authors: [hexPubkey],
              limit: 20
            }
          ],
          (event) => {
            setEvents(prev => {
              // Check if we already have this event
              if (prev.some(e => e.id === event.id)) {
                return prev;
              }
              
              // Add new event and sort by creation time (newest first)
              return [...prev, event].sort((a, b) => b.created_at - a.created_at);
            });
          }
        );
        
        setLoading(false);
        
        return () => {
          nostrService.unsubscribe(metadataSubId);
          nostrService.unsubscribe(notesSubId);
        };
      } catch (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
      }
    };
    
    fetchProfileData();
    
    // Load relay status if this is the current user
    if (isCurrentUser) {
      const relayStatus = nostrService.getRelayStatus();
      setRelays(relayStatus);
    }
  }, [npub, isCurrentUser]);
  
  // Show current user's profile if no npub is provided
  useEffect(() => {
    if (!npub && currentUserPubkey) {
      window.location.href = `/profile/${nostrService.formatPubkey(currentUserPubkey)}`;
    }
  }, [npub, currentUserPubkey]);
  
  const handleAddRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    setIsAddingRelay(true);
    
    try {
      const success = await nostrService.addRelay(newRelayUrl);
      if (success) {
        toast.success(`Added relay: ${newRelayUrl}`);
        setNewRelayUrl("");
        // Update relay status
        const relayStatus = nostrService.getRelayStatus();
        setRelays(relayStatus);
      }
    } catch (error) {
      console.error("Error adding relay:", error);
    } finally {
      setIsAddingRelay(false);
    }
  };
  
  const handleRemoveRelay = (relayUrl: string) => {
    nostrService.removeRelay(relayUrl);
    // Update relay status
    const relayStatus = nostrService.getRelayStatus();
    setRelays(relayStatus);
    toast.success(`Removed relay: ${relayUrl}`);
  };
  
  const handleMessageUser = () => {
    if (!npub) return;
    
    // Navigate to messages page
    navigate('/messages');
    
    // We'll let the messages page handle loading the contact
    localStorage.setItem('lastMessagedUser', npub);
  };
  
  const formattedNpub = npub || '';
  const shortNpub = `${formattedNpub.substring(0, 8)}...${formattedNpub.substring(formattedNpub.length - 8)}`;
  
  const displayName = profileData?.display_name || profileData?.name || shortNpub;
  const username = profileData?.name || shortNpub;
  const avatarFallback = displayName.charAt(0).toUpperCase();
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            <h1 className="font-semibold">Profile</h1>
          </div>
        </header>
        
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="mb-6">
            {/* Banner */}
            <div 
              className="h-48 bg-muted w-full rounded-t-lg"
              style={profileData?.banner ? { 
                backgroundImage: `url(${profileData.banner})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
            ></div>
            
            {/* Profile info */}
            <Card>
              <CardContent className="pt-6 relative">
                <Avatar className="h-24 w-24 absolute -top-12 left-4 border-4 border-background">
                  <AvatarImage src={profileData?.picture} />
                  <AvatarFallback className="text-2xl">{avatarFallback}</AvatarFallback>
                </Avatar>
                
                <div className="mt-12">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{displayName}</h2>
                      <p className="text-muted-foreground">@{username}</p>
                    </div>
                    
                    <div className="space-x-2">
                      {!isCurrentUser && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleMessageUser}
                          className="flex items-center"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      )}
                      
                      {isCurrentUser ? (
                        <Button variant="outline">Edit profile</Button>
                      ) : (
                        <FollowButton pubkey={nostrService.getHexFromNpub(npub || '')} />
                      )}
                    </div>
                  </div>
                  
                  {profileData?.about && (
                    <p className="my-4">{profileData.about}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                    {profileData?.website && (
                      <a 
                        href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {profileData.website.replace(/(^\w+:|^)\/\//, '')}
                      </a>
                    )}
                    
                    {profileData?.nip05 && (
                      <span>✓ {profileData.nip05}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Relays section (only for current user) */}
          {isCurrentUser && (
            <div className="mb-6">
              <Card>
                <CardContent className="pt-4">
                  <h3 className="text-lg font-semibold mb-4 flex justify-between items-center">
                    <span>My Relays</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" /> Add Relay
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add a new relay</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-2 mt-4">
                          <Input
                            placeholder="wss://relay.example.com"
                            value={newRelayUrl}
                            onChange={(e) => setNewRelayUrl(e.target.value)}
                          />
                          <Button 
                            onClick={handleAddRelay}
                            disabled={isAddingRelay || !newRelayUrl.trim()}
                          >
                            {isAddingRelay ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Add'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </h3>
                  
                  <div className="space-y-2">
                    {relays.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No relays connected</p>
                    ) : (
                      relays.map((relay) => (
                        <div key={relay.url} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${
                              relay.status === 'connected' ? 'bg-green-500' : 
                              relay.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></span>
                            <span className="text-sm">{relay.url}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveRelay(relay.url)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Notes */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Posts</h3>
            
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading posts...
              </div>
            ) : events.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No posts found.
              </div>
            ) : (
              <div className="space-y-4">
                {events.map(event => (
                  <NoteCard 
                    key={event.id} 
                    event={event} 
                    profileData={profileData || undefined} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
