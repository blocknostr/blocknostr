
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
  
  const currentUserPubkey = nostrService.publicKey;

  // Setup form with validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  const handleCreateDAO = async (values: z.infer<typeof formSchema>) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to create a DAO", {
        description: "Please login to create a new DAO."
      });
      return;
    }
    
    setIsCreatingDAO(true);
    
    try {
      // First ensure we're connected to relays
      await nostrService.connectToUserRelays();
      
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
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create DAO
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new DAO</DialogTitle>
        </DialogHeader>
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
            <Button 
              type="submit"
              disabled={isCreatingDAO}
              className="w-full"
            >
              {isCreatingDAO ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create DAO
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDAODialog;
