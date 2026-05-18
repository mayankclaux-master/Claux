# CLAUX MINIMAL N8N TOPOLOGY

**Version:** 1.0.0
**Date:** May 15, 2026
**Status:** CANONICAL N8N DEFINITION

---

## EXECUTIVE SUMMARY

This document defines the MINIMAL viable n8n topology for the CLAUX system. n8n is NOT the orchestrator - ExecutionOrchestrator handles all orchestration. n8n's role is limited to webhook bridges for provider callbacks if needed.

**Purpose:** Define minimal n8n usage to prevent unnecessary infrastructure complexity.

---

## CRITICAL ARCHITECTURAL PRINCIPLE

**n8n is NOT the orchestrator.**

**ExecutionOrchestrator (internal) handles:**
- Task orchestration
- Execution lifecycle management
- State management
- Retry logic
- Error handling
- Telemetry collection

**n8n handles ONLY:**
- Webhook bridges for provider callbacks (if needed)
- Provider API dispatch (optional, via IntegrationDispatcher)
- Nothing else

---

## N8N REQUIREMENTS ASSESSMENT

### Per-Agent n8n Requirements

**CORE:**
- n8n Role: NONE
- Reason: Internal system agent, no external providers
- n8n Required: NO

**ARIA:**
- n8n Role: Webhook bridge (optional)
- Reason: DataForSEO callbacks (if needed)
- n8n Required: NO (can use direct dispatch)

**SCRIBE:**
- n8n Role: Webhook bridge (optional)
- Reason: OpenAI callbacks (if needed)
- n8n Required: NO (can use direct dispatch)

**LOCL:**
- n8n Role: Webhook bridge (optional)
- Reason: GBP OAuth callbacks
- n8n Required: NO (can use direct dispatch)

**LINX:**
- n8n Role: Webhook bridge (optional)
- Reason: DataForSEO callbacks (if needed)
- n8n Required: NO (can use direct dispatch)

**REPUTE:**
- n8n Role: Webhook bridge (optional)
- Reason: GBP OAuth callbacks
- n8n Required: NO (can use direct dispatch)

**AMPLI:**
- n8n Role: Webhook bridge (optional)
- Reason: CMS API callbacks (if needed)
- n8n Required: NO (can use direct dispatch)

**PRISM:**
- n8n Role: NONE
- Reason: Internal data aggregation, no external providers
- n8n Required: NO

**PULSE:**
- n8n Role: Webhook bridge (optional)
- Reason: DataForSEO callbacks (if needed)
- n8n Required: NO (can use direct dispatch)

---

## MINIMAL N8N TOPOLOGY

### Option 1: NO n8n (Recommended for MVP)

**Topology:**
```
CLAUx Application
  ↓
ExecutionOrchestrator (internal)
  ↓
IntegrationDispatcher (internal)
  ↓
Direct Adapter Pattern
  ↓
Provider APIs (DataForSEO, OpenAI, GBP, CMS)
```

**Benefits:**
- No external infrastructure dependency
- Simpler deployment
- Lower cost
- Faster execution (no n8n overhead)
- Easier debugging

**Drawbacks:**
- No webhook bridge for async callbacks
- No visual workflow editor (not needed anyway)

**Recommendation:** Use this option for MVP

---

### Option 2: MINIMAL n8n for Webhook Bridges Only

**Topology:**
```
CLAUx Application
  ↓
ExecutionOrchestrator (internal)
  ↓
IntegrationDispatcher (internal)
  ↓
n8n (webhook bridges only)
  ↓
Provider APIs (DataForSEO, OpenAI, GBP, CMS)
```

**n8n Workflows Required:**

**1. DataForSEO Webhook Bridge**
- Purpose: Receive DataForSEO callbacks
- Trigger: Webhook
- Action: Forward to CLAUX API
- Complexity: Minimal

**2. OpenAI Webhook Bridge**
- Purpose: Receive OpenAI callbacks (if needed)
- Trigger: Webhook
- Action: Forward to CLAUX API
- Complexity: Minimal

**3. GBP OAuth Callback Bridge**
- Purpose: Handle GBP OAuth callbacks
- Trigger: Webhook
- Action: Exchange tokens, forward to CLAUX API
- Complexity: Low

**4. CMS Webhook Bridges (Optional)**
- Purpose: Receive CMS API callbacks (if needed)
- Trigger: Webhook
- Action: Forward to CLAUX API
- Complexity: Minimal

**Benefits:**
- Webhook bridge capability
- Visual monitoring of webhook traffic
- Easier callback debugging

**Drawbacks:**
- Additional infrastructure dependency
- Additional cost (n8n hosting)
- Additional complexity
- Slightly slower execution

**Recommendation:** Use this option only if webhook bridges are required

---

## N8N WORKFLOW DEFINITIONS (IF USED)

### Workflow 1: DataForSEO Webhook Bridge

**Workflow Name:** `dataforseo-webhook-bridge`

**Trigger:** Webhook
- Path: `/webhook/dataforseo`
- Method: POST
- Authentication: Header (X-Webhook-Secret)

**Steps:**
1. Receive webhook from DataForSEO
2. Validate webhook signature
3. Extract callback data
4. Forward to CLAUX API: `/api/integrations/dataforseo/callback`
5. Return success response

**Complexity:** Minimal (2 nodes)

---

### Workflow 2: OpenAI Webhook Bridge

**Workflow Name:** `openai-webhook-bridge`

**Trigger:** Webhook
- Path: `/webhook/openai`
- Method: POST
- Authentication: Header (X-Webhook-Secret)

**Steps:**
1. Receive webhook from OpenAI
2. Validate webhook signature
3. Extract callback data
4. Forward to CLAUX API: `/api/integrations/openai/callback`
5. Return success response

**Complexity:** Minimal (2 nodes)

---

### Workflow 3: GBP OAuth Callback Bridge

**Workflow Name:** `gbp-oauth-callback-bridge`

**Trigger:** Webhook
- Path: `/webhook/gbp/oauth`
- Method: GET
- Authentication: None (OAuth callback)

**Steps:**
1. Receive OAuth callback from Google
2. Extract authorization code
3. Exchange code for tokens
4. Forward tokens to CLAUX API: `/api/integrations/google/callback`
5. Return success response

**Complexity:** Low (3 nodes)

---

### Workflow 4: CMS Webhook Bridge (Optional)

**Workflow Name:** `cms-webhook-bridge`

**Trigger:** Webhook
- Path: `/webhook/cms`
- Method: POST
- Authentication: Header (X-Webhook-Secret)

**Steps:**
1. Receive webhook from CMS
2. Validate webhook signature
3. Extract callback data
4. Forward to CLAUX API: `/api/integrations/cms/callback`
5. Return success response

**Complexity:** Minimal (2 nodes)

---

## N8N DEPLOYMENT ARCHITECTURE

### Deployment Options

**Option 1: Self-Hosted n8n**
- Infrastructure: VPS (DigitalOcean, AWS EC2)
- Database: PostgreSQL
- Cost: $5-20/month
- Complexity: Medium
- Control: High

**Option 2: n8n Cloud**
- Infrastructure: n8n.cloud
- Cost: $20-50/month
- Complexity: Low
- Control: Medium

**Option 3: Serverless n8n (n8n in Docker on Vercel)**
- Infrastructure: Vercel
- Cost: $0-10/month
- Complexity: High
- Control: High

**Recommendation:** Self-hosted n8n on VPS (Option 1) if n8n is required

---

## N8N CONFIGURATION

### Environment Variables

**N8N_BASIC_AUTH_ACTIVE:** `true`
**N8N_BASIC_AUTH_USER:** `admin`
**N8N_BASIC_AUTH_PASSWORD:** `[secure password]`
**N8N_ENCRYPTION_KEY:** `[secure encryption key]`
**N8N_HOST:** `n8n.your-domain.com`
**N8N_PORT:** `5678`
**N8N_PROTOCOL:** `https`
**WEBHOOK_URL:** `https://n8n.your-domain.com`

### OAuth Configuration

**Google OAuth:**
- Client ID: `GOOGLE_CLIENT_ID`
- Client Secret: `GOOGLE_CLIENT_SECRET`
- Redirect URI: `https://n8n.your-domain.com/webhook/gbp/oauth`

---

## N8N MONITORING

### Health Checks

**n8n Health Endpoint:** `https://n8n.your-domain.com/healthz`

**Metrics to Monitor:**
- Workflow execution success rate
- Workflow execution duration
- Webhook response time
- Error rate per workflow
- Queue depth (if using queue mode)

### Alerting

**Alert Conditions:**
- n8n instance down
- Workflow failure rate > 5%
- Webhook response time > 5s
- Queue depth > 100

---

## N8N SECURITY

### Authentication

**Basic Auth:**
- Enabled: YES
- Username: `admin`
- Password: Secure (stored in environment variable)

**Webhook Authentication:**
- Method: Header-based (X-Webhook-Secret)
- Secret: Secure (stored in environment variable)

### Network Security

**SSL/TLS:**
- Required: YES
- Certificate: Let's Encrypt (auto-renew)

**Firewall:**
- Allow: HTTPS (443)
- Deny: All other ports

---

## N8N BACKUP AND DISASTER RECOVERY

### Backup Strategy

**Backup Frequency:** Daily
**Backup Retention:** 30 days
**Backup Location:** Offsite (S3, Backblaze)

**Backup Contents:**
- n8n database (PostgreSQL)
- n8n configuration files
- Workflow definitions (exported)

### Disaster Recovery

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 24 hours

**Recovery Steps:**
1. Spin up new n8n instance
2. Restore database from backup
3. Import workflow definitions
4. Update DNS to point to new instance
5. Test webhook endpoints

---

## N8N COST ANALYSIS

### Self-Hosted Option

**Infrastructure:**
- VPS (2 CPU, 4GB RAM): $10/month
- PostgreSQL (managed): $15/month
- SSL Certificate: $0 (Let's Encrypt)
- Domain: $10/year
- **Total:** $25/month

### n8n Cloud Option

**n8n Cloud Starter:**
- 5,000 workflow executions/month: $20/month
- Additional executions: $0.002/execution
- **Total:** $20-50/month (depending on usage)

### Cost Comparison

| Option | Monthly Cost | Annual Cost | Control | Complexity |
|--------|-------------|-------------|---------|------------|
| Self-Hosted | $25 | $300 | High | Medium |
| n8n Cloud | $20-50 | $240-600 | Medium | Low |
| NO n8n | $0 | $0 | N/A | N/A |

**Recommendation:** NO n8n for MVP (Option 1 from topology section)

---

## N8N vs DIRECT ADAPTER COMPARISON

### Direct Adapter Pattern (Current Implementation)

**Pros:**
- No external dependency
- Faster execution
- Lower cost
- Simpler deployment
- Easier debugging
- Full control over logic

**Cons:**
- No webhook bridge (not needed for most providers)
- No visual workflow editor (not needed)

### n8n Pattern

**Pros:**
- Webhook bridge capability
- Visual workflow editor (not needed)
- Easier for non-technical users (not needed)

**Cons:**
- External dependency
- Slower execution
- Higher cost
- More complex deployment
- Harder debugging
- Less control over logic

---

## RECOMMENDATION

### For MVP: NO n8n

**Rationale:**
- Direct adapter pattern already implemented
- No webhook bridges needed for MVP
- ExecutionOrchestrator handles all orchestration
- Lower cost
- Simpler deployment
- Faster execution

**Action:**
- Do not deploy n8n for MVP
- Use direct adapter pattern
- Implement webhook bridges in Next.js API routes if needed

### For Post-MVP: MINIMAL n8n (If Needed)

**Rationale:**
- If webhook bridges become complex
- If visual monitoring becomes valuable
- If non-technical users need to modify workflows

**Action:**
- Deploy minimal n8n instance
- Implement only webhook bridge workflows
- Keep n8n as optional feature
- Maintain direct adapter fallback

---

## N8N MIGRATION PATH (IF NEEDED LATER)

### Phase 1: Assessment
- Evaluate if webhook bridges are needed
- Assess complexity of callback handling
- Determine if visual monitoring adds value

### Phase 2: n8n Deployment
- Deploy self-hosted n8n instance
- Configure authentication
- Set up SSL/TLS

### Phase 3: Workflow Creation
- Create minimal webhook bridge workflows
- Test webhook endpoints
- Implement callback forwarding

### Phase 4: Integration
- Update IntegrationDispatcher to use n8n
- Implement fallback to direct adapter
- Monitor n8n health

### Phase 5: Validation
- Test all webhook bridges
- Validate callback handling
- Monitor performance
- Roll back if issues

---

## CONCLUSION

The minimal n8n topology for CLAUX is: **NO n8n for MVP**.

The ExecutionOrchestrator handles all orchestration, and the direct adapter pattern provides all necessary functionality without the complexity and cost of n8n.

If webhook bridges become necessary post-MVP, a minimal n8n deployment with only webhook bridge workflows can be added.

**Status:** NO n8N REQUIRED FOR MVP
