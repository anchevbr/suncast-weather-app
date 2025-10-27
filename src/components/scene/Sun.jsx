import React, { memo, useMemo } from "react";
import PropTypes from 'prop-types';
import { interpolateRGB, rgbToString } from "../../utils/colorUtils";
import { VISUAL_CONSTANTS } from "../../constants/app";

/**
 * Sun Component
 * Renders an animated sun that sets behind mountains as you scroll
 * Includes smooth color transition from warm white to red and blur reduction
 * Optimized with useMemo for expensive calculations
 */
const Sun = memo(({ scrollProgress }) => {
  // Memoize sun color and gradient calculations
  const sunStyles = useMemo(() => {
    // Define day and sunset colors
    const dayColor = { r: 255, g: 250, b: 240 };
    const sunsetColor = { r: 255, g: 0, b: 0 };
    
    // Calculate interpolation factor based on progress
    const colorProgress = scrollProgress < 0.2 ? 0 : (scrollProgress - 0.2) / 0.8;
    const { r: red, g: green, b: blue } = interpolateRGB(dayColor, sunsetColor, colorProgress);
    
    // Much less feathering for more defined sun shape
    // Calculate feather factor: VISUAL_CONSTANTS.SUN_FEATHER_FACTOR at start (much less feather), 0.0 at 80%+ (sharp)
    const featherFactor = scrollProgress < 0.8 ? VISUAL_CONSTANTS.SUN_FEATHER_FACTOR - (scrollProgress / 0.8) * VISUAL_CONSTANTS.SUN_FEATHER_FACTOR : 0;
    
    // Pre-calculate gradient stops for better performance
    const gradientStops = [
      `rgba(${red}, ${green}, ${blue}, 1) 0%`,
      `rgba(${red}, ${green}, ${blue}, ${1 - (0.005 * featherFactor)}) 10%`,
      `rgba(${red}, ${green}, ${blue}, ${1 - (0.01 * featherFactor)}) 20%`,
      `rgba(${red}, ${green}, ${blue}, ${1 - (0.025 * featherFactor)}) 30%`,
      `rgba(${red}, ${green}, ${blue}, ${1 - (0.05 * featherFactor)}) 40%`,
      `rgba(${red}, ${green}, ${blue}, ${0.98 - (0.05 * featherFactor)}) 50%`,
      `rgba(${red}, ${green}, ${blue}, ${0.95 - (0.10 * featherFactor)}) 60%`,
      `rgba(${red}, ${green}, ${blue}, ${0.9 - (0.15 * featherFactor)}) 70%`,
      `rgba(${red}, ${green}, ${blue}, ${0.8 - (0.15 * featherFactor)}) 80%`,
      `rgba(${red}, ${green}, ${blue}, ${0.6 - (0.10 * featherFactor)}) 90%`,
      `rgba(${red}, ${green}, ${blue}, ${0.4 - (0.05 * featherFactor)}) 95%`,
      `rgba(${red}, ${green}, ${blue}, ${0.2 - (0.02 * featherFactor)}) 98%`,
      'transparent 100%'
    ];
    
    const gradient = `radial-gradient(circle, ${gradientStops.join(', ')})`;
    
    // Reduced blur: VISUAL_CONSTANTS.SUN_BLUR_MAX at 0%, gradually to 0px at 80%, completely sharp at 100%
    // Using quadratic easing for more natural transition (faster at start, slower at end)
    // After 80% (4 seconds), transition to 0 blur for sharp sunset
    const blur = scrollProgress < 0.8 ? VISUAL_CONSTANTS.SUN_BLUR_MAX * Math.pow(1 - (scrollProgress / 0.8), 2) : 0;
    
    return { gradient, blur };
  }, [scrollProgress]);

  return (
    <div
      className="fixed pointer-events-none z-5"
      style={{
        left: '10%',
        top: `${VISUAL_CONSTANTS.SUN_POSITION_START + scrollProgress * VISUAL_CONSTANTS.SUN_POSITION_OFFSET}vh`,
        opacity: 1 - scrollProgress * VISUAL_CONSTANTS.SUN_OPACITY_FADE,
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

Sun.propTypes = {
  scrollProgress: PropTypes.number.isRequired
};

export default Sun;

