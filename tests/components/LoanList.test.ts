import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanList from '../../src/components/LoanList.vue'
import type { LoanApplication } from '../../src/types/loan'
import * as loanService from '../../src/services/loanService'

// Mock the calculateMonthlyPayment function
vi.mock('../../src/services/loanService', () => ({
  calculateMonthlyPayment: vi.fn((loan: LoanApplication) => {
    return (loan.amount * (1 + loan.interestRate)) / loan.termMonths
  })
}))

describe('LoanList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  describe('rendering', () => {
    it('renders the component title', () => {
      const wrapper = mount(LoanList, {
        props: { loans: [] }
      })
      
      expect(wrapper.find('h2').text()).toBe('Loan Applications')
    })

    it('shows empty state when no loans', () => {
      const wrapper = mount(LoanList, {
        props: { loans: [] }
      })
      
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state').text()).toContain('No loan applications yet')
    })

    it('does not show empty state when loans exist', () => {
      const wrapper = mount(LoanList, {
        props: { loans: [createMockLoan()] }
      })
      
      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })

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

  describe('formatting functions', () => {
    it('formats currency correctly', () => {
      const loan = createMockLoan({ amount: 123456.78 })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      expect(wrapper.text()).toContain('$123,456.78')
    })

    it('formats percentage correctly', () => {
      const loan = createMockLoan({ interestRate: 0.125 })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      expect(wrapper.text()).toContain('12.5%')
    })

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

  describe('status badges', () => {
    it('shows pending status badge', () => {
      const loan = createMockLoan({ status: 'pending' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      const badge = wrapper.find('.status-badge')
      expect(badge.classes()).toContain('status-pending')
      expect(badge.text()).toBe('pending')
    })

    it('shows approved status badge', () => {
      const loan = createMockLoan({ status: 'approved' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      const badge = wrapper.find('.status-badge')
      expect(badge.classes()).toContain('status-approved')
      expect(badge.text()).toBe('approved')
    })

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

  describe('action buttons', () => {
    it('shows all action buttons for pending loan', () => {
      const loan = createMockLoan({ status: 'pending' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      expect(wrapper.find('.action-btn.success').exists()).toBe(true)
      expect(wrapper.find('.action-btn.danger').exists()).toBe(true)
      expect(wrapper.find('.action-btn.secondary').exists()).toBe(true)
    })

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

  describe('events', () => {
    it('emits approve event when approve button clicked', async () => {
      const loan = createMockLoan({ id: 'loan-123' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      await wrapper.find('.action-btn.success').trigger('click')
      
      expect(wrapper.emitted('approve')).toBeTruthy()
      expect(wrapper.emitted('approve')?.[0]).toEqual(['loan-123'])
    })

    it('emits reject event when reject button clicked', async () => {
      const loan = createMockLoan({ id: 'loan-456' })
      const wrapper = mount(LoanList, {
        props: { loans: [loan] }
      })
      
      await wrapper.find('.action-btn.danger').trigger('click')
      
      expect(wrapper.emitted('reject')).toBeTruthy()
      expect(wrapper.emitted('reject')?.[0]).toEqual(['loan-456'])
    })

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
