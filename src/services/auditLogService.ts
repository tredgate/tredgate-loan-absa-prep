/**
 * @fileoverview Audit Log Service - Pure functions for managing audit log entries.
 * Handles storage, retrieval, filtering, and FIFO cleanup of audit log entries.
 * All operations are persisted to localStorage.
 */

import type { 
  AuditLogEntry, 
  CreateAuditLogInput, 
  AuditLogFilter 
} from '../types/auditLog'

/** localStorage key for audit log storage */
const STORAGE_KEY = 'tredgate_audit_log'

/** Maximum number of audit log entries to retain (FIFO cleanup) */
const MAX_ENTRIES = 500

/**
 * Generate a simple unique ID for audit log entries.
 * @returns A unique string identifier
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

/**
 * Load all audit log entries from localStorage.
 * Returns an empty array if no entries exist or on parse error.
 * Entries are returned in chronological order (oldest first).
 * 
 * @returns Array of audit log entries
 * 
 * @example
 * const entries = getAuditLog()
 * console.log(`Found ${entries.length} audit entries`)
 */
export function getAuditLog(): AuditLogEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    return JSON.parse(stored) as AuditLogEntry[]
  } catch {
    return []
  }
}

/**
 * Persist audit log entries to localStorage.
 * Enforces the maximum entry limit using FIFO cleanup.
 * 
 * @param entries - Array of audit log entries to save
 * 
 * @example
 * const entries = getAuditLog()
 * saveAuditLog(entries)
 */
export function saveAuditLog(entries: AuditLogEntry[]): void {
  // Apply FIFO cleanup if exceeding max entries
  const trimmedEntries = entries.length > MAX_ENTRIES 
    ? entries.slice(-MAX_ENTRIES) 
    : entries
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedEntries))
}

/**
 * Create and persist a new audit log entry.
 * Auto-generates ID and timestamp.
 * 
 * @param input - The audit log entry data (without id and timestamp)
 * @returns The created audit log entry
 * 
 * @example
 * const entry = createAuditLogEntry({
 *   actionType: 'create',
 *   loanId: 'abc123',
 *   applicantName: 'John Doe',
 *   previousStatus: null,
 *   newStatus: 'pending',
 *   details: 'New loan application created for $50,000'
 * })
 */
export function createAuditLogEntry(input: CreateAuditLogInput): AuditLogEntry {
  const newEntry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...input
  }

  const entries = getAuditLog()
  entries.push(newEntry)
  saveAuditLog(entries)

  return newEntry
}

/**
 * Filter audit log entries based on provided criteria.
 * Supports filtering by action types and free-text search.
 * Search is case-insensitive and matches loanId, applicantName, and details.
 * 
 * @param entries - Array of entries to filter
 * @param filter - Filter criteria
 * @returns Filtered array of entries
 * 
 * @example
 * // Filter by action type
 * const approvals = filterAuditLog(entries, { actionTypes: ['approve'] })
 * 
 * @example
 * // Free text search
 * const johnEntries = filterAuditLog(entries, { searchText: 'john' })
 * 
 * @example
 * // Combined filter
 * const filtered = filterAuditLog(entries, { 
 *   actionTypes: ['create', 'approve'],
 *   searchText: 'doe'
 * })
 */
export function filterAuditLog(
  entries: AuditLogEntry[], 
  filter: AuditLogFilter
): AuditLogEntry[] {
  let result = entries

  // Filter by action types if specified
  if (filter.actionTypes && filter.actionTypes.length > 0) {
    result = result.filter(entry => 
      filter.actionTypes!.includes(entry.actionType)
    )
  }

  // Filter by search text if specified
  if (filter.searchText && filter.searchText.trim() !== '') {
    const searchLower = filter.searchText.toLowerCase().trim()
    result = result.filter(entry => 
      entry.loanId.toLowerCase().includes(searchLower) ||
      entry.applicantName.toLowerCase().includes(searchLower) ||
      entry.details.toLowerCase().includes(searchLower)
    )
  }

  return result
}

/**
 * Get the maximum number of entries allowed in the audit log.
 * Useful for displaying limit information in the UI.
 * 
 * @returns The maximum number of entries
 */
export function getMaxEntries(): number {
  return MAX_ENTRIES
}

/**
 * Clear all audit log entries.
 * Primarily used for testing purposes.
 */
export function clearAuditLog(): void {
  localStorage.removeItem(STORAGE_KEY)
}
