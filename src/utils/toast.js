import { reactive } from 'vue'

export const toasts = reactive([])

let seq = 0
export function pushToast(text, tone = 'info') {
  const id = ++seq
  toasts.push({ id, text, tone })
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id)
    if (i !== -1) toasts.splice(i, 1)
  }, 4200)
}
