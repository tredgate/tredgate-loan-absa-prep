import type { LoanApplication, LoanStatus, CreateLoanInput } from '../types/loan'
import { createAuditLogEntry } from './auditLogService'

const STORAGE_KEY = 'tredgate_loans'

/**
 * Format currency for audit log details.
 */
function formatCurrencyForLog(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

/**
 * Load loans from localStorage
 * If there is nothing stored yet, returns an empty array
 */
export function getLoans(): LoanApplication[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    return JSON.parse(stored) as LoanApplication[]
  } catch {
    return []
  }
}

/**
 * Persist the array of loans into localStorage
 */
export function saveLoans(loans: LoanApplication[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loans))
}

/**
 * Create a new loan application
 * Validates basic data and appends to stored loans
 */
export function createLoanApplication(input: CreateLoanInput): LoanApplication {
  // Validate input
  if (!input.applicantName || input.applicantName.trim() === '') {
    throw new Error('Applicant name is required')
  }
  if (input.amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }
  if (input.termMonths <= 0) {
    throw new Error('Term months must be greater than 0')
  }
  if (input.interestRate < 0) {
    throw new Error('Interest rate cannot be negative')
  }

  const newLoan: LoanApplication = {
    id: generateId(),
    applicantName: input.applicantName.trim(),
    amount: input.amount,
    termMonths: input.termMonths,
    interestRate: input.interestRate,
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  const loans = getLoans()
  loans.push(newLoan)
  saveLoans(loans)

  // Record audit log entry for loan creation
  createAuditLogEntry({
    actionType: 'create',
    loanId: newLoan.id,
    applicantName: newLoan.applicantName,
    previousStatus: null,
    newStatus: 'pending',
    details: `New loan application created for ${formatCurrencyForLog(newLoan.amount)} over ${newLoan.termMonths} months`
  })

  return newLoan
}

/**
 * Update the status of a loan by ID
 */
export function updateLoanStatus(id: string, status: LoanStatus): void {
  const loans = getLoans()
  const loanIndex = loans.findIndex(loan => loan.id === id)
  
  if (loanIndex === -1) {
    throw new Error(`Loan with id ${id} not found`)
  }

  const loan = loans[loanIndex]
  if (loan) {
    const previousStatus = loan.status
    loan.status = status
    saveLoans(loans)

    // Record audit log entry for status change (approve/reject)
    const actionType = status === 'approved' ? 'approve' : 'reject'
    createAuditLogEntry({
      actionType,
      loanId: loan.id,
      applicantName: loan.applicantName,
      previousStatus,
      newStatus: status,
      details: `Loan ${status} for ${loan.applicantName} (${formatCurrencyForLog(loan.amount)})`
    })
  }
}

/**
 * Calculate the monthly payment for a loan
 * Uses a simple formula: total = amount * (1 + interestRate), monthly = total / termMonths
 */
export function calculateMonthlyPayment(loan: LoanApplication): number {
  const total = loan.amount * (1 + loan.interestRate)
  return total / loan.termMonths
}

/**
 * Automatically decide on a loan based on simple rules:
 * - if amount <= 100000 AND termMonths <= 60 → approved
 * - otherwise → rejected
 */
export function autoDecideLoan(id: string): void {
  const loans = getLoans()
  const loan = loans.find(l => l.id === id)
  
  if (!loan) {
    throw new Error(`Loan with id ${id} not found`)
  }

  const previousStatus = loan.status
  let newStatus: LoanStatus
  let reason: string

  if (loan.amount <= 100000 && loan.termMonths <= 60) {
    newStatus = 'approved'
    reason = 'amount ≤ $100,000 and term ≤ 60 months'
  } else {
    newStatus = 'rejected'
    const reasons: string[] = []
    if (loan.amount > 100000) reasons.push('amount > $100,000')
    if (loan.termMonths > 60) reasons.push('term > 60 months')
    reason = reasons.join(' and ')
  }

  loan.status = newStatus
  saveLoans(loans)

  // Record audit log entry for auto-decide
  createAuditLogEntry({
    actionType: 'auto-decide',
    loanId: loan.id,
    applicantName: loan.applicantName,
    previousStatus,
    newStatus,
    details: `Auto-decision: ${newStatus} (${reason})`
  })
}

/**
 * Delete a loan application by ID
 */
export function deleteLoan(id: string): void {
  const loans = getLoans()
  const loanIndex = loans.findIndex(loan => loan.id === id)
  
  if (loanIndex === -1) {
    throw new Error(`Loan with id ${id} not found`)
  }

  const loan = loans[loanIndex]
  if (!loan) {
    throw new Error(`Loan with id ${id} not found`)
  }

  // Capture loan data before deletion for audit log
  const { applicantName, status, amount } = loan

  loans.splice(loanIndex, 1)
  saveLoans(loans)

  // Record audit log entry for deletion
  createAuditLogEntry({
    actionType: 'delete',
    loanId: id,
    applicantName,
    previousStatus: status,
    newStatus: null,
    details: `Loan application deleted for ${applicantName} (${formatCurrencyForLog(amount)}, was ${status})`
  })
}
