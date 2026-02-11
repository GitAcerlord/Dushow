#!/usr/bin/env node
// Usage: node send_webhook_test.js [WEBHOOK_URL] [WEBHOOK_SECRET]
// Defaults: WEBHOOK_URL=http://localhost:54321/functions/v1/asaas-webhook

const fs = require('fs');

const WEBHOOK_URL = process.argv[2] || process.env.WEBHOOK_URL || 'http://localhost:54321/functions/v1/asaas-webhook';
const WEBHOOK_SECRET = process.argv[3] || process.env.WEBHOOK_SECRET || 'test-secret';
const PAYLOAD_PATH = __dirname + '/asaas_payment_example.json';

async function main() {
  try {
    const raw = fs.readFileSync(PAYLOAD_PATH, 'utf8');
    const payload = JSON.parse(raw);

    console.log('Enviando payload para', WEBHOOK_URL);

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-asaas-signature': WEBHOOK_SECRET
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Resposta:', text);
  } catch (err) {
    console.error('Erro ao enviar webhook:', err);
    process.exit(1);
  }
}

main();
