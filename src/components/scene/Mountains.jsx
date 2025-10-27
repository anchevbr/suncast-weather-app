import { memo } from "react";
import PropTypes from 'prop-types';

/**
 * Mountains Component
 * Renders three layers of mountain silhouettes with parallax scrolling effect
 * Mountains scroll horizontally as user navigates between screens
 */
const Mountains = memo(({ scrollProgress }) => {
  // Calculate horizontal translation for parallax effect
  // Each layer moves at different speeds for depth
  const backMountainOffset = scrollProgress * -30;  // Slowest (furthest back)
  const midMountainOffset = scrollProgress * -50;   // Medium speed
  const frontMountainOffset = scrollProgress * -70; // Fastest (closest)
  
  // Sunset glow opacity: fade in as we scroll to sunset screen (scrollProgress 0.5 -> 1.0)
  // Only visible when viewing the sunset forecast
  const glowOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.5) * 2));
  
  return (
    <div className="fixed bottom-0 left-0 pointer-events-none z-30 overflow-hidden" style={{ width: '100vw', height: 'clamp(14rem, 35vh, 36rem)' }}>
      {/* Back mountain layer - slowest parallax */}
      <div className="absolute bottom-0 h-full">
        {/* Sunset glow behind back mountains */}
        <div
          className="absolute bottom-0 h-full"
          style={{
            width: '200vw',
            background: 'linear-gradient(to top, rgba(255, 140, 60, 0.15) 0%, rgba(255, 180, 100, 0.08) 40%, transparent 70%)',
            transform: `translateX(${backMountainOffset}vw)`,
            transition: 'none',
            willChange: 'transform',
            filter: 'blur(20px)',
            opacity: glowOpacity
          }}
        ></div>
        {/* Mountain silhouette */}
        <div 
          className="absolute bottom-0 h-full"
          style={{
            width: '200vw',
            background: '#1a2332',
            clipPath: 'polygon(0 100%, 0 70%, 5% 80%, 10% 60%, 17.5% 85%, 25% 70%, 32.5% 90%, 40% 75%, 45% 90%, 50% 70%, 55% 85%, 60% 65%, 70% 85%, 75% 75%, 82% 88%, 90% 78%, 95% 85%, 100% 72%, 100% 100%)',
            transform: `translateX(${backMountainOffset}vw)`,
            transition: 'none',
            willChange: 'transform'
          }}
        ></div>
      </div>
      
      {/* Middle mountain layer - medium parallax */}
      <div className="absolute bottom-0 h-full">
        {/* Sunset glow behind middle mountains */}
        <div
          className="absolute bottom-0 h-full"
          style={{
            width: '200vw',
            background: 'linear-gradient(to top, rgba(255, 120, 50, 0.12) 0%, rgba(255, 160, 90, 0.06) 35%, transparent 65%)',
            transform: `translateX(${midMountainOffset}vw)`,
            transition: 'none',
            willChange: 'transform',
            filter: 'blur(16px)',
            opacity: glowOpacity
          }}
        ></div>
        {/* Mountain silhouette */}
        <div 
          className="absolute bottom-0 h-full"
          style={{
            width: '200vw',
            background: '#0d1419',
            clipPath: 'polygon(0 100%, 0 85%, 7.5% 95%, 15% 75%, 22.5% 90%, 30% 80%, 37.5% 95%, 45% 80%, 50% 85%, 57% 78%, 65% 92%, 72% 82%, 80% 88%, 87% 80%, 95% 90%, 100% 85%, 100% 100%)',
            transform: `translateX(${midMountainOffset}vw)`,
            transition: 'none',
            willChange: 'transform'
          }}
        ></div>
      </div>
      
      {/* Front mountain layer - fastest parallax */}
      <div className="absolute bottom-0 h-full">
        {/* Sunset glow behind front mountains */}
        <div
          className="absolute bottom-0 h-full"
          style={{
            width: '200vw',
            background: 'linear-gradient(to top, rgba(255, 100, 40, 0.08) 0%, rgba(255, 140, 80, 0.04) 30%, transparent 60%)',
            transform: `translateX(${frontMountainOffset}vw)`,
            transition: 'none',
            willChange: 'transform',
            filter: 'blur(12px)',
            opacity: glowOpacity
          }}
        ></div>
        {/* Mountain silhouette */}
        <div 
          className="absolute bottom-0 h-full"
          style={{
            width: '200vw',
            background: '#050a0d',
            clipPath: 'polygon(0 100%, 0 90%, 6% 98%, 12.5% 88%, 20% 95%, 27.5% 85%, 35% 92%, 42.5% 87%, 50% 90%, 57% 86%, 65% 94%, 72% 88%, 80% 93%, 87% 89%, 95% 92%, 100% 90%, 100% 100%)',
            transform: `translateX(${frontMountainOffset}vw)`,
            transition: 'none',
            willChange: 'transform'
          }}
        ></div>
      </div>
    </div>
  );
});

Mountains.displayName = 'Mountains';

Mountains.propTypes = {
  scrollProgress: PropTypes.number.isRequired
};

export default Mountains;

