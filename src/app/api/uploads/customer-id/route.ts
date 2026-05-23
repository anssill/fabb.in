import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-]/g, '_')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const businessId = String(formData.get('businessId') || '')
    const file = formData.get('file')

    if (!businessId || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing ID proof file' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'ID proof must be an image' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data: staff, error: staffError } = await admin
      .from('staff')
      .select('id, business_id, status')
      .eq('id', user.id)
      .eq('business_id', businessId)
      .single()

    if (staffError || !staff || staff.status !== 'active') {
      return NextResponse.json({ error: 'Unauthorized staff' }, { status: 403 })
    }

    const timestamp = Date.now()
    const fileName = `${timestamp}_${sanitizeFileName(file.name)}`
    const filePath = `${businessId}/customers/id_proofs/${fileName}`

    const { data: upload, error: uploadError } = await admin.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = admin.storage
      .from('images')
      .getPublicUrl(upload.path)

    return NextResponse.json({ publicUrl: publicUrlData.publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to upload ID proof' }, { status: 500 })
  }
}
