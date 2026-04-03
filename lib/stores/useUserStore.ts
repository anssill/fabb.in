import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Staff } from '@/lib/types/echo'

interface UserState {
  profile: Staff | null
  activeBranchId: string | null
  setProfile: (profile: Staff) => void
  setActiveBranchId: (id: string) => void
  onLogout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      activeBranchId: null,
      setProfile: (profile) => set({ profile }),
      setActiveBranchId: (id) => set({ activeBranchId: id }),
      onLogout: () => set({ profile: null, activeBranchId: null }),
    }),
    {
      name: 'echo-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
