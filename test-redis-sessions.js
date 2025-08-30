/**
 * Redis Session Management Test Script
 * Tests the comprehensive session management functionality
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let sessionId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}${colors.blue}=== Step ${step}: ${message} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

// Helper to make authenticated requests
const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (sessionId) {
      config.headers['x-session-id'] = sessionId;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`${error.response.status}: ${error.response.data.message || error.response.data.error}`);
    }
    throw error;
  }
};

async function testRedisConnection() {
  logStep(1, 'Testing Redis Connection');
  
  try {
    // First, let's check if the server is running
    await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    logSuccess('Server is running');
  } catch (error) {
    logError('Server is not running. Please start the server first.');
    logInfo('Run: npm start');
    process.exit(1);
  }
}

async function testUserRegistration() {
  logStep(2, 'Testing User Registration with Redis Sessions');
  
  const userData = {
    email: `test-redis-${Date.now()}@example.com`,
    password: 'Test123!@#Strong',
    username: `testuser-${Date.now()}`
  };

  try {
    const response = await makeRequest('POST', '/auth/register', userData);
    
    logSuccess('User registered successfully');
    logInfo(`User ID: ${response.user.id}`);
    logInfo(`Session ID: ${response.session?.id || 'Not provided'}`);
    logInfo(`Trust Score: ${response.session?.trust_score || 'Not provided'}`);
    
    if (response.tokens) {
      authToken = response.tokens.accessToken;
      logInfo('JWT tokens received');
    }
    
    if (response.session) {
      sessionId = response.session.id;
      logSuccess('Redis session created during registration');
    } else {
      logError('No Redis session created during registration');
    }
    
    return userData;
  } catch (error) {
    logError(`Registration failed: ${error.message}`);
    throw error;
  }
}

async function testSessionValidation() {
  logStep(3, 'Testing Session Validation');
  
  if (!sessionId) {
    logError('No session ID available for validation');
    return;
  }

  try {
    const response = await makeRequest('GET', '/auth/me');
    logSuccess('Session validation successful');
    logInfo(`User authenticated via session: ${response.user.email}`);
  } catch (error) {
    logError(`Session validation failed: ${error.message}`);
  }
}

async function testSessionManagement() {
  logStep(4, 'Testing Session Management Endpoints');
  
  try {
    // Get user sessions
    logInfo('Getting user sessions...');
    const sessionsResponse = await makeRequest('GET', '/auth/sessions');
    logSuccess(`Found ${sessionsResponse.total} session(s)`);
    
    sessionsResponse.sessions.forEach((session, index) => {
      logInfo(`Session ${index + 1}:`);
      logInfo(`  ID: ${session.id}`);
      logInfo(`  Created: ${new Date(session.created_at).toLocaleString()}`);
      logInfo(`  Last Accessed: ${new Date(session.last_accessed).toLocaleString()}`);
      logInfo(`  Trust Score: ${session.trust_score}`);
      logInfo(`  Is Current: ${session.is_current}`);
      logInfo(`  IP: ${session.ip_address}`);
      logInfo(`  User Agent: ${session.user_agent?.substring(0, 50)}...`);
    });
    
    // Test session extension
    logInfo('Testing session extension...');
    const extendResponse = await makeRequest('PUT', '/auth/session/extend');
    logSuccess('Session extended successfully');
    logInfo(`New expiration: ${new Date(extendResponse.session.expires_at).toLocaleString()}`);
    
  } catch (error) {
    logError(`Session management test failed: ${error.message}`);
  }
}

async function testConcurrentSessions() {
  logStep(5, 'Testing Concurrent Session Limits');
  
  try {
    const userData = {
      email: `test-concurrent-${Date.now()}@example.com`,
      password: 'Test123!@#Strong',
      username: `testuser-concurrent-${Date.now()}`
    };

    // Register a user
    await makeRequest('POST', '/auth/register', userData);
    logSuccess('Test user registered for concurrent session testing');

    // Create multiple sessions by logging in multiple times
    const sessions = [];
    for (let i = 0; i < 7; i++) { // Try to create more than the limit (5)
      try {
        const loginResponse = await makeRequest('POST', '/auth/login', {
          email: userData.email,
          password: userData.password
        });
        
        if (loginResponse.session) {
          sessions.push(loginResponse.session);
          logInfo(`Created session ${i + 1}: ${loginResponse.session.id}`);
          
          // Update sessionId and authToken for the last session
          sessionId = loginResponse.session.id;
          authToken = loginResponse.tokens.accessToken;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logError(`Failed to create session ${i + 1}: ${error.message}`);
      }
    }

    logInfo(`Total sessions attempted: 7`);
    logInfo(`Sessions created: ${sessions.length}`);

    // Check how many sessions actually exist
    const sessionsResponse = await makeRequest('GET', '/auth/sessions');
    logInfo(`Active sessions found: ${sessionsResponse.total}`);
    
    if (sessionsResponse.total <= 5) {
      logSuccess('Session limit enforcement working correctly');
    } else {
      logError('Session limit enforcement may not be working');
    }

  } catch (error) {
    logError(`Concurrent session test failed: ${error.message}`);
  }
}

async function testSessionRevocation() {
  logStep(6, 'Testing Session Revocation');
  
  try {
    // Get current sessions
    const sessionsResponse = await makeRequest('GET', '/auth/sessions');
    const sessions = sessionsResponse.sessions;
    
    if (sessions.length < 2) {
      logInfo('Not enough sessions to test revocation');
      return;
    }

    // Find a session that's not the current one
    const sessionToRevoke = sessions.find(s => !s.is_current);
    
    if (sessionToRevoke) {
      logInfo(`Revoking session: ${sessionToRevoke.id}`);
      await makeRequest('DELETE', `/auth/sessions/${sessionToRevoke.id}`);
      logSuccess('Session revoked successfully');
      
      // Verify it's gone
      const updatedSessions = await makeRequest('GET', '/auth/sessions');
      const foundRevoked = updatedSessions.sessions.find(s => s.id === sessionToRevoke.id);
      
      if (!foundRevoked) {
        logSuccess('Session successfully removed');
      } else {
        logError('Session still exists after revocation');
      }
    }

    // Test revoking all other sessions
    if (sessions.length > 1) {
      logInfo('Revoking all other sessions...');
      const revokeResponse = await makeRequest('DELETE', '/auth/sessions');
      logSuccess(`Revoked ${revokeResponse.revokedCount} session(s)`);
      
      // Verify only current session remains
      const finalSessions = await makeRequest('GET', '/auth/sessions');
      if (finalSessions.total === 1 && finalSessions.sessions[0].is_current) {
        logSuccess('Only current session remains');
      } else {
        logError('Session revocation may not have worked correctly');
      }
    }

  } catch (error) {
    logError(`Session revocation test failed: ${error.message}`);
  }
}

async function testSessionFingerprinting() {
  logStep(7, 'Testing Session Fingerprinting');
  
  try {
    // Make a request with modified headers to simulate potential fingerprint changes
    const originalUserAgent = 'Mozilla/5.0 (Test Client)';
    const modifiedUserAgent = 'Mozilla/5.0 (Modified Client)';
    
    // First request with original user agent
    await makeRequest('GET', '/auth/me', null, {
      'User-Agent': originalUserAgent
    });
    logSuccess('Request with original user agent successful');
    
    // Request with modified user agent (should trigger fingerprint validation)
    try {
      await makeRequest('GET', '/auth/me', null, {
        'User-Agent': modifiedUserAgent
      });
      logInfo('Request with modified user agent allowed (risk may be low)');
    } catch (error) {
      if (error.message.includes('fingerprint') || error.message.includes('security')) {
        logSuccess('Fingerprint validation detected user agent change');
      } else {
        logError(`Unexpected error: ${error.message}`);
      }
    }
    
  } catch (error) {
    logError(`Session fingerprinting test failed: ${error.message}`);
  }
}

async function testLogout() {
  logStep(8, 'Testing Enhanced Logout');
  
  try {
    // Test logout with both JWT and session
    const logoutResponse = await makeRequest('POST', '/auth/logout', {
      refreshToken: 'dummy-refresh-token' // This might not work, but it's for testing
    });
    
    logSuccess('Logout successful');
    logInfo(logoutResponse.message);
    
    // Verify session is destroyed
    try {
      await makeRequest('GET', '/auth/me');
      logError('Session still active after logout');
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Authentication')) {
        logSuccess('Session properly destroyed after logout');
      } else {
        logError(`Unexpected error: ${error.message}`);
      }
    }
    
  } catch (error) {
    logError(`Logout test failed: ${error.message}`);
  }
}

async function runAllTests() {
  log('\n' + colors.bright + colors.magenta + '🚀 Redis Session Management Test Suite' + colors.reset);
  log(colors.yellow + '================================================' + colors.reset);
  
  try {
    await testRedisConnection();
    const userData = await testUserRegistration();
    await testSessionValidation();
    await testSessionManagement();
    await testConcurrentSessions();
    await testSessionRevocation();
    await testSessionFingerprinting();
    await testLogout();
    
    log('\n' + colors.bright + colors.green + '🎉 All tests completed!' + colors.reset);
    log(colors.yellow + '================================================' + colors.reset);
    
  } catch (error) {
    log('\n' + colors.bright + colors.red + '💥 Test suite failed!' + colors.reset);
    logError(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Helper function to generate test report
function generateTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    testSuite: 'Redis Session Management',
    features: [
      'Redis-based session storage',
      'Session fingerprinting for security',
      'Concurrent session limits (max 5)',
      'Session validation and trust scoring',
      'Session management endpoints',
      'Enhanced logout with session cleanup',
      'Automatic session expiry and cleanup'
    ],
    status: 'Completed'
  };
  
  fs.writeFileSync('redis-session-test-report.json', JSON.stringify(report, null, 2));
  logInfo('Test report saved to redis-session-test-report.json');
}

// Run the tests
if (require.main === module) {
  runAllTests()
    .then(() => {
      generateTestReport();
      process.exit(0);
    })
    .catch(error => {
      logError(`Test execution failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testRedisConnection,
  testUserRegistration,
  testSessionValidation,
  testSessionManagement,
  testConcurrentSessions,
  testSessionRevocation,
  testSessionFingerprinting,
  testLogout
};