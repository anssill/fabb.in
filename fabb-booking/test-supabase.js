const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log("Testing business creation...")
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .insert({
      name: 'Test Business',
      slug: 'test-business-' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      phone: '9876543210',
      city: 'Test City',
      status: 'trial',
    })
    .select()
    .single()

  console.log('Business:', business)
  if (bizError) console.error('Biz Error:', bizError)
  
  console.log("Testing auth signup...")
  const { data: authUser, error: authError } = await supabase.auth.signUp({
    email: 'test' + Date.now() + '@example.com',
    password: 'Password123!',
  })
  
  console.log('Auth:', authUser)
  if (authError) console.error('Auth Error:', authError)
}

test()
