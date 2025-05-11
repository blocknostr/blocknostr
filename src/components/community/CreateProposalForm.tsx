
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { Loader2, Plus, X } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProposalCategory } from "@/types/community";

// Form schema with validation
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(["governance", "feature", "poll", "other"] as const),
  duration: z.enum(["3", "7", "14", "30"] as const),
});

interface CreateProposalFormProps {
  communityId: string;
  onProposalCreated: () => void;
}

const CreateProposalForm = ({ communityId, onProposalCreated }: CreateProposalFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [options, setOptions] = useState<string[]>(["Yes", "No"]);
  const [newOption, setNewOption] = useState("");
  
  // Initialize form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "other",
      duration: "7",
    },
  });
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (options.length < 2) {
      toast.error("You need at least two options");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate the end date based on duration
      const durationDays = parseInt(data.duration);
      const endsAt = Math.floor(Date.now() / 1000) + (durationDays * 24 * 60 * 60);
      
      // Create the proposal
      const proposalId = await nostrService.createProposal(
        communityId,
        data.title,
        data.description,
        options,
        data.category as ProposalCategory,
        undefined, // Let the server set default min quorum
        endsAt
      );
      
      if (proposalId) {
        toast.success("Proposal created successfully!");
        onProposalCreated();
      } else {
        toast.error("Failed to create proposal");
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddOption = () => {
    if (!newOption.trim()) return;
    if (options.includes(newOption.trim())) {
      toast.error("This option already exists");
      return;
    }
    if (options.length >= 10) {
      toast.error("Maximum 10 options allowed");
      return;
    }
    
    setOptions([...options, newOption.trim()]);
    setNewOption("");
  };
  
  const handleRemoveOption = (option: string) => {
    if (options.length <= 2) {
      toast.error("You need at least two options");
      return;
    }
    
    setOptions(options.filter(o => o !== option));
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter proposal title" {...field} />
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
                  placeholder="Explain your proposal in detail" 
                  rows={4} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="governance">Governance</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="poll">Poll</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-2">
          <FormLabel>Options</FormLabel>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <div 
                key={option}
                className="bg-muted px-3 py-1 rounded-md flex items-center gap-1"
              >
                <span className="text-sm">{option}</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveOption(option)}
                  className="h-5 w-5 p-0 rounded-full"
                  disabled={options.length <= 2}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input 
              placeholder="Add an option" 
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
            />
            <Button 
              type="button" 
              onClick={handleAddOption}
              size="icon"
              variant="outline"
              disabled={!newOption.trim() || options.length >= 10}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <FormDescription>
            You need at least two options. Maximum 10 options allowed.
          </FormDescription>
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Proposal"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default CreateProposalForm;
