
import Sidebar from "@/components/Sidebar";
import MessagingSystem from "@/components/MessagingSystem";

const MessagesPage = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            <h1 className="font-semibold">Messages</h1>
          </div>
        </header>
        
        <div className="flex-1">
          <MessagingSystem />
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
