
import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useNostrAuth } from "@/hooks/useNostrAuth";
import { useNostrRelays } from "@/hooks/useNostrRelays";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CreateDAODialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Form validation schema with stricter requirements
const formSchema = z.object({
  name: z.string().min(3, {
    message: "DAO name must be at least 3 characters.",
  }).refine(name => name.trim() !== '', {
    message: "DAO name cannot be empty.",
  }).refine(name => name !== 'Unnamed DAO', {
    message: "DAO name cannot be 'Unnamed DAO'.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).refine(desc => desc.trim() !== '', {
    message: "DAO description cannot be empty.",
  }),
});

const CreateDAODialog = ({ isOpen, setIsOpen }: CreateDAODialogProps) => {
  const navigate = useNavigate();
  const [isCreatingDAO, setIsCreatingDAO] = useState(false);
  const { isLoggedIn, currentUserPubkey } = useNostrAuth();
  const { isConnected, connectToRelays, isConnecting } = useNostrRelays();
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  
  // Setup form with validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  // Check login status when dialog opens
  useEffect(() => {
    if (isOpen) {
      const checkLoginStatus = async () => {
        setShowLoginAlert(!isLoggedIn);
        
        // If logged in but not connected to relays, try to connect
        if (isLoggedIn && !isConnected && !isConnecting) {
          await connectToRelays();
        }
      };
      
      checkLoginStatus();
    }
  }, [isOpen, isLoggedIn, isConnected, isConnecting, connectToRelays]);
  
  const handleCreateDAO = async (values: z.infer<typeof formSchema>) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to create a DAO", {
        description: "Please login first using the button in the header"
      });
      setShowLoginAlert(true);
      return;
    }
    
    // Check if we're connected to relays
    if (!isConnected) {
      try {
        const connected = await connectToRelays({
          showToast: true,
          retryCount: 3
        });
        
        if (!connected) {
          toast.error("Cannot connect to relays", {
            description: "Please check your network connection and try again"
          });
          return;
        }
      } catch (error) {
        console.error("Failed to connect to relays:", error);
        toast.error("Connection error", {
          description: "Failed to connect to Nostr relays"
        });
        return;
      }
    }
    
    setIsCreatingDAO(true);
    
    try {
      const communityId = await nostrService.createCommunity(
        values.name.trim(),
        values.description.trim()
      );
      
      if (communityId) {
        toast.success("DAO created successfully!", {
          description: "You'll be redirected to your new DAO shortly.",
          action: {
            label: "View now",
            onClick: () => navigate(`/dao/${communityId}`),
          }
        });
        
        form.reset();
        setIsOpen(false);
        
        // Navigate to the new DAO
        setTimeout(() => {
          navigate(`/dao/${communityId}`);
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating DAO:", error);
      toast.error("Failed to create DAO", {
        description: error instanceof Error ? error.message : "Please try again or check your connection."
      });
    } finally {
      setIsCreatingDAO(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new DAO</DialogTitle>
        </DialogHeader>
        
        {showLoginAlert ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to be logged in to create a DAO. Please login using the button in the header.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateDAO)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DAO Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter DAO name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your DAO..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit"
                  disabled={isCreatingDAO || !isLoggedIn || (!isConnected && !isConnecting)}
                  className="w-full"
                >
                  {isCreatingDAO ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create DAO
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateDAODialog;
