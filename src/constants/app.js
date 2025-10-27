/**
 * Application-wide Constants
 * Magic numbers and configuration values used throughout the app
 */

// Geocoding Configuration
export const GEOCODING_CONSTANTS = {
  MIN_SEARCH_QUERY_LENGTH: 3,
  DEBOUNCE_DELAY_MS: 300,
  MAX_SUGGESTIONS: 8,
};

// Weather & Sunset Configuration
export const SUNSET_CONSTANTS = {
  APPROXIMATE_SUNSET_HOUR: 18, // Used for historical data when exact time unavailable
  
  // Default values when API data is unavailable
  // These are chosen as "neutral" values that won't artificially inflate/deflate scores
  DEFAULT_AQI: 50,              // Moderate air quality (AQI 50 = acceptable)
  DEFAULT_VISIBILITY: 10000,    // 10km = typical clear day visibility
  DEFAULT_WIND_SPEED: 10,       // 10 km/h = light breeze (doesn't affect scoring much)
  DEFAULT_HUMIDITY: 50,         // 50% = mid-range humidity (neutral for scoring)
  
  // Precision notes:
  // - Sunset hour uses CLOSEST hour (rounds to nearest)
  // - AQI matches by timestamp when available (not just index)
  // - All times use API's timezone='auto' for location accuracy
};


// Animation Configuration (already exists in Home.jsx, but documented here for reference)
export const ANIMATION_CONSTANTS = {
  SCROLL_DURATION: 3000,      // 3 seconds for auto-scroll animation
  START_DELAY: 100,           // Delay before starting animation
  SNAP_BACK_DELAY: 1000,      // Delay to prevent scroll snap-back
};

// Visual Effects Configuration
export const VISUAL_CONSTANTS = {
  BLUR_MULTIPLIER: 150,       // Multiplier for blur calculation in Home.jsx
  SUN_FEATHER_FACTOR: 0.2,    // Initial feather factor for sun gradient
  SUN_BLUR_MAX: 4,            // Maximum blur for sun component
  SUN_OPACITY_FADE: 0.4,      // Opacity fade factor for sun
  SUN_POSITION_OFFSET: 65,    // Vertical position offset for sun
  SUN_POSITION_START: 20,     // Starting vertical position for sun
};

