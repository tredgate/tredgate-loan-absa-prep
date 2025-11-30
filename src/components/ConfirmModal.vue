<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
  message: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal-content">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="modal-actions">
          <button class="btn-ghost" @click="emit('cancel')">Cancel</button>
          <button class="btn-delete" @click="emit('confirm')">Delete</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}

.modal-content h3 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.modal-content p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-ghost {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-ghost:hover {
  background-color: #f8f9fa;
}

.btn-delete {
  background-color: var(--danger-color);
  color: white;
}

.btn-delete:hover {
  background-color: #c82333;
}
</style>
