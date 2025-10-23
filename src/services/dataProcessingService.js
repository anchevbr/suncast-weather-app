/**
 * Unified data processing service for sunset calculations
 * Handles both live and historical data processing
 */

import { getCloudTypeFromWeatherCode, getSunsetQualityScore } from '../utils/weatherCalculations.js';

/**
 * Process historical weather data to calculate sunset scores for each day
 * @param {Object} weatherData - Historical weather data from Open-Meteo
 * @param {Object} aqiData - Historical air quality data (optional)
 * @param {Object} location - Location object with lat, lon, name
 * @param {number} year - Year of the data
 * @returns {Array} - Array of daily sunset data with scores
 */
export const processHistoricalSunsetData = (weatherData, aqiData, location, year) => {
  const days = [];
  const totalDays = weatherData.daily?.time?.length || 365;
  
  // Process each day of the year
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const date = new Date(year, 0, dayIndex + 1);
    const sunsetHour = 18; // Approximate sunset hour
    const hourIndex = (dayIndex * 24) + sunsetHour;
    
    // Get weather data for sunset hour (with bounds checking)
    const safeHourIndex = Math.min(hourIndex, (weatherData.hourly?.time?.length || 0) - 1);
    
    const weatherCode = weatherData.hourly?.weather_code?.[safeHourIndex] || 0;
    const cloudCoverage = weatherData.hourly?.cloud_cover?.[safeHourIndex] || 50;
    const humidity = weatherData.hourly?.relative_humidity_2m?.[safeHourIndex] || 50;
    const precipChance = weatherData.hourly?.precipitation_probability?.[safeHourIndex] || 0;
    const visibility = weatherData.hourly?.visibility?.[safeHourIndex] || 10000;
    const windSpeed = weatherData.hourly?.wind_speed_10m?.[safeHourIndex] || 10;
    
    // Get AQI for this hour
    let aqi = 50; // Default moderate AQI
    if (aqiData && aqiData.hourly && aqiData.hourly.us_aqi) {
      aqi = aqiData.hourly.us_aqi[safeHourIndex] || 50;
    }
    
    // Get cloud type and height from weather code
    const cloudInfo = getCloudTypeFromWeatherCode(weatherCode);
    
    // Create weather object for scoring
    const weatherForScoring = {
      cloud_type: cloudInfo.type,
      cloud_coverage: cloudCoverage,
      cloud_height_km: cloudInfo.height,
      precipitation_chance: precipChance,
      humidity: humidity,
      air_quality_index: Math.round(aqi),
      visibility: visibility,
      wind_speed: windSpeed
    };
    
    // Apply our existing scoring algorithm
    const scoreResult = getSunsetQualityScore(weatherForScoring);
    
    // Get sunset time from daily data
    const sunsetTime = weatherData.daily?.sunset?.[dayIndex] || '18:00';
    
    days.push({
      date: date.toISOString().split('T')[0],
      formatted_date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      score: scoreResult.score,
      conditions: cloudInfo.type,
      cloud_coverage: cloudCoverage,
      cloud_height_km: cloudInfo.height,
      humidity: humidity,
      precipitation_chance: precipChance,
      visibility: visibility,
      wind_speed: windSpeed,
      air_quality_index: Math.round(aqi),
      sunset_time: sunsetTime,
      weather_code: weatherCode
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
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((day, index) => ({
      rank: index + 1,
      date: day.date,
      formatted_date: day.formatted_date,
      score: day.score,
      conditions: day.conditions,
      cloud_coverage: day.cloud_coverage,
      cloud_height_km: day.cloud_height_km,
      humidity: day.humidity,
      precipitation_chance: day.precipitation_chance,
      visibility: day.visibility,
      wind_speed: day.wind_speed,
      air_quality_index: day.air_quality_index,
      sunset_time: day.sunset_time,
      weather_code: day.weather_code
    }));
};

/**
 * Get score statistics for historical data
 * @param {Array} historicalData - Array of daily sunset data
 * @returns {Object} - Statistics object
 */
export const getScoreStatistics = (historicalData) => {
  const scores = historicalData.map(day => day.score);
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
