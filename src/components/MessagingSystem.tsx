
import { useState, useEffect, useRef } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, Send, MessageSquare, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    nip05?: string;
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
  const [newContactDialog, setNewContactDialog] = useState(false);
  const [newContactPubkey, setNewContactPubkey] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
            kinds: [4, 14], // Both NIP-04 and NIP-17
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
        
        // Try to decrypt received message with NIP-04
        let decryptionSuccessful = false;
        
        if (window.nostr?.nip04) {
          try {
            content = await window.nostr.nip04.decrypt(otherPubkey, content);
            decryptionSuccessful = true;
            console.log("Successfully decrypted message from:", otherPubkey);
          } catch (e) {
            console.error("Failed to decrypt with NIP-04:", e);
          }
        }
        
        if (!decryptionSuccessful) {
          content = "[Encrypted message - could not decrypt]";
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
                picture: metadata.picture,
                nip05: metadata.nip05
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
          if (event.pubkey !== currentUserPubkey) {
            let decryptionSuccessful = false;
            
            // Try NIP-04
            if (window.nostr?.nip04) {
              try {
                content = await window.nostr.nip04.decrypt(event.pubkey || '', content);
                decryptionSuccessful = true;
              } catch (e) {
                console.error("Failed to decrypt with NIP-04:", e);
              }
            }
            
            if (!decryptionSuccessful) {
              content = "[Encrypted message - could not decrypt]";
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
      console.log("Preparing to send message to:", activeContact.pubkey);
      
      // Use proper NIP-04 (kind 4) for direct messages
      const messageId = await nostrService.sendDirectMessage(activeContact.pubkey, newMessage);
      
      if (messageId) {
        console.log("Message sent successfully with ID:", messageId);
        
        // Add message to the UI immediately
        const message = {
          id: messageId,
          content: newMessage,
          sender: currentUserPubkey,
          recipient: activeContact.pubkey,
          created_at: Math.floor(Date.now() / 1000)
        };
        
        setMessages(prev => [...prev, message].sort((a, b) => a.created_at - b.created_at));
        
        // Update last message for contact
        setContacts(prev => {
          return prev.map(c => {
            if (c.pubkey === activeContact.pubkey) {
              return {
                ...c,
                lastMessage: newMessage,
                lastMessageTime: Math.floor(Date.now() / 1000)
              };
            }
            return c;
          }).sort((a, b) => {
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return b.lastMessageTime - a.lastMessageTime;
          });
        });
        
        setNewMessage("");
        toast({
          title: "Message sent",
          description: "Your encrypted message has been sent"
        });
      } else {
        console.error("Failed to send message, no event ID returned");
        toast({
          title: "Failed to send message",
          description: "Please check your connection and try again",
          variant: "destructive"
        });
      }
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
  
  const handleAddNewContact = async () => {
    if (!newContactPubkey) return;
    
    let pubkey = newContactPubkey;
    
    // Convert npub to hex if needed
    if (pubkey.startsWith('npub1')) {
      try {
        pubkey = nostrService.getHexFromNpub(pubkey);
      } catch (e) {
        toast({
          title: "Invalid public key",
          description: "The entered public key is not valid",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Check if contact already exists
    if (contacts.some(c => c.pubkey === pubkey)) {
      toast({
        title: "Contact already exists",
        description: "This contact is already in your list"
      });
      setNewContactDialog(false);
      setNewContactPubkey("");
      return;
    }
    
    // Fetch profile for new contact
    const newContact = await fetchProfileForContact(pubkey);
    if (newContact) {
      setContacts(prev => [...prev, newContact]);
      loadMessagesForContact(newContact);
      toast({
        title: "Contact added",
        description: `${getDisplayName(newContact)} has been added to your contacts`
      });
    } else {
      toast({
        title: "Could not find user",
        description: "No profile found for this public key",
        variant: "destructive"
      });
    }
    
    setNewContactDialog(false);
    setNewContactPubkey("");
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
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    
    // If message is from today, show only time
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If message is from yesterday, show "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  if (!currentUserPubkey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-1" />
        <h2 className="text-xl font-semibold mb-1">Welcome to BlockMail</h2>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          Secure, encrypted messaging built on Nostr and Alephium blockchain
        </p>
        <Button onClick={() => nostrService.login()}>Login with Nostr</Button>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex h-full">
        {/* Contacts list - Facebook Messenger style */}
        <div className="w-1/3 border-r overflow-hidden flex flex-col bg-background shadow-sm">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-semibold text-base">Chats</h3>
            <Button 
              size="sm" 
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full hover:bg-accent"
              onClick={() => setNewContactDialog(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </Button>
          </div>
          
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search conversations..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2 h-9 text-sm bg-muted/40 rounded-full"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {filteredContacts.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground">
                {loading ? (
                  <div className="flex flex-col items-center gap-1 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-xs">Loading conversations...</p>
                  </div>
                ) : (
                  <div className="py-4">
                    <MessageSquare className="h-8 w-8 mx-auto mb-1" />
                    <p className="text-xs">No conversations found</p>
                  </div>
                )}
              </div>
            ) : (
              filteredContacts.map(contact => (
                <div 
                  key={contact.pubkey}
                  className={`p-3 cursor-pointer hover:bg-accent/30 flex items-center gap-3 transition-colors ${
                    activeContact?.pubkey === contact.pubkey ? "bg-accent" : ""
                  }`}
                  onClick={() => loadMessagesForContact(contact)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={contact.profile?.picture} />
                      <AvatarFallback>{getAvatarFallback(contact)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></span>
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="font-semibold text-sm truncate">{getDisplayName(contact)}</div>
                    {contact.lastMessage && (
                      <div className="text-xs text-muted-foreground truncate">
                        {contact.lastMessage}
                      </div>
                    )}
                  </div>
                  {contact.lastMessageTime && (
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(contact.lastMessageTime)}
                    </div>
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </div>
            
        {/* Message area - Facebook Messenger style */}
        <div className="w-2/3 flex flex-col h-full bg-background overflow-hidden">
          {activeContact ? (
            <>
              {/* Header with FB Messenger style */}
              <div className="p-3 border-b flex items-center gap-3 shadow-sm">
                <div className="relative">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={activeContact.profile?.picture} />
                    <AvatarFallback>{getAvatarFallback(activeContact)}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-semibold truncate">{getDisplayName(activeContact)}</div>
                  <div className="text-xs text-green-500">Active now</div>
                </div>
              </div>
              
              {/* Messages with FB Messenger bubble style */}
              <ScrollArea className="flex-1 px-4 py-2">
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex justify-center items-center h-full py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-40 gap-1 py-10">
                      <MessageSquare className="h-12 w-12 mb-2 text-primary/20" />
                      <p className="text-sm font-medium">No messages yet</p>
                      <p className="text-xs max-w-[250px]">Send a message to start the conversation with {getDisplayName(activeContact)}</p>
                    </div>
                  ) : (
                    <>
                      {messages.map(message => {
                        const isCurrentUser = message.sender === currentUserPubkey;
                        
                        return (
                          <div 
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                          >
                            {!isCurrentUser && (
                              <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                                <AvatarImage src={activeContact.profile?.picture} />
                                <AvatarFallback>{getAvatarFallback(activeContact)}</AvatarFallback>
                              </Avatar>
                            )}
                            <div 
                              className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                                isCurrentUser 
                                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                  : 'bg-muted rounded-tl-sm'
                              }`}
                            >
                              <div className="text-sm break-words">{message.content}</div>
                              <div className={`text-[10px] ${isCurrentUser ? 'opacity-70 text-right' : 'text-muted-foreground text-left'} mt-1`}>
                                {formatTime(message.created_at)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </ScrollArea>
              
              {/* Message input with FB Messenger style */}
              <div className="p-3 border-t flex gap-2 bg-background shadow-sm">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-10 w-10 flex-shrink-0 rounded-full hover:bg-accent"
                  disabled={sendingMessage}
                >
                  <Paperclip className="h-5 w-5 text-primary" />
                </Button>
                <div className="relative flex-1">
                  <Input 
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-muted/50 h-10 pl-4 pr-12 rounded-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendingMessage}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    className="h-8 w-8 absolute right-1 top-1 rounded-full p-0 flex items-center justify-center"
                    variant="default"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-4">
              <div className="rounded-full bg-primary/10 p-6">
                <MessageSquare className="h-12 w-12 text-primary" />
              </div>
              <div>
                <p className="text-xl font-semibold">Your Messages</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
                  Send private messages to contacts using NostrDM with end-to-end encryption
                </p>
              </div>
              <Button 
                variant="default"
                className="mt-2"
                onClick={() => setNewContactDialog(true)}
              >
                Start a Conversation
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* New Contact Dialog - Improved styling */}
      <Dialog open={newContactDialog} onOpenChange={setNewContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a new conversation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Enter a Nostr public key (npub) or hex key to add a new contact
            </p>
            <div className="space-y-4">
              <div className="grid gap-3">
                <Input
                  placeholder="npub1... or hex key"
                  value={newContactPubkey}
                  onChange={(e) => setNewContactPubkey(e.target.value)}
                  className="rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNewContactDialog(false);
                    setNewContactPubkey("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddNewContact}
                  className="bg-primary hover:bg-primary/90"
                >
                  Add Contact
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagingSystem;
