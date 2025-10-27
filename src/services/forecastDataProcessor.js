/**
 * Forecast Data Processing Utilities
 * Extracted from apiService.js for better maintainability and testability
 */

import { processSunsetDay } from './sunsetDataProcessor.js';

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
 * Now uses unified sunset processing module for consistency
 * @param {Object} apiData - Raw API data
 * @param {number} dayIndex - Day index
 * @param {Object} hourlyData - Hourly weather data
 * @param {Object} aqiData - Optional air quality data
 * @returns {Object} Processed day data
 */
export const processDayData = (apiData, dayIndex, hourlyData, aqiData = null) => {
  // Use unified sunset processing module
  const sunsetData = processSunsetDay({
    dayIndex,
    dailyData: apiData.daily,
    hourlyData,
    aqiData,
    dataType: 'forecast'
  });
  
  // Get day of week
  const dayOfWeek = new Date(apiData.daily.time[dayIndex]).toLocaleDateString('en-US', { 
    weekday: 'short' 
  });
  
  // Return complete day data
  return {
    date: apiData.daily.time[dayIndex],
    day_of_week: dayOfWeek,
    weather_code: sunsetData.weatherCode,
    temperature_max: apiData.daily.temperature_2m_max[dayIndex],
    temperature_min: apiData.daily.temperature_2m_min[dayIndex],
    sunset: apiData.daily.sunset[dayIndex],
    sunrise: apiData.daily.sunrise[dayIndex],
    sunset_time: sunsetData.sunsetTime,
    sunset_score: sunsetData.sunsetScore,
    conditions: sunsetData.conditions,
    cloud_coverage: sunsetData.cloudCoverage,
    cloud_coverage_low: sunsetData.cloudCoverageLow,
    cloud_coverage_mid: sunsetData.cloudCoverageMid,
    cloud_coverage_high: sunsetData.cloudCoverageHigh,
    humidity: sunsetData.humidity,
    precipitation_chance: sunsetData.precipChance,
    visibility: sunsetData.visibility,
    wind_speed: sunsetData.windSpeed
  };
};
