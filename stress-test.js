#!/usr/bin/env node

/**
 * Suncast Application Stress Test & Debug Script
 * Tests all major functionality and provides detailed debugging information
 */

import puppeteer from 'puppeteer';
import { performance } from 'perf_hooks';

// Configuration
const CONFIG = {
  BASE_URL: 'http://localhost:5181',
  TIMEOUT: 30000,
  VIEWPORT: { width: 1920, height: 1080 },
  TEST_LOCATIONS: [
    'New York',
    'London',
    'Tokyo',
    'Sydney',
    'Paris',
    'Los Angeles',
    'Berlin',
    'Rome',
    'Madrid',
    'Amsterdam'
  ],
  PERFORMANCE_THRESHOLDS: {
    PAGE_LOAD: 3000,      // 3 seconds
    SEARCH_RESPONSE: 2000, // 2 seconds
    ANIMATION_COMPLETE: 5000, // 5 seconds
    MEMORY_USAGE: 100,    // 100MB
  }
};

// Test Results Storage
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  performance: {},
  memory: {},
  screenshots: []
};

// Utility Functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const logError = (error, context = '') => {
  const errorMsg = `${context ? `${context}: ` : ''}${error.message}`;
  log(errorMsg, 'error');
  testResults.errors.push({
    context,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  testResults.failed++;
};

const logSuccess = (message) => {
  log(message, 'success');
  testResults.passed++;
};

const measurePerformance = (name, fn) => {
  const start = performance.now();
  const startMemory = process.memoryUsage();
  
  return fn().then(result => {
    const end = performance.now();
    const endMemory = process.memoryUsage();
    const duration = end - start;
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    testResults.performance[name] = {
      duration,
      memoryDelta,
      timestamp: new Date().toISOString()
    };
    
    log(`Performance: ${name} - ${duration.toFixed(2)}ms, Memory: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    return result;
  });
};

// Test Functions
const testPageLoad = async (page) => {
  log('Testing page load...');
  
  try {
    const startTime = performance.now();
    await page.goto(CONFIG.BASE_URL, { waitUntil: 'networkidle0', timeout: CONFIG.TIMEOUT });
    const loadTime = performance.now() - startTime;
    
    if (loadTime > CONFIG.PERFORMANCE_THRESHOLDS.PAGE_LOAD) {
      log(`Page load took ${loadTime.toFixed(2)}ms (threshold: ${CONFIG.PERFORMANCE_THRESHOLDS.PAGE_LOAD}ms)`, 'warning');
    }
    
    // Check if main elements are present
    await page.waitForSelector('h1', { timeout: 5000 });
    await page.waitForSelector('input[placeholder*="location"]', { timeout: 5000 });
    
    logSuccess(`Page loaded successfully in ${loadTime.toFixed(2)}ms`);
    return true;
  } catch (error) {
    logError(error, 'Page Load Test');
    return false;
  }
};

const testLocationSearch = async (page, location) => {
  log(`Testing location search for: ${location}`);
  
  try {
    // Clear and type location
    const input = await page.$('input[placeholder*="location"]');
    await input.click({ clickCount: 3 });
    await input.type(location);
    
    // Wait for suggestions
    await page.waitForSelector('[role="list"]', { timeout: CONFIG.PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE });
    
    // Check if suggestions appeared
    const suggestions = await page.$$('[role="list"] li');
    if (suggestions.length === 0) {
      throw new Error(`No suggestions found for location: ${location}`);
    }
    
    // Click first suggestion
    await suggestions[0].click();
    
    // Wait for forecast to load
    await page.waitForSelector('[role="listitem"]', { timeout: 10000 });
    
    // Check if forecast cards are present
    const forecastCards = await page.$$('[role="listitem"]');
    if (forecastCards.length === 0) {
      throw new Error('No forecast cards found after location selection');
    }
    
    logSuccess(`Location search successful for: ${location} (${forecastCards.length} forecast cards)`);
    return true;
  } catch (error) {
    logError(error, `Location Search Test - ${location}`);
    return false;
  }
};

const testScrollAnimation = async (page) => {
  log('Testing scroll animation...');
  
  try {
    // Wait for forecast to be visible
    await page.waitForSelector('[role="listitem"]', { timeout: 5000 });
    
    // Get scroll container
    const scrollContainer = await page.$('.horizontal-scroll-container');
    if (!scrollContainer) {
      throw new Error('Scroll container not found');
    }
    
    // Test horizontal scroll
    const startTime = performance.now();
    await page.evaluate(() => {
      const container = document.querySelector('.horizontal-scroll-container');
      container.scrollTo({ left: window.innerWidth, behavior: 'smooth' });
    });
    
    // Wait for animation to complete
    await page.waitForTimeout(4000);
    
    // Check if sun is visible (should be behind mountains)
    const sunElement = await page.$('.fixed.pointer-events-none');
    if (!sunElement) {
      throw new Error('Sun element not found after scroll');
    }
    
    const animationTime = performance.now() - startTime;
    logSuccess(`Scroll animation completed in ${animationTime.toFixed(2)}ms`);
    return true;
  } catch (error) {
    logError(error, 'Scroll Animation Test');
    return false;
  }
};

const testBackNavigation = async (page) => {
  log('Testing back navigation...');
  
  try {
    // Find and click back button
    const backButton = await page.$('button:has-text("Back to Search")');
    if (!backButton) {
      throw new Error('Back button not found');
    }
    
    await backButton.click();
    
    // Wait for page to return to search state
    await page.waitForSelector('input[placeholder*="location"]', { timeout: 5000 });
    
    // Verify we're back to search
    const inputValue = await page.$eval('input[placeholder*="location"]', el => el.value);
    if (inputValue !== '') {
      throw new Error('Input field not cleared after back navigation');
    }
    
    logSuccess('Back navigation successful');
    return true;
  } catch (error) {
    logError(error, 'Back Navigation Test');
    return false;
  }
};

const testCurrentLocation = async (page) => {
  log('Testing current location functionality...');
  
  try {
    // Click current location button
    const currentLocationButton = await page.$('button:has-text("Use current location")');
    if (!currentLocationButton) {
      throw new Error('Current location button not found');
    }
    
    await currentLocationButton.click();
    
    // Wait for geolocation prompt or error
    await page.waitForTimeout(2000);
    
    // Check if we got a result or error message
    const errorMessage = await page.$('#error-message');
    if (errorMessage) {
      const errorText = await errorMessage.textContent();
      log(`Geolocation error (expected): ${errorText}`, 'warning');
    }
    
    logSuccess('Current location test completed');
    return true;
  } catch (error) {
    logError(error, 'Current Location Test');
    return false;
  }
};

const testPerformanceMetrics = async (page) => {
  log('Testing performance metrics...');
  
  try {
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      };
    });
    
    // Log metrics
    log(`Performance Metrics:
      Load Time: ${metrics.loadTime.toFixed(2)}ms
      DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms
      First Paint: ${metrics.firstPaint.toFixed(2)}ms
      First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
    
    if (metrics.memory) {
      log(`Memory Usage:
        Used: ${(metrics.memory.used / 1024 / 1024).toFixed(2)}MB
        Total: ${(metrics.memory.total / 1024 / 1024).toFixed(2)}MB
        Limit: ${(metrics.memory.limit / 1024 / 1024).toFixed(2)}MB`);
    }
    
    testResults.performance.metrics = metrics;
    logSuccess('Performance metrics collected');
    return true;
  } catch (error) {
    logError(error, 'Performance Metrics Test');
    return false;
  }
};

const testErrorHandling = async (page) => {
  log('Testing error handling...');
  
  try {
    // Test invalid location search
    const input = await page.$('input[placeholder*="location"]');
    await input.click({ clickCount: 3 });
    await input.type('InvalidLocation12345');
    
    // Wait a bit for potential error
    await page.waitForTimeout(3000);
    
    // Check for error messages
    const errorMessage = await page.$('#error-message');
    if (errorMessage) {
      const errorText = await errorMessage.textContent();
      log(`Error handling test - Error message found: ${errorText}`, 'warning');
    }
    
    // Clear input
    await input.click({ clickCount: 3 });
    await input.type('');
    
    logSuccess('Error handling test completed');
    return true;
  } catch (error) {
    logError(error, 'Error Handling Test');
    return false;
  }
};

const takeScreenshot = async (page, name) => {
  try {
    const screenshot = await page.screenshot({ 
      fullPage: true, 
      path: `screenshot-${name}-${Date.now()}.png` 
    });
    testResults.screenshots.push(`screenshot-${name}-${Date.now()}.png`);
    log(`Screenshot saved: ${name}`);
  } catch (error) {
    logError(error, `Screenshot - ${name}`);
  }
};

const runStressTest = async () => {
  log('🚀 Starting Suncast Application Stress Test', 'info');
  log(`Testing URL: ${CONFIG.BASE_URL}`, 'info');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport(CONFIG.VIEWPORT);
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        log(`Browser Console Error: ${msg.text()}`, 'error');
      }
    });
    
    // Enable request/response logging
    page.on('response', response => {
      if (!response.ok()) {
        log(`HTTP Error: ${response.status()} ${response.url()}`, 'warning');
      }
    });
    
    // Run tests
    await measurePerformance('Page Load', () => testPageLoad(page));
    await takeScreenshot(page, 'initial-load');
    
    await measurePerformance('Performance Metrics', () => testPerformanceMetrics(page));
    
    // Test multiple locations
    for (const location of CONFIG.TEST_LOCATIONS.slice(0, 3)) { // Test first 3 locations
      await measurePerformance(`Location Search - ${location}`, () => testLocationSearch(page, location));
      await takeScreenshot(page, `forecast-${location.replace(/\s+/g, '-')}`);
      
      await measurePerformance('Scroll Animation', () => testScrollAnimation(page));
      await takeScreenshot(page, `scrolled-${location.replace(/\s+/g, '-')}`);
      
      await measurePerformance('Back Navigation', () => testBackNavigation(page));
      await takeScreenshot(page, `back-to-search-${location.replace(/\s+/g, '-')}`);
      
      // Small delay between tests
      await page.waitForTimeout(1000);
    }
    
    await measurePerformance('Current Location', () => testCurrentLocation(page));
    await measurePerformance('Error Handling', () => testErrorHandling(page));
    
    // Final performance check
    await measurePerformance('Final Performance Check', () => testPerformanceMetrics(page));
    
  } catch (error) {
    logError(error, 'Stress Test Setup');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate report
  generateReport();
};

const generateReport = () => {
  log('\n📊 STRESS TEST REPORT', 'info');
  log('='.repeat(50), 'info');
  
  log(`Total Tests: ${testResults.passed + testResults.failed}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  
  if (testResults.errors.length > 0) {
    log('\n❌ ERRORS:', 'error');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.context}: ${error.message}`, 'error');
    });
  }
  
  log('\n⚡ PERFORMANCE SUMMARY:', 'info');
  Object.entries(testResults.performance).forEach(([name, data]) => {
    if (typeof data === 'object' && data.duration) {
      log(`${name}: ${data.duration.toFixed(2)}ms`, 'info');
    }
  });
  
  log('\n📸 SCREENSHOTS TAKEN:', 'info');
  testResults.screenshots.forEach(screenshot => {
    log(`- ${screenshot}`, 'info');
  });
  
  // Overall assessment
  const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
  log(`\n🎯 SUCCESS RATE: ${successRate.toFixed(1)}%`, successRate >= 80 ? 'success' : 'warning');
  
  if (successRate >= 90) {
    log('🌟 EXCELLENT! Application is performing very well.', 'success');
  } else if (successRate >= 80) {
    log('✅ GOOD! Application is performing well with minor issues.', 'success');
  } else if (successRate >= 70) {
    log('⚠️ FAIR! Application has some issues that need attention.', 'warning');
  } else {
    log('❌ POOR! Application has significant issues that need immediate attention.', 'error');
  }
  
  log('\n🏁 Stress test completed!', 'info');
};

// Run the stress test
if (import.meta.url === `file://${process.argv[1]}`) {
  runStressTest().catch(console.error);
}

export { runStressTest, CONFIG };
