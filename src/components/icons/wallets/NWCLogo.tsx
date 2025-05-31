import React from "react";

const NWCLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <img 
      src="/img/Nostr Wallet ID.png"
      alt="Nostr Wallet ID"
      width="100%" 
      height="100%"
      style={{ objectFit: 'contain' }}
      {...props}
    />
  );
};

export default NWCLogo;

