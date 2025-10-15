import React from 'react';

interface MastercardIconProps {
  className?: string;
  size?: number | string;
  color?: string;
}

export const MastercardIcon: React.FC<MastercardIconProps> = ({ 
  className = "", 
  size = 24, 
  color 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 576 512"
      width={size}
      height={size}
      className={className}
    >
      <style>
        {`
          .st0{fill:#F8F8F8;}
          .st1{fill:#FF5F00;}
          .st2{fill:#EB001B;}
          .st3{fill:#F79E1B;}
        `}
      </style>
      <g>
        <rect x="0" y="0" className="st0" width="576" height="512" rx="48"/>
        <g transform="translate(21, 67) scale(3.5, 3.5)">
          <rect x="60.4" y="25.7" className="st1" width="31.5" height="56.6"/>
          <path className="st2" d="M62.4,54c0-11,5.1-21.5,13.7-28.3c-15.6-12.3-38.3-9.6-50.6,6.1C13.3,47.4,16,70,31.7,82.3
            c13.1,10.3,31.4,10.3,44.5,0C67.5,75.5,62.4,65,62.4,54z"/>
          <path className="st3" d="M134.4,54c0,19.9-16.1,36-36,36c-8.1,0-15.9-2.7-22.2-7.7c15.6-12.3,18.3-34.9,6-50.6c-1.8-2.2-3.8-4.3-6-6
            c15.6-12.3,38.3-9.6,50.5,6.1C131.7,38.1,134.4,45.9,134.4,54z"/>
        </g>
      </g>
    </svg>
  );
};

export default MastercardIcon;
