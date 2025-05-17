
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

interface DAOInvitesProps {
  daoId: string;
  inviteLinks?: string[];
  onCreateInvite: () => Promise<string | null>;
  isPrivate?: boolean;
}

const DAOInvites: React.FC<DAOInvitesProps> = ({
  daoId,
  inviteLinks = [],
  onCreateInvite,
  isPrivate = false
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  const handleCreateInvite = async () => {
    setIsCreating(true);
    try {
      const inviteLink = await onCreateInvite();
      if (inviteLink) {
        toast.success("Invite link created successfully");
      }
    } catch (error) {
      console.error("Error creating invite link:", error);
      toast.error("Failed to create invite link");
    } finally {
      setIsCreating(false);
    }
  };
  
  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    toast.success("Invite link copied to clipboard");
    
    setTimeout(() => {
      setCopiedLink(null);
    }, 3000);
  };
  
  const shareInvite = (link: string) => {
    if (navigator.share) {
      navigator.share({
        title: "Join my DAO",
        text: "I'd like to invite you to join this DAO",
        url: link,
      })
      .catch((error) => console.error("Error sharing:", error));
    } else {
      copyToClipboard(link);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Invite Links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPrivate && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
            This DAO is private. Only people with invite links can join.
          </div>
        )}

        <div className="space-y-2">
          {inviteLinks.length > 0 ? (
            inviteLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={link}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(link)}
                >
                  {copiedLink === link ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => shareInvite(link)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No invite links generated yet.
            </p>
          )}
        </div>

        <Button 
          onClick={handleCreateInvite} 
          disabled={isCreating}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? "Creating..." : "Create New Invite Link"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DAOInvites;
