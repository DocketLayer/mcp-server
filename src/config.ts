export const config = {
  walletPrivateKey:  process.env['DOCKETLAYER_WALLET_PRIVATE_KEY'] ?? null,
  apiBaseUrl:        process.env['DOCKETLAYER_API_BASE_URL'] ?? 'https://api.docketlayer.ai/v2',
  defaultLanguage:   process.env['DOCKETLAYER_DEFAULT_LANGUAGE'] ?? null,
  defaultContext:    (process.env['DOCKETLAYER_DEFAULT_CONTEXT'] ?? 'basic') as 'basic' | 'full',
  timeoutSeconds:    parseInt(process.env['DOCKETLAYER_TIMEOUT_SECONDS'] ?? '30', 10),
  logLevel:          process.env['DOCKETLAYER_LOG_LEVEL'] ?? 'info',
};

export const walletConfigured = config.walletPrivateKey !== null;
