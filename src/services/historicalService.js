/**
 * Unified historical service with intelligent caching
 * Uses backend cache server for historical data to avoid redundant API calls
 */

import { fetchHistoricalWeatherData, fetchHistoricalAirQualityData } from './apiService.js';
import { processHistoricalSunsetData, getTop10Sunsets, getScoreStatistics } from './dataProcessingService.js';
import { logger } from '../utils/logger.js';

// Cache server configuration
// Empty string means use same origin (production), localhost for development
const CACHE_SERVER_URL = import.meta.env.VITE_CACHE_SERVER_URL !== undefined 
  ? import.meta.env.VITE_CACHE_SERVER_URL 
  : 'http://localhost:3001';
const USE_CACHE_SERVER = import.meta.env.VITE_USE_CACHE === 'true';

/**
 * Fetch historical data from cache server (if available) or fallback to direct API
 */
async function fetchHistoricalWithCache(location, startDate, endDate) {
  if (!USE_CACHE_SERVER) {
    logger.debug('Cache server disabled, using direct API');
    return null;
  }
  
  try {
    const url = `${CACHE_SERVER_URL}/api/historical?` + new URLSearchParams({
      latitude: location.latitude,
      longitude: location.longitude,
      startDate,
      endDate,
      location: location.name || `${location.latitude},${location.longitude}`
    });
    
    logger.debug(`🔍 Checking cache server: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Cache server returned ${response.status}`);
    }
    
    const data = await response.json();
    logger.debug(`✅ Cache server response:`, {
      fromCache: data.metadata?.fromCache,
      totalDays: data.metadata?.totalDays,
      newFetched: data.metadata?.newDaysFetched
    });
    
    return data;
    
  } catch (error) {
    logger.debug(`⚠️  Cache server unavailable, falling back to direct API:`, error.message);
    return null;
  }
}

/**
 * Fetch and process historical sunset data with progress updates
 * @param {Object} location - Location object with lat, lon, name
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} - Complete historical forecast object
 */
export const fetchHistoricalForecastWithProgress = async (location, onProgress) => {
  const year = new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  try {
    // Progress: Starting
    onProgress({ stage: 'starting', progress: 0 });
    
    // Try to get data from cache server first
    onProgress({ stage: 'checking_cache', progress: 10 });
    const cachedData = await fetchHistoricalWithCache(location, startDate, endDate);
    
    let weatherData, aqiData, processedData;
    
    if (cachedData && cachedData.metadata?.cached) {
      // We have cached RAW data - process it
      logger.debug(`📦 Using cached raw data, processing locally`);
      onProgress({ stage: 'loading_from_cache', progress: 50 });
      
      weatherData = cachedData.weather;
      aqiData = cachedData.aqi;
      
      // Progress: Processing cached data
      onProgress({ stage: 'processing_data', progress: 75 });
      processedData = processHistoricalSunsetData(weatherData, aqiData, location, year);
      
    } else {
      // No cache or cache miss - fetch from API
      logger.debug('🌐 Fetching fresh data from API');
      
      // Progress: Fetching weather data
      onProgress({ stage: 'fetching_weather', progress: 25 });
      weatherData = await fetchHistoricalWeatherData(location.latitude, location.longitude);
      
      // Progress: Fetching air quality data
      onProgress({ stage: 'fetching_aqi', progress: 50 });
      aqiData = await fetchHistoricalAirQualityData(location.latitude, location.longitude);
      
      // Progress: Processing data
      onProgress({ stage: 'processing_data', progress: 75 });
      processedData = processHistoricalSunsetData(weatherData, aqiData, location, year);
    }
    
    // Progress: Calculating statistics
    onProgress({ stage: 'calculating_stats', progress: 90 });
    const top10 = getTop10Sunsets(processedData);
    const statistics = getScoreStatistics(processedData);
    
    // DEBUG: Log historical service result
    logger.debug('📊 Historical Service Result:', {
      processedDataLength: processedData.length,
      top10Length: top10.length,
      sampleTop10: top10.slice(0, 3),
      statistics: statistics,
      usedCache: !!cachedData
    });
    
    // Progress: Complete
    onProgress({ stage: 'complete', progress: 100 });
    
    const result = {
      location,
      year,
      days: processedData,
      top10,
      statistics,
      lastUpdated: new Date().toISOString(),
      metadata: {
        usedCache: !!cachedData,
        totalDays: processedData.length
      }
    };
    
    return result;
    
  } catch (error) {
    throw error;
  }
};