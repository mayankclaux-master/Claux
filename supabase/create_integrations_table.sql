-- Create integrations table for Phase 1: Integrations Layer
-- Stores per-tenant integration credentials securely with encryption

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'google',
  
  -- Google OAuth tokens (encrypted)
  google_access_token_encrypted TEXT,
  google_refresh_token_encrypted TEXT,
  google_token_expires_at TIMESTAMPTZ,
  google_connected_email TEXT,
  
  -- Google service properties
  search_console_property TEXT,
  ga4_property_id TEXT,
  ga4_account_id TEXT,
  gbp_account_id TEXT,
  gbp_location_id TEXT,
  
  -- WordPress CMS
  wp_site_url TEXT,
  wp_username TEXT,
  wp_app_password_encrypted TEXT,
  
  -- Shopify CMS
  shopify_store_url TEXT,
  shopify_access_token_encrypted TEXT,
  shopify_blog_id TEXT,
  
  -- Custom API
  custom_api_url TEXT,
  custom_api_key_encrypted TEXT,
  
  -- Connection status
  google_status TEXT NOT NULL DEFAULT 'not_connected',
  wp_status TEXT NOT NULL DEFAULT 'not_connected',
  shopify_status TEXT NOT NULL DEFAULT 'not_connected',
  custom_status TEXT NOT NULL DEFAULT 'not_connected',
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_tenant_id ON integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_google_status ON integrations(google_status);
CREATE INDEX IF NOT EXISTS idx_integrations_wp_status ON integrations(wp_status);
CREATE INDEX IF NOT EXISTS idx_integrations_shopify_status ON integrations(shopify_status);

-- RLS policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations"
  ON integrations FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert integrations"
  ON integrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update integrations"
  ON integrations FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "System can delete integrations"
  ON integrations FOR DELETE
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integrations_updated_at_trigger
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_updated_at();

-- Add CHECK constraints for status fields
ALTER TABLE integrations
  ADD CONSTRAINT google_status_check 
  CHECK (google_status IN ('not_connected', 'connected', 'error', 'expired'));

ALTER TABLE integrations
  ADD CONSTRAINT wp_status_check 
  CHECK (wp_status IN ('not_connected', 'connected', 'error'));

ALTER TABLE integrations
  ADD CONSTRAINT shopify_status_check 
  CHECK (shopify_status IN ('not_connected', 'connected', 'error'));

ALTER TABLE integrations
  ADD CONSTRAINT custom_status_check 
  CHECK (custom_status IN ('not_connected', 'connected', 'error'));
