
import React from "react";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import CompactWalletButton from "./CompactWalletButton";
import FullWalletConnect from "./FullWalletConnect";

interface WalletConnectButtonProps {
  className?: string;
  showDropdown?: boolean;
}

const WalletConnectButton = ({ className, showDropdown = true }: WalletConnectButtonProps) => {
  const {
    hasNostrExtension,
    isConnecting,
    isConnected,
    handleConnect,
    handleLogout
  } = useWalletConnect();

  // Compact header version (icon only)
  if (className?.includes('sm:block')) {
    return (
      <CompactWalletButton
        isConnected={isConnected}
        onConnect={handleConnect}
        onLogout={handleLogout}
        className={className}
      />
    );
  }

  // Full featured component for wallet pages
  return (
    <FullWalletConnect
      isConnected={isConnected}
      isConnecting={isConnecting}
      hasNostrExtension={hasNostrExtension}
      onConnect={handleConnect}
      onLogout={handleLogout}
      className={className}
    />
  );
};

export default WalletConnectButton;
