
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { NostrEvent } from "@/lib/nostr";
import { Link } from "react-router-dom";

interface NotificationItemProps {
  notification: NostrEvent;
  profileData?: any;
}

const NotificationItem = ({ notification, profileData }: NotificationItemProps) => {
  const timeAgo = formatDistanceToNow(notification.created_at * 1000, { addSuffix: true });
  
  const displayName = profileData?.name || profileData?.display_name || notification.pubkey.slice(0, 8);
  
  // Find the event ID that this notification is referencing (if any)
  const eventReference = notification.tags.find(tag => tag[0] === 'e');
  const eventId = eventReference ? eventReference[1] : null;
  
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
            <div className="flex items-baseline justify-between">
              <span className="font-medium hover:underline truncate">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            
            <p className="mt-1 text-sm break-words">
              {notification.content}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default NotificationItem;
