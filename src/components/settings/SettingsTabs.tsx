
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountTab from "./AccountTab";
import RelaysTab from "./RelaysTab";
import PrivacyTab from "./PrivacyTab";
import NotificationsTab from "./NotificationsTab";
import AboutTab from "./AboutTab";
import { User, Network, Lock, Bell, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const SettingsTabs = () => {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <Tabs defaultValue="account" onValueChange={setActiveTab} value={activeTab}>
      <TabsList className="mb-6 w-full sm:w-auto flex flex-wrap transition-all duration-200">
        <TabsTrigger 
          value="account" 
          className={cn(
            "flex items-center gap-2 transition-all",
            activeTab === "account" ? "font-medium" : ""
          )}
        >
          <User className="h-4 w-4" />
          <span>Account</span>
        </TabsTrigger>
        <TabsTrigger 
          value="relays" 
          className={cn(
            "flex items-center gap-2 transition-all",
            activeTab === "relays" ? "font-medium" : ""
          )}
        >
          <Network className="h-4 w-4" />
          <span>Relays</span>
        </TabsTrigger>
        <TabsTrigger 
          value="privacy" 
          className={cn(
            "flex items-center gap-2 transition-all",
            activeTab === "privacy" ? "font-medium" : ""
          )}
        >
          <Lock className="h-4 w-4" />
          <span>Privacy</span>
        </TabsTrigger>
        <TabsTrigger 
          value="notifications" 
          className={cn(
            "flex items-center gap-2 transition-all",
            activeTab === "notifications" ? "font-medium" : ""
          )}
        >
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </TabsTrigger>
        <TabsTrigger 
          value="about" 
          className={cn(
            "flex items-center gap-2 transition-all",
            activeTab === "about" ? "font-medium" : ""
          )}
        >
          <Info className="h-4 w-4" />
          <span>About</span>
        </TabsTrigger>
      </TabsList>
      
      <div className="animate-fade-in">
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
      </div>
    </Tabs>
  );
};

export default SettingsTabs;
