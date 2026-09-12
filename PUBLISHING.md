# Publishing Guide for @paulweezydesign/add-auth

This document explains how to publish this package to NPM.

## Prerequisites

1. **NPM Account**: You need an NPM account. Create one at https://www.npmjs.com/signup
2. **NPM CLI**: Ensure you have npm installed (comes with Node.js)
3. **Authentication**: Log in to NPM from your terminal

## Pre-Publication Checklist

Before publishing, ensure:

- [ ] All tests pass (if any)
- [ ] Version number is updated in `package.json`
- [ ] README.md is up to date
- [ ] CHANGELOG is updated (if applicable)
- [ ] Build is clean: `npm run build`
- [ ] No sensitive information in the code
- [ ] `.npmignore` properly excludes dev files

## Publishing Steps

### 1. Login to NPM

```bash
npm login
```

You'll be prompted for your NPM username, password, and email.

### 2. Verify Package Contents

Before publishing, check what will be included in the package:

```bash
npm pack --dry-run
```

This shows you exactly what files will be published.

### 3. Build the Package

Ensure you have a clean build:

```bash
npm run build:clean
```

### 4. Test the Package Locally (Optional but Recommended)

Link the package locally to test it:

```bash
# In this project directory
npm link

# In a test project
npm link @paulweezydesign/add-auth

# Test importing and using the package
# When done testing:
npm unlink @paulweezydesign/add-auth
```

### 5. Publish to NPM

For a scoped package (recommended):

```bash
npm publish --access public
```

For first-time publish, you might need to verify your email.

### 6. Verify Publication

After publishing:

1. Check your package on NPM: https://www.npmjs.com/package/@paulweezydesign/add-auth
2. Try installing it in a test project:
   ```bash
   npm install @paulweezydesign/add-auth
   ```

## Version Management

Follow semantic versioning (semver):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes

Update version before publishing:

```bash
# For a patch release
npm version patch

# For a minor release
npm version minor

# For a major release
npm version major
```

This automatically:
- Updates `package.json`
- Creates a git commit
- Creates a git tag

Then push changes:

```bash
git push && git push --tags
```

## Updating the Package

When you need to publish updates:

1. Make your changes
2. Update version: `npm version patch` (or minor/major)
3. Build: `npm run build`
4. Publish: `npm publish --access public`
5. Push to git: `git push && git push --tags`

## Unpublishing

**Warning**: Unpublishing is generally discouraged. Only unpublish within 72 hours of publishing.

```bash
npm unpublish @paulweezydesign/add-auth@1.0.0
```

## Deprecating a Version

If you want to discourage use of a version without unpublishing:

```bash
npm deprecate @paulweezydesign/add-auth@1.0.0 "This version has critical bugs. Please upgrade to 1.0.1"
```

## Common Issues

### Authentication Errors

```bash
npm logout
npm login
```

### Permission Errors

Ensure you have permission for the scope `@paulweezydesign`:

```bash
npm owner ls @paulweezydesign/add-auth
npm owner add <username> @paulweezydesign/add-auth
```

### Build Errors

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Package Information

- **Package Name**: @paulweezydesign/add-auth
- **Current Version**: 1.0.0
- **License**: MIT
- **Main Entry**: dist/lib.js
- **Type Definitions**: dist/lib.d.ts

## Support

For issues or questions:
- GitHub Issues: https://github.com/paulweezydesign/add-auth/issues
- NPM Package: https://www.npmjs.com/package/@paulweezydesign/add-auth
