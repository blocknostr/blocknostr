
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface DAOGuidelinesProps {
  guidelines: string;
  canEdit: boolean;
  onUpdate: (guidelines: string) => Promise<boolean>;
}

const DAOGuidelines = ({ guidelines, canEdit, onUpdate }: DAOGuidelinesProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedGuidelines, setEditedGuidelines] = useState(guidelines);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onUpdate(editedGuidelines);
      if (success) {
        toast.success("Guidelines updated successfully");
        setIsEditing(false);
      } else {
        toast.error("Failed to update guidelines");
      }
    } catch (error) {
      toast.error("Error updating guidelines", {
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">DAO Guidelines</h2>
        {canEdit && !isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Guidelines
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div>
          <Textarea
            value={editedGuidelines}
            onChange={(e) => setEditedGuidelines(e.target.value)}
            placeholder="Enter DAO guidelines and rules here..."
            className="min-h-[200px] mb-4"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditedGuidelines(guidelines);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Guidelines"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="prose dark:prose-invert max-w-none">
          {guidelines ? (
            <ReactMarkdown>{guidelines}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic">
              No guidelines have been set for this DAO yet.
              {canEdit && " Click 'Edit Guidelines' to add some."}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default DAOGuidelines;
