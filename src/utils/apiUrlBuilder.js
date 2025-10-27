/**
 * API URL Building Utilities
 * Centralized URL construction for API requests
 */

/**
 * Build forecast API URL with proper parameter encoding
 * CRITICAL: Uses forecast_days=7 to ensure we ALWAYS get 7 full days starting from today (midnight)
 * Without this, after sunset the API returns tomorrow as day 0, causing incorrect scores
 * @param {string} baseUrl - Base API URL
 * @param {Object} coords - Coordinates object with latitude and longitude
 * @param {string} apiKey - Optional API key
 * @returns {string} Complete API URL
 */
export const buildForecastUrl = (baseUrl, coords, apiKey = '') => {
  const params = new URLSearchParams({
    latitude: coords.latitude,
    longitude: coords.longitude,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunset,sunrise',
    hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,wind_speed_10m',
    timezone: 'auto',
    forecast_days: '7' // Ensures 7 full days starting from today (midnight), not from current time
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
export const buildHistoricalUrl = (baseUrl, latitude, longitude, startDate, endDate, apiKey = '') => {
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
export const buildAirQualityUrl = (baseUrl, latitude, longitude, startDate, endDate, apiKey = '') => {
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
