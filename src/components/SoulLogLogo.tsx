import { cn } from '@/lib/utils';

interface SoulLogLogoProps {
  className?: string;
  size?: number;
}

export function SoulLogLogo({ className, size = 32 }: SoulLogLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('', className)}
    >
      {/* Outer soul circle */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      
      {/* Inner soul essence */}
      <circle
        cx="50"
        cy="50"
        r="35"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      
      {/* Center journal book */}
      <rect
        x="35"
        y="30"
        width="30"
        height="40"
        rx="2"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      
      {/* Book spine line */}
      <line
        x1="42"
        y1="30"
        x2="42"
        y2="70"
        stroke="currentColor"
        strokeWidth="2"
      />
      
      {/* Bookmark */}
      <path
        d="M 50 30 L 50 45 L 54 42 L 58 45 L 58 30"
        fill="currentColor"
        opacity="0.8"
      />
      
      {/* Writing lines */}
      <line
        x1="46"
        y1="42"
        x2="60"
        y2="42"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      <line
        x1="46"
        y1="48"
        x2="58"
        y2="48"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      <line
        x1="46"
        y1="54"
        x2="60"
        y2="54"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      <line
        x1="46"
        y1="60"
        x2="55"
        y2="60"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      
      {/* Mystical sparkles */}
      <circle cx="25" cy="25" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="75" cy="25" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="20" cy="75" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="78" cy="72" r="2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
