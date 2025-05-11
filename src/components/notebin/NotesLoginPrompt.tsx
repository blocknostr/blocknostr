
import React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotesLoginPrompt = () => {
  return (
    <div className="text-center py-12 border rounded-lg bg-muted/20">
      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-2 opacity-50" />
      <p className="text-muted-foreground mb-4">Login to view your saved notes.</p>
      <Button variant="outline">Sign In</Button>
    </div>
  );
};

export default NotesLoginPrompt;
