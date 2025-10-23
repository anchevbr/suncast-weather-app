/**
 * Centralized color palette for sunset scoring and historical data
 * Provides consistent colors across the application
 */

export const SUNSET_COLORS = {
  // Score ranges with distinct colors
  POOR: {
    range: [0, 39],
    bg: 'bg-gradient-to-br from-gray-600 to-gray-800',
    circle: 'bg-gray-600',
    text: 'text-gray-300',
    label: 'Poor'
  },
  FAIR: {
    range: [40, 59],
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    circle: 'bg-amber-500',
    text: 'text-amber-100',
    label: 'Fair'
  },
  GOOD: {
    range: [60, 79],
    bg: 'bg-gradient-to-br from-orange-500 to-pink-500',
    circle: 'bg-orange-500',
    text: 'text-orange-100',
    label: 'Good'
  },
  EXCELLENT: {
    range: [80, 89],
    bg: 'bg-gradient-to-br from-pink-500 to-rose-500',
    circle: 'bg-pink-500',
    text: 'text-pink-100',
    label: 'Excellent'
  },
  SPECTACULAR: {
    range: [90, 100],
    bg: 'bg-gradient-to-br from-rose-500 to-red-500',
    circle: 'bg-rose-500',
    text: 'text-rose-100',
    label: 'Spectacular'
  }
};

/**
 * Get color configuration for a given score
 * @param {number} score - Sunset quality score (0-100)
 * @returns {Object} Color configuration object
 */
export const getScoreColors = (score) => {
  if (score >= 90) return SUNSET_COLORS.SPECTACULAR;
  if (score >= 80) return SUNSET_COLORS.EXCELLENT;
  if (score >= 60) return SUNSET_COLORS.GOOD;
  if (score >= 40) return SUNSET_COLORS.FAIR;
  return SUNSET_COLORS.POOR;
};

/**
 * Get color configuration for historical data display
 * @param {number} score - Sunset quality score (0-100)
 * @returns {Object} Color configuration for historical items
 */
export const getHistoricalColors = (score) => {
  if (score >= 90) return { circle: 'bg-rose-500', text: 'text-rose-200' };
  if (score >= 80) return { circle: 'bg-pink-500', text: 'text-pink-200' };
  if (score >= 60) return { circle: 'bg-orange-500', text: 'text-orange-200' };
  if (score >= 40) return { circle: 'bg-amber-500', text: 'text-amber-200' };
  return { circle: 'bg-gray-500', text: 'text-gray-300' };
};

/**
 * Get scoring system display data
 * @returns {Array} Array of score range objects for display
 */
export const getScoringSystem = () => {
  return [
    { ...SUNSET_COLORS.POOR, range: '0-39' },
    { ...SUNSET_COLORS.FAIR, range: '40-59' },
    { ...SUNSET_COLORS.GOOD, range: '60-79' },
    { ...SUNSET_COLORS.EXCELLENT, range: '80-89' },
    { ...SUNSET_COLORS.SPECTACULAR, range: '90-100' }
  ];
};
