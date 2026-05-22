import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    // Use Supabase Admin to delete the user from auth.users.
    // This will cascade and delete the record from public.staff as well.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (error) {
      console.error('Error deleting auth user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Staff deleted successfully' })
  } catch (error: any) {
    console.error('Staff delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
