/**
 * Error Messages Constants
 * Centralized error messages for consistent UX
 */

export const ERROR_MESSAGES = {
  // Forecast errors
  FORECAST_FETCH_FAILED: 'Unable to fetch forecast data. Please try again.',
  
  // Location errors
  LOCATION_PERMISSION_DENIED: 'Unable to access your location. Please search manually.',
  LOCATION_NOT_SUPPORTED: 'Geolocation is not supported by your browser.',
  LOCATION_NAME_FAILED: 'Failed to get location name',
  LOCATION_TIMEOUT: 'Location request timed out. Please try again.',
  
  // Geocoding errors
  GEOCODING_FAILED: 'Unable to fetch location suggestions',
  GEOCODING_REQUEST_FAILED: 'Geocoding request failed',
  
  // API errors
  API_KEY_MISSING: 'API key not found. Please check your environment configuration.',
  MAPBOX_API_KEY_MISSING: 'Mapbox API key not found. Please add VITE_MAPBOX_API_KEY to your .env file',
  
  // Historical data errors
  HISTORICAL_WEATHER_FAILED: 'Historical weather data fetch failed',
  HISTORICAL_AQI_FAILED: 'Historical air quality data fetch failed',
  
  // Generic errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

