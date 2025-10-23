import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Professional geocoding hook with proper state management
 * Based on industry best practices for autocomplete functionality
 */
export const useGeocoding = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Refs for stable references
  const debounceTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Professional geocoding with advanced optimization
   */
  const fetchSuggestions = useCallback(async (query) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Minimum query length
    if (query.length < 3) {
      setSuggestions([]);
      setError(null);
      return;
    }

    // Debounce the request
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        // Get Mapbox API token from environment
        const mapboxToken = import.meta.env.VITE_MAPBOX_API_KEY;
        
        if (!mapboxToken) {
          throw new Error('Mapbox API key not found. Please add VITE_MAPBOX_API_KEY to your .env file');
        }

        // Mapbox Geocoding API - Forward Geocoding with Autocomplete
        // Use global search without proximity bias for fair results
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          `access_token=${mapboxToken}&` +
          `types=place&` + // Only cities and towns (removes neighborhoods/POIs)
          `limit=8&` +
          `autocomplete=true&` + // Enable autocomplete suggestions
          `language=en`,
          {
            signal: abortControllerRef.current.signal,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Geocoding request failed');
        }

        const data = await response.json();

        if (!data || !data.features || data.features.length === 0) {
          setSuggestions([]);
          return;
        }

        // Convert Mapbox format to our existing format for compatibility
        const convertedResults = data.features.map(feature => {
          // Extract location details from Mapbox response
          const context = feature.context || [];
          const getContext = (type) => context.find(c => c.id.startsWith(type))?.text || '';
          
          return {
            // Coordinates (Mapbox uses [longitude, latitude] format)
            lat: feature.center[1],
            lon: feature.center[0],
            
            // Display name (formatted location string)
            display_name: feature.place_name,
            
            // Location details
            name: feature.text,
            type: feature.place_type[0],
            
            // Additional context for better display
            region: getContext('region'),
            country: getContext('country'),
            
            // Mapbox relevance score (0-1, higher is better)
            // This already factors in population, query match, and importance
            importance: feature.relevance,
            
            // Original Mapbox data for reference
            _mapbox: feature
          };
        });

        // Mapbox already sorts results by relevance (includes population, importance, and query match)
        // Trust their ranking algorithm - it's designed to prioritize major cities globally
        setSuggestions(convertedResults);
        } catch (error) {
          if (error.name !== 'AbortError') {
            setError('Unable to fetch location suggestions');
          }
        } finally {
        setIsLoading(false);
      }
    }, 300); // Professional debounce timing
  }, []);

  /**
   * Select a location from suggestions
   */
  const selectLocation = useCallback((location) => {
    setSelectedLocation(location);
    setSuggestions([]);
    setError(null);
  }, []);

  /**
   * Clear all state
   */
  const clearAll = useCallback(() => {
    setSuggestions([]);
    setSelectedLocation(null);
    setError(null);
    setIsLoading(false);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    selectedLocation,
    fetchSuggestions,
    selectLocation,
    clearAll
  };
};
