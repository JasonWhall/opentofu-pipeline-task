# Testing Guide

This project uses **Jest** with TypeScript for unit testing.

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

## Test Structure

- `__tests__/` - Contains all test files
- `utils.test.ts` - Tests for platform/architecture utilities
- `opentofu.test.ts` - Tests for OpenTofu version fetching, installation, and verification

## Writing New Tests

### Basic Test Structure
```typescript
import { functionToTest } from '../your-module';

describe('Module Name', () => {
  describe('functionToTest', () => {
    it('should do something specific', () => {
      const result = functionToTest();
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Mocking Azure Pipelines Libraries
```typescript
jest.mock('azure-pipelines-task-lib/task');
import * as tl from 'azure-pipelines-task-lib/task';

// In your test
(tl.someFunction as jest.Mock).mockReturnValue('mocked value');
```

## Coverage Thresholds

The project requires minimum coverage of:
- **70%** branches
- **70%** functions
- **70%** lines
- **70%** statements

Coverage reports are generated in the `coverage/` directory.

## CI/CD Integration

Tests should be added to the CI pipeline to run on every build.

## Best Practices

1. **Test one thing per test** - Keep tests focused and specific
2. **Use descriptive test names** - "should return amd64 for x64 architecture"
3. **Mock external dependencies** - Use Jest mocks for Azure libraries, fs, etc.
4. **Test error cases** - Don't just test the happy path
5. **Clean up after tests** - Use `afterEach` to reset mocks and state
