/**
 * Unified data processing service for sunset calculations
 * Handles both live and historical data processing
 */

import { getCloudTypeFromWeatherCode, getSunsetQualityScore } from './scoringService.js';
import { SUNSET_CONSTANTS } from '../constants/app.js';

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
  console.log(`📊 Historical Data Structure:`, {
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
  
  // Process each day of the year - NOW USING ACTUAL SUNSET HOUR CONDITIONS
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    // Get sunset time from daily data
    const sunsetDateTime = weatherData.daily?.sunset?.[dayIndex];
    const currentDate = weatherData.daily?.time?.[dayIndex];
    
    // Track September and October for detailed debugging
    const isSeptember = currentDate?.startsWith('2025-09');
    const isOctober = currentDate?.startsWith('2025-10');
    const sunsetTime = sunsetDateTime ? 
      new Date(sunsetDateTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }) : '18:00';
    
    // Calculate sunset hour index in hourly data
    // Round to nearest hour for sunset time
    let sunsetHour = 18;
    if (sunsetDateTime) {
      const sunsetDate = new Date(sunsetDateTime);
      const minutes = sunsetDate.getMinutes();
      // If 30+ minutes past the hour, use next hour
      sunsetHour = minutes >= 30 ? sunsetDate.getHours() + 1 : sunsetDate.getHours();
    }
    const sunsetHourIndex = (dayIndex * 24) + sunsetHour;
    
    // Get weather conditions AT THE ACTUAL SUNSET HOUR
    const safeHourIndex = Math.min(sunsetHourIndex, (weatherData.hourly?.time?.length || 0) - 1);
    
    // DEBUG: Log sunset time and hour calculation (first 3 days only)
    if (dayIndex < 3) {
      console.log(`📅 Historical Day ${dayIndex + 1}:`, {
        date: weatherData.daily.time[dayIndex],
        sunsetDateTime: sunsetDateTime,
        sunsetTime: sunsetTime,
        sunsetHour: sunsetHour,
        sunsetHourIndex: sunsetHourIndex,
        safeHourIndex: safeHourIndex,
        hourlyDataLength: weatherData.hourly?.time?.length || 0
      });
    }
    
    const weatherCode = weatherData.hourly?.weather_code?.[safeHourIndex] || 0;
    const cloudCoverage = weatherData.hourly?.cloud_cover?.[safeHourIndex] || 0;
    const cloudCoverageLow = weatherData.hourly?.cloud_cover_low?.[safeHourIndex] || 0;
    const cloudCoverageMid = weatherData.hourly?.cloud_cover_mid?.[safeHourIndex] || 0;
    const cloudCoverageHigh = weatherData.hourly?.cloud_cover_high?.[safeHourIndex] || 0;
    const humidity = weatherData.hourly?.relative_humidity_2m?.[safeHourIndex] || SUNSET_CONSTANTS.DEFAULT_HUMIDITY;
    const precipChance = weatherData.hourly?.precipitation_probability?.[safeHourIndex] || 0;
    const visibility = weatherData.hourly?.visibility?.[safeHourIndex] || SUNSET_CONSTANTS.DEFAULT_VISIBILITY;
    const windSpeed = weatherData.hourly?.wind_speed_10m?.[safeHourIndex] || SUNSET_CONSTANTS.DEFAULT_WIND_SPEED;
    
    // Get AQI for sunset hour
    let aqi = SUNSET_CONSTANTS.DEFAULT_AQI;
    if (aqiData && aqiData.hourly && aqiData.hourly.us_aqi) {
      aqi = aqiData.hourly.us_aqi[safeHourIndex] || SUNSET_CONSTANTS.DEFAULT_AQI;
    }
    
    // DEBUG: Log sunset hour conditions (first 3 days only)
    if (dayIndex < 3) {
      console.log(`🌅 Historical Sunset Conditions Day ${dayIndex + 1}:`, {
        weatherCode: weatherCode,
        cloudCoverage: cloudCoverage,
        cloudCoverageLow: cloudCoverageLow,
        cloudCoverageMid: cloudCoverageMid,
        cloudCoverageHigh: cloudCoverageHigh,
        humidity: humidity,
        precipChance: precipChance,
        visibility: visibility,
        windSpeed: windSpeed,
        aqi: aqi
      });
    }
    
    // Get cloud type and height from weather code
    const cloudInfo = getCloudTypeFromWeatherCode(weatherCode);
    
    // Create weather object for scoring using ACTUAL SUNSET HOUR CONDITIONS
    const weatherForScoring = {
      cloud_type: cloudInfo.type,
      cloud_coverage: cloudCoverage,
      cloud_coverage_low: cloudCoverageLow,
      cloud_coverage_mid: cloudCoverageMid,
      cloud_coverage_high: cloudCoverageHigh,
      cloud_height_km: cloudInfo.height,
      precipitation_chance: precipChance,
      humidity: humidity,
      air_quality_index: Math.round(aqi),
      visibility: visibility,
      wind_speed: windSpeed
    };
    
    // Apply scoring algorithm using ACTUAL SUNSET HOUR CONDITIONS
    const scoreResult = getSunsetQualityScore(weatherForScoring);
    
    // DEBUG: Log scoring result (first 3 days only)
    if (dayIndex < 3) {
      console.log(`🎯 Historical Scoring Result Day ${dayIndex + 1}:`, {
        score: scoreResult.score,
        conditions: scoreResult.conditions,
        weatherForScoring: weatherForScoring
      });
    }
    
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
      score: scoreResult.score,
      sunset_score: scoreResult.score,
      conditions: scoreResult.conditions,
      weather_code: weatherCode,
      cloud_coverage: cloudCoverage,
      cloud_coverage_low: cloudCoverageLow,
      cloud_coverage_mid: cloudCoverageMid,
      cloud_coverage_high: cloudCoverageHigh,
      humidity: humidity,
      precipitation_chance: precipChance,
      visibility: visibility,
      wind_speed: windSpeed,
      air_quality_index: Math.round(aqi),
      sunset_time: sunsetTime,
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
    .sort((a, b) => (b.sunset_score || b.score) - (a.sunset_score || a.score))
    .slice(0, 10)
    .map((day, index) => ({
      rank: index + 1,
      date: day.date,
      day_of_week: day.day_of_week,
      formatted_date: day.formatted_date,
      score: day.sunset_score || day.score,
      sunset_score: day.sunset_score || day.score,
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
  const scores = historicalData.map(day => day.sunset_score || day.score);
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
