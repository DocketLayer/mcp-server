import { config, walletConfigured } from './config.js';
import { buildPaymentHeaders, parsePaymentRequirements } from './payment.js';

export interface ApiCallResult {
  ok: boolean;
  status: number;
  body: unknown;
}

// Make an API call, handling the x402 payment flow automatically.
// 1. Make the initial request (no payment header).
// 2. If 402, build payment header from requirements and retry.
// 3. Return status + body.
export async function apiCall(
  method: 'GET' | 'POST',
  path: string,
  params?: Record<string, string>,
  body?: unknown,
): Promise<ApiCallResult> {
  const url = new URL(`${config.apiBaseUrl}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, v);
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const init: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(config.timeoutSeconds * 1000),
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  // First attempt — no payment header
  let response = await fetch(url.toString(), init);

  // Handle x402 payment flow
  if (response.status === 402 && walletConfigured) {
    const requirements = parsePaymentRequirements(response);
    const paymentHeaders = await buildPaymentHeaders(requirements);
    Object.assign(headers, paymentHeaders);
    response = await fetch(url.toString(), { ...init, headers });
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  return { ok: response.ok, status: response.status, body: responseBody };
}
