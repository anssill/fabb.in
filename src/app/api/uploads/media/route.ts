import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const ALLOWED_BUCKETS = new Set(['images', 'documents'])

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-]/g, '_')
}

function isSafePath(path: string) {
  return path.length > 0 && !path.includes('..') && !path.startsWith('/') && !path.endsWith('/')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const bucket = String(formData.get('bucket') || '')
    const path = String(formData.get('path') || '')
    const file = formData.get('file')

    if (!ALLOWED_BUCKETS.has(bucket) || !isSafePath(path) || !(file instanceof File)) {
      return NextResponse.json({ error: 'Invalid upload request' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data: staff, error: staffError } = await admin
      .from('staff')
      .select('id, status')
      .eq('id', user.id)
      .single()

    if (staffError || !staff || staff.status !== 'active') {
      return NextResponse.json({ error: 'Unauthorized staff' }, { status: 403 })
    }

    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}-${sanitizeFileName(file.name)}`
    const filePath = `${path}/${fileName}`

    const { data: upload, error: uploadError } = await admin.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage
      .from(bucket)
      .getPublicUrl(upload.path)

    return NextResponse.json({ publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 })
  }
}
