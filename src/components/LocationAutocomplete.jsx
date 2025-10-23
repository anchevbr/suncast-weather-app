import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useGeocoding } from '../hooks/useGeocoding';

/**
 * Professional Location Autocomplete Component
 * Based on industry best practices for autocomplete functionality
 */
const LocationAutocomplete = ({ onLocationSelect, placeholder = "Search for a location..." }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const containerRef = useRef(null);

  const {
    suggestions,
    isLoading,
    error,
    selectedLocation,
    fetchSuggestions,
    selectLocation,
    clearAll
  } = useGeocoding();

  /**
   * Handle input change with debounced suggestions
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      setShowSuggestions(true);
      fetchSuggestions(value);
    } else {
      setShowSuggestions(false);
      clearAll();
    }
  };

  /**
   * Handle suggestion selection
   */
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.display_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Select the location
    selectLocation(suggestion);
    
    // Notify parent component
    if (onLocationSelect) {
      onLocationSelect(suggestion);
    }
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  /**
   * Handle click outside to close suggestions
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Focus input when component mounts
   */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-10 pr-4 text-base bg-white/90 backdrop-blur-sm border border-white/20 text-gray-900 placeholder:text-gray-500 focus:border-white/40 focus:ring-2 focus:ring-white/20 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-normal"
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || error) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto"
        >
          {error ? (
            <div className="px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          ) : (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.place_id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                    index === selectedIndex
                      ? 'bg-white/80 text-gray-900'
                      : 'hover:bg-white/60 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {suggestion.display_name.split(',')[0]}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {suggestion.display_name.split(',').slice(1).join(',').trim()}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
