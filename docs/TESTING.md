# Testing Guide

This document describes the testing setup for the Tredgate Loan application.

## Overview

The project uses [Vitest](https://vitest.dev/) as the testing framework with `@vue/test-utils` for Vue component testing. All tests include JSDoc documentation explaining what each test does.

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
├── loanService.test.ts       # Service layer tests (19 tests)
├── App.test.ts               # Main application tests (16 tests)
└── components/
    ├── LoanForm.test.ts      # LoanForm component tests (11 tests)
    ├── LoanList.test.ts      # LoanList component tests (19 tests)
    └── LoanSummary.test.ts   # LoanSummary component tests (16 tests)
```

**Total: 81 tests**

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
- Form rendering - Verifies all form inputs and submit button are rendered
- Input validation - Tests error messages for empty/invalid inputs
- Form submission - Tests service calls, event emission, and form reset
- Error handling - Tests graceful handling of service errors

#### LoanList (`LoanList.test.ts`)
- Table rendering - Verifies table structure, headers, and data display
- Data formatting - Tests currency ($50,000.00), percentage (8.0%), and date formatting
- Status badges - Tests correct CSS classes for pending/approved/rejected states
- Action buttons visibility - Tests button visibility based on loan status
- Event emission - Tests approve, reject, and autoDecide events

#### LoanSummary (`LoanSummary.test.ts`)
- Statistics calculation - Tests counting of total, pending, approved, rejected loans
- Currency formatting - Tests total approved amount formatting
- CSS styling - Tests correct CSS classes for stat cards
- Reactivity - Tests component updates when props change

#### App (`App.test.ts`)
- Component integration - Verifies all child components are rendered
- Initial data loading - Tests getLoans is called on mount
- Event handling - Tests approve, reject, and auto-decide handlers
- Data flow - Tests loans are passed to child components and updated on changes

## Test Reports

After running tests, reports are generated in `test-results/`:

- `results.json` - JSON test results
- `junit.xml` - JUnit XML report
- `coverage/` - HTML coverage report (when running with `--coverage`)

### Example HTML Report

An example HTML coverage report is included in the repository at `docs/example-report/`. You can view it by opening `docs/example-report/index.html` in a browser.

This example shows:
- Overall coverage summary with percentages for statements, branches, functions, and lines
- Per-file coverage breakdown
- Clickable files to view line-by-line coverage details

## Coverage

The project aims for high test coverage. Current coverage is 99%+ across all metrics.

View the coverage report:

```bash
npm run test:coverage
# Then open test-results/coverage/index.html
```

## JSDoc Documentation

All tests include JSDoc documentation explaining:
- **@fileoverview** - What the test file covers
- **@test** - Which function/component is being tested
- Description of what each test verifies

Example:

```typescript
/**
 * @fileoverview Unit tests for the LoanForm component.
 * Tests form rendering, input validation, form submission,
 * and error handling.
 */

/**
 * Verifies error message when applicant name is empty on submit.
 * @test {LoanForm}
 */
it('shows error when applicant name is empty', async () => {
  const wrapper = mount(LoanForm)
  await wrapper.find('form').trigger('submit')
  expect(wrapper.find('.error-message').text()).toBe('Applicant name is required')
})
```

## Mocking

Tests use Vitest's built-in mocking capabilities:

```typescript
/**
 * Mock loanService module to isolate component tests.
 */
vi.mock('../services/loanService', () => ({
  getLoans: vi.fn(() => []),
  // ...
}))

/**
 * Mock localStorage implementation for testing.
 * Provides a clean in-memory store that can be cleared between tests.
 */
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
3. Uploads test results artifact (HTML report)
4. Displays test summary in workflow UI

## Writing New Tests

1. Create test file in appropriate directory
2. Add `@fileoverview` JSDoc at the top
3. Import test utilities and components
4. Mock external dependencies with documentation
5. Use `describe` blocks for organization
6. Use `it` for individual test cases with JSDoc
7. Use `beforeEach` for setup

Example:

```typescript
/**
 * @fileoverview Unit tests for MyComponent.
 * Tests rendering and user interactions.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '../src/components/MyComponent.vue'

/**
 * Test suite for MyComponent.
 */
describe('MyComponent', () => {
  /**
   * Verifies component renders expected text.
   * @test {MyComponent}
   */
  it('renders correctly', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.text()).toContain('Expected text')
  })
})
```
