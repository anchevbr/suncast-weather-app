/**
 * Unified historical service that orchestrates all historical sunset data
 * No caching - direct API calls only
 */

import { fetchHistoricalWeatherData, fetchHistoricalAirQualityData } from './apiService.js';
import { processHistoricalSunsetData, getTop10Sunsets, getScoreStatistics } from './dataProcessingService.js';

/**
 * Fetch and process historical sunset data for a location (current year only)
 * @param {Object} location - Location object with lat, lon, name
 * @returns {Promise<Object>} - Complete historical forecast object
 */
export const fetchHistoricalForecast = async (location) => {
  const year = new Date().getFullYear();
  
  try {
    // Fetch historical weather data
    const weatherData = await fetchHistoricalWeatherData(location.latitude, location.longitude);
    
    // Fetch historical air quality data (optional)
    const aqiData = await fetchHistoricalAirQualityData(location.latitude, location.longitude);
    
    // Process the data to get daily sunset scores
    const processedData = processHistoricalSunsetData(weatherData, aqiData, location, year);
    
    // Get top 10 sunsets and statistics
    const top10 = getTop10Sunsets(processedData);
    const statistics = getScoreStatistics(processedData);
    
    return {
      location,
      year,
      days: processedData,
      top10,
      statistics,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch and process historical sunset data with progress updates
 * @param {Object} location - Location object with lat, lon, name
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} - Complete historical forecast object
 */
export const fetchHistoricalForecastWithProgress = async (location, onProgress) => {
  const year = new Date().getFullYear();
  
  try {
    // Progress: Starting
    onProgress({ stage: 'starting', progress: 0 });
    
    // Progress: Fetching weather data
    onProgress({ stage: 'fetching_weather', progress: 25 });
    const weatherData = await fetchHistoricalWeatherData(location.latitude, location.longitude);
    
    // Progress: Fetching air quality data
    onProgress({ stage: 'fetching_aqi', progress: 50 });
    const aqiData = await fetchHistoricalAirQualityData(location.latitude, location.longitude);
    
    // Progress: Processing data
    onProgress({ stage: 'processing_data', progress: 75 });
    const processedData = processHistoricalSunsetData(weatherData, aqiData, location, year);
    
    // Progress: Calculating statistics
    onProgress({ stage: 'calculating_stats', progress: 90 });
    const top10 = getTop10Sunsets(processedData);
    const statistics = getScoreStatistics(processedData);
    
    // Progress: Complete
    onProgress({ stage: 'complete', progress: 100 });
    
    const result = {
      location,
      year,
      days: processedData,
      top10,
      statistics,
      lastUpdated: new Date().toISOString()
    };
    
    return result;
    
  } catch (error) {
    throw error;
  }
};