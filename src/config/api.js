/**
 * API Configuration Constants
 * Centralized API URLs and endpoints
 */

export const API_CONFIG = {
  OPEN_METEO: {
    FREE: 'https://api.open-meteo.com/v1/forecast',
    COMMERCIAL: 'https://customer-api.open-meteo.com/v1/forecast',
    ARCHIVE: 'https://archive-api.open-meteo.com/v1/archive',
  },
  AIR_QUALITY: {
    FREE: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    COMMERCIAL: 'https://customer-air-quality-api.open-meteo.com/v1/air-quality',
  },
  MAPBOX: {
    GEOCODING_BASE: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  },
  NOMINATIM: {
    REVERSE_GEOCODE: 'https://nominatim.openstreetmap.org/reverse',
  },
};

/**
 * Get the appropriate Open-Meteo forecast URL based on API key availability
 * @param {string} apiKey - Optional API key
 * @returns {string} The forecast API URL
 */
export const getForecastUrl = (apiKey) => {
  return apiKey ? API_CONFIG.OPEN_METEO.COMMERCIAL : API_CONFIG.OPEN_METEO.FREE;
};

/**
 * Get the appropriate Air Quality API URL based on API key availability
 * @param {string} apiKey - Optional API key
 * @returns {string} The air quality API URL
 */
export const getAirQualityUrl = (apiKey) => {
  return apiKey ? API_CONFIG.AIR_QUALITY.COMMERCIAL : API_CONFIG.AIR_QUALITY.FREE;
};

