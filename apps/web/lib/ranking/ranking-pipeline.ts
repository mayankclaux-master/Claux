/**
 * Ranking Pipeline
 * Implements ranking lifecycle: seeds, tracked keywords, history, movement, volatility
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface RankingSeed {
  keyword: string;
  seed_type: 'manual' | 'discovered' | 'competitor';
  opportunity_score: number;
}

export interface RankingSnapshot {
  keyword: string;
  position: number;
  search_volume: number;
  difficulty: number;
}

/**
 * Create ranking seeds
 */
export async function createRankingSeeds(
  tenantId: string,
  workspaceId: string,
  seeds: RankingSeed[]
): Promise<{ success: boolean; created: number; errors: string[] }> {
  const supabase = createSupabaseAdminClient();
  const errors: string[] = [];

  try {
    const inserts = seeds.map(seed => ({
      tenant_id: tenantId,
      workspace_id: workspaceId,
      keyword: seed.keyword,
      seed_type: seed.seed_type,
      opportunity_score: seed.opportunity_score,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('ranking_seeds').insert(inserts);

    if (error) {
      errors.push(error.message);
      return { success: false, created: 0, errors };
    }

    return { success: true, created: seeds.length, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, created: 0, errors };
  }
}

/**
 * Record ranking snapshot
 */
export async function recordRankingSnapshot(
  tenantId: string,
  snapshots: RankingSnapshot[]
): Promise<{ success: boolean; recorded: number; errors: string[] }> {
  const supabase = createSupabaseAdminClient();
  const errors: string[] = [];

  try {
    const inserts = snapshots.map(snapshot => ({
      tenant_id: tenantId,
      keyword: snapshot.keyword,
      position: snapshot.position,
      search_volume: snapshot.search_volume,
      difficulty: snapshot.difficulty,
      recorded_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('ranking_history').insert(inserts);

    if (error) {
      errors.push(error.message);
      return { success: false, recorded: 0, errors };
    }

    // Calculate movements
    await calculateRankingMovements(tenantId, snapshots);

    return { success: true, recorded: snapshots.length, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, recorded: 0, errors };
  }
}

/**
 * Calculate ranking movements
 */
async function calculateRankingMovements(
  tenantId: string,
  currentSnapshots: RankingSnapshot[]
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  for (const snapshot of currentSnapshots) {
    // Get previous position
    const { data: previous } = await supabase
      .from('ranking_history')
      .select('position')
      .eq('tenant_id', tenantId)
      .eq('keyword', snapshot.keyword)
      .order('recorded_at', { ascending: false })
      .limit(2);

    if (previous && previous.length > 1) {
      const previousPosition = previous[1].position;
      const movement = snapshot.position - previousPosition;
      const movementType = movement > 0 ? 'loss' : movement < 0 ? 'gain' : 'stable';

      await supabase.from('ranking_movements').insert({
        tenant_id: tenantId,
        keyword: snapshot.keyword,
        previous_position: previousPosition,
        current_position: snapshot.position,
        movement: Math.abs(movement),
        movement_type: movementType,
        recorded_at: new Date().toISOString(),
      });
    }
  }
}

/**
 * Calculate ranking volatility
 */
export async function calculateRankingVolatility(
  tenantId: string,
  keyword: string,
  periodDays: number = 30
): Promise<{ success: boolean; volatility_score?: number; volatility_level?: string; error?: string }> {
  const supabase = createSupabaseAdminClient();

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const { data: history } = await supabase
      .from('ranking_history')
      .select('position')
      .eq('tenant_id', tenantId)
      .eq('keyword', keyword)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (!history || history.length < 2) {
      return { success: false, error: 'Insufficient data for volatility calculation' };
    }

    const positions = history.map(h => h.position);
    const mean = positions.reduce((a, b) => a + b, 0) / positions.length;
    const variance = positions.reduce((sum, pos) => sum + Math.pow(pos - mean, 2), 0) / positions.length;
    const volatilityScore = Math.sqrt(variance);

    let volatilityLevel = 'low';
    if (volatilityScore > 5) volatilityLevel = 'high';
    else if (volatilityScore > 2) volatilityLevel = 'medium';

    // Store volatility
    await supabase.from('ranking_volatility').insert({
      tenant_id: tenantId,
      keyword: keyword,
      volatility_score: volatilityScore,
      volatility_level: volatilityLevel,
      period_days: periodDays,
      calculated_at: new Date().toISOString(),
    });

    return { success: true, volatility_score: volatilityScore, volatility_level: volatilityLevel };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get ranking history for keyword
 */
export async function getRankingHistory(
  tenantId: string,
  keyword: string,
  limit: number = 30
): Promise<{ success: boolean; history?: any[]; error?: string }> {
  const supabase = createSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from('ranking_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('keyword', keyword)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, history: data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get ranking movements for tenant
 */
export async function getRankingMovements(
  tenantId: string,
  limit: number = 100
): Promise<{ success: boolean; movements?: any[]; error?: string }> {
  const supabase = createSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from('ranking_movements')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, movements: data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
