import React from "react";

const AlbyLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <img 
      src="/img/alby.png"
      alt="Alby"
      width="100%" 
      height="100%"
      style={{ objectFit: 'contain' }}
      {...props}
    />
  );
};

export default AlbyLogo;

