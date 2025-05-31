
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Edit, Save, FileQuestion } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/lib/toast";
import ReactMarkdown from 'react-markdown';

interface CommunityGuidelinesProps {
  guidelines?: string;
  canEdit: boolean;
  onUpdate: (guidelines: string) => Promise<void>;
}

const CommunityGuidelines: React.FC<CommunityGuidelinesProps> = ({ 
  guidelines,
  canEdit,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableGuidelines, setEditableGuidelines] = useState(guidelines || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleEdit = () => {
    setEditableGuidelines(guidelines || '');
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditableGuidelines(guidelines || '');
  };
  
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onUpdate(editableGuidelines);
      setIsEditing(false);
      toast.success("Guidelines updated successfully");
    } catch (error) {
      console.error("Error updating guidelines:", error);
      toast.error("Failed to update guidelines");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderDefaultGuidelines = () => (
    <div className="text-center py-10">
      <div className="mb-4 flex justify-center">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No Guidelines Set</h3>
      <p className="text-muted-foreground mb-4">
        This community doesn't have any guidelines yet.
      </p>
      {canEdit && (
        <Button onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Create Guidelines
        </Button>
      )}
    </div>
  );
  
  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Edit Community Guidelines
          </CardTitle>
          <CardDescription>
            Guidelines help members understand the community's purpose, rules, and expectations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="default" className="bg-muted/50">
              <AlertDescription>
                You can use Markdown to format guidelines. Add headings, lists, and links to make your guidelines easier to read.
              </AlertDescription>
            </Alert>
            
            <Textarea
              value={editableGuidelines}
              onChange={(e) => setEditableGuidelines(e.target.value)}
              rows={15}
              placeholder="# Community Guidelines

Welcome to our community! Please follow these rules:

1. Be respectful to others
2. No spam or self-promotion
3. Keep discussions on-topic
4. Follow Nostr's principles"
              className="font-mono text-sm"
            />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Guidelines"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!guidelines) {
    return renderDefaultGuidelines();
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Community Guidelines
          </CardTitle>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{guidelines}</ReactMarkdown>
      </CardContent>
    </Card>
  );
};

export default CommunityGuidelines;

