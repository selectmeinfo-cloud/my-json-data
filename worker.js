/**
 * Cloudflare Worker — Selectme.in OG Share Preview
 * 
 * Deploy చేయడం:
 * 1. https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. ఈ code paste చేసి Deploy చేయండి
 * 3. Worker URL: https://selectme-share.YOUR-SUBDOMAIN.workers.dev
 *
 * Custom domain (optional):
 * selectme.in లో DNS → Worker route add చేయండి:
 *   selectme.in/share* → this worker
 */

const SITE_URL   = 'https://selectme.in';
const SITE_NAME  = 'Selectme.in';
const RAW_BASE   = 'https://raw.githubusercontent.com/selectmeinfo-cloud/my-json-data/main/data/';
const DEFAULT_OG = SITE_URL + '/og-default.jpg'; // 1200x630 default image upload చేయండి

export default {
  async fetch(request) {
    const url    = new URL(request.url);
    const id     = url.searchParams.get('id') || '';

    // id లేకపోతే home కి redirect
    if (!id) {
      return Response.redirect(SITE_URL, 302);
    }

    // Sanitize id
    const safeId = id.replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!safeId) return Response.redirect(SITE_URL, 302);

    // Article JSON fetch
    let title       = SITE_NAME + ' — తెలుగు వార్తలు';
    let description = 'తెలుగులో తాజా వార్తలు, విశ్లేషణలు మరియు వీడియోలు';
    let image       = DEFAULT_OG;
    let cat         = 'news';

    try {
      const res = await fetch(RAW_BASE + safeId + '.json', {
        cf: { cacheTtl: 300, cacheEverything: true }
      });

      if (res.ok) {
        const data = await res.json();
        title       = data.telugu_title || data.english_title || data.title || title;
        description = data.telugu_excerpt || data.excerpt || description;
        image       = (data.media && data.media.featured_image) ? data.media.featured_image : DEFAULT_OG;
        cat         = (data.category || 'news').toString().toLowerCase().trim().replace(/\s+/g,'_');
      }
    } catch (e) {
      // fallback to defaults
    }

    const shareUrl   = `${SITE_URL}/share?id=${safeId}`;
    const articleUrl = `${SITE_URL}/#article/${cat}:${safeId}`;

    // Escape HTML
    const esc = s => s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    const html = `<!DOCTYPE html>
<html lang="te">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>

<!-- Open Graph — WhatsApp / Facebook / Telegram -->
<meta property="og:type"         content="article"/>
<meta property="og:site_name"    content="${esc(SITE_NAME)}"/>
<meta property="og:url"          content="${esc(shareUrl)}"/>
<meta property="og:title"        content="${esc(title)}"/>
<meta property="og:description"  content="${esc(description)}"/>
<meta property="og:image"        content="${esc(image)}"/>
<meta property="og:image:width"  content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:locale"       content="te_IN"/>

<!-- Twitter Card -->
<meta name="twitter:card"        content="summary_large_image"/>
<meta name="twitter:title"       content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta name="twitter:image"       content="${esc(image)}"/>

<!-- Redirect real users instantly -->
<meta http-equiv="refresh" content="0;url=${esc(articleUrl)}"/>
<script>window.location.replace("${articleUrl.replace(/"/g,'\\"')}");</script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f9f8f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
  .card{max-width:460px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.1)}
  .card img{width:100%;height:220px;object-fit:cover}
  .card-body{padding:18px}
  .cat{font-size:10px;font-weight:700;color:#c8001e;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px}
  h1{font-size:18px;font-weight:700;color:#111;line-height:1.35;margin-bottom:8px}
  p{font-size:13px;color:#666;line-height:1.6;margin-bottom:16px}
  a{display:inline-block;background:#c8001e;color:#fff;padding:10px 22px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:.05em}
</style>
</head>
<body>
<div class="card">
  <img src="${esc(image)}" alt="${esc(title)}" onerror="this.style.display='none'"/>
  <div class="card-body">
    <div class="cat">${esc(cat)}</div>
    <h1>${esc(title)}</h1>
    <p>${esc(description)}</p>
    <a href="${esc(articleUrl)}">చదవండి →</a>
  </div>
</div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public,max-age=300',
      }
    });
  }
};