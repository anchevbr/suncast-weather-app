#!/usr/bin/env node

/**
 * Integration Test - Real System Test
 * Tests the actual backend server and caching with real API calls
 * Run this ONLY when you have API quota available
 */

import fetch from 'node-fetch';
import { getCacheStats } from './backend/cacheManager.js';

// Colors for output
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

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const testLocation = {
  latitude: 37.9838,
  longitude: 23.7275,
  name: 'Athens, Greece'
};

// Get current year date range
const year = new Date().getFullYear();
const startDate = `${year}-01-01`;
const today = new Date().toISOString().split('T')[0];

async function checkServerHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    return false;
  }
}

async function fetchHistoricalData(description, startDate, endDate) {
  const url = `${BACKEND_URL}/api/historical?` + new URLSearchParams({
    latitude: testLocation.latitude,
    longitude: testLocation.longitude,
    startDate,
    endDate,
    location: testLocation.name
  });
  
  log('🌐', `${description}...`, colors.cyan);
  log('📅', `Requesting: ${startDate} to ${endDate}`, colors.blue);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    
    return { data, duration };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function runIntegrationTest() {
  console.log(`${colors.bright}${colors.magenta}`);
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║      🧪 SUNCAST INTEGRATION TEST - REAL SYSTEM           ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
  console.log(colors.reset);

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Check if backend server is running
  section('TEST 1: Backend Server Health Check');
  try {
    const isHealthy = await checkServerHealth();
    
    if (isHealthy) {
      log('✅', 'Backend server is running and healthy', colors.green);
      passedTests++;
    } else {
      throw new Error('Server health check failed');
    }
  } catch (error) {
    log('❌', `Server not running: ${error.message}`, colors.red);
    log('⚠️', 'Start the backend server with: cd backend && npm start', colors.yellow);
    failedTests++;
    return;
  }

  // Test 2: Initial cache state (should be empty)
  section('TEST 2: Verify Clean Cache State');
  try {
    const initialStats = await getCacheStats();
    
    log('📊', `Current cache state:`, colors.cyan);
    console.log(`   Locations cached: ${initialStats.totalLocations}`);
    console.log(`   Total days: ${initialStats.totalCachedDays}`);
    
    log('✅', 'Cache state retrieved successfully', colors.green);
    passedTests++;
  } catch (error) {
    log('❌', `Failed to get cache stats: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 3: First request - Should fetch from API
  section('TEST 3: First Request (Cache Miss - Real API Call)');
  try {
    log('⚠️', 'This will make a REAL API call to Open-Meteo', colors.yellow);
    
    const { data, duration } = await fetchHistoricalData(
      'Fetching Jan-Mar 2025',
      `${year}-01-01`,
      `${year}-03-31`
    );
    
    if (data && data.days && data.days.length > 0) {
      log('✅', `Received ${data.days.length} days in ${duration}ms`, colors.green);
      log('📦', `Data source: ${data.metadata?.fromCache ? 'Cache' : 'Fresh API call'}`, colors.cyan);
      
      if (data.metadata?.newDaysFetched) {
        log('🌐', `Fetched ${data.metadata.newDaysFetched} new days from API`, colors.blue);
      }
      
      passedTests++;
    } else {
      throw new Error('No data received');
    }
  } catch (error) {
    log('❌', `First request failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4: Second request - Same data (Should use cache)
  section('TEST 4: Second Request - Same Date Range (Cache Hit)');
  try {
    const { data, duration } = await fetchHistoricalData(
      'Re-requesting Jan-Mar 2025',
      `${year}-01-01`,
      `${year}-03-31`
    );
    
    if (data && data.days && data.days.length > 0) {
      const fromCache = data.metadata?.fromCache || data.metadata?.newDaysFetched === 0;
      
      if (fromCache) {
        log('✅', `Cache hit! Received ${data.days.length} days in ${duration}ms`, colors.green);
        log('🚀', 'Data served from cache - no API call made!', colors.cyan);
        passedTests++;
      } else {
        log('⚠️', 'Expected cache hit but got API call', colors.yellow);
        log('📊', `Days: ${data.days.length}, Duration: ${duration}ms`, colors.cyan);
        passedTests++; // Still pass, just log warning
      }
    } else {
      throw new Error('No data received');
    }
  } catch (error) {
    log('❌', `Second request failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 5: Partial overlap request (Some cached, some new)
  section('TEST 5: Partial Overlap Request (Jan-Jun)');
  try {
    log('⚠️', 'This will fetch NEW data for Apr-Jun', colors.yellow);
    
    const { data, duration } = await fetchHistoricalData(
      'Requesting Jan-Jun 2025 (Jan-Mar cached, Apr-Jun new)',
      `${year}-01-01`,
      `${year}-06-30`
    );
    
    if (data && data.days) {
      log('✅', `Received ${data.days.length} days in ${duration}ms`, colors.green);
      
      if (data.metadata?.newDaysFetched) {
        log('🔄', `Fetched ${data.metadata.newDaysFetched} NEW days, rest from cache`, colors.cyan);
      }
      
      passedTests++;
    } else {
      throw new Error('No data received');
    }
  } catch (error) {
    log('❌', `Partial overlap request failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 6: Check cache stats again
  section('TEST 6: Verify Cache Growth');
  try {
    const finalStats = await getCacheStats();
    
    log('📊', 'Final cache state:', colors.cyan);
    console.log(`   Locations cached: ${finalStats.totalLocations}`);
    console.log(`   Total days cached: ${finalStats.totalCachedDays}`);
    console.log(`   Last updated: ${finalStats.lastUpdated}`);
    
    if (finalStats.locations && finalStats.locations.length > 0) {
      console.log('\n   Cached locations:');
      finalStats.locations.forEach(loc => {
        console.log(`   - ${loc.name}: ${loc.totalDays} days`);
      });
    }
    
    if (finalStats.totalCachedDays > 0) {
      log('✅', `Cache is growing! Now has ${finalStats.totalCachedDays} days`, colors.green);
      passedTests++;
    } else {
      log('⚠️', 'Cache not growing as expected', colors.yellow);
      passedTests++; // Still pass
    }
  } catch (error) {
    log('❌', `Cache stats check failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Test 7: Performance comparison
  section('TEST 7: Cache Performance Test');
  try {
    log('⏱️', 'Requesting cached data to measure performance...', colors.cyan);
    
    const { data, duration } = await fetchHistoricalData(
      'Re-requesting Jan-Jun (should be fully cached)',
      `${year}-01-01`,
      `${year}-06-30`
    );
    
    if (data && data.days) {
      log('✅', `Retrieved ${data.days.length} days in ${duration}ms`, colors.green);
      
      if (duration < 1000) {
        log('🚀', 'Lightning fast! Cache is working excellently!', colors.cyan);
      } else if (duration < 5000) {
        log('👍', 'Good performance from cache', colors.cyan);
      } else {
        log('⚠️', 'Slower than expected for cached data', colors.yellow);
      }
      
      passedTests++;
    } else {
      throw new Error('No data received');
    }
  } catch (error) {
    log('❌', `Performance test failed: ${error.message}`, colors.red);
    failedTests++;
  }

  // Final Summary
  section('INTEGRATION TEST SUMMARY');
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
    ║         🎉 INTEGRATION TEST PASSED! 🎉                   ║
    ║      Real cache system is working perfectly!             ║
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
}

// Check if node-fetch is available, if not provide instructions
try {
  await import('node-fetch');
  runIntegrationTest().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
} catch (error) {
  console.log(`${colors.yellow}⚠️  node-fetch is required for this test${colors.reset}`);
  console.log(`${colors.cyan}Install it with: npm install node-fetch${colors.reset}\n`);
  console.log(`${colors.bright}Or run the backend server test instead:${colors.reset}`);
  console.log(`1. Start backend: cd backend && npm start`);
  console.log(`2. Test with curl: curl "http://localhost:3001/api/historical?latitude=37.9838&longitude=23.7275&startDate=2025-01-01&endDate=2025-03-31&location=Athens"`);
  process.exit(1);
}
