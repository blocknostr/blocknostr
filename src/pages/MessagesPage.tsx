
import MessagingSystem from "@/components/MessagingSystem";
import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";

const MessagesPage = () => {
  const [encryptionInfoShown, setEncryptionInfoShown] = useState(true);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b h-14 px-4">
        <h1 className="font-semibold text-lg">Messages</h1>
      </header>
      
      <div className="flex-1 flex flex-col">
        {encryptionInfoShown && (
          <Alert className="mx-4 mt-1 mb-1">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>End-to-End Encrypted</AlertTitle>
            <AlertDescription className="text-xs">
              Messages are encrypted using NIP-04 for maximum security. Only you and your recipient can read them.
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs ml-2"
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
    </>
  );
};

export default MessagesPage;
