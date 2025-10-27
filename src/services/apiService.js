/**
 * API service for fetching weather data directly from Open-Meteo APIs
 * No caching - direct API calls only
 */

import { getForecastUrl, getAirQualityUrl } from '../config/api.js';
import { parseLocationQuery, processDayData } from './forecastDataProcessor.js';

/**
 * Build forecast API URL with proper parameter encoding
 * @param {string} baseUrl - Base API URL
 * @param {Object} coords - Coordinates object with latitude and longitude
 * @param {string} apiKey - Optional API key
 * @returns {string} Complete API URL
 */
const buildForecastUrl = (baseUrl, coords, apiKey = '') => {
  const params = new URLSearchParams({
    latitude: coords.latitude,
    longitude: coords.longitude,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunset,sunrise',
    hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,wind_speed_10m',
    timezone: 'auto'
  });
  
  if (apiKey) {
    params.append('apikey', apiKey);
  }
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Build historical weather API URL with proper parameter encoding
 * @param {string} baseUrl - Base API URL
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} apiKey - Optional API key
 * @returns {string} Complete API URL
 */
const buildHistoricalUrl = (baseUrl, latitude, longitude, startDate, endDate, apiKey = '') => {
  const params = new URLSearchParams({
    latitude,
    longitude,
    start_date: startDate,
    end_date: endDate,
    hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunset,sunrise',
    timezone: 'auto'
  });
  
  if (apiKey) {
    params.append('apikey', apiKey);
  }
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Build air quality API URL with proper parameter encoding
 * @param {string} baseUrl - Base API URL
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} apiKey - Optional API key
 * @returns {string} Complete API URL
 */
const buildAirQualityUrl = (baseUrl, latitude, longitude, startDate, endDate, apiKey = '') => {
  const params = new URLSearchParams({
    latitude,
    longitude,
    start_date: startDate,
    end_date: endDate,
    hourly: 'us_aqi',
    timezone: 'auto'
  });
  
  if (apiKey) {
    params.append('apikey', apiKey);
  }
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Fetch live forecast data from Open-Meteo API
 * @param {string} locationQuery - Location name or coordinates
 * @param {string} customLocationName - Optional custom location name
 * @returns {Promise<Object>} - Complete forecast object
 */
export const fetchForecastData = async (locationQuery, customLocationName = null) => {
  // Step 1: Parse coordinates using utility function
  const { coords, locationName } = parseLocationQuery(locationQuery, customLocationName);

  // Step 2: Fetch from Open-Meteo API directly
  const apiKey = import.meta.env.VITE_OPENMETEO_API_KEY || '';
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
  
  // DEBUG: Log overall API data structure
  console.log(`📊 Live Forecast API Data Structure:`, {
    location: locationName,
    coords: coords,
    hasDailyData: !!apiData.daily,
    hasHourlyData: !!apiData.hourly,
    dailyTimeLength: apiData.daily?.time?.length,
    hourlyTimeLength: apiData.hourly?.time?.length,
    hasSunsetData: !!apiData.daily?.sunset,
    firstSunsetTime: apiData.daily?.sunset?.[0],
    sampleHourlyTime: apiData.hourly?.time?.slice(0, 3)
  });
  
  // Step 3: Process the data using utility functions
  const days = [];
  for (let i = 0; i < apiData.daily.time.length; i++) {
    // Process day data using ACTUAL SUNSET HOUR CONDITIONS
    const dayData = processDayData(apiData, i, apiData.hourly);
    days.push(dayData);
  }
  
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
  
  console.log('🔍 Fetching Historical Weather Data:', {
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
  
  console.log('🌐 Historical API URL:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    mode: 'cors',
    credentials: 'omit'
  });
  
  console.log('📡 Historical API Response:', {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Historical API Error:', errorText);
    throw new Error(`Historical weather data fetch failed: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('📊 Historical API Data:', {
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
  const apiKey = import.meta.env.VITE_OPENMETEO_API_KEY || '';
  
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
  return data;
};