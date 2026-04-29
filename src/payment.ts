import { config } from './config.js';

// Lazily initialized x402 client — only created when payment is needed.
let cachedClient: {
  createPaymentPayload(req: unknown): Promise<unknown>;
  encodeHeader(payload: unknown): Record<string, string>;
} | null = null;

async function getClient() {
  if (cachedClient) return cachedClient;

  const bs58Module = await import('bs58');
  const { decode } = bs58Module.default as { decode: (s: string) => Uint8Array };
  const { createKeyPairSignerFromBytes } = await import('@solana/signers');
  const { ExactSvmScheme } = await import('@x402/svm');
  const { x402Client, x402HTTPClient } = await import('@x402/core/client');

  // Solana private key: base58-encoded 64 bytes (keypair) or 32 bytes (scalar)
  const keyBytes = decode(config.walletPrivateKey!);
  const signer = await createKeyPairSignerFromBytes(keyBytes);

  const scheme = new ExactSvmScheme(signer);
  const client = new x402Client();
  (client as unknown as { register(n: string, s: unknown): void }).register('exact', scheme);

  const httpClient = new x402HTTPClient(client);

  cachedClient = {
    async createPaymentPayload(req: unknown) {
      return httpClient.createPaymentPayload(req as Parameters<typeof httpClient.createPaymentPayload>[0]);
    },
    encodeHeader(payload: unknown) {
      return httpClient.encodePaymentSignatureHeader(payload as Parameters<typeof httpClient.encodePaymentSignatureHeader>[0]);
    },
  };

  return cachedClient;
}

// Parse the X-Payment-Requirements header from a 402 response.
export function parsePaymentRequirements(response: Response): unknown {
  const raw = response.headers.get('X-Payment-Requirements');
  if (!raw) throw new Error('No X-Payment-Requirements header in 402 response');
  return JSON.parse(raw);
}

// Build x402 payment headers for the given payment requirements.
export async function buildPaymentHeaders(paymentRequirements: unknown): Promise<Record<string, string>> {
  const client = await getClient();
  const payload = await client.createPaymentPayload(paymentRequirements);
  return client.encodeHeader(payload);
}
