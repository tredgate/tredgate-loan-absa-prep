/**
 * @fileoverview Unit tests for the main App component.
 * Tests component rendering, child component integration, event handling,
 * and data flow between components.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import type { LoanApplication } from '../src/types/loan'

/**
 * Mock loanService module to isolate App component tests.
 * All service functions are mocked with default implementations.
 */
vi.mock('../src/services/loanService', () => ({
  getLoans: vi.fn(() => []),
  updateLoanStatus: vi.fn(),
  autoDecideLoan: vi.fn(),
  calculateMonthlyPayment: vi.fn(() => 1000),
  createLoanApplication: vi.fn()
}))

import * as loanService from '../src/services/loanService'

/**
 * Test suite for the main App component.
 * Covers rendering, data loading, event handling, and component integration.
 */
describe('App', () => {
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
   * Verifies all UI elements and child components are properly rendered.
   */
  describe('rendering', () => {
    /**
     * Verifies the app header contains title and tagline.
     * @test {App}
     */
    it('renders the app header', () => {
      const wrapper = mount(App)
      
      expect(wrapper.find('.app-header').exists()).toBe(true)
      expect(wrapper.find('h1').text()).toBe('Tredgate Loan')
      expect(wrapper.find('.tagline').text()).toBe('Simple loan application management')
    })

    /**
     * Verifies the Tredgate logo is rendered with correct alt text.
     * @test {App}
     */
    it('renders the logo', () => {
      const wrapper = mount(App)
      
      const logo = wrapper.find('.logo')
      expect(logo.exists()).toBe(true)
      expect(logo.attributes('alt')).toBe('Tredgate Logo')
    })

    /**
     * Verifies LoanSummary child component is rendered.
     * @test {App}
     */
    it('renders LoanSummary component', () => {
      const wrapper = mount(App)
      
      expect(wrapper.findComponent({ name: 'LoanSummary' }).exists()).toBe(true)
    })

    /**
     * Verifies LoanForm child component is rendered.
     * @test {App}
     */
    it('renders LoanForm component', () => {
      const wrapper = mount(App)
      
      expect(wrapper.findComponent({ name: 'LoanForm' }).exists()).toBe(true)
    })

    /**
     * Verifies LoanList child component is rendered.
     * @test {App}
     */
    it('renders LoanList component', () => {
      const wrapper = mount(App)
      
      expect(wrapper.findComponent({ name: 'LoanList' }).exists()).toBe(true)
    })
  })

  /**
   * Tests for initial data loading on component mount.
   * Verifies loans are fetched and passed to child components.
   */
  describe('initial data loading', () => {
    /**
     * Verifies getLoans is called when component mounts.
     * @test {App}
     */
    it('calls getLoans on mount', () => {
      mount(App)
      
      expect(loanService.getLoans).toHaveBeenCalled()
    })

    /**
     * Verifies loaded loans are passed as props to child components.
     * @test {App}
     */
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

  /**
   * Tests for loan creation event handling.
   * Verifies App responds correctly to LoanForm 'created' event.
   */
  describe('loan creation', () => {
    /**
     * Verifies loans list is refreshed when LoanForm emits 'created' event.
     * @test {App}
     */
    it('refreshes loans when LoanForm emits created event', async () => {
      const wrapper = mount(App)
      
      vi.mocked(loanService.getLoans).mockClear()
      
      const loanForm = wrapper.findComponent({ name: 'LoanForm' })
      await loanForm.vm.$emit('created')
      
      expect(loanService.getLoans).toHaveBeenCalled()
    })
  })

  /**
   * Tests for loan approval event handling.
   * Verifies App correctly handles LoanList 'approve' event.
   */
  describe('loan approval', () => {
    /**
     * Verifies updateLoanStatus is called with 'approved' status.
     * @test {App}
     */
    it('calls updateLoanStatus with approved status', async () => {
      const mockLoans = [createMockLoan({ id: 'loan-123' })]
      vi.mocked(loanService.getLoans).mockReturnValue(mockLoans)
      
      const wrapper = mount(App)
      const loanList = wrapper.findComponent({ name: 'LoanList' })
      
      await loanList.vm.$emit('approve', 'loan-123')
      
      expect(loanService.updateLoanStatus).toHaveBeenCalledWith('loan-123', 'approved')
    })

    /**
     * Verifies loans list is refreshed after loan approval.
     * @test {App}
     */
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

  /**
   * Tests for loan rejection event handling.
   * Verifies App correctly handles LoanList 'reject' event.
   */
  describe('loan rejection', () => {
    /**
     * Verifies updateLoanStatus is called with 'rejected' status.
     * @test {App}
     */
    it('calls updateLoanStatus with rejected status', async () => {
      const mockLoans = [createMockLoan({ id: 'loan-456' })]
      vi.mocked(loanService.getLoans).mockReturnValue(mockLoans)
      
      const wrapper = mount(App)
      const loanList = wrapper.findComponent({ name: 'LoanList' })
      
      await loanList.vm.$emit('reject', 'loan-456')
      
      expect(loanService.updateLoanStatus).toHaveBeenCalledWith('loan-456', 'rejected')
    })

    /**
     * Verifies loans list is refreshed after loan rejection.
     * @test {App}
     */
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

  /**
   * Tests for auto-decide event handling.
   * Verifies App correctly handles LoanList 'auto-decide' event.
   */
  describe('auto-decide', () => {
    /**
     * Verifies autoDecideLoan is called with correct loan ID.
     * @test {App}
     */
    it('calls autoDecideLoan with loan id', async () => {
      const mockLoans = [createMockLoan({ id: 'loan-789' })]
      vi.mocked(loanService.getLoans).mockReturnValue(mockLoans)
      
      const wrapper = mount(App)
      const loanList = wrapper.findComponent({ name: 'LoanList' })
      
      await loanList.vm.$emit('auto-decide', 'loan-789')
      
      expect(loanService.autoDecideLoan).toHaveBeenCalledWith('loan-789')
    })

    /**
     * Verifies loans list is refreshed after auto-decide action.
     * @test {App}
     */
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

  /**
   * Tests for data flow between components.
   * Verifies props are updated when loans change.
   */
  describe('data flow', () => {
    /**
     * Verifies LoanSummary receives updated loans after creation.
     * @test {App}
     */
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

    /**
     * Verifies LoanList receives updated loans after creation.
     * @test {App}
     */
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
