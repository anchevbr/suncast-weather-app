import { useState, useCallback } from 'react';
import { fetchForecastData } from '../services/apiService';
import { reverseGeocode } from '../utils/geocoding';
import { handleApiError, handleGeolocationError, handleGeocodingError } from '../utils/errorHandling';
import { ERROR_MESSAGES } from '../constants/errors';

/**
 * Custom hook for managing location selection and geolocation
 * Extracts location handling logic from Home component
 */
export const useLocationHandling = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle location selection from autocomplete
   */
  const handleLocationSelect = useCallback(async (locationData, enableScrollSnap) => {
    setIsLoading(true);
    setError(null);
    
    // Ensure scroll snap is enabled for new search
    if (enableScrollSnap) {
      enableScrollSnap();
    }

    try {
      // Use coordinates directly from the selected location
      const coords = {
        latitude: parseFloat(locationData.lat),
        longitude: parseFloat(locationData.lon),
        name: locationData.display_name.split(',')[0],
        country: locationData.country || 'Unknown'
      };

      const locationName = `${coords.name}, ${coords.country}`;
      const forecastData = await fetchForecastData(`${coords.latitude}, ${coords.longitude}`, locationName);

      // Create new forecast object to ensure React detects the change
      const newForecast = {
        location: locationName,
        latitude: forecastData.latitude,
        longitude: forecastData.longitude,
        days: [...forecastData.days]
      };

      return { forecast: newForecast, isLoading: false };
    } catch (error) {
      handleApiError(error, setError, setIsLoading, 'location selection');
      throw error;
    }
  }, []);

  const handleGetCurrentLocation = useCallback(async (enableScrollSnap) => {
    if (navigator.geolocation) {
      setIsLoading(true);
      
      // Ensure scroll snap is enabled for new search
      if (enableScrollSnap) {
        enableScrollSnap();
      }
      
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              const locationName = await reverseGeocode(latitude, longitude);
              const forecastData = await fetchForecastData(`${latitude}, ${longitude}`, locationName);
              
              const newForecast = {
                location: locationName,
                latitude: forecastData.latitude,
                longitude: forecastData.longitude,
                days: [...forecastData.days]
              };

              resolve({ forecast: newForecast, isLoading: false });
            } catch (error) {
              handleApiError(error, setError, setIsLoading, 'current location');
              reject(error);
            }
          },
          (error) => {
            handleGeolocationError(error, setError, setIsLoading);
            reject(error);
          }
        );
      });
    } else {
      handleGeocodingError(new Error('Geolocation not supported'), setError, setIsLoading);
      throw new Error(ERROR_MESSAGES.LOCATION_NOT_SUPPORTED);
    }
  }, []);

  return {
    isLoading,
    error,
    handleLocationSelect,
    handleGetCurrentLocation,
    setIsLoading,
    setError
  };
};
