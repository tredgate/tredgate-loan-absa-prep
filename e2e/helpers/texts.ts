/**
 * Text constants for E2E tests
 * Centralizes all UI text to avoid hardcoding in tests and page objects
 */
export const Texts = {
  app: {
    title: 'Tredgate Loan',
    tagline: 'Simple loan application management',
    logoAlt: 'Tredgate Logo',
  },
  loanForm: {
    title: 'New Loan Application',
    labels: {
      applicantName: 'Applicant Name',
      amount: 'Loan Amount ($)',
      termMonths: 'Term (Months)',
      interestRate: 'Interest Rate (e.g., 0.08 for 8%)',
    },
    placeholders: {
      applicantName: 'Enter applicant name',
      amount: 'Enter loan amount',
      termMonths: 'Enter term in months',
      interestRate: 'Enter interest rate',
    },
    submitButton: 'Create Application',
    validation: {
      applicantNameRequired: 'Applicant name is required',
      amountRequired: 'Amount must be greater than 0',
      termMonthsRequired: 'Term months must be greater than 0',
      interestRateRequired: 'Interest rate is required and cannot be negative',
    },
  },
  loanList: {
    title: 'Loan Applications',
    emptyState: 'No loan applications yet. Create one using the form.',
    tableHeaders: {
      applicant: 'Applicant',
      amount: 'Amount',
      term: 'Term',
      rate: 'Rate',
      monthlyPayment: 'Monthly Payment',
      status: 'Status',
      created: 'Created',
      actions: 'Actions',
    },
    status: {
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
    },
  },
  summary: {
    totalApplications: 'Total Applications',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    totalApproved: 'Total Approved',
  },
  deleteModal: {
    title: 'Delete Loan Application',
    confirmButton: 'Delete',
    cancelButton: 'Cancel',
  },
} as const
