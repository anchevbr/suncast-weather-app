/**
 * Climate and Seasonal Utility Functions
 * Provides climate zone detection and seasonal adjustment calculations
 */

import { CLIMATE_ZONES, SEASONAL_FACTORS } from '../constants/app.js';

/**
 * Determine climate zone based on latitude and geographic characteristics
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} locationName - Location name for additional context
 * @returns {Object} - Climate zone configuration
 */
export const detectClimateZone = (latitude, longitude, locationName = '') => {
  const lat = Math.abs(latitude);
  const lon = Math.abs(longitude);
  
  // Mediterranean climate detection (specific regions)
  if (isMediterraneanRegion(latitude, longitude, locationName)) {
    return CLIMATE_ZONES.MEDITERRANEAN;
  }
  
  // Tropical climate (0-23.5° latitude)
  if (lat <= 23.5) {
    return CLIMATE_ZONES.TROPICAL;
  }
  
  // Arid climate detection (specific longitude ranges and latitude bands)
  if (isAridRegion(latitude, longitude)) {
    return CLIMATE_ZONES.ARID;
  }
  
  // Continental climate (mid-latitudes, inland)
  if (lat >= 30 && lat <= 60 && isContinentalRegion(latitude, longitude)) {
    return CLIMATE_ZONES.CONTINENTAL;
  }
  
  // Polar climate (high latitudes)
  if (lat >= 60) {
    return CLIMATE_ZONES.POLAR;
  }
  
  // Default to temperate for mid-latitudes
  return CLIMATE_ZONES.TEMPERATE;
};

/**
 * Check if location is in Mediterranean climate region
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} locationName - Location name
 * @returns {boolean}
 */
const isMediterraneanRegion = (latitude, longitude, locationName) => {
  const name = locationName.toLowerCase();
  
  // Mediterranean Sea region
  if (latitude >= 30 && latitude <= 45 && longitude >= -10 && longitude <= 40) {
    return true;
  }
  
  // California Mediterranean climate
  if (latitude >= 32 && latitude <= 40 && longitude >= -125 && longitude <= -115) {
    return true;
  }
  
  // Chile Mediterranean climate
  if (latitude >= -40 && latitude <= -30 && longitude >= -75 && longitude <= -70) {
    return true;
  }
  
  // South Africa Mediterranean climate
  if (latitude >= -35 && latitude <= -30 && longitude >= 15 && longitude <= 25) {
    return true;
  }
  
  // Australia Mediterranean climate
  if (latitude >= -35 && latitude <= -30 && longitude >= 115 && longitude <= 120) {
    return true;
  }
  
  // Check location name for Mediterranean keywords
  const mediterraneanKeywords = ['mediterranean', 'santorini', 'crete', 'cyprus', 'malta', 'sardinia', 'corsica', 'sicily'];
  return mediterraneanKeywords.some(keyword => name.includes(keyword));
};

/**
 * Check if location is in arid climate region
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {boolean}
 */
const isAridRegion = (latitude, longitude) => {
  const lat = Math.abs(latitude);
  
  // Sahara Desert
  if (latitude >= 15 && latitude <= 35 && longitude >= -20 && longitude <= 50) {
    return true;
  }
  
  // Arabian Desert
  if (latitude >= 15 && latitude <= 30 && longitude >= 35 && longitude <= 60) {
    return true;
  }
  
  // Australian Outback
  if (latitude >= -30 && latitude <= -15 && longitude >= 120 && longitude <= 150) {
    return true;
  }
  
  // American Southwest
  if (latitude >= 25 && latitude <= 40 && longitude >= -120 && longitude <= -100) {
    return true;
  }
  
  // Atacama Desert
  if (latitude >= -30 && latitude <= -15 && longitude >= -80 && longitude <= -70) {
    return true;
  }
  
  return false;
};

/**
 * Check if location is in continental climate region
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {boolean}
 */
const isContinentalRegion = (latitude, longitude) => {
  // North American interior
  if (latitude >= 30 && latitude <= 60 && longitude >= -120 && longitude <= -80) {
    return true;
  }
  
  // Eurasian interior
  if (latitude >= 30 && latitude <= 60 && longitude >= 20 && longitude <= 140) {
    return true;
  }
  
  return false;
};

/**
 * Determine current season based on date and hemisphere
 * @param {number} latitude - Latitude coordinate
 * @param {Date} date - Date to determine season for (defaults to current date)
 * @returns {Object} - Seasonal factor configuration
 */
export const getSeasonalFactor = (latitude, date = new Date()) => {
  const month = date.getMonth() + 1; // 1-12
  const isNorthernHemisphere = latitude >= 0;
  
  let season;
  
  if (isNorthernHemisphere) {
    // Northern Hemisphere seasons
    if (month >= 3 && month <= 5) season = 'SPRING';
    else if (month >= 6 && month <= 8) season = 'SUMMER';
    else if (month >= 9 && month <= 11) season = 'AUTUMN';
    else season = 'WINTER';
  } else {
    // Southern Hemisphere seasons (inverted)
    if (month >= 3 && month <= 5) season = 'AUTUMN';
    else if (month >= 6 && month <= 8) season = 'WINTER';
    else if (month >= 9 && month <= 11) season = 'SPRING';
    else season = 'SUMMER';
  }
  
  return SEASONAL_FACTORS[season];
};

/**
 * Calculate sun angle factor based on latitude and date
 * @param {number} latitude - Latitude coordinate
 * @param {Date} date - Date to calculate for (defaults to current date)
 * @returns {number} - Sun angle factor (0.5-1.5)
 */
export const calculateSunAngleFactor = (latitude, date = new Date()) => {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const latRad = latitude * Math.PI / 180;
  
  // Solar declination angle
  const declination = 23.45 * Math.sin((284 + dayOfYear) * Math.PI / 182.5) * Math.PI / 180;
  
  // Sun angle at sunset (simplified calculation)
  const sunAngle = Math.abs(latRad - declination);
  
  // Convert to factor (higher angles = better sunsets)
  return Math.min(1.5, Math.max(0.5, sunAngle * 2));
};

/**
 * Get comprehensive climate and seasonal adjustments
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} locationName - Location name
 * @param {Date} date - Date to calculate for (defaults to current date)
 * @returns {Object} - Combined climate and seasonal adjustments
 */
export const getClimateSeasonalAdjustments = (latitude, longitude, locationName, date = new Date()) => {
  const climateZone = detectClimateZone(latitude, longitude, locationName);
  const seasonalFactor = getSeasonalFactor(latitude, date);
  const sunAngleFactor = calculateSunAngleFactor(latitude, date);
  
  return {
    climateZone,
    seasonalFactor,
    sunAngleFactor,
    combinedMultiplier: Math.min(1.2, Math.max(0.8, 
                       (climateZone.cloud_height_bonus + 
                        climateZone.seasonal_adjustment + 
                        seasonalFactor.atmospheric_factor + 
                        sunAngleFactor) / 4)),
    humidityThreshold: climateZone.humidity_threshold,
    cloudFormationBonus: seasonalFactor.cloud_formation_bonus
  };
};
