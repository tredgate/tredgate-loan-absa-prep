import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanForm from '../../src/components/LoanForm.vue'
import * as loanService from '../../src/services/loanService'

// Mock loanService
vi.mock('../../src/services/loanService', () => ({
  createLoanApplication: vi.fn()
}))

describe('LoanForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders form with all required inputs', () => {
      const wrapper = mount(LoanForm)
      
      expect(wrapper.find('h2').text()).toBe('New Loan Application')
      expect(wrapper.find('#applicantName').exists()).toBe(true)
      expect(wrapper.find('#amount').exists()).toBe(true)
      expect(wrapper.find('#termMonths').exists()).toBe(true)
      expect(wrapper.find('#interestRate').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('does not show error message initially', () => {
      const wrapper = mount(LoanForm)
      
      expect(wrapper.find('.error-message').exists()).toBe(false)
    })
  })

  describe('validation', () => {
    it('shows error when applicant name is empty', async () => {
      const wrapper = mount(LoanForm)
      
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.find('.error-message').text()).toBe('Applicant name is required')
    })

    it('shows error when amount is empty or zero', async () => {
      const wrapper = mount(LoanForm)
      
      await wrapper.find('#applicantName').setValue('John Doe')
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.find('.error-message').text()).toBe('Amount must be greater than 0')
    })

    it('shows error when termMonths is empty or zero', async () => {
      const wrapper = mount(LoanForm)
      
      await wrapper.find('#applicantName').setValue('John Doe')
      await wrapper.find('#amount').setValue(10000)
      await wrapper.find('form').trigger('submit')
      
      expect(wrapper.find('.error-message').text()).toBe('Term months must be greater than 0')
    })

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

  describe('form submission', () => {
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
