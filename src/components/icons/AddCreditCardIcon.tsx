interface AddCreditCardIconProps {
    className?: string;
  }
  
  export const AddCreditCardIcon: React.FC<AddCreditCardIconProps> = ({ className }) => {
    return (
      <svg
        viewBox="0 0 24.13 19.45"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <g>
          <rect
            className="stroke-current fill-none stroke-[1.5px]"
            x="13.29"
            y="8.61"
            width="10.09"
            height="10.09"
            rx="5.05"
            ry="5.05"
          />
          {/* Replaced text with centered cross lines */}
          <line
            className="stroke-current fill-none stroke-[1px]"
            x1="16.34"
            y1="13.655"
            x2="20.34"
            y2="13.655"
            />
            <line
            className="stroke-current fill-none stroke-[1px]"
            x1="18.34"
            y1="11.655"
            x2="18.34"
            y2="15.655"
            />
          <line
            className="stroke-current fill-none stroke-[1.5px] stroke-round"
            x1=".75"
            y1="4.5"
            x2="20.25"
            y2="4.5"
          />
          <line
            className="stroke-current fill-none stroke-[1.5px] stroke-round"
            x1=".75"
            y1="5.25"
            x2="20.25"
            y2="5.25"
          />
          <line
            className="stroke-current fill-none stroke-[1.5px] stroke-round"
            x1="3.75"
            y1="10.5"
            x2="9.75"
            y2="10.5"
          />
          <line
            className="stroke-current fill-none stroke-[1.5px] stroke-round"
            x1="3.75"
            y1="12.75"
            x2="6.75"
            y2="12.75"
          />
          <path
            className="stroke-current fill-none stroke-[1.5px] stroke-round"
            d="M20.25,8.99V3c0-1.24-1.01-2.25-2.25-2.25H3C1.76.75.75,1.76.75,3v10.5c0,1.24,1.01,2.25,2.25,2.25h10.76c.8,1.74,2.54,2.95,4.58,2.95,2.79,0,5.05-2.26,5.05-5.05,0-2.11-1.29-3.91-3.13-4.66Z"
          />
        </g>
      </svg>
    );
  };