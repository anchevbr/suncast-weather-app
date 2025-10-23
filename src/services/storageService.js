/**
 * Unified storage service for managing all cached data
 * Handles both localStorage and Redis caching
 */

/**
 * Save historical sunset data to localStorage
 * @param {Object} location - Location object with lat, lon, name
 * @param {number} year - Year of the data
 * @param {Array} data - Historical sunset data
 * @returns {void}
 */
export const saveHistoricalData = (location, year, data) => {
  const key = `sunset_history_${location.latitude}_${location.longitude}_${year}`;
  const storageData = {
    location,
    year,
    data,
    lastUpdated: new Date().toISOString(),
    version: '1.0'
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(storageData));
  } catch (error) {
    // Silently fail if localStorage is not available
  }
};

/**
 * Get historical sunset data from localStorage
 * @param {Object} location - Location object with lat, lon, name
 * @param {number} year - Year of the data
 * @returns {Object|null} - Stored data or null if not found
 */
export const getHistoricalData = (location, year) => {
  const key = `sunset_history_${location.latitude}_${location.longitude}_${year}`;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if stored data is stale (older than 24 hours)
 * @param {Object} storedData - Stored data object
 * @returns {boolean} - True if data is stale
 */
export const isDataStale = (storedData) => {
  if (!storedData || !storedData.lastUpdated) {
    return true;
  }
  
  const lastUpdated = new Date(storedData.lastUpdated);
  const now = new Date();
  const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
  
  return hoursDiff > 24; // 24 hours
};

/**
 * Get fresh historical data (not stale)
 * @param {Object} location - Location object
 * @param {number} year - Year
 * @returns {Object|null} - Fresh data or null if stale/not found
 */
export const getFreshHistoricalData = (location, year) => {
  // First try exact match
  const stored = getHistoricalData(location, year);
  
  if (stored && !isDataStale(stored)) {
    return stored;
  }
  
  // If no exact match, try finding nearby cached data (within ~1km)
  try {
    const keys = getStoredKeys();
    const yearStr = `_${year}`;
    
    for (const key of keys) {
      if (!key.endsWith(yearStr)) continue;
      
      // Extract lat/lon from key: sunset_history_{lat}_{lon}_{year}
      const parts = key.replace('sunset_history_', '').split('_');
      if (parts.length < 3) continue;
      
      const cachedLat = parseFloat(parts[0]);
      const cachedLon = parseFloat(parts[1]);
      
      // Check if coordinates are close (within 0.01 degrees ~ 1km)
      const latDiff = Math.abs(location.latitude - cachedLat);
      const lonDiff = Math.abs(location.longitude - cachedLon);
      
      if (latDiff < 0.01 && lonDiff < 0.01) {
        const cachedData = JSON.parse(localStorage.getItem(key));
        if (cachedData && !isDataStale(cachedData)) {
          return cachedData;
        }
      }
    }
  } catch (error) {
    // If nearby search fails, return null
  }
  
  return null;
};

/**
 * Clear historical data for a specific location and year
 * @param {Object} location - Location object
 * @param {number} year - Year
 * @returns {void}
 */
export const clearHistoricalData = (location, year) => {
  const key = `sunset_history_${location.latitude}_${location.longitude}_${year}`;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Silently fail if localStorage is not available
  }
};

/**
 * Get all stored historical data keys
 * @returns {Array} - Array of keys
 */
export const getStoredKeys = () => {
  const keys = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sunset_history_')) {
        keys.push(key);
      }
    }
  } catch (error) {
    // Silently fail if localStorage is not available
  }
  
  return keys;
};

/**
 * Get storage statistics
 * @returns {Object} - Storage statistics
 */
export const getStorageStats = () => {
  const keys = getStoredKeys();
  let totalSize = 0;
  let locationCount = 0;
  
  try {
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
        locationCount++;
      }
    });
  } catch (error) {
    // Silently fail if localStorage is not available
  }
  
  return {
    totalKeys: keys.length,
    totalSize: totalSize,
    totalSizeKB: Math.round(totalSize / 1024),
    locationCount: locationCount
  };
};

/**
 * Clear all historical sunset data from localStorage
 * @returns {void}
 */
export const clearHistoricalCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const sunsetKeys = keys.filter(key => key.startsWith('sunset_history_'));
    
    sunsetKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
  } catch (error) {
    console.error('Error clearing historical cache:', error);
  }
};
