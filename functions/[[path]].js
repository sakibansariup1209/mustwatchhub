// 🔑 TMDB API Key
const TMDB_API_KEY = "dafa07a5692eee854f7f511b99316708";

// 🚀 TMDB ডাটা ফেচিং হেলপার ফাংশন
async function fetchTMDBData(title, year) {
    if (!TMDB_API_KEY) return null;
    try {
        const cleanTitle = title.replace(/\s*\(\d{4}\).*/, '').trim();
        let searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
        let searchRes = await fetch(searchUrl);
        if (!searchRes.ok) return null;

        let searchData = await searchRes.json();
        if (!searchData.results || searchData.results.length === 0) {
            searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
            searchRes = await fetch(searchUrl);
            if (searchRes.ok) searchData = await searchRes.json();
        }

        if (!searchData.results || searchData.results.length === 0) return null;

        const match = searchData.results[0];
        const mediaType = match.media_type === 'tv' ? 'tv' : 'movie';
        const detailUrl = `https://api.themoviedb.org/3/${mediaType}/${match.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
        const detailRes = await fetch(detailUrl);
        if (!detailRes.ok) return null;

        const detail = await detailRes.json();
        const overview = detail.overview || '';
        const cast = detail.credits?.cast?.slice(0, 6).map(c => c.name).join(', ') || '';
        const crew = detail.credits?.crew || [];
        const directorObj = crew.find(c => c.job === 'Director') || crew.find(c => c.known_for_department === 'Directing');
        const director = directorObj ? directorObj.name : '';
        const runtime = detail.runtime ? `${detail.runtime} Mins` : (detail.episode_run_time?.[0] ? `${detail.episode_run_time[0]} Mins` : '');

        return { overview, cast, director, runtime };
    } catch (e) {
        return null;
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.match(/\.(css|js|json|png|jpg|jpeg|gif|ico|xml|txt|svg|webp)$/i)) {
        return env.ASSETS.fetch(request);
    }

    // 🚀 ২. সাধারণ মেইন পেজগুলোতে ইন্টারসেপ্ট হবে না
    const excludedFiles = ['/', '/index.html', '/contact.html', '/dmca.html', '/privacy.html', '/disclaimer.html', '/404.html'];
    const cleanPath = path.toLowerCase().replace(/\/$/, '');

    if (excludedFiles.includes(cleanPath)) {
        return env.ASSETS.fetch(request);
    }

    // 🚀 ৩. পুরনো ?movie=slug লিংকগুলোকে .html লিংকে ৩০১ রিডাইরেক্ট
    const movieParam = url.searchParams.get('movie');
    if (movieParam) {
        const redirectUrl = new URL(request.url);
        redirectUrl.pathname = `/${decodeURIComponent(movieParam)}.html`;
        redirectUrl.search = '';
        return Response.redirect(redirectUrl.toString(), 301);
    }

    const movieSlug = decodeURIComponent(path.replace(/^\//, '').replace(/\.html$/i, ''));
    if (!movieSlug) return env.ASSETS.fetch(request);

    try {
        const moviesRes = await env.ASSETS.fetch(new URL('/movies.json', request.url));
        if (!moviesRes.ok) throw new Error("JSON database load failed");
        const movies = await moviesRes.json();

        // 🎯 স্ল্যাগ এবং টাইটেল ফ্লেক্সিবল ম্যাচিং
        const targetMovie = movies.find(m => {
            if (m.slug && m.slug.toLowerCase().trim() === movieSlug) return true;
            if (!m.title) return false;
            const computedSlug = m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return computedSlug === movieSlug;
        });

        if (targetMovie) {
            const cache = caches.default;
            const cacheHeader = request.headers.get('Cache-Control');
            const isNoCache = cacheHeader && (cacheHeader.includes('no-cache') || cacheHeader.includes('no-store'));

            if (!isNoCache) {
                let cachedResponse = await cache.match(request);
                if (cachedResponse) return cachedResponse;
            }

            const response = await env.ASSETS.fetch(new URL('/index.html', request.url));
            let html = await response.text();

            const movieTitle = targetMovie.title;
            const movieDesc = `${movieTitle} Dual Audio [Hindi-English] HD Media Overview, Details & Streaming Information on MustWatchHub.`;
            const currentMovieUrl = `https://MustWatchHub.com/${encodeURIComponent(movieSlug)}.html`;

            const rawPosterUrl = targetMovie.posterUrl || "https://i.postimg.cc/qqJ0X7T2/Screenshot-2026-05-19-224743.png";
            const moviePosterUrl = rawPosterUrl.includes('postimg.cc')
                ? rawPosterUrl
                : `https://wsrv.nl/?url=${encodeURIComponent(rawPosterUrl)}&w=600&output=jpeg&q=80`;

            const tmdb = await fetchTMDBData(targetMovie.title, targetMovie.year);

            const directorName = tmdb?.director || 'Renowned Filmmaker';
            const castList = tmdb?.cast || 'Leading Industry Ensemble Cast';
            const duration = tmdb?.runtime || 'Full Feature Duration';
            const synopsis = tmdb?.overview || `${movieTitle} is a premier ${targetMovie.category || 'Cinema'} title released in ${targetMovie.year || '2026'}. Featuring ${targetMovie.language || 'Dual Audio Hindi-English'} presentation, this release captures exceptional storytelling, high-fidelity sound design, and vivid visual sequences. Viewers can explore complete media specifications, stream links, and technical playback overview directly on MustWatchHub.`;

            const dynamicCanonicalTag = `<link rel="canonical" href="${currentMovieUrl}">`;
            html = html.replace('</head>', `    ${dynamicCanonicalTag}\n</head>`);
            html = html.replace(/<title>.*?<\/title>/i, `<title>${movieTitle} - MustWatchHub</title>`);

            const metaMatches = [
                { regex: /<meta\s+name="description"\s+content=".*?"\s*\/?>/i, replacement: `<meta name="description" content="${movieDesc}">` },
                { regex: /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, replacement: `<meta property="og:title" content="${movieTitle} - MustWatchHub">` },
                { regex: /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, replacement: `<meta property="og:description" content="${movieDesc}">` },
                { regex: /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, replacement: `<meta property="og:url" content="${currentMovieUrl}">` },
                { regex: /<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i, replacement: `<meta property="og:image" content="${moviePosterUrl}">` }
            ];

            metaMatches.forEach(item => {
                if (html.match(item.regex)) {
                    html = html.replace(item.regex, item.replacement);
                } else {
                    html = html.replace('</head>', `    ${item.replacement}\n</head>`);
                }
            });

            const movieSchema = {
                "@context": "https://schema.org",
                "@type": "Movie",
                "name": movieTitle,
                "image": moviePosterUrl,
                "genre": targetMovie.genre || 'Action, Drama',
                "description": synopsis,
                "inLanguage": targetMovie.language || 'Hindi, English'
            };
            const schemaScript = `<script type="application/ld+json">${JSON.stringify(movieSchema)}</script>`;
            html = html.replace('</head>', `    ${schemaScript}\n</head>`);

            const seoBodyContent = `
                <article style="padding: 60px 20px; color: white; max-width: 900px; margin: 0 auto; font-family: sans-serif; line-height: 1.7;">
                    <header style="margin-bottom: 25px;">
                        <h1 style="font-size: 2.2rem; font-weight: 900; color: #e50914; margin-bottom: 12px;">${movieTitle} - Overview, Cast, Stream & Technical Specifications</h1>
                        <p style="font-size: 1.1rem; color: #cccccc;">Explore verified storylines, star cast line-ups, production details, and high-speed streaming mirrors for <strong>${movieTitle}</strong> on MustWatchHub.</p>
                    </header>
                    <hr style="border-color: #333; margin: 20px 0;">
                    <section style="display: flex; flex-wrap: wrap; gap: 25px; margin-bottom: 35px;">
                        <img src="${moviePosterUrl}" alt="${movieTitle} Poster" style="width: 260px; border-radius: 12px; height: auto; object-fit: cover; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
                        <div style="flex: 1; min-width: 280px; background: rgba(255,255,255,0.03); p-5; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                            <h2 style="font-size: 1.4rem; color: #ffffff; margin-bottom: 15px; border-bottom: 2px solid #e50914; padding-bottom: 5px; display: inline-block;">Production Info</h2>
                            <ul style="list-style: none; padding: 0; margin: 0; color: #bbbbbb; font-size: 0.95rem;">
                                <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><strong>🎬 Director:</strong> ${directorName}</li>
                                <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><strong>⭐ Star Cast:</strong> ${castList}</li>
                                <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><strong>🎭 Genre:</strong> ${targetMovie.genre || 'Action, Entertainment'}</li>
                                <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><strong>🌐 Audio Language:</strong> ${targetMovie.language || 'Dual Audio [Hindi-English]'}</li>
                                <li style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><strong>⏱️ Runtime:</strong> ${duration}</li>
                                <li style="padding: 8px 0;"><strong>📅 Release Year:</strong> ${targetMovie.year || '2026'}</li>
                            </ul>
                        </div>
                    </section>
                    <section style="margin-bottom: 35px;">
                        <h2 style="font-size: 1.5rem; color: #ffffff; margin-bottom: 12px;">Detailed Storyline & Synopsis</h2>
                        <p style="color: #dddddd; font-size: 1rem; text-align: justify; background: rgba(0,0,0,0.4); padding: 20px; border-radius: 10px; border-left: 4px solid #e50914;">${synopsis}</p>
                    </section>
                    <section style="margin-bottom: 35px;">
                        <h2 style="font-size: 1.3rem; color: #ffffff; margin-bottom: 12px;">Playback & Audio Compatibility Guide</h2>
                        <p style="color: #aaaaaa; font-size: 0.95rem; text-align: justify;">This media container for ${movieTitle} is formatted in x265 HEVC MKV structure, offering dual audio tracks including softcoded English subtitles (ESub). Optimized for seamless cloud streaming across Google Chrome, PC, Mobile, Smart TV, and Chromecast setups.</p>
                    </section>
                </article>
            `;
            html = html.replace('<div id="seo-ssr-content"></div>', `<div id="seo-ssr-content">${seoBodyContent}</div>`);

            const finalResponse = new Response(html, {
                headers: {
                    "content-type": "text/html;charset=UTF-8",
                    "Cache-Control": "s-maxage=86400"
                }
            });

            context.waitUntil(cache.put(request, finalResponse.clone()));
            return finalResponse;

        } else {
            return render404();
        }

    } catch (error) {
        return render404();
    }
}

function render404() {
    const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found | MustWatch Hub</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #050505;
        }
        .glow-red {
            text-shadow: 0 0 35px rgba(229, 9, 20, 0.6), 0 0 10px rgba(229, 9, 20, 0.4);
        }
        .glow-card {
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(229, 9, 20, 0.15);
        }
        .ambient-bg {
            background: radial-gradient(circle at 50% 40%, rgba(229, 9, 20, 0.15) 0%, rgba(5, 5, 5, 0.98) 70%);
        }
    </style>
</head>
<body class="text-white min-h-screen flex flex-col justify-between ambient-bg overflow-x-hidden relative">

    <!-- 🎬 HEADER SECTION -->
    <header class="w-full py-5 px-6 md:px-12 flex justify-between items-center z-10 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <a href="https://MustWatchHub.com/" class="text-red-600 font-black text-2xl md:text-3xl tracking-tighter uppercase no-underline hover:opacity-90 transition">
            Must Watch<span class="text-white">&nbsp;Hub</span>
        </a>
        <a href="https://MustWatchHub.com/" class="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider transition-all duration-300 shadow-lg shadow-red-600/30 hover:scale-105 flex items-center gap-2 no-underline">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
        </a>
    </header>

    <!-- 🍿 MAIN 404 CARD CONTAINER -->
    <main class="flex-grow flex items-center justify-center p-6 z-10 my-8">
        <div class="bg-[#0f0f0f]/90 border border-white/10 p-8 sm:p-12 md:p-16 rounded-3xl glow-card max-w-2xl w-full text-center backdrop-blur-xl relative overflow-hidden">
            
            <!-- RED AMBIENT CIRCLE -->
            <div class="absolute -top-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <!-- FILM REEL ICON -->
            <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-600 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v15a1 1 0 001 1z" />
                </svg>
            </div>

            <!-- 404 TEXT -->
            <h1 class="text-7xl sm:text-8xl md:text-9xl font-black text-red-600 tracking-tight glow-red mb-2 leading-none">
                404
            </h1>

            <h2 class="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-wide uppercase">
                Lost In The Dark?
            </h2>

            <p class="text-gray-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto font-normal">
                Sorry, the movie or page you are looking for has been moved, deleted, or doesn't exist in our library.
            </p>

            <!-- ACTION BUTTON -->
            <div class="flex flex-wrap justify-center gap-4">
                <a href="https://MustWatchHub.com/" class="bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 shadow-lg shadow-red-600/40 hover:scale-105 inline-flex items-center gap-2 no-underline">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    Explore Movies
                </a>
            </div>

        </div>
    </main>

    <!-- 📜 FOOTER -->
    <footer class="py-6 border-t border-white/5 text-center z-10 bg-black/40">
        <p class="text-gray-600 text-xs font-bold uppercase tracking-widest">
            © 2026 MustWatch Hub. ALL RIGHTS RESERVED.
        </p>
    </footer>

</body>
</html>`;

    return new Response(notFoundHtml, {
        status: 404,
        statusText: "Not Found",
        headers: {
            "content-type": "text/html;charset=UTF-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
        }
    });
}