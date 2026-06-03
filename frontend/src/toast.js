import { ref } from 'vue';

export const toasts = ref([]);

export function showToast(message, type = 'success', duration = 4000) {
  const id = Date.now() + Math.random().toString(36).substring(2, 7);
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, duration);
}
