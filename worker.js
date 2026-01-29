
/**
 * CLOUDFLARE WORKER - SPECIALIZED APPROVAL ENDPOINT
 * 
 * Endpoint: POST /api/approve-user
 * Tujuan: Mengubah status user secara atomik tanpa download Giant JSON.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. CORS HEADERS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ---------------------------------------------------------
    // ENDPOINT: APPROVE / REJECT USER
    // ---------------------------------------------------------
    if (request.method === "POST" && url.pathname.endsWith("/approve-user")) {
      try {
        const { username, action, adminPassword } = await request.json();

        // 1. Validasi Password Admin (Sederhana)
        if (adminPassword !== env.ADMIN_PASSWORD) {
          return new Response(JSON.stringify({ error: "Password Admin Salah" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // 2. Tentukan Status Baru
        const newStatus = action === 'approve' ? 'active' : 'rejected';

        // 3. Panggil Remote Procedure Call (RPC) di Supabase
        // Ini menjalankan fungsi SQL 'approve_user_atomic' yang kita buat.
        // Kita pakai ANON KEY karena fungsi SQL-nya sudah 'security definer' (aman & punya akses internal)
        const supabaseUrl = `${env.SUPABASE_URL}/rest/v1/rpc/approve_user_atomic`;
        
        const response = await fetch(supabaseUrl, {
          method: 'POST',
          headers: {
            "apikey": env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY, // Gunakan yang ada
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

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
