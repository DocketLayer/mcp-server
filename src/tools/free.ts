import { apiCall } from '../api.js';
import { successContent, errorContent, apiError } from '../errors.js';

// ─── docketlayer_status ───────────────────────────────────────────────────────

export async function handleStatus() {
  const result = await apiCall('GET', '/status');
  if (!result.ok) {
    return errorContent(apiError('docketlayer_status', 'GET /v2/status', result.status, result.body));
  }
  return successContent(result.body);
}

// ─── docketlayer_court_list ───────────────────────────────────────────────────

export async function handleCourtList(args: { include_planned?: boolean }) {
  const includePlanned = args.include_planned !== false;
  const result = await apiCall('GET', '/status');
  if (!result.ok) {
    return errorContent(apiError('docketlayer_court_list', 'GET /v2/status', result.status, result.body));
  }

  const body = result.body as {
    courts?: unknown[];
    planned_coverage?: unknown[];
  };

  const courts = body.courts ?? [];
  const planned = includePlanned ? (body.planned_coverage ?? []) : [];

  return successContent([...courts, ...planned]);
}

// ─── docketlayer_pricing ──────────────────────────────────────────────────────

export async function handlePricing() {
  return successContent({
    currency: 'USDC',
    network: 'Solana',
    protocol: 'x402',
    per_query_usd: 0.99,
    free_endpoints: ['status', 'OPTIONS', 'sandbox'],
    documentation_url: 'https://docketlayer.ai/pricing',
  });
}
