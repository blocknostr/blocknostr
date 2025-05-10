import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { nostrService, Relay } from "@/lib/nostr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CircleDot, Plus, Trash2, Link } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Media server related constants and settings
const DEFAULT_MEDIA_SERVER = "https://blossom.primal.net";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [relays, setRelays] = useState<Relay[]>([]);
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Media server related state
  const [mediaServer, setMediaServer] = useState(
    localStorage.getItem("mediaServer") || DEFAULT_MEDIA_SERVER
  );
  const [newMediaServerUrl, setNewMediaServerUrl] = useState("");
  const [enableMediaMirrors, setEnableMediaMirrors] = useState(
    localStorage.getItem("enableMediaMirrors") === "true"
  );
  const [mediaMirrors, setMediaMirrors] = useState<string[]>(
    JSON.parse(localStorage.getItem("mediaMirrors") || "[]")
  );
  const [newMirrorUrl, setNewMirrorUrl] = useState("");
  
  // New state for tracking server ping status
  const [mediaServerStatus, setMediaServerStatus] = useState<{[key: string]: boolean}>({});
  
  useEffect(() => {
    const checkAuth = () => {
      const pubkey = nostrService.publicKey;
      setIsLoggedIn(!!pubkey);
      
      if (!pubkey) {
        toast.error("You need to log in to access settings");
        navigate("/");
      }
    };
    
    const loadRelays = () => {
      const relayStatus = nostrService.getRelayStatus();
      setRelays(relayStatus);
    };
    
    checkAuth();
    loadRelays();
    
    // Add function to check media server status
    const checkMediaServerStatus = async () => {
      // Check primary media server
      try {
        const response = await fetch(`${mediaServer}/health`, { 
          method: 'HEAD',
          cache: 'no-store' 
        });
        setMediaServerStatus(prev => ({...prev, [mediaServer]: response.ok}));
      } catch (error) {
        setMediaServerStatus(prev => ({...prev, [mediaServer]: false}));
      }
      
      // Check all mirrors
      if (enableMediaMirrors) {
        for (const mirror of mediaMirrors) {
          try {
            const response = await fetch(`${mirror}/health`, { 
              method: 'HEAD',
              cache: 'no-store'
            });
            setMediaServerStatus(prev => ({...prev, [mirror]: response.ok}));
          } catch (error) {
            setMediaServerStatus(prev => ({...prev, [mirror]: false}));
          }
        }
      }
    };
    
    // Check media server status immediately and then every 30 seconds
    checkMediaServerStatus();
    const statusInterval = setInterval(checkMediaServerStatus, 30000);
    
    // Refresh relay status every 5 seconds
    const relayInterval = setInterval(loadRelays, 5000);
    
    return () => {
      clearInterval(relayInterval);
      clearInterval(statusInterval);
    };
  }, [navigate, mediaServer, mediaMirrors, enableMediaMirrors]);
  
  const handleAddRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    if (!newRelayUrl.startsWith("wss://")) {
      toast.error("Relay URL must start with wss://");
      return;
    }
    
    toast.loading("Connecting to relay...");
    const success = await nostrService.addRelay(newRelayUrl);
    
    if (success) {
      toast.success(`Connected to ${newRelayUrl}`);
      setNewRelayUrl("");
      setRelays(nostrService.getRelayStatus());
    } else {
      toast.error(`Failed to connect to ${newRelayUrl}`);
    }
  };
  
  const handleRemoveRelay = (relayUrl: string) => {
    nostrService.removeRelay(relayUrl);
    setRelays(nostrService.getRelayStatus());
    toast.success(`Removed relay: ${relayUrl}`);
  };
  
  // Media server handling functions
  const handleChangeMediaServer = () => {
    if (!newMediaServerUrl.trim()) return;
    
    if (!newMediaServerUrl.startsWith("https://")) {
      toast.error("Media server URL must start with https://");
      return;
    }
    
    setMediaServer(newMediaServerUrl);
    localStorage.setItem("mediaServer", newMediaServerUrl);
    setNewMediaServerUrl("");
    toast.success("Media server changed successfully");
    
    // Check status of the new server
    fetch(`${newMediaServerUrl}/health`, { 
      method: 'HEAD',
      cache: 'no-store' 
    })
    .then(response => {
      setMediaServerStatus(prev => ({...prev, [newMediaServerUrl]: response.ok}));
    })
    .catch(() => {
      setMediaServerStatus(prev => ({...prev, [newMediaServerUrl]: false}));
    });
  };
  
  const handleRestoreDefaultMediaServer = () => {
    setMediaServer(DEFAULT_MEDIA_SERVER);
    localStorage.setItem("mediaServer", DEFAULT_MEDIA_SERVER);
    toast.success("Default media server restored");
    
    // Check status of the default server
    fetch(`${DEFAULT_MEDIA_SERVER}/health`, { 
      method: 'HEAD',
      cache: 'no-store' 
    })
    .then(response => {
      setMediaServerStatus(prev => ({...prev, [DEFAULT_MEDIA_SERVER]: response.ok}));
    })
    .catch(() => {
      setMediaServerStatus(prev => ({...prev, [DEFAULT_MEDIA_SERVER]: false}));
    });
  };
  
  const handleToggleMediaMirrors = (checked: boolean) => {
    setEnableMediaMirrors(checked);
    localStorage.setItem("enableMediaMirrors", checked.toString());
    
    if (checked) {
      toast.success("Media mirrors enabled");
    } else {
      toast.success("Media mirrors disabled");
    }
  };
  
  const handleAddMirror = () => {
    if (!newMirrorUrl.trim()) return;
    
    if (!newMirrorUrl.startsWith("https://")) {
      toast.error("Mirror URL must start with https://");
      return;
    }
    
    const updatedMirrors = [...mediaMirrors, newMirrorUrl];
    setMediaMirrors(updatedMirrors);
    localStorage.setItem("mediaMirrors", JSON.stringify(updatedMirrors));
    setNewMirrorUrl("");
    toast.success("Media mirror added");
    
    // Check status of the new mirror
    if (enableMediaMirrors) {
      fetch(`${newMirrorUrl}/health`, { 
        method: 'HEAD',
        cache: 'no-store' 
      })
      .then(response => {
        setMediaServerStatus(prev => ({...prev, [newMirrorUrl]: response.ok}));
      })
      .catch(() => {
        setMediaServerStatus(prev => ({...prev, [newMirrorUrl]: false}));
      });
    }
  };
  
  const handleRemoveMirror = (mirrorUrl: string) => {
    const updatedMirrors = mediaMirrors.filter(url => url !== mirrorUrl);
    setMediaMirrors(updatedMirrors);
    localStorage.setItem("mediaMirrors", JSON.stringify(updatedMirrors));
    toast.success("Media mirror removed");
    
    // Remove status for this mirror
    setMediaServerStatus(prev => {
      const newStatus = {...prev};
      delete newStatus[mirrorUrl];
      return newStatus;
    });
  };
  
  // Function to render server status indicator
  const renderStatusIndicator = (url: string) => {
    const isLive = mediaServerStatus[url] === true;
    
    return (
      <div className="flex items-center gap-2">
        {isLive ? (
          <>
            <CircleDot className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
              Live
            </Badge>
          </>
        ) : (
          <div className="w-4 h-4"></div> // Empty space for alignment
        )}
      </div>
    );
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            <h1 className="font-semibold">Settings</h1>
          </div>
        </header>
        
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Tabs defaultValue="account" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="relays">Relays</TabsTrigger>
              <TabsTrigger value="media">Media Server</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            {/* Account tab content */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="pubkey">Your Public Key (NPUB)</Label>
                    <div className="flex items-center mt-1.5 gap-2">
                      <Input 
                        id="pubkey" 
                        readOnly 
                        value={nostrService.publicKey ? nostrService.formatPubkey(nostrService.publicKey) : ''}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            nostrService.publicKey ? nostrService.formatPubkey(nostrService.publicKey) : ''
                          );
                          toast.success("Public key copied to clipboard");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Profile Information</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      To update your profile information, post a kind 0 event with your metadata.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Relays tab content */}
            <TabsContent value="relays">
              <Card>
                <CardHeader>
                  <CardTitle>Relay Settings</CardTitle>
                  <CardDescription>
                    Manage the Nostr relays you connect to
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newRelay">Add New Relay</Label>
                      <div className="flex items-center mt-1.5 gap-2">
                        <Input 
                          id="newRelay" 
                          placeholder="wss://relay.example.com"
                          value={newRelayUrl}
                          onChange={(e) => setNewRelayUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newRelayUrl.trim()) {
                              handleAddRelay();
                            }
                          }}
                        />
                        <Button 
                          onClick={handleAddRelay}
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Connected Relays</h3>
                      <div className="space-y-2">
                        {relays.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No relays connected yet. Add a relay above.
                          </p>
                        ) : (
                          relays.map((relay) => (
                            <div 
                              key={relay.url} 
                              className="flex items-center justify-between border p-2 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className={`w-2 h-2 rounded-full ${
                                    relay.status === 'connected' ? 'bg-green-500' : 
                                    relay.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                ></div>
                                <span className="text-sm">{relay.url}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleRemoveRelay(relay.url)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* New Media Server tab with enhanced visuals */}
            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle>Media Server Settings</CardTitle>
                  <CardDescription>
                    Configure your media server and mirrors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="currentMediaServer">Current Media Server</Label>
                    <div className="flex items-center mt-1.5 gap-2 mb-1">
                      <Input 
                        id="currentMediaServer" 
                        readOnly 
                        value={mediaServer}
                      />
                      {renderStatusIndicator(mediaServer)}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="newMediaServer">Switch Media Server</Label>
                    <div className="flex items-center mt-1.5 gap-2">
                      <Input 
                        id="newMediaServer" 
                        placeholder="https://blossom.primal.net"
                        value={newMediaServerUrl}
                        onChange={(e) => setNewMediaServerUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newMediaServerUrl.trim()) {
                            handleChangeMediaServer();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleChangeMediaServer}
                        size="sm"
                      >
                        Save
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleRestoreDefaultMediaServer}
                    >
                      Restore Default Media Server
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">Media Mirrors</h3>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <Switch
                        id="enable-mirrors"
                        checked={enableMediaMirrors}
                        onCheckedChange={handleToggleMediaMirrors}
                      />
                      <Label htmlFor="enable-mirrors">Enable media mirrors</Label>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      You can enable one or more media mirror servers. When enabled, your uploads to the 
                      primary media server will be automatically copied to the mirror(s).
                    </p>
                    
                    {enableMediaMirrors && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="newMirror">Add Media Mirror</Label>
                          <div className="flex items-center mt-1.5 gap-2">
                            <Input 
                              id="newMirror" 
                              placeholder="https://media-mirror.example.com"
                              value={newMirrorUrl}
                              onChange={(e) => setNewMirrorUrl(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newMirrorUrl.trim()) {
                                  handleAddMirror();
                                }
                              }}
                            />
                            <Button 
                              onClick={handleAddMirror}
                              size="icon"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Configured Media Mirrors</h3>
                          <div className="space-y-2">
                            {mediaMirrors.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No media mirrors configured yet. Add a mirror above.
                              </p>
                            ) : (
                              mediaMirrors.map((mirror) => (
                                <div 
                                  key={mirror} 
                                  className="flex items-center justify-between border p-2 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <Link className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{mirror}</span>
                                    {renderStatusIndicator(mirror)}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleRemoveMirror(mirror)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Privacy tab content */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Manage your privacy preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Note: Nostr is a public protocol. Messages sent in public channels
                    are visible to anyone. Direct messages are encrypted but metadata
                    (who is messaging whom) might be publicly visible.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Notifications tab content */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Manage your notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Notification features will be implemented in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* About tab content */}
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About BlockNostr</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>BN</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold">BlockNostr</h3>
                        <p className="text-sm text-muted-foreground">
                          A decentralized social media client for Nostr
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm">
                        BlockNostr is a client for the Nostr protocol, a decentralized
                        social media protocol that enables censorship-resistant communication.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium">Version</h4>
                      <p className="text-sm text-muted-foreground">1.0.0</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium">Learn More</h4>
                      <ul className="text-sm space-y-1 mt-1">
                        <li>
                          <a 
                            href="https://github.com/nostr-protocol/nostr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Nostr Protocol
                          </a>
                        </li>
                        <li>
                          <a 
                            href="https://github.com/nostr-protocol/nips"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Nostr Improvement Proposals (NIPs)
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
