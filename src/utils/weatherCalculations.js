/**
 * Simplified weather utilities for sunset quality scoring
 * Now uses centralized scoring service
 */

// Re-export from centralized scoring service
export { 
  getSunsetQualityScore, 
  getCloudTypeFromWeatherCode, 
  calculateSunsetDuration 
} from '../services/scoringService.js';
