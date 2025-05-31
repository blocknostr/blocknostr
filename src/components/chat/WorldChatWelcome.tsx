import React from 'react';

interface WorldChatWelcomeProps {
  currentChannelName: string;
  isLoggedIn: boolean;
  onSendTestMessage?: () => void;
}

const WorldChatWelcome: React.FC<WorldChatWelcomeProps> = ({
  currentChannelName,
  isLoggedIn,
  onSendTestMessage
}) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Full-screen animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-emerald-500/10 animate-pulse" />
      
      {/* Floating animated elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '6s' }} />
      <div className="absolute top-20 right-16 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '8s' }} />
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full animate-bounce" style={{ animationDelay: '4s', animationDuration: '7s' }} />
      <div className="absolute bottom-16 right-10 w-18 h-18 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '9s' }} />
      <div className="absolute top-1/3 left-1/4 w-12 h-12 bg-gradient-to-br from-pink-500/20 to-transparent rounded-full animate-bounce" style={{ animationDelay: '3s', animationDuration: '5s' }} />
      <div className="absolute bottom-1/3 right-1/4 w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full animate-bounce" style={{ animationDelay: '5s', animationDuration: '6s' }} />
      
      {/* Pulsing ring animations */}
      <div className="absolute top-1/4 right-1/3 w-32 h-32 border-2 border-violet-500/10 rounded-full animate-ping" style={{ animationDelay: '0s', animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-40 h-40 border-2 border-blue-500/10 rounded-full animate-ping" style={{ animationDelay: '2s', animationDuration: '5s' }} />
      <div className="absolute top-1/2 right-1/5 w-28 h-28 border-2 border-emerald-500/10 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '6s' }} />
      
      {/* Main content */}
      <div className="relative z-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 bg-clip-text text-transparent animate-pulse">
          Welcome to World Chat
        </h1>
      </div>
      
      {/* Additional floating decorative elements */}
      <div className="absolute top-12 left-1/2 w-6 h-6 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-full animate-ping" style={{ animationDelay: '4s', animationDuration: '3s' }} />
      <div className="absolute bottom-12 right-1/2 w-8 h-8 bg-gradient-to-br from-pink-400/30 to-rose-400/30 rounded-full animate-ping" style={{ animationDelay: '6s', animationDuration: '4s' }} />
      <div className="absolute top-3/4 left-12 w-5 h-5 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full animate-ping" style={{ animationDelay: '2.5s', animationDuration: '5s' }} />
      <div className="absolute top-1/6 right-12 w-7 h-7 bg-gradient-to-br from-teal-400/30 to-cyan-400/30 rounded-full animate-ping" style={{ animationDelay: '3.5s', animationDuration: '4.5s' }} />
    </div>
  );
};

export default WorldChatWelcome; 
