/**
 * @fileoverview Unit tests for the auditLogService module.
 * Tests all business logic functions for audit log management including CRUD operations,
 * filtering, searching, and FIFO cleanup.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAuditLog,
  saveAuditLog,
  createAuditLogEntry,
  filterAuditLog,
  getMaxEntries,
  clearAuditLog
} from '../src/services/auditLogService'
import type { AuditLogEntry, CreateAuditLogInput } from '../src/types/auditLog'

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
 * Test suite for auditLogService module.
 * Covers all exported functions with various scenarios and edge cases.
 */
describe('auditLogService', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  /**
   * Helper function to create mock audit log entry for testing.
   * @param overrides - Partial entry properties to override defaults
   * @returns Complete AuditLogEntry object
   */
  const createMockEntry = (overrides: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
    id: 'test-id',
    timestamp: '2024-01-15T10:30:00.000Z',
    actionType: 'create',
    loanId: 'loan-123',
    applicantName: 'John Doe',
    previousStatus: null,
    newStatus: 'pending',
    details: 'Test audit entry',
    ...overrides
  })

  /**
   * Tests for getAuditLog() function.
   * Verifies retrieval of audit log entries from localStorage.
   */
  describe('getAuditLog', () => {
    /**
     * Verifies that an empty array is returned when localStorage is empty.
     * @test {getAuditLog}
     */
    it('returns empty array when nothing is stored', () => {
      const entries = getAuditLog()
      expect(entries).toEqual([])
    })

    /**
     * Verifies that stored entries are correctly retrieved and parsed from localStorage.
     * @test {getAuditLog}
     */
    it('returns stored entries', () => {
      const storedEntries: AuditLogEntry[] = [createMockEntry()]
      localStorageMock.setItem('tredgate_audit_log', JSON.stringify(storedEntries))

      const entries = getAuditLog()
      expect(entries).toEqual(storedEntries)
    })

    /**
     * Verifies that invalid JSON returns empty array.
     * @test {getAuditLog}
     */
    it('returns empty array for invalid JSON', () => {
      localStorageMock.setItem('tredgate_audit_log', 'invalid-json')

      const entries = getAuditLog()
      expect(entries).toEqual([])
    })
  })

  /**
   * Tests for saveAuditLog() function.
   * Verifies persistence of audit log entries to localStorage.
   */
  describe('saveAuditLog', () => {
    /**
     * Verifies that entries are correctly serialized and saved to localStorage.
     * @test {saveAuditLog}
     */
    it('saves entries to localStorage', () => {
      const entries: AuditLogEntry[] = [createMockEntry()]

      saveAuditLog(entries)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tredgate_audit_log',
        JSON.stringify(entries)
      )
    })

    /**
     * Verifies FIFO cleanup when entries exceed max limit.
     * @test {saveAuditLog}
     */
    it('applies FIFO cleanup when exceeding max entries', () => {
      const maxEntries = getMaxEntries()
      // Create more entries than the limit
      const entries: AuditLogEntry[] = Array.from({ length: maxEntries + 50 }, (_, i) =>
        createMockEntry({ id: `entry-${i}` })
      )

      saveAuditLog(entries)

      // Should have saved only the last MAX_ENTRIES
      const savedCall = localStorageMock.setItem.mock.calls[0]
      const savedEntries = JSON.parse(savedCall?.[1] as string) as AuditLogEntry[]
      expect(savedEntries).toHaveLength(maxEntries)
      // Should keep the last entries (newest)
      expect(savedEntries[0]?.id).toBe(`entry-50`)
      expect(savedEntries[maxEntries - 1]?.id).toBe(`entry-${maxEntries + 49}`)
    })

    /**
     * Verifies no cleanup when entries are within limit.
     * @test {saveAuditLog}
     */
    it('does not apply cleanup when within limit', () => {
      const entries: AuditLogEntry[] = [
        createMockEntry({ id: 'entry-1' }),
        createMockEntry({ id: 'entry-2' })
      ]

      saveAuditLog(entries)

      const savedCall = localStorageMock.setItem.mock.calls[0]
      const savedEntries = JSON.parse(savedCall?.[1] as string) as AuditLogEntry[]
      expect(savedEntries).toHaveLength(2)
    })
  })

  /**
   * Tests for createAuditLogEntry() function.
   * Verifies creation and persistence of new audit log entries.
   */
  describe('createAuditLogEntry', () => {
    /**
     * Verifies successful creation of audit log entry with auto-generated ID and timestamp.
     * @test {createAuditLogEntry}
     */
    it('creates a new entry with generated id and timestamp', () => {
      const input: CreateAuditLogInput = {
        actionType: 'create',
        loanId: 'loan-456',
        applicantName: 'Jane Doe',
        previousStatus: null,
        newStatus: 'pending',
        details: 'New loan created'
      }

      const entry = createAuditLogEntry(input)

      expect(entry.actionType).toBe('create')
      expect(entry.loanId).toBe('loan-456')
      expect(entry.applicantName).toBe('Jane Doe')
      expect(entry.previousStatus).toBeNull()
      expect(entry.newStatus).toBe('pending')
      expect(entry.details).toBe('New loan created')
      expect(entry.id).toBeDefined()
      expect(entry.timestamp).toBeDefined()
    })

    /**
     * Verifies entry is persisted to localStorage.
     * @test {createAuditLogEntry}
     */
    it('persists the entry to localStorage', () => {
      const input: CreateAuditLogInput = {
        actionType: 'approve',
        loanId: 'loan-789',
        applicantName: 'Bob Smith',
        previousStatus: 'pending',
        newStatus: 'approved',
        details: 'Loan approved'
      }

      createAuditLogEntry(input)

      const entries = getAuditLog()
      expect(entries).toHaveLength(1)
      expect(entries[0]?.actionType).toBe('approve')
    })

    /**
     * Verifies multiple entries are appended correctly.
     * @test {createAuditLogEntry}
     */
    it('appends entries correctly', () => {
      createAuditLogEntry({
        actionType: 'create',
        loanId: 'loan-1',
        applicantName: 'User 1',
        previousStatus: null,
        newStatus: 'pending',
        details: 'First entry'
      })

      createAuditLogEntry({
        actionType: 'approve',
        loanId: 'loan-1',
        applicantName: 'User 1',
        previousStatus: 'pending',
        newStatus: 'approved',
        details: 'Second entry'
      })

      const entries = getAuditLog()
      expect(entries).toHaveLength(2)
      expect(entries[0]?.actionType).toBe('create')
      expect(entries[1]?.actionType).toBe('approve')
    })
  })

  /**
   * Tests for filterAuditLog() function.
   * Verifies filtering by action types and text search.
   */
  describe('filterAuditLog', () => {
    const testEntries: AuditLogEntry[] = [
      createMockEntry({ id: '1', actionType: 'create', applicantName: 'Alice Smith', loanId: 'loan-001' }),
      createMockEntry({ id: '2', actionType: 'approve', applicantName: 'Bob Jones', loanId: 'loan-002' }),
      createMockEntry({ id: '3', actionType: 'reject', applicantName: 'Charlie Brown', loanId: 'loan-003', details: 'High risk' }),
      createMockEntry({ id: '4', actionType: 'auto-decide', applicantName: 'Diana Prince', loanId: 'loan-004' }),
      createMockEntry({ id: '5', actionType: 'delete', applicantName: 'Eve Wilson', loanId: 'loan-005' }),
      createMockEntry({ id: '6', actionType: 'create', applicantName: 'Alice Johnson', loanId: 'loan-006' })
    ]

    /**
     * Verifies filtering by single action type.
     * @test {filterAuditLog}
     */
    it('filters by single action type', () => {
      const filtered = filterAuditLog(testEntries, { actionTypes: ['create'] })

      expect(filtered).toHaveLength(2)
      expect(filtered.every(e => e.actionType === 'create')).toBe(true)
    })

    /**
     * Verifies filtering by multiple action types.
     * @test {filterAuditLog}
     */
    it('filters by multiple action types', () => {
      const filtered = filterAuditLog(testEntries, { actionTypes: ['approve', 'reject'] })

      expect(filtered).toHaveLength(2)
      expect(filtered.some(e => e.actionType === 'approve')).toBe(true)
      expect(filtered.some(e => e.actionType === 'reject')).toBe(true)
    })

    /**
     * Verifies text search on applicant name.
     * @test {filterAuditLog}
     */
    it('filters by search text on applicant name', () => {
      const filtered = filterAuditLog(testEntries, { searchText: 'alice' })

      expect(filtered).toHaveLength(2)
      expect(filtered.every(e => e.applicantName.toLowerCase().includes('alice'))).toBe(true)
    })

    /**
     * Verifies text search on loan ID.
     * @test {filterAuditLog}
     */
    it('filters by search text on loan ID', () => {
      const filtered = filterAuditLog(testEntries, { searchText: 'loan-003' })

      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.loanId).toBe('loan-003')
    })

    /**
     * Verifies text search on details.
     * @test {filterAuditLog}
     */
    it('filters by search text on details', () => {
      const filtered = filterAuditLog(testEntries, { searchText: 'high risk' })

      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.details).toContain('High risk')
    })

    /**
     * Verifies case-insensitive search.
     * @test {filterAuditLog}
     */
    it('search is case-insensitive', () => {
      const filtered = filterAuditLog(testEntries, { searchText: 'ALICE' })

      expect(filtered).toHaveLength(2)
    })

    /**
     * Verifies combined filter with action types and search text.
     * @test {filterAuditLog}
     */
    it('combines action type filter and search text', () => {
      const filtered = filterAuditLog(testEntries, { 
        actionTypes: ['create'], 
        searchText: 'smith' 
      })

      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.applicantName).toBe('Alice Smith')
    })

    /**
     * Verifies empty filter returns all entries.
     * @test {filterAuditLog}
     */
    it('returns all entries when no filter is applied', () => {
      const filtered = filterAuditLog(testEntries, {})

      expect(filtered).toHaveLength(6)
    })

    /**
     * Verifies empty action types array returns all entries.
     * @test {filterAuditLog}
     */
    it('returns all entries when action types is empty array', () => {
      const filtered = filterAuditLog(testEntries, { actionTypes: [] })

      expect(filtered).toHaveLength(6)
    })

    /**
     * Verifies whitespace-only search text is ignored.
     * @test {filterAuditLog}
     */
    it('ignores whitespace-only search text', () => {
      const filtered = filterAuditLog(testEntries, { searchText: '   ' })

      expect(filtered).toHaveLength(6)
    })

    /**
     * Verifies no matches returns empty array.
     * @test {filterAuditLog}
     */
    it('returns empty array when no matches', () => {
      const filtered = filterAuditLog(testEntries, { searchText: 'nonexistent' })

      expect(filtered).toHaveLength(0)
    })
  })

  /**
   * Tests for getMaxEntries() function.
   * Verifies it returns the expected limit.
   */
  describe('getMaxEntries', () => {
    /**
     * Verifies max entries constant is returned.
     * @test {getMaxEntries}
     */
    it('returns 500 as max entries', () => {
      expect(getMaxEntries()).toBe(500)
    })
  })

  /**
   * Tests for clearAuditLog() function.
   * Verifies audit log is cleared from localStorage.
   */
  describe('clearAuditLog', () => {
    /**
     * Verifies audit log is removed from localStorage.
     * @test {clearAuditLog}
     */
    it('clears audit log from localStorage', () => {
      // First create some entries
      createAuditLogEntry({
        actionType: 'create',
        loanId: 'loan-1',
        applicantName: 'Test User',
        previousStatus: null,
        newStatus: 'pending',
        details: 'Test'
      })

      expect(getAuditLog()).toHaveLength(1)

      clearAuditLog()

      expect(getAuditLog()).toHaveLength(0)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tredgate_audit_log')
    })
  })
})
