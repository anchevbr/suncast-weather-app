/**
 * Manual Sunset Scoring Test Script
 * Test sunset scores for specific dates and locations
 * 
 * Usage:
 *   node test-sunset-scoring.js
 * 
 * Or test specific location:
 *   node test-sunset-scoring.js 40.7128 -74.0060  # New York
 */

import { getSunsetQualityScore } from './src/services/scoringService.js';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Get color based on sunset score
 */
function getScoreColor(score) {
  if (score >= 90) return colors.magenta; // Spectacular
  if (score >= 80) return colors.red;     // Excellent
  if (score >= 60) return colors.yellow;  // Good
  if (score >= 40) return colors.cyan;    // Fair
  return colors.blue;                      // Poor
}

/**
 * Fetch weather data from Open-Meteo API
 */
async function fetchWeatherData(latitude, longitude, date) {
  const formattedDate = date.toISOString().split('T')[0];
  
  // Use archive API for historical data
  const url = `https://archive-api.open-meteo.com/v1/archive?` +
    `latitude=${latitude}&` +
    `longitude=${longitude}&` +
    `start_date=${formattedDate}&` +
    `end_date=${formattedDate}&` +
    `hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,wind_speed_10m&` +
    `daily=sunset,sunrise&` +
    `timezone=auto`;
  
  console.log(`${colors.cyan}Fetching weather data...${colors.reset}`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Fetch air quality data from Open-Meteo API
 */
async function fetchAQIData(latitude, longitude, date) {
  const formattedDate = date.toISOString().split('T')[0];
  
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?` +
    `latitude=${latitude}&` +
    `longitude=${longitude}&` +
    `start_date=${formattedDate}&` +
    `end_date=${formattedDate}&` +
    `hourly=us_aqi&` +
    `timezone=auto`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.log(`${colors.yellow}⚠️  AQI data not available${colors.reset}`);
    return null;
  }
}

/**
 * Calculate sunset hour index
 * CRITICAL: Must match app logic exactly (uses CLOSEST hour for precision)
 */
function getSunsetHourIndex(sunsetDateTime) {
  const sunsetDate = new Date(sunsetDateTime);
  const hours = sunsetDate.getHours();
  const minutes = sunsetDate.getMinutes();
  
  // Use closest hour: if >= 30 minutes, closer to next hour
  const sunsetHour = minutes >= 30 ? hours + 1 : hours;
  
  // Ensure we don't exceed 23:00
  return Math.min(sunsetHour, 23);
}

/**
 * Test sunset score for a specific date and location
 */
async function testSunsetScore(latitude, longitude, date, locationName = 'Test Location') {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${colors.bright}${colors.cyan}Testing Sunset Quality Score${colors.reset}`);
  console.log(`${'='.repeat(80)}\n`);
  
  console.log(`${colors.bright}Location:${colors.reset} ${locationName}`);
  console.log(`${colors.bright}Coordinates:${colors.reset} ${latitude}, ${longitude}`);
  console.log(`${colors.bright}Date:${colors.reset} ${date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}\n`);
  
  try {
    // Fetch weather and AQI data
    const weatherData = await fetchWeatherData(latitude, longitude, date);
    const aqiData = await fetchAQIData(latitude, longitude, date);
    
    // Get sunset time
    const sunsetDateTime = weatherData.daily.sunset[0];
    const sunsetTime = new Date(sunsetDateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    console.log(`${colors.bright}Sunset Time:${colors.reset} ${sunsetTime}\n`);
    
    // Calculate sunset hour index
    const sunsetHour = getSunsetHourIndex(sunsetDateTime);
    
    // Extract weather at sunset hour
    const weatherCode = weatherData.hourly.weather_code[sunsetHour] || 0;
    const cloudCoverage = weatherData.hourly.cloud_cover[sunsetHour] || 0;
    const cloudCoverageLow = weatherData.hourly.cloud_cover_low[sunsetHour] || 0;
    const cloudCoverageMid = weatherData.hourly.cloud_cover_mid[sunsetHour] || 0;
    const cloudCoverageHigh = weatherData.hourly.cloud_cover_high[sunsetHour] || 0;
    const humidity = weatherData.hourly.relative_humidity_2m[sunsetHour] || 50;
    const precipChance = weatherData.hourly.precipitation_probability[sunsetHour] || 0;
    const visibility = weatherData.hourly.visibility[sunsetHour] || 10000;
    const windSpeed = weatherData.hourly.wind_speed_10m[sunsetHour] || 5;
    
    // Get AQI
    let aqi = 50;
    if (aqiData && aqiData.hourly && aqiData.hourly.us_aqi) {
      aqi = aqiData.hourly.us_aqi[sunsetHour] || 50;
    }
    
    // Display weather conditions
    console.log(`${colors.bright}Weather Conditions at Sunset:${colors.reset}`);
    console.log(`${colors.white}${'─'.repeat(80)}${colors.reset}`);
    console.log(`  Weather Code:        ${weatherCode}`);
    console.log(`  Total Cloud Cover:   ${cloudCoverage}%`);
    console.log(`  High Clouds (>8km):  ${cloudCoverageHigh}% ${cloudCoverageHigh > 40 ? '✨ (Great for sunsets!)' : ''}`);
    console.log(`  Mid Clouds (3-8km):  ${cloudCoverageMid}%`);
    console.log(`  Low Clouds (0-3km):  ${cloudCoverageLow}% ${cloudCoverageLow > 60 ? '⚠️  (May block sunset)' : ''}`);
    console.log(`  Humidity:            ${humidity}%`);
    console.log(`  Precipitation:       ${precipChance}%`);
    console.log(`  Visibility:          ${(visibility / 1000).toFixed(1)} km`);
    console.log(`  Wind Speed:          ${windSpeed} km/h`);
    console.log(`  Air Quality (AQI):   ${aqi}`);
    console.log(`${colors.white}${'─'.repeat(80)}${colors.reset}\n`);
    
    // Create weather object for scoring
    const weatherForScoring = {
      cloud_coverage: cloudCoverage,
      cloud_coverage_low: cloudCoverageLow,
      cloud_coverage_mid: cloudCoverageMid,
      cloud_coverage_high: cloudCoverageHigh,
      precipitation_chance: precipChance,
      humidity: humidity,
      air_quality_index: Math.round(aqi),
      visibility: visibility,
      wind_speed: windSpeed
    };
    
    // Calculate sunset score
    const scoreResult = getSunsetQualityScore(weatherForScoring);
    
    // Display result
    const scoreColor = getScoreColor(scoreResult.score);
    console.log(`${colors.bright}${colors.green}SUNSET QUALITY SCORE${colors.reset}`);
    console.log(`${colors.white}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${scoreColor}${colors.bright}  ${scoreResult.score}/100 - ${scoreResult.conditions}${colors.reset}`);
    console.log(`${colors.white}${'═'.repeat(80)}${colors.reset}\n`);
    
    // Score interpretation
    console.log(`${colors.bright}Score Interpretation:${colors.reset}`);
    if (scoreResult.score >= 90) {
      console.log(`  ${colors.magenta}🌅 SPECTACULAR!${colors.reset} Perfect conditions for an amazing sunset!`);
    } else if (scoreResult.score >= 80) {
      console.log(`  ${colors.red}✨ EXCELLENT!${colors.reset} Great conditions for a beautiful sunset!`);
    } else if (scoreResult.score >= 60) {
      console.log(`  ${colors.yellow}👍 GOOD${colors.reset} - Should see nice colors in the sky.`);
    } else if (scoreResult.score >= 40) {
      console.log(`  ${colors.cyan}😐 FAIR${colors.reset} - Might see some colors, but not spectacular.`);
    } else {
      console.log(`  ${colors.blue}☁️  POOR${colors.reset} - Unlikely to see vibrant sunset colors.`);
    }
    
    console.log(`\n${'='.repeat(80)}\n`);
    
    return scoreResult;
    
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    console.log(`\n${colors.yellow}Note: Historical data may not be available for recent dates.`);
    console.log(`Try testing dates from 2024 or earlier.${colors.reset}\n`);
    throw error;
  }
}

/**
 * Test multiple predefined locations and dates
 */
async function runBatchTests() {
  const testCases = [
    {
      name: 'New York City',
      latitude: 40.7128,
      longitude: -74.0060,
      date: new Date('2024-09-15') // Fall sunset
    },
    {
      name: 'Los Angeles',
      latitude: 34.0522,
      longitude: -118.2437,
      date: new Date('2024-08-20') // Summer sunset
    },
    {
      name: 'Miami',
      latitude: 25.7617,
      longitude: -80.1918,
      date: new Date('2024-07-04') // Fourth of July
    },
    {
      name: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
      date: new Date('2024-10-01') // Fall sunset
    },
    {
      name: 'Chicago',
      latitude: 41.8781,
      longitude: -87.6298,
      date: new Date('2024-06-21') // Summer solstice
    }
  ];
  
  console.log(`${colors.bright}${colors.green}Running Batch Tests...${colors.reset}\n`);
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const result = await testSunsetScore(
        testCase.latitude,
        testCase.longitude,
        testCase.date,
        testCase.name
      );
      results.push({ ...testCase, ...result });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`${colors.red}Failed to test ${testCase.name}${colors.reset}\n`);
    }
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.cyan}TEST SUMMARY${colors.reset}`);
  console.log(`${'='.repeat(80)}\n`);
  
  results.sort((a, b) => b.score - a.score);
  
  results.forEach((result, index) => {
    const scoreColor = getScoreColor(result.score);
    console.log(`${index + 1}. ${scoreColor}${result.name}${colors.reset}: ${scoreColor}${result.score}/100${colors.reset} (${result.conditions})`);
  });
  
  console.log(`\n${'='.repeat(80)}\n`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length >= 2) {
  // Test specific location from command line
  const latitude = parseFloat(args[0]);
  const longitude = parseFloat(args[1]);
  const dateStr = args[2] || '2024-09-15'; // Default date
  const locationName = args[3] || `${latitude}, ${longitude}`;
  
  if (isNaN(latitude) || isNaN(longitude)) {
    console.error(`${colors.red}Error: Invalid coordinates${colors.reset}`);
    console.log('Usage: node test-sunset-scoring.js <latitude> <longitude> [date] [location_name]');
    console.log('Example: node test-sunset-scoring.js 40.7128 -74.0060 2024-09-15 "New York"');
    process.exit(1);
  }
  
  const testDate = new Date(dateStr);
  testSunsetScore(latitude, longitude, testDate, locationName);
  
} else {
  // Run batch tests
  runBatchTests();
}
