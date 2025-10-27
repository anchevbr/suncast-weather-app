/**
 * Sunset Scoring Algorithm Utilities
 * Extracted from scoringService.js for better maintainability and testability
 */

/**
 * Calculate cloud altitude scoring (50 points max)
 * @param {Object} cloudData - Cloud coverage data by altitude
 * @returns {number} Cloud score (0-50)
 */
export const calculateCloudScore = (cloudData) => {
  const { cloudCoverageLow, cloudCoverageMid, cloudCoverageHigh } = cloudData;
  let cloudScore = 0;
  
  // High clouds (>8km) are scientifically optimal for sunset colors
  // CORRECTED: More high clouds = better sunset colors (up to reasonable limit)
  if (cloudCoverageHigh > 0) {
    if (cloudCoverageHigh >= 80 && cloudCoverageHigh <= 95) {
      cloudScore += 40; // EXCELLENT high cloud coverage - perfect for sunsets!
    } else if (cloudCoverageHigh >= 60 && cloudCoverageHigh < 80) {
      cloudScore += 35; // Very good high cloud coverage
    } else if (cloudCoverageHigh >= 40 && cloudCoverageHigh < 60) {
      cloudScore += 30; // Good high cloud coverage
    } else if (cloudCoverageHigh >= 25 && cloudCoverageHigh < 40) {
      cloudScore += 25; // Moderate high cloud coverage
    } else if (cloudCoverageHigh >= 15 && cloudCoverageHigh < 25) {
      cloudScore += 20; // Light high cloud coverage
    } else {
      cloudScore += 15; // Very light high clouds
    }
  }
  
  // Mid-level clouds (3-8km) provide moderate color enhancement
  if (cloudCoverageMid > 0) {
    if (cloudCoverageMid >= 20 && cloudCoverageMid <= 40) {
      cloudScore += 15; // Good mid-level clouds
    } else if (cloudCoverageMid >= 10 && cloudCoverageMid < 20) {
      cloudScore += 12; // Light mid-level clouds
    } else if (cloudCoverageMid > 40 && cloudCoverageMid <= 60) {
      cloudScore += 8; // Heavy mid-level clouds
    } else {
      cloudScore += 10; // Minimal mid-level clouds
    }
  }
  
  // Low clouds (0-3km) typically block sunlight and reduce color intensity
  if (cloudCoverageLow > 0) {
    if (cloudCoverageLow >= 60) {
      cloudScore -= 20; // Heavy low clouds block sunlight
    } else if (cloudCoverageLow >= 40 && cloudCoverageLow < 60) {
      cloudScore -= 8; // Moderate low clouds reduce colors
    } else if (cloudCoverageLow >= 20 && cloudCoverageLow < 40) {
      cloudScore += 3; // Light low clouds can create silhouettes
    } else {
      cloudScore += 5; // Minimal low clouds, slight enhancement
    }
  }
  
  // Clear skies bonus - when all cloud levels are minimal
  if (cloudCoverageLow < 5 && cloudCoverageMid < 5 && cloudCoverageHigh < 5) {
    cloudScore += 10; // Crystal clear skies bonus
  }
  
  // Cap cloud score at 50 points maximum
  return Math.min(50, Math.max(0, cloudScore));
};

/**
 * Calculate atmospheric conditions scoring (30 points max)
 * @param {Object} atmosphericData - Atmospheric conditions data
 * @returns {number} Atmospheric score (-20 to 30)
 */
export const calculateAtmosphericScore = (atmosphericData) => {
  const { precipChance, humidity, aqi, visibility } = atmosphericData;
  let atmosphericScore = 0;
  
  // Precipitation severely impacts sunset quality
  if (precipChance >= 60) {
    atmosphericScore -= 20; // Heavy precipitation
  } else if (precipChance >= 40) {
    atmosphericScore -= 12; // Moderate precipitation
  } else if (precipChance >= 20) {
    atmosphericScore -= 6; // Light precipitation
  } else if (precipChance >= 5) {
    atmosphericScore -= 2; // Slight chance of precipitation
  }
  
  // Humidity affects color intensity through atmospheric scattering
  if (humidity >= 40 && humidity <= 70) {
    atmosphericScore += 10; // Optimal humidity
  } else if (humidity >= 30 && humidity < 40) {
    atmosphericScore += 8; // Lower humidity, good clarity
  } else if (humidity >= 70 && humidity <= 85) {
    atmosphericScore += 5; // Higher humidity, slightly muted
  } else if (humidity > 85) {
    atmosphericScore -= 3; // Very high humidity
  } else if (humidity < 30) {
    atmosphericScore += 7; // Very low humidity, excellent clarity
  }
  
  // Air quality impacts color purity and visibility
  if (aqi <= 25) {
    atmosphericScore += 10; // Excellent air quality
  } else if (aqi <= 50) {
    atmosphericScore += 8; // Good air quality
  } else if (aqi <= 75) {
    atmosphericScore += 5; // Moderate air quality
  } else if (aqi <= 100) {
    atmosphericScore += 2; // Poor air quality
  } else {
    atmosphericScore -= 5; // Very poor air quality
  }
  
  // Visibility directly affects sunset clarity
  if (visibility >= 20000) {
    atmosphericScore += 8; // Excellent visibility
  } else if (visibility >= 15000) {
    atmosphericScore += 6; // Very good visibility
  } else if (visibility >= 10000) {
    atmosphericScore += 4; // Good visibility
  } else if (visibility >= 5000) {
    atmosphericScore += 2; // Moderate visibility
  } else if (visibility >= 2000) {
    atmosphericScore -= 3; // Poor visibility
  } else {
    atmosphericScore -= 8; // Very poor visibility
  }
  
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
