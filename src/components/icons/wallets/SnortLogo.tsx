
import React from "react";

const SnortLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
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
      <path d="M24 20c-2.2 0-4 1.8-4 4v4c0 1.1 0.9 2 2 2h8v2H20v4h10c2.2 0 4-1.8 4-4v-4c0-1.1-0.9-2-2-2h-8v-2h10v-4H24z" fill="white" />
      <path d="M36 20v24h8c2.2 0 4-1.8 4-4V24c0-2.2-1.8-4-4-4h-8zm4 4h2c1.1 0 2 0.9 2 2v12c0 1.1-0.9 2-2 2h-2V24z" fill="white" />
    </svg>
  );
};

export default SnortLogo;

