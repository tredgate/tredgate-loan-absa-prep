/**
 * Test data helpers for E2E tests
 * Provides reusable test data and utilities
 */

export interface LoanTestData {
  applicantName: string
  amount: number
  termMonths: number
  interestRate: number
}

/**
 * Predefined test loans for different scenarios
 */
export const TestLoans = {
  /**
   * Standard loan that will be auto-approved
   * Amount <= 100000 AND termMonths <= 60
   */
  approvable: {
    applicantName: 'John Doe',
    amount: 50000,
    termMonths: 24,
    interestRate: 0.08,
  } as LoanTestData,

  /**
   * Loan that will be auto-rejected due to high amount
   * Amount > 100000
   */
  rejectableByAmount: {
    applicantName: 'Jane Smith',
    amount: 150000,
    termMonths: 48,
    interestRate: 0.06,
  } as LoanTestData,

  /**
   * Loan that will be auto-rejected due to long term
   * termMonths > 60
   */
  rejectableByTerm: {
    applicantName: 'Bob Wilson',
    amount: 75000,
    termMonths: 72,
    interestRate: 0.07,
  } as LoanTestData,

  /**
   * Small loan with short term for quick testing
   */
  small: {
    applicantName: 'Alice Brown',
    amount: 5000,
    termMonths: 6,
    interestRate: 0.05,
  } as LoanTestData,

  /**
   * Borderline loan exactly at auto-approve limits
   */
  borderline: {
    applicantName: 'Charlie Davis',
    amount: 100000,
    termMonths: 60,
    interestRate: 0.08,
  } as LoanTestData,
} as const

/**
 * Generate a unique applicant name for test isolation
 */
export function generateUniqueApplicantName(baseName: string = 'Test User'): string {
  return `${baseName} ${Date.now()}`
}

/**
 * Format currency for assertion comparison
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format percentage for assertion comparison
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

/**
 * Calculate expected monthly payment using the app's formula
 * Formula: (amount * (1 + interestRate)) / termMonths
 */
export function calculateExpectedMonthlyPayment(loan: LoanTestData): number {
  const total = loan.amount * (1 + loan.interestRate)
  return total / loan.termMonths
}
