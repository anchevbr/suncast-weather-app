/**
 * Color manipulation utilities
 * Centralized color interpolation and formatting functions
 */

/**
 * Convert RGB values to CSS color string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @param {number} a - Alpha (0-1), defaults to 1
 * @returns {string} CSS color string
 */
export const rgbToString = (r, g, b, a = 1) => 
  a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;

/**
 * Interpolate between two RGB color objects
 * Used by Sun component for color transitions
 * @param {Object} color1 - Starting color {r, g, b}
 * @param {Object} color2 - Ending color {r, g, b}
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {Object} Interpolated color {r, g, b}
 */
export const interpolateRGB = (color1, color2, factor) => {
  const r = Math.round(color1.r + (color2.r - color1.r) * factor);
  const g = Math.round(color1.g + (color2.g - color1.g) * factor);
  const b = Math.round(color1.b + (color2.b - color1.b) * factor);
  return { r, g, b };
};

/**
 * Interpolate between two hex colors
 * Used by backgroundGradient utility
 * @param {string} color1 - Starting hex color (e.g., '#4a90e2')
 * @param {string} color2 - Ending hex color (e.g., '#1a1a2e')
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {string} RGB color string (e.g., 'rgb(74, 144, 226)')
 */
export const interpolateColor = (color1, color2, factor) => {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  return `rgb(${r}, ${g}, ${b})`;
};

