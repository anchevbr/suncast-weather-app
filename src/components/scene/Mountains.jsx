import React, { memo } from "react";

/**
 * Mountains Component
 * Renders three layers of mountain silhouettes with parallax effect
 * Static component that doesn't need to re-render
 */
const Mountains = memo(() => {
  return (
    <div className="fixed bottom-0 left-0 pointer-events-none z-30" style={{ width: '200vw', height: 'clamp(14rem, 35vh, 36rem)', transform: 'translateY(0px)' }}>
      {/* Back mountain layer - solid */}
      <div 
        className="absolute bottom-0 left-0 h-full"
        style={{
          width: '200vw',
          background: '#1a2332',
          clipPath: 'polygon(0 100%, 0 70%, 5% 80%, 10% 60%, 17.5% 85%, 25% 70%, 32.5% 90%, 40% 75%, 45% 90%, 50% 70%, 55% 85%, 60% 65%, 70% 85%, 75% 75%, 82% 88%, 90% 78%, 95% 85%, 100% 72%, 100% 100%)'
        }}
      ></div>
      
      {/* Middle mountain layer - solid */}
      <div 
        className="absolute bottom-0 left-0 h-full"
        style={{
          width: '200vw',
          background: '#0d1419',
          clipPath: 'polygon(0 100%, 0 85%, 7.5% 95%, 15% 75%, 22.5% 90%, 30% 80%, 37.5% 95%, 45% 80%, 50% 85%, 57% 78%, 65% 92%, 72% 82%, 80% 88%, 87% 80%, 95% 90%, 100% 85%, 100% 100%)'
        }}
      ></div>
      
      {/* Front mountain layer - solid */}
      <div 
        className="absolute bottom-0 left-0 h-full"
        style={{
          width: '200vw',
          background: '#050a0d',
          clipPath: 'polygon(0 100%, 0 90%, 6% 98%, 12.5% 88%, 20% 95%, 27.5% 85%, 35% 92%, 42.5% 87%, 50% 90%, 57% 86%, 65% 94%, 72% 88%, 80% 93%, 87% 89%, 95% 92%, 100% 90%, 100% 100%)'
        }}
      ></div>
    </div>
  );
});

Mountains.displayName = 'Mountains';

export default Mountains;

