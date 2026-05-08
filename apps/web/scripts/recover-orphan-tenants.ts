/**
 * Production-safe orphan tenant recovery script
 * 
 * This script finds profiles with null tenant_id and attempts to recover
 * orphaned tenants created by the same user.
 * 
 * Usage:
 *   npx tsx scripts/recover-orphan-tenants.ts
 * 
 * Environment variables required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../lib/env';

interface OrphanedTenant {
  id: string;
  name: string;
  status: string;
  created_by: string;
}

interface ProfileWithNullTenant {
  id: string;
  full_name: string | null;
  tenant_id: string | null;
}

interface RecoveryResult {
  profile_id: string;
  recovered: boolean;
  tenant_id: string | null;
  tenant_name: string | null;
  error?: string;
}

async function recoverOrphanTenants() {
  console.log('=== ORPHAN TENANT RECOVERY START ===');
  console.log('Timestamp:', new Date().toISOString());

  // Create admin client with service role key
  const admin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('STEP 1: Finding profiles with null tenant_id');

  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, full_name, tenant_id')
    .is('tenant_id', null)
    .limit(100);

  if (profilesError) {
    console.error('Failed to query profiles:', profilesError);
    return;
  }

  console.log(`Found ${profiles?.length || 0} profiles with null tenant_id`);

  if (!profiles || profiles.length === 0) {
    console.log('No orphaned profiles found. Recovery complete.');
    return;
  }

  const recoveryResults: RecoveryResult[] = [];

  for (const profile of profiles) {
    console.log(`\nProcessing profile: ${profile.id} (${profile.full_name || 'Unknown'})`);

    // Check for orphaned tenants created by this user
    const { data: orphanedTenants, error: tenantError } = await admin
      .from('tenants')
      .select('id, name, status, created_by')
      .eq('created_by', profile.id)
      .maybeSingle();

    if (tenantError) {
      console.error(`  Error querying tenants for profile ${profile.id}:`, tenantError);
      recoveryResults.push({
        profile_id: profile.id,
        recovered: false,
        tenant_id: null,
        tenant_name: null,
        error: tenantError.message
      });
      continue;
    }

    if (!orphanedTenants) {
      console.log(`  No orphaned tenant found for profile ${profile.id}`);
      recoveryResults.push({
        profile_id: profile.id,
        recovered: false,
        tenant_id: null,
        tenant_name: null
      });
      continue;
    }

    console.log(`  Found orphaned tenant: ${orphanedTenants.id} (${orphanedTenants.name})`);

    // Verify business_profile exists
    const { data: businessProfile, error: businessError } = await admin
      .from('business_profiles')
      .select('*')
      .eq('tenant_id', orphanedTenants.id)
      .maybeSingle();

    if (businessError) {
      console.error(`  Error checking business_profile:`, businessError);
    } else if (businessProfile) {
      console.log(`  Business profile exists: ${businessProfile.business_name || 'Unnamed'}`);
    } else {
      console.log(`  No business profile found for tenant`);
    }

    // Relink profile to orphaned tenant
    const { error: relinkError } = await admin
      .from('profiles')
      .update({ tenant_id: orphanedTenants.id })
      .eq('id', profile.id);

    if (relinkError) {
      console.error(`  Failed to relink profile to tenant:`, relinkError);
      recoveryResults.push({
        profile_id: profile.id,
        recovered: false,
        tenant_id: orphanedTenants.id,
        tenant_name: orphanedTenants.name,
        error: relinkError.message
      });
    } else {
      console.log(`  Successfully relinked profile to tenant`);
      recoveryResults.push({
        profile_id: profile.id,
        recovered: true,
        tenant_id: orphanedTenants.id,
        tenant_name: orphanedTenants.name
      });
    }
  }

  console.log('\n=== RECOVERY SUMMARY ===');
  const recovered = recoveryResults.filter(r => r.recovered).length;
  const failed = recoveryResults.filter(r => !r.recovered).length;
  
  console.log(`Total profiles processed: ${recoveryResults.length}`);
  console.log(`Successfully recovered: ${recovered}`);
  console.log(`Failed to recover: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed recoveries:');
    recoveryResults
      .filter(r => !r.recovered)
      .forEach(r => {
        console.log(`  - Profile ${r.profile_id}: ${r.error || 'No orphaned tenant found'}`);
      });
  }

  console.log('\n=== ORPHAN TENANT RECOVERY END ===');
}

// Run recovery
recoverOrphanTenants().catch(console.error);
