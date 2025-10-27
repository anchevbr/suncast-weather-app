/**
 * Unified data processing service for sunset calculations
 * Handles both live and historical data processing
 */

import { processSunsetDay } from './sunsetDataProcessor.js';
import { logger } from '../utils/logger.js';

/**
 * Process historical weather data to calculate sunset scores for each day
 * NOW USES ACTUAL SUNSET HOUR CONDITIONS for accurate scoring
 * @param {Object} weatherData - Historical weather data from Open-Meteo
 * @param {Object} aqiData - Historical air quality data (optional)
 * @param {Object} location - Location object with lat, lon, name
 * @param {number} year - Year of the data
 * @returns {Array} - Array of daily sunset data with scores
 */
export const processHistoricalSunsetData = (weatherData, aqiData, location, year) => {
  const days = [];
  const totalDays = weatherData.daily?.time?.length || 365;
  
  // DEBUG: Log overall data structure
  logger.debug(`📊 Historical Data Structure:`, {
    location: location,
    year: year,
    totalDays: totalDays,
    hasDailyData: !!weatherData.daily,
    hasHourlyData: !!weatherData.hourly,
    dailyTimeLength: weatherData.daily?.time?.length,
    hourlyTimeLength: weatherData.hourly?.time?.length,
    hasSunsetData: !!weatherData.daily?.sunset,
    firstSunsetTime: weatherData.daily?.sunset?.[0],
    hasAqiData: !!aqiData
  });
  
  // Process each day of the year - NOW USING UNIFIED SUNSET PROCESSING MODULE
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    // Use unified sunset processing module for consistency with live forecast
    const sunsetData = processSunsetDay({
      dayIndex,
      dailyData: weatherData.daily,
      hourlyData: weatherData.hourly,
      aqiData,
      dataType: 'historical'
    });
    
    // Get day of week
    const dayOfWeek = new Date(weatherData.daily.time[dayIndex]).toLocaleDateString('en-US', { 
      weekday: 'short' 
    });
    
    days.push({
      date: weatherData.daily.time[dayIndex],
      day_of_week: dayOfWeek,
      formatted_date: new Date(weatherData.daily.time[dayIndex]).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      sunset_score: sunsetData.sunsetScore,
      conditions: sunsetData.conditions,
      weather_code: sunsetData.weatherCode,
      cloud_coverage: sunsetData.cloudCoverage,
      cloud_coverage_low: sunsetData.cloudCoverageLow,
      cloud_coverage_mid: sunsetData.cloudCoverageMid,
      cloud_coverage_high: sunsetData.cloudCoverageHigh,
      humidity: sunsetData.humidity,
      precipitation_chance: sunsetData.precipChance,
      visibility: sunsetData.visibility,
      wind_speed: sunsetData.windSpeed,
      air_quality_index: sunsetData.aqi,
      sunset_time: sunsetData.sunsetTime,
      sunset: weatherData.daily.sunset?.[dayIndex],
      sunrise: weatherData.daily.sunrise?.[dayIndex]
    });
  }
  
  return days;
};


/**
 * Get top 10 sunsets from historical data
 * @param {Array} historicalData - Array of daily sunset data
 * @returns {Array} - Top 10 sunsets with ranking
 */
export const getTop10Sunsets = (historicalData) => {
  return historicalData
    .sort((a, b) => b.sunset_score - a.sunset_score)
    .slice(0, 10)
    .map((day, index) => ({
      rank: index + 1,
      date: day.date,
      day_of_week: day.day_of_week,
      formatted_date: day.formatted_date,
      score: day.sunset_score,
      sunset_score: day.sunset_score,
      conditions: day.conditions,
      weather_code: day.weather_code,
      cloud_coverage: day.cloud_coverage,
      cloud_coverage_low: day.cloud_coverage_low,
      cloud_coverage_mid: day.cloud_coverage_mid,
      cloud_coverage_high: day.cloud_coverage_high,
      humidity: day.humidity,
      precipitation_chance: day.precipitation_chance,
      visibility: day.visibility,
      wind_speed: day.wind_speed,
      air_quality_index: day.air_quality_index,
      sunset_time: day.sunset_time,
      sunset: day.sunset,
      sunrise: day.sunrise
    }));
};

/**
 * Get score statistics for historical data
 * @param {Array} historicalData - Array of daily sunset data
 * @returns {Object} - Statistics object
 */
export const getScoreStatistics = (historicalData) => {
  const scores = historicalData.map(day => day.sunset_score);
  const sortedScores = [...scores].sort((a, b) => b - a);
  
  return {
    total_days: historicalData.length,
    average_score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    highest_score: Math.max(...scores),
    lowest_score: Math.min(...scores),
    median_score: sortedScores[Math.floor(sortedScores.length / 2)],
    top_10_percent: Math.round(sortedScores[Math.floor(sortedScores.length * 0.1)]),
    top_25_percent: Math.round(sortedScores[Math.floor(sortedScores.length * 0.25)])
  };
};
