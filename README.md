# Tredgate Loan

A simple loan application management demo built with Vue 3, TypeScript, and Vite.

## Overview

Tredgate Loan is a frontend-only demo application used for training on GitHub Copilot features. It demonstrates a small, realistic frontend project without any backend server or external database.

## Features

- Create loan applications with applicant name, amount, term, and interest rate
- View all loan applications in a table
- Approve or reject loan applications manually
- Auto-decide loans based on simple business rules:
  - Approved if amount ≤ $100,000 AND term ≤ 60 months
  - Rejected otherwise
- Calculate monthly payments
- View summary statistics
- **Audit Log** - Track all loan operations with detailed history

## Audit Log Feature

The Audit Log feature provides a complete history of all significant loan operations. This helps maintain transparency and traceability of all actions performed in the application.

### What Gets Logged

The following actions are automatically recorded in the audit log:

| Action | Description |
|--------|-------------|
| **Create** | New loan application created |
| **Approve** | Loan manually approved |
| **Reject** | Loan manually rejected |
| **Auto-decide** | Loan auto-decided based on business rules |
| **Delete** | Loan application deleted |

### Audit Log Entry Fields

Each audit log entry contains:

- **Timestamp** - When the action occurred
- **Action Type** - The type of operation performed
- **Loan ID** - Reference to the affected loan
- **Applicant Name** - Name of the loan applicant
- **Previous Status** - Loan status before the action (if applicable)
- **New Status** - Loan status after the action (if applicable)
- **Details** - Human-readable description of what happened

### Using the Audit Log UI

1. Navigate to the **Audit Log** tab from the main navigation
2. View all recorded events in chronological order (newest first)
3. **Filter by action type**: Use the checkboxes to show only specific action types
4. **Search**: Use the search box to find entries by applicant name, loan ID, or details
5. **Clear Filters**: Click the "Clear Filters" button to reset all filters

### Storage Limits

- The audit log retains a maximum of **500 entries**
- When the limit is reached, oldest entries are automatically removed (FIFO)
- Entries are stored in localStorage under the key `tredgate_audit_log`

### Adding New Audit Events

To add audit logging to a new operation, use the `createAuditLogEntry` function from `auditLogService.ts`:

```typescript
import { createAuditLogEntry } from './services/auditLogService'

// Example: Log a new action
createAuditLogEntry({
  actionType: 'approve',  // 'create' | 'approve' | 'reject' | 'auto-decide' | 'delete'
  loanId: loan.id,
  applicantName: loan.applicantName,
  previousStatus: 'pending',
  newStatus: 'approved',
  details: 'Loan approved by user'
})
```

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Vitest** - Unit testing framework
- **ESLint** - Code linting

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── assets/           # Global CSS styles
├── components/       # Vue components
│   ├── AuditLogView.vue # Audit log display with filters
│   ├── ConfirmModal.vue # Confirmation modal
│   ├── LoanForm.vue     # Form to create new loans
│   ├── LoanList.vue     # Table of loan applications
│   └── LoanSummary.vue  # Statistics display
├── services/         # Business logic
│   ├── auditLogService.ts # Audit log operations
│   └── loanService.ts     # Loan operations
├── types/            # TypeScript definitions
│   ├── auditLog.ts       # Audit log types
│   └── loan.ts           # Loan domain types
├── App.vue           # Main application component
└── main.ts           # Application entry point
tests/
├── auditLogService.test.ts      # Audit log service tests
├── loanService.test.ts          # Loan service tests
└── components/
    ├── AuditLogView.test.ts     # Audit log component tests
    └── ...
```

## Data Persistence

All data is stored in the browser's localStorage:

- **Loans**: `tredgate_loans` key
- **Audit Log**: `tredgate_audit_log` key (max 500 entries)

No backend server or external database is used.

## License

MIT
