
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
  
  return (
    <Card className="p-4 hover:bg-accent/10 transition-colors">
      <div className="flex items-start space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profileData?.picture} alt={displayName} />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between">
            <Link to={`/profile/${notification.pubkey}`} className="font-medium hover:underline truncate">
              {displayName}
            </Link>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          
          <p className="mt-1 text-sm break-words">
            {notification.content}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default NotificationItem;
