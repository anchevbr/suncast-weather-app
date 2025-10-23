/**
 * Unified API service for all weather and sunset data
 * Handles both live and historical data fetching
 */

/**
 * Fetch live forecast data from backend API
 * @param {string} locationQuery - Location name or coordinates
 * @param {string} customLocationName - Optional custom location name
 * @returns {Promise<Object>} - Complete forecast object
 */
export const fetchForecastData = async (locationQuery, customLocationName = null) => {
  // Step 1: Parse coordinates
  let coords;
  let locationName;
  
  const coordMatch = locationQuery.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    coords = {
      latitude: parseFloat(coordMatch[1]),
      longitude: parseFloat(coordMatch[2]),
      name: customLocationName ? customLocationName.split(',')[0] : 'Current Location',
      country: customLocationName ? customLocationName.split(',').slice(1).join(',').trim() : ''
    };
    locationName = customLocationName || 'Current Location';
  } else {
    throw new Error('Location must be provided as coordinates or through autocomplete');
  }

  // Step 2: Fetch from Open-Meteo API directly
  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${coords.latitude}&` +
    `longitude=${coords.longitude}&` +
    `daily=weather_code,temperature_2m_max,temperature_2m_min,sunset,sunrise&` +
    `hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,visibility,wind_speed_10m&` +
    `timezone=auto`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    mode: 'cors',
    credentials: 'omit'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch forecast data: ${response.status}`);
  }
  
  const apiData = await response.json();
  
  // Process the data to match expected format
  const days = [];
  for (let i = 0; i < apiData.daily.time.length; i++) {
    days.push({
      date: apiData.daily.time[i],
      weather_code: apiData.daily.weather_code[i],
      temperature_max: apiData.daily.temperature_2m_max[i],
      temperature_min: apiData.daily.temperature_2m_min[i],
      sunset: apiData.daily.sunset[i],
      sunrise: apiData.daily.sunrise[i]
    });
  }
  
  return {
    location: locationName,
    latitude: coords.latitude,
    longitude: coords.longitude,
    days: days,
    cached: false,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Fetch historical weather data from backend API with Redis caching
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} - Historical weather data object
 */
export const fetchHistoricalWeatherData = async (latitude, longitude) => {
  const year = new Date().getFullYear();
  
  // Check localStorage cache first
  try {
    const cacheKey = `sunset_history_${latitude}_${longitude}_${year}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      // Check if cache is less than 24 hours old
      const cacheAge = Date.now() - new Date(parsed.lastUpdated).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (error) {
    // Cache unavailable, continue
  }
  
  // Try direct API call as fallback
  const startDate = `${year}-01-01`;
  const endDate = new Date().toISOString().split('T')[0];
  
  const url = `https://archive-api.open-meteo.com/v1/archive?` +
    `latitude=${latitude}&` +
    `longitude=${longitude}&` +
    `start_date=${startDate}&` +
    `end_date=${endDate}&` +
    `hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,visibility,wind_speed_10m&` +
    `daily=weather_code,temperature_2m_max,temperature_2m_min,sunset,sunrise&` +
    `timezone=auto`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Save to localStorage for future use
    try {
      const cacheKey = `sunset_history_${latitude}_${longitude}_${year}`;
      const cacheData = {
        location: { latitude, longitude },
        year,
        data,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      // Silently fail if localStorage is not available
    }
    
    return data;
  } catch (error) {
    throw new Error('Historical data is temporarily unavailable. Please try again later.');
  }
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
  
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?` +
    `latitude=${latitude}&` +
    `longitude=${longitude}&` +
    `start_date=${startDate}&` +
    `end_date=${endDate}&` +
    `hourly=us_aqi&` +
    `timezone=auto`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Historical air quality data fetch failed: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return data;
};
