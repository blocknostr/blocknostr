
import React from "react";

const AlbyLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 64 64" 
      width="100%" 
      height="100%"
      fill="currentColor"
      {...props}
    >
      <circle cx="32" cy="32" r="30" fill="#F5CD00" />
      <path d="M32 18c-1.6 0-3 1-3.5 2.5-5.6 1-10 5.9-10 11.8 0 6.6 5.4 12 12 12h3c6.6 0 12-5.4 12-12 0-5.9-4.4-10.8-10-11.8-0.5-1.5-1.9-2.5-3.5-2.5z" fill="black" />
      <circle cx="26" cy="32" r="3" fill="white" />
      <circle cx="38" cy="32" r="3" fill="white" />
      <path d="M20 24c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="black" strokeWidth="2" fill="transparent" />
      <path d="M36 24c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="black" strokeWidth="2" fill="transparent" />
    </svg>
  );
};

export default AlbyLogo;
