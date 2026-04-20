'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const signupSchema = z.object({
  businessName: z.string().min(2, "Business name is too short"),
  fullName: z.string().min(2, "Full name is too short"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signUpAction(formData: any) {
  const validated = signupSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { businessName, fullName, email, password } = validated.data;
  const cleanEmail = email.toLowerCase().trim();

  try {
    // 1. Check for existing staff (admin check)
    const { data: existingStaff } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingStaff) {
      return { error: 'Email already exists' };
    }

    // 2. Create Business
    const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

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
      return { error: 'Failed to create business: ' + bizError?.message };
    }

    // 3. Create Default Branch
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
      // Cleanup
      await supabaseAdmin.from('businesses').delete().eq('id', business.id);
      return { error: 'Failed to create branch: ' + branchError?.message };
    }

    // 4. Create Auth User via Supabase Client (so session is handled properly)
    const supabase = await createClient();
    const { data: authResult, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: fullName,
          business_id: business.id,
        }
      }
    });

    if (authError) {
      // Cleanup
      await supabaseAdmin.from('branches').delete().eq('id', branch.id);
      await supabaseAdmin.from('businesses').delete().eq('id', business.id);
      return { error: authError.message };
    }

    const userId = authResult.user?.id;
    if (!userId) {
       return { error: 'User creation failed' };
    }

    // 5. Create Staff Record
    const { error: staffError } = await supabaseAdmin
      .from('staff')
      .insert({
        id: userId,
        business_id: business.id,
        branch_id: branch.id,
        email: cleanEmail,
        name: fullName,
        role: 'owner',
        status: 'approved',
        setup_completed: false
      });

    if (staffError) {
      // Note: Auth user stays, but staff record failed. This shouldn't normally happen if schema is right.
      return { error: 'Failed to save staff record: ' + staffError.message };
    }

    // 6. Update Business Owner ID
    await supabaseAdmin
      .from('businesses')
      .update({ owner_id: userId })
      .eq('id', business.id);

    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function loginAction(formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
