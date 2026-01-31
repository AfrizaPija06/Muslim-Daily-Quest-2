
/**
 * CLOUDFLARE WORKER - STATIC ONLY (SIMPLE MODE)
 * 
 * Worker ini hanya bertugas mengantar file aset (HTML, CSS, JS) ke browser.
 * Semua logika database dilakukan langsung oleh Frontend ke Supabase.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Abaikan request API (jika ada sisa-sisa request lama)
    if (url.pathname.startsWith("/api/")) {
      return new Response("API disabled. Creating static fallback.", { status: 404 });
    }

    // ---------------------------------------------------------
    // STATIC ASSETS (Frontend React)
    // ---------------------------------------------------------
    try {
      if (env.ASSETS) {
        // Coba ambil file langsung (misal: /style.css, /logo.png)
        let response = await env.ASSETS.fetch(request);
        
        // Jika file tidak ada (404) DAN bukan request file (tidak ada titik di ujung path)
        // Maka ini adalah navigasi halaman React (SPA), kembalikan index.html
        if (response.status === 404 && !url.pathname.includes('.')) {
           response = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
        }
        
        return response;
      }
    } catch (e) {
      return new Response(`Server Error: ${e.message}`, { status: 500 });
    }

    return new Response(
      "Worker Active (Simple Mode). Assets not found. Did you run 'npm run build'?", 
      { status: 404 }
    );
  }
};
