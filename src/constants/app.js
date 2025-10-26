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
  DEFAULT_AQI: 50, // Default air quality index when data unavailable
  DEFAULT_VISIBILITY: 10000, // Default visibility in meters
  DEFAULT_WIND_SPEED: 10, // Default wind speed in km/h
  DEFAULT_HUMIDITY: 50, // Default humidity percentage
};

// Climate Zone Classifications (Köppen-Geiger)
export const CLIMATE_ZONES = {
  TROPICAL: {
    name: 'Tropical',
    humidity_threshold: 80,
    cloud_height_bonus: 1.2,
    seasonal_adjustment: 0.9
  },
  ARID: {
    name: 'Arid',
    humidity_threshold: 40,
    cloud_height_bonus: 1.1,
    seasonal_adjustment: 1.1
  },
  TEMPERATE: {
    name: 'Temperate',
    humidity_threshold: 60,
    cloud_height_bonus: 1.0,
    seasonal_adjustment: 1.0
  },
  CONTINENTAL: {
    name: 'Continental',
    humidity_threshold: 50,
    cloud_height_bonus: 1.05,
    seasonal_adjustment: 1.05
  },
  POLAR: {
    name: 'Polar',
    humidity_threshold: 70,
    cloud_height_bonus: 0.9,
    seasonal_adjustment: 0.8
  },
  MEDITERRANEAN: {
    name: 'Mediterranean',
    humidity_threshold: 55,
    cloud_height_bonus: 1.05,
    seasonal_adjustment: 1.1
  }
};

// Seasonal Adjustment Factors
export const SEASONAL_FACTORS = {
  SPRING: {
    name: 'Spring',
    sun_angle_factor: 1.1,
    atmospheric_factor: 1.05,
    cloud_formation_bonus: 1.1
  },
  SUMMER: {
    name: 'Summer',
    sun_angle_factor: 1.0,
    atmospheric_factor: 0.9,
    cloud_formation_bonus: 0.8
  },
  AUTUMN: {
    name: 'Autumn',
    sun_angle_factor: 1.1,
    atmospheric_factor: 1.05,
    cloud_formation_bonus: 1.1
  },
  WINTER: {
    name: 'Winter',
    sun_angle_factor: 1.15,
    atmospheric_factor: 1.05,
    cloud_formation_bonus: 1.1
  }
};

// Animation Configuration (already exists in Home.jsx, but documented here for reference)
export const ANIMATION_CONSTANTS = {
  SCROLL_DURATION: 3000,      // 3 seconds for auto-scroll animation
  START_DELAY: 100,           // Delay before starting animation
  SNAP_BACK_DELAY: 1000,      // Delay to prevent scroll snap-back
};

