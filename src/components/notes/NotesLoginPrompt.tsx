
import React from "react";
import { FileText } from "lucide-react";

const NotesLoginPrompt = () => {
  return (
    <div className="text-center py-12 border rounded-lg bg-gradient-to-b from-background/60 to-background/40 border-border/30 shadow-sm transition-all hover:shadow-md backdrop-blur-sm">
      <div className="p-3 bg-primary/10 rounded-full mx-auto mb-3 relative w-fit overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 animate-pulse"></div>
        <FileText className="h-10 w-10 text-primary/80 relative z-10" />
      </div>
      <h3 className="font-normal text-lg mb-2">Your notes are waiting</h3>
      <p className="text-muted-foreground mb-4 max-w-xs mx-auto">
        Connect your Nostr wallet using the button in the top right corner to view and manage your saved notes.
      </p>
    </div>
  );
};

export default NotesLoginPrompt;
