import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import type { LoanApplication } from '../src/types/loan'

// Mock loanService
vi.mock('../src/services/loanService', () => ({
  getLoans: vi.fn(() => []),
  updateLoanStatus: vi.fn(),
  autoDecideLoan: vi.fn(),
  calculateMonthlyPayment: vi.fn(() => 1000),
  createLoanApplication: vi.fn()
}))

import * as loanService from '../src/services/loanService'

describe('App', () => {
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
    it('renders the app header', () => {
      const wrapper = mount(App)
      
      expect(wrapper.find('.app-header').exists()).toBe(true)
      expect(wrapper.find('h1').text()).toBe('Tredgate Loan')
      expect(wrapper.find('.tagline').text()).toBe('Simple loan application management')
    })

    it('renders the logo', () => {
      const wrapper = mount(App)
      
      const logo = wrapper.find('.logo')
      expect(logo.exists()).toBe(true)
      expect(logo.attributes('alt')).toBe('Tredgate Logo')
    })

    it('renders LoanSummary component', () => {
      const wrapper = mount(App)
      
      expect(wrapper.findComponent({ name: 'LoanSummary' }).exists()).toBe(true)
    })

    it('renders LoanForm component', () => {
      const wrapper = mount(App)
      
      expect(wrapper.findComponent({ name: 'LoanForm' }).exists()).toBe(true)
    })

    it('renders LoanList component', () => {
      const wrapper = mount(App)
      
      expect(wrapper.findComponent({ name: 'LoanList' }).exists()).toBe(true)
    })
  })

  describe('initial data loading', () => {
    it('calls getLoans on mount', () => {
      mount(App)
      
      expect(loanService.getLoans).toHaveBeenCalled()
    })

    it('passes loans to child components', async () => {
      const mockLoans = [createMockLoan()]
      vi.mocked(loanService.getLoans).mockReturnValue(mockLoans)
      
      const wrapper = mount(App)
      await flushPromises()
      
      const loanSummary = wrapper.findComponent({ name: 'LoanSummary' })
      const loanList = wrapper.findComponent({ name: 'LoanList' })
      
      expect(loanSummary.props('loans')).toEqual(mockLoans)
      expect(loanList.props('loans')).toEqual(mockLoans)
    })
  })

  describe('loan creation', () => {
    it('refreshes loans when LoanForm emits created event', async () => {
      const wrapper = mount(App)
      
      vi.mocked(loanService.getLoans).mockClear()
      
      const loanForm = wrapper.findComponent({ name: 'LoanForm' })
      await loanForm.vm.$emit('created')
      
      expect(loanService.getLoans).toHaveBeenCalled()
    })
  })

  describe('loan approval', () => {
    it('calls updateLoanStatus with approved status', async () => {
      const mockLoans = [createMockLoan({ id: 'loan-123' })]
      vi.mocked(loanService.getLoans).mockReturnValue(mockLoans)
      
      const wrapper = mount(App)
      const loanList = wrapper.findComponent({ name: 'LoanList' })
      
      await loanList.vm.$emit('approve', 'loan-123')
      
      expect(loanService.updateLoanStatus).toHaveBeenCalledWith('loan-123', 'approved')
    })

    it('refreshes loans after approval', async () => {
      const mockLoans = [createMockLoan()]
      vi.mocked(loanService.getLoans).mockReturnValue(mockLoans)
      
      const wrapper = mount(App)
      vi.mocked(loanService.getLoans).mockClear()
      
      const loanList = wrapper.findComponent({ name: 'LoanList' })
      await loanList.vm.$emit('approve', 'test-id')
      
      expect(loanService.getLoans).toHaveBeenCalled()
    })
  })

  describe('loan rejection', () => {
    it('calls updateLoanStatus with rejected status', async () => {
      const mockLoans = [createMockLoan({ id: 'loan-456' })]
      vi.mocked(loanService.getLoans).mockReturnValue(mockLoans)
      
      const wrapper = mount(App)
      const loanList = wrapper.findComponent({ name: 'LoanList' })
      
      await loanList.vm.$emit('reject', 'loan-456')
      
      expect(loanService.updateLoanStatus).toHaveBeenCalledWith('loan-456', 'rejected')
    })

    it('refreshes loans after rejection', async () => {
      const mockLoans = [createMockLoan()]
      vi.mocked(loanService.getLoans).mockReturnValue(mockLoans)
      
      const wrapper = mount(App)
      vi.mocked(loanService.getLoans).mockClear()
      
      const loanList = wrapper.findComponent({ name: 'LoanList' })
      await loanList.vm.$emit('reject', 'test-id')
      
      expect(loanService.getLoans).toHaveBeenCalled()
    })
  })

  describe('auto-decide', () => {
    it('calls autoDecideLoan with loan id', async () => {
      const mockLoans = [createMockLoan({ id: 'loan-789' })]
      vi.mocked(loanService.getLoans).mockReturnValue(mockLoans)
      
      const wrapper = mount(App)
      const loanList = wrapper.findComponent({ name: 'LoanList' })
      
      await loanList.vm.$emit('auto-decide', 'loan-789')
      
      expect(loanService.autoDecideLoan).toHaveBeenCalledWith('loan-789')
    })

    it('refreshes loans after auto-decide', async () => {
      const mockLoans = [createMockLoan()]
      vi.mocked(loanService.getLoans).mockReturnValue(mockLoans)
      
      const wrapper = mount(App)
      vi.mocked(loanService.getLoans).mockClear()
      
      const loanList = wrapper.findComponent({ name: 'LoanList' })
      await loanList.vm.$emit('auto-decide', 'test-id')
      
      expect(loanService.getLoans).toHaveBeenCalled()
    })
  })

  describe('data flow', () => {
    it('updates LoanSummary when loans change', async () => {
      const initialLoans: LoanApplication[] = []
      vi.mocked(loanService.getLoans).mockReturnValue(initialLoans)
      
      const wrapper = mount(App)
      
      // Simulate adding a loan
      const newLoans = [createMockLoan()]
      vi.mocked(loanService.getLoans).mockReturnValue(newLoans)
      
      const loanForm = wrapper.findComponent({ name: 'LoanForm' })
      await loanForm.vm.$emit('created')
      await flushPromises()
      
      const loanSummary = wrapper.findComponent({ name: 'LoanSummary' })
      expect(loanSummary.props('loans')).toEqual(newLoans)
    })

    it('updates LoanList when loans change', async () => {
      const initialLoans: LoanApplication[] = []
      vi.mocked(loanService.getLoans).mockReturnValue(initialLoans)
      
      const wrapper = mount(App)
      
      // Simulate adding a loan
      const newLoans = [createMockLoan()]
      vi.mocked(loanService.getLoans).mockReturnValue(newLoans)
      
      const loanForm = wrapper.findComponent({ name: 'LoanForm' })
      await loanForm.vm.$emit('created')
      await flushPromises()
      
      const loanList = wrapper.findComponent({ name: 'LoanList' })
      expect(loanList.props('loans')).toEqual(newLoans)
    })
  })
})
