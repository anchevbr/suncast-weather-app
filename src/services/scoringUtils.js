/**
 * Sunset Scoring Algorithm Utilities
 * Extracted from scoringService.js for better maintainability and testability
 */

// High cloud coverage scoring ranges
const HIGH_CLOUD_RANGES = [
  { min: 80, max: 95, score: 40 },
  { min: 60, max: 80, score: 35 },
  { min: 40, max: 60, score: 30 },
  { min: 25, max: 40, score: 25 },
  { min: 15, max: 25, score: 20 },
  { min: 0, max: 15, score: 15 }
];

// Mid cloud coverage scoring ranges
const MID_CLOUD_RANGES = [
  { min: 20, max: 40, score: 15 },
  { min: 10, max: 20, score: 12 },
  { min: 40, max: 60, score: 8 },
  { min: 0, max: 10, score: 10 }
];

// Low cloud coverage scoring ranges
const LOW_CLOUD_RANGES = [
  { min: 60, max: 100, score: -20 },
  { min: 40, max: 60, score: -8 },
  { min: 20, max: 40, score: 3 },
  { min: 0, max: 20, score: 5 }
];

/**
 * Calculate cloud altitude scoring (50 points max)
 * @param {Object} cloudData - Cloud coverage data by altitude
 * @returns {number} Cloud score (0-50)
 */
export const calculateCloudScore = (cloudData) => {
  const { cloudCoverageLow, cloudCoverageMid, cloudCoverageHigh } = cloudData;
  let cloudScore = 0;
  
  // High clouds (>8km) are scientifically optimal for sunset colors
  if (cloudCoverageHigh > 0) {
    const range = HIGH_CLOUD_RANGES.find(r => 
      cloudCoverageHigh >= r.min && cloudCoverageHigh < r.max
    );
    cloudScore += range?.score || 15;
  }
  
  // Mid-level clouds (3-8km) provide moderate color enhancement
  if (cloudCoverageMid > 0) {
    const range = MID_CLOUD_RANGES.find(r => 
      cloudCoverageMid >= r.min && cloudCoverageMid < r.max
    );
    cloudScore += range?.score || 10;
  }
  
  // Low clouds (0-3km) typically block sunlight and reduce color intensity
  if (cloudCoverageLow > 0) {
    const range = LOW_CLOUD_RANGES.find(r => 
      cloudCoverageLow >= r.min && cloudCoverageLow < r.max
    );
    cloudScore += range?.score || 5;
  }
  
  // Clear skies bonus - when all cloud levels are minimal
  if (cloudCoverageLow < 5 && cloudCoverageMid < 5 && cloudCoverageHigh < 5) {
    cloudScore += 10; // Crystal clear skies bonus
  }
  
  // Cap cloud score at 50 points maximum
  return Math.min(50, Math.max(0, cloudScore));
};

// Precipitation scoring ranges
const PRECIPITATION_RANGES = [
  { min: 60, max: 100, score: -20 },
  { min: 40, max: 60, score: -12 },
  { min: 20, max: 40, score: -6 },
  { min: 5, max: 20, score: -2 },
  { min: 0, max: 5, score: 0 }
];

// Humidity scoring ranges
const HUMIDITY_RANGES = [
  { min: 40, max: 70, score: 10 },
  { min: 30, max: 40, score: 8 },
  { min: 70, max: 85, score: 5 },
  { min: 85, max: 100, score: -3 },
  { min: 0, max: 30, score: 7 }
];

// Air quality scoring ranges
const AQI_RANGES = [
  { min: 0, max: 25, score: 10 },
  { min: 25, max: 50, score: 8 },
  { min: 50, max: 75, score: 5 },
  { min: 75, max: 100, score: 2 },
  { min: 100, max: 500, score: -5 }
];

// Visibility scoring ranges
const VISIBILITY_RANGES = [
  { min: 20000, max: 100000, score: 8 },
  { min: 15000, max: 20000, score: 6 },
  { min: 10000, max: 15000, score: 4 },
  { min: 5000, max: 10000, score: 2 },
  { min: 2000, max: 5000, score: -3 },
  { min: 0, max: 2000, score: -8 }
];

/**
 * Calculate atmospheric conditions scoring (30 points max)
 * @param {Object} atmosphericData - Atmospheric conditions data
 * @returns {number} Atmospheric score (-20 to 30)
 */
export const calculateAtmosphericScore = (atmosphericData) => {
  const { precipChance, humidity, aqi, visibility } = atmosphericData;
  let atmosphericScore = 0;
  
  // Precipitation severely impacts sunset quality
  const precipRange = PRECIPITATION_RANGES.find(r => 
    precipChance >= r.min && precipChance < r.max
  );
  atmosphericScore += precipRange?.score || 0;
  
  // Humidity affects color intensity through atmospheric scattering
  const humidityRange = HUMIDITY_RANGES.find(r => 
    humidity >= r.min && humidity < r.max
  );
  atmosphericScore += humidityRange?.score || 7;
  
  // Air quality impacts color purity and visibility
  const aqiRange = AQI_RANGES.find(r => 
    aqi >= r.min && aqi <= r.max
  );
  atmosphericScore += aqiRange?.score || 2;
  
  // Visibility directly affects sunset clarity
  const visRange = VISIBILITY_RANGES.find(r => 
    visibility >= r.min && visibility < r.max
  );
  atmosphericScore += visRange?.score || 2;
  
  // Cap atmospheric score at 30 points maximum
  return Math.min(30, Math.max(-20, atmosphericScore));
};

/**
 * Calculate optimal conditions bonus (20 points max)
 * @param {Object} conditions - Weather conditions data
 * @returns {number} Bonus score (0-20)
 */
export const calculateBonusScore = (conditions) => {
  const { cloudCoverageHigh, cloudCoverageMid, cloudCoverageLow, precipChance, aqi, visibility } = conditions;
  let bonusScore = 0;
  
  // Perfect atmospheric conditions for spectacular sunsets
  const hasOptimalHighClouds = cloudCoverageHigh >= 25 && cloudCoverageHigh <= 50;
  const hasGoodMidClouds = cloudCoverageMid >= 10 && cloudCoverageMid <= 30;
  const hasMinimalLowClouds = cloudCoverageLow < 20;
  const hasLowPrecipitation = precipChance < 10;
  const hasGoodAirQuality = aqi <= 50;
  const hasGoodVisibility = visibility >= 15000;
  
  if (hasOptimalHighClouds && hasMinimalLowClouds && hasLowPrecipitation && hasGoodAirQuality && hasGoodVisibility) {
    bonusScore += 20; // Perfect conditions bonus
  } else if (hasOptimalHighClouds && hasMinimalLowClouds && hasLowPrecipitation) {
    bonusScore += 12; // Very good conditions
  } else if (hasGoodMidClouds && hasMinimalLowClouds && hasLowPrecipitation) {
    bonusScore += 8; // Good conditions
  }
  
  // Cap bonus score at 20 points maximum
  return Math.min(20, Math.max(0, bonusScore));
};

/**
 * Determine conditions label based on score
 * @param {number} score - Final sunset score (0-100)
 * @returns {string} Conditions label
 */
export const getConditionsLabel = (score) => {
  if (score >= 85) return 'Spectacular';
  if (score >= 70) return 'Excellent';
  if (score >= 55) return 'Good';
  if (score >= 35) return 'Fair';
  return 'Poor';
};
