
import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { NostrEvent } from "@/lib/nostr/types";
import { useToast } from "@/hooks/use-toast";
import { Contact, Message } from "./types";

export const useMessaging = () => {
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
  const { toast } = useToast();
  
  const handleMessageEvent = useCallback(async (event: NostrEvent) => {
    if (!currentUserPubkey) return;
    
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
        const message: Message = {
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
  }, [contacts, activeContact, currentUserPubkey]);

  const fetchProfileForContact = useCallback(async (pubkey: string): Promise<Contact | null> => {
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
  }, []);

  const loadMessagesForContact = useCallback(async (contact: Contact) => {
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
          
          const message: Message = {
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
  }, [currentUserPubkey]);

  const handleSendMessage = useCallback(async () => {
    if (!activeContact || !newMessage.trim() || !currentUserPubkey) return;
    
    setSendingMessage(true);
    
    try {
      console.log("Preparing to send message to:", activeContact.pubkey);
      
      // Use proper messaging adapter for direct messages
      const messageId = await nostrService.sendDirectMessage(activeContact.pubkey, newMessage);
      
      if (messageId) {
        console.log("Message sent successfully with ID:", messageId);
        
        // Add message to the UI immediately - Fix the type issue here
        const message: Message = {
          id: typeof messageId === 'string' ? messageId : `msg-${Date.now()}`,  // Ensure id is always a string
          content: newMessage,
          sender: currentUserPubkey,
          recipient: activeContact.pubkey,
          created_at: Math.floor(Date.now() / 1000)
        };
        
        setMessages(prev => {
          const newMessages = [...prev, message].sort((a, b) => a.created_at - b.created_at);
          return newMessages;
        });
        
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
  }, [activeContact, newMessage, currentUserPubkey, toast]);

  const handleAddNewContact = useCallback(async () => {
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
        description: `${newContact.profile?.display_name || newContact.profile?.name || 'Contact'} has been added to your contacts`
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
  }, [newContactPubkey, contacts, fetchProfileForContact, loadMessagesForContact, toast]);

  // Initial load contacts and setup message subscription
  useEffect(() => {
    if (!currentUserPubkey) return;
    
    const loadContacts = async () => {
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
      
      // Get the list of contacts
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
  }, [currentUserPubkey, handleMessageEvent, fetchProfileForContact, loadMessagesForContact]);

  return {
    contacts,
    messages,
    loading,
    activeContact,
    setActiveContact,
    newMessage,
    setNewMessage,
    sendingMessage,
    searchTerm,
    setSearchTerm,
    newContactDialog,
    setNewContactDialog,
    newContactPubkey,
    setNewContactPubkey,
    handleSendMessage,
    loadMessagesForContact,
    handleAddNewContact,
    currentUserPubkey
  };
};
