
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { NostrEvent } from "@/lib/nostr";
import { Link } from "react-router-dom";
import { MessageCircle, Reply, Heart, Repeat } from "lucide-react";

interface NotificationItemProps {
  notification: NostrEvent;
  profileData?: any;
  type?: "mention" | "reply" | "like" | "repost" | "interaction";
}

const NotificationItem = ({ notification, profileData, type = "mention" }: NotificationItemProps) => {
  const timeAgo = formatDistanceToNow(notification.created_at * 1000, { addSuffix: true });
  
  const displayName = profileData?.name || profileData?.display_name || notification.pubkey.slice(0, 8);
  
  // Find the event ID that this notification is referencing (if any)
  const eventReference = notification.tags.find(tag => tag[0] === 'e');
  const eventId = eventReference ? eventReference[1] : null;

  // Determine notification icon based on type
  const getIcon = () => {
    switch (type) {
      case 'reply':
        return <Reply className="h-4 w-4 text-blue-500" />;
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'repost':
        return <Repeat className="h-4 w-4 text-green-500" />;
      case 'interaction':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      default: // mention
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  // Determine notification message based on type
  const getNotificationText = () => {
    switch (type) {
      case 'reply':
        return 'replied to your post';
      case 'like':
        return 'liked your post';
      case 'repost':
        return 'reposted your post';
      case 'interaction':
        return 'new activity on a post you interacted with';
      default: // mention
        return notification.content;
    }
  };
  
  return (
    <Link 
      to={eventId ? `/post/${eventId}` : `/profile/${notification.pubkey}`} 
      className="block no-underline text-foreground"
    >
      <Card className="p-4 hover:bg-accent/10 transition-colors">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profileData?.picture} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium hover:underline truncate">
                  {displayName}
                </span>
                {getIcon()}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            
            <p className="mt-1 text-sm break-words">
              {type === 'mention' ? notification.content : getNotificationText()}
            </p>

            {type !== 'mention' && notification.content && (
              <div className="mt-2 text-xs text-muted-foreground border-l-2 border-muted pl-2 py-1">
                {notification.content.length > 100 
                  ? `${notification.content.slice(0, 100)}...` 
                  : notification.content}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default NotificationItem;
