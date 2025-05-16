import { useState, useEffect, useCallback, useRef } from "react";
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

  // --- Make refs for handlers to avoid unneeded effect triggers ---
  const contactsRef = useRef(contacts);
  contactsRef.current = contacts;
  const activeContactRef = useRef(activeContact);
  activeContactRef.current = activeContact;

  const fetchProfileForContact = useCallback(async (pubkey: string): Promise<Contact | null> => {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({ pubkey });
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

  // FULLY UPDATED DECRYPTION LOGIC
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
        const recipientTag = event.tags.find(tag => tag[0] === 'p');
        if (!recipientTag || !recipientTag[1]) return;
        otherPubkey = recipientTag[1];
      } else {
        otherPubkey = event.pubkey || '';
      }

      // KIND 14 (group chat / NIP-17): Show not supported message
      if (event.kind === 14) {
        content = '[Group chat (kind 14) messages are not yet supported by this app]';
        decrypted = false;
      }
      // KIND 4 (NIP-04): Try to decrypt
      else if (event.kind === 4) {
        if (!window.nostr?.nip04) {
          error = 'No Nostr extension found or it does not support nip04. You must install/enable one like Alby or nos2x.';
          content = '[Cannot decrypt: Nostr extension not available]';
          console.warn(error, { event, currentUserPubkey, otherPubkey, nostr: window.nostr });
        } else {
          try {
            content = await window.nostr.nip04.decrypt(otherPubkey, event.content);
            decrypted = true;
          } catch (e) {
            // Try NIP-44 fallback
            try {
              content = await nip44Decrypt(otherPubkey, event.content);
              decrypted = true;
            } catch (ee) {
              error = 'Decryption failed: ' + (e?.message || e) + ' / ' + (ee?.message || ee);
              content = '[Encrypted message - could not decrypt]';
              console.error('Decryption failed (NIP-04 then NIP-44):', {
                event, currentUserPubkey, otherPubkey, e, ee, nostr: window.nostr
              });
            }
          }
        }
      }
      if (!decrypted && event.kind === 4) {
        content = '[Encrypted message - could not decrypt]';
      }

      // Add contact if not already in list
      if (!contactsRef.current.some(c => c.pubkey === otherPubkey)) {
        const newContact = await fetchProfileForContact(otherPubkey);
        if (newContact) {
          setContacts(prev => [...prev, newContact]);
        }
      }

      // Update messages if this contact is active
      if (activeContactRef.current && activeContactRef.current.pubkey === otherPubkey) {
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
  }, [currentUserPubkey, fetchProfileForContact]);

  // --- FIXED: Only reload contacts/subscription on user change ---
  useEffect(() => {
    if (!currentUserPubkey) return;

    let unsub: (() => void) | undefined;

    const loadContacts = async () => {
      setLoading(true);

      await nostrService.connectToUserRelays();

      // Subscribe to DMs (ONE TIME per user session)
      const dmSubId = nostrService.subscribe(
        [
          {
            kinds: [4, 14],
            '#p': [currentUserPubkey],
          },
          {
            kinds: [4, 14],
            authors: [currentUserPubkey],
          }
        ],
        handleMessageEvent
      );
      unsub = () => nostrService.unsubscribe(dmSubId);

      // Get the list of contacts
      const contactPubkeys = new Set<string>();
      nostrService.following.forEach(pubkey => contactPubkeys.add(pubkey));

      const lastMessagedUser = localStorage.getItem('lastMessagedUser');
      if (lastMessagedUser) {
        try {
          const pubkey = lastMessagedUser.startsWith('npub1')
            ? nostrService.getHexFromNpub(lastMessagedUser)
            : lastMessagedUser;
          contactPubkeys.add(pubkey);
          localStorage.removeItem('lastMessagedUser');
        } catch (e) {
          console.error("Error processing lastMessagedUser:", e);
        }
      }

      const profilePromises = Array.from(contactPubkeys).map(pubkey =>
        fetchProfileForContact(pubkey)
      );

      try {
        const contactProfiles = await Promise.all(profilePromises);
        const validContacts = contactProfiles.filter(Boolean) as Contact[];
        setContacts(validContacts);

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
    };

    loadContacts();

    return () => {
      if (unsub) unsub();
    };
    // Only run when the pubkey (user) changes!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserPubkey]);

  // Always show all contacts, even if no messages
  const loadMessagesForContact = useCallback(async (contact: Contact) => {
    if (!currentUserPubkey) return;
    setActiveContact(contact);
    setMessages([]);
    setLoading(true);

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
      const messageId = await nostrService.sendDirectMessage(activeContact.pubkey, newMessage);

      if (messageId) {
        const message = {
          id: messageId,
          content: newMessage,
          sender: currentUserPubkey,
          recipient: activeContact.pubkey,
          created_at: Math.floor(Date.now() / 1000)
        };

        setMessages(prev => [...prev, message].sort((a, b) => a.created_at - b.created_at));

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
        toast({
          title: "Failed to send message",
          description: "Please check your connection and try again",
          variant: "destructive"
        });
      }
    } catch (error) {
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

    if (contacts.some(c => c.pubkey === pubkey)) {
      toast({
        title: "Contact already exists",
        description: "This contact is already in your list"
      });
      setNewContactDialog(false);
      setNewContactPubkey("");
      return;
    }

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
      const deduped = Array.from(
        new Map(contacts.map(c => [c.pubkey, c])).values()
      );
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
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastSeen, setLastSeen] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentUserPubkey) return;
    if (!messages.length) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender !== currentUserPubkey) {
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('New message', {
          body: `From ${lastMessage.sender.slice(0, 12)}...`,
          icon: '/favicon.ico',
          tag: lastMessage.sender
        });
      } else if (window.Notification && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
      toast({
        title: 'New message',
        description: `From ${lastMessage.sender.slice(0, 12)}...`,
        duration: 6000
      });
      setUnreadCounts(prev => ({
        ...prev,
        [lastMessage.sender]: (prev[lastMessage.sender] || 0) + 1
      }));
    }
  }, [messages, currentUserPubkey, toast]);

  useEffect(() => {
    if (activeContact) {
      setUnreadCounts(prev => ({ ...prev, [activeContact.pubkey]: 0 }));
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
    unreadCounts
  };
};