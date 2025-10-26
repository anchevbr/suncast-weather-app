/**
 * Background Gradient Utilities
 * Helper functions for calculating and interpolating background gradient colors
 */

import { interpolateColor } from './colorUtils';

/**
 * Generates a background gradient based on scroll progress
 * @param {number} scrollProgress - Scroll progress (0-1)
 * @returns {string} Linear gradient CSS string
 */
export const getBackgroundGradient = (scrollProgress) => {
  // Daylight colors (0% scroll)
  const daylight = {
    top: '#4a90e2',
    mid1: '#5fa3e8',
    mid2: '#7ab8ee',
    bottom: '#a4d4f4'
  };
  
  // Sunset colors (100% scroll)
  const sunset = {
    top: '#1a1a2e',
    mid1: '#d4507a',
    mid2: '#ff8c42',
    bottom: '#ffb347'
  };

  const topColor = interpolateColor(daylight.top, sunset.top, scrollProgress);
  const mid1Color = interpolateColor(daylight.mid1, sunset.mid1, scrollProgress);
  const mid2Color = interpolateColor(daylight.mid2, sunset.mid2, scrollProgress);
  const bottomColor = interpolateColor(daylight.bottom, sunset.bottom, scrollProgress);

  return `linear-gradient(to bottom, ${topColor} 0%, ${mid1Color} 33%, ${mid2Color} 66%, ${bottomColor} 100%)`;
};

