
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface DAOGuidelinesProps {
  guidelines?: string;
  canEdit: boolean;
  onUpdate: (daoId: string, guidelines: string) => Promise<boolean>;
}

const DAOGuidelines: React.FC<DAOGuidelinesProps> = ({
  guidelines,
  canEdit,
  onUpdate
}) => {
  const [editing, setEditing] = useState(false);
  const [editedGuidelines, setEditedGuidelines] = useState(guidelines || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleEditToggle = () => {
    setEditing(!editing);
    setEditedGuidelines(guidelines || "");
  };
  
  const handleSubmit = async () => {
    if (!canEdit) return;
    
    setIsSubmitting(true);
    try {
      // Note: daoId parameter would be passed from the DAO Context or parent component
      // This is a temporary solution until we refactor for better context usage
      await onUpdate("", editedGuidelines);
      setEditing(false);
      toast.success("Guidelines updated successfully");
    } catch (error) {
      console.error("Error updating guidelines:", error);
      toast.error("Failed to update guidelines");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">DAO Guidelines</h2>
          {canEdit && !editing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEditToggle}
            >
              Edit Guidelines
            </Button>
          )}
        </div>
        
        {editing ? (
          <div className="space-y-4">
            <Textarea 
              value={editedGuidelines}
              onChange={(e) => setEditedGuidelines(e.target.value)}
              placeholder="Enter DAO guidelines here..."
              className="min-h-[200px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleEditToggle}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Guidelines"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            {guidelines ? (
              guidelines.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line}</p>
              ))
            ) : (
              <p className="text-muted-foreground italic">
                No guidelines have been set for this DAO.
                {canEdit && " Click 'Edit Guidelines' to add some."}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DAOGuidelines;
