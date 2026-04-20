import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';

const signupSchema = z.object({
  businessName: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  console.log('[Signup API] Received signup request');

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    console.log('[Signup API] Processing for email:', (body as any)?.email);

    const validated = signupSchema.safeParse(body);
    if (!validated.success) {
      console.error('[Signup API] Validation failed:', validated.error.flatten());
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validated.error.flatten() 
      }, { status: 400 });
    }

    const { businessName, fullName, email, password } = validated.data;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Check for existing staff
    const { data: existingStaff } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingStaff) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // 2. Generate unique slug
    const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    // 3. Create Business
    console.log('[Signup API] Creating business...');
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .insert({ 
        name: businessName, 
        slug, 
        email: cleanEmail,
        status: 'trial',
        plan: 'basic'
      })
      .select()
      .single();

    if (bizError || !business) {
      console.error('[Signup API] Business creation failed:', bizError);
      return NextResponse.json({ error: 'Failed to create business', details: bizError?.message }, { status: 500 });
    }

    // 4. Create Default Branch
    console.log('[Signup API] Creating default branch...');
    const prefix = businessName.substring(0, 3).toUpperCase().padEnd(3, 'X');
    const { data: branch, error: branchError } = await supabaseAdmin
      .from('branches')
      .insert({ 
        business_id: business.id, 
        name: 'Main Branch', 
        prefix, 
        is_default: true,
        status: 'active'
      })
      .select()
      .single();

    if (branchError || !branch) {
      console.error('[Signup API] Branch creation failed:', branchError);
      await supabaseAdmin.from('businesses').delete().eq('id', business.id);
      return NextResponse.json({ error: 'Failed to create branch', details: branchError?.message }, { status: 500 });
    }

    // 5. Create Auth User
    console.log('[Signup API] Creating auth user...');
    const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: { name: fullName, business_id: business.id }
    });

    let authUserId = authResult?.user?.id;

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('[Signup API] Auth user exists, updating password...');
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.users.find((u: any) => u.email === cleanEmail);
        if (existingUser) {
          authUserId = existingUser.id;
          await supabaseAdmin.auth.admin.updateUserById(authUserId, { 
            password, 
            user_metadata: { name: fullName, business_id: business.id } 
          });
        }
      } else {
        console.error('[Signup API] Auth error:', authError);
        // Rollback
        await supabaseAdmin.from('branches').delete().eq('id', branch.id);
        await supabaseAdmin.from('businesses').delete().eq('id', business.id);
        return NextResponse.json({ error: 'Failed to create auth user', details: authError.message }, { status: 500 });
      }
    }

    if (!authUserId) {
      await supabaseAdmin.from('branches').delete().eq('id', branch.id);
      await supabaseAdmin.from('businesses').delete().eq('id', business.id);
      return NextResponse.json({ error: 'Failed to resolve user ID' }, { status: 500 });
    }

    // 6. Create Staff Record (no bcrypt needed — Supabase Auth handles password)
    console.log('[Signup API] Creating staff record...');
    const { error: staffError } = await supabaseAdmin
      .from('staff')
      .upsert({
        id: authUserId,
        business_id: business.id,
        branch_id: branch.id,
        email: cleanEmail,
        name: fullName,
        role: 'owner',
        status: 'approved',
        setup_completed: false
      }, { onConflict: 'id' });

    if (staffError) {
      console.error('[Signup API] Staff creation error:', staffError);
      return NextResponse.json({ error: 'Failed to save staff record', details: staffError.message }, { status: 500 });
    }

    // 7. Update Business Owner ID
    await supabaseAdmin
      .from('businesses')
      .update({ owner_id: authUserId })
      .eq('id', business.id);

    console.log('[Signup API] Signup successful for:', cleanEmail);
    return NextResponse.json({ success: true, message: 'Signup successful' });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Signup API] FATAL ERROR:', message);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: message 
    }, { status: 500 });
  }
}
