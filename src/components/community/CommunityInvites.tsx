
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Link, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { InviteLink } from "@/types/community";
import { format } from "date-fns";

interface CommunityInvitesProps {
  communityId: string;
  inviteLinks: InviteLink[];
  onCreateInvite: (maxUses?: number, expiresIn?: number) => Promise<string | null>;
  isPrivate?: boolean;
}

const CommunityInvites = ({
  communityId,
  inviteLinks,
  onCreateInvite,
  isPrivate = false
}: CommunityInvitesProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [expiration, setExpiration] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  
  // Filter to only show valid invite links
  const validInvites = inviteLinks.filter(invite => {
    const now = Date.now() / 1000;
    const isExpired = invite.expiresAt ? invite.expiresAt < now : false;
    const isUsedUp = invite.maxUses ? invite.usedCount >= invite.maxUses : false;
    return !isExpired && !isUsedUp;
  });
  
  const handleCreateInvite = async () => {
    setIsSubmitting(true);
    try {
      await onCreateInvite(maxUses, expiration);
      setIsCreating(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setMaxUses(undefined);
    setExpiration(undefined);
  };
  
  const copyInviteLink = (inviteId: string) => {
    const inviteUrl = `${window.location.origin}/invite/${inviteId}`;
    
    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        setCopiedLinkId(inviteId);
        toast.success("Invite link copied to clipboard!");
        setTimeout(() => setCopiedLinkId(null), 3000);
      })
      .catch(err => {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy invite link");
      });
  };
  
  const formatExpiry = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return format(new Date(timestamp * 1000), "MMM d, yyyy");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Link className="h-5 w-5 mr-2" />
            Invite Links
          </span>
          <Button 
            size="sm"
            onClick={() => setIsCreating(true)}
          >
            Create Link
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPrivate && validInvites.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            This is a private community. Create invite links to allow new members to join.
          </p>
        )}
        
        {validInvites.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No active invite links</p>
        ) : (
          <ul className="space-y-3">
            {validInvites.map(invite => (
              <li key={invite.id} className="flex items-center justify-between py-2 px-3 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {formatExpiry(invite.expiresAt)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {invite.maxUses ? `${invite.usedCount}/${invite.maxUses} uses` : "Unlimited uses"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyInviteLink(invite.id)}
                >
                  {copiedLinkId === invite.id ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Invite Link</DialogTitle>
              <DialogDescription>
                Create a link that others can use to join this community.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max-uses" className="text-right">
                  Max uses
                </Label>
                <Select
                  value={maxUses?.toString() || "unlimited"}
                  onValueChange={(val) => setMaxUses(val === "unlimited" ? undefined : parseInt(val))}
                >
                  <SelectTrigger id="max-uses" className="col-span-3">
                    <SelectValue placeholder="Unlimited" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                    <SelectItem value="1">1 use</SelectItem>
                    <SelectItem value="5">5 uses</SelectItem>
                    <SelectItem value="10">10 uses</SelectItem>
                    <SelectItem value="25">25 uses</SelectItem>
                    <SelectItem value="50">50 uses</SelectItem>
                    <SelectItem value="100">100 uses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expires" className="text-right">
                  Expires
                </Label>
                <Select
                  value={expiration?.toString() || "never"}
                  onValueChange={(val) => setExpiration(val === "never" ? undefined : parseInt(val))}
                >
                  <SelectTrigger id="expires" className="col-span-3">
                    <SelectValue placeholder="Never expires" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never expires</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="72">3 days</SelectItem>
                    <SelectItem value="168">1 week</SelectItem>
                    <SelectItem value="720">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreateInvite} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Invite Link"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CommunityInvites;
