import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import { Loader2, Clipboard, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useUnifiedProfileFetcher } from '@/hooks/useUnifiedProfileFetcher';

/**
 * A lightweight, NIP-compliant profile viewer page
 */
const ProfileViewPage = () => {
  const { npub } = useParams<{ npub: string }>();
  const navigate = useNavigate();
  const [hexPubkey, setHexPubkey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('posts');
  
  // Get current user's pubkey to check if this is the user's own profile
  const currentUserPubkey = nostrService.publicKey;
  
  // Use the unified profile fetcher
  const { 
    profiles, 
    fetchProfile, 
    isLoading: profileLoading 
  } = useUnifiedProfileFetcher();
  
  // Convert npub to hex pubkey once
  useEffect(() => {
    if (!npub) {
      navigate('/');
      return;
    }
    
    try {
      const hex = nostrService.getHexFromNpub(npub);
      setHexPubkey(hex);
      // Fetch profile data
      fetchProfile(hex);
    } catch (error) {
      console.error('Invalid npub:', error);
      toast.error('Invalid profile identifier');
      navigate('/');
    }
  }, [npub, navigate, fetchProfile]);
  
  // Fetch user notes when the hexPubkey is available
  useEffect(() => {
    if (!hexPubkey) return;
    
    const fetchNotes = async () => {
      setLoadingNotes(true);
      try {
        // Fix: Use getEventsByUser which is available in the adapter
        // The method in data-adapter.ts expects only 1 parameter (pubkey)
        // The limit is handled within the method implementation
        const events = await nostrService.getEventsByUser(hexPubkey);
        setNotes(events);
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoadingNotes(false);
      }
    };
    
    fetchNotes();
  }, [hexPubkey]);
  
  // Get profile data
  const profile = hexPubkey ? profiles[hexPubkey] : null;
  
  // Handle copy to clipboard
  const copyPubkey = () => {
    if (!hexPubkey) return;
    
    navigator.clipboard.writeText(hexPubkey);
    setCopied(true);
    
    // Reset copy state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const isOwnProfile = currentUserPubkey && hexPubkey && currentUserPubkey === hexPubkey;
  
  if (!npub) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p>No profile identifier provided</p>
      </div>
    );
  }
  
  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Card>
          <CardContent className="p-0">
            {/* Profile banner */}
            <div 
              className="h-32 bg-gradient-to-r from-primary/30 to-secondary/30" 
              style={{
                backgroundImage: profile?.banner ? `url(${profile.banner})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            {/* Profile info */}
            <div className="px-6 py-4">
              <div className="flex flex-col md:flex-row md:items-end -mt-12 md:-mt-16">
                <Avatar className="w-24 h-24 border-4 border-background">
                  {profile?.picture ? (
                    <img 
                      src={profile.picture} 
                      alt={profile?.display_name || profile?.name || 'User'} 
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-muted text-2xl font-bold">
                      {(profile?.display_name || profile?.name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </Avatar>
                
                <div className="mt-3 md:mt-0 md:ml-4 flex-1">
                  <h1 className="text-xl font-bold">
                    {profile?.display_name || profile?.name || 'Anonymous User'}
                  </h1>
                  
                  {profile?.nip05 && (
                    <p className="text-sm font-medium text-muted-foreground">
                      {profile.nip05}
                    </p>
                  )}
                  
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-muted-foreground mr-2">
                      {npub.slice(0, 8)}...{npub.slice(-4)}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={copyPubkey}
                    >
                      {copied ? <Check size={14} /> : <Clipboard size={14} />}
                    </Button>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="mt-3 md:mt-0 space-x-2 flex">
                  {isOwnProfile ? (
                    <Button variant="outline" size="sm">
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button variant="default" size="sm">
                        Follow
                      </Button>
                      <Button variant="outline" size="sm">
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {/* About/bio */}
              {profile?.about && (
                <div className="mt-4">
                  <p className="text-sm">{profile.about}</p>
                </div>
              )}
              
              {/* Website */}
              {profile?.website && (
                <div className="mt-2">
                  <a 
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm flex items-center text-primary hover:underline"
                  >
                    <ExternalLink size={14} className="mr-1" />
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Content tabs */}
      <Tabs 
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="space-y-4">
          {loadingNotes ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notes.length > 0 ? (
            <ScrollArea className="h-[500px] rounded-md">
              {notes.map(note => (
                <Card key={note.id} className="mb-4">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {profile?.name || profile?.display_name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {note.created_at && formatDistanceToNow(new Date(note.created_at * 1000), { addSuffix: true })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="whitespace-pre-wrap break-words">{note.content}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between text-xs text-muted-foreground">
                    <span>Replies: {note.repliesCount || 0}</span>
                    <span>Likes: {note.likesCount || 0}</span>
                  </CardFooter>
                </Card>
              ))}
            </ScrollArea>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No posts found
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="replies">
          <div className="text-center py-10 text-muted-foreground">
            Replies will be implemented in a future update
          </div>
        </TabsContent>
        
        <TabsContent value="media">
          <div className="text-center py-10 text-muted-foreground">
            Media view will be implemented in a future update
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileViewPage;
