
export default {
  async fetch(request, env) {
    // Worker ini hanya placeholder. 
    // Jika user membuka link *.workers.dev, kita beri tahu alamat yang benar.
    
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Salah Alamat</title>
        <style>
          body { font-family: sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
          h1 { color: #f87171; }
          .card { background: #1e293b; p-8; border-radius: 1rem; padding: 2rem; border: 1px solid #334155; }
          a { color: #38bdf8; text-decoration: none; font-weight: bold; font-size: 1.2rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚠️ Anda Membuka Link Worker</h1>
          <p>Ini adalah alamat Backend. Aplikasi Website Anda ada di Cloudflare Pages.</p>
          <br/>
          <p>Silakan buka Dashboard Cloudflare Pages Anda dan klik tombol <strong>Visit Site</strong>.</p>
          <p>Link seharusnya berakhiran: <code>.pages.dev</code></p>
        </div>
      </body>
    </html>
    `;

    return new Response(html, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  }
};
