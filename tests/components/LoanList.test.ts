/**
 * @fileoverview Unit tests for the LoanList component.
 * Tests table rendering, data formatting, status badges,
 * action buttons visibility, and event emission.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanList from '../../src/components/LoanList.vue'
import type { LoanApplication } from '../../src/types/loan'
import * as loanService from '../../src/services/loanService'

/**
 * Mock the calculateMonthlyPayment function to isolate component tests.
 * Uses the same formula as the actual implementation.
 */
vi.mock('../../src/services/loanService', () => ({
  calculateMonthlyPayment: vi.fn((loan: LoanApplication) => {
    return (loan.amount * (1 + loan.interestRate)) / loan.termMonths
  })
}))

/**
 * Test suite for the LoanList component.
 * Covers rendering, formatting, status badges, actions, and events.
 */
describe('LoanList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Helper function to create mock loan data for testing.
   * @param overrides - Partial loan properties to override defaults
   * @returns Complete LoanApplication object
   */
  const createMockLoan = (overrides: Partial<LoanApplication> = {}): LoanApplication => ({
    id: 'test-id',
    applicantName: 'John Doe',
    amount: 50000,
    termMonths: 24,
    interestRate: 0.08,
    status: 'pending',
    createdAt: '2024-01-15T10:30:00.000Z',
    ...overrides
  })

  /**
   * Tests for component rendering.
   * Verifies table structure, headers, and empty state.
   */
  describe('rendering', () => {
    /**
     * Verifies the component title is displayed correctly.
     * @test {LoanList}
     */
    it('renders the component title', () => {
      const wrapper = mount(LoanList, {
        props: { loans: [] }
      })
      
      expect(wrapper.find('h2').text()).toBe('Loan Applications')
    })

    /**
     * Verifies empty state message is shown when no loans exist.
     * @test {LoanList}
     */
    it('shows empty state when no loans', () => {
      const wrapper = mount(LoanList, {
        props: { loans: [] }
      })
      
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state').text()).toContain('No loan applications yet')
    })

    /**
     * Verifies empty state is hidden when loans exist.
     * @test {LoanList}
     */
    it('does not show empty state when loans exist', () => {
      const wrapper = mount(LoanList, {
        props: { loans: [createMockLoan()] }
      })
      
      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })

    /**
     * Verifies table headers match expected column names.
     * @test {LoanList}
     */
    it('renders table with correct headers', () => {
      const wrapper = mount(LoanList, {
        props: { loans: [createMockLoan()] }
      })
      
      const headers = wrapper.findAll('th')
      const headerTexts = headers.map(h => h.text())
      
      expect(headerTexts).toContain('Applicant')
      expect(headerTexts).toContain('Amount')
      expect(headerTexts).toContain('Term')
      expect(headerTexts).toContain('Rate')
      expect(headerTexts).toContain('Monthly Payment')
      expect(headerTexts).toContain('Status')
      expect(headerTexts).toContain('Created')
      expect(headerTexts).toContain('Actions')
    })

    /**
     * Verifies loan data is rendered correctly in table rows.
     * @test {LoanList}
     */
    it('renders loan data in table rows', () => {
      const loan = createMockLoan()
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      const row = wrapper.find('tbody tr')
      expect(row.text()).toContain('John Doe')
      expect(row.text()).toContain('$50,000.00')
      expect(row.text()).toContain('24 mo')
      expect(row.text()).toContain('8.0%')
      expect(row.text()).toContain('pending')
    })

    /**
     * Verifies multiple loans are rendered as separate table rows.
     * @test {LoanList}
     */
    it('renders multiple loans correctly', () => {
      const loans = [
        createMockLoan({ id: '1', applicantName: 'Alice' }),
        createMockLoan({ id: '2', applicantName: 'Bob' }),
        createMockLoan({ id: '3', applicantName: 'Charlie' })
      ]
      const wrapper = mount(LoanList, {
        props: { loans }
      })
      
      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBe(3)
    })
  })

  /**
   * Tests for data formatting functions.
   * Verifies currency, percentage, and date formatting.
   */
  describe('formatting functions', () => {
    /**
     * Verifies currency amounts are formatted with $ symbol and commas.
     * @test {LoanList}
     */
    it('formats currency correctly', () => {
      const loan = createMockLoan({ amount: 123456.78 })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      expect(wrapper.text()).toContain('$123,456.78')
    })

    /**
     * Verifies interest rate is formatted as percentage with % symbol.
     * @test {LoanList}
     */
    it('formats percentage correctly', () => {
      const loan = createMockLoan({ interestRate: 0.125 })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      expect(wrapper.text()).toContain('12.5%')
    })

    /**
     * Verifies dates are formatted in readable format (Month DD, YYYY).
     * @test {LoanList}
     */
    it('formats date correctly', () => {
      const loan = createMockLoan({ createdAt: '2024-03-15T10:30:00.000Z' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      // Date format should include Mar 15, 2024
      expect(wrapper.text()).toContain('Mar')
      expect(wrapper.text()).toContain('15')
      expect(wrapper.text()).toContain('2024')
    })

    /**
     * Verifies calculateMonthlyPayment is called for each loan.
     * @test {LoanList}
     */
    it('calls calculateMonthlyPayment for each loan', () => {
      const loans = [
        createMockLoan({ id: '1' }),
        createMockLoan({ id: '2' })
      ]
      mount(LoanList, {
        props: { loans }
      })
      
      expect(loanService.calculateMonthlyPayment).toHaveBeenCalledTimes(2)
    })
  })

  /**
   * Tests for status badge rendering.
   * Verifies correct CSS classes and text for each status.
   */
  describe('status badges', () => {
    /**
     * Verifies pending status badge has correct class and text.
     * @test {LoanList}
     */
    it('shows pending status badge', () => {
      const loan = createMockLoan({ status: 'pending' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      const badge = wrapper.find('.status-badge')
      expect(badge.classes()).toContain('status-pending')
      expect(badge.text()).toBe('pending')
    })

    /**
     * Verifies approved status badge has correct class and text.
     * @test {LoanList}
     */
    it('shows approved status badge', () => {
      const loan = createMockLoan({ status: 'approved' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      const badge = wrapper.find('.status-badge')
      expect(badge.classes()).toContain('status-approved')
      expect(badge.text()).toBe('approved')
    })

    /**
     * Verifies rejected status badge has correct class and text.
     * @test {LoanList}
     */
    it('shows rejected status badge', () => {
      const loan = createMockLoan({ status: 'rejected' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      const badge = wrapper.find('.status-badge')
      expect(badge.classes()).toContain('status-rejected')
      expect(badge.text()).toBe('rejected')
    })
  })

  /**
   * Tests for action buttons visibility.
   * Verifies buttons are shown/hidden based on loan status.
   */
  describe('action buttons', () => {
    /**
     * Verifies all action buttons are visible for pending loans.
     * @test {LoanList}
     */
    it('shows all action buttons for pending loan', () => {
      const loan = createMockLoan({ status: 'pending' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      expect(wrapper.find('.action-btn.success').exists()).toBe(true)
      expect(wrapper.find('.action-btn.danger').exists()).toBe(true)
      expect(wrapper.find('.action-btn.secondary').exists()).toBe(true)
    })

    /**
     * Verifies action buttons are hidden for approved loans.
     * Shows 'no actions' placeholder instead.
     * @test {LoanList}
     */
    it('hides action buttons for approved loan', () => {
      const loan = createMockLoan({ status: 'approved' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      expect(wrapper.find('.action-btn.success').exists()).toBe(false)
      expect(wrapper.find('.action-btn.danger').exists()).toBe(false)
      expect(wrapper.find('.action-btn.secondary').exists()).toBe(false)
      expect(wrapper.find('.no-actions').exists()).toBe(true)
    })

    /**
     * Verifies action buttons are hidden for rejected loans.
     * Shows 'no actions' placeholder instead.
     * @test {LoanList}
     */
    it('hides action buttons for rejected loan', () => {
      const loan = createMockLoan({ status: 'rejected' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      expect(wrapper.find('.action-btn.success').exists()).toBe(false)
      expect(wrapper.find('.action-btn.danger').exists()).toBe(false)
      expect(wrapper.find('.action-btn.secondary').exists()).toBe(false)
      expect(wrapper.find('.no-actions').exists()).toBe(true)
    })
  })

  /**
   * Tests for event emission.
   * Verifies correct events are emitted when buttons are clicked.
   */
  describe('events', () => {
    /**
     * Verifies 'approve' event is emitted with loan ID when approve button clicked.
     * @test {LoanList}
     */
    it('emits approve event when approve button clicked', async () => {
      const loan = createMockLoan({ id: 'loan-123' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      await wrapper.find('.action-btn.success').trigger('click')
      
      expect(wrapper.emitted('approve')).toBeTruthy()
      expect(wrapper.emitted('approve')?.[0]).toEqual(['loan-123'])
    })

    /**
     * Verifies 'reject' event is emitted with loan ID when reject button clicked.
     * @test {LoanList}
     */
    it('emits reject event when reject button clicked', async () => {
      const loan = createMockLoan({ id: 'loan-456' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      await wrapper.find('.action-btn.danger').trigger('click')
      
      expect(wrapper.emitted('reject')).toBeTruthy()
      expect(wrapper.emitted('reject')?.[0]).toEqual(['loan-456'])
    })

    /**
     * Verifies 'autoDecide' event is emitted with loan ID when auto-decide button clicked.
     * @test {LoanList}
     */
    it('emits autoDecide event when auto-decide button clicked', async () => {
      const loan = createMockLoan({ id: 'loan-789' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      await wrapper.find('.action-btn.secondary').trigger('click')
      
      expect(wrapper.emitted('autoDecide')).toBeTruthy()
      expect(wrapper.emitted('autoDecide')?.[0]).toEqual(['loan-789'])
    })
  })
})
