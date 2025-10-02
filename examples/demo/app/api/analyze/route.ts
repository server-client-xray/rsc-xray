import { NextRequest, NextResponse } from 'next/server';
import { analyze } from '@rsc-xray/lsp-server';
import type { LspAnalysisRequest } from '@rsc-xray/lsp-server';

/**
 * POST /api/analyze
 *
 * Server-side LSP analysis endpoint
 *
 * Accepts code and scenario, returns RSC X-Ray diagnostics
 *
 * Note: Using server-side analysis because @rsc-xray/analyzer
 * depends on Node.js APIs (fs, path, vm) that can't run in browser.
 * This is still real-time - just server-executed instead of browser-executed.
 */

// Disable caching for this API route - we need fresh analysis every time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Parse route segment config from code
 *
 * Extracts export const declarations for route config options:
 * - dynamic, revalidate, fetchCache, runtime, preferredRegion
 */
function parseRouteConfigFromCode(code: string): Record<string, string | number | false> {
  const config: Record<string, string | number | false> = {};

  // Match: export const <name> = <value>;
  // Handles: 'string', "string", number, false
  const exportPattern =
    /export\s+const\s+(dynamic|revalidate|fetchCache|runtime|preferredRegion)\s*=\s*([^;]+);/g;

  let match;
  while ((match = exportPattern.exec(code)) !== null) {
    const [, name, rawValue] = match;
    const value = rawValue.trim();

    // Parse value based on type
    if (name === 'revalidate') {
      // Handle: number or false
      if (value === 'false') {
        config[name] = false;
      } else {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
          config[name] = num;
        }
      }
    } else {
      // Handle: string (remove quotes)
      const stringMatch = value.match(/^['"](.+)['"]$/);
      if (stringMatch) {
        config[name] = stringMatch[1];
      }
    }
  }

  return config;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: LspAnalysisRequest = await request.json();

    if (!body.code || !body.fileName) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Missing required fields: code, fileName' } },
        { status: 400 }
      );
    }

    // For route-config scenario, parse route config from actual code instead of using hardcoded context
    // This allows users to edit the code and see diagnostics update correctly
    let analysisBody = body;
    if (body.scenario === 'route-config' && body.context?.routeConfig) {
      const parsedConfig = parseRouteConfigFromCode(body.code);
      analysisBody = {
        ...body,
        context: {
          ...body.context,
          routeConfig: parsedConfig,
        },
      };
    }

    // For duplicate-dependencies scenario, keep all bundles but filter diagnostics to demo.tsx only
    // The context has 3 bundles (DateDisplay, Header, Footer) which creates 3 diagnostics
    // We need all bundles for duplicate detection, but only want diagnostic for demo.tsx

    const result = await analyze(analysisBody);

    // Filter diagnostics for duplicate-dependencies to only show the first component
    // Note: 'duplicate-dependencies' will be added to LspAnalysisRequest['scenario'] in next analyzer release
    if (body.scenario === ('duplicate-dependencies' as LspAnalysisRequest['scenario'])) {
      result.diagnostics = result.diagnostics.filter((diag, index) => {
        // Keep all non-duplicate-dependencies diagnostics
        if (diag.rule !== 'duplicate-dependencies') return true;
        // For duplicate-dependencies, only keep the first one (DateDisplay.tsx)
        const duplicateDiags = result.diagnostics.filter(
          (d) => d.rule === 'duplicate-dependencies'
        );
        return index === result.diagnostics.indexOf(duplicateDiags[0]);
      });
    }

    // Add cache control headers to prevent any caching
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Analysis API error:', error);

    return NextResponse.json(
      {
        diagnostics: [],
        duration: 0,
        rulesExecuted: [],
        version: '0.6.0',
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
