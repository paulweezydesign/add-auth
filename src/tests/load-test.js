/**
 * Load Testing Script for Rate Limiting and CSRF Protection
 * Tests the middleware under high load conditions
 */

const http = require('http');
const https = require('https');

// Configuration
const config = {
  host: 'localhost',
  port: 3000,
  protocol: 'http',
  concurrent: 50,
  totalRequests: 1000,
  testDuration: 60000, // 60 seconds
};

// Test results tracking
const results = {
  total: 0,
  success: 0,
  rateLimited: 0,
  errors: 0,
  csrfErrors: 0,
  startTime: 0,
  endTime: 0,
  responseTimes: [],
  errorTypes: {}
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const client = config.protocol === 'https' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          responseTime: responseTime
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      resolve({
        statusCode: 0,
        error: error.message,
        responseTime: responseTime
      });
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Get CSRF token
async function getCSRFToken() {
  try {
    const options = {
      hostname: config.host,
      port: config.port,
      path: '/csrf-token',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      return data.csrfToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return null;
  }
}

// Test login endpoint with rate limiting
async function testLoginEndpoint(csrfToken) {
  const data = JSON.stringify({
    email: `test${Math.random()}@example.com`,
    password: 'testpassword',
    _csrf: csrfToken
  });
  
  const options = {
    hostname: config.host,
    port: config.port,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'X-CSRF-Token': csrfToken
    }
  };
  
  return await makeRequest(options, data);
}

// Test registration endpoint with rate limiting
async function testRegistrationEndpoint(csrfToken) {
  const data = JSON.stringify({
    email: `test${Math.random()}@example.com`,
    password: 'testpassword',
    confirmPassword: 'testpassword',
    _csrf: csrfToken
  });
  
  const options = {
    hostname: config.host,
    port: config.port,
    path: '/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'X-CSRF-Token': csrfToken
    }
  };
  
  return await makeRequest(options, data);
}

// Test password reset endpoint with exponential backoff
async function testPasswordResetEndpoint(csrfToken) {
  const data = JSON.stringify({
    email: `test${Math.random()}@example.com`,
    _csrf: csrfToken
  });
  
  const options = {
    hostname: config.host,
    port: config.port,
    path: '/auth/password-reset',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'X-CSRF-Token': csrfToken
    }
  };
  
  return await makeRequest(options, data);
}

// Process test response
function processResponse(response, testType) {
  results.total++;
  results.responseTimes.push(response.responseTime);
  
  if (response.error) {
    results.errors++;
    results.errorTypes[response.error] = (results.errorTypes[response.error] || 0) + 1;
  } else if (response.statusCode === 429) {
    results.rateLimited++;
    console.log(`Rate limited: ${testType} - ${response.body ? JSON.parse(response.body).message : 'Unknown'}`);
  } else if (response.statusCode === 403) {
    results.csrfErrors++;
    console.log(`CSRF error: ${testType} - ${response.body ? JSON.parse(response.body).message : 'Unknown'}`);
  } else if (response.statusCode >= 200 && response.statusCode < 300) {
    results.success++;
  } else {
    results.errors++;
    results.errorTypes[`HTTP_${response.statusCode}`] = (results.errorTypes[`HTTP_${response.statusCode}`] || 0) + 1;
  }
}

// Run concurrent tests
async function runConcurrentTests(testFunction, testType, count, csrfToken) {
  const promises = [];
  
  for (let i = 0; i < count; i++) {
    const promise = testFunction(csrfToken).then(response => {
      processResponse(response, testType);
    }).catch(error => {
      results.errors++;
      results.errorTypes[error.message] = (results.errorTypes[error.message] || 0) + 1;
    });
    
    promises.push(promise);
    
    // Add small delay to simulate real usage
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  await Promise.all(promises);
}

// Rate limiting stress test
async function stressTestRateLimiting() {
  console.log('Starting rate limiting stress test...');
  
  const csrfToken = await getCSRFToken();
  if (!csrfToken) {
    console.error('Failed to get CSRF token. Make sure the server is running.');
    return;
  }
  
  console.log('Got CSRF token:', csrfToken.substring(0, 16) + '...');
  
  results.startTime = Date.now();
  
  // Test login endpoint (should hit sliding window rate limit)
  console.log('Testing login endpoint with sliding window rate limiting...');
  await runConcurrentTests(testLoginEndpoint, 'login', 20, csrfToken);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test registration endpoint (should hit sliding window rate limit)
  console.log('Testing registration endpoint with sliding window rate limiting...');
  await runConcurrentTests(testRegistrationEndpoint, 'registration', 15, csrfToken);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test password reset endpoint (should hit exponential backoff)
  console.log('Testing password reset endpoint with exponential backoff...');
  await runConcurrentTests(testPasswordResetEndpoint, 'password-reset', 10, csrfToken);
  
  results.endTime = Date.now();
}

// CSRF protection test
async function testCSRFProtection() {
  console.log('Testing CSRF protection...');
  
  // Test without CSRF token
  const testWithoutToken = async () => {
    const data = JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    const options = {
      hostname: config.host,
      port: config.port,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    return await makeRequest(options, data);
  };
  
  // Test with invalid CSRF token
  const testWithInvalidToken = async () => {
    const data = JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword',
      _csrf: 'invalid-token'
    });
    
    const options = {
      hostname: config.host,
      port: config.port,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'X-CSRF-Token': 'invalid-token'
      }
    };
    
    return await makeRequest(options, data);
  };
  
  const response1 = await testWithoutToken();
  const response2 = await testWithInvalidToken();
  
  console.log('Request without CSRF token:', response1.statusCode, response1.statusCode === 403 ? 'PASS' : 'FAIL');
  console.log('Request with invalid CSRF token:', response2.statusCode, response2.statusCode === 403 ? 'PASS' : 'FAIL');
}

// Print results
function printResults() {
  const duration = (results.endTime - results.startTime) / 1000;
  const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  const requestsPerSecond = results.total / duration;
  
  console.log('\n=== Load Test Results ===');
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Total requests: ${results.total}`);
  console.log(`Successful requests: ${results.success}`);
  console.log(`Rate limited requests: ${results.rateLimited}`);
  console.log(`CSRF errors: ${results.csrfErrors}`);
  console.log(`Other errors: ${results.errors}`);
  console.log(`Requests per second: ${requestsPerSecond.toFixed(2)}`);
  console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Min response time: ${Math.min(...results.responseTimes)}ms`);
  console.log(`Max response time: ${Math.max(...results.responseTimes)}ms`);
  
  if (Object.keys(results.errorTypes).length > 0) {
    console.log('\nError breakdown:');
    Object.entries(results.errorTypes).forEach(([error, count]) => {
      console.log(`  ${error}: ${count}`);
    });
  }
  
  console.log('\n=== Rate Limiting Analysis ===');
  console.log(`Rate limiting effectiveness: ${((results.rateLimited / results.total) * 100).toFixed(2)}%`);
  console.log(`CSRF protection effectiveness: ${((results.csrfErrors / results.total) * 100).toFixed(2)}%`);
  
  if (results.rateLimited > 0) {
    console.log('✓ Rate limiting is working correctly');
  } else {
    console.log('⚠ Rate limiting may not be configured properly');
  }
  
  if (results.csrfErrors > 0) {
    console.log('✓ CSRF protection is working correctly');
  } else {
    console.log('⚠ CSRF protection may not be configured properly');
  }
}

// Main execution
async function main() {
  console.log('Rate Limiting and CSRF Protection Load Test');
  console.log(`Target: ${config.protocol}://${config.host}:${config.port}`);
  console.log(`Configuration: ${config.concurrent} concurrent, ${config.totalRequests} total requests\n`);
  
  try {
    // Test CSRF protection
    await testCSRFProtection();
    
    console.log('\n');
    
    // Run stress test
    await stressTestRateLimiting();
    
    // Print results
    printResults();
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const options = {
      hostname: config.host,
      port: config.port,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✓ Server is running');
      return true;
    } else {
      console.log('✗ Server responded with status:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('✗ Server is not running:', error.message);
    return false;
  }
}

// Run the test
(async () => {
  console.log('Checking if server is running...');
  
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await main();
  } else {
    console.log('\nPlease start the server first with: npm run dev');
    console.log('Then run this test again with: node src/tests/load-test.js');
  }
})();