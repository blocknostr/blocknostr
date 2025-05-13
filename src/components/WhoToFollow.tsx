
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FollowButton from "./FollowButton";
import { nostrService } from "@/lib/nostr";

const WhoToFollow = () => {
  // This would be fetched from Nostr in a real implementation
  const suggestedUsers = [
    { 
      name: "Jack", 
      npub: "npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m",
      picture: "https://avatars.githubusercontent.com/u/1247608?v=4" 
    },
    { 
      name: "Fiatjaf", 
      npub: "npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6",
      picture: "https://avatars.githubusercontent.com/u/1653275?v=4" 
    },
    { 
      name: "Nostr Project", 
      npub: "npub1nstrcu63lzpjkz94djajuz2evrgu6qezckvmhrfhqdk5urlu9u5sn2v5sz",
      picture: "" 
    },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Who to follow</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-4">
          {suggestedUsers.map((user) => {
            // Format the npub for display
            const shortNpub = `${user.npub.substring(0, 8)}...`;
            const avatarFallback = user.name.charAt(0).toUpperCase();
            
            // Convert npub to hex pubkey
            let hexPubkey;
            try {
              hexPubkey = nostrService.getHexFromNpub(user.npub);
            } catch (e) {
              console.error(`Invalid npub for ${user.name}:`, e);
              return null;
            }
            
            return (
              <div key={user.npub} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.picture} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{shortNpub}</div>
                  </div>
                </div>
                <FollowButton pubkey={hexPubkey} variant="outline" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WhoToFollow;
