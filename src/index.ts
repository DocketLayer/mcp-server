#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { config } from './config.js';
import { handleStatus, handleCourtList, handlePricing } from './tools/free.js';
import {
  handleCaseQuery,
  handleCaseMonitor,
  handleCaseBatch,
  handleWalletInfo,
} from './tools/paid.js';

const server = new McpServer({
  name: 'docketlayer',
  version: '1.0.0',
});

// ─── Free tools ───────────────────────────────────────────────────────────────

server.tool(
  'docketlayer_status',
  'Get DocketLayer\'s current operational status, supported courts, and coverage gaps. Free; no wallet required.',
  {},
  async () => handleStatus()
);

server.tool(
  'docketlayer_court_list',
  'List courts DocketLayer covers or plans to cover, with court_code, name, jurisdiction_country, language, and case_id format. Free; no wallet required.',
  {
    include_planned: z.boolean().optional().describe('Include planned coverage. Default: true.'),
  },
  async (args) => handleCourtList(args)
);

server.tool(
  'docketlayer_pricing',
  'Get DocketLayer\'s pricing model. Returns per-query cost, free endpoints, and payment requirements. Free; no wallet required.',
  {},
  async () => handlePricing()
);

// ─── Paid tools ───────────────────────────────────────────────────────────────

server.tool(
  'docketlayer_case_query',
  'Query a court case for current context and recent docket activity. Costs $0.99 per successful query, settled in USDC via x402. Requires wallet configuration.',
  {
    case_id:      z.string().describe('Case identifier in the format expected for court_code.'),
    court_code:   z.string().describe('Court identifier. Use docketlayer_court_list to see covered courts.'),
    last_checked: z.string().optional().describe('ISO-8601 timestamp of last query. If supplied, response includes a delta block.'),
    context:      z.enum(['basic', 'full']).optional().describe('Depth of context. Default: basic.'),
    language:     z.enum(['en', 'fr']).optional().describe('Preferred response language for bilingual jurisdictions.'),
    filing_types: z.string().optional().describe('Comma-separated filing types to filter the delta.'),
  },
  async (args) => handleCaseQuery(args)
);

server.tool(
  'docketlayer_case_monitor',
  'Check whether a case has changed since a given timestamp. Slimmer than case_query for high-frequency monitoring. Costs $0.99 per call.',
  {
    case_id:      z.string(),
    court_code:   z.string(),
    last_checked: z.string().describe('ISO-8601 timestamp with timezone offset.'),
  },
  async (args) => handleCaseMonitor(args)
);

server.tool(
  'docketlayer_case_batch',
  'Query up to 50 cases in a single call. Each successful case costs $0.99; failed cases are not billed.',
  {
    queries: z.array(z.object({
      case_id:      z.string(),
      court_code:   z.string(),
      last_checked: z.string().optional(),
      context:      z.enum(['basic', 'full']).optional(),
      language:     z.enum(['en', 'fr']).optional(),
      filing_types: z.string().optional(),
    })).min(1).max(50),
  },
  async (args) => handleCaseBatch(args)
);

server.tool(
  'docketlayer_wallet_info',
  'Return the configured wallet\'s signing-key state and recent callback delivery history. Costs $1.98 (two API calls).',
  {
    include_deliveries: z.boolean().optional().describe('Include callback delivery history. Default: true.'),
    deliveries_limit:   z.number().int().min(1).max(200).optional().describe('Max delivery records to return. Default: 50.'),
  },
  async (args) => handleWalletInfo(args)
);

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  const mode = config.walletPrivateKey ? 'full' : 'restricted (no wallet)';
  process.stderr.write(`[docketlayer-mcp] v1.0.0 started — mode: ${mode}, api: ${config.apiBaseUrl}\n`);
}

main().catch(err => {
  process.stderr.write(`[docketlayer-mcp] Fatal: ${err.message}\n`);
  process.exit(1);
});
