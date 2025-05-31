
import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Copy, Share, Eye, FileCode, Trash, Lock, Unlock } from "lucide-react";

interface EditorActionsProps {
  canSave: boolean;
  noteId: string | null;
  previewMode: boolean;
  isEncrypted: boolean;
  handleSave: () => void;
  copyToClipboard: () => void;
  shareNote: () => void;
  togglePreview: () => void;
  toggleEncryption: () => void;
  clearEditor: () => void;
}

const EditorActions = ({
  canSave,
  noteId,
  previewMode,
  isEncrypted,
  handleSave,
  copyToClipboard,
  shareNote,
  togglePreview,
  toggleEncryption,
  clearEditor,
}: EditorActionsProps) => {
  return (
    <div className="flex flex-wrap gap-2 justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={copyToClipboard} variant="outline" size="sm">
          <Copy className="h-4 w-4 mr-1" />
          Copy
        </Button>

        <Button
          onClick={togglePreview}
          variant={previewMode ? "secondary" : "outline"}
          size="sm"
        >
          <Eye className="h-4 w-4 mr-1" />
          {previewMode ? "Editing" : "Preview"}
        </Button>

        <Button
          onClick={clearEditor}
          variant="outline"
          size="sm"
        >
          <FileCode className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={toggleEncryption}
          variant="outline"
          size="sm"
          className={isEncrypted ? "bg-green-500/10 text-green-700 hover:bg-green-500/20" : ""}
        >
          {isEncrypted ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />}
          {isEncrypted ? "Encrypted" : "Encrypt"}
        </Button>

        <Button
          onClick={handleSave}
          disabled={!canSave}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        
        {noteId && (
          <Button onClick={shareNote} variant="outline" size="sm">
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>
        )}
        
        {noteId && (
          <Button
            onClick={clearEditor}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-100/20"
          >
            <Trash className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default EditorActions;

