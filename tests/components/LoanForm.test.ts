/**
 * @fileoverview Unit tests for the LoanForm component.
 * Tests form rendering, input validation, form submission,
 * and error handling.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanForm from '../../src/components/LoanForm.vue'
import * as loanService from '../../src/services/loanService'

/**
 * Mock loanService module to isolate component tests.
 */
vi.mock('../../src/services/loanService', () => ({
  createLoanApplication: vi.fn()
}))

/**
 * Test suite for the LoanForm component.
 * Covers form rendering, validation, submission, and error scenarios.
 */
describe('LoanForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Tests for component rendering.
   * Verifies all form elements are properly displayed.
   */
  describe('rendering', () => {
    /**
     * Verifies all required form inputs and submit button are rendered.
     * @test {LoanForm}
     */
    it('renders form with all required inputs', () => {
      const wrapper = mount(LoanForm)
      
      expect(wrapper.find('h2').text()).toBe('New Loan Application')
      expect(wrapper.find('#applicantName').exists()).toBe(true)
      expect(wrapper.find('#amount').exists()).toBe(true)
      expect(wrapper.find('#termMonths').exists()).toBe(true)
      expect(wrapper.find('#interestRate').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    /**
     * Verifies error message is not shown on initial render.
     * @test {LoanForm}
     */
    it('does not show error message initially', () => {
      const wrapper = mount(LoanForm)
      
      expect(wrapper.find('.error-message').exists()).toBe(false)
    })
  })

  /**
   * Tests for form validation.
   * Verifies appropriate error messages for invalid inputs.
   */
  describe('validation', () => {
    /**
     * Verifies error message when applicant name is empty on submit.
     * @test {LoanForm}
     */
    it('shows error when applicant name is empty', async () => {
      const wrapper = mount(LoanForm)
      
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.find('.error-message').text()).toBe('Applicant name is required')
    })

    /**
     * Verifies error message when loan amount is empty or zero.
     * @test {LoanForm}
     */
    it('shows error when amount is empty or zero', async () => {
      const wrapper = mount(LoanForm)
      
      await wrapper.find('#applicantName').setValue('John Doe')
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.find('.error-message').text()).toBe('Amount must be greater than 0')
    })

    /**
     * Verifies error message when term months is empty or zero.
     * @test {LoanForm}
     */
    it('shows error when termMonths is empty or zero', async () => {
      const wrapper = mount(LoanForm)
      
      await wrapper.find('#applicantName').setValue('John Doe')
      await wrapper.find('#amount').setValue(10000)
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.find('.error-message').text()).toBe('Term months must be greater than 0')
    })

    /**
     * Verifies error message when interest rate is negative.
     * @test {LoanForm}
     */
    it('shows error when interest rate is negative', async () => {
      const wrapper = mount(LoanForm)
      
      await wrapper.find('#applicantName').setValue('John Doe')
      await wrapper.find('#amount').setValue(10000)
      await wrapper.find('#termMonths').setValue(12)
      await wrapper.find('#interestRate').setValue(-0.05)
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.find('.error-message').text()).toBe('Interest rate is required and cannot be negative')
    })
  })

  /**
   * Tests for form submission.
   * Verifies service calls, events, and form reset behavior.
   */
  describe('form submission', () => {
    /**
     * Verifies createLoanApplication is called with correct form data.
     * @test {LoanForm}
     */
    it('calls createLoanApplication with correct data', async () => {
      const wrapper = mount(LoanForm)
      
      await wrapper.find('#applicantName').setValue('John Doe')
      await wrapper.find('#amount').setValue(50000)
      await wrapper.find('#termMonths').setValue(24)
      await wrapper.find('#interestRate').setValue(0.08)
      await wrapper.find('form').trigger('submit')
      
      expect(loanService.createLoanApplication).toHaveBeenCalledWith({
        applicantName: 'John Doe',
        amount: 50000,
        termMonths: 24,
        interestRate: 0.08
      })
    })

    /**
     * Verifies 'created' event is emitted after successful submission.
     * @test {LoanForm}
     */
    it('emits created event after successful submission', async () => {
      const wrapper = mount(LoanForm)
      
      await wrapper.find('#applicantName').setValue('John Doe')
      await wrapper.find('#amount').setValue(50000)
      await wrapper.find('#termMonths').setValue(24)
      await wrapper.find('#interestRate').setValue(0.08)
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.emitted('created')).toBeTruthy()
      expect(wrapper.emitted('created')?.length).toBe(1)
    })

    /**
     * Verifies form is reset to empty state after successful submission.
     * @test {LoanForm}
     */
    it('resets form after successful submission', async () => {
      const wrapper = mount(LoanForm)
      
      await wrapper.find('#applicantName').setValue('John Doe')
      await wrapper.find('#amount').setValue(50000)
      await wrapper.find('#termMonths').setValue(24)
      await wrapper.find('#interestRate').setValue(0.08)
      await wrapper.find('form').trigger('submit')
      
      const nameInput = wrapper.find('#applicantName').element as HTMLInputElement
      expect(nameInput.value).toBe('')
    })

    /**
     * Verifies service error messages are displayed to the user.
     * @test {LoanForm}
     */
    it('shows error message when createLoanApplication throws', async () => {
      vi.mocked(loanService.createLoanApplication).mockImplementationOnce(() => {
        throw new Error('Service error')
      })
      
      const wrapper = mount(LoanForm)
      
      await wrapper.find('#applicantName').setValue('John Doe')
      await wrapper.find('#amount').setValue(50000)
      await wrapper.find('#termMonths').setValue(24)
      await wrapper.find('#interestRate').setValue(0.08)
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.find('.error-message').text()).toBe('Service error')
    })

    /**
     * Verifies non-Error exceptions are handled gracefully with generic message.
     * @test {LoanForm}
     */
    it('handles non-Error exceptions gracefully', async () => {
      vi.mocked(loanService.createLoanApplication).mockImplementationOnce(() => {
        throw 'String error'
      })
      
      const wrapper = mount(LoanForm)
      
      await wrapper.find('#applicantName').setValue('John Doe')
      await wrapper.find('#amount').setValue(50000)
      await wrapper.find('#termMonths').setValue(24)
      await wrapper.find('#interestRate').setValue(0.08)
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.find('.error-message').text()).toBe('Failed to create loan application')
    })
  })
})
