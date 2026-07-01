import React from 'react';

interface ChaletLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
}

export default function ChaletLogo({
  className = '',
  size = 64,
  showText = true,
  textColor = 'text-[#F5F2EB]',
  subtextColor = 'text-amber-400/80'
}: ChaletLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} id="chalet-logo-container">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        id="chalet-logo-svg"
      >
        {/* Background circle / crest */}
        <circle cx="100" cy="100" r="90" fill="#0A2413" stroke="#D4AF37" strokeWidth="2" />
        
        {/* Mountain Silhouette in the background */}
        {/* Left Mountain (Green-shaded with Gold highlights) */}
        <path
          d="M30 140 L85 60 L140 140 Z"
          fill="#134725"
          opacity="0.8"
        />
        {/* Right Mountain (Slightly smaller, behind) */}
        <path
          d="M90 140 L135 75 L180 140 Z"
          fill="#0B2E17"
          opacity="0.9"
        />
        
        {/* Snow Peaks on Mountains in Gold/Beige */}
        <path
          d="M85 60 L73 78 L80 82 L85 75 L90 82 L97 78 Z"
          fill="#EED082"
        />
        <path
          d="M135 75 L126 88 L131 91 L135 86 L139 91 L144 88 Z"
          fill="#EED082"
        />

        {/* Pine Trees on the sides */}
        {/* Left Pines */}
        <path d="M45 140 L52 120 L59 140 Z" fill="#0F3D1F" />
        <path d="M48 123 L52 110 L56 123 Z" fill="#D4AF37" opacity="0.7" />
        {/* Right Pines */}
        <path d="M145 140 L152 118 L159 140 Z" fill="#0F3D1F" />
        <path d="M149 121 L152 108 L155 121 Z" fill="#D4AF37" opacity="0.7" />

        {/* The Swiss Chalet - Elegant Timber and Stone Architecture */}
        {/* Chalet Foundation / Stone Base */}
        <rect x="75" y="125" width="50" height="20" rx="1" fill="#4A3728" stroke="#D4AF37" strokeWidth="1" />
        
        {/* Swiss Chalet Roof (A-Frame, elegant overhang) */}
        <path
          d="M62 125 L100 80 L138 125 Z"
          fill="#2C1A10"
        />
        {/* Inner wooden facade */}
        <path
          d="M72 125 L100 90 L128 125 Z"
          fill="#61412A"
        />
        
        {/* Roof Overhang / Gold trim */}
        <path
          d="M60 126 L100 80 L140 126"
          stroke="#D4AF37"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Gold Star / Emblem above the chalet */}
        <polygon
          points="100,32 103,40 111,40 105,45 107,53 100,48 93,53 95,45 89,40 97,40"
          fill="#D4AF37"
        />

        {/* Window - Warm glowing light inside */}
        <rect x="91" y="103" width="18" height="12" rx="1" fill="#FFD700" stroke="#2C1A10" strokeWidth="1" />
        <line x1="100" y1="103" x2="100" y2="115" stroke="#2C1A10" strokeWidth="1" />
        <line x1="91" y1="109" x2="109" y2="109" stroke="#2C1A10" strokeWidth="1" />

        {/* Door */}
        <rect x="94" y="130" width="12" height="15" rx="1" fill="#2C1A10" />
        <circle cx="97" cy="138" r="1.2" fill="#D4AF37" />

        {/* Chimney */}
        <rect x="115" y="90" width="7" height="16" fill="#4A3728" />
        <path d="M113 90 L124 90" stroke="#D4AF37" strokeWidth="1.5" />
        
        {/* Ground path */}
        <path d="M25 140 C60 135, 140 135, 175 140" stroke="#D4AF37" strokeWidth="2.5" />
      </svg>
      {showText && (
        <div className="flex flex-col select-none" id="chalet-text">
          <span className={`font-sans text-xl font-bold tracking-wider ${textColor}`}>
            JD LOTEAMENTOS
          </span>
          <span className={`font-mono text-[10px] tracking-widest uppercase ${subtextColor}`}>
            Lotes & Chalés Premium
          </span>
        </div>
      )}
    </div>
  );
}
