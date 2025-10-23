/**
 * Frontend re-export of shared scoring service
 * This file simply re-exports the shared scoring logic
 */

export { 
  getCloudTypeFromWeatherCode,
  getSunsetQualityScore,
  calculateSunsetDuration
} from '../../shared/scoringService.js';
