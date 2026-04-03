import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'

export interface InventoryItem {
  id: string
  name: string
  sku: string | null
  category: string
  sub_category: string | null
  condition_grade: string
  status: string
  price: number
  deposit_pct: number
  purchase_cost: number | null
  purchase_date: string | null
  description: string | null
  cover_photo_url: string | null
  storage_rack: string | null
  item_variants?: InventoryVariant[]
  item_collections?: Record<string, unknown>[]
  created_at: string
}

export interface InventoryVariant {
  id: string
  item_id: string
  sku: string
  size: string
  colour: string | null
  available_count: number
  status: string
  created_at: string
}

export function generateVariantSKU(item: InventoryItem, variant: Partial<InventoryVariant>) {
  const cat = (item.category || 'GEN').substring(0, 3).toUpperCase()
  const name = (item.name || 'ITEM').substring(0, 4).toUpperCase().replace(/\s/g, '')
  const size = (variant.size || 'OS').toUpperCase()
  const col = (variant.colour || 'NA').substring(0, 2).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${cat}-${name}-${size}-${col}-${rand}`
}

export function useItems(filters?: { category?: string; status?: string }) {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['items', activeBranchId, filters],
    queryFn: async () => {
      if (!activeBranchId) return []

      let query = supabase
        .from('items')
        .select('*')
        .eq('branch_id', activeBranchId)
        .order('created_at', { ascending: false })

      if (filters?.category) query = query.eq('category', filters.category)
      if (filters?.status) query = query.eq('status', filters.status)

      const { data, error } = await query
      if (error) throw error

      return (data || []) as InventoryItem[]
    },
    enabled: !!activeBranchId,
  })
}

export function useItem(id: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          item_variants(*),
          item_photos(*),
          item_repairs(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useItemBookings(itemId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['item_bookings', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_items')
        .select(`
          id,
          booking:bookings(
            id,
            status,
            pickup_date,
            return_date,
            customer:customers(name)
          )
        `)
        .eq('item_id', itemId)

      if (error) throw error
      return data || []
    },
    enabled: !!itemId,
  })
}

export function useCreateItem() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async (newItem: Partial<InventoryItem>) => {
      const { data, error } = await supabase
        .from('items')
        .insert({ ...newItem, branch_id: activeBranchId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', activeBranchId] })
    },
  })
}

export function useUpdateItem() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryItem> }) => {
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['item', data.id] })
      queryClient.invalidateQueries({ queryKey: ['items', activeBranchId] })
    },
  })
}

export function useBulkUpdateItems() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .in('id', ids)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', activeBranchId] })
    },
  })
}

export function useItemCollections(itemId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['item_collections', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_collection_memberships')
        .select(`
          collection_id,
          collection:item_collections(id, name)
        `)
        .eq('item_id', itemId)

      if (error) throw error
      return data || []
    },
    enabled: !!itemId,
  })
}

export function useCollections() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['collections', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []
      const { data, error } = await supabase
        .from('item_collections')
        .select('*')
        .eq('branch_id', activeBranchId)

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId,
  })
}

export function useCreateCollection() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const { data, error } = await supabase
        .from('item_collections')
        .insert({ name, branch_id: activeBranchId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', activeBranchId] })
    },
  })
}

export function useRepairs() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['repairs', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []
      const { data, error } = await supabase
        .from('item_repairs')
        .select(`
          *,
          item:items(id, name, sku, branch_id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      // Filter to active branch
      return (data || []).filter((r: { item?: { branch_id?: string } }) => r.item?.branch_id === activeBranchId)
    },
    enabled: !!activeBranchId,
  })
}

export function useCreateRepair() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async (repair: {
      item_id: string
      vendor_name: string
      cost: number
      sent_date: string
      expected_return: string
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('item_repairs')
        .insert(repair)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['repairs', activeBranchId] })
      queryClient.invalidateQueries({ queryKey: ['item_repairs', variables.item_id] })
    },
  })
}

export function useItemRepairs(itemId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['item_repairs', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_repairs')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!itemId,
  })
}

export function useUpdateRepair() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('item_repairs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['repairs', activeBranchId] })
      queryClient.invalidateQueries({ queryKey: ['item_repairs', data.item_id] })
    },
  })
}

export function useUpdateVariant() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryVariant> }) => {
      const { data, error } = await supabase
        .from('item_variants')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['item', data.item_id] })
    },
  })
}

export function useCreateVariant() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newVariant: Partial<InventoryVariant>) => {
      const { data, error } = await supabase
        .from('item_variants')
        .insert(newVariant)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['item', data.item_id] })
    },
  })
}

export function useDeleteVariant() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, itemId }: { id: string; itemId: string }) => {
      const { error } = await supabase
        .from('item_variants')
        .delete()
        .eq('id', id)

      if (error) throw error
      return itemId
    },
    onSuccess: (itemId) => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
    },
  })
}

export function useBulkCreateItems() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useMutation({
    mutationFn: async (items: Partial<InventoryItem>[]) => {
      const batch = items.map(i => ({ ...i, branch_id: activeBranchId }))
      const { data, error } = await supabase
        .from('items')
        .insert(batch)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', activeBranchId] })
    },
  })
}

export function useWishlist() {
  const supabase = createClient()
  const activeBranchId = useUserStore((s) => s.activeBranchId)

  return useQuery({
    queryKey: ['wishlist', activeBranchId],
    queryFn: async () => {
      if (!activeBranchId) return []
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          item:items(id, name, sku, status),
          customer:customers(id, name, phone)
        `)
        .eq('branch_id', activeBranchId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!activeBranchId,
  })
}
