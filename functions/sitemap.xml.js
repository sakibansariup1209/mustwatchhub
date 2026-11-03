// functions/sitemap.xml.js
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe).replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

export async function onRequest(context) {
    const { request, env } = context;
    try {
        const moviesRes = await env.ASSETS.fetch(new URL('/movies.json', request.url));
        if (!moviesRes.ok) throw new Error("Database load failed");
        const movies = await moviesRes.json();

        const today = new Date().toISOString().split('T')[0];

        // 🚀 ১. Google Image Sitemap Namespace সহ আধুনিক XML স্কিমা
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
        xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

        // 🎯 ২. হোমপেজ (সর্বোচ্চ প্রায়োরিটি)
        xml += `  <url>\n`;
        xml += `    <loc>https://mustwatchhub.com/</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>1.00</priority>\n`;
        xml += `  </url>\n`;

        // 🎯 ৩. একক মুভি ও সিরিজ পেজসমূহ
        if (Array.isArray(movies)) {
            const seenSlugs = new Set();

            movies.forEach(movie => {
                if (!movie || !movie.title) return;

                const rawSlug = movie.slug || movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                if (!rawSlug || seenSlugs.has(rawSlug)) return;
                seenSlugs.add(rawSlug);

                const movieUrl = `https://mustwatchhub.com/${encodeURIComponent(rawSlug)}.html`;

                // 🎯 ৪. স্মার্ট প্রায়োরিটি (নতুন মুভিগুলোকে দ্রুত ইনডেক্স করানোর জন্য)
                const releaseYear = parseInt(movie.year || '2026', 10);
                const isRecent = releaseYear >= 2025 || movie.category === 'Recent Adds';

                const priority = isRecent ? '0.95' : '0.80';
                const changefreq = isRecent ? 'daily' : 'weekly';

                // 🖼️ ৫. Google Image SEO: পোস্টার ইমেজ লিঙ্ক প্রসেসিং
                const rawPoster = movie.posterUrl || '';
                const posterUrl = rawPoster.includes('postimg.cc')
                    ? rawPoster
                    : (rawPoster ? `https://wsrv.nl/?url=${encodeURIComponent(rawPoster)}&w=600&output=jpeg&q=80` : '');

                xml += `  <url>\n`;
                xml += `    <loc>${movieUrl}</loc>\n`;
                xml += `    <lastmod>${today}</lastmod>\n`;
                xml += `    <changefreq>${changefreq}</changefreq>\n`;
                xml += `    <priority>${priority}</priority>\n`;

                if (posterUrl) {
                    xml += `    <image:image>\n`;
                    xml += `      <image:loc>${escapeXml(posterUrl)}</image:loc>\n`;
                    xml += `      <image:title>${escapeXml(movie.title)} Watch Online Free HD</image:title>\n`;
                    xml += `    </image:image>\n`;
                }

                xml += `  </url>\n`;
            });
        }

        xml += `</urlset>`;

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=UTF-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=86400',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    } catch (e) {
        return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
            status: 500,
            headers: { 'Content-Type': 'application/xml; charset=UTF-8' }
        });
    }
}