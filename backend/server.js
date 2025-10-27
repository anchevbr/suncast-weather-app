import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initializeCache,
  getCachedData,
  saveCachedData,
  getMissingDates,
  mergeCachedData,
  getCacheStats
} from './cacheManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize cache on startup
initializeCache().catch(console.error);

/**
 * Fetch historical data from Open-Meteo API
 */
async function fetchHistoricalFromAPI(latitude, longitude, startDate, endDate) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=sunset,sunrise,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum,weathercode&timezone=auto`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Process raw API data into sunset scores
 */
function processHistoricalData(rawData) {
  // Import your existing sunset scoring logic here
  // This should match your existing historicalService.js processing
  const { daily } = rawData;
  
  if (!daily || !daily.time) {
    return { days: [] };
  }
  
  const days = daily.time.map((date, index) => {
    // Basic processing - you should import your actual scoring logic
    const sunset = daily.sunset?.[index];
    const sunrise = daily.sunrise?.[index];
    const weatherCode = daily.weathercode?.[index];
    const tempMax = daily.temperature_2m_max?.[index];
    const tempMin = daily.temperature_2m_min?.[index];
    const precipitation = daily.precipitation_sum?.[index];
    
    // Placeholder score - replace with your actual scoring algorithm
    const sunsetScore = weatherCode !== undefined ? Math.max(0, Math.min(100, 100 - weatherCode)) : 50;
    
    return {
      date,
      sunset,
      sunrise,
      sunset_score: sunsetScore,
      weather_code: weatherCode,
      temperature_max: tempMax,
      temperature_min: tempMin,
      precipitation,
      conditions: getConditionsFromWeatherCode(weatherCode)
    };
  });
  
  return { days };
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
 * API endpoint: Get historical data with caching
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
    
    console.log(`\n🔍 Historical data request for ${locationName} (${startDate} to ${endDate})`);
    
    // Check what dates are missing from cache
    const { startDate: fetchStart, endDate: fetchEnd, cachedData, missingDatesCount } = 
      await getMissingDates(lat, lon, startDate, endDate);
    
    if (!fetchStart) {
      // All data is cached
      console.log(`✅ Serving ${cachedData.days.length} days from cache`);
      
      // Filter to requested date range
      const filteredDays = cachedData.days.filter(day => {
        return day.date >= startDate && day.date <= endDate;
      });
      
      return res.json({
        ...cachedData,
        days: filteredDays,
        metadata: {
          ...cachedData.metadata,
          fromCache: true,
          totalDays: filteredDays.length
        }
      });
    }
    
    // Fetch missing data from API
    console.log(`🌐 Fetching ${missingDatesCount} missing days from API...`);
    const rawData = await fetchHistoricalFromAPI(lat, lon, fetchStart, fetchEnd);
    const processedData = processHistoricalData(rawData);
    
    // Merge with cached data
    await mergeCachedData(lat, lon, locationName, processedData);
    
    // Load complete merged data
    const completeData = await getCachedData(lat, lon);
    
    // Filter to requested date range
    const filteredDays = completeData.days.filter(day => {
      return day.date >= startDate && day.date <= endDate;
    });
    
    console.log(`✅ Returning ${filteredDays.length} days (${processedData.days.length} newly fetched, rest from cache)`);
    
    res.json({
      ...completeData,
      days: filteredDays,
      metadata: {
        ...completeData.metadata,
        fromCache: false,
        newDaysFetched: processedData.days.length,
        totalDays: filteredDays.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching historical data:', error);
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
