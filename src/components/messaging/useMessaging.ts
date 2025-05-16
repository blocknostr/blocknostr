import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { NostrEvent } from "@/lib/nostr/types";
import { useToast } from "@/hooks/use-toast";
import { Contact, Message } from "./types";
import { decrypt as nip44Decrypt } from '@/lib/nostr/utils/nip/nip44';

const CONTACTS_STORAGE_KEY = 'nostr_contacts';

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

  const handleMessageEvent = useCallback(async (event: NostrEvent) => {
    if (!currentUserPubkey) return;
    try {
      if (event.kind !== 4 && event.kind !== 14) return;
      let otherPubkey: string;
      let content = event.content;
      let decrypted = false;
      let error = '';
      // Determine the other party in the conversation
      if (event.pubkey === currentUserPubkey) {
        // Sent by me, decrypt with recipient pubkey
        const recipientTag = event.tags.find(tag => tag[0] === 'p');
        if (!recipientTag || !recipientTag[1]) return;
        otherPubkey = recipientTag[1];
        if (window.nostr?.nip04) {
          try {
            content = await window.nostr.nip04.decrypt(otherPubkey, event.content);
            decrypted = true;
          } catch (e) {
            error = 'Failed to decrypt message';
          }
        }
        if (!decrypted) {
          content = '[Encrypted message - could not decrypt]';
        }
      } else {
        otherPubkey = event.pubkey || '';
        if (window.nostr?.nip04) {
          try {
            content = await window.nostr.nip04.decrypt(otherPubkey, event.content);
            decrypted = true;
          } catch (e) {
            error = 'Failed to decrypt message';
          }
        }
        if (!decrypted) {
          content = '[Encrypted message - could not decrypt]';
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
          created_at: event.created_at,
          status: (error ? 'failed' : 'sent') as 'sent' | 'failed',
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
      console.error('Error processing message event:', e);
    }
  }, [contacts, activeContact, currentUserPubkey, fetchProfileForContact]);

  // Always show all contacts, even if no messages
  const loadMessagesForContact = useCallback(async (contact: Contact) => {
    if (!currentUserPubkey) return;
    setActiveContact(contact);
    setMessages([]);
    setLoading(true);
    // Subscribe to DMs for this contact, but do not filter out contacts with no messages
    const dmSubId = nostrService.subscribe(
      [
        {
          kinds: [4, 14],
          authors: [contact.pubkey],
          '#p': [currentUserPubkey]
        },
        {
          kinds: [4, 14],
          authors: [currentUserPubkey],
          '#p': [contact.pubkey]
        }
      ],
      handleMessageEvent
    );

    setLoading(false);

    return () => {
      nostrService.unsubscribe(dmSubId);
    };
  }, [currentUserPubkey, handleMessageEvent]);

  const handleSendMessage = useCallback(async () => {
    if (!activeContact || !newMessage.trim() || !currentUserPubkey) return;

    setSendingMessage(true);

    try {
      console.log("Preparing to send message to:", activeContact.pubkey);

      // Use proper messaging adapter for direct messages
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
      const contactPubkeys = new Set<string>();

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

  // Load contacts from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (saved) {
        setContacts(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load contacts from storage:', e);
    }
  }, []);

  // Save contacts to localStorage whenever they change (robust, deduped, sorted)
  useEffect(() => {
    try {
      // Remove duplicates by pubkey
      const deduped = Array.from(
        new Map(contacts.map(c => [c.pubkey, c])).values()
      );
      // Sort by lastMessageTime desc, fallback to name
      deduped.sort((a, b) => {
        if (a.lastMessageTime && b.lastMessageTime) {
          return b.lastMessageTime - a.lastMessageTime;
        }
        const aName = a.profile?.display_name || a.profile?.name || '';
        const bName = b.profile?.display_name || b.profile?.name || '';
        return aName.localeCompare(bName);
      });
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(deduped));
    } catch (e) {
      console.warn('Failed to save contacts to storage:', e);
    }
  }, [contacts]);

  // --- Notification/alert for new messages ---
  // Track unread messages per contact
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  // Track last seen message timestamp per contact
  const [lastSeen, setLastSeen] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentUserPubkey) return;
    // Only run if there are messages
    if (!messages.length) return;
    const lastMessage = messages[messages.length - 1];
    // Only notify if the last message is from someone else
    if (lastMessage.sender !== currentUserPubkey) {
      // Stack browser notifications (do not close previous)
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('New message', {
          body: `From ${lastMessage.sender.slice(0, 12)}...`,
          icon: '/favicon.ico',
          tag: lastMessage.sender // Use sender as tag to group per sender
        });
      } else if (window.Notification && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
      // Show toast alert (stacked)
      toast({
        title: 'New message',
        description: `From ${lastMessage.sender.slice(0, 12)}...`,
        duration: 6000
      });
      // Increment unread count for this contact
      setUnreadCounts(prev => ({
        ...prev,
        [lastMessage.sender]: (prev[lastMessage.sender] || 0) + 1
      }));
    }
  }, [messages, currentUserPubkey, toast]);

  // Mark messages as read when opening a contact
  useEffect(() => {
    if (activeContact) {
      setUnreadCounts(prev => ({ ...prev, [activeContact.pubkey]: 0 }));
      // Optionally, track last seen timestamp
      const lastMsg = messages.filter(m => m.sender === activeContact.pubkey || m.recipient === activeContact.pubkey).pop();
      if (lastMsg) {
        setLastSeen(prev => ({ ...prev, [activeContact.pubkey]: lastMsg.created_at }));
      }
    }
  }, [activeContact, messages]);

  return {
    contacts,
    messages,
    loading,
    activeContact,
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
    currentUserPubkey,
    unreadCounts // <-- add this
  };
};
