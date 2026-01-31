
/**
 * CLOUDFLARE WORKER - HYBRID (API + STATIC ASSETS)
 * 
 * 1. Melayani API di /api/...
 * 2. Melayani Website (React App) di URL lainnya
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---------------------------------------------------------
    // JALUR 1: API ROUTES (backend logic)
    // ---------------------------------------------------------
    if (url.pathname.startsWith("/api/")) {
      
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      // Endpoint: Approve User
      if (request.method === "POST" && url.pathname.endsWith("/approve-user")) {
        try {
          const { username, action, adminPassword } = await request.json();

          if (adminPassword !== env.ADMIN_PASSWORD) {
            return new Response(JSON.stringify({ error: "Password Admin Salah" }), {
              status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          const newStatus = action === 'approve' ? 'active' : 'rejected';
          const supabaseUrl = `${env.SUPABASE_URL}/rest/v1/rpc/approve_user_atomic`;
          
          const response = await fetch(supabaseUrl, {
            method: 'POST',
            headers: {
              "apikey": env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              target_username: username,
              new_status: newStatus
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Database Error: ${errText}`);
          }

          return new Response(JSON.stringify({ success: true, username, status: newStatus }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      return new Response(JSON.stringify({ error: "Endpoint not found" }), { 
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ---------------------------------------------------------
    // JALUR 2: STATIC ASSETS (Frontend React)
    // ---------------------------------------------------------
    // Jika bukan API, kita asumsikan user minta file website (HTML, CSS, JS)
    // env.ASSETS otomatis tersedia karena kita set "assets" di wrangler.json
    try {
      if (env.ASSETS) {
        const response = await env.ASSETS.fetch(request);
        
        // Single Page App (SPA) Fallback:
        // Jika file tidak ketemu (404) dan URL tidak terlihat seperti file (tidak ada titik),
        // kembalikan index.html agar React Router bisa menangani routing di browser.
        if (response.status === 404 && !url.pathname.includes('.')) {
           return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
        }
        
        return response;
      }
    } catch (e) {
      // Fallback jika env.ASSETS gagal
    }

    return new Response("Not Found", { status: 404 });
  }
};
