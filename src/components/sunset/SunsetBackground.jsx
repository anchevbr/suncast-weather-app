import React from "react";

/**
 * SunsetBackground component that renders the sunset scene without sun
 * @param {Object} props - Component props
 * @param {string} props.location - Location name (kept for consistency)
 * @returns {JSX.Element} - Sunset background component
 */
const SunsetBackground = ({ location }) => {
  return (
    <div className="absolute inset-0">
      {/* Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] via-[#d4507a] to-[#ff6b6b]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ff8c42] to-[#ffb347] opacity-80"></div>
      </div>
      
      {/* Mountains Foreground - Larger and more dramatic */}
      <div className="absolute bottom-0 left-0 right-0 h-[65%] z-10">
        {/* Back mountain layer - Taller peaks */}
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="none">
          <path d="M0,600 L0,350 L150,100 L300,200 L450,50 L600,180 L750,80 L900,150 L1050,70 L1200,280 L1200,600 Z" 
                fill="#1a2332"/>
        </svg>
        
        {/* Middle mountain layer - More prominent */}
        <svg className="absolute bottom-0 w-full h-[90%]" viewBox="0 0 1200 500" preserveAspectRatio="none">
          <path d="M0,500 L0,320 L120,120 L280,240 L420,100 L580,220 L720,90 L880,200 L1040,130 L1200,300 L1200,500 Z" 
                fill="#0d1419"/>
        </svg>
        
        {/* Front mountain layer with trees - Bigger foreground */}
        <svg className="absolute bottom-0 w-full h-[80%]" viewBox="0 0 1200 400" preserveAspectRatio="none">
          <path d="M0,400 L0,250 L80,180 L200,280 L350,150 L500,260 L650,170 L800,240 L950,190 L1100,270 L1200,300 L1200,400 Z" 
                fill="#050a0d"/>
          {/* Tree silhouettes - Larger and more visible */}
          <circle cx="150" cy="290" r="12" fill="#020507"/>
          <polygon points="150,260 142,290 158,290" fill="#020507"/>
          <circle cx="420" cy="240" r="14" fill="#020507"/>
          <polygon points="420,205 410,240 430,240" fill="#020507"/>
          <circle cx="820" cy="260" r="13" fill="#020507"/>
          <polygon points="820,230 811,260 829,260" fill="#020507"/>
          <circle cx="1050" cy="285" r="11" fill="#020507"/>
          <polygon points="1050,260 1043,285 1057,285" fill="#020507"/>
          <circle cx="600" cy="220" r="15" fill="#020507"/>
          <polygon points="600,185 590,220 610,220" fill="#020507"/>
        </svg>
        
      </div>
    </div>
  );
};

export default SunsetBackground;
