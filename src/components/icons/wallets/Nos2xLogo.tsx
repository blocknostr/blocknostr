
import React from "react";

const Nos2xLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 64 64" 
      width="100%" 
      height="100%"
      fill="currentColor"
      {...props}
    >
      <circle cx="32" cy="32" r="30" fill="#3B82F6" />
      <path d="M20 20v24h4V25l8 15.5L40 25v19h4V20h-6l-6 12-6-12h-6z" fill="white" />
    </svg>
  );
};

export default Nos2xLogo;
