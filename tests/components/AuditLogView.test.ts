/**
 * @fileoverview Unit tests for the AuditLogView component.
 * Tests rendering, filtering, searching, and event handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AuditLogView from '../../src/components/AuditLogView.vue'
import type { AuditLogEntry } from '../../src/types/auditLog'
import * as auditLogService from '../../src/services/auditLogService'

/**
 * Mock the auditLogService module to isolate component tests.
 */
vi.mock('../../src/services/auditLogService', () => ({
  getAuditLog: vi.fn(() => []),
  filterAuditLog: vi.fn((entries) => entries),
  getMaxEntries: vi.fn(() => 500),
  clearAuditLog: vi.fn()
}))

/**
 * Test suite for the AuditLogView component.
 * Covers rendering, filtering, searching, and empty states.
 */
describe('AuditLogView', () => {
  beforeEach(() => {
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
   * Tests for component rendering.
   * Verifies header, filters, and table structure.
   */
  describe('rendering', () => {
    /**
     * Verifies the component title is displayed correctly.
     * @test {AuditLogView}
     */
    it('renders the component title', () => {
      const wrapper = mount(AuditLogView)
      
      expect(wrapper.find('h2').text()).toBe('Audit Log')
    })

    /**
     * Verifies entry count is displayed.
     * @test {AuditLogView}
     */
    it('shows entry count', async () => {
      const entries = [createMockEntry(), createMockEntry({ id: '2' })]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.entry-count').text()).toContain('2 of 2 entries')
    })

    /**
     * Verifies max entries is displayed.
     * @test {AuditLogView}
     */
    it('shows max entries limit', () => {
      const wrapper = mount(AuditLogView)
      
      expect(wrapper.find('.entry-count').text()).toContain('max 500')
    })

    /**
     * Verifies empty state message is shown when no entries exist.
     * @test {AuditLogView}
     */
    it('shows empty state when no entries', () => {
      vi.mocked(auditLogService.getAuditLog).mockReturnValue([])
      
      const wrapper = mount(AuditLogView)
      
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state').text()).toContain('No audit log entries yet')
    })

    /**
     * Verifies table is rendered when entries exist.
     * @test {AuditLogView}
     */
    it('renders table when entries exist', async () => {
      const entries = [createMockEntry()]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('table').exists()).toBe(true)
    })

    /**
     * Verifies table headers match expected column names.
     * @test {AuditLogView}
     */
    it('renders table with correct headers', async () => {
      const entries = [createMockEntry()]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const headers = wrapper.findAll('th')
      const headerTexts = headers.map(h => h.text())
      
      expect(headerTexts).toContain('Timestamp')
      expect(headerTexts).toContain('Action')
      expect(headerTexts).toContain('Applicant')
      expect(headerTexts).toContain('Status Change')
      expect(headerTexts).toContain('Details')
    })

    /**
     * Verifies entry data is rendered correctly in table rows.
     * @test {AuditLogView}
     */
    it('renders entry data in table rows', async () => {
      const entries = [createMockEntry({
        applicantName: 'Jane Doe',
        details: 'Created new loan'
      })]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const row = wrapper.find('tbody tr')
      expect(row.text()).toContain('Jane Doe')
      expect(row.text()).toContain('Created new loan')
    })
  })

  /**
   * Tests for action type badges.
   * Verifies correct styling for each action type.
   */
  describe('action type badges', () => {
    /**
     * Verifies create action badge is rendered correctly.
     * @test {AuditLogView}
     */
    it('shows create action badge', async () => {
      const entries = [createMockEntry({ actionType: 'create' })]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const badge = wrapper.find('.action-badge.action-create')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Create')
    })

    /**
     * Verifies approve action badge is rendered correctly.
     * @test {AuditLogView}
     */
    it('shows approve action badge', async () => {
      const entries = [createMockEntry({ actionType: 'approve' })]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const badge = wrapper.find('.action-badge.action-approve')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Approve')
    })

    /**
     * Verifies reject action badge is rendered correctly.
     * @test {AuditLogView}
     */
    it('shows reject action badge', async () => {
      const entries = [createMockEntry({ actionType: 'reject' })]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const badge = wrapper.find('.action-badge.action-reject')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Reject')
    })

    /**
     * Verifies auto-decide action badge is rendered correctly.
     * @test {AuditLogView}
     */
    it('shows auto-decide action badge', async () => {
      const entries = [createMockEntry({ actionType: 'auto-decide' })]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const badge = wrapper.find('.action-badge.action-auto-decide')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Auto-decide')
    })

    /**
     * Verifies delete action badge is rendered correctly.
     * @test {AuditLogView}
     */
    it('shows delete action badge', async () => {
      const entries = [createMockEntry({ actionType: 'delete' })]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const badge = wrapper.find('.action-badge.action-delete')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Delete')
    })
  })

  /**
   * Tests for status change display.
   * Verifies correct rendering of status transitions.
   */
  describe('status change display', () => {
    /**
     * Verifies status change from pending to approved is displayed.
     * @test {AuditLogView}
     */
    it('shows status change with badges', async () => {
      const entries = [createMockEntry({ 
        previousStatus: 'pending', 
        newStatus: 'approved' 
      })]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const statusCell = wrapper.find('.status-change-cell')
      expect(statusCell.find('.status-pending').text()).toBe('pending')
      expect(statusCell.find('.status-approved').text()).toBe('approved')
    })

    /**
     * Verifies null previous status is displayed as dash.
     * @test {AuditLogView}
     */
    it('shows dash for null previous status', async () => {
      const entries = [createMockEntry({ 
        previousStatus: null, 
        newStatus: 'pending' 
      })]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const statusCell = wrapper.find('.status-change-cell')
      expect(statusCell.findAll('.status-none').length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Verifies null new status is displayed as dash (for delete).
     * @test {AuditLogView}
     */
    it('shows dash for null new status (delete)', async () => {
      const entries = [createMockEntry({ 
        previousStatus: 'pending', 
        newStatus: null,
        actionType: 'delete'
      })]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const statusCell = wrapper.find('.status-change-cell')
      expect(statusCell.find('.status-pending').text()).toBe('pending')
      expect(statusCell.findAll('.status-none').length).toBeGreaterThanOrEqual(1)
    })
  })

  /**
   * Tests for filter controls.
   * Verifies filter inputs and behavior.
   */
  describe('filter controls', () => {
    /**
     * Verifies search input is rendered.
     * @test {AuditLogView}
     */
    it('renders search input', () => {
      const wrapper = mount(AuditLogView)
      
      expect(wrapper.find('.search-input').exists()).toBe(true)
    })

    /**
     * Verifies action type checkboxes are rendered.
     * @test {AuditLogView}
     */
    it('renders action type filter checkboxes', () => {
      const wrapper = mount(AuditLogView)
      
      const checkboxes = wrapper.findAll('.action-checkbox')
      expect(checkboxes.length).toBe(5) // create, approve, reject, auto-decide, delete
    })

    /**
     * Verifies clear filters button is hidden when no filters active.
     * @test {AuditLogView}
     */
    it('hides clear button when no filters active', () => {
      const wrapper = mount(AuditLogView)
      
      expect(wrapper.find('.clear-btn').exists()).toBe(false)
    })

    /**
     * Verifies clear filters button appears when search text is entered.
     * @test {AuditLogView}
     */
    it('shows clear button when search text entered', async () => {
      const wrapper = mount(AuditLogView)
      
      await wrapper.find('.search-input').setValue('test')
      
      expect(wrapper.find('.clear-btn').exists()).toBe(true)
    })

    /**
     * Verifies clear filters button clears search text.
     * @test {AuditLogView}
     */
    it('clears search text when clear button clicked', async () => {
      const wrapper = mount(AuditLogView)
      
      await wrapper.find('.search-input').setValue('test')
      await wrapper.find('.clear-btn').trigger('click')
      
      expect((wrapper.find('.search-input').element as HTMLInputElement).value).toBe('')
    })

    /**
     * Verifies action type checkbox toggles filter.
     * @test {AuditLogView}
     */
    it('toggles action type filter on checkbox click', async () => {
      const entries = [createMockEntry()]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const checkbox = wrapper.findAll('.action-checkbox input')[0]
      await checkbox?.trigger('change')
      
      // Clear button should now appear since filter is active
      expect(wrapper.find('.clear-btn').exists()).toBe(true)
    })
  })

  /**
   * Tests for no results state.
   * Verifies empty state when filters return no matches.
   */
  describe('no results state', () => {
    /**
     * Verifies no results message is shown when filter returns empty.
     * @test {AuditLogView}
     */
    it('shows no results message when filters return empty', async () => {
      const entries = [createMockEntry()]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockReturnValue([])
      
      const wrapper = mount(AuditLogView)
      
      // Trigger a filter to update computed
      await wrapper.find('.search-input').setValue('nonexistent')
      
      expect(wrapper.find('.empty-state').text()).toContain('No entries match your current filters')
    })
  })

  /**
   * Tests for data loading.
   * Verifies entries are loaded on mount.
   */
  describe('data loading', () => {
    /**
     * Verifies getAuditLog is called on mount.
     * @test {AuditLogView}
     */
    it('calls getAuditLog on mount', () => {
      mount(AuditLogView)
      
      expect(auditLogService.getAuditLog).toHaveBeenCalled()
    })
  })

  /**
   * Tests for entries order.
   * Verifies entries are displayed in reverse chronological order.
   */
  describe('entries order', () => {
    /**
     * Verifies entries are displayed newest first.
     * @test {AuditLogView}
     */
    it('displays entries newest first', async () => {
      const entries = [
        createMockEntry({ id: '1', timestamp: '2024-01-01T10:00:00.000Z', applicantName: 'First' }),
        createMockEntry({ id: '2', timestamp: '2024-01-02T10:00:00.000Z', applicantName: 'Second' }),
        createMockEntry({ id: '3', timestamp: '2024-01-03T10:00:00.000Z', applicantName: 'Third' })
      ]
      vi.mocked(auditLogService.getAuditLog).mockReturnValue(entries)
      vi.mocked(auditLogService.filterAuditLog).mockImplementation((e) => e)
      
      const wrapper = mount(AuditLogView)
      await wrapper.vm.$nextTick()
      
      const rows = wrapper.findAll('tbody tr')
      expect(rows[0]?.text()).toContain('Third')
      expect(rows[1]?.text()).toContain('Second')
      expect(rows[2]?.text()).toContain('First')
    })
  })
})
