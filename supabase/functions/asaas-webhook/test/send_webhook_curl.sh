#!/usr/bin/env bash
# Usage:
# WEBHOOK_URL=http://localhost:54321/functions/v1/asaas-webhook WEBHOOK_SECRET=test-secret ./send_webhook_curl.sh asaas_payment_example.json

PAYLOAD_NAME="$1"
WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:54321/functions/v1/asaas-webhook}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-test-secret}"
TEST_DIR="$(dirname "$0")"

if [ -z "$PAYLOAD_NAME" ]; then
  echo "Usage: $0 <payload-file>"
  echo "Available payloads: asaas_payment_example.json, asaas_transfer_example.json, asaas_refund_example.json"
  exit 1
fi

PAYLOAD_PATH="$TEST_DIR/$PAYLOAD_NAME"
if [ ! -f "$PAYLOAD_PATH" ]; then
  echo "Payload not found: $PAYLOAD_PATH"
  exit 1
fi

echo "POST $PAYLOAD_PATH -> $WEBHOOK_URL"

curl -s -w "\nStatus: %{http_code}\n" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-asaas-signature: $WEBHOOK_SECRET" \
  --data-binary "@$PAYLOAD_PATH"
