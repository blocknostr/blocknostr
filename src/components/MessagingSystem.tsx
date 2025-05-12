
import React from "react";
import { nostrService } from "@/lib/nostr";
import ContactList from "./messaging/ContactList";
import MessageView from "./messaging/MessageView";
import NewContactDialog from "./messaging/NewContactDialog";
import WelcomeView from "./messaging/WelcomeView";
import { useMessaging } from "./messaging/useMessaging";

const MessagingSystem: React.FC = () => {
  const {
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
    currentUserPubkey
  } = useMessaging();

  if (!currentUserPubkey) {
    return <WelcomeView onLogin={() => nostrService.login()} />;
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex h-full">
        {/* Contacts list */}
        <ContactList
          contacts={contacts}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeContact={activeContact}
          loadMessagesForContact={loadMessagesForContact}
          onNewContactClick={() => setNewContactDialog(true)}
        />
            
        {/* Message area */}
        <MessageView
          activeContact={activeContact}
          messages={messages}
          loading={loading}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          sendingMessage={sendingMessage}
          currentUserPubkey={currentUserPubkey}
        />
      </div>

      {/* New Contact Dialog */}
      <NewContactDialog
        open={newContactDialog}
        onOpenChange={setNewContactDialog}
        pubkeyValue={newContactPubkey}
        setPubkeyValue={setNewContactPubkey}
        onAddContact={handleAddNewContact}
      />
    </div>
  );
};

export default MessagingSystem;
