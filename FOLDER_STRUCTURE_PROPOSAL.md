# CLAUX Folder Structure Proposal
**Phase 1 / Sprint 1 - Agent Runtime Foundation**

---

## Overview

This document defines the long-term folder structure for CLAUX to support 9+ agents, event-driven workflows, runtime infrastructure, and enterprise scale.

---

## CRITICAL: Runtime Location

**Runtime infrastructure is located in `apps/web/lib/` NOT repo root `/lib/`**

This ensures:
- Isolation from production routes
- Clear separation of concerns
- Easier testing and validation
- No impact on existing systems

Runtime must remain sandboxed until full validation complete.

---

## Proposed Structure

```
claux-master/
├── apps/
│   ├── api/                          # API layer (Next.js API routes)
│   │   ├── app/
│   │   │   └── api/
│   │   │       ├── inngest/         # Inngest webhook endpoint
│   │   │       │   └── route.ts
│   │   │       ├── agents/          # Agent API endpoints
│   │   │       │   ├── locl/
│   │   │       │   ├── aria/
│   │   │       │   └── ...
│   │   │       └── webhooks/        # Webhook handlers
│   │   └── lib/
│   │       └── runtime/             # API-specific runtime utilities
│   │
│   └── web/                         # Next.js web application
│       ├── app/
│       │   ├── dashboard/           # Dashboard UI
│       │   ├── agents/              # Agent management UI
│       │   ├── executions/          # Execution monitoring UI
│       │   ├── events/              # Event stream UI
│       │   └── settings/            # Settings UI
│       ├── components/
│       │   ├── agents/              # Agent-specific components
│       │   ├── executions/          # Execution timeline components
│       │   └── observability/        # Observability components
│       └── lib/                     # SHARED RUNTIME INFRASTRUCTURE (SANDBOXED)
│           ├── runtime/             # Core runtime SDK
│           │   ├── types.ts         # Runtime type definitions
│           │   ├── errors.ts        # Standardized error types
│           │   ├── database.ts      # Database operations
│           │   ├── sdk.ts           # Agent Runtime SDK
│           │   └── index.ts         # Runtime exports
│           │
│           ├── events/              # Event system
│           │   ├── types.ts         # Event type definitions (RESTRICTED: 5 core events)
│           │   ├── emitter.ts       # Event emitter
│           │   ├── listener.ts      # Event listener registry
│           │   └── index.ts         # Event exports
│           │
│           ├── workflows/           # Workflow infrastructure
│           │   ├── inngest-client.ts # Inngest client configuration
│           │   ├── base-workflow.ts  # Base workflow class
│           │   └── index.ts         # Workflow exports
│           │
│           ├── observability/       # Observability layer
│           │   ├── tracer.ts        # Execution tracer
│           │   ├── metrics.ts       # Metrics collection
│           │   ├── alerts.ts        # Alerting system (future)
│           │   └── index.ts         # Observability exports
│           │
│           ├── integrations/        # Shared integrations
│           │   ├── openai/          # OpenAI integration
│           │   │   ├── client.ts
│           │   │   ├── helpers.ts
│           │   │   └── index.ts
│           │   ├── supabase/        # Supabase utilities
│           │   │   ├── client.ts
│           │   │   ├── auth.ts
│           │   │   └── index.ts
│           │   └── clerk/           # Clerk utilities
│           │       ├── client.ts
│           │       └── index.ts
│           │
│           └── utils/              # Shared utilities
│               ├── logger.ts       # Logging utilities
│               ├── validator.ts    # Validation utilities
│               ├── formatter.ts    # Formatting utilities
│               └── index.ts
│
├── agents/                           # Agent implementations
│   ├── locl/                        # LOCL Agent (GMB audits)
│   │   ├── workflows/               # LOCL-specific workflows
│   │   │   ├── audit-workflow.ts
│   │   │   └── followup-workflow.ts
│   │   ├── tasks/                   # LOCL-specific tasks
│   │   │   ├── fetch-gmb-data.ts
│   │   │   ├── analyze-audit.ts
│   │   │   └── generate-report.ts
│   │   ├── integrations/            # LOCL integrations
│   │   │   ├── google-my-business.ts
│   │   │   └── google-maps-api.ts
│   │   ├── events.ts                # LOCL event definitions
│   │   ├── config.ts                # LOCL configuration
│   │   └── index.ts                 # LOCL agent entry point
│   │
│   ├── aria/                        # ARIA Agent (Content generation)
│   │   ├── workflows/
│   │   ├── tasks/
│   │   ├── integrations/
│   │   ├── events.ts
│   │   ├── config.ts
│   │   └── index.ts
│   │
│   ├── publish/                     # PUBLISH Agent (CMS publishing)
│   │   ├── workflows/
│   │   ├── tasks/
│   │   ├── integrations/
│   │   │   ├── wordpress.ts
│   │   │   ├── webflow.ts
│   │   │   └── shopify.ts
│   │   ├── events.ts
│   │   ├── config.ts
│   │   └── index.ts
│   │
│   ├── pulse/                       # PULSE Agent (Rankings monitoring)
│   │   ├── workflows/
│   │   ├── tasks/
│   │   ├── integrations/
│   │   ├── events.ts
│   │   ├── config.ts
│   │   └── index.ts
│   │
│   ├── core/                        # CORE Agent (Central orchestration)
│   ├── repute/                      # REPUTE Agent (Reputation management)
│   ├── ampli/                       # AMPLI Agent (Amplification)
│   ├── prism/                       # PRISM Agent (Analytics)
│   ├── linx/                        # LINX Agent (Link building)
│   └── scribe/                      # SCRIBE Agent (Documentation)
│
├── workflows/                       # Cross-agent workflows
│   ├── audit-to-content/            # LOCL → ARIA workflow
│   │   ├── workflow.ts
│   │   └── config.ts
│   ├── content-to-publish/         # ARIA → PUBLISH workflow
│   │   ├── workflow.ts
│   │   └── config.ts
│   └── multi-agent/                # Complex multi-agent workflows
│       ├── full-seo-cycle.ts
│       └── config.ts
│
├── supabase/                        # Database migrations and functions
│   ├── migrations/                  # Database migrations
│   │   ├── 20250109_create_agent_executions_table.sql
│   │   ├── 20250109_create_agent_tasks_table.sql
│   │   ├── 20250109_create_agent_events_table.sql
│   │   ├── 20250109_create_agent_logs_table.sql
│   │   └── ...                     # Future migrations
│   │
│   ├── functions/                   # Supabase edge functions
│   │   ├── agent-trigger/
│   │   └── webhook-handler/
│   │
│   └── stored-procedures/          # Stored procedures
│       ├── create_agent_run_atomic.sql
│       └── ...                     # Existing procedures
│
├── examples/                        # Example implementations
│   ├── locl-audit-workflow.ts       # LOCL workflow example
│   ├── event-driven-patterns.ts     # Event pattern examples
│   ├── custom-integration.ts        # Integration example
│   └── README.md                   # Examples documentation
│
├── tests/                           # Test suite
│   ├── unit/                       # Unit tests
│   │   ├── runtime/
│   │   ├── events/
│   │   └── workflows/
│   ├── integration/                # Integration tests
│   │   ├── agents/
│   │   └── database/
│   └── e2e/                        # End-to-end tests
│       └── workflows/
│
├── docs/                           # Documentation
│   ├── architecture/               # Architecture docs
│   │   ├── runtime-architecture.md
│   │   ├── event-system.md
│   │   └── workflow-orchestration.md
│   ├── agents/                     # Agent documentation
│   │   ├── locl/
│   │   ├── aria/
│   │   └── ...
│   ├── api/                        # API documentation
│   │   ├── endpoints.md
│   │   └── events.md
│   └── guides/                     # User guides
│       ├── getting-started.md
│       ├── agent-development.md
│       └── workflow-creation.md
│
├── scripts/                        # Utility scripts
│   ├── migrate-agents.ts           # Agent migration script
│   ├── seed-database.ts            # Database seeding
│   └── generate-types.ts           # Type generation
│
├── .github/                        # GitHub configuration
│   ├── workflows/                  # GitHub Actions
│   │   ├── ci.yml
│   │   ├── deploy.yml
│   │   └── test.yml
│   └── ISSUE_TEMPLATE/            # Issue templates
│
├── package.json                    # Root package.json
├── tsconfig.json                   # Root TypeScript config
├── turbo.json                      # Turborepo config (if using monorepo)
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── README.md                       # Project README
└── AGENT_RUNTIME_ARCHITECTURE_REPORT.md  # Architecture report
```

---

## Folder Descriptions

### apps/
Contains the application layer split by function.

**api/**: Next.js API routes for agent execution, webhooks, and Inngest integration.
**web/**: Next.js web application for dashboard, monitoring, and agent management.

### agents/
Contains individual agent implementations. Each agent has its own directory with:
- **workflows/**: Agent-specific workflows
- **tasks/**: Reusable task implementations
- **integrations/**: Third-party service integrations
- **events.ts**: Agent-specific event definitions
- **config.ts**: Agent configuration
- **index.ts**: Agent entry point

### lib/
Shared runtime infrastructure used across all agents.

**runtime/**: Core Agent Runtime SDK
- Execution lifecycle management
- Database operations
- Error handling
- Cost tracking

**events/**: Event-driven architecture
- Typed event definitions
- Event emitter
- Event listener registry

**workflows/**: Workflow infrastructure
- Inngest client configuration
- Base workflow class
- Workflow utilities

**observability/**: Observability layer
- Execution tracing
- Metrics collection
- Diagnostics

**integrations/**: Shared third-party integrations
- OpenAI
- Supabase
- Clerk
- Future integrations

**utils/**: Shared utility functions
- Logging
- Validation
- Formatting

### workflows/
Cross-agent workflows that orchestrate multiple agents.

### supabase/
Database migrations, edge functions, and stored procedures.

**migrations/**: Database schema migrations
**functions/**: Supabase edge functions
**stored-procedures/**: Database stored procedures

### examples/
Example implementations demonstrating runtime usage.

### tests/
Test suite organized by type.

**unit/**: Unit tests for individual components
**integration/**: Integration tests for component interactions
**e2e/**: End-to-end tests for complete workflows

### docs/
Project documentation.

**architecture/**: System architecture documentation
**agents/**: Agent-specific documentation
**api/**: API documentation
**guides/**: User guides and tutorials

### scripts/
Utility scripts for development and maintenance.

### .github/
GitHub configuration including Actions workflows and issue templates.

---

## Migration Path

### Current Structure
```
claux-master/
├── agents/ (empty)
├── apps/
│   ├── api/ (empty)
│   └── web/
│       └── lib/                    # ✅ Runtime infrastructure MOVED here
│           ├── runtime/            # ✅ Complete
│           ├── events/             # ✅ Complete (RESTRICTED: 5 core events)
│           ├── workflows/          # ✅ Complete
│           └── observability/      # ✅ Complete
├── lib/ (empty)                    # ✅ Emptied - runtime moved to apps/web/lib/
├── supabase/
└── ...
```

### Migration Steps

1. **Move runtime to apps/web/lib/** (✅ Complete)
   - Moved runtime SDK from lib/runtime/ to apps/web/lib/runtime/
   - Moved event system from lib/events/ to apps/web/lib/events/
   - Moved workflow infrastructure from lib/workflows/ to apps/web/lib/workflows/
   - Moved observability layer from lib/observability/ to apps/web/lib/observability/
   - Restricted event taxonomy to 5 core events

2. **Create agents/** structure (Sprint 2 - LOCL only)
   - Create LOCL agent directory
   - Migrate existing LOCL agent logic to use new SDK
   - DO NOT create other agents until LOCL validated

3. **Create apps/api/** structure (Sprint 2)
   - Set up Inngest API route at apps/api/app/api/inngest/route.ts
   - Test event routing with restricted 5-event taxonomy

4. **Create workflows/** structure (Sprint 3 - after LOCL validation)
   - Define cross-agent workflows
   - Implement orchestration patterns

5. **Create tests/** structure (Sprint 2 - runtime validation)
   - Add unit tests for runtime components
   - Add integration tests for execution recovery
   - Add e2e tests for retry logic

6. **Create docs/** structure (Sprint 3)
   - Document architecture
   - Document agents
   - Create user guides

---

## Naming Conventions

### Files
- **TypeScript files**: kebab-case (e.g., `agent-runtime-sdk.ts`)
- **Test files**: `.test.ts` or `.spec.ts` suffix
- **Migration files**: `YYYYMMDD_description.sql`

### Directories
- **All directories**: kebab-case (e.g., `agent-runtime`, `event-system`)

### Code
- **Classes**: PascalCase (e.g., `AgentRuntimeSDK`)
- **Functions/Variables**: camelCase (e.g., `createExecution`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (e.g., `AgentExecution`)

---

## Import Paths

### Runtime Imports (from apps/web/lib/)
```typescript
import { AgentRuntimeSDK } from '@/app/web/lib/runtime/sdk';
import { EventEmitter } from '@/app/web/lib/events/emitter';
import { BaseWorkflow } from '@/app/web/lib/workflows/base-workflow';
import { ExecutionTracer } from '@/app/web/lib/observability/tracer';
```

### Agent Imports
```typescript
import { LOCLAuditWorkflow } from '@/agents/locl/workflows/audit-workflow';
import { fetchGMBData } from '@/agents/locl/tasks/fetch-gmb-data';
```

### Integration Imports (from apps/web/lib/)
```typescript
import { openaiClient } from '@/app/web/lib/integrations/openai/client';
import { supabaseClient } from '@/app/web/lib/integrations/supabase/client';
```

---

## Monorepo Considerations

If using Turborepo or Nx monorepo:

```
claux-master/
├── apps/
│   ├── web/                        # Next.js web app
│   ├── api/                        # Next.js API
│   └── admin/                      # Admin dashboard (future)
├── packages/
│   ├── runtime/                    # Runtime SDK package
│   ├── events/                     # Event system package
│   ├── workflows/                  # Workflow infrastructure package
│   └── observability/              # Observability package
├── agents/
│   ├── locl/                       # LOCL agent package
│   ├── aria/                       # ARIA agent package
│   └── ...
└── turbo.json
```

This structure allows:
- Independent package versioning
- Shared dependencies management
- Faster builds with caching
- Clear separation of concerns

---

## Summary

The proposed folder structure provides:
- **Clear separation** between agents, runtime, and application layers
- **Runtime isolation** in apps/web/lib/ for safe testing
- **Scalability** for 9+ agents and future growth
- **Maintainability** through logical organization
- **Extensibility** for new agents and integrations
- **Testability** with dedicated test directories
- **Documentation** alongside code

The structure supports the event-driven architecture and provides a solid foundation for enterprise-scale agent orchestration.

---

**Document Version**: 1.1  
**Date**: January 9, 2025  
**Sprint**: Phase 1 / Sprint 1  
**Status**: Complete with Runtime Location Correction
