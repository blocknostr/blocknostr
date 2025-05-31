
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LockOpen } from "lucide-react";
import LoginDialog from "@/components/auth/LoginDialog";

interface LoginPromptProps {
  message?: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  message = "You need to login to access this feature" 
}) => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  
  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardContent className="pt-6 text-center flex flex-col items-center">
          <LockOpen size={48} className="text-muted-foreground" />
          <h2 className="text-xl font-semibold mt-4">Login Required</h2>
          <p className="text-muted-foreground mt-2 mb-6">{message}</p>
          
          <Button onClick={() => setLoginDialogOpen(true)}>
            Login
          </Button>
          
          <LoginDialog 
            open={loginDialogOpen}
            onOpenChange={setLoginDialogOpen}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPrompt;

