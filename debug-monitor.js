#!/usr/bin/env node

/**
 * Real-time Debug Monitor for Suncast Application
 * Monitors application health, performance, and errors
 */

const CONFIG = {
  BASE_URL: 'http://localhost:5181',
  CHECK_INTERVAL: 5000, // 5 seconds
  ALERT_THRESHOLDS: {
    RESPONSE_TIME: 2000, // 2 seconds
    ERROR_RATE: 0.1,     // 10%
    MEMORY_USAGE: 100    // 100MB
  }
};

const stats = {
  checks: 0,
  successes: 0,
  failures: 0,
  errors: [],
  responseTimes: [],
  startTime: Date.now()
};

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '🔴' : type === 'success' ? '🟢' : type === 'warning' ? '🟡' : '🔵';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const logError = (error, context = '') => {
  const errorMsg = `${context ? `${context}: ` : ''}${error.message}`;
  log(errorMsg, 'error');
  stats.errors.push({
    context,
    message: error.message,
    timestamp: new Date().toISOString()
  });
};

const checkApplicationHealth = async () => {
  const start = performance.now();
  
  try {
    const response = await fetch(CONFIG.BASE_URL, {
      method: 'HEAD',
      timeout: CONFIG.ALERT_THRESHOLDS.RESPONSE_TIME
    });
    
    const responseTime = performance.now() - start;
    stats.responseTimes.push(responseTime);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    stats.successes++;
    log(`Health check passed - ${responseTime.toFixed(2)}ms`, 'success');
    
    // Check for performance issues
    if (responseTime > CONFIG.ALERT_THRESHOLDS.RESPONSE_TIME) {
      log(`Slow response time: ${responseTime.toFixed(2)}ms`, 'warning');
    }
    
    return true;
  } catch (error) {
    stats.failures++;
    logError(error, 'Health Check');
    return false;
  }
};

const checkPageLoad = async () => {
  const start = performance.now();
  
  try {
    const response = await fetch(CONFIG.BASE_URL, {
      timeout: CONFIG.ALERT_THRESHOLDS.RESPONSE_TIME
    });
    
    const responseTime = performance.now() - start;
    
    if (!response.ok) {
      throw new Error(`Page load failed: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Check for critical elements
    const criticalElements = [
      { name: 'React Root', pattern: 'id="root"' },
      { name: 'Main Script', pattern: 'src/main.jsx' },
      { name: 'Title', pattern: 'Golden Hour' }
    ];
    
    criticalElements.forEach(element => {
      if (!html.includes(element.pattern)) {
        throw new Error(`Critical element missing: ${element.name}`);
      }
    });
    
    log(`Page load check passed - ${responseTime.toFixed(2)}ms`, 'success');
    return true;
  } catch (error) {
    logError(error, 'Page Load Check');
    return false;
  }
};

const checkMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  
  if (heapUsedMB > CONFIG.ALERT_THRESHOLDS.MEMORY_USAGE) {
    log(`High memory usage: ${heapUsedMB.toFixed(2)}MB`, 'warning');
  } else {
    log(`Memory usage: ${heapUsedMB.toFixed(2)}MB`, 'info');
  }
  
  return heapUsedMB;
};

const calculateStats = () => {
  const totalChecks = stats.checks;
  const successRate = totalChecks > 0 ? (stats.successes / totalChecks) * 100 : 0;
  const avgResponseTime = stats.responseTimes.length > 0 
    ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length 
    : 0;
  
  return {
    totalChecks,
    successRate,
    avgResponseTime,
    errorCount: stats.errors.length,
    uptime: Date.now() - stats.startTime
  };
};

const displayStats = () => {
  const statsData = calculateStats();
  
  log('\n📊 DEBUG MONITOR STATS', 'info');
  log('='.repeat(40), 'info');
  log(`Total Checks: ${statsData.totalChecks}`, 'info');
  log(`Success Rate: ${statsData.successRate.toFixed(1)}%`, statsData.successRate >= 90 ? 'success' : 'warning');
  log(`Avg Response Time: ${statsData.avgResponseTime.toFixed(2)}ms`, 'info');
  log(`Error Count: ${statsData.errorCount}`, statsData.errorCount === 0 ? 'success' : 'warning');
  log(`Uptime: ${(statsData.uptime / 1000 / 60).toFixed(1)} minutes`, 'info');
  
  if (statsData.errorCount > 0) {
    log('\n❌ RECENT ERRORS:', 'error');
    stats.errors.slice(-5).forEach((error, index) => {
      log(`${index + 1}. ${error.context}: ${error.message}`, 'error');
    });
  }
  
  log('='.repeat(40), 'info');
};

const runDebugMonitor = async () => {
  log('🔍 Starting Debug Monitor', 'info');
  log(`Monitoring: ${CONFIG.BASE_URL}`, 'info');
  log(`Check Interval: ${CONFIG.CHECK_INTERVAL / 1000}s`, 'info');
  log('Press Ctrl+C to stop monitoring\n', 'info');
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\n🛑 Stopping debug monitor...', 'info');
    displayStats();
    process.exit(0);
  });
  
  // Initial check
  await checkApplicationHealth();
  await checkPageLoad();
  
  // Continuous monitoring
  const monitor = setInterval(async () => {
    stats.checks++;
    
    log(`\n🔍 Check #${stats.checks}`, 'info');
    
    await checkApplicationHealth();
    await checkPageLoad();
    checkMemoryUsage();
    
    // Display stats every 10 checks
    if (stats.checks % 10 === 0) {
      displayStats();
    }
    
  }, CONFIG.CHECK_INTERVAL);
};

// Run the debug monitor
runDebugMonitor().catch(console.error);
