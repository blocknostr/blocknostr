
import React, { useState } from "react";
import MessagingSystem from "@/components/MessagingSystem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/navigation/PageHeader";

const MessagesPage = () => {
  const [encryptionInfoShown, setEncryptionInfoShown] = useState(true);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      <PageHeader 
        title="Messages" 
        showBackButton={false}
        className="border-b shadow-sm"
      />
      
      {encryptionInfoShown && (
        <Alert className="mx-4 my-2 border-primary/20 bg-primary/5">
          <InfoIcon className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm font-medium">End-to-End Encrypted</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Messages are encrypted using NIP-44 for maximum security. Only you and your recipient can read them.
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs ml-2 text-primary"
              onClick={() => setEncryptionInfoShown(false)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex-1 overflow-hidden">
        <MessagingSystem />
      </div>
    </div>
  );
};

export default MessagesPage;
