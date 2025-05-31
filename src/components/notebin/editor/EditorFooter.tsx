
import React from "react";
import { nostrService } from "@/lib/nostr";

interface EditorFooterProps {
  isLoggedIn: boolean;
}

const EditorFooter: React.FC<EditorFooterProps> = ({ isLoggedIn }) => {
  return (
    <>
      <div className="text-xs text-muted-foreground mt-1">
        <span>Keyboard shortcuts: </span>
        <kbd className="px-1 py-0.5 text-xs border rounded">Ctrl+S</kbd>
        <span> Save, </span>
        <kbd className="px-1 py-0.5 text-xs border rounded">Ctrl+P</kbd>
        <span> Toggle Preview</span>
      </div>
      
      {!isLoggedIn && (
        <p className="text-sm text-muted-foreground text-center mt-2">
          You need to be logged in to save notes.
        </p>
      )}
    </>
  );
};

export default EditorFooter;

