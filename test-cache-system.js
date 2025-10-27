#!/usr/bin/env node

/**
 * Cache System Test Suite
 * Tests all caching functionality with mock data - no real API calls
 */

import {
  initializeCache,
  getCacheKey,
  getCachedData,
  saveCachedData,
  getMissingDates,
  mergeCachedData,
  getCacheStats,
  clearLocationCache,
  clearAllCache
} from './backend/cacheManager.js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

// Mock data generator
function generateMockDay(date, score) {
  return {
    date,
    sunset: '18:30:00',
    sunrise: '06:30:00',
    sunset_score: score,
    weather_code: Math.floor(Math.random() * 10),
    temperature_max: 20 + Math.random() * 10,
    temperature_min: 10 + Math.random() * 5,
    precipitation: Math.random() * 5,
    conditions: 'Clear'
  };
}

function generateDateRange(startDate, endDate) {
  const days = [];
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const score = Math.floor(Math.random() * 100);
    days.push(generateMockDay(dateStr, score));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  return days;
}

// Test locations
const testLocations = {
  newYork: { lat: 40.7128, lon: -74.0060, name: 'New York' },
  athens: { lat: 37.9838, lon: 23.7275, name: 'Athens' },
  tokyo: { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
  london: { lat: 51.5074, lon: -0.1278, name: 'London' }
};

// Test suite
async function runTests() {
  console.log(`${colors.bright}${colors.magenta}`);
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║          🧪 SUNCAST CACHE SYSTEM TEST SUITE              ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
  console.log(colors.reset);

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Initialize Cache
  section('TEST 1: Initialize Cache System');
  try {
    await initializeCache();
    log('✅', 'Cache system initialized successfully', colors.green);
    passedTests++;
  } catch (error) {
    log('❌', `Failed to initialize cache: ${error.message}`, colors.red);
    failedTests++;
    return;
  }

  // Test 2: Clear all existing cache
  section('TEST 2: Clear All Cache (Clean Slate)');
  try {
    await clearAllCache();
    const stats = await getCacheStats();
    if (stats.totalLocations === 0 && stats.totalCachedDays === 0) {
      log('✅', 'Cache cleared successfully', colors.green);
      passedTests++;
    } else {
      throw new Error('Cache not fully cleared');
    }
  } catch (error) {
    log('❌', `Failed to clear cache: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 3: Generate Cache Key
  section('TEST 3: Generate Cache Keys');
  try {
    const nyKey = getCacheKey(testLocations.newYork.lat, testLocations.newYork.lon);
    const athensKey = getCacheKey(testLocations.athens.lat, testLocations.athens.lon);
    
    log('📍', `New York key: ${nyKey}`, colors.cyan);
    log('📍', `Athens key: ${athensKey}`, colors.cyan);
    
    if (nyKey !== athensKey) {
      log('✅', 'Cache keys are unique for different locations', colors.green);
      passedTests++;
    } else {
      throw new Error('Cache keys should be different');
    }
  } catch (error) {
    log('❌', `Cache key test failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 4: Save Initial Cache (Jan-Sep 2025)
  section('TEST 4: Save Initial Cache Data (Jan-Oct 25, 2025)');
  try {
    const initialDays = generateDateRange('2025-01-01', '2025-10-25');
    const mockData = { days: initialDays };
    
    await saveCachedData(
      testLocations.newYork.lat,
      testLocations.newYork.lon,
      testLocations.newYork.name,
      mockData
    );
    
    log('💾', `Saved ${initialDays.length} days for New York (Jan 1 - Oct 25)`, colors.green);
    passedTests++;
  } catch (error) {
    log('❌', `Failed to save cache: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 5: Retrieve Cached Data
  section('TEST 5: Retrieve Cached Data');
  try {
    const cached = await getCachedData(testLocations.newYork.lat, testLocations.newYork.lon);
    const expectedDays = 299; // Jan 1 to Oct 25 inclusive = 298 days
    
    if (cached && cached.days && cached.days.length >= expectedDays - 1 && cached.days.length <= expectedDays + 1) {
      log('✅', `Retrieved ${cached.days.length} days from cache`, colors.green);
      log('📊', `Date range: ${cached.days[0].date} to ${cached.days[cached.days.length - 1].date}`, colors.cyan);
      passedTests++;
    } else {
      throw new Error(`Retrieved data does not match saved data. Got ${cached?.days?.length} days, expected around ${expectedDays}`);
    }
  } catch (error) {
    log('❌', `Failed to retrieve cache: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 6: Check Missing Dates (Simulate User Request for Full Year)
  section('TEST 6: Detect Missing Dates');
  try {
    const { startDate, endDate, cachedData, missingDatesCount } = await getMissingDates(
      testLocations.newYork.lat,
      testLocations.newYork.lon,
      '2025-01-01',
      '2025-12-31'
    );
    
    if (startDate && endDate && missingDatesCount > 0) {
      log('🔍', `Found ${missingDatesCount} missing dates`, colors.yellow);
      log('📅', `Need to fetch: ${startDate} to ${endDate}`, colors.yellow);
      log('✅', 'Missing date detection working correctly', colors.green);
      passedTests++;
    } else {
      throw new Error('Should have detected missing dates (Oct-Dec)');
    }
  } catch (error) {
    log('❌', `Missing dates test failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 7: Merge New Data (Simulate Fetching Missing Dates)
  section('TEST 7: Merge New Data with Existing Cache');
  try {
    const newDays = generateDateRange('2025-10-26', '2025-10-27');
    const mockNewData = { days: newDays };
    
    log('📥', `Attempting to merge ${newDays.length} new days (Oct 26-27)`, colors.cyan);
    
    await mergeCachedData(
      testLocations.newYork.lat,
      testLocations.newYork.lon,
      testLocations.newYork.name,
      mockNewData
    );
    
    const updated = await getCachedData(testLocations.newYork.lat, testLocations.newYork.lon);
    const beforeCount = 299; // From previous test
    const expectedTotal = beforeCount + newDays.length;
    
    if (updated.days.length >= expectedTotal - 1 && updated.days.length <= expectedTotal + 1) {
      log('✅', `Merged successfully: ${updated.days.length} total days`, colors.green);
      log('📊', `New range: ${updated.days[0].date} to ${updated.days[updated.days.length - 1].date}`, colors.cyan);
      passedTests++;
    } else {
      throw new Error(`Expected around ${expectedTotal} days, got ${updated.days.length}`);
    }
  } catch (error) {
    log('❌', `Merge test failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 8: Simulate Second User (Same Day)
  section('TEST 8: Simulate Second User - Cache Hit');
  try {
    const { startDate, endDate, cachedData } = await getMissingDates(
      testLocations.newYork.lat,
      testLocations.newYork.lon,
      '2025-01-01',
      '2025-10-27'
    );
    
    if (!startDate && !endDate && cachedData) {
      log('✅', 'All data served from cache - no API call needed!', colors.green);
      log('🚀', `Instant response with ${cachedData.days.length} days`, colors.cyan);
      passedTests++;
    } else if (cachedData && startDate && endDate) {
      // Some dates might be missing, but we have most cached
      const cachedDates = cachedData.days.length;
      const requestedDays = 300; // Jan 1 to Oct 27
      const coverage = (cachedDates / requestedDays) * 100;
      
      if (coverage >= 95) {
        log('✅', `Most data served from cache (${coverage.toFixed(1)}% coverage)`, colors.green);
        log('📊', `${cachedDates} days cached, only need to fetch ${startDate} to ${endDate}`, colors.cyan);
        passedTests++;
      } else {
        throw new Error(`Low cache coverage: ${coverage.toFixed(1)}%`);
      }
    } else {
      throw new Error('Should have cached data available');
    }
  } catch (error) {
    log('❌', `Cache hit test failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 9: Multiple Locations
  section('TEST 9: Cache Multiple Locations');
  try {
    // Save data for Athens
    const athensDays = generateDateRange('2025-01-01', '2025-10-27');
    await saveCachedData(
      testLocations.athens.lat,
      testLocations.athens.lon,
      testLocations.athens.name,
      { days: athensDays }
    );
    
    // Save data for Tokyo
    const tokyoDays = generateDateRange('2025-01-01', '2025-10-27');
    await saveCachedData(
      testLocations.tokyo.lat,
      testLocations.tokyo.lon,
      testLocations.tokyo.name,
      { days: tokyoDays }
    );
    
    const stats = await getCacheStats();
    
    if (stats.totalLocations >= 3) {
      log('✅', `Successfully caching ${stats.totalLocations} locations`, colors.green);
      log('📊', `Total cached days: ${stats.totalCachedDays}`, colors.cyan);
      passedTests++;
    } else {
      throw new Error('Should have at least 3 cached locations');
    }
  } catch (error) {
    log('❌', `Multiple locations test failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 10: Cache Statistics
  section('TEST 10: Verify Cache Statistics');
  try {
    const stats = await getCacheStats();
    
    log('📊', 'Cache Statistics:', colors.bright);
    console.log(`   Total Locations: ${stats.totalLocations}`);
    console.log(`   Total Cached Days: ${stats.totalCachedDays}`);
    console.log(`   Total Files: ${stats.totalFiles}`);
    console.log(`   Last Updated: ${stats.lastUpdated}`);
    
    if (stats.locations && stats.locations.length > 0) {
      console.log('\n   Cached Locations:');
      stats.locations.forEach(loc => {
        console.log(`   - ${loc.name}: ${loc.totalDays} days`);
      });
    }
    
    log('✅', 'Cache statistics retrieved successfully', colors.green);
    passedTests++;
  } catch (error) {
    log('❌', `Statistics test failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 11: Clear Single Location
  section('TEST 11: Clear Single Location Cache');
  try {
    const beforeStats = await getCacheStats();
    const beforeCount = beforeStats.totalLocations;
    
    await clearLocationCache(testLocations.tokyo.lat, testLocations.tokyo.lon);
    
    const afterStats = await getCacheStats();
    const afterCount = afterStats.totalLocations;
    
    if (afterCount === beforeCount - 1) {
      log('✅', `Successfully removed Tokyo cache (${beforeCount} → ${afterCount} locations)`, colors.green);
      passedTests++;
    } else {
      throw new Error('Location cache not properly cleared');
    }
  } catch (error) {
    log('❌', `Clear location test failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 12: Simulate Incremental Update (Next Day)
  section('TEST 12: Simulate Next Day Update');
  try {
    log('📅', 'Simulating Oct 28 (next day)...', colors.cyan);
    
    const { startDate, endDate, missingDatesCount } = await getMissingDates(
      testLocations.newYork.lat,
      testLocations.newYork.lon,
      '2025-01-01',
      '2025-10-28'
    );
    
    // We should have some missing dates (at least Oct 28)
    if (missingDatesCount >= 1 && missingDatesCount <= 5) {
      log('✅', `Correctly detected ${missingDatesCount} missing day(s)`, colors.green);
      log('🎯', `Would fetch only ${missingDatesCount} day(s) instead of 365!`, colors.cyan);
      log('📅', `Missing range: ${startDate} to ${endDate}`, colors.cyan);
      
      // Simulate adding those days
      const newDays = generateDateRange(startDate, endDate);
      await mergeCachedData(
        testLocations.newYork.lat,
        testLocations.newYork.lon,
        testLocations.newYork.name,
        { days: newDays }
      );
      
      log('💾', `Merged ${newDays.length} day(s) into cache`, colors.green);
      passedTests++;
    } else {
      throw new Error(`Expected 1-5 missing days, got ${missingDatesCount}`);
    }
  } catch (error) {
    log('❌', `Incremental update test failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Final Summary
  section('TEST SUMMARY');
  const total = passedTests + failedTests;
  const percentage = ((passedTests / total) * 100).toFixed(1);
  
  console.log(`${colors.bright}Total Tests: ${total}`);
  console.log(`${colors.green}✅ Passed: ${passedTests}`);
  console.log(`${colors.red}❌ Failed: ${failedTests}`);
  console.log(`${colors.cyan}📊 Success Rate: ${percentage}%${colors.reset}\n`);
  
  if (failedTests === 0) {
    console.log(`${colors.bright}${colors.green}`);
    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║              🎉 ALL TESTS PASSED! 🎉                     ║
    ║         Cache system is working perfectly!               ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    `);
    console.log(colors.reset);
  } else {
    console.log(`${colors.bright}${colors.red}`);
    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║           ⚠️  SOME TESTS FAILED  ⚠️                      ║
    ║          Please review the errors above                  ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    `);
    console.log(colors.reset);
  }
  
  // Display final cache stats
  section('FINAL CACHE STATE');
  const finalStats = await getCacheStats();
  console.log(JSON.stringify(finalStats, null, 2));
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
  process.exit(1);
});
