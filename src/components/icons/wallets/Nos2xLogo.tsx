import React from "react";

const Nos2xLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <img 
      src="/img/nos2x.png"
      alt="nos2x"
      width="100%" 
      height="100%"
      style={{ objectFit: 'contain' }}
      {...props}
    />
  );
};

export default Nos2xLogo;

