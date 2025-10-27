/**
 * Unified Sunset Data Processing Module
 * Ensures identical calculations for both historical and live forecast data
 * Single source of truth for sunset scoring logic
 */

import { getSunsetQualityScore } from './scoringService.js';
import { SUNSET_CONSTANTS } from '../constants/app.js';
import { logger } from '../utils/logger.js';

/**
 * Calculate sunset hour index from sunset datetime
 * @param {string} sunsetDateTime - ISO datetime string of sunset
 * @param {number} dayIndex - Index of the day (0-based)
 * @returns {Object} Sunset hour calculation details
 */
export const calculateSunsetHourIndex = (sunsetDateTime, dayIndex) => {
  // Format sunset time for display
  const sunsetTime = sunsetDateTime ? 
    new Date(sunsetDateTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }) : '18:00';
  
  // Calculate sunset hour index in hourly data
  // Use CLOSEST hour to sunset time for maximum accuracy
  // This minimizes the time difference between actual sunset and weather data used
  let sunsetHour = 18; // Default to 6 PM if no data
  if (sunsetDateTime) {
    const sunsetDate = new Date(sunsetDateTime);
    sunsetHour = sunsetDate.getHours(); // Always floor - use hour at/before sunset
    
    // Ensure we don't exceed 23:00
    if (sunsetHour > 23) {
      sunsetHour = 23;
    }
  }
  
  // Calculate the exact index in hourly arrays
  const sunsetHourIndex = (dayIndex * 24) + sunsetHour;
  return {
    sunsetTime,
    sunsetHour,
    sunsetHourIndex
  };
};

/**
 * Extract weather data at sunset hour from hourly data arrays
 * @param {Object} hourlyData - Hourly weather data object
 * @param {number} hourIndex - Index in hourly arrays
 * @param {Object} aqiData - Optional air quality data
 * @returns {Object} Weather conditions at sunset hour
 */
export const extractSunsetHourWeather = (hourlyData, hourIndex, aqiData = null) => {
  // Ensure we don't exceed array bounds
  const safeHourIndex = Math.min(hourIndex, (hourlyData.time?.length || 0) - 1);
  
  // Extract all weather parameters at sunset hour
  const weatherCode = hourlyData.weather_code?.[safeHourIndex] || 0;
  const cloudCoverage = hourlyData.cloud_cover?.[safeHourIndex] || 0;
  const cloudCoverageLow = hourlyData.cloud_cover_low?.[safeHourIndex] || 0;
  const cloudCoverageMid = hourlyData.cloud_cover_mid?.[safeHourIndex] || 0;
  const cloudCoverageHigh = hourlyData.cloud_cover_high?.[safeHourIndex] || 0;
  const humidity = hourlyData.relative_humidity_2m?.[safeHourIndex] || SUNSET_CONSTANTS.DEFAULT_HUMIDITY;
  const precipChance = hourlyData.precipitation_probability?.[safeHourIndex] || 0;
  const visibility = hourlyData.visibility?.[safeHourIndex] || SUNSET_CONSTANTS.DEFAULT_VISIBILITY;
  const windSpeed = hourlyData.wind_speed_10m?.[safeHourIndex] || SUNSET_CONSTANTS.DEFAULT_WIND_SPEED;
  
  // Get AQI for sunset hour - MATCH BY TIMESTAMP, not by index
  // This ensures accuracy even if AQI data has different length/start time
  let aqi = SUNSET_CONSTANTS.DEFAULT_AQI;
  if (aqiData && aqiData.hourly && aqiData.hourly.us_aqi && aqiData.hourly.time) {
    // Get the timestamp we're looking for
    const targetTimestamp = hourlyData.time?.[safeHourIndex];
    
    if (targetTimestamp) {
      // Find matching timestamp in AQI data
      const aqiIndex = aqiData.hourly.time.findIndex(t => t === targetTimestamp);
      
      if (aqiIndex !== -1 && aqiData.hourly.us_aqi[aqiIndex] !== undefined) {
        aqi = aqiData.hourly.us_aqi[aqiIndex];
      } else {
        // Fallback to index-based if timestamp matching fails
        aqi = aqiData.hourly.us_aqi[safeHourIndex] || SUNSET_CONSTANTS.DEFAULT_AQI;
      }
    }
  } else if (aqiData && aqiData.hourly && aqiData.hourly.us_aqi) {
    // Old behavior: index-based (no timestamps available)
    aqi = aqiData.hourly.us_aqi[safeHourIndex] || SUNSET_CONSTANTS.DEFAULT_AQI;
  }
  
  return {
    safeHourIndex,
    weatherCode,
    cloudCoverage,
    cloudCoverageLow,
    cloudCoverageMid,
    cloudCoverageHigh,
    humidity,
    precipChance,
    visibility,
    windSpeed,
    aqi
  };
};

/**
 * Create weather object for scoring
 * @param {Object} weatherData - Extracted weather data
 * @returns {Object} Formatted weather object for scoring algorithm
 */
export const createWeatherForScoring = (weatherData) => {
  return {
    cloud_coverage: weatherData.cloudCoverage,
    cloud_coverage_low: weatherData.cloudCoverageLow,
    cloud_coverage_mid: weatherData.cloudCoverageMid,
    cloud_coverage_high: weatherData.cloudCoverageHigh,
    precipitation_chance: weatherData.precipChance,
    humidity: weatherData.humidity,
    air_quality_index: Math.round(weatherData.aqi),
    visibility: weatherData.visibility,
    wind_speed: weatherData.windSpeed
  };
};

/**
 * Process a single day's sunset data (UNIFIED for both historical and live)
 * @param {Object} params - Processing parameters
 * @returns {Object} Complete sunset data with score
 */
export const processSunsetDay = ({
  dayIndex,
  dailyData,
  hourlyData,
  aqiData = null,
  dataType = 'forecast' // 'forecast' or 'historical'
}) => {
  // Step 1: Calculate sunset hour index
  const sunsetDateTime = dailyData.sunset[dayIndex];
  const { sunsetTime, sunsetHour, sunsetHourIndex } = calculateSunsetHourIndex(sunsetDateTime, dayIndex);
  
  // Step 2: Extract weather at sunset hour
  const weatherAtSunset = extractSunsetHourWeather(hourlyData, sunsetHourIndex, aqiData);
  
  // Step 3: Debug logging (first 3 days only)
  if (dayIndex < 3) {
    logger.debug(`📅 ${dataType === 'historical' ? 'Historical' : 'Live Forecast'} Day ${dayIndex + 1}:`, {
      date: dailyData.time[dayIndex],
      sunsetDateTime: sunsetDateTime,
      sunsetTime: sunsetTime,
      sunsetHour: sunsetHour,
      sunsetHourIndex: sunsetHourIndex,
      safeHourIndex: weatherAtSunset.safeHourIndex,
      hourlyDataLength: hourlyData.time?.length || 0
    });
    
    logger.debug(`🌅 ${dataType === 'historical' ? 'Historical' : 'Live Forecast'} Sunset Conditions Day ${dayIndex + 1}:`, {
      weatherCode: weatherAtSunset.weatherCode,
      cloudCoverage: weatherAtSunset.cloudCoverage,
      cloudCoverageLow: weatherAtSunset.cloudCoverageLow,
      cloudCoverageMid: weatherAtSunset.cloudCoverageMid,
      cloudCoverageHigh: weatherAtSunset.cloudCoverageHigh,
      humidity: weatherAtSunset.humidity,
      precipChance: weatherAtSunset.precipChance,
      visibility: weatherAtSunset.visibility,
      windSpeed: weatherAtSunset.windSpeed,
      aqi: weatherAtSunset.aqi
    });
  }
  
  // Step 4: Create weather object for scoring
  const weatherForScoring = createWeatherForScoring(weatherAtSunset);
  
  // Step 5: Calculate sunset score
  const scoreResult = getSunsetQualityScore(weatherForScoring);
  
  // Step 6: Debug scoring result (first 3 days only)
  if (dayIndex < 3) {
    logger.debug(`🎯 ${dataType === 'historical' ? 'Historical' : 'Live Forecast'} Scoring Result Day ${dayIndex + 1}:`, {
      score: scoreResult.score,
      conditions: scoreResult.conditions,
      weatherForScoring: weatherForScoring
    });
  }
  
  // Return complete sunset data
  return {
    sunsetTime,
    sunsetScore: scoreResult.score,
    conditions: scoreResult.conditions,
    weatherCode: weatherAtSunset.weatherCode,
    cloudCoverage: weatherAtSunset.cloudCoverage,
    cloudCoverageLow: weatherAtSunset.cloudCoverageLow,
    cloudCoverageMid: weatherAtSunset.cloudCoverageMid,
    cloudCoverageHigh: weatherAtSunset.cloudCoverageHigh,
    humidity: weatherAtSunset.humidity,
    precipChance: weatherAtSunset.precipChance,
    visibility: weatherAtSunset.visibility,
    windSpeed: weatherAtSunset.windSpeed,
    aqi: Math.round(weatherAtSunset.aqi)
  };
};
