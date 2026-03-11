  if (isBot && !url.pathname.startsWith('/api/og')) {
    const originalPath = url.pathname;
    const ogUrl = new URL(`/api/og.js?url=${encodeURIComponent(originalPath)}`, request.url);
    
    // O header 'x-middleware-rewrite' sinaliza para a Engine Vercel carregar 
    // a pagina og.js silenciosamente dentro da URL original, sem dar 302 HTTP.
    return new Response(null, {
      headers: {
        'x-middleware-rewrite': ogUrl.toString()
      }
    });
  }

  // Fallthrough to Vercel Routing
  return new Response(null, {
    headers: { 'x-middleware-next': '1' }
  });
}
