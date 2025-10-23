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

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `limit=8&` +
          `addressdetails=1&` +
          `extratags=1&` +
          `featuretype=city&` +
          `class=place&` +
          `bounded=0&` +
          `dedupe=1&` +
          `polygon_geojson=0&` +
          `email=your-email@domain.com&` +
          `accept-language=en`,
          {
            signal: abortControllerRef.current.signal,
            headers: {
              'User-Agent': 'Suncast Weather App'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Geocoding request failed');
        }

        const data = await response.json();

        if (!data || data.length === 0) {
          setSuggestions([]);
          return;
        }

        // Professional scoring algorithm
        const scoredResults = data.map(result => {
          let score = 0;
          const displayName = result.display_name.toLowerCase();
          const importance = parseFloat(result.importance) || 0;

          // Capital city bonus (highest priority)
          if (result.extratags?.capital === 'yes') {
            score += 200;
          }

          // API importance weighting
          score += importance * 150;

          // Population-based scoring
          if (result.extratags?.population) {
            const population = parseInt(result.extratags.population);
            if (population > 5000000) score += 25;
            else if (population > 1000000) score += 20;
            else if (population > 500000) score += 15;
            else if (population > 100000) score += 10;
            else if (population > 50000) score += 5;
          }

          // Type bonuses
          if (result.type === 'city') score += 10;
          if (result.class === 'place') score += 8;
          if (result.type === 'town') score += 5;

          // Tourism and cultural significance
          if (result.extratags?.tourism) score += 8;
          if (result.extratags?.historic) score += 6;

          // Exact match bonus
          if (displayName.startsWith(query.toLowerCase())) {
            score += 15;
          }

          return { ...result, score };
        });

        // Sort by score, then importance, then alphabetically
        const sortedResults = scoredResults
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.importance !== a.importance) return b.importance - a.importance;
            return a.display_name.localeCompare(b.display_name);
          })
          .slice(0, 5);

        setSuggestions(sortedResults);
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
