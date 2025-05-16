import React, { useState } from "react";
import { nostrService } from "@/lib/nostr";
import ContactList from "./messaging/ContactList";
import MessageView from "./messaging/MessageView";
import NewContactDialog from "./messaging/NewContactDialog";
import WelcomeView from "./messaging/WelcomeView";
import { useMessaging } from "./messaging/useMessaging";
import { Button } from "./ui/button";
import { Wallet } from "lucide-react";
import LoginDialog from "./auth/LoginDialog";

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
    currentUserPubkey,
    unreadCounts
  } = useMessaging();

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  if (!currentUserPubkey) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <WelcomeView />
        <Button
          onClick={() => setLoginDialogOpen(true)}
          className="mt-4 gap-2 bg-gradient-to-r from-primary/90 to-primary/80 hover:from-primary/80 hover:to-primary/70"
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
        <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
      </div>
    );
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
          unreadCounts={unreadCounts}
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
