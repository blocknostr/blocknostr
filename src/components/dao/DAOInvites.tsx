
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { InviteLink } from "@/types/community";
import { formatDistanceToNow } from "date-fns";
import { Copy, Link as LinkIcon, Check } from "lucide-react";

interface DAOInvitesProps {
  communityId: string;
  inviteLinks: InviteLink[];
  onCreateInvite: () => Promise<string | null>;
  isPrivate: boolean;
}

const DAOInvites = ({
  communityId,
  inviteLinks,
  onCreateInvite,
  isPrivate
}: DAOInvitesProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Handle create invite
  const handleCreateInvite = async () => {
    setIsCreating(true);
    try {
      const inviteId = await onCreateInvite();
      if (inviteId) {
        toast.success("Invite link created successfully");
      } else {
        toast.error("Failed to create invite link");
      }
    } catch (error) {
      console.error("Error creating invite:", error);
      toast.error("Error creating invite", {
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Copy invite link to clipboard
  const copyInvite = (inviteId: string) => {
    try {
      const inviteUrl = `${window.location.origin}/dao/invite/${inviteId}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(inviteId);
      toast.success("Invite link copied to clipboard");
      
      // Reset the "copied" state after a delay
      setTimeout(() => {
        setCopiedLink(null);
      }, 3000);
    } catch (error) {
      toast.error("Failed to copy invite link");
    }
  };
  
  // Format invite expiration
  const formatExpiration = (expiresAt: number) => {
    const now = Math.floor(Date.now() / 1000);
    if (now > expiresAt) {
      return "Expired";
    }
    return `Expires ${formatDistanceToNow(new Date(expiresAt * 1000), { addSuffix: true })}`;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>DAO Invites</CardTitle>
        <CardDescription>
          {isPrivate ? 
            "This is a private DAO. Share invite links to allow others to join." :
            "Share these links or allow anyone to join directly from the DAO page."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={handleCreateInvite}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? "Creating..." : "Generate New Invite Link"}
          </Button>
          
          {inviteLinks.length > 0 ? (
            <div className="space-y-3">
              <Label>Your Invite Links</Label>
              {inviteLinks.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="text-xs">
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span className="font-mono">{invite.id.slice(0, 8)}...</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      {invite.expiresAt ? formatExpiration(invite.expiresAt) : "Never expires"}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyInvite(invite.id)}
                  >
                    {copiedLink === invite.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              No invite links generated yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DAOInvites;
