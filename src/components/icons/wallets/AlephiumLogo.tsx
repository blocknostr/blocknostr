import React from "react";

const AlephiumLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <img 
      src="/img/alephium.png"
      alt="Alephium"
      width="100%" 
      height="100%"
      style={{ objectFit: 'contain' }}
      {...props}
    />
  );
};

export default AlephiumLogo;

