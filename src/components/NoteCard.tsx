
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Repeat, Share, DollarSign, Bookmark } from 'lucide-react';
import { useState } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface NoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
}

const NoteCard = ({ event, profileData }: NoteCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [retweeted, setRetweeted] = useState(false);
  const [retweetCount, setRetweetCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyCount, setReplyCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  
  const hexPubkey = event.pubkey || '';
  const npub = nostrService.getNpubFromHex(hexPubkey);
  
  // Handle short display of npub (first 5 and last 5 chars)
  const shortNpub = `${npub.substring(0, 9)}...${npub.substring(npub.length - 5)}`;
  
  // Get profile info if available
  const name = profileData?.name || shortNpub;
  const displayName = profileData?.display_name || name;
  const picture = profileData?.picture || '';
  
  const handleLike = async () => {
    if (!liked) {
      // Create a reaction event (kind 7)
      await nostrService.publishEvent({
        kind: 7,
        content: '+',  // '+' for like
        tags: [['e', event.id || ''], ['p', event.pubkey || '']]
      });
      
      setLiked(true);
      setLikeCount(prev => prev + 1);
      toast.success("Post liked");
    } else {
      setLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleRetweet = async () => {
    if (!retweeted) {
      try {
        // Create a repost event
        await nostrService.publishEvent({
          kind: 6, // Repost kind
          content: JSON.stringify({
            event: event
          }),
          tags: [
            ['e', event.id || ''], // Reference to original note
            ['p', event.pubkey || ''] // Original author
          ]
        });
        
        setRetweeted(true);
        setRetweetCount(prev => prev + 1);
        toast.success("Post reposted");
      } catch (error) {
        console.error("Error reposting:", error);
        toast.error("Failed to repost");
      }
    } else {
      setRetweeted(false);
      setRetweetCount(prev => Math.max(0, prev - 1));
    }
  };
  
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      // Create a reply event
      await nostrService.publishEvent({
        kind: 1, // Note kind
        content: newComment,
        tags: [
          ['e', event.id || '', '', 'reply'], // Reference to parent with reply marker
          ['p', event.pubkey || ''] // Original author
        ]
      });
      
      // Add to local state
      setComments(prev => [
        ...prev, 
        { 
          content: newComment, 
          author: nostrService.publicKey,
          created_at: Math.floor(Date.now() / 1000)
        }
      ]);
      setNewComment("");
      setReplyCount(prev => prev + 1);
      toast.success("Reply posted");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post reply");
    }
  };
  
  const handleSendTip = () => {
    toast.info("Tipping functionality coming soon!");
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    toast.success(bookmarked ? "Removed from bookmarks" : "Added to bookmarks");
  };
  
  const timeAgo = formatDistanceToNow(
    new Date(event.created_at * 1000),
    { addSuffix: true }
  );
  
  // Get the first character of the display name for the avatar fallback
  const avatarFallback = displayName ? displayName.charAt(0).toUpperCase() : 'N';

  return (
    <div className="border-b hover:bg-accent/5 transition-colors px-4 py-3">
      <div className="flex">
        <Link to={`/profile/${npub}`} className="shrink-0 mr-3">
          <Avatar className="h-10 w-10 cursor-pointer hover:opacity-90 transition-opacity">
            <AvatarImage src={picture} alt={name} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/profile/${npub}`} className="font-bold hover:underline truncate">
              {displayName}
            </Link>
            <Link to={`/profile/${npub}`} className="text-muted-foreground text-sm truncate hover:underline">
              @{shortNpub}
            </Link>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm hover:underline cursor-pointer">{timeAgo}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-[15px]">{event.content}</p>
          
          <div className="flex justify-between mt-3 max-w-md">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full p-2 h-8"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="ml-1 text-xs">{replyCount > 0 ? replyCount : ''}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`hover:text-green-500 hover:bg-green-500/10 rounded-full p-2 h-8 ${retweeted ? "text-green-500" : "text-muted-foreground"}`}
              onClick={handleRetweet}
            >
              <Repeat className="h-4 w-4" />
              <span className="ml-1 text-xs">{retweetCount > 0 ? retweetCount : ''}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`hover:text-pink-500 hover:bg-pink-500/10 rounded-full p-2 h-8 ${liked ? "text-pink-500" : "text-muted-foreground"}`}
              onClick={handleLike}
            >
              <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
              <span className="ml-1 text-xs">{likeCount > 0 ? likeCount : ''}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`hover:text-blue-500 hover:bg-blue-500/10 rounded-full p-2 h-8 ${bookmarked ? "text-blue-500" : "text-muted-foreground"}`}
              onClick={handleBookmark}
            >
              <Bookmark className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full p-2 h-8"
              onClick={handleSendTip}
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
      
          {showComments && (
            <div className="pt-3">
              <div className="mb-4 space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No replies yet. Be the first to reply!</p>
                ) : (
                  comments.map((comment, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted/50 p-2 rounded-md text-sm flex-1">
                        <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {nostrService.publicKey && (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Post your reply"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <Button 
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="self-end rounded-full"
                  >
                    Reply
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
