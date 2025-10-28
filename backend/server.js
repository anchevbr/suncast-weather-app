import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import {
  initializeCache,
  getCachedData,
  saveCachedData,
  getCacheStats,
  clearLocationCache,
  clearAllCache
} from './cacheManager.js';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const OPENMETEO_API_KEY = process.env.OPENMETEO_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize cache on startup
initializeCache().catch(console.error);

/**
 * Fetch air quality data from Open-Meteo API
 */
async function fetchAirQualityFromAPI(latitude, longitude, startDate, endDate) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&hourly=us_aqi&timezone=auto`;
  
  console.log(`🌫️ Fetching air quality data: ${startDate} to ${endDate}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    mode: 'cors',
    credentials: 'omit'
  });
  
  if (!response.ok) {
    console.warn(`⚠️ Air quality API returned ${response.status}, continuing without AQI data`);
    return null;
  }
  
  return await response.json();
}

/**
 * Fetch historical data from Open-Meteo API
 */
async function fetchHistoricalFromAPI(latitude, longitude, startDate, endDate) {
  // NOTE: Using free Archive API - no API key needed for historical data
  // The commercial API key is only for forecast data
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunset,sunrise&timezone=auto`;
  
  console.log(`🌐 Fetching from Open-Meteo Archive API: ${startDate} to ${endDate}`);
  
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
    console.error(`❌ API Error (${response.status}):`, errorText);
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Process raw API data - Just pass through the raw data structure
 * The frontend will handle all the sunset scoring logic
 */
function processHistoricalData(rawData, aqiData) {
  const { daily, hourly } = rawData;
  
  if (!daily || !daily.time) {
    return { days: [] };
  }
  
  // Return the raw data structure that matches what the frontend expects
  return {
    daily: rawData.daily,
    hourly: rawData.hourly,
    aqi: aqiData?.hourly || null
  };
}

/**
 * Get weather conditions from code
 */
function getConditionsFromWeatherCode(code) {
  if (code === undefined || code === null) return 'Unknown';
  
  const conditions = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Light Showers',
    81: 'Showers',
    82: 'Heavy Showers',
    85: 'Light Snow Showers',
    86: 'Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Hail'
  };
  
  return conditions[code] || 'Unknown';
}

/**
 * API endpoint: Get historical data with simple caching
 */
app.get('/api/historical', async (req, res) => {
  try {
    const { latitude, longitude, startDate, endDate, location } = req.query;
    
    if (!latitude || !longitude || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: latitude, longitude, startDate, endDate' 
      });
    }
    
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const locationName = location || `${lat},${lon}`;
    
    // Limit end date to today (Archive API constraint)
    const today = new Date().toISOString().split('T')[0];
    const actualEndDate = endDate > today ? today : endDate;
    
    console.log(`\n🔍 Request: ${locationName} (${startDate} to ${actualEndDate})`);
    
    // Check cache first
    const cachedData = await getCachedData(lat, lon);
    
    if (cachedData) {
      console.log(`✅ Serving from cache`);
      return res.json({
        weather: { daily: cachedData.daily, hourly: cachedData.hourly },
        aqi: cachedData.aqi,
        metadata: { fromCache: true, location: cachedData.location }
      });
    }
    
    // No cache - fetch from API
    console.log(`🌐 Fetching from API...`);
    const rawWeatherData = await fetchHistoricalFromAPI(lat, lon, startDate, actualEndDate);
    const rawAqiData = await fetchAirQualityFromAPI(lat, lon, startDate, actualEndDate);
    
    // Store raw data
    const rawData = processHistoricalData(rawWeatherData, rawAqiData);
    await saveCachedData(lat, lon, locationName, rawData);
    
    console.log(`✅ Data cached and returned`);
    
    res.json({
      weather: { daily: rawData.daily, hourly: rawData.hourly },
      aqi: rawData.aqi,
      metadata: { fromCache: false }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch historical data',
      details: error.message 
    });
  }
});

/**
 * API endpoint: Get cache statistics
 */
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Suncast Cache Server running on port ${PORT}`);
  console.log(`📊 Cache stats: http://localhost:${PORT}/api/cache/stats`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
