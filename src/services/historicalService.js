/**
 * Unified historical service that orchestrates all historical sunset data
 * This is the main service that other components should use
 */

import { fetchHistoricalWeatherData, fetchHistoricalAirQualityData } from './apiService.js';
import { processHistoricalSunsetData, getTop10Sunsets, getScoreStatistics } from './dataProcessingService.js';
import { saveHistoricalData, getFreshHistoricalData } from './storageService.js';

/**
 * Fetch and process historical sunset data for a location (current year only)
 * @param {Object} location - Location object with lat, lon, name
 * @param {boolean} forceRefresh - Force refresh even if cached data exists
 * @returns {Promise<Object>} - Complete historical forecast object
 */
export const fetchHistoricalForecast = async (location, forceRefresh = false) => {
  const year = new Date().getFullYear();
  
  // Check for cached data first (unless force refresh)
  if (!forceRefresh) {
    const cachedData = getFreshHistoricalData(location, year);
    if (cachedData) {
      // Process cached data to get top10 and statistics
      const top10 = getTop10Sunsets(cachedData.data);
      const statistics = getScoreStatistics(cachedData.data);
      
      return {
        ...cachedData,
        top10,
        statistics,
        cached: true
      };
    }
  }
  
  try {
    // Fetch historical weather data
    const weatherData = await fetchHistoricalWeatherData(location.latitude, location.longitude, year);
    
    // Fetch historical air quality data (optional)
    const aqiData = await fetchHistoricalAirQualityData(location.latitude, location.longitude, year);
    
    // Process the data to get daily sunset scores
    const processedData = processHistoricalSunsetData(weatherData, aqiData, location, year);
    
    // Save to localStorage for future use
    saveHistoricalData(location, year, processedData);
    
    // Get top 10 sunsets and statistics
    const top10 = getTop10Sunsets(processedData);
    const statistics = getScoreStatistics(processedData);
    
    return {
      location,
      year,
      days: processedData,
      top10,
      statistics,
      cached: false,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    throw error;
  }
};

/**
 * Get historical forecast data with loading states (current year only)
 * @param {Object} location - Location object with lat, lon, name
 * @param {Function} onProgress - Progress callback function
 * @param {boolean} forceRefresh - Force refresh even if cached data exists
 * @returns {Promise<Object>} - Complete historical forecast object
 */
export const fetchHistoricalForecastWithProgress = async (location, onProgress, forceRefresh = false) => {
  const year = new Date().getFullYear();
  
  // Check for cached data first (unless force refresh)
  if (!forceRefresh) {
    const cachedData = getFreshHistoricalData(location, year);
    if (cachedData) {
      // Process cached data to get top10 and statistics
      const top10 = getTop10Sunsets(cachedData.data);
      const statistics = getScoreStatistics(cachedData.data);
      
      return {
        ...cachedData,
        top10,
        statistics,
        cached: true
      };
    }
  }
  
  try {
    // Progress: Starting
    onProgress({ stage: 'starting', progress: 0 });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Progress: Fetching weather data
    onProgress({ stage: 'fetching_weather', progress: 25 });
    const weatherData = await fetchHistoricalWeatherData(location.latitude, location.longitude, year);
    
    // Progress: Fetching AQI data
    onProgress({ stage: 'fetching_aqi', progress: 50 });
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const aqiData = await fetchHistoricalAirQualityData(location.latitude, location.longitude, year);
    
    // Progress: Processing data
    onProgress({ stage: 'processing_data', progress: 75 });
    const processedData = processHistoricalSunsetData(weatherData, aqiData, location, year);
    
    // Save to localStorage for future use
    saveHistoricalData(location, year, processedData);
    
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
      cached: false,
      lastUpdated: new Date().toISOString()
    };
    
    return result;
    
  } catch (error) {
    // If API fails (429 rate limit), try to use any available cached data
    const fallbackData = getHistoricalData(location, year);
    if (fallbackData) {
      const top10 = getTop10Sunsets(fallbackData.data);
      const statistics = getScoreStatistics(fallbackData.data);
      
      return {
        ...fallbackData,
        top10,
        statistics,
        cached: true,
        fallback: true
      };
    }
    
    // If no cache available, throw the original error
    throw error;
  }
};
