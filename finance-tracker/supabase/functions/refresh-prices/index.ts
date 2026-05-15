// Supabase Edge Function — refresh-prices
// Fetches live prices from Finnhub for each symbol and USD→THB rate.
// Deploy:  supabase functions deploy refresh-prices
// Secret:  supabase secrets set FINNHUB_API_KEY=<key>

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssetRef { id: string; symbol: string; type: string; currency: string; }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { assets } = (await req.json()) as { assets: AssetRef[] };
    const key = Deno.env.get('FINNHUB_API_KEY');

    const prices: Record<string, { current_price: number; percent_change: number }> = {};

    // Batch to stay within 60 req/min free tier — process sequentially with delay
    for (const a of assets) {
      if (!a.symbol) continue;
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(a.symbol)}&token=${key}`,
        );
        const d = await res.json();
        // d.c = current price, d.dp = % change
        if (d.c && d.c > 0) {
          prices[a.symbol] = { current_price: d.c, percent_change: d.dp ?? 0 };
        }
      } catch { /* skip failed symbols */ }
      // Small delay to respect rate limits
      await new Promise((r) => setTimeout(r, 100));
    }

    // USD → THB exchange rate (cache: caller stores this for 1h)
    let usdToThb = 35;
    try {
      const fx = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=THB');
      const fxd = await fx.json();
      if (fxd.rates?.THB) usdToThb = fxd.rates.THB;
    } catch { /* use default */ }

    return new Response(JSON.stringify({ prices, usdToThb }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
