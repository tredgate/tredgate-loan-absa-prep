# Testing Guide

This document describes the testing setup for the Tredgate Loan application.

## Overview

The project uses [Vitest](https://vitest.dev/) as the testing framework with `@vue/test-utils` for Vue component testing.

## Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI (interactive mode)
npm run test:ui
```

## Test Structure

Tests are located in the `tests/` directory:

```
tests/
├── loanService.test.ts       # Service layer tests
├── App.test.ts               # Main application tests
└── components/
    ├── LoanForm.test.ts      # LoanForm component tests
    ├── LoanList.test.ts      # LoanList component tests
    └── LoanSummary.test.ts   # LoanSummary component tests
```

## Test Categories

### Service Tests (`loanService.test.ts`)

Tests for business logic functions:
- `getLoans()` - Retrieve loans from localStorage
- `saveLoans()` - Persist loans to localStorage
- `createLoanApplication()` - Create new loan with validation
- `updateLoanStatus()` - Update loan status by ID
- `calculateMonthlyPayment()` - Calculate monthly payment
- `autoDecideLoan()` - Auto-approve/reject based on rules

### Component Tests

#### LoanForm (`LoanForm.test.ts`)
- Form rendering
- Input validation
- Form submission
- Error handling

#### LoanList (`LoanList.test.ts`)
- Table rendering
- Data formatting (currency, percentage, date)
- Action buttons visibility
- Event emission

#### LoanSummary (`LoanSummary.test.ts`)
- Statistics calculation
- Currency formatting
- Reactivity

#### App (`App.test.ts`)
- Component integration
- Event handling
- Data flow

## Test Reports

After running tests, reports are generated in `test-results/`:

- `results.json` - JSON test results
- `junit.xml` - JUnit XML report
- `coverage/` - HTML coverage report (when running with `--coverage`)

## Coverage

The project aims for high test coverage. View the coverage report:

```bash
npm run test:coverage
# Then open test-results/coverage/index.html
```

## Mocking

Tests use Vitest's built-in mocking capabilities:

```typescript
// Mock a module
vi.mock('../services/loanService', () => ({
  getLoans: vi.fn(() => []),
  // ...
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    clear: vi.fn(() => { store = {} }),
    // ...
  }
})()
```

## CI/CD

Tests run automatically on:
- Push to `main` branch
- Pull requests to `main` branch

The CI workflow:
1. Runs linter
2. Runs tests with coverage
3. Uploads test results artifact
4. Displays test summary

## Writing New Tests

1. Create test file in appropriate directory
2. Import test utilities and components
3. Mock external dependencies
4. Use `describe` blocks for organization
5. Use `it` for individual test cases
6. Use `beforeEach` for setup

Example:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '../src/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.text()).toContain('Expected text')
  })
})
```
