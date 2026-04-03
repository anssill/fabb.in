import { create } from 'zustand'

interface PinState {
  isLocked: boolean
  lock: () => void
  unlock: () => void
}

export const usePinStore = create<PinState>((set) => ({
  isLocked: false,
  lock: () => set({ isLocked: true }),
  unlock: () => set({ isLocked: false }),
}))
