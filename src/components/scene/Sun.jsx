import React, { memo, useMemo } from "react";
import { interpolateRGB, rgbToString } from "../../utils/colorUtils";

/**
 * Sun Component
 * Renders an animated sun that sets behind mountains as you scroll
 * Includes smooth color transition from warm white to red and blur reduction
 * Optimized with useMemo for expensive calculations
 */
const Sun = memo(({ scrollProgress }) => {
  // Memoize sun color and gradient calculations
  // OPTIMIZED: Round scrollProgress to reduce recalculations
  const roundedProgress = useMemo(() => Math.round(scrollProgress * 100) / 100, [scrollProgress]);
  
  const sunStyles = useMemo(() => {
    // Define day and sunset colors
    const dayColor = { r: 255, g: 250, b: 240 };
    const sunsetColor = { r: 255, g: 0, b: 0 };
    
    // Calculate interpolation factor based on progress
    const colorProgress = roundedProgress < 0.2 ? 0 : (roundedProgress - 0.2) / 0.8;
    const { r: red, g: green, b: blue } = interpolateRGB(dayColor, sunsetColor, colorProgress);
    
    // Much less feathering for more defined sun shape
    // Calculate feather factor: 0.2 at start (much less feather), 0.0 at 80%+ (sharp)
    const featherFactor = roundedProgress < 0.8 ? 0.2 - (roundedProgress / 0.8) * 0.2 : 0;
    
    // Interpolate gradient stops based on featherFactor (much less feathering)
    // When featherFactor = 0.2: minimal feather, more defined
    // When featherFactor = 0: sharp (fewer stops, higher opacity)
    const a10 = 1 - (0.005 * featherFactor);  // 0.999 -> 1.0
    const a20 = 1 - (0.01 * featherFactor);   // 0.998 -> 1.0
    const a30 = 1 - (0.025 * featherFactor);  // 0.995 -> 1.0
    const a40 = 1 - (0.05 * featherFactor);    // 0.99 -> 1.0
    const a50 = 0.98 - (0.05 * featherFactor); // 0.97 -> 0.98
    const a60 = 0.95 - (0.10 * featherFactor); // 0.93 -> 0.95
    const a70 = 0.9 - (0.15 * featherFactor);  // 0.87 -> 0.9
    const a80 = 0.8 - (0.15 * featherFactor);  // 0.77 -> 0.8
    const a90 = 0.6 - (0.10 * featherFactor);  // 0.58 -> 0.6
    const a95 = 0.4 - (0.05 * featherFactor);  // 0.39 -> 0.4
    const a98 = 0.2 - (0.02 * featherFactor);  // 0.196 -> 0.2
    
    const gradient = `radial-gradient(circle, rgba(${red}, ${green}, ${blue}, 1) 0%, rgba(${red}, ${green}, ${blue}, ${a10}) 10%, rgba(${red}, ${green}, ${blue}, ${a20}) 20%, rgba(${red}, ${green}, ${blue}, ${a30}) 30%, rgba(${red}, ${green}, ${blue}, ${a40}) 40%, rgba(${red}, ${green}, ${blue}, ${a50}) 50%, rgba(${red}, ${green}, ${blue}, ${a60}) 60%, rgba(${red}, ${green}, ${blue}, ${a70}) 70%, rgba(${red}, ${green}, ${blue}, ${a80}) 80%, rgba(${red}, ${green}, ${blue}, ${a90}) 90%, rgba(${red}, ${green}, ${blue}, ${a95}) 95%, rgba(${red}, ${green}, ${blue}, ${a98}) 98%, transparent 100%)`;
    
    // Reduced blur: 4px at 0%, gradually to 0px at 80%, completely sharp at 100%
    // Using quadratic easing for more natural transition (faster at start, slower at end)
    // After 80% (4 seconds), transition to 0 blur for sharp sunset
    const blur = roundedProgress < 0.8 ? 4 * Math.pow(1 - (roundedProgress / 0.8), 2) : 0;
    
    return { gradient, blur };
  }, [roundedProgress]);

  return (
    <div
      className="fixed pointer-events-none z-5"
      style={{
        left: '10%',
        top: `${20 + scrollProgress * 65}vh`,
        opacity: 1 - scrollProgress * 0.4,
        transition: 'none', // No CSS transitions - driven by scroll
        willChange: 'top, opacity',
        transform: 'translateZ(0)' // GPU acceleration
      }}
    >
      <div className="relative" style={{ width: 'clamp(80px, 12vw, 140px)', height: 'clamp(80px, 12vw, 140px)' }}>
        {/* Reduced overexposed halo - smaller and less blurred */}
        <div 
          className="absolute rounded-full"
          style={{
            width: 'clamp(150px, 20vw, 300px)',
            height: 'clamp(150px, 20vw, 300px)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.2) 40%, rgba(255, 255, 255, 0.15) 60%, rgba(255, 255, 255, 0.1) 80%, rgba(255, 255, 255, 0.05) 90%, transparent 100%)',
            filter: 'blur(30px)',
            zIndex: 1
          }}
        />
        
        {/* Extreme overexposed sun with no visible edge - red tint when setting */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: sunStyles.gradient,
            filter: `blur(${sunStyles.blur}px)`,
            zIndex: 2
          }}
        />
      </div>
    </div>
  );
});

Sun.displayName = 'Sun';

export default Sun;

