import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import ts from 'typescript'
const loadPackage = createRequire(import.meta.url)
const { NextRequest, NextResponse } = loadPackage('next/server')

// Compile actual application modules while replacing only external service boundaries.
function loadSource(relativePath, mocks = {}) {
  const cache = new Map()
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports
    const loadedModule = { exports: {} }
    cache.set(filename, loadedModule)
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      fileName: filename,
    }).outputText
    const localRequire = name => {
      if (Object.hasOwn(mocks, name)) return mocks[name]
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(filename), name)
        return load([base, `${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()))
      }
      return loadPackage(name)
    }
    vm.compileFunction(code, ['require', 'module', 'exports'], { filename })(localRequire, loadedModule, loadedModule.exports)
    return loadedModule.exports
  }
  return load(path.resolve(relativePath))
}

function database(rows, auth = {}) {
  const calls = []
  return {
    calls,
    auth,
    from(table) {
      const filters = {}
      const result = () => typeof rows[table] === 'function' ? rows[table](filters) : rows[table] ?? { data: null, error: null }
      const query = {
        select(...args) { calls.push([table, 'select', ...args]); return query },
        eq(...args) { calls.push([table, 'eq', ...args]); filters[args[0]] = args[1]; return query },
        in(...args) { calls.push([table, 'in', ...args]); return query },
        update(...args) { calls.push([table, 'update', ...args]); return query },
        async single() { return result() },
        async maybeSingle() { return result() },
        async upsert(...args) { calls.push([table, 'upsert', ...args]); return result() },
      }
      calls.push([table, 'from'])
      return query
    },
  }
}

const user = { id: '11111111-1111-4111-8111-111111111111', email: 'staff@example.test' }
const branchId = '22222222-2222-4222-8222-222222222222'
const activeStaff = { role: 'staff', status: 'active', setup_completed: true, permissions: { manage_dashboard: true }, business_id: 'business-a' }

const permissions = loadSource('src/lib/permissions.ts')
test('partial staff permissions never grant omitted permissions', () => {
  assert.equal(permissions.hasPermission('staff', { manage_dashboard: true }, 'manage_bookings'), false)
  assert.equal(permissions.hasPermission('manager', {}, 'manage_bookings'), false)
  assert.equal(permissions.hasPermission('staff', { manage_bookings: true }, 'manage_bookings'), true)
  assert.equal(permissions.hasPermission('owner', null, 'manage_bookings'), true)
})
test('staff retain personal pages but cannot access business settings', () => {
  for (const route of ['/attendance', '/notifications', '/settings/account', '/settings/display']) {
    assert.equal(permissions.canAccessRoute('staff', {}, route), true, route)
  }
  assert.equal(permissions.canAccessRoute('staff', {}, '/settings/company'), false)
  assert.equal(permissions.canAccessRoute('staff', { manage_staff: true }, '/settings/staff'), true)
  assert.equal(permissions.canAccessRoute('staff', { manage_inventory: true }, '/inventory/transfers'), false)
})

const paths = loadSource('src/lib/auth/paths.ts')
test('auth destinations reject external and executable URLs', () => {
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/\t/evil.test', 'javascript:alert(1)', null]) {
    assert.equal(paths.safeAuthNextPath(value), '/dashboard', String(value))
  }
  assert.equal(paths.safeAuthNextPath('/bookings?status=confirmed#items'), '/bookings?status=confirmed#items')
})
test('only owners enter business setup and admins enter the admin dashboard', () => {
  assert.equal(paths.getPostLoginPath({ role: 'staff', setup_completed: false }), '/dashboard')
  assert.equal(paths.getPostLoginPath({ role: 'owner', setup_completed: false }), '/setup')
  assert.equal(paths.getPostLoginPath({ role: 'super_admin', setup_completed: false }), '/admin/dashboard')
})

async function runProxy(urlPath, staff = activeStaff, signedIn = true, queryError = null) {
  const response = NextResponse.next()
  response.cookies.set('test-session', 'refreshed', { httpOnly: true })
  let signedOut = false
  const client = database({ staff: { data: staff, error: queryError } }, {
    async signOut() { signedOut = true; response.cookies.set('test-session', '', { maxAge: 0 }) },
  })
  const { proxy } = loadSource('src/proxy.ts', {
    '@/lib/supabase/middleware': { updateSession: async () => ({ supabase: client, user: signedIn ? user : null, supabaseResponse: response }) },
  })
  const result = await proxy(new NextRequest(`https://fabb.test${urlPath}`))
  return { result, signedOut, client }
}
test('authenticated recovery page is not redirected away', async () => {
  const { result, client } = await runProxy('/reset-password')
  assert.equal(result.headers.get('location'), null)
  assert.equal(client.calls.length, 0)
})
test('attendance and admin pages require login and preserve refresh cookies', async () => {
  for (const route of ['/attendance', '/admin/dashboard']) {
    const { result } = await runProxy(route, activeStaff, false)
    assert.equal(result.headers.get('location'), 'https://fabb.test/login')
    assert.equal(result.cookies.get('test-session').value, 'refreshed')
  }
})
test('staff with incomplete owner setup can access their dashboard', async () => {
  const { result } = await runProxy('/dashboard', { ...activeStaff, setup_completed: false })
  assert.equal(result.headers.get('location'), null)
})
test('suspension is enforced before setup', async () => {
  const { result } = await runProxy('/dashboard', { ...activeStaff, role: 'owner', status: 'suspended', setup_completed: false })
  assert.equal(result.headers.get('location'), 'https://fabb.test/suspended')
})
test('missing staff clears the session instead of creating a login redirect loop', async () => {
  const { result, signedOut } = await runProxy('/login', null)
  assert.equal(signedOut, true)
  assert.equal(result.headers.get('location'), 'https://fabb.test/login?error=no_account')
  assert.equal(result.cookies.get('test-session').value, '')
})
test('temporary profile failures preserve the session and return a retryable error', async () => {
  const { result, signedOut } = await runProxy('/dashboard', null, true, { message: 'database offline' })
  assert.equal(result.status, 503)
  assert.equal(signedOut, false)
  assert.equal(result.cookies.get('test-session').value, 'refreshed')
})
test('unauthorized module redirects preserve session cookies', async () => {
  const { result } = await runProxy('/bookings')
  assert.equal(result.headers.get('location'), 'https://fabb.test/notifications')
  assert.equal(result.cookies.get('test-session').value, 'refreshed')
})
test('super admins bypass the tenant setup route', async () => {
  const { result } = await runProxy('/login', { ...activeStaff, role: 'super_admin', setup_completed: false })
  assert.equal(result.headers.get('location'), 'https://fabb.test/admin/dashboard')
})

async function changePassword(body, options = {}) {
  const calls = []
  const auth = {
    getUser: async () => ({ data: { user: options.noUser ? null : user }, error: null }),
    async signInWithPassword(credentials) {
      calls.push(['reauthenticate', credentials])
      return { data: { user: options.wrongIdentity ? { ...user, id: 'different-user' } : user }, error: options.wrongPassword ? { message: 'invalid' } : null }
    },
    async updateUser(input) { calls.push(['update', input]); return { error: options.updateError ?? null } },
  }
  const { POST } = loadSource('src/app/api/auth/change-password/route.ts', {
    '@/lib/supabase/server': { createClient: async () => ({ auth }) },
  })
  const response = await POST(new Request('https://fabb.test/api/auth/change-password', {
    method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
  }))
  return { response, calls }
}
test('password changes reject unauthenticated users and malformed input', async () => {
  for (const [body, options, status] of [
    [{ currentPassword: 'old', newPassword: 'NewPass123' }, { noUser: true }, 401],
    ['{invalid', {}, 400],
    [{ newPassword: 'NewPass123' }, {}, 400],
    [{ currentPassword: 'old', newPassword: 'short' }, {}, 400],
  ]) {
    const { response, calls } = await changePassword(body, options)
    assert.equal(response.status, status)
    assert.equal(calls.length, 0)
  }
})
test('incorrect passwords and mismatched identities cannot change a password', async () => {
  for (const options of [{ wrongPassword: true }, { wrongIdentity: true }]) {
    const { response, calls } = await changePassword({ currentPassword: 'old', newPassword: 'NewPass123' }, options)
    assert.equal(response.status, 400)
    assert.equal(calls.some(call => call[0] === 'update'), false)
  }
})
test('password changes use the verified email and update Supabase Auth', async () => {
  const { response, calls } = await changePassword({ currentPassword: 'old', newPassword: 'NewPass123', email: 'other@example.test' })
  assert.equal(response.status, 200)
  assert.equal(calls[0][1].email, user.email)
  assert.deepEqual(calls[1], ['update', { password: 'NewPass123' }])
})
test('password service errors are returned to the form', async () => {
  const { response } = await changePassword({ currentPassword: 'old', newPassword: 'NewPass123' }, { updateError: { message: 'Password has been used before' } })
  assert.equal(response.status, 400)
  assert.equal((await response.json()).error, 'Password has been used before')
})

async function switchBranch(options = {}) {
  const client = database({
    staff: { data: { ...activeStaff, ...options.staff }, error: null },
    branches: filters => ({ data: options.denied || (options.deniedSource && filters.id === options.staff?.branch_id) ? null : { id: filters.id }, error: null }),
  }, { getUser: async () => ({ data: { user: options.noUser ? null : user } }) })
  const admin = database({
    staff: { data: { id: user.id }, error: null },
    staff_branch_memberships: { data: null, error: options.membershipError ? { message: 'Write failed' } : null },
  })
  let adminCalls = 0
  const { switchActiveBranch } = loadSource('src/app/(dashboard)/components/branch-actions.ts', {
    '@/lib/supabase/server': { createClient: async () => client },
    '@/lib/supabase/admin': { getSupabaseAdmin: () => { adminCalls++; return admin } },
  })
  let error
  try { await switchActiveBranch(options.branchId ?? branchId) } catch (caught) { error = caught }
  return { error, client, admin, adminCalls }
}
test('branch switching rejects invalid, inaccessible, and inactive-account requests before admin writes', async () => {
  for (const options of [{ branchId: 'invalid' }, { noUser: true }, { denied: true }, { staff: { status: 'suspended' } }]) {
    const result = await switchBranch(options)
    assert.ok(result.error)
    assert.equal(result.adminCalls, 0)
  }
})
test('branch switching scopes both authorization and the update to the current business', async () => {
  const result = await switchBranch()
  assert.equal(result.error, undefined)
  assert.ok(result.client.calls.some(call => call[0] === 'branches' && call[1] === 'eq' && call[2] === 'business_id' && call[3] === 'business-a'))
  assert.ok(result.admin.calls.some(call => call[1] === 'eq' && call[2] === 'id' && call[3] === user.id))
  assert.ok(result.admin.calls.some(call => call[1] === 'eq' && call[2] === 'business_id' && call[3] === 'business-a'))
})

test("switching preserves a staff member's original branch assignment before changing the active branch", async () => {
  const previousBranchId = '33333333-3333-4333-8333-333333333333'
  const result = await switchBranch({ staff: { branch_id: previousBranchId } })
  assert.equal(result.error, undefined)
  const membership = result.admin.calls.find(call => call[1] === 'upsert')
  assert.deepEqual(membership, ['staff_branch_memberships', 'upsert', {
    staff_id: user.id, business_id: 'business-a', branch_id: previousBranchId,
  }, { onConflict: 'staff_id,branch_id', ignoreDuplicates: true }])
  assert.ok(result.admin.calls.indexOf(membership) < result.admin.calls.findIndex(call => call[1] === 'update'))
})

test('a failed membership save prevents switching away from the original branch', async () => {
  const result = await switchBranch({ staff: { branch_id: '33333333-3333-4333-8333-333333333333' }, membershipError: true })
  assert.match(result.error.message, /preserve your branch access/)
  assert.equal(result.admin.calls.some(call => call[1] === 'update'), false)
})

test('switching never grants membership in an inaccessible original branch', async () => {
  const result = await switchBranch({ staff: { branch_id: '33333333-3333-4333-8333-333333333333' }, deniedSource: true })
  assert.equal(result.error, undefined)
  assert.equal(result.admin.calls.some(call => call[1] === 'upsert'), false)
})

async function confirmAuth(next, type = 'email', staff = activeStaff) {
  let cookieWriter
  const admin = database({ staff: { data: staff, error: null } })
  const { GET } = loadSource('src/app/auth/confirm/route.ts', {
    '@supabase/ssr': { createServerClient(_url, _key, options) {
      cookieWriter = options.cookies.setAll
      return { auth: {
        async verifyOtp() { cookieWriter([{ name: 'test-session', value: 'new', options: { httpOnly: true } }]); return { data: { user }, error: null } },
        async signOut() { cookieWriter([{ name: 'test-session', value: '', options: { maxAge: 0 } }]) },
      } }
    } },
    '@/lib/supabase/admin': { supabaseAdmin: admin },
  })
  const response = await GET(new NextRequest(`https://fabb.test/auth/confirm?token_hash=test&type=${type}&next=${encodeURIComponent(next)}`))
  return { response, admin }
}
test('email confirmation cannot redirect to an external site and checks the authenticated ID', async () => {
  const { response, admin } = await confirmAuth('https://evil.test')
  assert.equal(response.headers.get('location'), 'https://fabb.test/dashboard')
  assert.equal(response.cookies.get('test-session').value, 'new')
  assert.ok(admin.calls.some(call => call[1] === 'eq' && call[2] === 'id' && call[3] === user.id))
})
test('recovery confirmation always opens the reset form', async () => {
  const { response } = await confirmAuth('/dashboard', 'recovery')
  assert.equal(response.headers.get('location'), 'https://fabb.test/reset-password')
})
test('rejected email confirmation clears browser session cookies', async () => {
  const { response } = await confirmAuth('/dashboard', 'email', null)
  assert.equal(response.headers.get('location'), 'https://fabb.test/login?error=no_account')
  assert.equal(response.cookies.get('test-session').value, '')
})

function workerHarness() {
  const handlers = {}
  const cachedAssets = []
  const removedCaches = []
  vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), {
    self: { addEventListener: (name, handler) => { handlers[name] = handler }, skipWaiting() {}, clients: { claim() {} }, location: { origin: 'https://fabb.test' } },
    caches: {
      open: async () => ({ addAll: async assets => { cachedAssets.push(...assets) } }),
      keys: async () => ['fabb-static-v1', 'fabb-static-v2', 'another-app-cache'],
      delete: async key => { removedCaches.push(key) },
    },
    URL,
  })
  return { handlers, cachedAssets, removedCaches }
}
test('service worker never precaches authenticated HTML or intercepts login', async () => {
  const { handlers, cachedAssets } = workerHarness()
  let pending
  handlers.install({ waitUntil(promise) { pending = promise } })
  await pending
  assert.equal(cachedAssets.includes('/login'), false)
  let intercepted = false
  handlers.fetch({ request: new Request('https://fabb.test/login'), respondWith() { intercepted = true } })
  assert.equal(intercepted, false)
})
test('service worker activation only deletes outdated Fabb caches', async () => {
  const { handlers, removedCaches } = workerHarness()
  let pending
  handlers.activate({ waitUntil(promise) { pending = promise } })
  await pending
  assert.deepEqual(removedCaches, ['fabb-static-v1'])
})


test('recovery recognizes INITIAL_SESSION after the server callback', () => {
  const effects = []
  const states = []
  let listener
  let unsubscribed = false
  const client = { auth: { onAuthStateChange(callback) {
    listener = callback
    return { data: { subscription: { unsubscribe() { unsubscribed = true } } } }
  } } }
  const { default: ResetPage } = loadSource('src/app/(auth)/reset-password/page.tsx', {
    react: {
      Suspense: 'suspense',
      useState(initial) {
        const index = states.length
        states.push(typeof initial === 'function' ? initial() : initial)
        return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value }]
      },
      useEffect(callback) { effects.push(callback) },
    },
    'next/navigation': { useRouter: () => ({ push() {} }) },
    '@/lib/supabase/client': { createClient: () => client },
    '@/components/ui/button': { Button: 'button' },
    '@/components/ui/input': { Input: 'input' },
    '@/components/ui/label': { Label: 'label' },
  })
  const content = ResetPage().props.children
  content.type(content.props)
  const cleanup = effects[0]()
  listener('INITIAL_SESSION', { user })
  assert.equal(states[1], true)
  listener('SIGNED_OUT', null)
  assert.equal(states[1], false)
  cleanup()
  assert.equal(unsubscribed, true)
})

test('middleware retains later sign-out cookies and forwards refreshed request cookies', async () => {
  const request = new NextRequest('https://fabb.test/dashboard')
  let setCookies
  const { updateSession } = loadSource('src/lib/supabase/middleware.ts', {
    '@supabase/ssr': { createServerClient(_url, _key, options) {
      setCookies = options.cookies.setAll
      return { auth: {
        async getUser() {
          setCookies([{ name: 'test-session', value: 'fresh', options: { httpOnly: true } }])
          return { data: { user } }
        },
        async signOut() { setCookies([{ name: 'test-session', value: '', options: { maxAge: 0 } }]) },
      } }
    } },
  })
  const { supabase, supabaseResponse } = await updateSession(request)
  assert.equal(request.cookies.get('test-session').value, 'fresh')
  assert.equal(supabaseResponse.cookies.get('test-session').value, 'fresh')
  assert.match(supabaseResponse.headers.get('x-middleware-request-cookie'), /test-session=fresh/)
  await supabase.auth.signOut()
  assert.equal(supabaseResponse.cookies.get('test-session').value, '')
})
