import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquarePlus, Send } from "lucide-react";

interface CommunityPostFormProps {
  onSubmit: (content: string, title?: string) => Promise<boolean>;
  isSubmitting?: boolean;
}

const CommunityPostForm: React.FC<CommunityPostFormProps> = ({ 
  onSubmit, 
  isSubmitting = false 
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    const success = await onSubmit(content.trim(), title.trim() || undefined);
    
    if (success) {
      setTitle("");
      setContent("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5" />
          Submit New Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Post title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          
          <div>
            <Textarea
              placeholder="What would you like to share with the community?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
              required
            />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {content.length}/2000
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={!content.trim() || isSubmitting}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Submitting..." : "Submit for Moderation"}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            📝 Your post will be reviewed by community moderators before being published.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityPostForm; 

