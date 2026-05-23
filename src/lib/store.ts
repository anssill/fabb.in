import { create } from 'zustand'

export interface StaffData {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: 'super_admin' | 'owner' | 'manager' | 'staff'
  status: string
  business_id: string | null
  branch_id: string | null
  accessible_branch_ids: string[] | null
  setup_completed: boolean
  profile_photo_url: string | null
  permissions: Record<string, boolean>
  pin_hash?: string | null
}

export interface BusinessData {
  id: string
  name: string
  slug: string
  logo_url: string | null
  status: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  country: string
  currency: string
  timezone: string
  gst_number: string | null
  pan_number: string | null
  settings: Record<string, unknown>
}

export interface BranchData {
  id: string
  name: string
  prefix: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  lat: number | string | null
  lng: number | string | null
  gps_radius_metres: number | null
  is_default: boolean
  status: string
  settings: Record<string, any>
}

interface AppState {
  // Auth
  staff: StaffData | null
  setStaff: (staff: StaffData | null) => void

  // Business
  business: BusinessData | null
  setBusiness: (business: BusinessData | null) => void

  // Branch
  activeBranch: BranchData | null
  setActiveBranch: (branch: BranchData | null) => void
  branches: BranchData[]
  setBranches: (branches: BranchData[]) => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Mobile
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void

  // Notifications
  unreadNotifications: number
  setUnreadNotifications: (count: number) => void

  // Reset
  resetStore: () => void
}

const initialState = {
  staff: null,
  business: null,
  activeBranch: null,
  branches: [],
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  unreadNotifications: 0,
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setStaff: (staff) => set({ staff }),
  setBusiness: (business) => set({ business }),
  setActiveBranch: (branch) => set({ activeBranch: branch }),
  setBranches: (branches) => set({ branches }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  resetStore: () => set(initialState),
}))
