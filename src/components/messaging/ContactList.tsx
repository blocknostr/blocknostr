import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Contact } from "./types";
import { nostrService } from "@/lib/nostr";

interface ContactListProps {
  contacts: Contact[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeContact: Contact | null;
  loadMessagesForContact: (contact: Contact) => void;
  onNewContactClick: () => void;
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  loading,
  searchTerm,
  setSearchTerm,
  activeContact,
  loadMessagesForContact,
  onNewContactClick
}) => {
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

  return (
    <div className="w-1/3 border-r overflow-hidden flex flex-col bg-background shadow-sm">
      {/* Contacts header and search */}
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-semibold text-base">Chats</h3>
        <Button 
          size="sm" 
          variant="ghost"
          className="h-8 w-8 p-0 rounded-full hover:bg-accent"
          onClick={onNewContactClick}
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
  );
};

export default ContactList;
