/**
 * Forecast Data Processing Utilities
 * Extracted from apiService.js for better maintainability and testability
 */

import { getCloudTypeFromWeatherCode, getSunsetQualityScore } from './scoringService.js';

/**
 * Parse location query to extract coordinates and name
 * @param {string} locationQuery - Location name or coordinates
 * @param {string} customLocationName - Optional custom location name
 * @returns {Object} Parsed coordinates and location name
 */
export const parseLocationQuery = (locationQuery, customLocationName = null) => {
  const coordMatch = locationQuery.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  
  if (coordMatch) {
    return {
      coords: {
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2]),
        name: customLocationName ? customLocationName.split(',')[0] : 'Current Location',
        country: customLocationName ? customLocationName.split(',').slice(1).join(',').trim() : ''
      },
      locationName: customLocationName || 'Current Location'
    };
  } else {
    throw new Error('Location must be provided as coordinates or through autocomplete');
  }
};


/**
 * Process daily forecast data with scoring using ACTUAL SUNSET HOUR CONDITIONS
 * @param {Object} apiData - Raw API data
 * @param {number} dayIndex - Day index
 * @param {Object} hourlyData - Hourly weather data
 * @returns {Object} Processed day data
 */
export const processDayData = (apiData, dayIndex, hourlyData) => {
  // Get sunset time from daily data
  const sunsetDateTime = apiData.daily.sunset[dayIndex];
  const sunsetTime = sunsetDateTime ? 
    new Date(sunsetDateTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }) : '18:00';
  
  // Calculate sunset hour index in hourly data
  const sunsetHour = sunsetDateTime ? new Date(sunsetDateTime).getHours() : 18;
  const sunsetHourIndex = (dayIndex * 24) + sunsetHour;
  
  // Get weather conditions AT THE ACTUAL SUNSET HOUR
  const safeHourIndex = Math.min(sunsetHourIndex, (hourlyData.time?.length || 0) - 1);
  
  // DEBUG: Log sunset time and hour calculation
  if (dayIndex < 3) { // Only log first 3 days to avoid spam
    console.log(`📅 Live Forecast Day ${dayIndex + 1}:`, {
      date: apiData.daily.time[dayIndex],
      sunsetDateTime: sunsetDateTime,
      sunsetTime: sunsetTime,
      sunsetHour: sunsetHour,
      sunsetHourIndex: sunsetHourIndex,
      safeHourIndex: safeHourIndex,
      hourlyDataLength: hourlyData.time?.length || 0
    });
  }
  
  const weatherCode = hourlyData.weather_code?.[safeHourIndex] || 0;
  const cloudCoverage = hourlyData.cloud_cover?.[safeHourIndex] || 0;
  const cloudCoverageLow = hourlyData.cloud_cover_low?.[safeHourIndex] || 0;
  const cloudCoverageMid = hourlyData.cloud_cover_mid?.[safeHourIndex] || 0;
  const cloudCoverageHigh = hourlyData.cloud_cover_high?.[safeHourIndex] || 0;
  const humidity = hourlyData.relative_humidity_2m?.[safeHourIndex] || 50;
  const precipChance = hourlyData.precipitation_probability?.[safeHourIndex] || 0;
  const visibility = hourlyData.visibility?.[safeHourIndex] || 10000;
  const windSpeed = hourlyData.wind_speed_10m?.[safeHourIndex] || 5;
  
  // DEBUG: Log sunset hour conditions
  if (dayIndex < 3) { // Only log first 3 days to avoid spam
    console.log(`🌅 Live Forecast Sunset Conditions Day ${dayIndex + 1}:`, {
      weatherCode: weatherCode,
      cloudCoverage: cloudCoverage,
      cloudCoverageLow: cloudCoverageLow,
      cloudCoverageMid: cloudCoverageMid,
      cloudCoverageHigh: cloudCoverageHigh,
      humidity: humidity,
      precipChance: precipChance,
      visibility: visibility,
      windSpeed: windSpeed
    });
  }
  
  // Get cloud type and height from weather code
  const cloudInfo = getCloudTypeFromWeatherCode(weatherCode);
  
  // Create weather data for scoring using ACTUAL SUNSET HOUR CONDITIONS
  const weatherForScoring = {
    cloud_type: cloudInfo.type,
    cloud_coverage: cloudCoverage,
    cloud_coverage_low: cloudCoverageLow,
    cloud_coverage_mid: cloudCoverageMid,
    cloud_coverage_high: cloudCoverageHigh,
    cloud_height_km: cloudInfo.height,
    precipitation_chance: precipChance,
    humidity: humidity,
    air_quality_index: 50, // Default AQI since we don't have air quality data
    visibility: visibility,
    wind_speed: windSpeed
  };
  
  // Calculate sunset score using ACTUAL SUNSET HOUR CONDITIONS
  const scoreResult = getSunsetQualityScore(weatherForScoring);
  
  // DEBUG: Log scoring result
  if (dayIndex < 3) { // Only log first 3 days to avoid spam
    console.log(`🎯 Live Forecast Scoring Result Day ${dayIndex + 1}:`, {
      score: scoreResult.score,
      conditions: scoreResult.conditions,
      weatherForScoring: weatherForScoring
    });
  }
  
  // Get day of week
  const dayOfWeek = new Date(apiData.daily.time[dayIndex]).toLocaleDateString('en-US', { 
    weekday: 'short' 
  });
  
  return {
    date: apiData.daily.time[dayIndex],
    day_of_week: dayOfWeek,
    weather_code: weatherCode,
    temperature_max: apiData.daily.temperature_2m_max[dayIndex],
    temperature_min: apiData.daily.temperature_2m_min[dayIndex],
    sunset: apiData.daily.sunset[dayIndex],
    sunrise: apiData.daily.sunrise[dayIndex],
    sunset_time: sunsetTime,
    sunset_score: scoreResult.score,
    conditions: scoreResult.conditions,
    cloud_coverage: cloudCoverage,
    cloud_coverage_low: cloudCoverageLow,
    cloud_coverage_mid: cloudCoverageMid,
    cloud_coverage_high: cloudCoverageHigh,
    humidity: humidity,
    precipitation_chance: precipChance,
    visibility: visibility,
    wind_speed: windSpeed
  };
};
