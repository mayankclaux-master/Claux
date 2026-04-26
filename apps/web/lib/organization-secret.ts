import { randomUUID } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

type OrganizationSecretRow = {
  id: string;
  api_secret: string | null;
};

function sanitizeSecret(value: string) {
  return value.trim().toLowerCase();
}

function createApiSecret() {
  return randomUUID();
}

export async function getOrCreateOrganizationApiSecret(
  adminClient: SupabaseClient,
  orgId: string
): Promise<{ apiSecret: string; created: boolean }> {
  const { data: organizationData, error: selectError } = await adminClient
    .from("organizations")
    .select("id, api_secret")
    .eq("id", orgId)
    .maybeSingle();

  const organization = organizationData as OrganizationSecretRow | null;

  if (selectError) {
    throw new Error(`Failed to fetch organization secret: ${selectError.message}`);
  }

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const existingSecret = organization.api_secret ? sanitizeSecret(String(organization.api_secret)) : "";

  if (existingSecret) {
    return { apiSecret: existingSecret, created: false };
  }

  const generatedSecret = createApiSecret();

  const { error: updateError } = await adminClient
    .from("organizations")
    .update({ api_secret: generatedSecret })
    .eq("id", orgId)
    .is("api_secret", null);

  if (updateError) {
    throw new Error(`Failed to create organization secret: ${updateError.message}`);
  }

  const { data: refreshedData, error: refreshError } = await adminClient
    .from("organizations")
    .select("api_secret")
    .eq("id", orgId)
    .maybeSingle();

  const refreshed = refreshedData as Pick<OrganizationSecretRow, "api_secret"> | null;

  if (refreshError) {
    throw new Error(`Failed to refresh organization secret: ${refreshError.message}`);
  }

  const finalSecret = refreshed?.api_secret ? sanitizeSecret(String(refreshed.api_secret)) : "";

  if (!finalSecret) {
    throw new Error("Organization secret could not be provisioned.");
  }

  return { apiSecret: finalSecret, created: true };
}
