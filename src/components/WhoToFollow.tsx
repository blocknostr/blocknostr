
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-base">Who to follow</CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-2">
        <div className="space-y-2">
          {suggestedUsers.map((user) => {
            // Format the npub for display
            const shortNpub = `${user.npub.substring(0, 8)}...`;
            const avatarFallback = user.name.charAt(0).toUpperCase();
            
            return (
              <div key={user.npub} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.picture} />
                    <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{shortNpub}</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 rounded-full text-xs px-2.5">
                  Follow
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WhoToFollow;
