
import React from "react";

const NWCLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 64 64" 
      width="100%" 
      height="100%"
      fill="currentColor"
      {...props}
    >
      <circle cx="32" cy="32" r="30" fill="#8B5CF6" />
      <path d="M20 44V20l8 17.5L36 20v24h6V20c0-2.2-1.2-4.2-3.2-5.2-2-1-4.4-0.7-6.1 0.7L28 20l-4.7-4.5c-1.7-1.4-4.1-1.7-6.1-0.7C15.2 15.8 14 17.8 14 20v24h6z" fill="white" />
    </svg>
  );
};

export default NWCLogo;
