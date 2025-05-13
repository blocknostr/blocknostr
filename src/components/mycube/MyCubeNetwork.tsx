
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Radio, Wifi, Heart } from "lucide-react";

interface MyCubeNetworkProps {
  followers: any[];
  following: any[];
  relays: any[];
}

const MyCubeNetwork = ({ followers, following, relays }: MyCubeNetworkProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("followers");
  
  // Filter based on search term
  const filteredFollowers = followers.filter(follower => 
    follower?.metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    follower?.metadata?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredFollowing = following.filter(follow => 
    follow?.metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    follow?.metadata?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredRelays = relays.filter(relay => 
    relay.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderConnectionStatus = (status: string) => {
    if (status === 'connected') {
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>;
    } else if (status === 'connecting') {
      return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">Connecting</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Disconnected</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Network</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Tabs defaultValue="followers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Following ({following.length})
            </TabsTrigger>
            <TabsTrigger value="relays" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Relays ({relays.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <TabsContent value="followers" className="space-y-4">
          {filteredFollowers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No followers match your search" : "No followers yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFollowers.map((follower, index) => (
                <div key={`follower-${index}`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={follower?.metadata?.picture} />
                      <AvatarFallback>{follower?.metadata?.name?.[0] || follower?.metadata?.display_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{follower?.metadata?.display_name || follower?.metadata?.name || 'Unknown user'}</div>
                      {follower?.metadata?.nip05 && (
                        <div className="text-xs text-muted-foreground">{follower.metadata.nip05}</div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="following" className="space-y-4">
          {filteredFollowing.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No following match your search" : "Not following anyone yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFollowing.map((follow, index) => (
                <div key={`following-${index}`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={follow?.metadata?.picture} />
                      <AvatarFallback>{follow?.metadata?.name?.[0] || follow?.metadata?.display_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{follow?.metadata?.display_name || follow?.metadata?.name || 'Unknown user'}</div>
                      {follow?.metadata?.nip05 && (
                        <div className="text-xs text-muted-foreground">{follow.metadata.nip05}</div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Unfollow</Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="relays" className="space-y-4">
          {filteredRelays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No relays match your search" : "No relays configured"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRelays.map((relay, index) => (
                <div key={`relay-${index}`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Wifi className={relay.status === 'connected' ? "h-5 w-5 text-green-500" : "h-5 w-5 text-muted-foreground"} />
                    </div>
                    <div>
                      <div className="font-medium">{relay.url.replace('wss://', '')}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {renderConnectionStatus(relay.status)}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </CardContent>
    </Card>
  );
};

export default MyCubeNetwork;
