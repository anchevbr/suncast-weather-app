#!/usr/bin/env node

/**
 * Lightweight Stress Test Script (No Dependencies)
 * Tests basic functionality using fetch API
 */

const CONFIG = {
  BASE_URL: 'http://localhost:5181',
  TIMEOUT: 10000,
  TEST_LOCATIONS: ['New York', 'London', 'Tokyo', 'Sydney', 'Paris']
};

const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  performance: {}
};

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
    timestamp: new Date().toISOString()
  });
  testResults.failed++;
};

const logSuccess = (message) => {
  log(message, 'success');
  testResults.passed++;
};

const measurePerformance = async (name, fn) => {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    testResults.performance[name] = {
      duration,
      timestamp: new Date().toISOString()
    };
    
    log(`Performance: ${name} - ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    log(`Performance: ${name} - FAILED after ${duration.toFixed(2)}ms`, 'error');
    throw error;
  }
};

const testServerAvailability = async () => {
  log('Testing server availability...');
  
  try {
    const response = await fetch(CONFIG.BASE_URL, {
      method: 'HEAD',
      timeout: CONFIG.TIMEOUT
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    logSuccess(`Server is available (${response.status})`);
    return true;
  } catch (error) {
    logError(error, 'Server Availability Test');
    return false;
  }
};

const testPageLoad = async () => {
  log('Testing page load...');
  
  try {
    const response = await fetch(CONFIG.BASE_URL, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (!response.ok) {
      throw new Error(`Page load failed: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Check for essential elements
    const checks = [
      { name: 'HTML structure', test: html.includes('<html') },
      { name: 'React root', test: html.includes('id="root"') },
      { name: 'Title', test: html.includes('Golden Hour') },
      { name: 'Vite client', test: html.includes('@vite/client') },
      { name: 'Main script', test: html.includes('src/main.jsx') }
    ];
    
    checks.forEach(check => {
      if (check.test) {
        logSuccess(`✓ ${check.name} found`);
      } else {
        throw new Error(`${check.name} not found in HTML`);
      }
    });
    
    logSuccess('Page load test completed');
    return true;
  } catch (error) {
    logError(error, 'Page Load Test');
    return false;
  }
};

const testAPIEndpoints = async () => {
  log('Testing API endpoints...');
  
  // Test if the app is making API calls (we can't test the actual APIs without proper setup)
  // But we can check if the page loads without 404s for resources
  
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/src/main.jsx`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.ok) {
      logSuccess('Main script loads successfully');
    } else {
      log(`Main script returned ${response.status}`, 'warning');
    }
    
    return true;
  } catch (error) {
    logError(error, 'API Endpoints Test');
    return false;
  }
};

const testPerformance = async () => {
  log('Testing basic performance...');
  
  try {
    const start = performance.now();
    
    // Make multiple requests to test performance
    const promises = Array(5).fill().map(() => 
      fetch(CONFIG.BASE_URL, { timeout: CONFIG.TIMEOUT })
    );
    
    await Promise.all(promises);
    const duration = performance.now() - start;
    
    const avgTime = duration / 5;
    log(`Average response time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime > 1000) {
      log(`Slow response time: ${avgTime.toFixed(2)}ms`, 'warning');
    } else {
      logSuccess(`Good response time: ${avgTime.toFixed(2)}ms`);
    }
    
    return true;
  } catch (error) {
    logError(error, 'Performance Test');
    return false;
  }
};

const testConcurrentRequests = async () => {
  log('Testing concurrent requests...');
  
  try {
    const concurrentCount = 10;
    const start = performance.now();
    
    const promises = Array(concurrentCount).fill().map((_, index) => 
      fetch(CONFIG.BASE_URL, { timeout: CONFIG.TIMEOUT })
        .then(response => ({ index, status: response.status, ok: response.ok }))
    );
    
    const results = await Promise.all(promises);
    const duration = performance.now() - start;
    
    const successCount = results.filter(r => r.ok).length;
    const failureCount = results.length - successCount;
    
    log(`Concurrent requests (${concurrentCount}): ${successCount} success, ${failureCount} failed`);
    log(`Total time: ${duration.toFixed(2)}ms`);
    
    if (failureCount === 0) {
      logSuccess('All concurrent requests successful');
    } else {
      log(`${failureCount} concurrent requests failed`, 'warning');
    }
    
    return true;
  } catch (error) {
    logError(error, 'Concurrent Requests Test');
    return false;
  }
};

const generateReport = () => {
  log('\n📊 LIGHTWEIGHT STRESS TEST REPORT', 'info');
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
    log(`${name}: ${data.duration.toFixed(2)}ms`, 'info');
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
  
  log('\n🏁 Lightweight stress test completed!', 'info');
};

const runLightweightStressTest = async () => {
  log('🚀 Starting Lightweight Stress Test', 'info');
  log(`Testing URL: ${CONFIG.BASE_URL}`, 'info');
  
  try {
    await measurePerformance('Server Availability', testServerAvailability);
    await measurePerformance('Page Load', testPageLoad);
    await measurePerformance('API Endpoints', testAPIEndpoints);
    await measurePerformance('Performance', testPerformance);
    await measurePerformance('Concurrent Requests', testConcurrentRequests);
    
  } catch (error) {
    logError(error, 'Stress Test Setup');
  }
  
  generateReport();
};

// Run the test
runLightweightStressTest().catch(console.error);
