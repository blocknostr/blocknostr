
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountTab from "./AccountTab";
import RelaysTab from "./RelaysTab";
import PrivacyTab from "./PrivacyTab";
import NotificationsTab from "./NotificationsTab";
import AboutTab from "./AboutTab";

const SettingsTabs = () => {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <Tabs defaultValue="account" onValueChange={setActiveTab} value={activeTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="relays">Relays</TabsTrigger>
        <TabsTrigger value="privacy">Privacy</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
      </TabsList>
      
      <TabsContent value="account">
        <AccountTab />
      </TabsContent>
      
      <TabsContent value="relays">
        <RelaysTab />
      </TabsContent>
      
      <TabsContent value="privacy">
        <PrivacyTab />
      </TabsContent>
      
      <TabsContent value="notifications">
        <NotificationsTab />
      </TabsContent>
      
      <TabsContent value="about">
        <AboutTab />
      </TabsContent>
    </Tabs>
  );
};

export default SettingsTabs;
