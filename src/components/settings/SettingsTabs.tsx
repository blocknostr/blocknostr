import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RelaysTab from "./RelaysTab";
import PrivacyTab from "./PrivacyTab";
import AboutTab from "./AboutTab";
import { Network, Lock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const SettingsTabs = () => {
  const [activeTab, setActiveTab] = useState("relays");

  return (
    <Tabs defaultValue="relays" onValueChange={setActiveTab} value={activeTab}>
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <TabsList className="w-full md:w-auto flex flex-nowrap transition-all duration-200">
          <TabsTrigger 
            value="relays" 
            className={cn(
              "flex items-center gap-2 transition-all whitespace-nowrap",
              activeTab === "relays" ? "font-medium" : ""
            )}
          >
            <Network className="h-4 w-4" />
            <span>Relays</span>
          </TabsTrigger>
          <TabsTrigger 
            value="privacy" 
            className={cn(
              "flex items-center gap-2 transition-all whitespace-nowrap",
              activeTab === "privacy" ? "font-medium" : ""
            )}
          >
            <Lock className="h-4 w-4" />
            <span>Privacy</span>
          </TabsTrigger>
          <TabsTrigger 
            value="about" 
            className={cn(
              "flex items-center gap-2 transition-all whitespace-nowrap",
              activeTab === "about" ? "font-medium" : ""
            )}
          >
            <Info className="h-4 w-4" />
            <span>About</span>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <div className="animate-fade-in">
        <TabsContent value="relays">
          <RelaysTab />
        </TabsContent>
        
        <TabsContent value="privacy">
          <PrivacyTab />
        </TabsContent>
        
        <TabsContent value="about">
          <AboutTab />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default SettingsTabs;

