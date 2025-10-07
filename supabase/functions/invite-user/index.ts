// @ts-nocheck
// Supabase Edge Function: invite-user
// Requires environment variables set in Edge Functions settings:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// This function invites a user by email and assigns a role in public.profiles.

import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { email, role } = await req.json();
    if (!email || !role || !['admin','user'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing service configuration' }), { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Invite user by email
    const { data: inviteRes, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email);
    if (inviteErr || !inviteRes?.user) {
      throw inviteErr || new Error('Invite failed');
    }

    const userId = inviteRes.user.id;

    // Upsert profile with role
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, email, role }, { onConflict: 'id' });

    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ ok: true, userId }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500 });
  }
});
