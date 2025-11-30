import { test, expect } from '@playwright/test'
import { LoanPage } from './pages/LoanPage'
import { Texts } from './helpers/texts'
import { TestLoans, generateUniqueApplicantName, formatCurrency, formatPercent, calculateExpectedMonthlyPayment } from './helpers/test-data'

/**
 * Regression tests for Tredgate Loan Application
 * Covers core functionalities and user journeys
 */

test.describe('Tredgate Loan Application', () => {
  let loanPage: LoanPage

  test.beforeEach(async ({ page }) => {
    loanPage = new LoanPage(page)
    await loanPage.goto()
    await loanPage.clearLoans()
  })

  test.describe('Application Header', () => {
    test('should display header with logo, title and tagline', async () => {
      await loanPage.assertHeaderDisplayed()
    })

    test('should have correct page title', async ({ page }) => {
      await expect(page).toHaveTitle(/Tredgate Loan/)
    })
  })

  test.describe('Empty State', () => {
    test('should show empty state when no loans exist', async () => {
      await loanPage.assertEmptyState()
    })

    test('should display summary with zero values', async () => {
      const totalValue = await loanPage.getSummaryValue(Texts.summary.totalApplications)
      expect(totalValue).toBe('0')
    })
  })

  test.describe('Loan Form', () => {
    test('should display loan form with all fields', async () => {
      await expect(loanPage.formTitle).toHaveText(Texts.loanForm.title)
      await expect(loanPage.applicantNameInput).toBeVisible()
      await expect(loanPage.amountInput).toBeVisible()
      await expect(loanPage.termMonthsInput).toBeVisible()
      await expect(loanPage.interestRateInput).toBeVisible()
      await expect(loanPage.submitButton).toHaveText(Texts.loanForm.submitButton)
    })

    test('should create a new loan application successfully', async () => {
      const uniqueName = generateUniqueApplicantName('Create Test')
      const loanData = { ...TestLoans.approvable, applicantName: uniqueName }

      await loanPage.createLoan(loanData)

      await loanPage.assertLoanInList(uniqueName, 'pending')
      await loanPage.assertFormCleared()
    })

    test('should require applicant name field', async () => {
      // HTML5 validation should prevent submission without applicant name
      await expect(loanPage.applicantNameInput).toHaveAttribute('required', '')
    })

    test('should require amount field', async () => {
      // HTML5 validation should prevent submission without amount
      await expect(loanPage.amountInput).toHaveAttribute('required', '')
      await expect(loanPage.amountInput).toHaveAttribute('min', '1')
    })

    test('should require term months field', async () => {
      // HTML5 validation should prevent submission without term months
      await expect(loanPage.termMonthsInput).toHaveAttribute('required', '')
      await expect(loanPage.termMonthsInput).toHaveAttribute('min', '1')
    })

    test('should require interest rate field', async () => {
      // HTML5 validation should prevent submission without interest rate
      await expect(loanPage.interestRateInput).toHaveAttribute('required', '')
      await expect(loanPage.interestRateInput).toHaveAttribute('min', '0')
    })
  })

  test.describe('Loan List', () => {
    test('should display loan with correct information', async () => {
      const uniqueName = generateUniqueApplicantName('List Test')
      const loanData = { ...TestLoans.small, applicantName: uniqueName }

      await loanPage.createLoan(loanData)

      const row = loanPage.getLoanRowByApplicant(uniqueName)
      await expect(row).toContainText(formatCurrency(loanData.amount))
      await expect(row).toContainText(`${loanData.termMonths} mo`)
      await expect(row).toContainText(formatPercent(loanData.interestRate))

      const expectedPayment = calculateExpectedMonthlyPayment(loanData)
      await expect(row).toContainText(formatCurrency(expectedPayment))
    })

    test('should display multiple loans in the list', async () => {
      const loan1 = { ...TestLoans.approvable, applicantName: generateUniqueApplicantName('User 1') }
      const loan2 = { ...TestLoans.small, applicantName: generateUniqueApplicantName('User 2') }

      await loanPage.createLoan(loan1)
      await loanPage.createLoan(loan2)

      await loanPage.assertLoanInList(loan1.applicantName)
      await loanPage.assertLoanInList(loan2.applicantName)
      expect(await loanPage.getLoanCount()).toBe(2)
    })
  })

  test.describe('Loan Actions', () => {
    test('should approve a pending loan', async () => {
      const uniqueName = generateUniqueApplicantName('Approve Test')
      const loanData = { ...TestLoans.approvable, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.approveLoan(uniqueName)

      await loanPage.assertLoanInList(uniqueName, 'approved')
    })

    test('should reject a pending loan', async () => {
      const uniqueName = generateUniqueApplicantName('Reject Test')
      const loanData = { ...TestLoans.approvable, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.rejectLoan(uniqueName)

      await loanPage.assertLoanInList(uniqueName, 'rejected')
    })

    test('should auto-approve loan within limits', async () => {
      const uniqueName = generateUniqueApplicantName('Auto Approve Test')
      const loanData = { ...TestLoans.approvable, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.autoDecideLoan(uniqueName)

      await loanPage.assertLoanInList(uniqueName, 'approved')
    })

    test('should auto-reject loan exceeding amount limit', async () => {
      const uniqueName = generateUniqueApplicantName('Auto Reject Amount Test')
      const loanData = { ...TestLoans.rejectableByAmount, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.autoDecideLoan(uniqueName)

      await loanPage.assertLoanInList(uniqueName, 'rejected')
    })

    test('should auto-reject loan exceeding term limit', async () => {
      const uniqueName = generateUniqueApplicantName('Auto Reject Term Test')
      const loanData = { ...TestLoans.rejectableByTerm, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.autoDecideLoan(uniqueName)

      await loanPage.assertLoanInList(uniqueName, 'rejected')
    })

    test('should hide action buttons after loan is approved', async () => {
      const uniqueName = generateUniqueApplicantName('Approved Actions Test')
      const loanData = { ...TestLoans.approvable, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.approveLoan(uniqueName)

      const row = loanPage.getLoanRowByApplicant(uniqueName)
      await expect(loanPage.getApproveButton(row)).not.toBeVisible()
      await expect(loanPage.getRejectButton(row)).not.toBeVisible()
      await expect(loanPage.getAutoDecideButton(row)).not.toBeVisible()
      // Delete button should still be visible
      await expect(loanPage.getDeleteButton(row)).toBeVisible()
    })
  })

  test.describe('Delete Loan', () => {
    test('should show delete confirmation modal', async () => {
      const uniqueName = generateUniqueApplicantName('Delete Modal Test')
      const loanData = { ...TestLoans.small, applicantName: uniqueName }

      await loanPage.createLoan(loanData)

      const row = loanPage.getLoanRowByApplicant(uniqueName)
      await loanPage.getDeleteButton(row).click()

      await loanPage.assertDeleteModalVisible(uniqueName)
    })

    test('should delete loan when confirmed', async () => {
      const uniqueName = generateUniqueApplicantName('Delete Confirm Test')
      const loanData = { ...TestLoans.small, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.deleteLoan(uniqueName)

      await loanPage.assertLoanNotInList(uniqueName)
    })

    test('should not delete loan when cancelled', async () => {
      const uniqueName = generateUniqueApplicantName('Delete Cancel Test')
      const loanData = { ...TestLoans.small, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.cancelDeleteLoan(uniqueName)

      await loanPage.assertLoanInList(uniqueName)
    })

    test('should close modal on Escape key', async ({ page }) => {
      const uniqueName = generateUniqueApplicantName('Delete Escape Test')
      const loanData = { ...TestLoans.small, applicantName: uniqueName }

      await loanPage.createLoan(loanData)

      const row = loanPage.getLoanRowByApplicant(uniqueName)
      await loanPage.getDeleteButton(row).click()
      await loanPage.deleteModal.waitFor({ state: 'visible' })

      await page.keyboard.press('Escape')
      await expect(loanPage.deleteModal).not.toBeVisible()
      await loanPage.assertLoanInList(uniqueName)
    })
  })

  test.describe('Summary Statistics', () => {
    test('should update total count when loan is created', async () => {
      const uniqueName = generateUniqueApplicantName('Summary Total Test')
      const loanData = { ...TestLoans.small, applicantName: uniqueName }

      const initialTotal = await loanPage.getSummaryValue(Texts.summary.totalApplications)
      expect(initialTotal).toBe('0')

      await loanPage.createLoan(loanData)

      const newTotal = await loanPage.getSummaryValue(Texts.summary.totalApplications)
      expect(newTotal).toBe('1')
    })

    test('should update pending count', async () => {
      const uniqueName = generateUniqueApplicantName('Summary Pending Test')
      const loanData = { ...TestLoans.small, applicantName: uniqueName }

      await loanPage.createLoan(loanData)

      const pendingCount = await loanPage.getSummaryValue(Texts.summary.pending)
      expect(pendingCount).toBe('1')
    })

    test('should update approved count and amount', async () => {
      const uniqueName = generateUniqueApplicantName('Summary Approved Test')
      const loanData = { ...TestLoans.approvable, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.approveLoan(uniqueName)

      const approvedCount = await loanPage.getSummaryValue(Texts.summary.approved)
      expect(approvedCount).toBe('1')

      const pendingCount = await loanPage.getSummaryValue(Texts.summary.pending)
      expect(pendingCount).toBe('0')
    })

    test('should update rejected count', async () => {
      const uniqueName = generateUniqueApplicantName('Summary Rejected Test')
      const loanData = { ...TestLoans.small, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.rejectLoan(uniqueName)

      const rejectedCount = await loanPage.getSummaryValue(Texts.summary.rejected)
      expect(rejectedCount).toBe('1')
    })

    test('should update counts when loan is deleted', async () => {
      const uniqueName = generateUniqueApplicantName('Summary Delete Test')
      const loanData = { ...TestLoans.small, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      expect(await loanPage.getSummaryValue(Texts.summary.totalApplications)).toBe('1')

      await loanPage.deleteLoan(uniqueName)
      expect(await loanPage.getSummaryValue(Texts.summary.totalApplications)).toBe('0')
    })
  })

  test.describe('Data Persistence', () => {
    test('should persist loans after page reload', async ({ page }) => {
      const uniqueName = generateUniqueApplicantName('Persistence Test')
      const loanData = { ...TestLoans.small, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.assertLoanInList(uniqueName)

      await page.reload()

      await loanPage.assertLoanInList(uniqueName)
    })

    test('should persist loan status after page reload', async ({ page }) => {
      const uniqueName = generateUniqueApplicantName('Status Persistence Test')
      const loanData = { ...TestLoans.small, applicantName: uniqueName }

      await loanPage.createLoan(loanData)
      await loanPage.approveLoan(uniqueName)

      await page.reload()

      await loanPage.assertLoanInList(uniqueName, 'approved')
    })
  })
})
