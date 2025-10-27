/**
 * Centralized error handling utilities
 * Provides consistent error handling patterns across the application
 */

import { ERROR_MESSAGES } from '../constants/errors';

/**
 * Handle API errors with consistent logging and user-friendly messages
 * @param {Error} error - The error object
 * @param {Function} setError - Function to set error state
 * @param {Function} setIsLoading - Function to set loading state
 * @param {string} context - Context where the error occurred (optional)
 */
export const handleApiError = (error, setError, setIsLoading, context = '') => {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  
  // Categorize errors for better user experience
  let errorMessage = ERROR_MESSAGES.FORECAST_FETCH_FAILED;
  
  if (error.message.includes('Failed to fetch')) {
    errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
  } else if (error.message.includes('404')) {
    errorMessage = 'Location not found. Please try a different location.';
  } else if (error.message.includes('429')) {
    errorMessage = 'Too many requests. Please wait a moment and try again.';
  } else if (error.message.includes('500')) {
    errorMessage = 'Server error. Please try again later.';
  }
  
  setError(errorMessage);
  
  // Stop loading state
  if (setIsLoading) {
    setIsLoading(false);
  }
};

/**
 * Handle geolocation errors with specific error messages
 * @param {GeolocationPositionError} error - Geolocation error object
 * @param {Function} setError - Function to set error state
 * @param {Function} setIsLoading - Function to set loading state
 */
export const handleGeolocationError = (error, setError, setIsLoading) => {
  console.error('Geolocation Error:', error);
  
  let errorMessage;
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage = 'Location access denied. Please enable location permissions or search manually.';
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage = 'Location unavailable. Please try searching manually.';
      break;
    case error.TIMEOUT:
      errorMessage = ERROR_MESSAGES.LOCATION_TIMEOUT;
      break;
    default:
      errorMessage = ERROR_MESSAGES.LOCATION_NOT_SUPPORTED;
  }
  
  setError(errorMessage);
  if (setIsLoading) {
    setIsLoading(false);
  }
};

/**
 * Handle geocoding errors with consistent error messages
 * @param {Error} error - The error object
 * @param {Function} setError - Function to set error state
 * @param {Function} setIsLoading - Function to set loading state
 */
export const handleGeocodingError = (error, setError, setIsLoading) => {
  console.error('Geocoding Error:', error);
  
  let errorMessage = ERROR_MESSAGES.GEOCODING_FAILED;
  
  if (error.message.includes('API key')) {
    errorMessage = ERROR_MESSAGES.MAPBOX_API_KEY_MISSING;
  } else if (error.message.includes('network')) {
    errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  setError(errorMessage);
  if (setIsLoading) {
    setIsLoading(false);
  }
};

/**
 * Generic error handler for unexpected errors
 * @param {Error} error - The error object
 * @param {Function} setError - Function to set error state
 * @param {Function} setIsLoading - Function to set loading state
 * @param {string} fallbackMessage - Fallback error message
 */
export const handleGenericError = (error, setError, setIsLoading, fallbackMessage = 'An unexpected error occurred') => {
  console.error('Unexpected Error:', error);
  
  setError(fallbackMessage);
  if (setIsLoading) {
    setIsLoading(false);
  }
};
