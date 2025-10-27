/**
 * API service for fetching weather data directly from Open-Meteo APIs
 * No caching - direct API calls only
 */

import { getForecastUrl, getAirQualityUrl } from '../config/api.js';
import { parseLocationQuery, processDayData } from './forecastDataProcessor.js';
import { buildForecastUrl, buildHistoricalUrl, buildAirQualityUrl } from '../utils/apiUrlBuilder.js';
import { logger } from '../utils/logger.js';

/**
 * Fetch live forecast data from Open-Meteo API
 * @param {string} locationQuery - Location name or coordinates
 * @param {string} customLocationName - Optional custom location name
 * @returns {Promise<Object>} - Complete forecast object
 */
export const fetchForecastData = async (locationQuery, customLocationName = null) => {
  // Step 1: Parse coordinates using utility function
  const { coords, locationName } = parseLocationQuery(locationQuery, customLocationName);

  // Step 2: Fetch weather data from Open-Meteo API
  const apiKey = (typeof globalThis.import !== 'undefined' && globalThis.import.meta && globalThis.import.meta.env && globalThis.import.meta.env.VITE_OPENMETEO_API_KEY) || '';
  const baseUrl = getForecastUrl(apiKey);
  const url = buildForecastUrl(baseUrl, coords, apiKey);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    mode: 'cors',
    credentials: 'omit'
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch forecast data: ${response.status} - ${errorText}`);
  }
  
  const apiData = await response.json();
  
  // Step 3: Fetch air quality data for 7 days (matching forecast range)
  let aqiData = null;
  try {
    const today = new Date().toISOString().split('T')[0];
    // Calculate end date (7 days from today)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 6);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const aqiBaseUrl = getAirQualityUrl(apiKey);
    const aqiUrl = buildAirQualityUrl(
      aqiBaseUrl,
      coords.latitude,
      coords.longitude,
      today,
      endDateStr, // 7 days of AQI data
      apiKey
    );
    
    const aqiResponse = await fetch(aqiUrl);
    if (aqiResponse.ok) {
      aqiData = await aqiResponse.json();
      logger.debug('🌫️ Live Forecast AQI Data:', {
        hasData: !!aqiData,
        hasHourly: !!aqiData?.hourly,
        hasUsAqi: !!aqiData?.hourly?.us_aqi,
        aqiLength: aqiData?.hourly?.us_aqi?.length
      });
    }
  } catch (error) {
    logger.debug('⚠️ Could not fetch AQI data for live forecast:', error);
  }
  
  // Step 4: Process the data using utility functions (with AQI data)
  const days = [];
  
  // Check if today's sunset has passed - if so, we should use historical data for Day 0
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  const firstDayDate = apiData.daily.time[0];
  const isTodayFirstDay = firstDayDate === todayDateStr;
  const todaySunsetTime = isTodayFirstDay ? new Date(apiData.daily.sunset[0]) : null;
  const sunsetHasPassed = todaySunsetTime && now > todaySunsetTime;
  
  // If sunset has passed today, fetch historical data for today only
  let historicalTodayData = null;
  if (sunsetHasPassed) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  SUNSET HAS PASSED - SWITCHING TO HISTORICAL DATA');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Current Time:', now.toLocaleTimeString('en-US', { hour12: false }));
    console.log('Sunset Time:', todaySunsetTime.toLocaleTimeString('en-US', { hour12: false }));
    console.log('Time Since Sunset:', Math.round((now - todaySunsetTime) / 1000 / 60), 'minutes ago');
    console.log('───────────────────────────────────────────────────────────');
    
    try {
      console.log('🔄 Fetching ACTUAL weather observations from Historical API...');
      const historicalUrl = buildHistoricalUrl(
        'https://archive-api.open-meteo.com/v1/archive',
        coords.latitude,
        coords.longitude,
        todayDateStr,
        todayDateStr,
        ''
      );
      
      const historicalResponse = await fetch(historicalUrl);
      if (historicalResponse.ok) {
        historicalTodayData = await historicalResponse.json();
        console.log('✅ Historical data fetched - will use REAL observations');
      }
    } catch (error) {
      console.warn('❌ Could not fetch historical data, falling back to forecast:', error.message);
    }
  }
  
  for (let i = 0; i < apiData.daily.time.length; i++) {
    // For Day 0 (today) after sunset, use historical data if available
    if (i === 0 && sunsetHasPassed && historicalTodayData) {
      const dayData = processDayData(historicalTodayData, 0, historicalTodayData.hourly, aqiData);
      dayData._dataSource = 'historical'; // Mark that this came from historical data
      days.push(dayData);
      
      console.log('📊 TODAY\'S SCORE (from actual observations):');
      console.log('   Score:', dayData.sunset_score + '/100');
      console.log('   High Clouds:', dayData.cloud_coverage_high + '%');
      console.log('   Mid Clouds:', dayData.cloud_coverage_mid + '%');
      console.log('   Low Clouds:', dayData.cloud_coverage_low + '%');
      console.log('   Humidity:', dayData.humidity + '%');
      console.log('   Data Source: HISTORICAL (actual weather)');
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      // Use forecast data as normal
      const dayData = processDayData(apiData, i, apiData.hourly, aqiData);
      dayData._dataSource = 'forecast'; // Mark that this came from forecast
      days.push(dayData);
    }
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  return {
    location: locationName,
    latitude: coords.latitude,
    longitude: coords.longitude,
    days: days,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Fetch historical weather data directly from Open-Meteo Archive API
 * NOTE: Historical API requires Professional plan or higher
 * Currently using free Archive API with rate limits
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} - Historical weather data object
 */
export const fetchHistoricalWeatherData = async (latitude, longitude) => {
  // Use current year from January 1st until today
  const year = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
  
  logger.debug('🔍 Fetching Historical Weather Data:', {
    latitude,
    longitude,
    year,
    today,
    startDate: `${year}-01-01`,
    endDate: today
  });
  
  // NOTE: Current plan (Hobbyist) doesn't include historical API access
  // Using free Archive API - may hit rate limits
  // To upgrade: https://open-meteo.com/en/pricing (Professional plan)
  const apiKey = ''; // Not using API key for historical data (not included in plan)
  
  const url = buildHistoricalUrl(
    'https://archive-api.open-meteo.com/v1/archive',
    latitude,
    longitude,
    `${year}-01-01`,
    today,
    apiKey
  );
  
  logger.debug('🌐 Historical API URL:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    mode: 'cors',
    credentials: 'omit'
  });
  
  logger.debug('📡 Historical API Response:', {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    logger.error('❌ Historical API Error:', errorText);
    throw new Error(`Historical weather data fetch failed: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  logger.debug('📊 Historical API Data:', {
    hasDaily: !!data.daily,
    hasHourly: !!data.hourly,
    dailyLength: data.daily?.time?.length,
    hourlyLength: data.hourly?.time?.length
  });
  return data;
};

/**
 * Fetch historical air quality data from Open-Meteo Archive API
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} - Historical air quality data object
 */
export const fetchHistoricalAirQualityData = async (latitude, longitude) => {
  // Open-Meteo Archive API doesn't support historical air quality data
  // Use the current air quality API instead for the current year
  const year = new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = new Date().toISOString().split('T')[0]; // Today's date
  
  // Add API key if using Open-Meteo Commercial (set in environment variable)
  const apiKey = (typeof globalThis.import !== 'undefined' && globalThis.import.meta && globalThis.import.meta.env && globalThis.import.meta.env.VITE_OPENMETEO_API_KEY) || '';
  
  // Use customer API URL if API key is provided
  const baseUrl = getAirQualityUrl(apiKey);
  
  const url = buildAirQualityUrl(
    baseUrl,
    latitude,
    longitude,
    startDate,
    endDate,
    apiKey
  );
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Historical air quality data fetch failed: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  
  // DEBUG: Log air quality data for Sep 7
  logger.debug('🌫️ Air Quality API Response:', {
    url: url,
    hasData: !!data,
    hasHourly: !!data.hourly,
    hasUsAqi: !!data.hourly?.us_aqi,
    aqiLength: data.hourly?.us_aqi?.length,
    sampleAqi: data.hourly?.us_aqi?.slice(0, 5),
    sep7Aqi: data.hourly?.us_aqi?.[5995] // Index for Sep 7, 18:46
  });
  
  return data;
};