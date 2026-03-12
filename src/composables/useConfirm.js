import { useConfirmStore } from '@/stores/confirm'

export function useConfirm() {
  const confirmStore = useConfirmStore()

  async function confirm(message) {
    return await confirmStore.show(message)
  }

  return { confirm }
}
