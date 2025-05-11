
import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Share, Copy, Link, Eye, EyeOff } from "lucide-react";

interface EditorActionsProps {
  canSave: boolean;
  noteId: string | null;
  previewMode: boolean;
  handleSave: () => void;
  copyToClipboard: () => void;
  shareNote: () => void;
  togglePreview: () => void;
  clearEditor: () => void;
}

const EditorActions: React.FC<EditorActionsProps> = ({
  canSave,
  noteId,
  previewMode,
  handleSave,
  copyToClipboard,
  shareNote,
  togglePreview,
  clearEditor,
}) => {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={clearEditor}>
          Clear
        </Button>
        
        <Button variant="outline" onClick={copyToClipboard}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
        
        <Button variant="outline" onClick={togglePreview}>
          {previewMode ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </>
          )}
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline"
          onClick={shareNote}
          disabled={!noteId}
        >
          <Link className="h-4 w-4 mr-2" />
          Share
        </Button>
        
        <Button 
          onClick={handleSave}
          disabled={!canSave}
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
};

export default EditorActions;
