
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { nostrService, Relay, LIST_IDENTIFIERS } from "@/lib/nostr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Hash, Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [relays, setRelays] = useState<Relay[]>([]);
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [loadingInterests, setLoadingInterests] = useState(false);
  
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
    
    const loadInterests = async () => {
      if (!isLoggedIn) return;
      
      setLoadingInterests(true);
      try {
        // Access the interests through the socialInteractionService
        const socialService = nostrService.service.socialInteractionService;
        if (socialService) {
          const userInterests = await socialService.getInterests();
          setInterests(userInterests || []);
        }
      } catch (error) {
        console.error("Error loading interests:", error);
      } finally {
        setLoadingInterests(false);
      }
    };
    
    checkAuth();
    loadRelays();
    
    if (isLoggedIn) {
      loadInterests();
    }
    
    // Refresh relay status every 5 seconds
    const interval = setInterval(loadRelays, 5000);
    
    return () => clearInterval(interval);
  }, [navigate, isLoggedIn]);
  
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

  const handleAddInterest = async () => {
    if (!newInterest.trim()) return;
    
    try {
      const socialService = nostrService.service.socialInteractionService;
      if (socialService) {
        const success = await socialService.addInterest(newInterest.trim());
        if (success) {
          toast.success(`Added interest: ${newInterest}`);
          setInterests(prev => [...prev, newInterest.trim()]);
          setNewInterest("");
        } else {
          toast.error("Failed to add interest");
        }
      }
    } catch (error) {
      console.error("Error adding interest:", error);
      toast.error("Error adding interest");
    }
  };

  const handleRemoveInterest = async (interest: string) => {
    try {
      const socialService = nostrService.service.socialInteractionService;
      if (socialService) {
        const success = await socialService.removeInterest(interest);
        if (success) {
          toast.success(`Removed interest: ${interest}`);
          setInterests(prev => prev.filter(i => i !== interest));
        } else {
          toast.error("Failed to remove interest");
        }
      }
    } catch (error) {
      console.error("Error removing interest:", error);
      toast.error("Error removing interest");
    }
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
              <TabsTrigger value="interests">Interests</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
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

            <TabsContent value="interests">
              <Card>
                <CardHeader>
                  <CardTitle>Your Interests</CardTitle>
                  <CardDescription>
                    Manage topics you're interested in (NIP-51 compliant)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newInterest">Add New Interest Topic</Label>
                      <div className="flex items-center mt-1.5 gap-2">
                        <Input 
                          id="newInterest" 
                          placeholder="bitcoin"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newInterest.trim()) {
                              handleAddInterest();
                            }
                          }}
                        />
                        <Button 
                          onClick={handleAddInterest}
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Topics you add here are stored as a NIP-51 interests list (kind 10000, d="interests")
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Your Interest Topics</h3>
                      <div className="flex flex-wrap gap-2">
                        {loadingInterests ? (
                          <p className="text-sm italic text-muted-foreground">Loading interests...</p>
                        ) : interests.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No interests added yet. Add topics you're interested in above.
                          </p>
                        ) : (
                          interests.map((interest) => (
                            <div 
                              key={interest} 
                              className="flex items-center bg-secondary px-2 py-1 rounded-md"
                            >
                              <Hash className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="text-sm">{interest}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 w-5 p-0 ml-1"
                                onClick={() => handleRemoveInterest(interest)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
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
