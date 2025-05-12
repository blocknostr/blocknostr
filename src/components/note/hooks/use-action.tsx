
import { useState } from "react";
import { toast } from "sonner";
import { NostrEvent, SocialManager } from "@/lib/nostr";
import { nostrService } from "@/lib/nostr";

export function usePostAction(event: NostrEvent, actionType: "like" | "repost" | "reply" | "delete") {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [count, setCount] = useState(0);

  const performAction = async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      let result = false;
      
      switch (actionType) {
        case "like":
          // Use reactToPost from nostrService instead of deprecated likeEvent
          result = await nostrService.reactToPost(event.id);
          if (result) {
            toast.success("Post liked!");
            setCount((prev) => prev + 1);
          }
          break;
          
        case "repost":
          // Use repostNote which takes eventId and pubkey
          result = await nostrService.repostNote(event.id, event.pubkey);
          if (result) {
            toast.success("Post reposted!");
            setCount((prev) => prev + 1);
          }
          break;
          
        case "reply":
          // Reply functionality should be handled separately
          console.log("Reply action triggered");
          result = true;
          break;
          
        case "delete":
          // Delete functionality
          console.log("Delete action triggered");
          result = true;
          break;
      }
      
      setIsSuccess(result);
    } catch (error) {
      console.error(`Error performing ${actionType} action:`, error);
      setIsError(true);
      toast.error(`Failed to ${actionType} post. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isSuccess,
    isError,
    count,
    performAction,
  };
}
