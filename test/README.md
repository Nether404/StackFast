# Testing Setup

This directory contains the testing configuration and utilities for the Stackfast application.

## Framework

We use **Vitest** as our testing framework, which provides:
- Fast execution with native ES modules support
- TypeScript support out of the box
- Jest-compatible API
- Built-in coverage reporting
- Watch mode for development

## Testing Libraries

- **@testing-library/react**: For testing React components
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions
- **@testing-library/user-event**: For simulating user interactions
- **happy-dom**: Lightweight DOM implementation for testing

## Directory Structure

```
test/
├── README.md           # This file
├── setup.ts           # Global test setup and mocks
├── utils.tsx          # Custom render function and test utilities
├── fixtures.ts        # Mock data and API responses
├── tsconfig.json      # TypeScript configuration for tests
└── *.test.ts          # Test files
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Unit Tests
Place unit test files next to the code they test with `.test.ts` or `.spec.ts` extension:

```
client/src/utils/
├── search-utils.ts
└── search-utils.test.ts
```

### Component Tests
Use the custom render function from `test/utils.tsx`:

```typescript
import { render, screen, userEvent } from '../../../test/utils';
import { MyComponent } from './my-component';

test('should render component', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);
  
  const button = screen.getByRole('button');
  await user.click(button);
  
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

### API Tests
Use mock fixtures and utilities:

```typescript
import { mockFetch, mockApiResponses } from '../../../test/fixtures';
import { vi } from 'vitest';

test('should fetch tools', async () => {
  global.fetch = mockFetch(mockApiResponses.tools.success);
  
  const result = await fetchTools();
  
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(3);
});
```

## Test Configuration

### Vitest Config (`vitest.config.ts`)
- Configures test environment and setup files
- Sets up path aliases to match the main application
- Configures coverage thresholds and reporting

### Setup File (`test/setup.ts`)
- Imports Jest DOM matchers
- Mocks browser APIs (ResizeObserver, IntersectionObserver, etc.)
- Sets up global fetch mock
- Configures console mocks for cleaner output

### Test Utils (`test/utils.tsx`)
- Custom render function with React Query provider
- Mock data factories
- User event utilities
- API mocking helpers

## Coverage

Coverage reports are generated in the `coverage/` directory and include:
- HTML report: `coverage/index.html`
- JSON report: `coverage/coverage-final.json`
- LCOV report: `coverage/lcov.info`

Current coverage thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the user sees and does
2. **Use Descriptive Test Names**: Clearly describe what is being tested
3. **Arrange, Act, Assert**: Structure tests with clear setup, action, and verification
4. **Mock External Dependencies**: Use mocks for API calls, external services, etc.
5. **Test Edge Cases**: Include tests for error conditions and boundary cases
6. **Keep Tests Independent**: Each test should be able to run in isolation

## Debugging Tests

### VS Code Integration
Add this to your VS Code settings for better test debugging:

```json
{
  "vitest.enable": true,
  "vitest.commandLine": "npm run test:watch"
}
```

### Debug Mode
Run tests in debug mode:

```bash
npx vitest --inspect-brk
```

Then attach your debugger to the Node.js process.