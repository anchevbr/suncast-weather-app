import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache directory path
const CACHE_DIR = path.join(__dirname, 'cache', 'historical');
const CACHE_INDEX_FILE = path.join(CACHE_DIR, 'index.json');

// Cache configuration
const CACHE_CONFIG = {
  maxAgeMonths: 6, // Don't re-fetch data older than 6 months
  popularCities: [
    // Major cities to pre-cache
    { lat: 40.7128, lon: -74.0060, name: 'New York' },
    { lat: 51.5074, lon: -0.1278, name: 'London' },
    { lat: 48.8566, lon: 2.3522, name: 'Paris' },
    { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
    { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
    { lat: 37.9838, lon: 23.7275, name: 'Athens' },
    { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' },
    { lat: 41.9028, lon: 12.4964, name: 'Rome' },
    { lat: 55.7558, lon: 37.6173, name: 'Moscow' },
    { lat: 25.2048, lon: 55.2708, name: 'Dubai' }
  ]
};

/**
 * Initialize cache directory structure
 */
async function initializeCache() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    
    // Create index file if it doesn't exist
    try {
      await fs.access(CACHE_INDEX_FILE);
    } catch {
      await fs.writeFile(CACHE_INDEX_FILE, JSON.stringify({
        version: '1.0',
        locations: {},
        stats: {
          totalCachedDays: 0,
          lastUpdated: new Date().toISOString()
        }
      }, null, 2));
    }
    
    console.log('✅ Cache system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize cache:', error);
    throw error;
  }
}

/**
 * Generate cache key from coordinates
 */
function getCacheKey(latitude, longitude) {
  // Round to 2 decimal places to group nearby locations
  const lat = Math.round(latitude * 100) / 100;
  const lon = Math.round(longitude * 100) / 100;
  return `${lat}_${lon}`;
}

/**
 * Get cache file path for a location
 */
function getCacheFilePath(cacheKey) {
  return path.join(CACHE_DIR, `${cacheKey}.json`);
}

/**
 * Load cache index
 */
async function loadCacheIndex() {
  try {
    const data = await fs.readFile(CACHE_INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load cache index:', error);
    return {
      version: '1.0',
      locations: {},
      stats: { totalCachedDays: 0, lastUpdated: new Date().toISOString() }
    };
  }
}

/**
 * Save cache index
 */
async function saveCacheIndex(index) {
  try {
    await fs.writeFile(CACHE_INDEX_FILE, JSON.stringify(index, null, 2));
  } catch (error) {
    console.error('Failed to save cache index:', error);
  }
}

/**
 * Get cached historical data for a location
 * Converts human-readable format back to API format
 */
async function getCachedData(latitude, longitude) {
  const cacheKey = getCacheKey(latitude, longitude);
  const cacheFile = getCacheFilePath(cacheKey);
  
  try {
    const data = await fs.readFile(cacheFile, 'utf-8');
    const cached = JSON.parse(data);
    
    // Convert from CSV-like format back to API format
    const convertToApiFormat = (rows, timeKey = 'date') => {
      if (!rows || rows.length === 0) return null;
      
      const result = {};
      const keys = Object.keys(rows[0]);
      
      keys.forEach(key => {
        result[key === timeKey ? 'time' : key] = rows.map(row => row[key]);
      });
      
      return result;
    };
    
    const apiFormat = {
      location: cached.location,
      cachedAt: cached.cachedAt,
      metadata: cached.metadata,
      daily: convertToApiFormat(cached.daily, 'date'),
      hourly: convertToApiFormat(cached.hourly, 'time'),
      aqi: cached.aqi ? convertToApiFormat(cached.aqi, 'time') : null
    };
    
    const totalDays = cached.daily?.length || 0;
    console.log(`📦 Cache hit for ${cacheKey} - ${totalDays} days cached`);
    return apiFormat;
  } catch (error) {
    console.log(`📭 Cache miss for ${cacheKey}`);
    return null;
  }
}

/**
 * Save historical data to cache
 * Now stores RAW API data (daily, hourly, aqi) in human-readable format
 */
async function saveCachedData(latitude, longitude, locationName, data) {
  const cacheKey = getCacheKey(latitude, longitude);
  const cacheFile = getCacheFilePath(cacheKey);
  
  try {
    // Calculate total days from raw daily data
    const totalDays = data.daily?.time?.length || 0;
    const dateRange = totalDays > 0 ? {
      start: data.daily.time[0],
      end: data.daily.time[totalDays - 1]
    } : null;
    
    // Transform data into more readable format (like CSV rows)
    const dailyData = [];
    if (data.daily && data.daily.time) {
      for (let i = 0; i < data.daily.time.length; i++) {
        const dayData = { date: data.daily.time[i] };
        
        // Add all daily fields for this date
        Object.keys(data.daily).forEach(key => {
          if (key !== 'time') {
            dayData[key] = data.daily[key][i];
          }
        });
        
        dailyData.push(dayData);
      }
    }
    
    // Transform hourly data into readable rows
    const hourlyData = [];
    if (data.hourly && data.hourly.time) {
      for (let i = 0; i < data.hourly.time.length; i++) {
        const hourData = { time: data.hourly.time[i] };
        
        // Add all hourly fields for this time
        Object.keys(data.hourly).forEach(key => {
          if (key !== 'time') {
            hourData[key] = data.hourly[key][i];
          }
        });
        
        hourlyData.push(hourData);
      }
    }
    
    // Transform AQI data into readable rows
    const aqiData = [];
    if (data.aqi && data.aqi.time) {
      for (let i = 0; i < data.aqi.time.length; i++) {
        const aqiHour = { time: data.aqi.time[i] };
        
        // Add all AQI fields for this time
        Object.keys(data.aqi).forEach(key => {
          if (key !== 'time') {
            aqiHour[key] = data.aqi[key][i];
          }
        });
        
        aqiData.push(aqiHour);
      }
    }
    
    const cacheData = {
      location: {
        name: locationName,
        latitude,
        longitude,
        cacheKey
      },
      cachedAt: new Date().toISOString(),
      metadata: {
        totalDays,
        dateRange
      },
      // Human-readable data organized like CSV rows
      daily: dailyData,
      hourly: hourlyData,
      aqi: aqiData.length > 0 ? aqiData : null
    };
    
    // Save with pretty formatting (2 spaces indentation)
    await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    
    // Update index
    const index = await loadCacheIndex();
    index.locations[cacheKey] = {
      name: locationName,
      latitude,
      longitude,
      lastUpdated: new Date().toISOString(),
      totalDays
    };
    index.stats.totalCachedDays = Object.values(index.locations).reduce(
      (sum, loc) => sum + (loc.totalDays || 0), 0
    );
    index.stats.lastUpdated = new Date().toISOString();
    
    await saveCacheIndex(index);
    
    console.log(`💾 Cached ${totalDays} days for ${locationName} (${cacheKey})`);
    return true;
  } catch (error) {
    console.error('Failed to save cache:', error);
    return false;
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  try {
    const index = await loadCacheIndex();
    const files = await fs.readdir(CACHE_DIR);
    const cacheFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');
    
    return {
      totalLocations: Object.keys(index.locations).length,
      totalCachedDays: index.stats.totalCachedDays,
      totalFiles: cacheFiles.length,
      lastUpdated: index.stats.lastUpdated,
      locations: Object.values(index.locations).map(loc => ({
        name: loc.name,
        totalDays: loc.totalDays,
        lastUpdated: loc.lastUpdated
      }))
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return null;
  }
}

/**
 * Clear cache for a specific location
 */
async function clearLocationCache(latitude, longitude) {
  const cacheKey = getCacheKey(latitude, longitude);
  const cacheFile = getCacheFilePath(cacheKey);
  
  try {
    await fs.unlink(cacheFile);
    
    const index = await loadCacheIndex();
    delete index.locations[cacheKey];
    await saveCacheIndex(index);
    
    console.log(`🗑️  Cleared cache for ${cacheKey}`);
    return true;
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return false;
  }
}

/**
 * Clear all cache
 */
async function clearAllCache() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const cacheFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');
    
    for (const file of cacheFiles) {
      await fs.unlink(path.join(CACHE_DIR, file));
    }
    
    await fs.writeFile(CACHE_INDEX_FILE, JSON.stringify({
      version: '1.0',
      locations: {},
      stats: { totalCachedDays: 0, lastUpdated: new Date().toISOString() }
    }, null, 2));
    
    console.log(`🗑️  Cleared all cache (${cacheFiles.length} files)`);
    return true;
  } catch (error) {
    console.error('Failed to clear all cache:', error);
    return false;
  }
}

export {
  initializeCache,
  getCacheKey,
  getCachedData,
  saveCachedData,
  getCacheStats,
  clearLocationCache,
  clearAllCache,
  CACHE_CONFIG
};
