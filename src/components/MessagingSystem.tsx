import { useState, useEffect } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  content: string;
  sender: string;
  recipient: string;
  created_at: number;
}

interface Contact {
  pubkey: string;
  profile?: {
    name?: string;
    display_name?: string;
    picture?: string;
  };
  lastMessage?: string;
  lastMessageTime?: number;
}

const MessagingSystem = () => {
  const currentUserPubkey = nostrService.publicKey;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  useEffect(() => {
    if (!currentUserPubkey) return;
    
    const loadContacts = async () => {
      // This is a two step process:
      // 1. Get all people the user has messaged with
      // 2. Get profiles for those people
      
      await nostrService.connectToUserRelays();
      
      // Subscribe to DMs
      const dmSubId = nostrService.subscribe(
        [
          {
            kinds: [4, 14], // Both legacy and NIP-17
            '#p': [currentUserPubkey], // Messages where user is tagged
          },
          {
            kinds: [4, 14],
            authors: [currentUserPubkey], // Messages sent by user
          }
        ],
        handleMessageEvent
      );
      
      // Also get the following list to suggest as contacts
      let contactPubkeys = new Set<string>();
      
      // Add following users as possible contacts
      nostrService.following.forEach(pubkey => {
        contactPubkeys.add(pubkey);
      });
      
      // Check if we should load a specific contact from profile page
      const lastMessagedUser = localStorage.getItem('lastMessagedUser');
      if (lastMessagedUser) {
        try {
          const pubkey = lastMessagedUser.startsWith('npub1') 
            ? nostrService.getHexFromNpub(lastMessagedUser)
            : lastMessagedUser;
            
          contactPubkeys.add(pubkey);
          
          // Clear the localStorage item
          localStorage.removeItem('lastMessagedUser');
        } catch (e) {
          console.error("Error processing lastMessagedUser:", e);
        }
      }
      
      // Load profiles for all contacts
      const profilePromises = Array.from(contactPubkeys).map(pubkey => 
        fetchProfileForContact(pubkey)
      );
      
      try {
        const contactProfiles = await Promise.all(profilePromises);
        const validContacts = contactProfiles.filter(Boolean) as Contact[];
        setContacts(validContacts);
        
        // If we have a lastMessagedUser, activate it
        if (lastMessagedUser) {
          const pubkey = lastMessagedUser.startsWith('npub1') 
            ? nostrService.getHexFromNpub(lastMessagedUser)
            : lastMessagedUser;
            
          const contact = validContacts.find(c => c.pubkey === pubkey);
          if (contact) {
            loadMessagesForContact(contact);
          }
        }
      } catch (error) {
        console.error("Error loading contact profiles:", error);
      }
      
      setLoading(false);
      
      return () => {
        nostrService.unsubscribe(dmSubId);
      };
    };
    
    loadContacts();
  }, [currentUserPubkey]);
  
  const handleMessageEvent = async (event: NostrEvent) => {
    try {
      // Skip if this isn't a DM
      if (event.kind !== 4 && event.kind !== 14) return;
      
      let otherPubkey: string;
      let content = event.content;
      
      // Determine the other party in the conversation
      if (event.pubkey === currentUserPubkey) {
        // Message sent by current user
        const recipientTag = event.tags.find(tag => tag[0] === 'p');
        if (!recipientTag || !recipientTag[1]) return;
        otherPubkey = recipientTag[1];
      } else {
        // Message received by current user
        otherPubkey = event.pubkey || '';
        
        // Decrypt received message
        if (window.nostr && window.nostr.nip04) {
          try {
            content = await window.nostr.nip04.decrypt(otherPubkey, content);
          } catch (e) {
            console.error("Failed to decrypt message:", e);
            content = "[Encrypted message]";
          }
        } else {
          content = "[Encrypted message - install a Nostr extension with NIP-04 support]";
        }
      }
      
      // Add contact if not already in list
      if (!contacts.some(c => c.pubkey === otherPubkey)) {
        const newContact = await fetchProfileForContact(otherPubkey);
        if (newContact) {
          setContacts(prev => [...prev, newContact]);
        }
      }
      
      // Update messages if this contact is active
      if (activeContact && activeContact.pubkey === otherPubkey) {
        const message = {
          id: event.id || '',
          content,
          sender: event.pubkey || '',
          recipient: otherPubkey,
          created_at: event.created_at
        };
        
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message].sort((a, b) => a.created_at - b.created_at);
        });
      }
      
      // Update last message for contact
      setContacts(prev => {
        return prev.map(c => {
          if (c.pubkey === otherPubkey) {
            return {
              ...c,
              lastMessage: content,
              lastMessageTime: event.created_at
            };
          }
          return c;
        }).sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return b.lastMessageTime - a.lastMessageTime;
        });
      });
      
    } catch (e) {
      console.error("Error processing message event:", e);
    }
  };
  
  const fetchProfileForContact = async (pubkey: string): Promise<Contact | null> => {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({ pubkey }); // Resolve with just the pubkey if profile fetch times out
      }, 5000);
      
      const metadataSubId = nostrService.subscribe(
        [
          {
            kinds: [0],
            authors: [pubkey],
            limit: 1
          }
        ],
        (event) => {
          clearTimeout(timeoutId);
          try {
            const metadata = JSON.parse(event.content);
            resolve({
              pubkey,
              profile: {
                name: metadata.name,
                display_name: metadata.display_name,
                picture: metadata.picture
              }
            });
          } catch (e) {
            console.error('Failed to parse profile metadata:', e);
            resolve({ pubkey });
          }
          nostrService.unsubscribe(metadataSubId);
        }
      );
    });
  };
  
  const loadMessagesForContact = async (contact: Contact) => {
    if (!currentUserPubkey) return;
    
    setActiveContact(contact);
    setMessages([]);
    setLoading(true);
    
    const dmSubId = nostrService.subscribe(
      [
        {
          kinds: [4, 14], // Support both legacy DM and NIP-17
          authors: [contact.pubkey],
          '#p': [currentUserPubkey]
        },
        {
          kinds: [4, 14],
          authors: [currentUserPubkey],
          '#p': [contact.pubkey]
        }
      ],
      async (event) => {
        try {
          let content = event.content;
          
          // Decrypt if necessary
          if (event.pubkey !== currentUserPubkey && window.nostr && window.nostr.nip04) {
            try {
              content = await window.nostr.nip04.decrypt(event.pubkey || '', content);
            } catch (e) {
              console.error("Failed to decrypt message:", e);
              content = "[Encrypted message]";
            }
          }
          
          const message = {
            id: event.id || '',
            content,
            sender: event.pubkey || '',
            recipient: event.pubkey === currentUserPubkey 
              ? (event.tags.find(t => t[0] === 'p')?.[1] || '') 
              : currentUserPubkey,
            created_at: event.created_at
          };
          
          setMessages(prev => {
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message].sort((a, b) => a.created_at - b.created_at);
          });
        } catch (e) {
          console.error("Error processing message:", e);
        }
      }
    );
    
    setLoading(false);
    
    return () => {
      nostrService.unsubscribe(dmSubId);
    };
  };
  
  const handleSendMessage = async () => {
    if (!activeContact || !newMessage.trim() || !currentUserPubkey) return;
    
    setSendingMessage(true);
    
    try {
      // Use NIP-17 for direct messages (kind 14)
      await nostrService.sendDirectMessage(activeContact.pubkey, newMessage);
      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your encrypted message has been sent"
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };
  
  const filteredContacts = contacts.filter(contact => {
    const name = contact.profile?.name || '';
    const displayName = contact.profile?.display_name || '';
    const npub = nostrService.getNpubFromHex(contact.pubkey);
    
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           npub.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const getDisplayName = (contact: Contact) => {
    return contact.profile?.display_name || 
           contact.profile?.name || 
           `${nostrService.getNpubFromHex(contact.pubkey).substring(0, 8)}...`;
  };
  
  const getAvatarFallback = (contact: Contact) => {
    const name = contact.profile?.display_name || contact.profile?.name || '';
    return name.charAt(0).toUpperCase() || 'N';
  };
  
  if (!currentUserPubkey) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">You need to log in to access messages</p>
        <Button onClick={() => nostrService.login()}>Login with Nostr</Button>
      </div>
    );
  }
  
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <Tabs defaultValue="messages" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full mb-2">
            <TabsTrigger value="messages" className="flex-1">Messages</TabsTrigger>
            <TabsTrigger value="contacts" className="flex-1">Contacts</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="messages" className="flex-1 flex flex-col">
          <div className="px-4 py-2">
            <Input 
              placeholder="Search messages..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
          </div>
          
          <div className="flex h-full">
            {/* Contacts list */}
            <div className="w-1/3 border-r overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {loading ? "Loading contacts..." : "No contacts found"}
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <div 
                    key={contact.pubkey}
                    className={`p-3 cursor-pointer hover:bg-accent flex items-center gap-3 ${
                      activeContact?.pubkey === contact.pubkey ? "bg-accent" : ""
                    }`}
                    onClick={() => loadMessagesForContact(contact)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.profile?.picture} />
                      <AvatarFallback>{getAvatarFallback(contact)}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden flex-1">
                      <div className="font-medium truncate">{getDisplayName(contact)}</div>
                      {contact.lastMessage && (
                        <div className="text-sm text-muted-foreground truncate">
                          {contact.lastMessage}
                        </div>
                      )}
                      {contact.lastMessageTime && (
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(contact.lastMessageTime * 1000), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Message area */}
            <div className="w-2/3 flex flex-col h-full">
              {activeContact ? (
                <>
                  {/* Header */}
                  <div className="p-3 border-b flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activeContact.profile?.picture} />
                      <AvatarFallback>{getAvatarFallback(activeContact)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{getDisplayName(activeContact)}</div>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted-foreground">
                        No messages yet. Send a message to start the conversation.
                      </div>
                    ) : (
                      messages.map(message => {
                        const isCurrentUser = message.sender === currentUserPubkey;
                        
                        return (
                          <div 
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[70%] px-4 py-2 rounded-lg ${
                                isCurrentUser 
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="text-sm">{message.content}</div>
                              <div className="text-xs opacity-70 mt-1">
                                {formatDistanceToNow(new Date(message.created_at * 1000), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Message input */}
                  <div className="p-3 border-t flex gap-2">
                    <Input 
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a contact to start messaging
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="contacts" className="flex-1">
          <div className="p-4 space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">People you follow</h3>
              <Input 
                placeholder="Search contacts..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            
            {filteredContacts.length === 0 ? (
              <div className="text-center text-muted-foreground">
                {loading ? "Loading contacts..." : "No contacts found"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredContacts.map(contact => (
                  <Card key={contact.pubkey}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={contact.profile?.picture} />
                        <AvatarFallback>{getAvatarFallback(contact)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{getDisplayName(contact)}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {nostrService.getNpubFromHex(contact.pubkey).substring(0, 12)}...
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => loadMessagesForContact(contact)}
                      >
                        Message
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessagingSystem;
