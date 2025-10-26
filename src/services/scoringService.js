/**
 * Centralized Sunset Quality Scoring Service
 * Single source of truth for all sunset scoring calculations
 */

/**
 * Get cloud type and height from WMO weather code
 * @param {number} code - WMO weather interpretation code
 * @returns {Object} - {type: string, height: number}
 */
export const getCloudTypeFromWeatherCode = (code) => {
  // Simplified WMO weather codes mapping
  const weatherTypes = {
    0: { type: 'Clear', height: 0 },
    1: { type: 'Mainly Clear', height: 8 },
    2: { type: 'Partly Cloudy', height: 7 },
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
  
  return weatherTypes[code] || { type: 'Partly Cloudy', height: 5 };
};

/**
 * Professional sunset quality score based on meteorological factors
 * Based on research from SunsetWx, Sunsethue, and atmospheric science
 * @param {Object} weather - Weather data object
 * @returns {Object} - {score: number}
 */
export const getSunsetQualityScore = (weather) => {
  let score = 0; // Start from 0, build up based on factors
  
  const cloudType = weather.cloud_type?.toLowerCase() || '';
  const cloudCoverage = weather.cloud_coverage || 0;
  const cloudHeight = weather.cloud_height_km || 0;
  const precipChance = weather.precipitation_chance || 0;
  const humidity = weather.humidity || 50;
  const aqi = weather.air_quality_index || 50;
  const visibility = weather.visibility || 10000;
  const windSpeed = weather.wind_speed || 10;
  
  // 1. CLOUD TYPE & HEIGHT (30% of score) - Most important factor
  // High clouds (6-12km) are ideal for vibrant sunsets
  if (cloudHeight >= 6 && cloudHeight <= 12) {
    if (cloudType.includes('cirrus') || cloudType.includes('cirrostratus')) {
      score += 30; // Perfect high clouds
    } else if (cloudType.includes('altocumulus') || cloudType.includes('altostratus')) {
      score += 22; // Good high clouds
    } else {
      score += 18; // Any high clouds are good
    }
  }
  // Mid-level clouds (2-6km) are good for sunsets
  else if (cloudHeight >= 2 && cloudHeight <= 6) {
    if (cloudType.includes('altocumulus') || cloudType.includes('altostratus')) {
      score += 18; // Good mid-level clouds
    } else if (cloudType.includes('cumulus')) {
      score += 14; // Decent mid-level clouds
    } else {
      score += 10; // Any mid-level clouds help
    }
  }
  // Low clouds (0-2km) can be problematic
  else if (cloudHeight < 2) {
    if (cloudType.includes('stratus') || cloudType.includes('fog')) {
      score -= 20; // Low clouds block sunset
    } else if (cloudType.includes('cumulus')) {
      score += 8; // Some low clouds can be okay
    } else {
      score += 5; // Clear skies are okay
    }
  }
  // Very high clouds (above 12km) are excellent
  else if (cloudHeight > 12) {
    score += 35; // Exceptional high clouds
  }
  
  // 2. CLOUD COVERAGE (20% of score) - Optimal range is 25-50%
  if (cloudCoverage >= 25 && cloudCoverage <= 40) {
    score += 20; // Perfect coverage for colorful sunsets
  } else if (cloudCoverage >= 40 && cloudCoverage <= 55) {
    score += 16; // Good coverage
  } else if (cloudCoverage >= 15 && cloudCoverage <= 25) {
    score += 12; // Some clouds, better than none
  } else if (cloudCoverage >= 5 && cloudCoverage <= 15) {
    score += 8; // Light clouds
  } else if (cloudCoverage === 0) {
    score += 5; // Clear skies are okay but not optimal
  } else if (cloudCoverage > 80) {
    score -= 15; // Too much cloud cover
  } else if (cloudCoverage > 60) {
    score += 3; // Heavy clouds can still work
  }
  
  // 3. PRECIPITATION (15% of score) - Rain ruins sunsets
  if (precipChance >= 70) {
    score -= 25; // Heavy rain
  } else if (precipChance >= 50) {
    score -= 15; // Moderate-heavy rain
  } else if (precipChance >= 30) {
    score -= 8; // Moderate rain
  } else if (precipChance >= 15) {
    score -= 3; // Light rain chance
  } else if (precipChance < 5) {
    score += 12; // Very low rain chance is excellent
  } else if (precipChance < 10) {
    score += 8; // Low rain chance is good
  } else {
    score += 4; // Some rain chance is okay
  }
  
  // 4. AIR QUALITY (12% of score) - Clean air is better
  if (aqi <= 20) {
    score += 12; // Exceptional air quality
  } else if (aqi <= 40) {
    score += 10; // Excellent air quality
  } else if (aqi <= 60) {
    score += 7; // Good air quality
  } else if (aqi <= 100) {
    score += 4; // Moderate air quality
  } else if (aqi <= 150) {
    score += 1; // Unhealthy for sensitive groups
  } else {
    score -= 8; // Poor air quality
  }
  
  // 5. HUMIDITY (8% of score) - Lower humidity is better
  if (humidity <= 25) {
    score += 8; // Very low humidity, crystal clear air
  } else if (humidity <= 45) {
    score += 6; // Low humidity, clear air
  } else if (humidity <= 65) {
    score += 3; // Moderate humidity is okay
  } else if (humidity >= 85) {
    score -= 5; // High humidity dampens colors
  } else {
    score += 1; // Slightly elevated humidity
  }
  
  // 6. VISIBILITY (8% of score) - Good visibility helps
  if (visibility >= 15000) {
    score += 8; // Exceptional visibility
  } else if (visibility >= 10000) {
    score += 6; // Excellent visibility
  } else if (visibility >= 7000) {
    score += 4; // Good visibility
  } else if (visibility >= 4000) {
    score += 2; // Fair visibility
  } else {
    score -= 5; // Poor visibility
  }
  
  // 7. WIND (7% of score) - Light wind can help with cloud movement
  if (windSpeed >= 5 && windSpeed <= 12) {
    score += 7; // Ideal wind enhances cloud formations
  } else if (windSpeed >= 3 && windSpeed <= 5) {
    score += 5; // Light wind is good
  } else if (windSpeed >= 12 && windSpeed <= 20) {
    score += 3; // Moderate wind is okay
  } else if (windSpeed > 30) {
    score -= 5; // Strong wind is problematic
  } else if (windSpeed > 20) {
    score -= 2; // Windy conditions
  } else {
    score += 2; // Very calm conditions
  }
  
  // Penalty for bad weather conditions
  if (cloudType.includes('thunderstorm') || cloudType.includes('rain')) {
    score -= 20; // Severe weather
  }
  if (cloudType.includes('fog') || cloudType.includes('mist')) {
    score -= 15; // Poor visibility conditions
  }
  
  // Bonus for perfect combinations (rare!)
  if (cloudHeight >= 6 && cloudCoverage >= 25 && cloudCoverage <= 45 && aqi <= 40 && precipChance < 5) {
    score += 10; // Perfect sunset conditions bonus
  }
  
  // Ensure score is between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  
  return { score: finalScore };
};
