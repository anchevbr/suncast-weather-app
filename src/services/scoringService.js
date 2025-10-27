/**
 * Scientific Sunset Quality Scoring Service
 * Based on atmospheric optics and cloud physics research
 * Designed to cap at exactly 100 points maximum
 */

import { calculateCloudScore, calculateAtmosphericScore, calculateBonusScore, getConditionsLabel } from './scoringUtils.js';

/**
 * Scientific sunset quality score based on atmospheric optics and cloud physics
 * Research shows: High clouds (>8km) scatter sunlight creating vibrant colors
 * Mid-level clouds (3-8km) provide moderate color enhancement
 * Low clouds (0-3km) often block sunlight and reduce color intensity
 * @param {Object} weather - Weather data object with Open-Meteo cloud cover data
 * @returns {Object} - {score: number, conditions: string}
 */
export const getSunsetQualityScore = (weather) => {
  // Extract cloud cover data by altitude (Open-Meteo provides actual measurements)
  const cloudData = {
    cloudCoverageLow: weather.cloud_coverage_low || 0,    // 0-3km altitude
    cloudCoverageMid: weather.cloud_coverage_mid || 0,    // 3-8km altitude  
    cloudCoverageHigh: weather.cloud_coverage_high || 0,  // >8km altitude
  };
  
  // Extract other meteorological factors
  const atmosphericData = {
    precipChance: weather.precipitation_chance || 0,
    humidity: weather.humidity || 50,
    aqi: weather.air_quality_index || 50,
    visibility: weather.visibility || 10000,
  };
  
  // Calculate scores using utility functions
  const cloudScore = calculateCloudScore(cloudData);
  const atmosphericScore = calculateAtmosphericScore(atmosphericData);
  const bonusScore = calculateBonusScore({ ...cloudData, ...atmosphericData });
  
  // Calculate final score
  const totalScore = cloudScore + atmosphericScore + bonusScore;
  const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));
  
  // DEBUG: Log scoring breakdown for first few calculations
  const logThis = weather.humidity && weather.humidity >= 30 && weather.humidity <= 50 && weather.cloud_coverage_high >= 40;
  if (logThis) {
    console.log('📊 📊 📊 DETAILED SCORING BREAKDOWN 📊 📊 📊');
    console.log('Cloud Data:', JSON.stringify(cloudData, null, 2));
    console.log('Atmospheric Data:', JSON.stringify(atmosphericData, null, 2));
    console.log('Cloud Score:', cloudScore);
    console.log('Atmospheric Score:', atmosphericScore);
    console.log('Bonus Score:', bonusScore);
    console.log('Total Score:', totalScore);
    console.log('Final Score:', finalScore);
    console.log('📊 📊 📊 END SCORING BREAKDOWN 📊 📊 📊');
  }
  
  // Determine conditions using utility function
  const conditions = getConditionsLabel(finalScore);
  
  return {
    score: finalScore,
    conditions: conditions
  };
};