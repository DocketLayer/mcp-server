export interface DocketLayerError {
  error: {
    code: string;
    message: string;
    documentation_url: string;
    details?: Record<string, unknown>;
  };
  mcp: {
    tool_name: string;
    api_endpoint: string;
    api_status_code: number | null;
  };
}

export function walletNotConfiguredError(toolName: string, apiEndpoint: string): DocketLayerError {
  return {
    error: {
      code: 'wallet_not_configured',
      message: 'DocketLayer wallet is not configured. Paid tools require a Solana wallet with USDC for x402 settlement. See documentation_url for setup instructions.',
      documentation_url: 'https://docketlayer.ai/guides/x402',
      details: {
        free_tools_available: [
          'docketlayer_status',
          'docketlayer_court_list',
          'docketlayer_pricing',
        ],
        configuration_variable: 'DOCKETLAYER_WALLET_PRIVATE_KEY',
      },
    },
    mcp: {
      tool_name: toolName,
      api_endpoint: apiEndpoint,
      api_status_code: null,
    },
  };
}

export function apiError(
  toolName: string,
  apiEndpoint: string,
  statusCode: number,
  body: unknown,
): DocketLayerError {
  const b = body as { error?: { code?: string; message?: string; documentation_url?: string; details?: Record<string, unknown> } };
  return {
    error: {
      code: b?.error?.code ?? 'api_error',
      message: b?.error?.message ?? `API returned status ${statusCode}`,
      documentation_url: b?.error?.documentation_url ?? 'https://docketlayer.ai/reference/errors',
      details: b?.error?.details,
    },
    mcp: {
      tool_name: toolName,
      api_endpoint: apiEndpoint,
      api_status_code: statusCode,
    },
  };
}

export function errorContent(err: DocketLayerError) {
  return {
    isError: true as const,
    content: [{ type: 'text' as const, text: JSON.stringify(err, null, 2) }],
  };
}

export function successContent(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}
