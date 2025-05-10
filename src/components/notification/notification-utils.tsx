
import { MessageCircle, Reply, Heart, Repeat } from "lucide-react";
import { NotificationType } from "@/types/notification";
import React from "react";

export const getNotificationIcon = (type: NotificationType): React.ReactNode => {
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

export const getNotificationText = (type: NotificationType, content: string): string => {
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
      return content;
  }
};

export const getEventReference = (notification: { tags: string[][] }): string | null => {
  const eventReference = notification.tags.find(tag => tag[0] === 'e');
  return eventReference ? eventReference[1] : null;
};

export const getContentPreview = (content: string, maxLength: number = 100): string => {
  if (!content) return '';
  return content.length > maxLength 
    ? `${content.slice(0, maxLength)}...` 
    : content;
};
