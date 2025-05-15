import React, { useState, useEffect } from "react";
import { useWallet } from "@alephium/web3-react";
import { Shield, Users, PlusCircle, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { nostrService } from "@/lib/nostr";
import { useCommunity } from "@/hooks/useCommunity";
import CommunitiesGrid from "@/components/community/CommunitiesGrid";
import CreateCommunityDialog from "@/components/community/CreateCommunityDialog";

const DAOPage = () => {
  const wallet = useWallet();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [userCommunities, setUserCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if wallet is connected
  const connected = wallet.connectionStatus === 'connected';
  
  // Nostr pubkey that will be derived from Alephium wallet
  const [derivedNostrPubkey, setDerivedNostrPubkey] = useState<string | null>(null);
  
  // Effect to generate a Nostr key from Alephium wallet address when connected
  useEffect(() => {
    const deriveNostrKeyFromWallet = async () => {
      if (connected && wallet.account) {
        try {
          // In a real implementation, we would request the wallet to sign a message
          // and derive a deterministic Nostr public key from it
          // This is a placeholder for the actual cryptographic implementation
          
          // For now, we'll simulate a derived pubkey
          const mockDerivedPubkey = `npub_derived_${wallet.account.address.substring(0, 10)}`;
          
          setDerivedNostrPubkey(mockDerivedPubkey);
          
          // Assign the derived key to nostrService for operations
          // This is just for demonstration - actual implementation would use proper key derivation
          // nostrService.setPublicKey(mockDerivedPubkey);
          
          toast.info("Alephium wallet connected", {
            description: "Your DAO identity is now active"
          });
        } catch (error) {
          console.error("Error deriving Nostr key:", error);
          toast.error("Failed to setup DAO identity", {
            description: "Please try reconnecting your wallet"
          });
        }
      } else {
        setDerivedNostrPubkey(null);
      }
    };
    
    deriveNostrKeyFromWallet();
  }, [connected, wallet.account]);
  
  // Load user's communities when derivedNostrPubkey changes
  useEffect(() => {
    const loadUserCommunities = async () => {
      setIsLoading(true);
      try {
        // This is a placeholder - in a real implementation we would fetch
        // communities where the user has membership
        // const communities = await nostrService.getUserCommunities(derivedNostrPubkey);
        const mockCommunities = [
          {
            id: "community_alph1",
            name: "Alephium Governance",
            description: "Official DAO for governance proposals on Alephium network parameters",
            creator: derivedNostrPubkey || "",
            members: [derivedNostrPubkey || ""],
            image: "https://alephium.org/images/logo-vertical.svg"
          },
          {
            id: "community_alph2",
            name: "Alephium Treasury",
            description: "Treasury management for Alephium ecosystem funding",
            creator: "npub1xyz",
            members: [derivedNostrPubkey || ""],
            image: ""
          }
        ];
        
        setUserCommunities(mockCommunities);
      } catch (error) {
        console.error("Error loading communities:", error);
        toast.error("Failed to load your DAOs");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (derivedNostrPubkey) {
      loadUserCommunities();
    }
  }, [derivedNostrPubkey]);
  
  const handleCreateDAO = async (name: string, description: string) => {
    if (!connected || !derivedNostrPubkey) {
      toast.error("Connect your wallet to create a DAO");
      return;
    }
    
    try {
      // In a real implementation, we would:
      // 1. Request the wallet to sign the DAO creation data
      // 2. Use the signature to authenticate the Nostr event
      // 3. Publish the DAO creation event
      
      toast.success("DAO created successfully", {
        description: `Your new DAO "${name}" is ready`
      });
      
      // Refresh the user communities
      setUserCommunities(prev => [
        {
          id: `community_${Math.random().toString(36).substring(2, 10)}`,
          name,
          description,
          creator: derivedNostrPubkey || "",
          members: [derivedNostrPubkey || ""],
          image: ""
        },
        ...prev
      ]);
      
      // Close dialog
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating DAO:", error);
      toast.error("Failed to create DAO", {
        description: "Please try again later"
      });
    }
  };
  
  // If not connected, show the wallet connect prompt
  if (!connected) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <Shield className="h-16 w-16 text-primary/60" />
          <h2 className="text-3xl font-bold tracking-tight">Connect Your Alephium Wallet</h2>
          <p className="text-muted-foreground max-w-md">
            Connect your Alephium wallet to participate in on-chain governance through DAOs
          </p>
          
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>DAO Identity</CardTitle>
              <CardDescription>
                Your Alephium wallet will be used to derive a secure identity for DAO participation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <Button variant="outline" className="w-full" asChild>
                  <a href="/wallets">
                    <Shield className="mr-2 h-4 w-4" />
                    Go to Wallets Page
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">On-chain Voting</h3>
              <p className="text-sm text-muted-foreground">Secure voting with Alephium wallet signatures</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Create Proposals</h3>
              <p className="text-sm text-muted-foreground">Submit governance proposals to your communities</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Secure Identity</h3>
              <p className="text-sm text-muted-foreground">Your DAO identity is derived from your wallet</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Cross-Protocol</h3>
              <p className="text-sm text-muted-foreground">Combines Alephium security with Nostr communications</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Alephium DAOs</h2>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create DAO
          </Button>
        </div>
        
        <Card className="bg-primary-foreground border-primary/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Secure On-Chain Governance</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your DAO identity is secured by your Alephium wallet. All votes and proposals are signed with your wallet's keys.
                </p>
              </div>
              <div className="ml-auto flex-shrink-0 mt-2 sm:mt-0">
                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {wallet.account ? `Connected: ${wallet.account.address.substring(0, 6)}...${wallet.account.address.substring(wallet.account.address.length - 4)}` : "Not Connected"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 max-w-md">
            <TabsTrigger value="my-daos" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>My DAOs</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Discover</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-daos" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading your DAOs...</p>
              </div>
            ) : userCommunities.length > 0 ? (
              <CommunitiesGrid communities={userCommunities} />
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center text-center p-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No DAOs Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't joined any DAOs yet. Create your own or discover existing ones.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    Create Your First DAO
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="discover" className="mt-6">
            <div className="flex flex-col space-y-8">
              <div className="flex flex-col space-y-4">
                <h3 className="text-xl font-semibold">Featured DAOs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Featured DAOs would be populated here */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Alephium Core Protocol</CardTitle>
                      <CardDescription>Core protocol governance proposals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Vote on changes to Alephium's core protocol including fees, block parameters, and rewards.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">Join DAO</Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">dApps Grant Fund</CardTitle>
                      <CardDescription>Community-driven grant funding</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Vote on which dApp projects receive funding from the Alephium ecosystem fund.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">Join DAO</Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">BlockNostr</CardTitle>
                      <CardDescription>Governance for this platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Help guide the development and governance of the BlockNostr platform.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">Join DAO</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-col space-y-4">
                <h3 className="text-xl font-semibold">Explore All DAOs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* More DAOs would be populated here */}
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Community DAO {i}</CardTitle>
                        <CardDescription>Community-driven organization</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          A community-organized DAO focused on various Alephium ecosystem initiatives.
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full">View DAO</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <CreateCommunityDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateCommunity={handleCreateDAO}
        title="Create New DAO"
        description="Create a new decentralized autonomous organization powered by Alephium"
      />
    </div>
  );
};

export default DAOPage;
