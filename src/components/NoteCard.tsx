
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Repeat, Share, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
        toast.success("Note reposted successfully");
      } catch (error) {
        console.error("Error reposting:", error);
        toast.error("Failed to repost note");
      }
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
      toast.success("Comment posted");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    }
  };
  
  const handleSendTip = () => {
    toast.info("Tipping functionality coming soon!");
  };
  
  const timeAgo = formatDistanceToNow(
    new Date(event.created_at * 1000),
    { addSuffix: true }
  );
  
  // Get the first character of the display name for the avatar fallback
  const avatarFallback = displayName ? displayName.charAt(0).toUpperCase() : 'N';

  return (
    <Card className="mb-4 hover:bg-accent/20 transition-colors">
      <CardContent className="pt-4">
        <div className="flex">
          <Avatar className="h-10 w-10 mr-3 shrink-0">
            <AvatarImage src={picture} alt={name} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold truncate">{displayName}</span>
              <span className="text-muted-foreground text-sm truncate">@{shortNpub}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">{timeAgo}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words">{event.content}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0 flex-wrap">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          {replyCount > 0 ? replyCount : ''}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={retweeted ? "text-green-500" : "text-muted-foreground"}
          onClick={handleRetweet}
        >
          <Repeat className="h-4 w-4 mr-1" />
          {retweetCount > 0 ? retweetCount : ''}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={liked ? "text-red-500" : "text-muted-foreground"}
          onClick={handleLike}
        >
          <Heart className="h-4 w-4 mr-1" fill={liked ? "currentColor" : "none"} />
          {likeCount > 0 ? likeCount : ''}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={handleSendTip}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          Tip
        </Button>
      </CardFooter>
      
      {showComments && (
        <div className="px-4 pb-4 pt-2 border-t">
          <div className="mb-4 space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-2 rounded-md text-sm flex-1">
                    <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {nostrService.publicKey && (
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="self-end"
              >
                Post
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default NoteCard;
