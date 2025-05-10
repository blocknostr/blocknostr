
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface CreateCommunityDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Community name must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
});

const CreateCommunityDialog = ({ isOpen, setIsOpen }: CreateCommunityDialogProps) => {
  const navigate = useNavigate();
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  
  const currentUserPubkey = nostrService.publicKey;

  // Setup form with validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  const handleCreateCommunity = async (values: z.infer<typeof formSchema>) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to create a community");
      return;
    }
    
    setIsCreatingCommunity(true);
    
    try {
      const communityId = await nostrService.createCommunity(
        values.name.trim(),
        values.description.trim()
      );
      
      if (communityId) {
        toast.success("Community created successfully!");
        form.reset();
        setIsOpen(false);
        
        // Navigate to the new community
        setTimeout(() => {
          navigate(`/communities/${communityId}`);
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community");
    } finally {
      setIsCreatingCommunity(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Community
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new community</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateCommunity)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Community Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter community name" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your community..."
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
              disabled={isCreatingCommunity}
              className="w-full"
            >
              {isCreatingCommunity ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Community
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCommunityDialog;
