/**
 * Scientific Sunset Quality Scoring Service
 * Based on atmospheric optics and cloud physics research
 * Designed to cap at exactly 100 points maximum
 */

/**
 * Scientific sunset quality score based on atmospheric optics and cloud physics
 * Research shows: High clouds (>8km) scatter sunlight creating vibrant colors
 * Mid-level clouds (3-8km) provide moderate color enhancement
 * Low clouds (0-3km) often block sunlight and reduce color intensity
 * @param {Object} weather - Weather data object with Open-Meteo cloud cover data
 * @returns {Object} - {score: number, conditions: string}
 */
export const getSunsetQualityScore = (weather) => {
  let score = 0;
  
  // Extract cloud cover data by altitude (Open-Meteo provides actual measurements)
  const cloudCoverageLow = weather.cloud_coverage_low || 0;    // 0-3km altitude
  const cloudCoverageMid = weather.cloud_coverage_mid || 0;    // 3-8km altitude  
  const cloudCoverageHigh = weather.cloud_coverage_high || 0;  // >8km altitude
  
  // Extract other meteorological factors
  const precipChance = weather.precipitation_chance || 0;
  const humidity = weather.humidity || 50;
  const aqi = weather.air_quality_index || 50;
  const visibility = weather.visibility || 10000;
  
  // === CLOUD ALTITUDE SCORING (50 points max) ===
  // High clouds (>8km) are scientifically optimal for sunset colors
  let cloudScore = 0;
  
  if (cloudCoverageHigh > 0) {
    if (cloudCoverageHigh >= 25 && cloudCoverageHigh <= 50) {
      cloudScore += 30; // Optimal high cloud coverage
    } else if (cloudCoverageHigh >= 15 && cloudCoverageHigh < 25) {
      cloudScore += 25; // Good high cloud coverage
    } else if (cloudCoverageHigh >= 50 && cloudCoverageHigh <= 70) {
      cloudScore += 20; // Heavy high clouds still good
    } else if (cloudCoverageHigh > 70) {
      cloudScore += 15; // Very heavy high clouds
    } else {
      cloudScore += 20; // Light high clouds
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
  score += Math.min(50, Math.max(0, cloudScore));
  
  // === ATMOSPHERIC CONDITIONS (30 points max) ===
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
  score += Math.min(30, Math.max(-20, atmosphericScore));
  
  // === OPTIMAL CONDITIONS BONUS (20 points max) ===
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
  score += Math.min(20, Math.max(0, bonusScore));
  
  // Ensure score is between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  
  // Determine conditions based on final score
  let conditions = 'Poor';
  if (finalScore >= 85) conditions = 'Spectacular';
  else if (finalScore >= 70) conditions = 'Excellent';
  else if (finalScore >= 55) conditions = 'Good';
  else if (finalScore >= 35) conditions = 'Fair';
  else if (finalScore >= 15) conditions = 'Poor';
  
  return {
    score: finalScore,
    conditions: conditions
  };
};

/**
 * Simplified cloud type mapping for weather codes (minimal usage now)
 * @param {number} code - WMO weather interpretation code
 * @returns {Object} - {type: string, height: number}
 */
export const getCloudTypeFromWeatherCode = (code) => {
  const weatherTypes = {
    0: { type: 'Clear', height: 0 },
    1: { type: 'Mainly Clear', height: 0 },
    2: { type: 'Partly Cloudy', height: 4 },
    3: { type: 'Overcast', height: 3 },
    45: { type: 'Fog', height: 0.5 },
    48: { type: 'Fog', height: 0.5 },
    51: { type: 'Drizzle', height: 2 },
    53: { type: 'Drizzle', height: 2 },
    55: { type: 'Drizzle', height: 2 },
    61: { type: 'Rain', height: 2 },
    63: { type: 'Rain', height: 2 },
    65: { type: 'Rain', height: 2 },
    71: { type: 'Snow', height: 3 },
    73: { type: 'Snow', height: 3 },
    75: { type: 'Snow', height: 3 },
    80: { type: 'Rain Showers', height: 4 },
    81: { type: 'Rain Showers', height: 4 },
    82: { type: 'Rain Showers', height: 4 },
    95: { type: 'Thunderstorm', height: 8 },
    96: { type: 'Thunderstorm with Hail', height: 10 },
    99: { type: 'Thunderstorm with Hail', height: 10 }
  };
  
  return weatherTypes[code] || { type: 'Partly Cloudy', height: 3 };
};