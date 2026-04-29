import { apiCall } from '../api.js';
import { config, walletConfigured } from '../config.js';
import {
  walletNotConfiguredError,
  apiError,
  successContent,
  errorContent,
} from '../errors.js';

// ─── Guard: paid tool called without wallet ───────────────────────────────────

function requireWallet(toolName: string, apiEndpoint: string) {
  if (!walletConfigured) {
    return errorContent(walletNotConfiguredError(toolName, apiEndpoint));
  }
  return null;
}

// ─── docketlayer_case_query ───────────────────────────────────────────────────

export async function handleCaseQuery(args: {
  case_id: string;
  court_code: string;
  last_checked?: string;
  context?: 'basic' | 'full';
  language?: 'en' | 'fr';
  filing_types?: string;
}) {
  const guard = requireWallet('docketlayer_case_query', 'GET /v2/case');
  if (guard) return guard;

  const params: Record<string, string> = {
    case_id: args.case_id,
    court_code: args.court_code,
  };
  if (args.last_checked) params['last_checked'] = args.last_checked;
  if (args.context ?? config.defaultContext) params['context'] = args.context ?? config.defaultContext;
  if (args.language ?? config.defaultLanguage) params['language'] = (args.language ?? config.defaultLanguage)!;
  if (args.filing_types) params['filing_types'] = args.filing_types;

  const result = await apiCall('GET', '/case', params);
  if (!result.ok) {
    return errorContent(apiError('docketlayer_case_query', 'GET /v2/case', result.status, result.body));
  }
  return successContent(result.body);
}

// ─── docketlayer_case_monitor ─────────────────────────────────────────────────

export async function handleCaseMonitor(args: {
  case_id: string;
  court_code: string;
  last_checked: string;
}) {
  const guard = requireWallet('docketlayer_case_monitor', 'GET /v2/monitor');
  if (guard) return guard;

  const result = await apiCall('GET', '/monitor', {
    case_id: args.case_id,
    court_code: args.court_code,
    last_checked: args.last_checked,
  });
  if (!result.ok) {
    return errorContent(apiError('docketlayer_case_monitor', 'GET /v2/monitor', result.status, result.body));
  }
  return successContent(result.body);
}

// ─── docketlayer_case_batch ───────────────────────────────────────────────────

export async function handleCaseBatch(args: {
  queries: Array<{
    case_id: string;
    court_code: string;
    last_checked?: string;
    context?: 'basic' | 'full';
    language?: 'en' | 'fr';
    filing_types?: string;
  }>;
}) {
  const guard = requireWallet('docketlayer_case_batch', 'POST /v2/cases/batch');
  if (guard) return guard;

  const result = await apiCall('POST', '/cases/batch', undefined, { queries: args.queries });
  if (!result.ok) {
    return errorContent(apiError('docketlayer_case_batch', 'POST /v2/cases/batch', result.status, result.body));
  }
  return successContent(result.body);
}

// ─── docketlayer_wallet_info ──────────────────────────────────────────────────

export async function handleWalletInfo(args: {
  include_deliveries?: boolean;
  deliveries_limit?: number;
}) {
  const guard = requireWallet('docketlayer_wallet_info', 'GET /v2/wallet/keys');
  if (guard) return guard;

  const includeDel = args.include_deliveries !== false;

  const keysResult = await apiCall('GET', '/wallet/keys');
  if (!keysResult.ok) {
    return errorContent(apiError('docketlayer_wallet_info', 'GET /v2/wallet/keys', keysResult.status, keysResult.body));
  }

  if (!includeDel) {
    return successContent({ keys: keysResult.body });
  }

  const delResult = await apiCall('GET', '/wallet/deliveries', {
    limit: String(args.deliveries_limit ?? 50),
  });
  if (!delResult.ok) {
    return errorContent(apiError('docketlayer_wallet_info', 'GET /v2/wallet/deliveries', delResult.status, delResult.body));
  }

  return successContent({ keys: keysResult.body, deliveries: delResult.body });
}
