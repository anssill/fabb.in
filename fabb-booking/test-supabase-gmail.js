const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log("Testing auth signup with gmail...")
  const { data: authUser, error: authError } = await supabase.auth.signUp({
    email: 'testauth' + Date.now() + '@gmail.com',
    password: 'Password123!',
  })
  
  console.log('Auth:', authUser)
  if (authError) console.error('Auth Error:', authError)
}

test()
