
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function reproduce() {
  const testEmail = `repro_${Date.now()}@example.com`
  const password = 'TestPassword123!'
  const ownerName = 'Repro User'
  
  console.log('1. Creating business...')
  const { data: business, error: bErr } = await supabaseAdmin.from('businesses').insert({
    name: 'Repro Business',
    email: testEmail,
    slug: `repro-${Date.now()}`,
    status: 'approved'
  }).select().single()
  
  if (bErr) {
    console.error('Business error:', bErr)
    return
  }
  console.log('Business ID:', business.id)

  console.log('2. Creating branch...')
  const { data: branch, error: brErr } = await supabaseAdmin.from('branches').insert({
    business_id: business.id,
    name: 'Main Branch',
    status: 'active'
  }).select().single()

  if (brErr) {
    console.error('Branch error:', brErr)
    return
  }
  console.log('Branch ID:', branch.id)

  console.log('3. Creating auth user...')
  const { data: authData, error: aErr } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: password,
    emailConfirm: true,
    user_metadata: {
      name: ownerName,
      business_id: business.id
    }
  })

  if (aErr) {
    console.error('Auth error:', aErr)
    return
  }
  const authUserId = authData.user.id
  console.log('Auth User ID:', authUserId)

  console.log('4. Creating staff record...')
  const { error: staffError } = await supabaseAdmin.from('staff').upsert({
    id: authUserId,
    business_id: business.id,
    branch_id: branch.id,
    email: testEmail,
    name: ownerName,
    role: 'owner',
    status: 'approved',
    setup_completed: false,
  }, { onConflict: 'id' })

  if (staffError) {
    console.log('--- STAFF ERROR CAUGHT ---')
    console.log('Message:', staffError.message)
    console.log('Details:', staffError.details)
    console.log('Hint:', staffError.hint)
    console.log('Code:', staffError.code)
    console.log('--------------------------')
  } else {
    console.log('Staff success!')
  }

  // Cleanup
  console.log('Cleaning up...')
  await supabaseAdmin.from('businesses').delete().eq('id', business.id)
  await supabaseAdmin.auth.admin.deleteUser(authUserId)
}

reproduce().catch(console.error)
