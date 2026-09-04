'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const signupSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is too short"),
  fullName: z.string().trim().min(2, "Full name is too short"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignUpInput = z.infer<typeof signupSchema>;
type LoginInput = z.infer<typeof loginSchema>;

export async function signUpAction(formData: SignUpInput) {
  const validated = signupSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { businessName, fullName, email, password } = validated.data;

  try {
    // 1. Check for existing staff (admin check)
    const { data: existingStaff } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email)
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
        email,
        status: 'active'
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

    // 4. Create a confirmed password user. Transactional email remains disabled
    // at launch, so owner signup must not depend on a confirmation message.
    const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        business_id: business.id,
      },
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
        email,
        name: fullName,
        role: 'owner',
        status: 'active',
        setup_completed: false
      });

    if (staffError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('branches').delete().eq('id', branch.id);
      await supabaseAdmin.from('businesses').delete().eq('id', business.id);
      return { error: 'Failed to save staff record: ' + staffError.message };
    }

    // 6. Update Business Owner ID
    await supabaseAdmin
      .from('businesses')
      .update({ owner_id: userId })
      .eq('id', business.id);

    // Establish the browser session after the confirmed admin-created account.
    const supabase = await createClient();
    const { error: sessionError } = await supabase.auth.signInWithPassword({ email, password });
    if (sessionError) {
      return { error: 'Workspace created, but automatic sign in failed. Please log in with your password.' };
    }

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

export async function loginAction(formData: LoginInput) {
  const validated = loginSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
