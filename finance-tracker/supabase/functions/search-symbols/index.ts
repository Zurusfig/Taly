// Supabase Edge Function — search-symbols
// Wraps Finnhub /search endpoint for symbol lookup in the Add Asset flow.
// Deploy:  supabase functions deploy search-symbols
// Secret:  supabase secrets set FINNHUB_API_KEY=<key>  (shared with refresh-prices)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinnhubResult {
  symbol: string;
  description: string;
  type: string;
  displaySymbol: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { query } = (await req.json()) as { query: string };
    if (!query || query.length < 2) {
      return new Response(JSON.stringify([]), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const key = Deno.env.get('FINNHUB_API_KEY');
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${key}`,
    );
    const data = await res.json();
    const results: FinnhubResult[] = (data.result ?? []).slice(0, 15);

    return new Response(JSON.stringify(results), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
