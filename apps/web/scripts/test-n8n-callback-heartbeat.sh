#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
TENANT_ID="${TENANT_ID:-}"
API_SECRET="${API_SECRET:-}"
AGENT_NAME="${AGENT_NAME:-ARIA}"
TASK_ID="${TASK_ID:-$(uuidgen | tr '[:upper:]' '[:lower:]')}"
PROGRESS="${PROGRESS:-42}"

if [[ -z "$TENANT_ID" || -z "$API_SECRET" ]]; then
  echo "Usage: TENANT_ID=<uuid> API_SECRET=<secret> [APP_URL=http://localhost:3000] [AGENT_NAME=ARIA] [TASK_ID=<uuid>] [PROGRESS=42] bash apps/web/scripts/test-n8n-callback-heartbeat.sh"
  exit 1
fi

curl -sS -X POST "$APP_URL/api/v1/orchestrator/n8n-callback" \
  -H "Content-Type: application/json" \
  -H "x-claux-secret: $API_SECRET" \
  -d "{\"tenant_id\":\"$TENANT_ID\",\"task_id\":\"$TASK_ID\",\"event\":\"heartbeat\",\"agent_name\":\"$AGENT_NAME\",\"progress\":$PROGRESS,\"status_message\":\"Manual heartbeat sanity check\",\"payload\":{\"source\":\"manual_sanity_script\"}}"

echo
echo "Sent heartbeat for $AGENT_NAME (task_id=$TASK_ID, progress=$PROGRESS) to $APP_URL/api/v1/orchestrator/n8n-callback"
