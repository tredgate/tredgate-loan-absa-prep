import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanSummary from '../../src/components/LoanSummary.vue'
import type { LoanApplication } from '../../src/types/loan'

describe('LoanSummary', () => {
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

  // Helper to get stat values text
  function getStatValues(wrapper: ReturnType<typeof mount>) {
    return wrapper.findAll('.stat-value').map(v => v.text())
  }

  // Helper to get stat cards
  function getStatCards(wrapper: ReturnType<typeof mount>) {
    return wrapper.findAll('.stat-card')
  }

  describe('rendering', () => {
    it('renders all stat cards', () => {
      const wrapper = mount(LoanSummary, {
        props: { loans: [] }
      })
      
      const statCards = wrapper.findAll('.stat-card')
      expect(statCards.length).toBe(5)
    })

    it('renders stat labels correctly', () => {
      const wrapper = mount(LoanSummary, {
        props: { loans: [] }
      })
      
      const labels = wrapper.findAll('.stat-label')
      const labelTexts = labels.map(l => l.text())
      
      expect(labelTexts).toContain('Total Applications')
      expect(labelTexts).toContain('Pending')
      expect(labelTexts).toContain('Approved')
      expect(labelTexts).toContain('Rejected')
      expect(labelTexts).toContain('Total Approved')
    })
  })

  describe('statistics calculation', () => {
    it('shows zero values when no loans', () => {
      const wrapper = mount(LoanSummary, {
        props: { loans: [] }
      })
      
      const values = getStatValues(wrapper)
      expect(values[0]).toBe('0') // Total
      expect(values[1]).toBe('0') // Pending
      expect(values[2]).toBe('0') // Approved
      expect(values[3]).toBe('0') // Rejected
      expect(values[4]).toBe('$0') // Total Approved Amount
    })

    it('correctly counts total applications', () => {
      const loans = [
        createMockLoan({ id: '1' }),
        createMockLoan({ id: '2' }),
        createMockLoan({ id: '3' })
      ]
      const wrapper = mount(LoanSummary, {
        props: { loans }
      })
      
      const values = getStatValues(wrapper)
      expect(values[0]).toBe('3')
    })

    it('correctly counts pending loans', () => {
      const loans = [
        createMockLoan({ id: '1', status: 'pending' }),
        createMockLoan({ id: '2', status: 'pending' }),
        createMockLoan({ id: '3', status: 'approved' })
      ]
      const wrapper = mount(LoanSummary, {
        props: { loans }
      })
      
      const values = getStatValues(wrapper)
      expect(values[1]).toBe('2')
    })

    it('correctly counts approved loans', () => {
      const loans = [
        createMockLoan({ id: '1', status: 'approved' }),
        createMockLoan({ id: '2', status: 'approved' }),
        createMockLoan({ id: '3', status: 'rejected' })
      ]
      const wrapper = mount(LoanSummary, {
        props: { loans }
      })
      
      const values = getStatValues(wrapper)
      expect(values[2]).toBe('2')
    })

    it('correctly counts rejected loans', () => {
      const loans = [
        createMockLoan({ id: '1', status: 'rejected' }),
        createMockLoan({ id: '2', status: 'rejected' }),
        createMockLoan({ id: '3', status: 'rejected' }),
        createMockLoan({ id: '4', status: 'pending' })
      ]
      const wrapper = mount(LoanSummary, {
        props: { loans }
      })
      
      const values = getStatValues(wrapper)
      expect(values[3]).toBe('3')
    })

    it('correctly calculates total approved amount', () => {
      const loans = [
        createMockLoan({ id: '1', status: 'approved', amount: 25000 }),
        createMockLoan({ id: '2', status: 'approved', amount: 50000 }),
        createMockLoan({ id: '3', status: 'rejected', amount: 100000 }), // Should not be counted
        createMockLoan({ id: '4', status: 'pending', amount: 30000 }) // Should not be counted
      ]
      const wrapper = mount(LoanSummary, {
        props: { loans }
      })
      
      const values = getStatValues(wrapper)
      expect(values[4]).toBe('$75,000')
    })

    it('handles mixed statuses correctly', () => {
      const loans = [
        createMockLoan({ id: '1', status: 'pending' }),
        createMockLoan({ id: '2', status: 'approved', amount: 10000 }),
        createMockLoan({ id: '3', status: 'rejected' }),
        createMockLoan({ id: '4', status: 'approved', amount: 20000 }),
        createMockLoan({ id: '5', status: 'pending' })
      ]
      const wrapper = mount(LoanSummary, {
        props: { loans }
      })
      
      const values = getStatValues(wrapper)
      expect(values[0]).toBe('5') // Total
      expect(values[1]).toBe('2') // Pending
      expect(values[2]).toBe('2') // Approved
      expect(values[3]).toBe('1') // Rejected
      expect(values[4]).toBe('$30,000') // Total Approved Amount
    })
  })

  describe('formatting', () => {
    it('formats large amounts correctly', () => {
      const loans = [
        createMockLoan({ id: '1', status: 'approved', amount: 1234567 })
      ]
      const wrapper = mount(LoanSummary, {
        props: { loans }
      })
      
      const values = getStatValues(wrapper)
      expect(values[4]).toBe('$1,234,567')
    })

    it('formats zero amount correctly', () => {
      const loans = [
        createMockLoan({ id: '1', status: 'pending' }) // No approved loans
      ]
      const wrapper = mount(LoanSummary, {
        props: { loans }
      })
      
      const values = getStatValues(wrapper)
      expect(values[4]).toBe('$0')
    })
  })

  describe('styling', () => {
    it('applies correct CSS class to pending card', () => {
      const wrapper = mount(LoanSummary, {
        props: { loans: [] }
      })
      
      const cards = getStatCards(wrapper)
      expect(cards[1]?.classes()).toContain('pending')
    })

    it('applies correct CSS class to approved card', () => {
      const wrapper = mount(LoanSummary, {
        props: { loans: [] }
      })
      
      const cards = getStatCards(wrapper)
      expect(cards[2]?.classes()).toContain('approved')
    })

    it('applies correct CSS class to rejected card', () => {
      const wrapper = mount(LoanSummary, {
        props: { loans: [] }
      })
      
      const cards = getStatCards(wrapper)
      expect(cards[3]?.classes()).toContain('rejected')
    })

    it('applies correct CSS class to amount card', () => {
      const wrapper = mount(LoanSummary, {
        props: { loans: [] }
      })
      
      const cards = getStatCards(wrapper)
      expect(cards[4]?.classes()).toContain('amount')
    })
  })

  describe('reactivity', () => {
    it('updates when loans prop changes', async () => {
      const wrapper = mount(LoanSummary, {
        props: { loans: [] }
      })
      
      let values = getStatValues(wrapper)
      expect(values[0]).toBe('0')
      
      // Update props with new loans
      await wrapper.setProps({
        loans: [createMockLoan({ id: '1' })]
      })
      
      values = getStatValues(wrapper)
      expect(values[0]).toBe('1')
    })
  })
})
