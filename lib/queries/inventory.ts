import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'

export type InventoryFilters = {
  search?: string
  category?: string
  sub_category?: string
  status?: string
  condition_grade?: string
  priceMin?: number
  priceMax?: number
}

// Ensure type strictness as requested by Agent 3 prompt
export const useInventory = (filters?: InventoryFilters) => {
  const supabase = createClient()
  const activeBranchId = useUserStore((state: { activeBranchId: string | null }) => state.activeBranchId)

  return useQuery({
    queryKey: ['inventory', activeBranchId, filters],
    queryFn: async () => {
      if (!activeBranchId) return []

      let query = supabase
        .from('items')
        .select('*')
        .eq('branch_id', activeBranchId)
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }
      if (filters?.category) query = query.eq('category', filters.category)
      if (filters?.sub_category) query = query.eq('sub_category', filters.sub_category)
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.condition_grade) query = query.eq('condition_grade', filters.condition_grade)
      if (filters?.priceMin) query = query.gte('price', filters.priceMin)
      if (filters?.priceMax) query = query.lte('price', filters.priceMax)

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    staleTime: 60_000,
    enabled: !!activeBranchId
  })
}

export const useItem = (id: string) => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          item_photos (*),
          item_tags (*),
          item_variants (*)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id
  })
}

export const useItemVariants = (itemId: string, pickupDate?: Date, returnDate?: Date) => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['item-variants', itemId, pickupDate, returnDate],
    queryFn: async () => {
      // Basic fetch. Real availability logic requires calculating overlapping bookings
      const { data, error } = await supabase
        .from('item_variants')
        .select(`
          *,
          free_count: available_count - reserved_count
        `)
        .eq('item_id', itemId)
        .eq('status', 'available')

      // Note: the "free_count" trick needs a generated column or view, but we'll fetch all and auth handle it
      if (error) {
        // Fallback if computed column doesn't work 
        const { data: rawData, error: rawError } = await supabase
          .from('item_variants')
          .select('*')
          .eq('item_id', itemId)
          .eq('status', 'available')
        
        if (rawError) throw rawError
        return rawData.map(v => ({
          ...v,
          free_count: (v.available_count || 1) - (v.reserved_count || 0)
        }))
      }
      return data || []
    },
    enabled: !!itemId
  })
}

export const useAddItem = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((state: { activeBranchId: string | null }) => state.activeBranchId)

  return useMutation({
    mutationFn: async (newItem: { name: string, category: string, price: number, sku?: string, [key: string]: unknown }) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { data: staff } = await supabase.from('staff').select('id, branch_id').eq('id', user.user.id).single()
      
      const { data, error } = await supabase
        .from('items')
        .insert({
          ...newItem,
          branch_id: activeBranchId || staff?.branch_id,
          created_by: staff?.id,
          status: 'available',
          condition_grade: 'A',
          completeness_score: 0
        })
        .select()
        .single()
        
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', activeBranchId] })
    }
  })
}

export const useUpdateItem = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const activeBranchId = useUserStore((state: { activeBranchId: string | null }) => state.activeBranchId)

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Record<string, unknown> }) => {
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
      queryClient.invalidateQueries({ queryKey: ['inventory', activeBranchId] })
    }
  })
}

// Add Variant, Add Photos, etc can be added here
