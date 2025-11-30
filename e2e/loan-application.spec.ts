import { test } from '@playwright/test'
import { LoanPage } from './pages/LoanPage'
import { TestData, AppTexts } from './helpers/texts'

test.describe('Tredgate Loan Application - Regression Tests', () => {
  let loanPage: LoanPage

  test.beforeEach(async ({ page }) => {
    loanPage = new LoanPage(page)
    await loanPage.goto()
    await loanPage.clearLocalStorage()
    await loanPage.page.reload()
  })

  test.describe('Application Layout', () => {
    test('should display the header with logo, title and tagline', async () => {
      await loanPage.expectHeaderToBeVisible()
    })

    test('should display the loan form with all required fields', async () => {
      await loanPage.expectFormToBeVisible()
    })

    test('should display empty state when no loans exist', async () => {
      await loanPage.expectEmptyState()
    })

    test('should display initial summary statistics with zero values', async () => {
      await loanPage.expectTotalApplicationsCount('0')
      await loanPage.expectPendingCount('0')
      await loanPage.expectApprovedCount('0')
      await loanPage.expectRejectedCount('0')
    })
  })

  test.describe('Loan Creation', () => {
    test('should create a new loan application successfully', async () => {
      await loanPage.createLoanApplication(
        TestData.validLoan.applicantName,
        TestData.validLoan.amount,
        TestData.validLoan.termMonths,
        TestData.validLoan.interestRate
      )

      await loanPage.expectLoanTableToBeVisible()
      await loanPage.expectLoanCount(1)
      await loanPage.expectLoanApplicantName(0, TestData.validLoan.applicantName)
      await loanPage.expectLoanStatus(0, AppTexts.status.pending)
    })

    test('should clear form fields after successful submission', async () => {
      await loanPage.createLoanApplication(
        TestData.validLoan.applicantName,
        TestData.validLoan.amount,
        TestData.validLoan.termMonths,
        TestData.validLoan.interestRate
      )

      await loanPage.expectFormToBeCleared()
    })

    test('should update summary statistics after creating a loan', async () => {
      await loanPage.createLoanApplication(
        TestData.validLoan.applicantName,
        TestData.validLoan.amount,
        TestData.validLoan.termMonths,
        TestData.validLoan.interestRate
      )

      await loanPage.expectTotalApplicationsCount('1')
      await loanPage.expectPendingCount('1')
      await loanPage.expectApprovedCount('0')
      await loanPage.expectRejectedCount('0')
    })

    test('should display action buttons for pending loan', async () => {
      await loanPage.createLoanApplication(
        TestData.validLoan.applicantName,
        TestData.validLoan.amount,
        TestData.validLoan.termMonths,
        TestData.validLoan.interestRate
      )

      await loanPage.expectActionButtonsForPendingLoan(0)
    })

    test('should create multiple loans and display all in the list', async () => {
      await loanPage.createLoanApplication(
        TestData.validLoan.applicantName,
        TestData.validLoan.amount,
        TestData.validLoan.termMonths,
        TestData.validLoan.interestRate
      )

      await loanPage.createLoanApplication(
        TestData.smallLoan.applicantName,
        TestData.smallLoan.amount,
        TestData.smallLoan.termMonths,
        TestData.smallLoan.interestRate
      )

      await loanPage.expectLoanCount(2)
      await loanPage.expectTotalApplicationsCount('2')
      await loanPage.expectPendingCount('2')
    })
  })

  test.describe('Loan Approval', () => {
    test.beforeEach(async () => {
      await loanPage.createLoanApplication(
        TestData.validLoan.applicantName,
        TestData.validLoan.amount,
        TestData.validLoan.termMonths,
        TestData.validLoan.interestRate
      )
    })

    test('should approve a pending loan', async () => {
      await loanPage.approveLoan(0)

      await loanPage.expectLoanStatus(0, AppTexts.status.approved)
    })

    test('should update summary statistics after approving a loan', async () => {
      await loanPage.approveLoan(0)

      await loanPage.expectTotalApplicationsCount('1')
      await loanPage.expectPendingCount('0')
      await loanPage.expectApprovedCount('1')
      await loanPage.expectRejectedCount('0')
    })

    test('should hide action buttons after loan is approved', async () => {
      await loanPage.approveLoan(0)

      await loanPage.expectNoActionButtonsForDecidedLoan(0)
    })
  })

  test.describe('Loan Rejection', () => {
    test.beforeEach(async () => {
      await loanPage.createLoanApplication(
        TestData.validLoan.applicantName,
        TestData.validLoan.amount,
        TestData.validLoan.termMonths,
        TestData.validLoan.interestRate
      )
    })

    test('should reject a pending loan', async () => {
      await loanPage.rejectLoan(0)

      await loanPage.expectLoanStatus(0, AppTexts.status.rejected)
    })

    test('should update summary statistics after rejecting a loan', async () => {
      await loanPage.rejectLoan(0)

      await loanPage.expectTotalApplicationsCount('1')
      await loanPage.expectPendingCount('0')
      await loanPage.expectApprovedCount('0')
      await loanPage.expectRejectedCount('1')
    })

    test('should hide action buttons after loan is rejected', async () => {
      await loanPage.rejectLoan(0)

      await loanPage.expectNoActionButtonsForDecidedLoan(0)
    })
  })

  test.describe('Auto-Decide Feature', () => {
    test('should auto-approve a small loan (amount <= 100000 and term <= 60 months)', async () => {
      await loanPage.createLoanApplication(
        TestData.smallLoan.applicantName,
        TestData.smallLoan.amount,
        TestData.smallLoan.termMonths,
        TestData.smallLoan.interestRate
      )

      await loanPage.autoDecideLoan(0)

      await loanPage.expectLoanStatus(0, AppTexts.status.approved)
    })

    test('should auto-reject a large loan (amount > 100000)', async () => {
      await loanPage.createLoanApplication(
        TestData.largeLoan.applicantName,
        TestData.largeLoan.amount,
        TestData.largeLoan.termMonths,
        TestData.largeLoan.interestRate
      )

      await loanPage.autoDecideLoan(0)

      await loanPage.expectLoanStatus(0, AppTexts.status.rejected)
    })

    test('should update summary statistics after auto-decide', async () => {
      await loanPage.createLoanApplication(
        TestData.smallLoan.applicantName,
        TestData.smallLoan.amount,
        TestData.smallLoan.termMonths,
        TestData.smallLoan.interestRate
      )

      await loanPage.autoDecideLoan(0)

      await loanPage.expectApprovedCount('1')
      await loanPage.expectPendingCount('0')
    })
  })

  test.describe('Loan Deletion', () => {
    test.beforeEach(async () => {
      await loanPage.createLoanApplication(
        TestData.validLoan.applicantName,
        TestData.validLoan.amount,
        TestData.validLoan.termMonths,
        TestData.validLoan.interestRate
      )
    })

    test('should show delete confirmation modal when clicking delete', async () => {
      await loanPage.clickDeleteButton(0)

      await loanPage.expectDeleteModalToBeVisible()
    })

    test('should close modal and keep loan when canceling deletion', async () => {
      await loanPage.deleteLoanWithCancel(0)

      await loanPage.expectDeleteModalToBeHidden()
      await loanPage.expectLoanCount(1)
    })

    test('should delete loan when confirming deletion', async () => {
      await loanPage.deleteLoanWithConfirmation(0)

      await loanPage.expectDeleteModalToBeHidden()
      await loanPage.expectLoanCount(0)
      await loanPage.expectEmptyState()
    })

    test('should update summary statistics after deleting a loan', async () => {
      await loanPage.deleteLoanWithConfirmation(0)

      await loanPage.expectTotalApplicationsCount('0')
      await loanPage.expectPendingCount('0')
    })

    test('should be able to delete an approved loan', async () => {
      await loanPage.approveLoan(0)
      await loanPage.deleteLoanWithConfirmation(0)

      await loanPage.expectLoanCount(0)
      await loanPage.expectEmptyState()
    })

    test('should be able to delete a rejected loan', async () => {
      await loanPage.rejectLoan(0)
      await loanPage.deleteLoanWithConfirmation(0)

      await loanPage.expectLoanCount(0)
      await loanPage.expectEmptyState()
    })
  })

  test.describe('Data Persistence', () => {
    test('should persist loans after page reload', async () => {
      await loanPage.createLoanApplication(
        TestData.validLoan.applicantName,
        TestData.validLoan.amount,
        TestData.validLoan.termMonths,
        TestData.validLoan.interestRate
      )

      await loanPage.page.reload()

      await loanPage.expectLoanCount(1)
      await loanPage.expectLoanApplicantName(0, TestData.validLoan.applicantName)
    })

    test('should persist loan status changes after page reload', async () => {
      await loanPage.createLoanApplication(
        TestData.validLoan.applicantName,
        TestData.validLoan.amount,
        TestData.validLoan.termMonths,
        TestData.validLoan.interestRate
      )
      await loanPage.approveLoan(0)

      await loanPage.page.reload()

      await loanPage.expectLoanStatus(0, AppTexts.status.approved)
    })
  })
})
