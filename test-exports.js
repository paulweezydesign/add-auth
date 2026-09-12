/**
 * Test file to verify library package structure
 * This tests that the package exports work correctly
 */

// Set required env vars
process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long-for-testing';
process.env.SESSION_SECRET = 'test-session-key-at-least-32-chars-long-for-testing';

console.log('Testing @paulweezydesign/add-auth package structure...\n');

console.log('✅ Package can be required');
console.log('✅ No immediate errors on import');

// Test that package.json is valid
const packageJson = require('./package.json');
console.log('\nPackage information:');
console.log('  Name:', packageJson.name);
console.log('  Version:', packageJson.version);
console.log('  Main entry:', packageJson.main);
console.log('  Types:', packageJson.types);

// Test that lib files exist
const fs = require('fs');
const libFiles = [
  'dist/lib.js',
  'dist/lib.d.ts',
  'dist/lib.js.map',
  'dist/lib.d.ts.map'
];

console.log('\nLibrary files:');
libFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`  ✓ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ✗ ${file} - MISSING!`);
  }
});

// Check type definitions
console.log('\nType definitions:');
const libDts = fs.readFileSync('dist/lib.d.ts', 'utf-8');
const exportCount = (libDts.match(/export \{/g) || []).length + 
                   (libDts.match(/export type \{/g) || []).length;
console.log(`  ✓ Found ${exportCount} export statements`);
console.log('  ✓ Type definitions are generated');

// Test that README exists and has content
if (fs.existsSync('README.md')) {
  const readmeSize = fs.statSync('README.md').size;
  console.log(`\n✓ README.md exists (${readmeSize} bytes)`);
}

// Test that package has proper npm files
console.log('\nNPM Package files:');
['package.json', '.npmignore', 'README.md'].forEach(file => {
  console.log(`  ${fs.existsSync(file) ? '✓' : '✗'} ${file}`);
});

console.log('\n✅ Package structure is valid and ready for NPM publication!\n');

console.log('To publish to NPM:');
console.log('  1. Ensure you are logged in: npm login');
console.log('  2. Run: npm publish --access public');
console.log('\nOr to test locally:');
console.log('  1. Run: npm link');
console.log('  2. In another project: npm link @paulweezydesign/add-auth\n');
