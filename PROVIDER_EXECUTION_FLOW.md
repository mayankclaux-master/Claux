# PROVIDER EXECUTION FLOW

**Phase:** Phase Z1 - Integration Mesh Foundation + Canonical API Topology  
**Status:** COMPLETED

## CANONICAL FLOW

```
Agent Task
→ RuntimeService
→ ExecutionOrchestrator
→ Integration Adapter
→ Integration Dispatcher
→ n8n Webhook
→ External Provider
→ Provider Response
→ Callback/Webhook (if async)
→ Runtime Event
→ Task Completion
```

## SYNCHRONOUS FLOW

1. Agent task triggers integration
2. RuntimeService creates integration request
3. IntegrationDispatcher dispatches to n8n
4. n8n calls provider synchronously
5. Provider returns response
6. n8n returns response to callback endpoint
7. Callback ingestion validates and processes
8. Runtime event emitted
9. Task completes

## ASYNCHRONOUS FLOW

1. Agent task triggers integration
2. RuntimeService creates integration request
3. IntegrationDispatcher dispatches to n8n
4. n8n initiates async provider operation
5. Provider acknowledges (pending status)
6. Task marked as pending
7. Provider completes operation
8. Provider sends webhook callback
9. Callback ingestion validates and processes
10. Runtime event emitted
11. Task completes

## PROVIDER REGISTRY

**Supported Providers:**
- DataForSEO
- OpenAI
- Google Search Console
- Google Business Profile
- WordPress
- Shopify
- Webflow
- Ghost

## SUCCESS CRITERIA

✅ All provider execution follows canonical flow
✅ No direct provider calls in agents
✅ All execution flows through integration dispatcher
✅ Callback ingestion handles async completion
✅ Replay-safe execution
✅ Observable execution
