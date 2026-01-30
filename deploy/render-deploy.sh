#!/usr/bin/env bash
set -euo pipefail

# Script to create or update a Render service and set MONGO_URI env var.
# Expects: RENDER_KEY, MONGO_URI env vars to be set

if [ -z "${RENDER_KEY:-}" ]; then echo "RENDER_KEY not set"; exit 1; fi
if [ -z "${MONGO_URI:-}" ]; then echo "MONGO_URI not set"; exit 1; fi

API="https://api.render.com/v1"
SERVICE_NAME="sistema-planejamento-api"
REPO_URL="https://github.com/wesley527/sistema-planejamento-2026.git"
BRANCH="feature/mongo-backend-deploy"

# Check if service exists
SERVICES_JSON=$(curl -sS -H "Authorization: Bearer $RENDER_KEY" "$API/services")
SERVICE_ID=$(echo "$SERVICES_JSON" | jq -r ".[] | select(.name==\"$SERVICE_NAME\") | .id" || true)

if [ -n "$SERVICE_ID" ] && [ "$SERVICE_ID" != "null" ]; then
  echo "Found existing service id: $SERVICE_ID"
else
  echo "Creating service $SERVICE_NAME..."
  CREATE_PAYLOAD=$(jq -n --arg name "$SERVICE_NAME" --arg repo "$REPO_URL" --arg branch "$BRANCH" '{name:$name, repo:$repo, branch:$branch, env:"node", plan:"starter", buildCommand:"cd server && npm ci", startCommand:"cd server && npm start", autoDeploy:true}')
  RESP=$(curl -sS -X POST "$API/services" -H "Authorization: Bearer $RENDER_KEY" -H "Content-Type: application/json" -d "$CREATE_PAYLOAD")
  SERVICE_ID=$(echo "$RESP" | jq -r '.id')
  if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then echo "Failed to create service: $RESP"; exit 1; fi
  echo "Service created: $SERVICE_ID"
fi

# Set or update MONGO_URI env var (secure)
EXISTING_ENV_ID=$(curl -sS -H "Authorization: Bearer $RENDER_KEY" "$API/services/$SERVICE_ID/env-vars" | jq -r ".[] | select(.key==\"MONGO_URI\") | .id" || true)
if [ -n "$EXISTING_ENV_ID" ] && [ "$EXISTING_ENV_ID" != "null" ]; then
  echo "Updating existing env var MONGO_URI..."
  UPD_PAYLOAD=$(jq -n --arg value "$MONGO_URI" '{value:$value, secure:true}')
  curl -sS -X PATCH "$API/services/$SERVICE_ID/env-vars/$EXISTING_ENV_ID" -H "Authorization: Bearer $RENDER_KEY" -H "Content-Type: application/json" -d "$UPD_PAYLOAD" >/dev/null
else
  echo "Creating env var MONGO_URI..."
  CREATE_ENV_PAYLOAD=$(jq -n --arg key "MONGO_URI" --arg value "$MONGO_URI" '{key:$key, value:$value, secure:true}')
  curl -sS -X POST "$API/services/$SERVICE_ID/env-vars" -H "Authorization: Bearer $RENDER_KEY" -H "Content-Type: application/json" -d "$CREATE_ENV_PAYLOAD" >/dev/null
fi

# Trigger a deploy
echo "Triggering deploy..."
curl -sS -X POST "$API/services/$SERVICE_ID/deploys" -H "Authorization: Bearer $RENDER_KEY" -H "Content-Type: application/json" -d '{"clearCache":true}' >/dev/null

# Get service URL
SERVICE_URL=$(curl -sS -H "Authorization: Bearer $RENDER_KEY" "$API/services/$SERVICE_ID" | jq -r '.serviceDetails.liveUrl')
if [ -z "$SERVICE_URL" ] || [ "$SERVICE_URL" == "null" ]; then
  SERVICE_URL="(deploy in progress)"
fi

echo "Done. Service ID: $SERVICE_ID"
echo "Service URL: $SERVICE_URL"
