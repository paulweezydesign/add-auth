```markdown
# add-auth Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches best practices and patterns for contributing to the `add-auth` TypeScript codebase. It covers coding conventions, commit message styles, file organization, and testing approaches, ensuring consistency and maintainability across the project. While no specific framework is detected, the repository emphasizes clear structure, conventional commits, and modular code.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userAuth.ts`, `authService.test.ts`

### Import Style
- Use **relative imports** for modules within the project.
  - Example:
    ```typescript
    import { authenticateUser } from './userAuth';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // userAuth.ts
    export function authenticateUser(...) { ... }
    ```

### Commit Messages
- Follow the **Conventional Commits** specification.
- Use prefixes such as `refactor`.
- Keep commit messages concise (average 63 characters).
  - Example:
    ```
    refactor: update authentication logic for better error handling
    ```

## Workflows

### Refactor Code
**Trigger:** When improving code structure or readability without changing functionality  
**Command:** `/refactor`

1. Identify code that can be improved (e.g., simplify logic, rename variables).
2. Make changes while ensuring no functional changes are introduced.
3. Write a commit message using the `refactor:` prefix.
4. Push changes and open a pull request for review.

### Add or Update Tests
**Trigger:** When adding new features or modifying existing functionality  
**Command:** `/add-test`

1. Create or update test files using the `*.test.*` naming pattern.
2. Use TypeScript for test files.
3. Ensure tests cover all relevant cases.
4. Run the test suite to verify correctness.
5. Commit changes with a descriptive message.

## Testing Patterns

- Test files follow the `*.test.*` naming convention (e.g., `authService.test.ts`).
- The testing framework is not specified; ensure tests are clear and comprehensive.
- Place test files alongside the modules they test or in a dedicated test directory.
- Example test file structure:
  ```typescript
  // authService.test.ts
  import { authenticateUser } from './authService';

  describe('authenticateUser', () => {
    it('should return true for valid credentials', () => {
      expect(authenticateUser('user', 'pass')).toBe(true);
    });
  });
  ```

## Commands
| Command      | Purpose                                               |
|--------------|-------------------------------------------------------|
| /refactor    | Refactor code for clarity or structure improvements   |
| /add-test    | Add or update tests for new or changed functionality  |
```