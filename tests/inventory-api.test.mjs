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


test('private image endpoint refuses anonymous requests without fetching storage',async()=>{
 let reads=0;const {GET}=loadSource('src/app/api/images/route.ts',{'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:null}})},storage:{from(){reads++;}}})}});
 const response=await GET(new Request('https://fabb.test/api/images?path=a'));assert.equal(response.status,401);assert.equal(reads,0);
});
test('private image endpoint validates paths and never caches tenant images publicly',async()=>{
 let path;const {GET}=loadSource('src/app/api/images/route.ts',{'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'qa'}}})},storage:{from:()=>({download:async p=>{path=p;return {data:new Blob(['image'],{type:'image/png'}),error:null}}})}})}});
 assert.equal((await GET(new Request('https://fabb.test/api/images?path=../../secret'))).status,400);
 const p='11111111-1111-4111-8111-111111111111/items/photo.png';const res=await GET(new Request('https://fabb.test/api/images?path='+encodeURIComponent(p)));assert.equal(res.status,200);assert.equal(path,p);assert.equal(res.headers.get('cache-control'),'private, no-store');
});
test('inventory creation calls one atomic RPC and returns database errors',async()=>{
 const db=database({staff:{data:{business_id:'b',branch_id:'c',role:'owner',permissions:{}}}},{getUser:async()=>({data:{user:{id:'u'}}})});let call;
 db.rpc=async(name,input)=>{call={name,input};return {data:null,error:{message:'Each size must be unique'}}};
 const {createItem}=loadSource('src/app/(dashboard)/inventory/inventory-actions.ts',{'@/lib/supabase/server':{createClient:async()=>db},'next/cache':{revalidatePath(){}}});
 const result=await createItem({name:'Suit',category:'Suit',price:100},[{size:'M',total_stock:1}]);assert.equal(result.error,'Each size must be unique');assert.equal(call.name,'create_inventory_item');assert.equal(call.input.p_item.name,'Suit');
});
