
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { MessageSquare, Heart, Repeat, Share, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAction } from './hooks/use-action';

interface NewNoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
  className?: string;
}

const NewNoteCard: React.FC<NewNoteCardProps> = ({ 
  event, 
  profileData,
  className 
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!event || !event.id || !event.pubkey) return null;
  
  const { handleLike, handleRepost } = useAction({
    eventId: event.id,
    authorPubkey: event.pubkey,
    event
  });
  
  // Format the content to properly display hashtags and links
  const formatContent = (content: string) => {
    // Replace URLs with clickable links
    let formattedContent = content.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
    );
    
    // Replace hashtags with clickable links
    formattedContent = formattedContent.replace(
      /#(\w+)/g, 
      '<a href="javascript:void(0)" class="text-primary hover:underline">#$1</a>'
    );
    
    // Replace mentions with clickable links
    formattedContent = formattedContent.replace(
      /@(\w+)/g, 
      '<a href="javascript:void(0)" class="text-primary hover:underline">@$1</a>'
    );
    
    return formattedContent;
  };
  
  // Extract hashtags from event tags
  const getHashtags = () => {
    if (!event.tags) return [];
    return event.tags
      .filter(tag => tag[0] === 't')
      .map(tag => tag[1]);
  };
  
  // Handle like action
  const onLike = async () => {
    if (!nostrService.publicKey) {
      toast.error('Please sign in to like posts');
      return;
    }
    
    try {
      const result = await handleLike();
      if (result) {
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };
  
  // Handle repost action
  const onRepost = async () => {
    if (!nostrService.publicKey) {
      toast.error('Please sign in to repost');
      return;
    }
    
    try {
      const result = await handleRepost();
      if (result) {
        setIsReposted(true);
      }
    } catch (error) {
      console.error('Error reposting:', error);
      toast.error('Failed to repost');
    }
  };
  
  // Handle share action
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Shared from BlockNoster',
        text: event.content.substring(0, 100) + '...',
        url: `${window.location.origin}/post/${event.id}`
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(`${window.location.origin}/post/${event.id}`)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };
  
  // Format timestamp
  const formattedTime = event.created_at 
    ? formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true }) 
    : '';
  
  // Get display name or shorten pubkey
  const displayName = profileData?.name || profileData?.display_name || 
    (event.pubkey ? `${event.pubkey.slice(0, 8)}...` : 'Unknown');
    
  // Get username from NIP-05 identifier
  const username = profileData?.nip05 
    ? profileData.nip05.includes('@') ? profileData.nip05 : `${profileData.nip05}`
    : null;
  
  // Show entire content if expanded or if content is short enough
  const showFullContent = isExpanded || (event.content && event.content.length <= 300);
  
  // Get truncated content for collapsed view
  const truncatedContent = event.content && event.content.length > 300
    ? event.content.substring(0, 300) + '...'
    : event.content;
  
  // Get hashtags from the event
  const hashtags = getHashtags();
  
  return (
    <Card className={cn("overflow-hidden hover:bg-muted/20 transition-colors duration-200", className)}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Avatar section */}
          <div>
            <Link to={`/profile/${nostrService.getNpubFromHex(event.pubkey)}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={profileData?.picture} alt={displayName} />
                <AvatarFallback>
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
          
          {/* Content section */}
          <div className="flex-1 space-y-2">
            {/* Header with name, username, time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Link to={`/profile/${nostrService.getNpubFromHex(event.pubkey)}`} className="font-medium hover:underline">
                  {displayName}
                </Link>
                
                {username && (
                  <span className="text-muted-foreground text-sm hidden sm:inline">
                    {username}
                  </span>
                )}
                
                <span className="text-muted-foreground text-sm">
                  · {formattedTime}
                </span>
              </div>
              
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Post content */}
            <Link to={`/post/${event.id}`} className="block">
              <div 
                className="whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(showFullContent ? event.content : truncatedContent)
                }}
              />
              
              {!showFullContent && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsExpanded(true);
                  }}
                  className="text-primary text-sm hover:underline mt-1"
                >
                  Show more
                </button>
              )}
            </Link>
            
            {/* Hashtags section */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {hashtags.map((tag, idx) => (
                  <Button 
                    key={idx}
                    variant="ghost" 
                    size="sm" 
                    className="text-primary h-6 px-2 py-0 text-xs"
                    onClick={() => {
                      // Dispatch event to set global hashtag filter
                      window.dispatchEvent(new CustomEvent('set-hashtag', { detail: tag }));
                    }}
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Action buttons */}
      <CardFooter className="px-4 pb-2 pt-0 flex justify-between">
        <div className="flex items-center space-x-6">
          {/* Comment button */}
          <Link to={`/post/${event.id}`} className="flex items-center space-x-1 group">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground group-hover:text-blue-500">
              {/* Comment count would go here */}
            </span>
          </Link>
          
          {/* Repost button */}
          <div className="flex items-center space-x-1 group">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-8 w-8 rounded-full group-hover:bg-green-50 group-hover:text-green-500",
                isReposted && "text-green-500"
              )}
              onClick={onRepost}
            >
              <Repeat className="h-4 w-4" />
            </Button>
            <span className={cn(
              "text-xs text-muted-foreground group-hover:text-green-500",
              isReposted && "text-green-500"
            )}>
              {/* Repost count would go here */}
            </span>
          </div>
          
          {/* Like button */}
          <div className="flex items-center space-x-1 group">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-8 w-8 rounded-full group-hover:bg-pink-50 group-hover:text-pink-500",
                isLiked && "text-pink-500"
              )}
              onClick={onLike}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            </Button>
            <span className={cn(
              "text-xs text-muted-foreground group-hover:text-pink-500",
              isLiked && "text-pink-500"
            )}>
              {/* Like count would go here */}
            </span>
          </div>
        </div>
        
        {/* Share button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-500"
          onClick={handleShare}
        >
          <Share className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewNoteCard;
