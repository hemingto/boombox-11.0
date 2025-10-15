interface OpenStorageUnitIconProps {
  className?: string;
}

export const OpenStorageUnitIcon: React.FC<OpenStorageUnitIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 157.84 123.8"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Desktop_Storage_Calculator_Page" stroke="#09090b" strokeLinecap="round" strokeLinejoin="round">
        <path
          className="fill-[#f1f5f9] stroke-[6px]"
          d="M64.9,116.15V6.78h91.44v109.72s-92.14-1.06-91.44-.35Z"
        />
        <path
          className="fill-none stroke-[2px]"
          d="M134.45,29.99h-47.83v59.08h47.83s.35-59.08,0-59.08Z"
        />
        <line className="fill-none" x1="86.62" y1="29.99" x2="65.27" y2="7.25" />
        <line className="fill-none" x1="134.45" y1="29.99" x2="156.03" y2="7.13" />
        <line className="fill-none" x1="86.62" y1="89.07" x2="64.9" y2="116.15" />
        <line className="fill-none" x1="134.45" y1="89.07" x2="156.34" y2="116.5" />
        <rect
          className="fill-[#f1f5f9] stroke-[4px]"
          x="64.86"
          y="117.44"
          width="91.45"
          height="4.86"
        />
        <path
          className="fill-[#f1f5f9] stroke-[6px]"
          d="M4.02,1.5l60.49,7.56v105.15l-60.66,7.21S4.9.63,4.02,1.5Z"
        />
        <polyline
          className="fill-none stroke-[3px]"
          points="4.02 1.5 1.5 1.86 1.5 121.43 3.84 121.43"
        />
      </g>
    </svg>
  );
};

export default OpenStorageUnitIcon;