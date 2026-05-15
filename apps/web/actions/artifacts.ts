'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

// ARIA - Keywords
export async function getAriaKeywords(tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('aria_keywords')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAriaKeywords] Failed to fetch keywords:', error);
    return [];
  }

  return data || [];
}

// SCRIBE - Content
export async function getScribeContent(tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('scribe_content')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getScribeContent] Failed to fetch content:', error);
    return [];
  }

  return data || [];
}

// PULSE - Rankings
export async function getPulseRankings(tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('pulse_rankings')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getPulseRankings] Failed to fetch rankings:', error);
    return [];
  }

  return data || [];
}

// REPUTE - Reviews
export async function getReputeReviews(tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('repute_reviews')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getReputeReviews] Failed to fetch reviews:', error);
    return [];
  }

  return data || [];
}

// LINX - Backlinks
export async function getLinxBacklinks(tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('linx_backlinks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getLinxBacklinks] Failed to fetch backlinks:', error);
    return [];
  }

  return data || [];
}

// PRISM - Assets
export async function getPrismAssets(tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('prism_assets')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getPrismAssets] Failed to fetch assets:', error);
    return [];
  }

  return data || [];
}
