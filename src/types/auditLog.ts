/**
 * Types and interfaces for the Audit Log feature.
 * The audit log tracks all significant loan operations including
 * creation, status changes, and deletions.
 */

import type { LoanStatus } from './loan'

/**
 * Union type for all audit action types.
 * Represents the different operations that can be logged.
 */
export type AuditActionType = 
  | 'create'      // New loan application created
  | 'approve'     // Loan manually approved
  | 'reject'      // Loan manually rejected
  | 'auto-decide' // Loan auto-decided based on rules
  | 'delete'      // Loan application deleted

/**
 * Represents a single audit log entry.
 * Each entry captures the details of a significant loan operation.
 */
export interface AuditLogEntry {
  /** Unique identifier for the audit entry */
  id: string
  /** ISO timestamp when the action occurred */
  timestamp: string
  /** Type of action performed */
  actionType: AuditActionType
  /** ID of the loan affected (may be null for system-wide actions) */
  loanId: string
  /** Name of the applicant at time of action */
  applicantName: string
  /** Status of the loan before the action (null for create) */
  previousStatus: LoanStatus | null
  /** Status of the loan after the action (null for delete) */
  newStatus: LoanStatus | null
  /** Human-readable description of the action */
  details: string
}

/**
 * Input for creating a new audit log entry.
 * ID and timestamp are auto-generated.
 */
export interface CreateAuditLogInput {
  actionType: AuditActionType
  loanId: string
  applicantName: string
  previousStatus: LoanStatus | null
  newStatus: LoanStatus | null
  details: string
}

/**
 * Filter options for querying audit log entries.
 */
export interface AuditLogFilter {
  /** Filter by action types (multiple allowed) */
  actionTypes?: AuditActionType[]
  /** Free text search on applicantName, loanId, and details */
  searchText?: string
}
