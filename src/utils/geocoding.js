/**
 * Geocoding utilities for location-based operations
 */

import { API_CONFIG } from '../config/api.js';
import { ERROR_MESSAGES } from '../constants/errors.js';

/**
 * Reverse geocode coordinates to get location name
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string>} - Formatted location name
 */
export const reverseGeocode = async (latitude, longitude) => {
  // Get email from environment or use a generic contact email
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'contact@suncast.app';
  
  const response = await fetch(
    `${API_CONFIG.NOMINATIM.REVERSE_GEOCODE}?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&email=${contactEmail}`
  );
  
  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.LOCATION_NAME_FAILED);
  }
  
  const locationData = await response.json();
  
  let cityName = 'Unknown Location';
  let countryName = '';
  
  if (locationData.address) {
    const addr = locationData.address;
    cityName = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || addr.county || 'Unknown';
    countryName = addr.country || '';
  } else if (locationData.display_name) {
    const parts = locationData.display_name.split(',');
    cityName = parts[0].trim();
    countryName = parts[parts.length - 1].trim();
  }
  
  return countryName ? `${cityName}, ${countryName}` : cityName;
};

