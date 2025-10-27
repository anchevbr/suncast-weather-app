/**
 * Configurable Historical Sunset Testing Script
 * Uses the EXACT same modules as the app
 * 
 * IMPORTANT: ABOUT DATE MATCHING WITH APP
 * =========================================
 * Your app ONLY fetches CURRENT YEAR data for "Year's Best Sunsets"
 * This tester uses the same service, so it will also fetch current year only
 * 
 * To match app results: Use dates from CURRENT YEAR (2025)
 * 
 * USAGE:
 * 1. Set TEST_DATE below (format: 'YYYY-MM-DD')
 * 2. Set LOCATION below (latitude, longitude, name)
 * 3. Run: node historical-sunset-tester.js
 * 
 * EXAMPLES:
 * - TEST_DATE = '2025-01-18' (January 18, 2025) ← Current year
 * - TEST_DATE = '2025-10-25' (October 25, 2025) ← Current year
 * - TEST_DATE = '2025-11-26' (November 26, 2025) ← Current year
 * 
 * LOCATIONS:
 * - Athens: 38.090855, 23.760100
 * - NYC: 40.7128, -74.0060
 * - London: 51.5074, -0.1278
 * - Tokyo: 35.6762, 139.6503
 */

// Mock environment for Node.js (if needed)
if (typeof globalThis.import === 'undefined') {
  globalThis.import = {
    meta: {
      env: {
        VITE_OPENMETEO_API_KEY: 'ldi3ld7WP7gJiKTK'  // Use the SAME API key as the app
      }
    }
  };
}

// Import the EXACT functions the app uses
import { fetchHistoricalForecast } from './src/services/historicalService.js';

// ============================================================================
// CONFIGURATION - CHANGE THESE VALUES TO TEST DIFFERENT DATES/LOCATIONS
// ============================================================================

// Test date (format: 'YYYY-MM-DD')
const TEST_DATE = '2025-09-07';

// Location coordinates
const LOCATION = {
  latitude: 38.090855,    // Athens, Greece
  longitude: 23.760100,
  name: 'Athens, Greece'
};

// Alternative locations (uncomment to use):
// const LOCATION = {
//   latitude: 40.7128,     // New York City
//   longitude: -74.0060,
//   name: 'New York City'
// };

// const LOCATION = {
//   latitude: 51.5074,     // London
//   longitude: -0.1278,
//   name: 'London, UK'
// };

// const LOCATION = {
//   latitude: 35.6762,     // Tokyo
//   longitude: 139.6503,
//   name: 'Tokyo, Japan'
// };

// const LOCATION = {
//   latitude: 48.8566,     // Paris
//   longitude: 2.3522,
//   name: 'Paris, France'
// };

// const LOCATION = {
//   latitude: 37.7749,     // San Francisco
//   longitude: -122.4194,
//   name: 'San Francisco, CA'
// };

// ============================================================================

// Use the app's historical service directly

async function checkHistoricalConditions() {
  try {
    const testDate = new Date(TEST_DATE);
    const month = testDate.getMonth();
    const day = testDate.getDate();
    
    console.log(`🔍 Checking conditions for ${TEST_DATE}...`);
    console.log(`📍 Location: ${LOCATION.name} (${LOCATION.latitude}, ${LOCATION.longitude})`);
    
    // Use the app's historical service directly
    console.log('\n📡 Fetching historical data using app service...');
    const historicalData = await fetchHistoricalForecast(LOCATION);
    
    console.log('✅ Historical data fetched successfully');
    console.log(`📊 Total days processed: ${historicalData.days.length}`);
    
    // Find the test date in the processed data
    const testData = historicalData.days.find(dayData => {
      const date = new Date(dayData.date);
      return date.getMonth() === month && date.getDate() === day;
    });
    
    if (testData) {
      console.log(`\n🎯 ${TEST_DATE.toUpperCase()} CONDITIONS:`);
      console.log('=====================================');
      console.log(`📅 Date: ${testData.formatted_date}`);
      console.log(`🌅 Sunset Time: ${testData.sunset_time}`);
      console.log(`🎯 Sunset Score: ${testData.score}/100`);
      console.log(`📊 Conditions: ${testData.conditions}`);
      console.log('\n📈 DETAILED WEATHER CONDITIONS:');
      console.log(`🌤️ Weather Code: ${testData.weather_code}`);
      console.log(`☁️ Total Cloud Coverage: ${testData.cloud_coverage}%`);
      console.log(`☁️ Low Clouds (0-3km): ${testData.cloud_coverage_low}%`);
      console.log(`☁️ Mid Clouds (3-8km): ${testData.cloud_coverage_mid}%`);
      console.log(`☁️ High Clouds (>8km): ${testData.cloud_coverage_high}%`);
      console.log(`💧 Humidity: ${testData.humidity}%`);
      console.log(`🌧️ Precipitation Chance: ${testData.precipitation_chance}%`);
      console.log(`👁️ Visibility: ${testData.visibility}m`);
      console.log(`💨 Wind Speed: ${testData.wind_speed} m/s`);
      console.log(`🌫️ Air Quality Index: ${testData.air_quality_index}`);
      
      console.log('\n📊 SCORE BREAKDOWN:');
      console.log('==================');
      console.log(`Final Score: ${testData.score}/100`);
      console.log(`Rating: ${testData.conditions}`);
      
      // Provide interpretation
      let interpretation = '';
      if (testData.score >= 90) {
        interpretation = '🌟 EXCEPTIONAL sunset conditions! Perfect for photography and viewing.';
      } else if (testData.score >= 80) {
        interpretation = '✨ EXCELLENT sunset conditions! Very good for sunset viewing.';
      } else if (testData.score >= 70) {
        interpretation = '🌅 GOOD sunset conditions! Worth watching the sunset.';
      } else if (testData.score >= 60) {
        interpretation = '🌤️ FAIR sunset conditions. Decent but not spectacular.';
      } else if (testData.score >= 50) {
        interpretation = '☁️ POOR sunset conditions. Clouds likely blocking the view.';
      } else {
        interpretation = '🌧️ VERY POOR sunset conditions. Heavy clouds or precipitation.';
      }
      
      console.log(`\n💭 INTERPRETATION: ${interpretation}`);
      
      // Show what made this score good/bad
      console.log('\n🔍 SCORE ANALYSIS:');
      console.log('==================');
      if (testData.cloud_coverage_high >= 80) {
        console.log(`✅ EXCELLENT: ${testData.cloud_coverage_high}% high clouds - perfect for sunset colors!`);
      } else if (testData.cloud_coverage_high >= 60) {
        console.log(`✅ GOOD: ${testData.cloud_coverage_high}% high clouds - good for sunset colors`);
      } else if (testData.cloud_coverage_high >= 40) {
        console.log(`⚠️ MODERATE: ${testData.cloud_coverage_high}% high clouds - decent sunset potential`);
      } else {
        console.log(`❌ POOR: Only ${testData.cloud_coverage_high}% high clouds - limited sunset colors`);
      }
      
      if (testData.cloud_coverage_low >= 60) {
        console.log(`❌ PROBLEM: ${testData.cloud_coverage_low}% low clouds - blocking sunlight`);
      } else if (testData.cloud_coverage_low >= 40) {
        console.log(`⚠️ CONCERN: ${testData.cloud_coverage_low}% low clouds - may reduce colors`);
      } else {
        console.log(`✅ GOOD: Only ${testData.cloud_coverage_low}% low clouds - sunlight not blocked`);
      }
      
    } else {
      console.log(`\n❌ Could not find data for ${TEST_DATE}`);
      console.log('Available dates:', historicalData.days.slice(0, 5).map(day => day.date));
    }
    
  } catch (error) {
    console.error(`❌ Error checking ${TEST_DATE} conditions:`, error);
  }
}

// Run the check
checkHistoricalConditions();
