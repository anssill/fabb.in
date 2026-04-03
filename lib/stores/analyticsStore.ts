import { create } from 'zustand'

export interface DateRange {
  start: Date
  end: Date
}

interface AnalyticsStore {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
}

const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
const today = new Date()

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  dateRange: { start: firstDayOfMonth, end: today },
  setDateRange: (range) => set({ dateRange: range }),
}))
