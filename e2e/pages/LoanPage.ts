import { type Page, type Locator, expect } from '@playwright/test'
import { Texts } from '../helpers/texts'
import type { LoanTestData } from '../helpers/test-data'

/**
 * Page Object for the main Tredgate Loan application
 * Follows Page Object Model pattern with atomic methods and grouped actions
 */
export class LoanPage {
  readonly page: Page

  // Header elements
  readonly logo: Locator
  readonly title: Locator
  readonly tagline: Locator

  // Loan Form elements
  readonly formTitle: Locator
  readonly applicantNameInput: Locator
  readonly amountInput: Locator
  readonly termMonthsInput: Locator
  readonly interestRateInput: Locator
  readonly submitButton: Locator
  readonly formError: Locator

  // Loan List elements
  readonly listTitle: Locator
  readonly emptyState: Locator
  readonly loanTable: Locator
  readonly tableRows: Locator

  // Summary elements
  readonly summaryCards: Locator

  // Delete Modal elements
  readonly deleteModal: Locator
  readonly deleteConfirmButton: Locator
  readonly deleteCancelButton: Locator

  constructor(page: Page) {
    this.page = page

    // Header
    this.logo = page.locator('.logo')
    this.title = page.locator('h1')
    this.tagline = page.locator('.tagline')

    // Loan Form
    this.formTitle = page.locator('.loan-form h2')
    this.applicantNameInput = page.locator('#applicantName')
    this.amountInput = page.locator('#amount')
    this.termMonthsInput = page.locator('#termMonths')
    this.interestRateInput = page.locator('#interestRate')
    this.submitButton = page.locator('button[type="submit"]')
    this.formError = page.locator('.error-message')

    // Loan List
    this.listTitle = page.locator('.loan-list h2')
    this.emptyState = page.locator('.empty-state')
    this.loanTable = page.locator('.loan-list table')
    this.tableRows = page.locator('.loan-list tbody tr')

    // Summary
    this.summaryCards = page.locator('.stat-card')

    // Delete Modal
    this.deleteModal = page.locator('.modal-content')
    this.deleteConfirmButton = page.locator('.modal-content .btn-delete')
    this.deleteCancelButton = page.locator('.modal-content .btn-ghost')
  }

  // ============ Atomic Methods ============

  /**
   * Navigate to the application
   */
  async goto(): Promise<void> {
    await this.page.goto('/')
  }

  /**
   * Fill the applicant name field
   */
  async fillApplicantName(name: string): Promise<void> {
    await this.applicantNameInput.fill(name)
  }

  /**
   * Fill the amount field
   */
  async fillAmount(amount: number): Promise<void> {
    await this.amountInput.fill(amount.toString())
  }

  /**
   * Fill the term months field
   */
  async fillTermMonths(months: number): Promise<void> {
    await this.termMonthsInput.fill(months.toString())
  }

  /**
   * Fill the interest rate field
   */
  async fillInterestRate(rate: number): Promise<void> {
    await this.interestRateInput.fill(rate.toString())
  }

  /**
   * Click the submit button
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click()
  }

  /**
   * Get the approve button for a specific loan row
   */
  getApproveButton(row: Locator): Locator {
    return row.locator('button[title="Approve"]')
  }

  /**
   * Get the reject button for a specific loan row
   */
  getRejectButton(row: Locator): Locator {
    return row.locator('button[title="Reject"]')
  }

  /**
   * Get the auto-decide button for a specific loan row
   */
  getAutoDecideButton(row: Locator): Locator {
    return row.locator('button[title="Auto-decide"]')
  }

  /**
   * Get the delete button for a specific loan row
   */
  getDeleteButton(row: Locator): Locator {
    return row.locator('button[title="Delete"]')
  }

  /**
   * Get the status badge for a specific loan row
   */
  getStatusBadge(row: Locator): Locator {
    return row.locator('.status-badge')
  }

  /**
   * Get loan row by applicant name
   */
  getLoanRowByApplicant(applicantName: string): Locator {
    return this.tableRows.filter({ hasText: applicantName })
  }

  /**
   * Get summary card by exact label text
   */
  getSummaryCard(label: string): Locator {
    return this.summaryCards.filter({ has: this.page.locator('.stat-label', { hasText: new RegExp(`^${label}$`) }) })
  }

  /**
   * Get the value from a summary card
   */
  async getSummaryValue(label: string): Promise<string> {
    const card = this.getSummaryCard(label)
    const value = card.locator('.stat-value')
    return await value.textContent() ?? ''
  }

  // ============ Grouped Actions with test.step ============

  /**
   * Fill the loan application form with provided data
   */
  async fillLoanForm(data: LoanTestData): Promise<void> {
    await this.page.context().browser()?.contexts()
    await this.fillApplicantName(data.applicantName)
    await this.fillAmount(data.amount)
    await this.fillTermMonths(data.termMonths)
    await this.fillInterestRate(data.interestRate)
  }

  /**
   * Create a new loan application and wait for it to appear in the list
   */
  async createLoan(data: LoanTestData): Promise<void> {
    await this.fillLoanForm(data)
    await this.clickSubmit()
    await this.getLoanRowByApplicant(data.applicantName).waitFor({ state: 'visible' })
  }

  /**
   * Approve a loan by applicant name
   */
  async approveLoan(applicantName: string): Promise<void> {
    const row = this.getLoanRowByApplicant(applicantName)
    const approveButton = this.getApproveButton(row)
    await approveButton.click()
    await expect(this.getStatusBadge(row)).toHaveText(Texts.loanList.status.approved)
  }

  /**
   * Reject a loan by applicant name
   */
  async rejectLoan(applicantName: string): Promise<void> {
    const row = this.getLoanRowByApplicant(applicantName)
    const rejectButton = this.getRejectButton(row)
    await rejectButton.click()
    await expect(this.getStatusBadge(row)).toHaveText(Texts.loanList.status.rejected)
  }

  /**
   * Auto-decide a loan by applicant name
   */
  async autoDecideLoan(applicantName: string): Promise<void> {
    const row = this.getLoanRowByApplicant(applicantName)
    const autoDecideButton = this.getAutoDecideButton(row)
    await autoDecideButton.click()
    // Wait for status to change from pending
    await expect(this.getStatusBadge(row)).not.toHaveText(Texts.loanList.status.pending)
  }

  /**
   * Delete a loan by applicant name (with confirmation)
   */
  async deleteLoan(applicantName: string): Promise<void> {
    const row = this.getLoanRowByApplicant(applicantName)
    const deleteButton = this.getDeleteButton(row)
    await deleteButton.click()
    await this.deleteModal.waitFor({ state: 'visible' })
    await this.deleteConfirmButton.click()
    await row.waitFor({ state: 'detached' })
  }

  /**
   * Cancel loan deletion
   */
  async cancelDeleteLoan(applicantName: string): Promise<void> {
    const row = this.getLoanRowByApplicant(applicantName)
    const deleteButton = this.getDeleteButton(row)
    await deleteButton.click()
    await this.deleteModal.waitFor({ state: 'visible' })
    await this.deleteCancelButton.click()
    await this.deleteModal.waitFor({ state: 'detached' })
  }

  /**
   * Clear localStorage to reset application state
   */
  async clearLoans(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('tredgate_loans')
    })
    await this.page.reload()
  }

  // ============ Assertion Helpers ============

  /**
   * Assert the header is displayed correctly
   */
  async assertHeaderDisplayed(): Promise<void> {
    await expect(this.logo).toBeVisible()
    await expect(this.title).toHaveText(Texts.app.title)
    await expect(this.tagline).toHaveText(Texts.app.tagline)
  }

  /**
   * Assert the empty state is displayed
   */
  async assertEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible()
    await expect(this.emptyState).toHaveText(Texts.loanList.emptyState)
  }

  /**
   * Assert a loan exists in the list with pending status
   */
  async assertLoanInList(applicantName: string, status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<void> {
    const row = this.getLoanRowByApplicant(applicantName)
    await expect(row).toBeVisible()
    await expect(this.getStatusBadge(row)).toHaveText(status)
  }

  /**
   * Assert loan is not in the list
   */
  async assertLoanNotInList(applicantName: string): Promise<void> {
    const row = this.getLoanRowByApplicant(applicantName)
    await expect(row).not.toBeVisible()
  }

  /**
   * Assert form error message is displayed
   */
  async assertFormError(message: string): Promise<void> {
    await expect(this.formError).toBeVisible()
    await expect(this.formError).toHaveText(message)
  }

  /**
   * Assert form fields are cleared
   */
  async assertFormCleared(): Promise<void> {
    await expect(this.applicantNameInput).toHaveValue('')
    await expect(this.amountInput).toHaveValue('')
    await expect(this.termMonthsInput).toHaveValue('')
    await expect(this.interestRateInput).toHaveValue('')
  }

  /**
   * Assert delete modal is visible with correct content
   */
  async assertDeleteModalVisible(applicantName: string): Promise<void> {
    await expect(this.deleteModal).toBeVisible()
    await expect(this.deleteModal.locator('h3')).toHaveText(Texts.deleteModal.title)
    await expect(this.deleteModal.locator('p')).toContainText(applicantName)
  }

  /**
   * Get the total number of loans in the list
   */
  async getLoanCount(): Promise<number> {
    const rows = await this.tableRows.count()
    return rows
  }
}
