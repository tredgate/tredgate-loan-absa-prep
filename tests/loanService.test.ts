/**
 * @fileoverview Unit tests for the loanService module.
 * Tests all business logic functions for loan management including CRUD operations,
 * validation, calculations, and auto-decision rules.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getLoans,
  saveLoans,
  createLoanApplication,
  updateLoanStatus,
  calculateMonthlyPayment,
  autoDecideLoan,
  deleteLoan
} from '../src/services/loanService'
import type { LoanApplication } from '../src/types/loan'

/**
 * Mock localStorage implementation for testing.
 * Provides a clean in-memory store that can be cleared between tests.
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

/**
 * Test suite for loanService module.
 * Covers all exported functions with various scenarios and edge cases.
 */
describe('loanService', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  /**
   * Tests for getLoans() function.
   * Verifies retrieval of loans from localStorage.
   */
  describe('getLoans', () => {
    /**
     * Verifies that an empty array is returned when localStorage is empty.
     * @test {getLoans}
     */
    it('returns empty array when nothing is stored', () => {
      const loans = getLoans()
      expect(loans).toEqual([])
    })

    /**
     * Verifies that stored loans are correctly retrieved and parsed from localStorage.
     * @test {getLoans}
     */
    it('returns stored loans', () => {
      const storedLoans: LoanApplication[] = [
        {
          id: '1',
          applicantName: 'John Doe',
          amount: 50000,
          termMonths: 24,
          interestRate: 0.08,
          status: 'pending',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ]
      localStorageMock.setItem('tredgate_loans', JSON.stringify(storedLoans))

      const loans = getLoans()
      expect(loans).toEqual(storedLoans)
    })
  })

  /**
   * Tests for saveLoans() function.
   * Verifies persistence of loans to localStorage.
   */
  describe('saveLoans', () => {
    /**
     * Verifies that loans are correctly serialized and saved to localStorage.
     * @test {saveLoans}
     */
    it('saves loans to localStorage', () => {
      const loans: LoanApplication[] = [
        {
          id: '1',
          applicantName: 'Jane Doe',
          amount: 75000,
          termMonths: 36,
          interestRate: 0.06,
          status: 'approved',
          createdAt: '2024-02-01T00:00:00.000Z'
        }
      ]

      saveLoans(loans)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tredgate_loans',
        JSON.stringify(loans)
      )
    })
  })

  /**
   * Tests for createLoanApplication() function.
   * Verifies loan creation with validation rules.
   */
  describe('createLoanApplication', () => {
    /**
     * Verifies successful loan creation with valid input data.
     * Checks that ID, createdAt, and pending status are automatically set.
     * @test {createLoanApplication}
     */
    it('creates a new loan with pending status', () => {
      const input = {
        applicantName: 'Alice Smith',
        amount: 25000,
        termMonths: 12,
        interestRate: 0.05
      }

      const loan = createLoanApplication(input)

      expect(loan.applicantName).toBe('Alice Smith')
      expect(loan.amount).toBe(25000)
      expect(loan.termMonths).toBe(12)
      expect(loan.interestRate).toBe(0.05)
      expect(loan.status).toBe('pending')
      expect(loan.id).toBeDefined()
      expect(loan.createdAt).toBeDefined()
    })

    /**
     * Verifies validation error when applicant name is empty.
     * @test {createLoanApplication}
     */
    it('throws error for empty applicant name', () => {
      expect(() =>
        createLoanApplication({
          applicantName: '',
          amount: 10000,
          termMonths: 12,
          interestRate: 0.05
        })
      ).toThrow('Applicant name is required')
    })

    /**
     * Verifies validation error when loan amount is zero or negative.
     * @test {createLoanApplication}
     */
    it('throws error for amount <= 0', () => {
      expect(() =>
        createLoanApplication({
          applicantName: 'John',
          amount: 0,
          termMonths: 12,
          interestRate: 0.05
        })
      ).toThrow('Amount must be greater than 0')
    })

    /**
     * Verifies validation error when term months is zero or negative.
     * @test {createLoanApplication}
     */
    it('throws error for termMonths <= 0', () => {
      expect(() =>
        createLoanApplication({
          applicantName: 'John',
          amount: 10000,
          termMonths: 0,
          interestRate: 0.05
        })
      ).toThrow('Term months must be greater than 0')
    })

    /**
     * Verifies validation error when interest rate is negative.
     * @test {createLoanApplication}
     */
    it('throws error for negative interest rate', () => {
      expect(() =>
        createLoanApplication({
          applicantName: 'John',
          amount: 10000,
          termMonths: 12,
          interestRate: -0.05
        })
      ).toThrow('Interest rate cannot be negative')
    })
  })

  /**
   * Tests for updateLoanStatus() function.
   * Verifies loan status updates and error handling.
   */
  describe('updateLoanStatus', () => {
    /**
     * Verifies successful status update from pending to approved.
     * @test {updateLoanStatus}
     */
    it('updates loan status', () => {
      const loan: LoanApplication = {
        id: 'test-id',
        applicantName: 'Bob',
        amount: 50000,
        termMonths: 24,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      updateLoanStatus('test-id', 'approved')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('approved')
    })

    /**
     * Verifies error is thrown when trying to update non-existent loan.
     * @test {updateLoanStatus}
     */
    it('throws error for non-existent loan', () => {
      expect(() => updateLoanStatus('non-existent', 'approved')).toThrow(
        'Loan with id non-existent not found'
      )
    })
  })

  /**
   * Tests for calculateMonthlyPayment() function.
   * Verifies monthly payment calculation with simple interest formula.
   */
  describe('calculateMonthlyPayment', () => {
    /**
     * Verifies monthly payment calculation for a standard loan.
     * Formula: (amount * (1 + interestRate)) / termMonths
     * @test {calculateMonthlyPayment}
     */
    it('calculates monthly payment correctly for basic case', () => {
      const loan: LoanApplication = {
        id: '1',
        applicantName: 'Test',
        amount: 10000,
        termMonths: 12,
        interestRate: 0.1, // 10%
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      // total = 10000 * 1.1 = 11000
      // monthly = 11000 / 12 = 916.666...
      const payment = calculateMonthlyPayment(loan)
      expect(payment).toBeCloseTo(916.67, 1)
    })

    /**
     * Verifies monthly payment calculation when interest rate is 0%.
     * Should return amount / termMonths.
     * @test {calculateMonthlyPayment}
     */
    it('calculates monthly payment for 0% interest', () => {
      const loan: LoanApplication = {
        id: '1',
        applicantName: 'Test',
        amount: 12000,
        termMonths: 12,
        interestRate: 0,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      // total = 12000 * 1.0 = 12000
      // monthly = 12000 / 12 = 1000
      const payment = calculateMonthlyPayment(loan)
      expect(payment).toBe(1000)
    })

    /**
     * Verifies monthly payment calculation for large loan amounts.
     * Ensures no precision issues with large numbers.
     * @test {calculateMonthlyPayment}
     */
    it('calculates monthly payment for large loan', () => {
      const loan: LoanApplication = {
        id: '1',
        applicantName: 'Test',
        amount: 100000,
        termMonths: 60,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      // total = 100000 * 1.08 = 108000
      // monthly = 108000 / 60 = 1800
      const payment = calculateMonthlyPayment(loan)
      expect(payment).toBe(1800)
    })
  })

  /**
   * Tests for autoDecideLoan() function.
   * Verifies automatic loan approval/rejection based on business rules.
   * Rules: Approve if amount <= 100000 AND termMonths <= 60, otherwise reject.
   */
  describe('autoDecideLoan', () => {
    /**
     * Verifies loan is approved when at maximum allowed limits.
     * Amount = 100000 (max) and termMonths = 60 (max) should approve.
     * @test {autoDecideLoan}
     */
    it('approves loan when amount <= 100000 and termMonths <= 60', () => {
      const loan: LoanApplication = {
        id: 'auto-test',
        applicantName: 'Auto User',
        amount: 100000,
        termMonths: 60,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      autoDecideLoan('auto-test')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('approved')
    })

    /**
     * Verifies small, short-term loans are approved.
     * Both amount and term are well within limits.
     * @test {autoDecideLoan}
     */
    it('approves small, short-term loan', () => {
      const loan: LoanApplication = {
        id: 'small-loan',
        applicantName: 'Small Borrower',
        amount: 5000,
        termMonths: 6,
        interestRate: 0.05,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      autoDecideLoan('small-loan')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('approved')
    })

    /**
     * Verifies loan is rejected when amount exceeds maximum limit.
     * Amount > 100000 should result in rejection.
     * @test {autoDecideLoan}
     */
    it('rejects loan when amount > 100000', () => {
      const loan: LoanApplication = {
        id: 'big-loan',
        applicantName: 'Big Borrower',
        amount: 150000,
        termMonths: 60,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      autoDecideLoan('big-loan')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('rejected')
    })

    /**
     * Verifies loan is rejected when term exceeds maximum limit.
     * termMonths > 60 should result in rejection.
     * @test {autoDecideLoan}
     */
    it('rejects loan when termMonths > 60', () => {
      const loan: LoanApplication = {
        id: 'long-loan',
        applicantName: 'Long Term Borrower',
        amount: 50000,
        termMonths: 72,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      autoDecideLoan('long-loan')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('rejected')
    })

    /**
     * Verifies loan is rejected when both amount and term exceed limits.
     * Tests compound rejection scenario.
     * @test {autoDecideLoan}
     */
    it('rejects loan when both amount and termMonths exceed limits', () => {
      const loan: LoanApplication = {
        id: 'bad-loan',
        applicantName: 'Bad Borrower',
        amount: 200000,
        termMonths: 120,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      autoDecideLoan('bad-loan')

      const loans = getLoans()
      expect(loans[0]?.status).toBe('rejected')
    })

    /**
     * Verifies error is thrown when trying to auto-decide non-existent loan.
     * @test {autoDecideLoan}
     */
    it('throws error for non-existent loan', () => {
      expect(() => autoDecideLoan('non-existent')).toThrow(
        'Loan with id non-existent not found'
      )
    })
  })

  /**
   * Tests for deleteLoan() function.
   * Verifies loan deletion and error handling.
   */
  describe('deleteLoan', () => {
    /**
     * Verifies successful deletion of a loan by ID.
     * @test {deleteLoan}
     */
    it('deletes a loan by id', () => {
      const loans: LoanApplication[] = [
        {
          id: 'loan-1',
          applicantName: 'Alice',
          amount: 10000,
          termMonths: 12,
          interestRate: 0.05,
          status: 'pending',
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'loan-2',
          applicantName: 'Bob',
          amount: 20000,
          termMonths: 24,
          interestRate: 0.06,
          status: 'approved',
          createdAt: '2024-01-02T00:00:00.000Z'
        }
      ]
      saveLoans(loans)

      deleteLoan('loan-1')

      const remainingLoans = getLoans()
      expect(remainingLoans).toHaveLength(1)
      expect(remainingLoans[0]?.id).toBe('loan-2')
    })

    /**
     * Verifies all loans are removed when deleting the last loan.
     * @test {deleteLoan}
     */
    it('removes the last loan leaving empty array', () => {
      const loan: LoanApplication = {
        id: 'only-loan',
        applicantName: 'Charlie',
        amount: 15000,
        termMonths: 18,
        interestRate: 0.07,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      deleteLoan('only-loan')

      const loans = getLoans()
      expect(loans).toHaveLength(0)
    })

    /**
     * Verifies error is thrown when trying to delete non-existent loan.
     * @test {deleteLoan}
     */
    it('throws error when loan id does not exist', () => {
      const loan: LoanApplication = {
        id: 'existing-loan',
        applicantName: 'David',
        amount: 25000,
        termMonths: 30,
        interestRate: 0.08,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
      saveLoans([loan])

      expect(() => deleteLoan('non-existent-id')).toThrow(
        'Loan with id non-existent-id not found'
      )
    })

    /**
     * Verifies deletion does not affect other loans in the list.
     * @test {deleteLoan}
     */
    it('deletes correct loan from multiple loans', () => {
      const loans: LoanApplication[] = [
        {
          id: 'loan-a',
          applicantName: 'Alice',
          amount: 10000,
          termMonths: 12,
          interestRate: 0.05,
          status: 'pending',
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'loan-b',
          applicantName: 'Bob',
          amount: 20000,
          termMonths: 24,
          interestRate: 0.06,
          status: 'approved',
          createdAt: '2024-01-02T00:00:00.000Z'
        },
        {
          id: 'loan-c',
          applicantName: 'Charlie',
          amount: 30000,
          termMonths: 36,
          interestRate: 0.07,
          status: 'rejected',
          createdAt: '2024-01-03T00:00:00.000Z'
        }
      ]
      saveLoans(loans)

      deleteLoan('loan-b')

      const remainingLoans = getLoans()
      expect(remainingLoans).toHaveLength(2)
      expect(remainingLoans.map(l => l.id)).toEqual(['loan-a', 'loan-c'])
    })
  })
})
