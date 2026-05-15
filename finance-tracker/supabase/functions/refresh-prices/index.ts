// Supabase Edge Function — refresh-prices
// Fetches live prices from Finnhub and USD→THB exchange rate.
// Deploy: supabase functions deploy refresh-prices
// Secrets: supabase secrets set FINNHUB_API_KEY=<key>

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssetRef {
  id: string;
  symbol: string;
  type: string;
  currency: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { assets } = (await req.json()) as { assets: AssetRef[] };
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');

    const prices: Record<string, number> = {};

    // Fetch each symbol from Finnhub
    await Promise.all(
      assets.map(async (a) => {
        if (!a.symbol) return;
        try {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(a.symbol)}&token=${finnhubKey}`,
          );
          const data = await res.json();
          // Finnhub quote: { c: current price, ... }
          if (data.c && data.c > 0) {
            prices[a.symbol] = data.c;
          }
        } catch {
          // Skip failed symbols
        }
      }),
    );

    // Fetch USD → THB exchange rate
    let usdToThb = 35;
    try {
      const fxRes = await fetch(
        'https://api.exchangerate.host/latest?base=USD&symbols=THB',
      );
      const fxData = await fxRes.json();
      if (fxData.rates?.THB) {
        usdToThb = fxData.rates.THB;
      }
    } catch {
      // Use default rate on failure
    }

    return new Response(JSON.stringify({ prices, usdToThb }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
