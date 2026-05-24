const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url).searchParams.get('url');
    if (!url) {
      return new Response('Missing url', { status: 400, headers: corsHeaders });
    }

    const target = new URL(url);
    if (!['http:', 'https:'].includes(target.protocol)) {
      return new Response('Unsupported protocol', { status: 400, headers: corsHeaders });
    }

    const response = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'WhatsCookin recipe importer',
        'Accept': 'text/html,application/xhtml+xml,application/xml,text/plain,*/*',
      },
    });

    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Fetch failed', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
