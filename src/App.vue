<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { LoanApplication } from './types/loan'
import { getLoans, updateLoanStatus, autoDecideLoan, deleteLoan } from './services/loanService'
import LoanForm from './components/LoanForm.vue'
import LoanList from './components/LoanList.vue'
import LoanSummary from './components/LoanSummary.vue'
import AuditLogView from './components/AuditLogView.vue'

// Navigation tabs
type TabName = 'loans' | 'audit'
const activeTab = ref<TabName>('loans')

const loans = ref<LoanApplication[]>([])

// Key for AuditLogView to trigger refresh when switching tabs
const auditLogKey = ref(0)

function refreshLoans() {
  loans.value = getLoans()
}

function handleApprove(id: string) {
  updateLoanStatus(id, 'approved')
  refreshLoans()
}

function handleReject(id: string) {
  updateLoanStatus(id, 'rejected')
  refreshLoans()
}

function handleAutoDecide(id: string) {
  autoDecideLoan(id)
  refreshLoans()
}

function handleDelete(id: string) {
  deleteLoan(id)
  refreshLoans()
}

function switchTab(tab: TabName) {
  activeTab.value = tab
  // Refresh audit log when switching to audit tab
  if (tab === 'audit') {
    auditLogKey.value++
  }
}

onMounted(() => {
  refreshLoans()
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <img src="/tredgate-logo-original.png" alt="Tredgate Logo" class="logo" />
      <h1>Tredgate Loan</h1>
      <p class="tagline">Simple loan application management</p>
    </header>

    <!-- Navigation tabs -->
    <nav class="nav-tabs">
      <button
        :class="['nav-tab', { active: activeTab === 'loans' }]"
        @click="switchTab('loans')"
      >
        Loan Applications
      </button>
      <button
        :class="['nav-tab', { active: activeTab === 'audit' }]"
        @click="switchTab('audit')"
      >
        Audit Log
      </button>
    </nav>

    <!-- Loans tab content -->
    <div v-if="activeTab === 'loans'">
      <LoanSummary :loans="loans" />

      <main class="main-content">
        <section class="left-panel">
          <LoanForm @created="refreshLoans" />
        </section>
        <section class="right-panel">
          <LoanList
            :loans="loans"
            @approve="handleApprove"
            @reject="handleReject"
            @auto-decide="handleAutoDecide"
            @delete="handleDelete"
          />
        </section>
      </main>
    </div>

    <!-- Audit Log tab content -->
    <div v-if="activeTab === 'audit'" class="audit-tab-content">
      <AuditLogView :key="auditLogKey" />
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.app-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo {
  width: 80px;
  height: auto;
  margin-bottom: 0.5rem;
}

.tagline {
  color: var(--tagline-color);
  margin-top: -0.25rem;
}

.nav-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.nav-tab {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.nav-tab:hover {
  color: var(--primary-color);
}

.nav-tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.audit-tab-content {
  margin-top: 1rem;
}

.main-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.left-panel {
  flex: 0 0 340px;
}

.right-panel {
  flex: 1;
  min-width: 0; /* Allows flex item to shrink below content size to prevent overflow */
}

@media (max-width: 900px) {
  .main-content {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
  }

  .right-panel {
    width: 100%;
  }
}
</style>
