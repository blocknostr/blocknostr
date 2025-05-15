
import { useState } from "react";
import { toast } from "sonner";
import { NostrEvent } from "@/lib/nostr";
import { nostrService } from "@/lib/nostr";
import { SimplePool } from "nostr-tools";

interface UseActionProps {
  eventId: string;
  authorPubkey: string;
  event: any;
}

export function useAction({ eventId, authorPubkey, event }: UseActionProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  // Create a pool for use with the socialManager
  const pool = new SimplePool();
  
  const handleLike = async () => {
    setIsLiking(true);
    try {
      // Use socialManager with all required arguments
      // We're using a static pubkey and an empty private key for now
      const myPubkey = nostrService.publicKey || "default-pubkey";
      const result = await nostrService.socialManager.reactToEvent(
        pool,
        eventId, 
        "+", 
        myPubkey,
        "", // privateKey - simplified for now
        [] // relays - simplified for now
      );
      
      if (result) {
        toast.success("Post liked!");
      }
      return result !== null; // Convert string/null to boolean
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
      return false;
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    setIsReposting(true);
    try {
      // Use socialManager with all required arguments
      const myPubkey = nostrService.publicKey || "default-pubkey";
      const result = await nostrService.socialManager.repostEvent(
        pool,
        {
          id: eventId,
          pubkey: authorPubkey,
          ...event
        },
        myPubkey,
        "", // privateKey - simplified for now  
        [], // relays - simplified for now
        {} // options - empty object for now
      );
      
      if (result) {
        toast.success("Post reposted!");
      }
      return result !== null; // Convert string/null to boolean
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Failed to repost");
      return false;
    } finally {
      setIsReposting(false);
    }
  };

  return {
    handleLike,
    isLiking,
    handleRepost,
    isReposting
  };
}

export function usePostAction(event: NostrEvent, actionType: "like" | "repost" | "reply" | "delete") {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [count, setCount] = useState(0);
  // Create a pool for use with the socialManager
  const pool = new SimplePool();

  const performAction = async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      let result = false;
      // Get current user's pubkey
      const myPubkey = nostrService.publicKey || "default-pubkey";
      
      switch (actionType) {
        case "like":
          // Use socialManager with all required arguments
          const likeResult = await nostrService.socialManager.reactToEvent(
            pool,
            event.id,
            "+",
            myPubkey,
            "", // privateKey - simplified for now
            [] // relays - simplified for now
          );
          
          result = likeResult !== null;
          if (result) {
            toast.success("Post liked!");
            setCount((prev) => prev + 1);
          }
          break;
          
        case "repost":
          // Use socialManager with all required arguments
          const repostResult = await nostrService.socialManager.repostEvent(
            pool,
            event,
            myPubkey,
            "", // privateKey - simplified for now
            [], // relays - simplified for now
            {} // options - empty object for now
          );
          
          result = repostResult !== null;
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
