<script setup lang="ts">
/**
 * @fileoverview AuditLogView component displays audit log entries
 * with filtering by action type and free-text search.
 */
import { ref, computed, onMounted } from 'vue'
import type { AuditLogEntry, AuditActionType } from '../types/auditLog'
import { getAuditLog, filterAuditLog, getMaxEntries } from '../services/auditLogService'

// All available action types for filtering
const actionTypes: AuditActionType[] = ['create', 'approve', 'reject', 'auto-decide', 'delete']

// Reactive state
const allEntries = ref<AuditLogEntry[]>([])
const searchText = ref('')
const selectedActionTypes = ref<AuditActionType[]>([])

// Load entries from localStorage on mount
onMounted(() => {
  refreshEntries()
})

/**
 * Refresh entries from localStorage.
 */
function refreshEntries() {
  allEntries.value = getAuditLog()
}

/**
 * Toggle an action type filter on/off.
 */
function toggleActionType(type: AuditActionType) {
  const index = selectedActionTypes.value.indexOf(type)
  if (index === -1) {
    selectedActionTypes.value.push(type)
  } else {
    selectedActionTypes.value.splice(index, 1)
  }
}

/**
 * Clear all filters.
 */
function clearFilters() {
  searchText.value = ''
  selectedActionTypes.value = []
}

/**
 * Computed property that filters entries based on current filters.
 * Returns entries in reverse chronological order (newest first).
 */
const filteredEntries = computed(() => {
  const filtered = filterAuditLog(allEntries.value, {
    actionTypes: selectedActionTypes.value.length > 0 ? selectedActionTypes.value : undefined,
    searchText: searchText.value || undefined
  })
  // Return newest first
  return [...filtered].reverse()
})

/**
 * Check if any filters are active.
 */
const hasActiveFilters = computed(() => {
  return searchText.value.trim() !== '' || selectedActionTypes.value.length > 0
})

/**
 * Format ISO timestamp to readable date/time.
 */
function formatTimestamp(isoDate: string): string {
  return new Date(isoDate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get display label for action type.
 */
function getActionLabel(type: AuditActionType): string {
  const labels: Record<AuditActionType, string> = {
    'create': 'Create',
    'approve': 'Approve',
    'reject': 'Reject',
    'auto-decide': 'Auto-decide',
    'delete': 'Delete'
  }
  return labels[type]
}

/**
 * Get CSS class for action type badge.
 */
function getActionClass(type: AuditActionType): string {
  const classes: Record<AuditActionType, string> = {
    'create': 'action-create',
    'approve': 'action-approve',
    'reject': 'action-reject',
    'auto-decide': 'action-auto-decide',
    'delete': 'action-delete'
  }
  return classes[type]
}
</script>

<template>
  <div class="audit-log-view card">
    <div class="header">
      <h2>Audit Log</h2>
      <span class="entry-count">
        {{ filteredEntries.length }} of {{ allEntries.length }} entries
        (max {{ getMaxEntries() }})
      </span>
    </div>

    <!-- Filter controls -->
    <div class="filters">
      <div class="filter-row">
        <div class="search-box">
          <input
            v-model="searchText"
            type="text"
            placeholder="Search by applicant, loan ID, or details..."
            class="search-input"
          />
        </div>
        <button
          v-if="hasActiveFilters"
          class="clear-btn"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>

      <div class="action-filters">
        <span class="filter-label">Filter by action:</span>
        <div class="action-checkboxes">
          <label
            v-for="type in actionTypes"
            :key="type"
            class="action-checkbox"
          >
            <input
              type="checkbox"
              :checked="selectedActionTypes.includes(type)"
              @change="toggleActionType(type)"
            />
            <span :class="['action-badge', getActionClass(type)]">
              {{ getActionLabel(type) }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="allEntries.length === 0" class="empty-state">
      <p>No audit log entries yet. Perform some loan operations to see the audit trail.</p>
    </div>

    <!-- No results after filtering -->
    <div v-else-if="filteredEntries.length === 0" class="empty-state">
      <p>No entries match your current filters.</p>
    </div>

    <!-- Audit log table -->
    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>Applicant</th>
            <th>Status Change</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in filteredEntries" :key="entry.id">
            <td class="timestamp-cell">{{ formatTimestamp(entry.timestamp) }}</td>
            <td>
              <span :class="['action-badge', getActionClass(entry.actionType)]">
                {{ getActionLabel(entry.actionType) }}
              </span>
            </td>
            <td>{{ entry.applicantName }}</td>
            <td class="status-change-cell">
              <span v-if="entry.previousStatus" :class="['status-badge', `status-${entry.previousStatus}`]">
                {{ entry.previousStatus }}
              </span>
              <span v-else class="status-none">—</span>
              <span class="arrow">→</span>
              <span v-if="entry.newStatus" :class="['status-badge', `status-${entry.newStatus}`]">
                {{ entry.newStatus }}
              </span>
              <span v-else class="status-none">—</span>
            </td>
            <td class="details-cell">{{ entry.details }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.audit-log-view {
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header h2 {
  margin-bottom: 0;
}

.entry-count {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.filters {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: var(--border-radius);
}

.filter-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-box {
  flex: 1;
}

.search-input {
  width: 100%;
}

.clear-btn {
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  font-size: 0.875rem;
}

.clear-btn:hover {
  background-color: #e9ecef;
  color: var(--text-color);
}

.action-filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.action-checkboxes {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.action-checkbox input {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.table-container {
  overflow-x: auto;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.timestamp-cell {
  white-space: nowrap;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.status-change-cell {
  white-space: nowrap;
}

.arrow {
  margin: 0 0.5rem;
  color: var(--text-secondary);
}

.status-none {
  color: var(--text-secondary);
}

.details-cell {
  font-size: 0.875rem;
}

/* Action type badges */
.action-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.action-create {
  background-color: #e7f5ff;
  color: #1c7ed6;
}

.action-approve {
  background-color: #d4edda;
  color: #155724;
}

.action-reject {
  background-color: #f8d7da;
  color: #721c24;
}

.action-auto-decide {
  background-color: #fff3cd;
  color: #856404;
}

.action-delete {
  background-color: #e9ecef;
  color: #495057;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .filter-row {
    flex-direction: column;
  }

  .action-filters {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
