export const config = {
  matcher: ['/produto/:path*', '/colecao/:path*', '/artigo/:path*']
};

export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  
  const isBot = /whatsapp|facebook|twitter|linkedin|skype|telegram|discord/.test(userAgent);

  if (isBot && !url.pathname.startsWith('/api/og')) {
    const originalPath = url.pathname;
    url.pathname = '/api/og.js';
    url.searchParams.set('url', originalPath);
    return Response.redirect(url);
  }

  // Fallthrough to Vercel Routing
  return new Response(null, {
    headers: { 'x-middleware-next': '1' }
  });
}
