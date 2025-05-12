
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RelayList } from "./RelayList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { nostrService } from "@/lib/nostr";
import { Relay } from "@/lib/nostr";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Schema for validating relay URLs
const formSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Relay URL is required")
    .refine(
      (val) => val.startsWith("wss://") || val.startsWith("ws://"),
      { message: "URL must start with ws:// or wss://" }
    ),
  readWrite: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface RelayDialogContentProps {
  isCurrentUser: boolean;
  relays: Relay[];
  onRemoveRelay: (url: string) => void;
  onRelayAdded: () => void;
  onPublishRelayList: (relays: Relay[]) => Promise<boolean>;
  userNpub?: string;
}

export function RelayDialogContent({
  isCurrentUser,
  relays,
  onRemoveRelay,
  onRelayAdded,
  onPublishRelayList,
  userNpub
}: RelayDialogContentProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Set up form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      readWrite: true,
    },
  });
  
  // Handle adding a new relay
  const handleAddRelay = async (values: FormValues) => {
    setIsConnecting(true);
    
    try {
      // Start measuring connection time
      const startTime = performance.now();
      
      // Try to connect to the relay using direct nostrService
      const connected = await nostrService.addRelay(values.url, values.readWrite);
      
      // Calculate connection time
      const connectionTime = performance.now() - startTime;
      
      if (connected) {
        // Notify user
        toast.success(`Connected to relay: ${values.url}`);
        
        // Reset form
        form.reset({ url: "", readWrite: true });
        
        // Update relay list
        onRelayAdded();
      } else {
        toast.error(`Failed to connect to relay: ${values.url}`);
      }
    } catch (error) {
      console.error("Error adding relay:", error);
      toast.error(`Failed to connect to relay: ${values.url}`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Handle publishing relay preferences
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const success = await onPublishRelayList(relays);
      if (!success) {
        toast.error("Failed to publish relay preferences");
      }
    } catch (error) {
      console.error("Error publishing relay preferences:", error);
      toast.error("Failed to publish relay preferences");
    } finally {
      setIsPublishing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {isCurrentUser && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddRelay)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Add a new relay</Label>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                <div className="flex-1 space-y-1">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="url"
                            placeholder="wss://relay.example.com"
                            {...field}
                            className="flex-1"
                            disabled={isConnecting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="readWrite"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isConnecting}
                          />
                        </FormControl>
                        <Label className="text-sm">Read/Write</Label>
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting
                    </>
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">
            {isCurrentUser ? "My Relays" : `${userNpub ? userNpub.substring(0, 8) + "..." : "User"}'s Relays`}
          </h3>
          {isCurrentUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing || relays.length === 0}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing
                </>
              ) : (
                "Publish Preferences"
              )}
            </Button>
          )}
        </div>

        <RelayList 
          relays={relays} 
          isCurrentUser={isCurrentUser} 
          onRemoveRelay={onRemoveRelay}
        />
        
        {isCurrentUser && (
          <div className="text-xs text-muted-foreground mt-2">
            Publishing saves your relay preferences according to NIP-65
          </div>
        )}
      </div>
    </div>
  );
}
