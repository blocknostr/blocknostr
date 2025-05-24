
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { NotificationItemProps } from "@/types/notification";
import { 
  getNotificationIcon, 
  getNotificationText, 
  getEventReference, 
  getContentPreview 
} from "./notification-utils";
import { nostrService } from "@/lib/nostr";

const NotificationItem = ({ 
  notification, 
  profileData, 
  type = "mention" 
}: NotificationItemProps) => {
  const timeAgo = formatDistanceToNow(notification.created_at * 1000, { addSuffix: true });
  
  const displayName = profileData?.name || 
                      profileData?.display_name || 
                      notification.pubkey?.slice(0, 8) ||
                      'Unknown';
  
  // Format the pubkey to npub for the profile link
  const npub = notification.pubkey ? nostrService.getNpubFromHex(notification.pubkey) : '';
  
  // Find the event ID that this notification is referencing (if any)
  const eventId = getEventReference(notification);
  
  return (
    <Link 
      to={eventId ? `/post/${eventId}` : `/profile/${npub}`} 
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
                {getNotificationIcon(type)}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            
            <p className="mt-1 text-sm break-words">
              {type === 'mention' ? notification.content : getNotificationText(type, notification.content)}
            </p>

            {type !== 'mention' && notification.content && (
              <div className="mt-2 text-xs text-muted-foreground border-l-2 border-muted pl-2 py-1">
                {getContentPreview(notification.content)}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default NotificationItem;
