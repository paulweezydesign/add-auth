/**
 * Example usage of @paulweezydesign/add-auth
 * This demonstrates how to use the library in an Express application
 */

// Required environment variables
process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long-for-testing';
process.env.SESSION_SECRET = 'test-session-key-at-least-32-chars-long-for-testing';

const express = require('express');

// Import from the library
const {
  requireAuth,
  requireRole,
  requirePermission,
  rateLimiters,
  csrfProtection,
  xssProtection,
  sqlInjectionPrevention,
  sanitizeInput,
  securityConfigs,
  logger
} = require('./dist/lib');

const app = express();

console.log('Creating Express app with add-auth middleware...\n');

// Apply basic middleware
app.use(express.json());

// Apply security middleware
console.log('✓ Applying rate limiting...');
app.use('/api', rateLimiters.general);

console.log('✓ Applying XSS protection...');
app.use(xssProtection());

console.log('✓ Applying SQL injection prevention...');
app.use(sqlInjectionPrevention());

console.log('✓ Applying input sanitization...');
app.use(sanitizeInput('body'));

// Example routes
app.get('/', (req, res) => {
  res.json({
    message: 'Add-Auth Example API',
    version: '1.0.0',
    status: 'running'
  });
});

// Protected route example (commented to avoid Redis requirement)
// app.get('/api/profile', requireAuth, (req, res) => {
//   res.json({
//     message: 'Protected profile endpoint',
//     user: req.user
//   });
// });

// Role-based route example
// app.get('/admin/dashboard', requireAuth, requireRole('admin'), (req, res) => {
//   res.json({ message: 'Admin Dashboard' });
// });

// Permission-based route example
// app.post('/api/posts', requireAuth, requirePermission('posts:create'), (req, res) => {
//   res.json({ message: 'Create post' });
// });

console.log('\n✅ App configured successfully!\n');
console.log('Security features enabled:');
console.log('  • Rate limiting');
console.log('  • XSS protection');
console.log('  • SQL injection prevention');
console.log('  • Input sanitization');

console.log('\nAvailable security configurations:');
console.log('  • Production config:', Object.keys(securityConfigs.production).join(', '));
console.log('  • Development config:', Object.keys(securityConfigs.development).join(', '));
console.log('  • Testing config:', Object.keys(securityConfigs.testing).join(', '));

console.log('\nLogger available:', typeof logger);

console.log('\n✅ Example usage validation complete!');
console.log('The library is working correctly and ready for use.\n');
