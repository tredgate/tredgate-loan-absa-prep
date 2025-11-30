import { type Page, type Locator, expect, test } from '@playwright/test'
import { AppTexts } from '../helpers/texts'

/**
 * Page Object Model for the Tredgate Loan application
 * Implements atomic methods and grouped action methods following best practices
 */
export class LoanPage {
  readonly page: Page

  // Header elements
  readonly logo: Locator
  readonly headerTitle: Locator
  readonly tagline: Locator

  // Loan Form elements
  readonly formHeading: Locator
  readonly applicantNameInput: Locator
  readonly amountInput: Locator
  readonly termMonthsInput: Locator
  readonly interestRateInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  // Loan List elements
  readonly listHeading: Locator
  readonly emptyState: Locator
  readonly loanTable: Locator
  readonly loanRows: Locator

  // Loan Summary elements
  readonly totalApplicationsStat: Locator
  readonly pendingStat: Locator
  readonly approvedStat: Locator
  readonly rejectedStat: Locator
  readonly totalApprovedAmountStat: Locator

  // Delete Modal elements
  readonly deleteModal: Locator
  readonly deleteModalTitle: Locator
  readonly deleteModalCancelButton: Locator
  readonly deleteModalDeleteButton: Locator

  constructor(page: Page) {
    this.page = page

    // Header locators
    this.logo = page.locator('.logo')
    this.headerTitle = page.locator('.app-header h1')
    this.tagline = page.locator('.tagline')

    // Loan Form locators - using label associations for stability
    this.formHeading = page.locator('.loan-form h2')
    this.applicantNameInput = page.locator('#applicantName')
    this.amountInput = page.locator('#amount')
    this.termMonthsInput = page.locator('#termMonths')
    this.interestRateInput = page.locator('#interestRate')
    this.submitButton = page.locator('button[type="submit"]')
    this.errorMessage = page.locator('.error-message')

    // Loan List locators
    this.listHeading = page.locator('.loan-list h2')
    this.emptyState = page.locator('.empty-state')
    this.loanTable = page.locator('.loan-list table')
    this.loanRows = page.locator('.loan-list tbody tr')

    // Loan Summary locators - using stat-card class with label text
    this.totalApplicationsStat = page.locator('.stat-card').filter({ hasText: AppTexts.loanSummary.labels.totalApplications }).locator('.stat-value')
    this.pendingStat = page.locator('.stat-card.pending .stat-value')
    this.approvedStat = page.locator('.stat-card.approved .stat-value')
    this.rejectedStat = page.locator('.stat-card.rejected .stat-value')
    this.totalApprovedAmountStat = page.locator('.stat-card.amount .stat-value')

    // Delete Modal locators
    this.deleteModal = page.locator('.modal-overlay')
    this.deleteModalTitle = page.locator('.modal-content h3')
    this.deleteModalCancelButton = page.locator('.modal-content .btn-ghost')
    this.deleteModalDeleteButton = page.locator('.modal-content .btn-delete')
  }

  // ============ Navigation ============

  async goto(): Promise<void> {
    await this.page.goto('/')
  }

  // ============ Atomic Methods ============

  async fillApplicantName(name: string): Promise<void> {
    await this.applicantNameInput.fill(name)
  }

  async fillAmount(amount: string): Promise<void> {
    await this.amountInput.fill(amount)
  }

  async fillTermMonths(months: string): Promise<void> {
    await this.termMonthsInput.fill(months)
  }

  async fillInterestRate(rate: string): Promise<void> {
    await this.interestRateInput.fill(rate)
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click()
  }

  async clickApproveButton(rowIndex: number): Promise<void> {
    const row = this.loanRows.nth(rowIndex)
    await row.locator('button[title="Approve"]').click()
  }

  async clickRejectButton(rowIndex: number): Promise<void> {
    const row = this.loanRows.nth(rowIndex)
    await row.locator('button[title="Reject"]').click()
  }

  async clickAutoDecideButton(rowIndex: number): Promise<void> {
    const row = this.loanRows.nth(rowIndex)
    await row.locator('button[title="Auto-decide"]').click()
  }

  async clickDeleteButton(rowIndex: number): Promise<void> {
    const row = this.loanRows.nth(rowIndex)
    await row.locator('button[title="Delete"]').click()
  }

  async confirmDelete(): Promise<void> {
    await this.deleteModalDeleteButton.click()
  }

  async cancelDelete(): Promise<void> {
    await this.deleteModalCancelButton.click()
  }

  async getLoanRowCount(): Promise<number> {
    return await this.loanRows.count()
  }

  async getStatusForRow(rowIndex: number): Promise<string> {
    const row = this.loanRows.nth(rowIndex)
    const statusBadge = row.locator('.status-badge')
    return await statusBadge.textContent() ?? ''
  }

  async getApplicantNameForRow(rowIndex: number): Promise<string> {
    const row = this.loanRows.nth(rowIndex)
    const cells = row.locator('td')
    return await cells.first().textContent() ?? ''
  }

  // ============ Grouped Action Methods with Test Steps ============

  async createLoanApplication(
    applicantName: string,
    amount: string,
    termMonths: string,
    interestRate: string
  ): Promise<void> {
    await test.step('Create a new loan application', async () => {
      await test.step('Fill in applicant name', async () => {
        await this.fillApplicantName(applicantName)
      })
      await test.step('Fill in loan amount', async () => {
        await this.fillAmount(amount)
      })
      await test.step('Fill in term months', async () => {
        await this.fillTermMonths(termMonths)
      })
      await test.step('Fill in interest rate', async () => {
        await this.fillInterestRate(interestRate)
      })
      await test.step('Submit the form', async () => {
        await this.clickSubmit()
      })
    })
  }

  async approveLoan(rowIndex: number): Promise<void> {
    await test.step(`Approve loan at row index ${rowIndex}`, async () => {
      await this.clickApproveButton(rowIndex)
    })
  }

  async rejectLoan(rowIndex: number): Promise<void> {
    await test.step(`Reject loan at row index ${rowIndex}`, async () => {
      await this.clickRejectButton(rowIndex)
    })
  }

  async autoDecideLoan(rowIndex: number): Promise<void> {
    await test.step(`Auto-decide loan at row index ${rowIndex}`, async () => {
      await this.clickAutoDecideButton(rowIndex)
    })
  }

  async deleteLoanWithConfirmation(rowIndex: number): Promise<void> {
    await test.step(`Delete loan at row index ${rowIndex} with confirmation`, async () => {
      await test.step('Click delete button', async () => {
        await this.clickDeleteButton(rowIndex)
      })
      await test.step('Confirm deletion', async () => {
        await this.confirmDelete()
      })
    })
  }

  async deleteLoanWithCancel(rowIndex: number): Promise<void> {
    await test.step(`Open delete modal for loan at row index ${rowIndex} and cancel`, async () => {
      await test.step('Click delete button', async () => {
        await this.clickDeleteButton(rowIndex)
      })
      await test.step('Cancel deletion', async () => {
        await this.cancelDelete()
      })
    })
  }

  // ============ Assertion Methods ============

  async expectHeaderToBeVisible(): Promise<void> {
    await expect(this.logo, 'Logo should be visible').toBeVisible()
    await expect(this.headerTitle, 'Header title should contain correct text').toHaveText(AppTexts.header.title)
    await expect(this.tagline, 'Tagline should contain correct text').toHaveText(AppTexts.header.tagline)
  }

  async expectFormToBeVisible(): Promise<void> {
    await expect(this.formHeading, 'Form heading should be visible').toHaveText(AppTexts.loanForm.heading)
    await expect(this.applicantNameInput, 'Applicant name input should be visible').toBeVisible()
    await expect(this.amountInput, 'Amount input should be visible').toBeVisible()
    await expect(this.termMonthsInput, 'Term months input should be visible').toBeVisible()
    await expect(this.interestRateInput, 'Interest rate input should be visible').toBeVisible()
    await expect(this.submitButton, 'Submit button should be visible').toBeVisible()
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState, 'Empty state message should be visible').toHaveText(AppTexts.loanList.emptyState)
  }

  async expectLoanTableToBeVisible(): Promise<void> {
    await expect(this.loanTable, 'Loan table should be visible').toBeVisible()
  }

  async expectLoanCount(count: number): Promise<void> {
    await expect(this.loanRows, `Should have ${count} loan(s) in the list`).toHaveCount(count)
  }

  async expectTotalApplicationsCount(count: string): Promise<void> {
    await expect(this.totalApplicationsStat, `Total applications should be ${count}`).toHaveText(count)
  }

  async expectPendingCount(count: string): Promise<void> {
    await expect(this.pendingStat, `Pending count should be ${count}`).toHaveText(count)
  }

  async expectApprovedCount(count: string): Promise<void> {
    await expect(this.approvedStat, `Approved count should be ${count}`).toHaveText(count)
  }

  async expectRejectedCount(count: string): Promise<void> {
    await expect(this.rejectedStat, `Rejected count should be ${count}`).toHaveText(count)
  }

  async expectLoanStatus(rowIndex: number, status: string): Promise<void> {
    const row = this.loanRows.nth(rowIndex)
    const statusBadge = row.locator('.status-badge')
    await expect(statusBadge, `Loan at row ${rowIndex} should have status '${status}'`).toHaveText(status)
  }

  async expectLoanApplicantName(rowIndex: number, name: string): Promise<void> {
    const row = this.loanRows.nth(rowIndex)
    const cells = row.locator('td')
    await expect(cells.first(), `Loan at row ${rowIndex} should have applicant name '${name}'`).toHaveText(name)
  }

  async expectDeleteModalToBeVisible(): Promise<void> {
    await expect(this.deleteModal, 'Delete modal should be visible').toBeVisible()
    await expect(this.deleteModalTitle, 'Delete modal title should be correct').toHaveText(AppTexts.deleteModal.title)
  }

  async expectDeleteModalToBeHidden(): Promise<void> {
    await expect(this.deleteModal, 'Delete modal should be hidden').toBeHidden()
  }

  async expectFormToBeCleared(): Promise<void> {
    await expect(this.applicantNameInput, 'Applicant name should be empty after submission').toHaveValue('')
    await expect(this.amountInput, 'Amount should be empty after submission').toHaveValue('')
    await expect(this.termMonthsInput, 'Term months should be empty after submission').toHaveValue('')
    await expect(this.interestRateInput, 'Interest rate should be empty after submission').toHaveValue('')
  }

  async expectActionButtonsForPendingLoan(rowIndex: number): Promise<void> {
    const row = this.loanRows.nth(rowIndex)
    await expect(row.locator('button[title="Approve"]'), 'Approve button should be visible for pending loan').toBeVisible()
    await expect(row.locator('button[title="Reject"]'), 'Reject button should be visible for pending loan').toBeVisible()
    await expect(row.locator('button[title="Auto-decide"]'), 'Auto-decide button should be visible for pending loan').toBeVisible()
    await expect(row.locator('button[title="Delete"]'), 'Delete button should be visible').toBeVisible()
  }

  async expectNoActionButtonsForDecidedLoan(rowIndex: number): Promise<void> {
    const row = this.loanRows.nth(rowIndex)
    await expect(row.locator('button[title="Approve"]'), 'Approve button should not be visible for decided loan').toBeHidden()
    await expect(row.locator('button[title="Reject"]'), 'Reject button should not be visible for decided loan').toBeHidden()
    await expect(row.locator('button[title="Auto-decide"]'), 'Auto-decide button should not be visible for decided loan').toBeHidden()
    await expect(row.locator('button[title="Delete"]'), 'Delete button should still be visible').toBeVisible()
  }

  // ============ Helper Methods ============

  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear())
  }
}
