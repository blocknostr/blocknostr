
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DAOCreateProposalDialogProps {
  daoId: string;
  onCreateProposal: (daoId: string, title: string, description: string, options: string[], durationDays: number) => Promise<string | null>;
  onSuccess: (proposalId?: string) => void;
}

const DAOCreateProposalDialog: React.FC<DAOCreateProposalDialogProps> = ({
  daoId,
  onCreateProposal,
  onSuccess
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["Yes", "No"]);
  const [newOption, setNewOption] = useState("");
  const [duration, setDuration] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };
  
  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a proposal title");
      return;
    }
    
    if (options.length < 2) {
      toast.error("Please add at least two options");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const proposalId = await onCreateProposal(
        daoId,
        title,
        description,
        options,
        parseInt(duration)
      );
      
      if (proposalId) {
        toast.success("Proposal created successfully");
        onSuccess(proposalId);
        
        // Reset form
        setTitle("");
        setDescription("");
        setOptions(["Yes", "No"]);
        setDuration("7");
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Proposal Title</Label>
        <Input
          id="title"
          placeholder="Enter a title for your proposal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your proposal in detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Voting Options</Label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[index] = e.target.value;
                  setOptions(newOptions);
                }}
                disabled={isSubmitting}
                placeholder={`Option ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOption(index)}
                disabled={options.length <= 2 || isSubmitting}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Input
            placeholder="Add another option"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            disabled={isSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddOption();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddOption}
            disabled={!newOption.trim() || isSubmitting}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="duration">Duration</Label>
        <Select
          value={duration}
          onValueChange={setDuration}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 day</SelectItem>
            <SelectItem value="3">3 days</SelectItem>
            <SelectItem value="7">1 week</SelectItem>
            <SelectItem value="14">2 weeks</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Proposal"
          )}
        </Button>
      </div>
    </form>
  );
};

export default DAOCreateProposalDialog;
