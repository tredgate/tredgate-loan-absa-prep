/**
 * Text library for E2E tests
 * Centralizes all text content to avoid hardcoding in tests and page objects
 */

export const AppTexts = {
  header: {
    title: 'Tredgate Loan',
    tagline: 'Simple loan application management',
  },
  loanForm: {
    heading: 'New Loan Application',
    labels: {
      applicantName: 'Applicant Name',
      amount: 'Loan Amount ($)',
      termMonths: 'Term (Months)',
      interestRate: 'Interest Rate (e.g., 0.08 for 8%)',
    },
    submitButton: 'Create Application',
  },
  loanList: {
    heading: 'Loan Applications',
    emptyState: 'No loan applications yet. Create one using the form.',
    columns: {
      applicant: 'Applicant',
      amount: 'Amount',
      term: 'Term',
      rate: 'Rate',
      monthlyPayment: 'Monthly Payment',
      status: 'Status',
      created: 'Created',
      actions: 'Actions',
    },
  },
  loanSummary: {
    labels: {
      totalApplications: 'Total Applications',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      totalApproved: 'Total Approved',
    },
  },
  deleteModal: {
    title: 'Delete Loan Application',
    cancelButton: 'Cancel',
    deleteButton: 'Delete',
  },
  status: {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
  },
}

export const TestData = {
  validLoan: {
    applicantName: 'John Doe',
    amount: '50000',
    termMonths: '24',
    interestRate: '0.08',
  },
  smallLoan: {
    applicantName: 'Jane Smith',
    amount: '10000',
    termMonths: '12',
    interestRate: '0.05',
  },
  largeLoan: {
    applicantName: 'Large Borrower',
    amount: '150000',
    termMonths: '72',
    interestRate: '0.10',
  },
}
