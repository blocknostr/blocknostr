
import React, { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginDialog from "@/components/auth/LoginDialog";

const NotesLoginPrompt = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  return (
    <>
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-2 opacity-50" />
        <p className="text-muted-foreground mb-4">Login to view your saved notes.</p>
        <Button variant="outline" onClick={() => setLoginDialogOpen(true)}>Sign In</Button>
      </div>
      
      <LoginDialog 
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
      />
    </>
  );
};

export default NotesLoginPrompt;
