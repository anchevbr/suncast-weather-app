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
 */
async function getCachedData(latitude, longitude) {
  const cacheKey = getCacheKey(latitude, longitude);
  const cacheFile = getCacheFilePath(cacheKey);
  
  try {
    const data = await fs.readFile(cacheFile, 'utf-8');
    const cached = JSON.parse(data);
    
    console.log(`📦 Cache hit for ${cacheKey} - ${cached.days?.length || 0} days cached`);
    return cached;
  } catch (error) {
    console.log(`📭 Cache miss for ${cacheKey}`);
    return null;
  }
}

/**
 * Save historical data to cache
 */
async function saveCachedData(latitude, longitude, locationName, data) {
  const cacheKey = getCacheKey(latitude, longitude);
  const cacheFile = getCacheFilePath(cacheKey);
  
  try {
    const cacheData = {
      location: {
        name: locationName,
        latitude,
        longitude,
        cacheKey
      },
      cachedAt: new Date().toISOString(),
      days: data.days || [],
      metadata: {
        totalDays: data.days?.length || 0,
        dateRange: {
          start: data.days?.[0]?.date,
          end: data.days?.[data.days.length - 1]?.date
        }
      }
    };
    
    await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    
    // Update index
    const index = await loadCacheIndex();
    index.locations[cacheKey] = {
      name: locationName,
      latitude,
      longitude,
      lastUpdated: new Date().toISOString(),
      totalDays: cacheData.metadata.totalDays
    };
    index.stats.totalCachedDays = Object.values(index.locations).reduce(
      (sum, loc) => sum + (loc.totalDays || 0), 0
    );
    index.stats.lastUpdated = new Date().toISOString();
    
    await saveCacheIndex(index);
    
    console.log(`💾 Cached ${cacheData.metadata.totalDays} days for ${locationName} (${cacheKey})`);
    return true;
  } catch (error) {
    console.error('Failed to save cache:', error);
    return false;
  }
}

/**
 * Determine which dates need to be fetched (not in cache)
 */
async function getMissingDates(latitude, longitude, requestedStartDate, requestedEndDate) {
  const cached = await getCachedData(latitude, longitude);
  
  if (!cached || !cached.days || cached.days.length === 0) {
    // No cache, fetch everything
    return { startDate: requestedStartDate, endDate: requestedEndDate, cachedData: null };
  }
  
  // Get cached date range
  const cachedDates = new Set(cached.days.map(day => day.date));
  const requested = {
    start: new Date(requestedStartDate),
    end: new Date(requestedEndDate)
  };
  
  // Find missing dates
  const missingDates = [];
  let current = new Date(requested.start);
  
  while (current <= requested.end) {
    const dateStr = current.toISOString().split('T')[0];
    if (!cachedDates.has(dateStr)) {
      missingDates.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }
  
  if (missingDates.length === 0) {
    console.log(`✅ All requested dates already cached`);
    return { startDate: null, endDate: null, cachedData: cached };
  }
  
  // Find continuous date ranges to fetch
  const newStartDate = missingDates[0];
  const newEndDate = missingDates[missingDates.length - 1];
  
  console.log(`📅 Need to fetch ${missingDates.length} missing dates: ${newStartDate} to ${newEndDate}`);
  
  return { 
    startDate: newStartDate, 
    endDate: newEndDate, 
    cachedData: cached,
    missingDatesCount: missingDates.length
  };
}

/**
 * Merge new data with cached data
 */
async function mergeCachedData(latitude, longitude, locationName, newData) {
  const cached = await getCachedData(latitude, longitude);
  
  if (!cached || !cached.days) {
    // No existing cache, save as new
    return await saveCachedData(latitude, longitude, locationName, newData);
  }
  
  // Merge days, avoiding duplicates
  const existingDates = new Set(cached.days.map(day => day.date));
  const newDays = newData.days.filter(day => !existingDates.has(day.date));
  
  const mergedData = {
    days: [...cached.days, ...newDays].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    )
  };
  
  console.log(`🔄 Merging ${newDays.length} new days with ${cached.days.length} cached days`);
  
  return await saveCachedData(latitude, longitude, locationName, mergedData);
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
  getMissingDates,
  mergeCachedData,
  getCacheStats,
  clearLocationCache,
  clearAllCache,
  CACHE_CONFIG
};
