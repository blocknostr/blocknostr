
import React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotesEmptyStateProps {
  onCreateNote: () => void;
}

const NotesEmptyState = ({ onCreateNote }: NotesEmptyStateProps) => {
  return (
    <div className="text-center py-12 border rounded-lg bg-muted/20">
      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-2 opacity-50" />
      <p className="text-muted-foreground mb-1">No saved notes yet.</p>
      <p className="text-sm text-muted-foreground mb-4">Create your first note using the editor above.</p>
      <Button variant="outline" onClick={onCreateNote}>
        Start Writing
      </Button>
    </div>
  );
};

export default NotesEmptyState;
