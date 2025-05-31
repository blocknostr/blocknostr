import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FollowButton from "@/components/FollowButton";
import { DEMO_PROFILES, DEV_CONFIG } from "@/constants";

const WhoToFollow = () => {
  // ✅ FIXED: Use configurable demo profiles instead of hardcoded values
  const people = DEV_CONFIG.SHOW_DEMO_PROFILES ? DEMO_PROFILES.map(profile => ({
    id: profile.npub,
    name: profile.name,
    npub: profile.npub,
    avatar: profile.picture,
  })) : [];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Who to follow</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-4">
          {people.map((user) => {
            // Format the npub for display
            const shortNpub = `${user.npub.substring(0, 8)}...`;
            const avatarFallback = user.name.charAt(0).toUpperCase();
            
            // Convert npub to hex pubkey for the FollowButton
            let hexPubkey = "";
            try {
              const { nostrService } = require("@/lib/nostr");
              hexPubkey = nostrService.getHexFromNpub(user.npub);
            } catch (error) {
              console.error(`Failed to convert npub to hex: ${user.npub}`, error);
            }
            
            return (
              <div key={user.npub} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{shortNpub}</div>
                  </div>
                </div>
                <FollowButton pubkey={hexPubkey} variant="outline" className="text-xs" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WhoToFollow;

