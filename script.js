if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// ==========================================
// ⚙️ MASTER FEATURE ON / OFF CONTROLLER
// ==========================================
const MASTER_CONTROLS = {
    // 🔘 ক্যাটাগরি অ্যাড কন্ট্রোল (যেকোনো ১টি true রাখবেন)
    ENABLE_CATEGORY_UNLOCK_POPUP: false,  // true = ২-ক্লিক ব্যানার পপ-আপ বক্স ওপেন হবে
    ENABLE_CATEGORY_SMARTLINK_AD: false,   // true = ক্যাটাগরি পরিবর্তনের সময় ১টি স্মার্টলিংক অ্যাড ওপেন হবে

    // 🔘 মুভি ডাউনলোড বাটন অ্যাড কন্ট্রোল (যেকোনো ১টি true রাখবেন)
    ENABLE_DOWNLOAD_NATIVE_POPUP: false,  // true = ২-ক্লিক নেটিভ ব্যানার পপ-আপ বক্স ওপেন হবে
    ENABLE_DOWNLOAD_SMARTLINK_ADS: true,  // true = পপ-আপ ছাড়া বাটনে সরাসরি ২-ক্লিক স্মার্টলিংক (৩য় ক্লিকে ফাইল ডাউনলোড)

    // 🔘 সার্ভার পরিবর্তন অ্যাড কন্ট্রোল
    ENABLE_SERVER_CHANGE_AD: false   // true = সার্ভার (Server 1, Server 2) পরিবর্তন করলে স্মার্টলিংক অ্যাড ওপেন হবে, false দিলে হবে না
};

// গ্লোবাল স্মার্টলিংক অ্যাড ইউআরএল
const GLOBAL_SMARTLINK_URL = "https://www.profitableratecpmnetwork.com/rr3q82zj6?key=c81990371bb12dd6139bb39d8a8b4a4e";

// ==========================================
// 🔑 TMDB API CONFIG & HELPER ENGINE
// ==========================================
const CLIENT_TMDB_API_KEY = "dafa07a5692eee854f7f511b99316708";
const clientTmdbCache = {};

async function getClientTMDBDetails(title, year) {
    const cacheKey = `${title}_${year}`;
    if (clientTmdbCache[cacheKey]) return clientTmdbCache[cacheKey];
    if (!CLIENT_TMDB_API_KEY) return null;

    try {
        const cleanTitle = title.replace(/\s*\(\d{4}\).*/, '').trim();
        let searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${CLIENT_TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
        let searchRes = await fetch(searchUrl);
        if (!searchRes.ok) return null;

        let searchData = await searchRes.json();
        if (!searchData.results || searchData.results.length === 0) {
            searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${CLIENT_TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
            searchRes = await fetch(searchUrl);
            if (searchRes.ok) searchData = await searchRes.json();
        }

        if (!searchData.results || searchData.results.length === 0) return null;

        const match = searchData.results[0];
        const mediaType = match.media_type === 'tv' ? 'tv' : 'movie';
        const detailUrl = `https://api.themoviedb.org/3/${mediaType}/${match.id}?api_key=${CLIENT_TMDB_API_KEY}&append_to_response=credits`;
        const detailRes = await fetch(detailUrl);
        if (!detailRes.ok) return null;

        const detail = await detailRes.json();
        const overview = detail.overview || '';
        const cast = detail.credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || '';
        const crew = detail.credits?.crew || [];
        const directorObj = crew.find(c => c.job === 'Director') || crew.find(c => c.known_for_department === 'Directing');
        const director = directorObj ? directorObj.name : '';
        const runtime = detail.runtime ? `${detail.runtime} Mins` : (detail.episode_run_time?.[0] ? `${detail.episode_run_time[0]} Mins` : '');

        const result = { overview, cast, director, runtime };
        clientTmdbCache[cacheKey] = result;
        return result;
    } catch (e) {
        return null;
    }
}

function renderModalContent(item, SEOFullTitle, titleKey, cleanLang, releaseYear, contentType, dynamicFooterKeywords, tmdb) {
    const modalDescElem = document.getElementById('modalDesc');
    if (!modalDescElem) return;

    const directorText = tmdb?.director || item.director || "Renowned Director";
    const castText = tmdb?.cast || (Array.isArray(item.cast) ? item.cast.join(', ') : item.cast) || "Top Featured Ensemble Cast";
    const durationText = tmdb?.runtime || item.duration || "Full Feature Length";

    const plotText = tmdb?.overview || item.detailedPlotSummary || `${SEOFullTitle} is a prominent ${item.category || 'Cinema'} release officially debuting in ${releaseYear}. Presented in ${cleanLang}, this production delivers a rich narrative experience tailored for fans of ${item.genre || 'Action & Drama'}. The storyline brings together dynamic character arcs, high-definition audio-visual elements, and cinematic sequences that keep viewers engaged from start to finish.`;

    const playbackGuide = `On MustWatchHub, viewers can access full metadata, audio specifications, and verified stream references for ${SEOFullTitle}. The media file is encoded in x265 HEVC MKV format with English softcoded subtitles (ESub), providing ultra-smooth remote playback across Google Chrome, PC, Android, iOS, Smart TV, and Chromecast setups.`;

    modalDescElem.innerHTML = `
        <div class="seo-rich-layout text-left space-y-6 font-sans text-xs md:text-[13px] text-gray-300 antialiased select-text">
            <div class="flex flex-wrap items-center gap-3 border-b border-white/10 pb-3">
                <span class="px-2.5 py-1 text-[10px] font-black tracking-wider text-white bg-red-600 rounded-sm uppercase inline-block">
                    ${item.genre || "Action / Drama"}
                </span>
                <span class="text-[11px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> TMDB Media Details Verified
                </span>
            </div>

            <div class="p-4 bg-zinc-900/80 border border-white/10 rounded-xl space-y-2.5 text-[12px] shadow-lg">
                <div class="flex flex-wrap items-center justify-between border-b border-white/[0.06] pb-2">
                    <span class="text-gray-400 font-medium">🎬 Director:</span>
                    <span class="font-bold text-white">${directorText}</span>
                </div>
                <div class="flex flex-wrap items-center justify-between border-b border-white/[0.06] pb-2">
                    <span class="text-gray-400 font-medium">⭐ Star Cast:</span>
                    <span class="font-bold text-red-400 truncate max-w-xs md:max-w-md">${castText}</span>
                </div>
                <div class="flex flex-wrap items-center justify-between">
                    <span class="text-gray-400 font-medium">⏱️ Runtime:</span>
                    <span class="font-bold text-amber-400">${durationText}</span>
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <h3 class="text-xs md:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <i class="fas fa-book-open text-red-500"></i> Detailed Storyline & Synopsis
                </h3>
                <p class="leading-relaxed text-gray-300 text-[12px] md:text-[13px] font-normal text-justify bg-zinc-950/60 p-3.5 rounded-lg border border-white/5">
                    ${plotText}
                </p>
            </div>

            <div class="space-y-2">
                <h3 class="text-xs md:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <i class="fas fa-tv text-blue-500"></i> Media & Playback Overview
                </h3>
                <p class="leading-relaxed text-gray-400 text-[11px] md:text-[12px] font-normal text-justify bg-zinc-950/40 p-3 rounded-lg border border-white/5">
                    ${playbackGuide}
                </p>
            </div>

            <div class="p-4 bg-zinc-900/40 border border-white/10 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-[12px]">
                <div class="flex items-center justify-between py-2 border-b border-white/[0.06]">
                    <span class="text-gray-400 font-medium">📌 Title</span>
                    <span class="font-semibold text-white truncate max-w-[150px]" title="${titleKey}">${titleKey}</span>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-white/[0.06]">
                    <span class="text-gray-400 font-medium">🎬 Format</span>
                    <span class="font-semibold text-white">MKV / x265 HEVC</span>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-white/[0.06]">
                    <span class="text-gray-400 font-medium">🌐 Audio</span>
                    <span class="font-bold text-emerald-400">${cleanLang}</span>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-white/[0.06]">
                    <span class="text-gray-400 font-medium">📅 Release Year</span>
                    <span class="font-semibold text-white">${releaseYear}</span>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-white/[0.06] sm:border-b-0">
                    <span class="text-gray-400 font-medium">🔥 Quality</span>
                    <span class="font-semibold text-amber-400">720p, 1080p, 4K UHD</span>
                </div>
                <div class="flex items-center justify-between py-2">
                    <span class="text-gray-400 font-medium">📝 Subtitles</span>
                    <span class="font-semibold text-gray-200">English (ESub)</span>
                </div>
            </div>

            <div class="pt-3 border-t border-white/5">
                <p class="text-[10px] text-gray-600 leading-relaxed text-justify opacity-40 font-normal">
                    ${dynamicFooterKeywords}
                </p>
            </div>
        </div>
    `;
}

function generateMovieSlug(title) {
    if (!title) return "movie";
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

const contentData = [];
const categoryIndexMap = {};

function buildCategoryIndex() {
    Object.keys(categoryIndexMap).forEach(key => delete categoryIndexMap[key]);
    contentData.forEach(item => {
        const cat = item.category || "Others";
        if (!categoryIndexMap[cat]) {
            categoryIndexMap[cat] = [];
        }
        categoryIndexMap[cat].push(item);
    });
}

function processContentItems() {
    contentData.forEach((item, index) => {
        item.id = index;
        item.slug = generateMovieSlug(item.title);
    });
    buildCategoryIndex();
}

function openMustWatchHubDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MustWatchHubDB', 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('cacheStore')) {
                db.createObjectStore('cacheStore');
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

function getIDBCache(key) {
    return openMustWatchHubDB().then(db => {
        return new Promise((resolve) => {
            const transaction = db.transaction('cacheStore', 'readonly');
            const store = transaction.objectStore('cacheStore');
            const request = store.get(key);
            request.onsuccess = (e) => resolve(e.target.result || null);
            request.onerror = () => resolve(null);
        });
    });
}

function setIDBCache(key, value) {
    return openMustWatchHubDB().then(db => {
        return new Promise((resolve) => {
            const transaction = db.transaction('cacheStore', 'readwrite');
            const store = transaction.objectStore('cacheStore');
            const request = store.put(value, key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    });
}

async function fetchAndCacheNetworkDatabase() {
    try {
        const response = await fetch('movies.json');
        if (response.ok) {
            const text = await response.text();
            const db = JSON.parse(text);
            if (Array.isArray(db) && db.length > 0) {
                await setIDBCache('MustWatchHub_db_cache', text);
                contentData.length = 0;
                contentData.push(...db);
                processContentItems();
            }
        }
    } catch (err) {
        processContentItems();
    }
}

function triggerBackgroundUpdateCheck() {
    setTimeout(async () => {
        try {
            const response = await fetch('movies.json');
            if (response.ok) {
                const text = await response.text();
                const cachedText = await getIDBCache('MustWatchHub_db_cache');

                if (text !== cachedText) {
                    const db = JSON.parse(text);
                    if (Array.isArray(db) && db.length > 0) {
                        await setIDBCache('MustWatchHub_db_cache', text);
                        contentData.length = 0;
                        contentData.push(...db);
                        processContentItems();

                        if (currentView === 'home') {
                            initHeroSlider();
                            renderRecentAdds();
                            renderCategorySections(false);
                        } else {
                            initLibraryRender();
                        }
                    }
                }
            }
        } catch (err) { }
    }, 4500);
}

async function loadContentDatabase() {
    const cachedText = await getIDBCache('MustWatchHub_db_cache');
    if (cachedText) {
        try {
            const db = JSON.parse(cachedText);
            if (Array.isArray(db) && db.length > 0) {
                contentData.length = 0;
                contentData.push(...db);
                processContentItems();
                triggerBackgroundUpdateCheck();
                return;
            }
        } catch (e) { }
    }
    await fetchAndCacheNetworkDatabase();
}

const databaseLoadPromise = loadContentDatabase();

const categories = [
    "all", "Hollywood", "Bollywood", "South", "Animation",
    "Korean Country", "Chinese", "Hollywood Series", "Bollywood Series",
    "Korean Series", "Adult Comedy", "Others"
];

let currentItem = null;
let downloadClickCount = 0;
let currentEpisodeIndex = null;
let currentServerIndex = 1;
let preSearchState = null;
let currentView = 'home';
let sliderInterval;
let scrollTimeoutId = null;
let isModalClosing = false;
let lastVisitedCategory = 'all';

const homeView = document.getElementById('homeView');
const libraryView = document.getElementById('libraryView');
const recentAddsGrid = document.getElementById('recentAddsGrid');
const libraryGrid = document.getElementById('libraryGrid');
const categorySections = document.getElementById('categorySections');
const sliderWrapper = document.getElementById('sliderWrapper');
const searchInput = document.getElementById('searchInput');
const searchIcon = document.getElementById('searchIcon');
const categoryMenu = document.getElementById('categoryMenu');

let libraryData = [];
let libraryDisplayedCount = 0;
const ITEMS_PER_PAGE = 30;
let isLoading = false;
let activeSubGridId = null;

function getOptimizedImageUrl(url, width = 300) {
    if (!url) return "";
    if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) return url;
    // 🚀 PAGE WEIGHT FIX: কোয়ালিটি ঠিক রেখে নেটওয়ার্ক পে-লোড ৫০% কমানো হয়েছে
    const isMobile = window.innerWidth < 640;
    const targetWidth = isMobile ? 180 : Math.min(width, 280);
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${targetWidth}&output=webp&q=78`;
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ==========================================
// 🛠️ মাস্টার স্ট্রিম সার্ভার কন্ট্রোলার (MASTER STREAM SERVER CONTROLLER)
// ==========================================
// • কোনো সার্ভার সাময়িক ডাউন থাকলে enabled: false করে দিন, ওয়েবসাইট থেকে সাথে সাথে হাইড হয়ে যাবে
// • সার্ভারের সিরিয়াল আগে-পিছে সাজালে বাটনের অর্ডার এবং ডিফল্ট প্লেয়ার সেই অনুযায়ী লোড হবে
const STREAM_SERVER_CONFIG = [
    { key: 'embedUrl2', name: 'Server 1', tag: 'Primary HD', enabled: true },
    { key: 'embedUrl', name: 'Server 2', tag: 'Fast Stream', enabled: true },
    { key: 'embedUrl3', name: 'Server 3', tag: 'VIP Mirror', enabled: true },
    { key: 'embedUrl4', name: 'Server 4', tag: 'Alternative', enabled: true },
    { key: 'embedUrl5', name: 'Server 5', tag: '4K Ultra HD', enabled: true },
    { key: 'embedUrl6', name: 'Server 6', tag: 'Backup Server', enabled: true }
];

function renderServerButtons() {
    const serverSec = document.getElementById('serverSection');
    const serverList = document.getElementById('serverList');
    if (!serverSec || !serverList || !currentItem) return;

    const isSeries = currentItem.episodes && currentItem.episodes.length > 0;
    const target = isSeries ? currentItem.episodes[currentEpisodeIndex !== null ? currentEpisodeIndex : 0] : currentItem;

    if (!target) {
        serverSec.classList.add('hidden');
        return;
    }

    // 🚀 শুধুমাত্র সচল (enabled: true) এবং ডাটাবেজে লিংক থাকা সার্ভারগুলো ফিল্টার হবে
    const activeServers = STREAM_SERVER_CONFIG
        .filter(server => server.enabled !== false)
        .filter(server => target[server.key] && typeof target[server.key] === 'string' && target[server.key].trim() !== '');

    if (activeServers.length > 1) {
        serverSec.classList.remove('hidden');
        serverList.innerHTML = '';

        activeServers.forEach((s, idx) => {
            const btn = document.createElement('button');
            btn.className = `server-btn server-btn-${(idx % 6) + 1} ${idx === 0 ? 'active' : ''}`;
            btn.innerHTML = `
                <div class="server-icon-box">
                    <i class="fas fa-server"></i>
                </div>
                <div class="server-info">
                    <span class="server-title">${s.name}</span>
                    <span class="server-tag">${s.tag}</span>
                </div>
            `;
            // 🎯 s.key ও প্যারামিটার হিসেবে পাঠানো হলো কন্ডিশন চেক করার জন্য
            btn.onclick = () => playServer(target[s.key], btn, s.key);
            serverList.appendChild(btn);
        });

        loadIframeUrl(target[activeServers[0].key]);
    }
    else if (activeServers.length === 1) {
        serverSec.classList.add('hidden');
        serverList.innerHTML = '';
        loadIframeUrl(target[activeServers[0].key]);
    }
    else {
        serverSec.classList.add('hidden');
        serverList.innerHTML = '';
    }
}

// function playServer(rawUrl, btnElement) {
//     const movieModal = document.getElementById('movieModal');

//     // 🛡️ যদি বাটনটি ইতিমধ্যেই Active / Playing থাকে: কোনো অ্যাড বা রিলোড হবে না, শুধু ওপরে স্ক্রোল করবে
//     if (btnElement && btnElement.classList.contains('active')) {
//         if (movieModal) {
//             movieModal.scrollTo({ top: 0, behavior: 'smooth' });
//         }
//         return;
//     }

//     // 🚀 নতুন সার্ভার সিলেক্ট করলে অ্যাড ওপেন হবে এবং নতুন সার্ভার লোড হবে
//     const smartAdLink = "https://www.profitableratecpmnetwork.com/rr3q82zj6?key=c81990371bb12dd6139bb39d8a8b4a4e";
//     window.open(smartAdLink, '_blank');

//     document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
//     if (btnElement) btnElement.classList.add('active');
//     loadIframeUrl(rawUrl);

//     if (movieModal) {
//         movieModal.scrollTo({ top: 0, behavior: 'smooth' });
//     }
// }

function playServer(rawUrl, btnElement, serverKey) {
    const movieModal = document.getElementById('movieModal');

    // 🔄 যদি বাটনটি ইতিমধ্যেই Active / Playing থাকে
    if (btnElement && btnElement.classList.contains('active')) {
        if (movieModal) {
            movieModal.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // 🎯 শুধুমাত্র 'embedUrl' কি (key) হলে আইফ্রেম পুনরায় রিলোড হবে, অন্যগুলোর জন্য হবে না
        if (serverKey === 'embedUrl') {
            loadIframeUrl(rawUrl);
        }
        return;
    }

    // 🚀 MASTER_CONTROLS চেক করে স্পন্সর অ্যাড ওপেন হবে
    if (MASTER_CONTROLS.ENABLE_SERVER_CHANGE_AD) {
        const smartAdLink = "https://www.profitableratecpmnetwork.com/rr3q82zj6?key=c81990371bb12dd6139bb39d8a8b4a4e";
        window.open(smartAdLink, '_blank');
    }

    document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    loadIframeUrl(rawUrl);

    if (movieModal) {
        movieModal.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function decodeAndCleanUrl(rawUrl) {
    if (!rawUrl) return "";
    let str = rawUrl.trim();

    try {
        if (!str.startsWith('http') && !str.startsWith('<iframe') && /^[A-Za-z0-9+/=]+$/.test(str)) {
            str = atob(str);
        }
    } catch (e) { }

    const match = str.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) str = match[1];
    return str.replace(/&amp;/g, '&');
}

function loadIframeUrl(rawUrl) {
    let url = decodeAndCleanUrl(rawUrl);
    const actualVideo = document.getElementById('actualVideo');
    if (actualVideo) {
        actualVideo.classList.remove('hidden');
        actualVideo.innerHTML = `<iframe id="videoIframe" class="absolute top-0 left-0 w-full h-full border-0 outline-none bg-black block rounded-t-2xl" src="${url}" frameborder="0" scrolling="no" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen="true" style="width:100%;height:100%;object-fit:contain;border:0;"></iframe>`;
    }
}

function renderCategories() {
    const mobileGrid = document.getElementById('mobileCategoryGrid');
    const desktopNav = document.getElementById('desktopCategoryPills');
    const libraryFilters = document.getElementById('libraryFilters');

    if (mobileGrid) mobileGrid.innerHTML = '';
    if (desktopNav) desktopNav.innerHTML = '';
    if (libraryFilters) libraryFilters.innerHTML = '';

    categories.forEach(cat => {
        const label = cat === 'Korean Country' ? 'Korean' : cat;

        if (cat === 'all') {
            if (mobileGrid) {
                const mobileItem = document.createElement('a');
                mobileItem.className = 'cat-menu-item flex items-center justify-center text-white no-underline w-full h-full';
                mobileItem.innerText = 'Home';
                mobileItem.href = '#';
                mobileItem.onclick = (e) => {
                    e.preventDefault();
                    toggleCategoryMenu(false, false);
                    clearSearch(true);
                    switchView('home', null, 'replace');
                };
                mobileGrid.appendChild(mobileItem);
            }
            return;
        }

        const realLink = `?view=library&category=${encodeURIComponent(cat)}`;

        if (mobileGrid) {
            const mobileItem = document.createElement('a');
            mobileItem.className = 'cat-menu-item flex items-center justify-center text-white no-underline w-full h-full';
            mobileItem.innerText = label;
            mobileItem.href = realLink;
            mobileItem.onclick = (e) => {
                e.preventDefault();
                toggleCategoryMenu(false, false, true);
                switchView('library', cat, true);
            };
            mobileGrid.appendChild(mobileItem);
        }

        if (desktopNav) {
            const desktopItem = document.createElement('a');
            desktopItem.href = realLink;
            desktopItem.className = 'category-pill border border-white/10 px-5 md:px-7 py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest hover:border-red-600 transition';
            desktopItem.innerText = label;
            desktopItem.onclick = (e) => {
                e.preventDefault();
                switchView('library', cat);
            };
            desktopNav.appendChild(desktopItem);

            if (libraryFilters) {
                const filterItem = desktopItem.cloneNode(true);
                filterItem.setAttribute('data-category', cat);
                filterItem.onclick = (e) => {
                    e.preventDefault();
                    switchView('library', cat);
                };
                libraryFilters.appendChild(filterItem);
            }
        }
    });
}

let savedScrollY = 0;

function toggleCategoryMenu(show, triggerBack = true) {
    const fab = document.getElementById('mobileFab');
    const fabIconBars = document.getElementById('fabIconBars');
    const fabIconTimes = document.getElementById('fabIconTimes');

    if (show) {
        savedScrollY = window.scrollY || document.documentElement.scrollTop;

        const activeCat = document.querySelector('#libraryFilters .category-pill.active')?.getAttribute('data-category') || null;

        try {
            window.history.replaceState({
                view: currentView,
                category: activeCat,
                scrollY: savedScrollY,
                displayedCount: libraryDisplayedCount,
                validDakhiState: true
            }, '');

            window.history.pushState({
                isMenuOpen: true,
                view: currentView,
                category: activeCat,
                scrollY: savedScrollY,
                displayedCount: libraryDisplayedCount,
                validDakhiState: true
            }, '');
        } catch (e) { }

        if (categoryMenu) {
            categoryMenu.classList.remove('hidden');
            void categoryMenu.offsetWidth;
            categoryMenu.classList.add('active');
        }

        document.body.style.position = 'fixed';
        document.body.style.top = `-${savedScrollY}px`;
        document.body.style.width = '100%';

        if (fab) fab.classList.add('menu-open');
        if (fabIconBars) fabIconBars.classList.add('scale-0', 'opacity-0', '-rotate-90');
        if (fabIconTimes) fabIconTimes.classList.remove('scale-0', 'opacity-0', 'rotate-90');
    } else {
        if (categoryMenu) {
            categoryMenu.classList.remove('active');
            setTimeout(() => categoryMenu.classList.add('hidden'), 400);
        }

        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';

        window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });

        if (triggerBack && window.history.state?.isMenuOpen) {
            window.history.back();
        }

        if (fab) fab.classList.remove('menu-open');
        if (fabIconBars) fabIconBars.classList.remove('scale-0', 'opacity-0', '-rotate-90');
        if (fabIconTimes) fabIconTimes.classList.add('scale-0', 'opacity-0', 'rotate-90');
    }
}

// ==========================================
// 🚀 DRAGGABLE MOBILE FAB LOGIC
// ==========================================
const fab = document.getElementById('mobileFab');
let isDragging = false;
let startX, startY, initialX, initialY;
let translateX = 0, translateY = 0;
let moved = false;

function dragStart(e) {
    moved = false;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = fab.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;

    fab.style.left = `${initialX}px`;
    fab.style.top = `${initialY}px`;
    fab.style.bottom = 'auto';
    fab.style.right = 'auto';

    fab.style.transition = 'none';
    fab.setPointerCapture(e.pointerId);
}

function drag(e) {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        moved = true;
    }

    if (moved) {
        let nextX = initialX + dx;
        let nextY = initialY + dy;

        const maxX = document.documentElement.clientWidth - fab.offsetWidth;
        const maxY = document.documentElement.clientHeight - fab.offsetHeight;

        nextX = Math.max(0, Math.min(nextX, maxX));
        nextY = Math.max(0, Math.min(nextY, maxY));

        translateX = nextX - initialX;
        translateY = nextY - initialY;

        fab.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    }
}

function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    fab.releasePointerCapture(e.pointerId);

    if (moved) {
        let newX = initialX + translateX;
        let newY = initialY + translateY;

        const maxX = document.documentElement.clientWidth - fab.offsetWidth;
        const maxY = document.documentElement.clientHeight - fab.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        fab.style.transform = 'none';
        fab.style.left = `${newX}px`;
        fab.style.top = `${newY}px`;

        translateX = 0;
        translateY = 0;
    }

    void fab.offsetWidth;
    fab.style.transition = 'background-color 0.3s, box-shadow 0.3s, opacity 0.3s, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
}

if (fab) {
    fab.addEventListener('pointerdown', dragStart);
    fab.addEventListener('pointermove', drag);
    fab.addEventListener('pointerup', dragEnd);
    fab.addEventListener('pointercancel', dragEnd);

    fab.addEventListener('click', (e) => {
        if (moved) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        fab.classList.add('animation-stopped');
        const isMenuOpen = categoryMenu.classList.contains('active');
        toggleCategoryMenu(!isMenuOpen);
    });
}

window.addEventListener('resize', () => {
    if (!fab) return;
    const maxX = document.documentElement.clientWidth - fab.offsetWidth;
    const maxY = document.documentElement.clientHeight - fab.offsetHeight;
    const currentX = fab.offsetLeft;
    const currentY = fab.offsetTop;

    if (currentX > maxX) fab.style.left = `${maxX}px`;
    if (currentY > maxY) fab.style.top = `${maxY}px`;
    if (currentX < 0) fab.style.left = `0px`;
    if (currentY < 0) fab.style.top = `0px`;
});

function initHeroSlider() {
    const sliderWrapper = document.getElementById('sliderWrapper');
    if (!sliderWrapper || contentData.length === 0) return;

    sliderWrapper.innerHTML = '';

    const windowWidth = window.innerWidth;
    let colCount = 3;

    if (windowWidth >= 1280) colCount = 6;
    else if (windowWidth >= 1024) colCount = 5;
    else if (windowWidth >= 640) colCount = 4;
    else colCount = 3;

    sliderWrapper.style.gridTemplateColumns = `repeat(${colCount}, minmax(0, 1fr))`;

    const uniqueMoviesMap = new Map();
    contentData.forEach(item => {
        if (item && item.title && !uniqueMoviesMap.has(item.title)) {
            uniqueMoviesMap.set(item.title, item);
        }
    });
    const uniquePool = Array.from(uniqueMoviesMap.values());
    if (uniquePool.length === 0) return;

    const itemsPerCol = 8;
    const heroImgWidth = windowWidth < 640 ? 180 : 250;

    // 👇 OPTIMIZED DOM INJECTION (FIXES TBT) 👇
    const fragment = document.createDocumentFragment();

    for (let c = 0; c < colCount; c++) {
        const colDiv = document.createElement('div');
        const isUp = c % 2 === 0;
        colDiv.className = `flex flex-col ${isUp ? 'marquee-col-up' : 'marquee-col-down'}`;

        const colItems = [];
        const startIndex = (c * itemsPerCol) % uniquePool.length;

        for (let i = 0; i < itemsPerCol; i++) {
            colItems.push(uniquePool[(startIndex + i) % uniquePool.length]);
        }

        const doubledItems = [...colItems, ...colItems];

        doubledItems.forEach(movie => {
            const imgCard = document.createElement('div');
            imgCard.className = 'w-full p-1.5 md:p-2 shrink-0 box-border';
            imgCard.innerHTML = `
                <div class="w-full aspect-[2/3] rounded-lg md:rounded-xl overflow-hidden shadow-lg border border-white/10 cursor-pointer hover:scale-105 transition-transform duration-300 bg-zinc-900">
                    <img src="${getOptimizedImageUrl(movie.posterUrl, heroImgWidth)}" alt="${movie.title}" class="w-full h-full object-cover block" loading="lazy" decoding="async">
                </div>
            `;

            imgCard.onclick = () => openModal(movie.id);
            colDiv.appendChild(imgCard);
        });

        // Append to the invisible fragment first, NOT the live DOM
        fragment.appendChild(colDiv);
    }

    // Inject everything into the live DOM all at once (Zero layout thrashing)
    sliderWrapper.appendChild(fragment);
}

function updateSearchUI() {
    const libraryFilters = document.getElementById('libraryFilters');
    if (!searchInput) return;
    if (searchInput.value.trim().length > 0) {
        if (searchIcon) {
            searchIcon.classList.remove('fa-search');
            searchIcon.classList.add('fa-times', 'cursor-pointer');
        }
        if (libraryFilters) libraryFilters.style.display = 'none';
    } else {
        if (searchIcon) {
            searchIcon.classList.remove('fa-times', 'cursor-pointer');
            searchIcon.classList.add('fa-search');
        }
        if (libraryFilters) libraryFilters.style.display = '';
    }
}

// 🚀 SEARCH ICON CLICK HANDLER (X আইকনে ক্লিক করলে সার্চ ক্লিয়ার করার জন্য)
function handleSearchIconClick() {
    if (searchInput && searchInput.value.trim().length > 0) {
        clearSearch();
    } else if (searchInput) {
        searchInput.focus();
    }
}

// 🚀 CLEAR SEARCH & RESTORE EXACT SCROLL POSITION
function clearSearch(preventRestore = false) {
    if (searchInput) searchInput.value = '';
    updateSearchUI();
    if (searchInput) searchInput.blur();

    if (!preventRestore && preSearchState) {
        const targetState = preSearchState;
        preSearchState = null; // স্টেট রিসেট করার আগে ডাটা কপি রাখা
        switchView(targetState.view, targetState.category, 'replace', targetState.displayedCount, targetState.scrollY);
    } else {
        preSearchState = null;
        initLibraryRender();
    }
}

let preCategoryChangeState = null;

function switchView(viewName, filterCategory = null, mode = true, restoredCount = 0, targetScroll = 0) {
    // 🎯 ইউজার ক্যাটাগরি পরিবর্তনের আগে যেখানে ছিলেন (হোম/লাইব্রেরি, আগের ক্যাটাগরি ও এক্সাক্ট স্ক্রোল পজিশন) তা ব্যাকআপ রাখা
    const incomingCat = filterCategory || 'all';
    if (incomingCat !== 'all' && incomingCat !== lastVisitedCategory && !preCategoryChangeState) {
        const currentActiveCat = document.querySelector('#libraryFilters .category-pill.active')?.getAttribute('data-category') || 'all';
        const exactScrollBeforeChange = (document.body.style.position === 'fixed') ? savedScrollY : (window.scrollY || document.documentElement.scrollTop || 0);

        preCategoryChangeState = {
            view: currentView,
            category: currentView === 'home' ? 'all' : currentActiveCat,
            scrollY: exactScrollBeforeChange,
            displayedCount: libraryDisplayedCount || 30
        };
    }

    if (mode) {
        const currentScroll = (document.body.style.position === 'fixed') ? savedScrollY : window.scrollY;
        const activeCat = document.querySelector('#libraryFilters .category-pill.active')?.getAttribute('data-category') || null;
        try {
            window.history.replaceState({
                view: currentView,
                category: activeCat,
                scrollY: currentScroll,
                displayedCount: libraryDisplayedCount,
                validDakhiState: true
            }, '');
        } catch (e) { }
    }

    currentView = viewName;
    if (homeView) homeView.classList.remove('active');
    if (libraryView) libraryView.classList.remove('active');

    if (viewName === 'home') {
        if (homeView) homeView.classList.add('active');
        document.title = "MustWatchHub | Watch Dual Audio Movies & Web Series Free Online HD";
        if (searchInput) {
            searchInput.value = '';
            updateSearchUI();
        }
    } else {
        if (libraryView) libraryView.classList.add('active');
        if (filterCategory && searchInput) {
            searchInput.value = '';
            updateSearchUI();
            preSearchState = null;
        }

        document.title = filterCategory && filterCategory !== 'all' ? `${filterCategory.replace(/\+/g, ' ')} Movies - MustWatchHub` : "All Movies & Web Series - MustWatchHub";

        const catValue = filterCategory || 'all';
        document.querySelectorAll('#libraryFilters .category-pill').forEach(p => p.classList.remove('active'));
        document.querySelector(`#libraryFilters .category-pill[data-category="${catValue}"]`)?.classList.add('active');

        initLibraryRender(catValue, restoredCount);

        // 🎯 ক্যাটাগরি পরিবর্তনের সময় পপ-আপ অথবা স্মার্টলিংক অ্যাড ওপেন হওয়ার লজিক
        if (lastVisitedCategory !== catValue && catValue !== 'all') {
            if (MASTER_CONTROLS.ENABLE_CATEGORY_UNLOCK_POPUP) {
                showUnlockPopup();
            } else if (MASTER_CONTROLS.ENABLE_CATEGORY_SMARTLINK_AD) {
                window.open(GLOBAL_SMARTLINK_URL, '_blank');
            }
        }
        lastVisitedCategory = catValue;
    }

    if (mode) {
        try {
            const rootUrl = new URL('/', window.location.origin);
            if (viewName === 'library') {
                rootUrl.searchParams.set('view', 'library');
                if (filterCategory && filterCategory !== 'all') {
                    rootUrl.searchParams.set('category', filterCategory);
                }
            }

            const stateObj = { view: viewName, category: filterCategory, scrollY: targetScroll, displayedCount: restoredCount || 30, validDakhiState: true };

            if (mode === 'replace') {
                window.history.replaceState(stateObj, '', rootUrl);
            } else {
                window.history.pushState(stateObj, '', rootUrl);
            }
        } catch (e) { }

        // 🚀 EXACT SCROLL RESTORE: ইউজারকে ঠিক আগের স্ক্রোল পজিশনে ফিরিয়ে নেওয়া
        requestAnimationFrame(() => {
            window.scrollTo({ top: targetScroll, left: 0, behavior: 'instant' });
            setTimeout(() => window.scrollTo({ top: targetScroll, left: 0, behavior: 'instant' }), 40);
            setTimeout(() => window.scrollTo({ top: targetScroll, left: 0, behavior: 'instant' }), 100);
        });
    }
}

function createMovieCard(item, isAboveFold = false) {
    const card = document.createElement('a');
    const movieSlug = item.slug || generateMovieSlug(item.title);
    card.href = `/${movieSlug}.html`;
    card.className = 'movie-card relative flex flex-col group cursor-pointer no-underline';

    const infoText = item.seriesInfo ? `<p class="text-[9px] md:text-[10px] text-gray-400 font-medium mt-1 tracking-wide uppercase">${item.seriesInfo}</p>` : '';
    const qualityBadgeHtml = item.quality ? `<div class="absolute top-0 left-0 z-20 bg-[#E50914] text-white px-2 py-0.5 md:px-1.5 md:py-0.5 text-[8px] md:text-[10px] font-bold uppercase tracking-wider rounded-br-lg shadow-md">${item.quality}</div>` : '';
    const languageBadgeHtml = item.language ? `<div class="absolute top-0 right-0 z-20 bg-[#E50914] text-white px-2 py-0.5 md:px-1.5 md:py-0.5 text-[8px] md:text-[10px] font-bold uppercase tracking-wider rounded-bl-lg shadow-md">${item.language}</div>` : '';

    const loadingStrategy = isAboveFold ? 'eager' : 'lazy';
    const fetchPriority = isAboveFold ? 'high' : 'auto';

    card.innerHTML = `
        <div class="relative rounded-lg overflow-hidden bg-[#111] shadow-xl aspect-[2/3] ring-1 ring-white/5 transition-all duration-300">
            ${qualityBadgeHtml}
            ${languageBadgeHtml}
            <img src="${getOptimizedImageUrl(item.posterUrl, 250)}" alt="${item.title} Media Details & Poster" class="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110" loading="${loadingStrategy}" fetchpriority="${fetchPriority}" decoding="async">
            <div class="play-overlay absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center p-5 transition-opacity duration-500 ease-out">
                <div class="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white flex items-center justify-center bg-black/20 backdrop-blur-[1px] shadow-[0_0_15px_rgba(0,0,0,0.6)] transform scale-90 group-hover:scale-100 transition-all duration-500 ease-out">
                    <i class="fas fa-play text-white text-xs md:text-sm ml-1"></i>
                </div>
            </div>
        </div>
        <div class="mt-3 text-center flex flex-col items-center md:block">
            <h4 class="font-black text-white text-[11px] md:text-sm uppercase tracking-tight line-clamp-1">${item.title}</h4>
            ${infoText}
        </div>`;

    card.onclick = (e) => {
        e.preventDefault();
        openModal(item.id);
    };
    return card;
}

function renderRecentAdds() {
    if (!recentAddsGrid) return;
    recentAddsGrid.innerHTML = '';

    const recentItems = categoryIndexMap["Recent Adds"] || [];
    const fragment = document.createDocumentFragment();

    recentItems.slice(0, 18).forEach((item, index) => {
        // 🚀 First 6 items load with high priority for instant LCP
        fragment.appendChild(createMovieCard(item, index < 6));
    });

    recentAddsGrid.appendChild(fragment);
}

function renderCategorySections(forceRenderAll = false) {
    if (!categorySections) return;
    categorySections.innerHTML = '';
    const fragment = document.createDocumentFragment();

    const observerOptions = {
        root: null,
        rootMargin: '400px 0px',
        threshold: 0.01
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadCategorySection(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    function loadCategorySection(targetSection) {
        const cat = targetSection.getAttribute('data-category-lazy');
        const lazyGrid = targetSection.querySelector('.lazy-grid');

        const filtered = categoryIndexMap[cat] || [];

        lazyGrid.innerHTML = '';
        const cardsFragment = document.createDocumentFragment();

        filtered.slice(0, 11).forEach((item) => {
            cardsFragment.appendChild(createMovieCard(item));
        });

        lazyGrid.appendChild(cardsFragment);

        const displayName = cat === 'Korean Country' ? 'Korean' : cat;
        const viewAllCard = document.createElement('div');
        viewAllCard.className = 'view-all-card relative rounded-lg overflow-hidden group flex flex-col items-center justify-center p-6 cursor-pointer aspect-[2/3]';
        viewAllCard.innerHTML = `
            <div class="flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <div class="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:border-red-600 transition-all shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <i class="fas fa-arrow-right text-white text-xl"></i>
                </div>
                <h4 class="font-black text-sm uppercase text-white tracking-widest transition-transform duration-300 group-hover:scale-110">View All</h4>
                <p class="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-tighter transition-transform duration-300 group-hover:scale-110">${displayName}</p>
            </div>`;
        viewAllCard.onclick = () => { clearSearch(true); switchView('library', cat); };
        lazyGrid.appendChild(viewAllCard);

        targetSection.classList.remove('opacity-0');
        targetSection.classList.add('opacity-100');
    }

    categories.filter(c => c !== 'all').forEach(cat => {
        const filtered = categoryIndexMap[cat] || [];
        if (filtered.length === 0) return;

        const displayName = cat === 'Korean Country' ? 'Korean' : cat;
        const section = document.createElement('section');
        section.className = 'mb-20 md:mb-32 pt-6 md:pt-12 lazy-section opacity-0 min-h-[350px] transition-opacity duration-500';
        section.setAttribute('data-category-lazy', cat);

        section.innerHTML = `
            <div class="flex items-center justify-center gap-3 mb-8 md:mb-12">
                <div class="w-1.5 h-7 md:h-9 bg-red-600 rounded-full shadow-lg shadow-red-600/20"></div>
                <h3 class="text-2xl md:text-5xl font-black tracking-tighter uppercase text-white">${displayName}</h3>
            </div>
            
            <div class="lazy-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 md:gap-8 justify-center max-w-10xl mx-auto">
                <div class="col-span-full py-16 flex justify-center items-center">
                    <div class="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin opacity-45"></div>
                </div>
            </div>`;

        if (forceRenderAll) {
            loadCategorySection(section);
        } else {
            sectionObserver.observe(section);
        }

        fragment.appendChild(section);
    });
    categorySections.appendChild(fragment);
}

function initLibraryRender(filter = "all", initialCount = 0) {
    if (!libraryGrid) return;
    const rawQuery = searchInput ? searchInput.value : '';
    const cleanStr = (str) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : "";
    const cleanQuery = cleanStr(rawQuery);
    const isSearch = rawQuery.trim().length > 0;

    if (!libraryGrid.dataset.initialized) {
        libraryGrid.dataset.originalClasses = libraryGrid.className;
        libraryGrid.className = 'relative w-full';
        libraryGrid.dataset.initialized = 'true';
    }

    Array.from(libraryGrid.children).forEach(child => {
        child.classList.add('hidden');
    });

    const gridId = isSearch ? 'subgrid-search' : `subgrid-${filter.replace(/\s+/g, '-')}`;
    activeSubGridId = gridId;

    let subGrid = document.getElementById(gridId);

    if (isSearch && subGrid) {
        subGrid.remove();
        subGrid = null;
    }

    if (subGrid) {
        subGrid.classList.remove('hidden');
        let currentRendered = subGrid.children.length;
        let targetRender = Math.max(initialCount, parseInt(subGrid.dataset.displayedCount || ITEMS_PER_PAGE, 10));

        if (currentRendered < targetRender && currentRendered < libraryData.length) {
            const fragment = document.createDocumentFragment();
            libraryData.slice(currentRendered, targetRender).forEach(item => {
                fragment.appendChild(createMovieCard(item));
            });
            subGrid.appendChild(fragment);
        }
        libraryDisplayedCount = Math.min(targetRender, libraryData.length);
        subGrid.dataset.displayedCount = libraryDisplayedCount;
        updateLoadMoreVisibility();
        return;
    }

    subGrid = document.createElement('div');
    subGrid.id = gridId;
    subGrid.className = libraryGrid.dataset.originalClasses;
    libraryGrid.appendChild(subGrid);

    let sourceArray = contentData;
    if (!isSearch && filter !== "all") {
        sourceArray = categoryIndexMap[filter] || [];
    } else if (!isSearch && filter === "all") {
        sourceArray = categoryIndexMap["Recent Adds"] || [];
    }

    libraryData = sourceArray.filter(item => {
        const matchesCat = filter === "all" || item.category === filter || (filter === "all" && item.category === "Recent Adds");
        const matchesSearch = isSearch ? (cleanStr(item.title).includes(cleanQuery) || cleanStr(item.category).includes(cleanQuery) || cleanStr(item.genre).includes(cleanQuery)) : true;
        return matchesCat && matchesSearch;
    });

    libraryDisplayedCount = initialCount > 0 ? initialCount : ITEMS_PER_PAGE;
    subGrid.dataset.displayedCount = libraryDisplayedCount;

    if (libraryData.length === 0) {
        subGrid.innerHTML = `
            <div class="col-span-full py-10 px-3 sm:px-6 max-w-xl mx-auto flex flex-col items-center justify-center text-center">
                <div class="w-14 h-14 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500 text-xl shadow-inner animate-pulse">
                    <i class="fas fa-magnifying-glass"></i>
                </div>
                <h3 class="text-lg sm:text-2xl font-black uppercase text-white tracking-wider mb-2">No Results Found</h3>
                
                <p class="text-xs sm:text-sm text-gray-300 font-medium mb-6 leading-relaxed max-w-md">
                    Looking for a specific movie or web series? <br class="hidden sm:inline" />
                    <span class="text-amber-400 font-black tracking-wide inline-block mt-1 sm:mt-0 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                        ✨ Join our Social Communities To Submit Your Movie Request!
                    </span>
                </p>

                <div class="flex flex-row items-center justify-center gap-2 sm:gap-4 w-full max-w-md">
                    <a href="https://www.facebook.com/profile.php?id=61586944455346" target="_blank"
                        class="flex-1 bg-[#1877f2] hover:bg-[#166fe5] text-white py-2.5 px-2 min-[380px]:px-3 sm:px-4 rounded-xl text-[10px] min-[360px]:text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-blue-600/20 transition-all duration-300 hover:scale-105 no-underline whitespace-nowrap">
                        <i class="fab fa-facebook-f text-xs sm:text-sm"></i>
                        <span>Join Facebook</span>
                    </a>
                    <a href="https://t.me/+oeXeresjsFA1MjI1" target="_blank"
                        class="flex-1 bg-[#0088cc] hover:bg-[#0077b3] text-white py-2.5 px-2 min-[380px]:px-3 sm:px-4 rounded-xl text-[10px] min-[360px]:text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-sky-500/20 transition-all duration-300 hover:scale-105 no-underline whitespace-nowrap">
                        <i class="fab fa-telegram-plane text-xs sm:text-sm"></i>
                        <span>Join Telegram</span>
                    </a>
                </div>
            </div>
        `;
    } else {
        const fragment = document.createDocumentFragment();
        libraryData.slice(0, libraryDisplayedCount).forEach((item) => {
            fragment.appendChild(createMovieCard(item));
        });
        subGrid.appendChild(fragment);
    }

    updateLoadMoreVisibility();

    if (isSearch && libraryView) {
        const scrollTarget = libraryView.offsetTop - 100;
        window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    }
}

function renderLibraryChunk() {
    if (isLoading) return;
    isLoading = true;

    const nextCount = libraryDisplayedCount + ITEMS_PER_PAGE;
    const chunk = libraryData.slice(libraryDisplayedCount, nextCount);

    let subGrid = document.getElementById(activeSubGridId);

    if (chunk.length > 0 && subGrid) {
        const fragment = document.createDocumentFragment();
        chunk.forEach((item) => {
            fragment.appendChild(createMovieCard(item));
        });
        subGrid.appendChild(fragment);
        libraryDisplayedCount = nextCount;
        subGrid.dataset.displayedCount = libraryDisplayedCount;
        updateLoadMoreVisibility();
    }

    isLoading = false;
}

function updateLoadMoreVisibility() {
    const loading = document.getElementById('loadingIndicator');
    if (!loading) return;

    if (libraryDisplayedCount < libraryData.length) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function openModal(id) {
    savedScrollY = window.scrollY;
    executeActualOpenModal(id);
}

function executeActualOpenModal(id) {
    if (document.getElementById('mobileFab')) document.getElementById('mobileFab').classList.add('fab-hidden');

    const item = contentData.find(m => m.id === id);
    if (!item) return;

    const movieSlug = item.slug || generateMovieSlug(item.title);

    let newUrl;
    try {
        const baseOrigin = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'https://mustwatchhub.com';
        newUrl = new URL('/' + movieSlug + '.html', baseOrigin);
    } catch (e) {
        newUrl = { href: window.location.href };
    }

    const currentState = history.state || { view: currentView, validDakhiState: true };
    const isAlreadyModalOpen = window.history.state?.isModalOpen || (document.getElementById('movieModal') && !document.getElementById('movieModal').classList.contains('hidden'));

    if (isAlreadyModalOpen) {
        // 🚀 মোডাল ইতিমধ্যে ওপেন থাকলে নতুন হিস্ট্রি পুশ না করে রিপ্লেস করবে (যাতে ব্যাক চাপলে সরাসরি বন্ধ হয়)
        try { window.history.replaceState({ ...currentState, isModalOpen: true, modalId: id, validDakhiState: true }, '', (newUrl.href || newUrl)); } catch (e) { }
    } else {
        // 🚀 প্রথমবার মোডাল ওপেন হলে হিস্ট্রি স্টেট সেভ করবে
        try { window.history.replaceState({ ...currentState, scrollY: savedScrollY }, ''); } catch (e) { }
        try { window.history.pushState({ ...currentState, isModalOpen: true, modalId: id, validDakhiState: true }, '', (newUrl.href || newUrl)); } catch (e) { }
    }

    const isSeries = item.episodes && item.episodes.length > 0;
    const contentType = isSeries ? "Web Series All Episodes" : "Full Movie";
    const titleKey = item.title;

    const yearMatch = titleKey.match(/\((\d{4})\)/);
    const extractedYear = yearMatch ? yearMatch[1] : new Date().getFullYear();
    const releaseYear = item.year || extractedYear;

    const titleHasYear = titleKey.includes(`(${releaseYear})`);
    const SEOFullTitle = titleHasYear ? titleKey : `${titleKey} (${releaseYear})`;
    const cleanLang = item.language || "Dual Audio [Hindi-English] / ESub";

    document.title = `${SEOFullTitle} [${cleanLang}] | ${contentType} Media Details & Info - MustWatchHub`;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = "description";
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = `${SEOFullTitle} ${contentType} media details and stream overview. Access ${titleKey} in ${cleanLang} with English Subtitles (ESub) HEVC x265 on MustWatchHub.`;

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = newUrl.href;

    const setMetaTag = (attrName, attrValue, content) => {
        let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
        if (!el) { el = document.createElement('meta'); el.setAttribute(attrName, attrValue); document.head.appendChild(el); }
        el.setAttribute('content', content);
    };
    setMetaTag('property', 'og:title', document.title);
    setMetaTag('property', 'og:description', metaDescription.content);
    setMetaTag('property', 'og:url', newUrl.href);

    const modalTitleElem = document.getElementById('modalTitle');
    const isSameMovie = modalTitleElem && modalTitleElem.innerText === titleKey;

    currentItem = item;
    if (modalTitleElem) modalTitleElem.innerText = titleKey;

    if (document.getElementById('modalLanguage')) document.getElementById('modalLanguage').innerText = item.language;
    if (document.getElementById('modalCategory')) document.getElementById('modalCategory').innerText = item.category;

    const dynamicFooterKeywords = isSeries ?
        `${titleKey} web series overview, ${titleKey} episodes details, ${titleKey} season info, ${titleKey} dual audio hindi english series, ${titleKey} english subtitles esub, ${titleKey} media reference, must-watch-hub series review.` :
        `${titleKey} movie overview, ${titleKey} streaming details, ${titleKey} dual audio hindi english media, ${titleKey} english subtitles esub, ${titleKey} release info, must-watch-hub review.`;

    if (document.getElementById('modalDesc')) {
        renderModalContent(item, SEOFullTitle, titleKey, cleanLang, releaseYear, contentType, dynamicFooterKeywords, null);

        getClientTMDBDetails(item.title, releaseYear).then(tmdbData => {
            if (tmdbData) {
                renderModalContent(item, SEOFullTitle, titleKey, cleanLang, releaseYear, contentType, dynamicFooterKeywords, tmdbData);
            }
        });
    }

    // =====================================
    // 🚀 CONDITIONAL PLAYER / DOWNLOAD LOGIC
    // =====================================
    // 🔍 চেক করবে কোনো সচল (Enabled) সার্ভার আছে কি না
    const hasEnabledServer = (obj) => {
        if (!obj) return false;
        return STREAM_SERVER_CONFIG.some(
            s => s.enabled !== false && obj[s.key] && typeof obj[s.key] === 'string' && obj[s.key].trim() !== ''
        );
    };

    const hasVideoUrl = hasEnabledServer(item) || (item.episodes && item.episodes.length > 0 && hasEnabledServer(item.episodes[0]));

    const driveVideoWrapper = document.getElementById('driveVideoWrapper');
    const noVideoDownloadBox = document.getElementById('noVideoDownloadBox');
    const mainDownloadBtn = document.getElementById('mainDownloadBtn');

    if (!hasVideoUrl) {
        if (driveVideoWrapper) driveVideoWrapper.classList.add('hidden');
        if (noVideoDownloadBox) noVideoDownloadBox.classList.remove('hidden');
        if (mainDownloadBtn) mainDownloadBtn.classList.add('hidden');
    } else {
        if (driveVideoWrapper) driveVideoWrapper.classList.remove('hidden');
        if (noVideoDownloadBox) noVideoDownloadBox.classList.add('hidden');
        if (mainDownloadBtn) mainDownloadBtn.classList.remove('hidden');
    }

    resetDownloadButtonUI();

    // RESET ALL DOWNLOAD CLICKS AND STATES
    downloadClickCount = 0;

    if (mainDownloadBtn) {
        document.getElementById('downloadBtnText').innerText = "Download";
        mainDownloadBtn.classList.remove('from-gray-600', 'to-gray-800', 'border-gray-500', 'cursor-not-allowed', 'opacity-80', 'from-red-600', 'to-red-700', 'border-red-500', 'shadow-[0_0_15px_rgba(229,9,20,0.4)]');
        mainDownloadBtn.classList.add('from-[#2B2727]', 'to-[#2B2727]', 'border-[#E3DADA]', 'hover:scale-105');
        const mainIcon = mainDownloadBtn.querySelector('i');
        if (mainIcon) mainIcon.className = 'fas fa-cloud-download-alt text-md relative z-10 group:-translate-y-1 transition-transform duration-300';
    }

    const topDownloadBtn = document.getElementById('topDownloadBtn');
    if (topDownloadBtn) {
        document.getElementById('topDownloadBtnText').innerText = "Download Movie";
    }

    if (item.episodes && item.episodes.length > 0) {
        if (!isSameMovie) currentEpisodeIndex = 0;
    } else {
        currentEpisodeIndex = null;
    }

    const seriesSec = document.getElementById('seriesSection');
    const epList = document.getElementById('episodeList');

    if (item.episodes && item.episodes.length > 0 && seriesSec && epList) {
        seriesSec.classList.remove('hidden');
        if (document.getElementById('seriesInfoText')) {
            document.getElementById('seriesInfoText').innerText = item.seriesInfo || "Season 1 • Episodes";
        }
        epList.innerHTML = '';
        item.episodes.forEach((ep, idx) => {
            const btn = document.createElement('button');
            btn.className = `episode-btn px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black hover:bg-red-600 transition tracking-widest uppercase ${idx === (currentEpisodeIndex || 0) ? 'active' : ''}`;
            btn.innerText = ep.title || `Episode ${idx + 1}`;
            btn.onclick = () => playEpisode(idx, btn);
            epList.appendChild(btn);
        });

        // 🚀 সার্ভার রেন্ডারিং ফাংশনটিই এখন ভিডিও লোড করবে, তাই আলাদাভাবে loadIframeUrl কল করার প্রয়োজন নেই।
    } else if (seriesSec) {
        seriesSec.classList.add('hidden');
    }

    const modal = document.getElementById('movieModal');
    if (modal) {
        // 🚀 Step 1: Reveal element first so browser creates layout box
        modal.classList.remove('hidden');

        // 🚀 Step 2: Instant reset scroll position
        modal.scrollTop = 0;
        if (typeof modal.scrollTo === 'function') {
            modal.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }

        void modal.offsetWidth;
        modal.classList.add('active');

        // 🚀 Step 3: Re-enforce reset on next animation frame after DOM paint
        requestAnimationFrame(() => {
            modal.scrollTop = 0;
        });
    }

    renderServerButtons();

    // 👇 নতুন লাইন: মোডাল ওপেন হলে ফ্রেশ সাজেশন জেনারেট হবে 👇
    renderModalSuggestions(item);

    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';
}

function closeModal(triggerBack = false, isUserAction = false) {
    if (isModalClosing) return;
    isModalClosing = true;

    const modal = document.getElementById('movieModal');
    if (modal) {
        modal.classList.remove('active');
        // 🚀 Reset scroll position when modal begins closing
        modal.scrollTop = 0;

        setTimeout(() => {
            const actualVideo = document.getElementById('actualVideo');
            if (actualVideo) {
                actualVideo.innerHTML = '';
                actualVideo.classList.add('hidden');
            }
            modal.scrollTop = 0;
            modal.classList.add('hidden');
        }, 300);
    }

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, savedScrollY);

    const fab = document.getElementById('mobileFab');
    if (fab) fab.classList.remove('fab-hidden');

    if (triggerBack && window.history.state?.isModalOpen) {
        window.history.back();
    } else if (isUserAction) {
        try {
            const currentState = history.state || { view: currentView, validDakhiState: true };
            // 🚀 URL RESET FIX: মোডাল বন্ধ করে হোমে গেলে অ্যাড্রেস বার থেকে /movie-slug.html মুছে মেইন হোম ইউআরএল সেভ করবে
            const rootUrl = new URL('/', window.location.origin);
            if (currentView === 'library') {
                rootUrl.searchParams.set('view', 'library');
                const activeCat = document.querySelector('#libraryFilters .category-pill.active')?.getAttribute('data-category');
                if (activeCat && activeCat !== 'all') {
                    rootUrl.searchParams.set('category', activeCat);
                }
            }
            window.history.replaceState({ ...currentState, isModalOpen: false }, '', rootUrl);
        } catch (e) { }
        document.title = currentView === 'home' ? "MustWatchHub | Watch Dual Audio Movies & Web Series Free Online HD" : "All Movies & Web Series - MustWatchHub";
    }

    setTimeout(() => { isModalClosing = false; }, 350);
}

// ==========================================
// 🚀 DOWNLOAD BUTTON STATE & CLICK HANDLER
// ==========================================
let downloadState = 0; // 0 = Initial Clicks, 1 = Final Click Ready, 2 = Watch Now
let downloadSmartlinkClicks = 0;

// 🎯 "Download (Final Click)" বাটন স্টেট সেট করার ফাংশন
function applyFinalDownloadButtonState() {
    const mainDownloadBtn = document.getElementById('mainDownloadBtn');
    const downloadBtnText = document.getElementById('downloadBtnText');
    const topDownloadBtn = document.getElementById('topDownloadBtn');
    const topText = document.getElementById('topDownloadBtnText');
    const topSub = document.getElementById('topDownloadBtnSubText');
    const topIcon = document.getElementById('topDownloadBtnIcon');

    if (mainDownloadBtn) {
        if (downloadBtnText) downloadBtnText.innerText = "Download (Final Click)";
        mainDownloadBtn.classList.remove('from-[#2B2727]', 'to-[#2B2727]', 'border-[#E3DADA]');
        mainDownloadBtn.classList.add('btn-final-click');
    }

    if (topDownloadBtn) {
        topDownloadBtn.classList.remove('step-1', 'step-3');
        topDownloadBtn.classList.add('step-2');
        if (topText) topText.innerText = "Get Download Link (Final)";
        if (topSub) topSub.innerText = "🔥 Direct Link Ready • Click to Start";
        if (topIcon) topIcon.className = "fas fa-bolt text-lg animate-bounce";
    }
}

// 🔄 বাটন রিসেট ফাংশন
function resetDownloadButtonUI() {
    downloadState = 0;
    downloadSmartlinkClicks = 0;
    nativeAdClicksDone = 0;

    const mainDownloadBtn = document.getElementById('mainDownloadBtn');
    if (mainDownloadBtn) {
        document.getElementById('downloadBtnText').innerText = "Download";
        mainDownloadBtn.className = "relative overflow-hidden bg-gradient-to-r from-[#2B2727] to-[#2B2727] border border-[#E3DADA] text-white px-8 py-3.5 rounded-md font-black hover:scale-105 transition-all duration-300 text-sm uppercase tracking-widest flex items-center gap-3 group";
        const mainIcon = mainDownloadBtn.querySelector('i');
        if (mainIcon) mainIcon.className = 'fas fa-cloud-download-alt text-md relative z-10 group:-translate-y-1 transition-transform duration-300';
    }

    const topDownloadBtn = document.getElementById('topDownloadBtn');
    if (topDownloadBtn) {
        topDownloadBtn.classList.remove('step-1', 'step-2', 'step-3');
        const topText = document.getElementById('topDownloadBtnText');
        const topSub = document.getElementById('topDownloadBtnSubText');
        const topIcon = document.getElementById('topDownloadBtnIcon');
        if (topText) topText.innerText = "Download";
        if (topSub) topSub.innerText = "⚡ Fast Server • Direct Link";
        if (topIcon) topIcon.className = "fas fa-cloud-arrow-down text-lg";
    }
}

// 🖱️ মূল ডাউনলোড বাটন ক্লিক হ্যান্ডলার
function handleDownloadClick() {
    if (!currentItem) return;

    const mainDownloadBtn = document.getElementById('mainDownloadBtn');
    const mainIcon = mainDownloadBtn ? mainDownloadBtn.querySelector('i') : null;
    const topDownloadBtn = document.getElementById('topDownloadBtn');
    const smartAdLink = currentItem?.downloadUrl1 || GLOBAL_SMARTLINK_URL;

    // 🔄 যদি বাটনটি ইতিমধ্যেই "Watch Now" থাকে: ওপরে স্ক্রোল ও রিসেট হবে
    if (downloadState === 2) {
        const movieModal = document.getElementById('movieModal');
        if (movieModal) movieModal.scrollTo({ top: 0, behavior: 'smooth' });
        resetDownloadButtonUI();
        return;
    }

    // 🚀 STEP 1: প্রথম ধাপের অ্যাড মেকানিজম
    if (downloadState === 0) {
        // ১. যদি নেটিভ ব্যানার পপ-আপ অন থাকে
        if (MASTER_CONTROLS.ENABLE_DOWNLOAD_NATIVE_POPUP) {
            showNativeAdPopup();
            return;
        }

        // ২. যদি সরাসরি স্মার্টলিংক অ্যাড অন থাকে (২ ক্লিকে অ্যাড ওপেন হবে)
        if (MASTER_CONTROLS.ENABLE_DOWNLOAD_SMARTLINK_ADS) {
            downloadSmartlinkClicks++;

            if (downloadSmartlinkClicks === 1) {
                // ১ম ক্লিকে ১ম স্মার্টলিংক ওপেন হবে
                window.open(smartAdLink, '_blank');
                document.getElementById('downloadBtnText').innerText = "Ready For Download (1/2)";

                if (topDownloadBtn) {
                    topDownloadBtn.classList.add('step-1');
                    const topText = document.getElementById('topDownloadBtnText');
                    const topSub = document.getElementById('topDownloadBtnSubText');
                    if (topText) topText.innerText = "Ready For Download (Step 1)";
                    if (topSub) topSub.innerText = "⏳ Verified • Click Again To Finalize";
                }
                return;
            } else if (downloadSmartlinkClicks >= 2) {
                // ২য় ক্লিকে ২য় স্মার্টলিংক ওপেন হবে এবং বাটন "Final Click" এ চলে যাবে
                window.open(smartAdLink, '_blank');
                downloadState = 1;
                applyFinalDownloadButtonState();
                return;
            }
        }

        // ৩. কোনো অ্যাড অন না থাকলে সরাসরি ফাইনাল স্টেটে চলে যাবে
        downloadState = 1;
        applyFinalDownloadButtonState();
        return;
    }

    // 🚀 STEP 2: "Download (Final Click)" এ ক্লিক করলে মূল ফাইল ডাউনলোড ওপেন হবে এবং বাটন "Watch Now" হবে
    if (downloadState === 1) {
        const finalUrl = (currentEpisodeIndex !== null && currentItem?.episodes && currentItem.episodes[currentEpisodeIndex].downloadUrl)
            ? currentItem.episodes[currentEpisodeIndex].downloadUrl
            : (currentItem?.downloadUrl2 || currentItem?.downloadUrl1);

        if (finalUrl) {
            window.open(finalUrl, '_blank');
        }

        downloadState = 2;

        if (mainDownloadBtn) {
            document.getElementById('downloadBtnText').innerText = "Watch Now";
            mainDownloadBtn.className = "relative overflow-hidden btn-watch-now text-white px-8 py-3.5 rounded-md font-black hover:scale-105 transition-all duration-300 text-sm uppercase tracking-widest flex items-center gap-3 group";
            if (mainIcon) mainIcon.className = 'fas fa-play-circle text-md relative z-10 group:-translate-y-1 transition-transform duration-300';
        }

        if (topDownloadBtn) {
            topDownloadBtn.classList.remove('step-1', 'step-2');
            topDownloadBtn.classList.add('step-3');
            const topText = document.getElementById('topDownloadBtnText');
            const topSub = document.getElementById('topDownloadBtnSubText');
            const topIcon = document.getElementById('topDownloadBtnIcon');
            if (topText) topText.innerText = "Download Started";
            if (topSub) topSub.innerText = "✅ Media File Download Triggered";
            if (topIcon) topIcon.className = "fas fa-check-circle text-lg";
        }
    }
}

function playEpisode(index, btnElement) {
    // ১. বাটনের স্টাইল আপডেট
    document.querySelectorAll('.episode-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    // ২. 🚀 বর্তমান এপিসোড ইনডেক্স আপডেট করা (সবচেয়ে জরুরি)
    currentEpisodeIndex = index;
    downloadClickCount = 0;

    // ৩. 🚀 ভিডিও প্লেয়ার আপডেট করা (এই লাইনটি মিসিং ছিল!)
    renderServerButtons();

    // ৪. ডাউনলোড বাটন রিসেট
    const downloadBtn = document.getElementById('mainDownloadBtn');
    if (downloadBtn) {
        document.getElementById('downloadBtnText').innerText = "Download";

        // সব মডিফায়েড স্টাইল রিমুভ করে অরিজিনাল ব্ল্যাক বাটনে ব্যাক করা
        downloadBtn.classList.remove('from-gray-600', 'to-gray-800', 'border-gray-500', 'cursor-not-allowed', 'opacity-80', 'from-red-600', 'to-red-700', 'border-red-500', 'shadow-[0_0_15px_rgba(229,9,20,0.4)]', '!bg-none', '!bg-[#111]', '!border-white', '!text-white');
        downloadBtn.classList.add('from-[#2B2727]', 'to-[#2B2727]', 'border-[#E3DADA]', 'hover:scale-105');

        // অরিজিনাল ক্লাউড ডাউনলোড আইকন রিস্টোর করা
        const icon = downloadBtn.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-cloud-download-alt text-md relative z-10 group:-translate-y-1 transition-transform duration-300';
        }

        const wave = downloadBtn.querySelector('.animate-shine-wave');
        if (wave) wave.classList.remove('hidden');
    }

    // ৫. 🚀 AUTO SCROLL FIX: এপিসোড পরিবর্তন করলে মোডালটি স্মুথলি একদম ওপরে চলে যাবে
    const movieModal = document.getElementById('movieModal');
    if (movieModal) {
        movieModal.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

if (searchInput) {
    searchInput.addEventListener('focus', () => {
        if (!preSearchState && searchInput.value.trim().length === 0) {
            const activeCat = document.querySelector('#libraryFilters .category-pill.active')?.getAttribute('data-category') || 'all';
            preSearchState = {
                view: currentView,
                scrollY: window.scrollY,
                category: activeCat,
                displayedCount: libraryDisplayedCount
            };
        }
    });

    searchInput.addEventListener('input', debounce(() => {
        const rawQuery = searchInput.value;
        updateSearchUI();

        if (rawQuery.trim().length > 0) {
            if (!preSearchState) {
                const activeCat = document.querySelector('#libraryFilters .category-pill.active')?.getAttribute('data-category') || 'all';
                preSearchState = {
                    view: currentView,
                    scrollY: window.scrollY,
                    category: activeCat,
                    displayedCount: libraryDisplayedCount
                };
            }

            if (currentView !== 'library') switchView('library');
            initLibraryRender();
        } else {
            if (preSearchState) {
                switchView(preSearchState.view, preSearchState.category, 'replace', preSearchState.displayedCount, preSearchState.scrollY);
                preSearchState = null;
            } else {
                initLibraryRender();
            }
        }
    }, 300));

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            const modal = document.getElementById('movieModal');
            const catMenu = document.getElementById('categoryMenu');

            if ((modal && modal.classList.contains('active')) || (catMenu && catMenu.classList.contains('active'))) {
                return;
            }

            if (searchInput.value.trim().length === 0 && preSearchState) {
                clearSearch();
            }
        }, 200);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchInput.blur();
        }
    });
}

window.addEventListener('scroll', () => {
    if (document.body.style.position === 'fixed') return;

    if (currentView === 'library') {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 500) {
            if (!isLoading && libraryDisplayedCount < libraryData.length) {
                renderLibraryChunk();
            }
        }
    }

    clearTimeout(scrollTimeoutId);
    scrollTimeoutId = setTimeout(() => {
        const modal = document.getElementById('movieModal');
        const catMenu = document.getElementById('categoryMenu');
        if ((!modal || !modal.classList.contains('active')) && (!catMenu || !catMenu.classList.contains('active')) && document.body.style.position !== 'fixed') {
            const currentState = history.state || { view: currentView, category: null, validDakhiState: true };
            try {
                window.history.replaceState({
                    ...currentState,
                    scrollY: window.scrollY,
                    displayedCount: libraryDisplayedCount
                }, '');
            } catch (e) { }
        }
    }, 150);
}, { passive: true });

window.addEventListener('beforeunload', () => {
    const modal = document.getElementById('movieModal');
    const catMenu = document.getElementById('categoryMenu');
    if ((!modal || !modal.classList.contains('active')) && (!catMenu || !catMenu.classList.contains('active'))) {
        sessionStorage.setItem('MustWatchHub_ExactScroll', window.scrollY);
        sessionStorage.setItem('MustWatchHub_Count', libraryDisplayedCount);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const seoContent = document.getElementById('seo-ssr-content');
    if (seoContent) {
        seoContent.style.display = 'none';
    }

    await databaseLoadPromise;

    const reloadScroll = sessionStorage.getItem('MustWatchHub_ExactScroll');
    const reloadCount = sessionStorage.getItem('MustWatchHub_Count');
    let finalScroll = 0;
    let finalCount = ITEMS_PER_PAGE;
    let isRestoring = false;

    if (reloadScroll !== null) {
        finalScroll = parseInt(reloadScroll, 10);
        sessionStorage.removeItem('MustWatchHub_ExactScroll');
        if (finalScroll > 0) isRestoring = true;
    }
    if (reloadCount !== null) {
        finalCount = parseInt(reloadCount, 10);
        sessionStorage.removeItem('MustWatchHub_Count');
    }

    renderCategories();

    // 🚀 STEP 1: পেজের মূল কন্টেন্ট (LCP) সাথে সাথে রেন্ডার হবে
    renderRecentAdds();

    // 🚀 STEP 2: ব্রাউজারের মেইন থ্রেডকে ফ্রি রেখে ১০০ms পর ক্যাটাগরি লোড হবে
    setTimeout(() => {
        renderCategorySections(isRestoring);
    }, 100);

    // 🚀 STEP 3: ৩০০ms পর ব্যাকগ্রাউন্ড হিরো মার্কি স্লাইডার তৈরি হবে
    setTimeout(() => {
        initHeroSlider();
    }, 300);

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => initHeroSlider(), { timeout: 1500 });
    } else {
        setTimeout(() => initHeroSlider(), 800);
    };

    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') || 'home';
    const category = params.get('category');

    let movieSlug = params.get('movie');

    if (!movieSlug) {
        const path = window.location.pathname;
        if (path.endsWith('.html')) {
            const excludedFiles = ['/index.html', '/contact.html', '/dmca.html', '/privacy.html', '/disclaimer.html'];
            if (!excludedFiles.includes(path)) {
                movieSlug = decodeURIComponent(path.replace('/', '').replace('.html', ''));
            }
        }
    }

    const isBlob = window.location.protocol === 'blob:';

    if (history.state && !movieSlug) {
        const state = history.state;
        finalScroll = finalScroll > 0 ? finalScroll : (state.scrollY || 0);
        finalCount = finalCount > ITEMS_PER_PAGE ? finalCount : (state.displayedCount || ITEMS_PER_PAGE);
        switchView(state.view, state.category, false, finalCount);
    } else if (!isBlob && !movieSlug) {
        try { window.history.replaceState({ view: view, category: category, scrollY: 0, displayedCount: finalCount, validDakhiState: true }, ''); } catch (e) { }
        switchView(view, category, false, finalCount);
    } else if (!movieSlug) {
        switchView('home', null, false, finalCount);
    }

    if (isRestoring && !movieSlug) {
        requestAnimationFrame(() => {
            window.scrollTo({ top: finalScroll, left: 0, behavior: 'instant' });
            setTimeout(() => window.scrollTo({ top: finalScroll, left: 0, behavior: 'instant' }), 50);
        });
    }

    if (movieSlug) {
        const targetMovie = contentData.find(m => m.slug === movieSlug);
        if (targetMovie) {
            setTimeout(() => {
                openModal(targetMovie.id);
            }, 300);
        }
    }
});

window.addEventListener('popstate', (event) => {
    const state = event.state;
    const modal = document.getElementById('movieModal');

    let handledOverlayClose = false;

    if (modal && (!modal.classList.contains('hidden') || isModalClosing)) {
        // 🚀 ব্যাক বাটনে চাপ দিলে যদি কারেন্ট স্টেট আর মোডাল না থাকে, সাথে সাথে মোডাল বন্ধ হবে
        if (!state || !state.isModalOpen) {
            if (!isModalClosing) {
                closeModal(false, false);
            }
            handledOverlayClose = true;
        } else if (state.isModalOpen && state.modalId && state.modalId !== currentItem?.id) {
            executeActualOpenModal(state.modalId);
            handledOverlayClose = true;
        }
    }

    if (categoryMenu && (!categoryMenu.classList.contains('hidden') || categoryMenu.classList.contains('active')) && (!state || !state.isMenuOpen)) {
        toggleCategoryMenu(false, false);
        handledOverlayClose = true;
    }

    if (handledOverlayClose) return;

    if (state || window.location.search) {
        const targetView = state?.view || 'home';
        const targetCat = state?.category || null;
        const targetScroll = (state && typeof state.scrollY === 'number') ? state.scrollY : savedScrollY;
        const targetCount = state?.displayedCount || 30;

        switchView(targetView, targetCat, false, targetCount);

        requestAnimationFrame(() => {
            window.scrollTo({ top: targetScroll, left: 0, behavior: 'instant' });
            setTimeout(() => {
                window.scrollTo({ top: targetScroll, left: 0, behavior: 'instant' });
            }, 50);
        });
    } else {
        switchView('home', null, false);
        void document.documentElement.offsetHeight;
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
});

window.addEventListener('click', (e) => {
    if (e.target === categoryMenu && e.target !== document.getElementById('mobileFab') && document.getElementById('mobileFab') && !document.getElementById('mobileFab').contains(e.target)) toggleCategoryMenu(false);
});

const movieModalElem = document.getElementById('movieModal');
if (movieModalElem) {
    movieModalElem.addEventListener('click', (e) => {
        if (window.innerWidth < 1024) return;
        // 🛡️ সাজেশন সেকশন এবং কার্ডগুলোকে ক্লিক প্রটেকশনে যুক্ত করা হয়েছে
        const isInteractiveContent = e.target.closest('.drive-video-wrapper, #serverSection, #seriesSection, #socialJoinSection, #mainDownloadBtn, #modalDesc, .lang-badge, #modalUpNextSection, #modalUpNextGrid, .suggest-card, button, a, iframe, input');

        if (!isInteractiveContent) {
            closeModal(true, true);
        }
    });
}

function showToast(message) {
    const toast = document.getElementById('toastMessage');
    const toastText = document.getElementById('toastText');
    if (!toast || !toastText) return;

    toastText.innerHTML = message;
    toast.classList.remove('opacity-0', '-translate-y-8', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-8', 'pointer-events-none');
        toast.classList.remove('opacity-100', 'translate-y-0');
    }, 4000);
}

// ==========================================
// 🚀 2-STEP CATEGORY UNLOCK GATEWAY ENGINE
// ==========================================
const ENABLE_UNLOCK_CATEGORY_POPUP = true;
let catUnlockClicksDone = 0;

// 📺 Category Ad Iframe Renderer (Adsterra Full Size)
function renderCatUnlockAdIframe() {
    const container = document.getElementById('catUnlockAdIframeBox');
    if (!container) return;

    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.style.margin = '0';
    iframe.style.padding = '0';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    container.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <base target="_blank">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: #000000; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                #container-faea46eecf01053afa6ef2518e3c0630 { width: 100% !important; height: 100% !important; display: flex !important; justify-content: center !important; align-items: center !important; margin: 0 !important; padding: 0 !important; }
                #container-faea46eecf01053afa6ef2518e3c0630 * { max-width: 100% !important; max-height: 100% !important; }
                #container-faea46eecf01053afa6ef2518e3c0630 img { width: 100% !important; height: auto !important; object-fit: cover !important; display: block !important; margin: 0 auto !important; }
                table, tr, td { padding: 0 !important; margin: 0 !important; border: 0 !important; width: 100% !important; height: 100% !important; text-align: center !important; }
            </style>
        </head>
        <body>
            <div id="container-faea46eecf01053afa6ef2518e3c0630"></div>
            <script async="async" data-cfasync="false" src="https://pl30567165.profitableratecpmnetwork.com/faea46eecf01053afa6ef2518e3c0630/invoke.js"><\/script>
        </body>
        </html>
    `);
    doc.close();
}

function showUnlockPopup() {
    // 🛡️ সুইচ OFF (false) থাকলে কোনো পপ-আপ ওপেন হবে না
    if (!MASTER_CONTROLS.ENABLE_CATEGORY_UNLOCK_POPUP) return;

    const popup = document.getElementById('unlockCategoryPopup');
    if (!popup) return;

    catUnlockClicksDone = 0;

    // UI Reset to Step 0
    const badge = document.getElementById('catUnlockStepBadge');
    const title = document.getElementById('catUnlockStepTitle');
    const desc = document.getElementById('catUnlockStepDesc');
    const progressPercent = document.getElementById('catUnlockProgressPercent');
    const progressLabel = document.getElementById('catUnlockProgressLabel');

    const node0 = document.getElementById('catStepNode0');
    const node1 = document.getElementById('catStepNode1');
    const node2 = document.getElementById('catStepNode2');
    const line1 = document.getElementById('catStepLine1');
    const line2 = document.getElementById('catStepLine2');

    if (badge) badge.innerText = "Step 1 of 2: Verification";
    if (title) title.innerText = "Unlock Category";
    if (desc) desc.innerText = "Click the sponsor box below to unlock exclusive movies in this category.";
    if (progressPercent) {
        progressPercent.innerText = "Step 0 of 2";
        progressPercent.className = "text-red-400 font-black";
    }
    if (progressLabel) progressLabel.innerText = "Verification Step";

    // Reset Stepper Styles
    if (node0) node0.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs border-2 border-red-500 bg-red-600 text-white shadow-[0_0_12px_rgba(229,9,20,0.7)] transition-all duration-300 z-10";
    if (node1) node1.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white/20 bg-zinc-900 text-gray-400 transition-all duration-300 z-10";
    if (node2) node2.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white/20 bg-zinc-900 text-gray-400 transition-all duration-300 z-10";
    if (line1) line1.style.width = "0%";
    if (line2) line2.style.width = "0%";

    renderCatUnlockAdIframe();
    popup.classList.remove('hidden');
    popup.classList.add('flex');
    void popup.offsetWidth;
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ❌ ক্যাটাগরি পপ-আপ সরাসরি বন্ধ করার মূল ফাংশন
function closeUnlockCategoryPopupDirect() {
    const popup = document.getElementById('unlockCategoryPopup');
    if (!popup) return;

    popup.classList.remove('active');
    popup.classList.remove('flex');
    popup.classList.add('hidden');
    document.body.style.overflow = '';
}

// ❌ ইউজার 'X' বাটনে চাপ দিলে পপ-আপ বন্ধ হয়ে পূর্বের এক্সাক্ট পেজ ও স্ক্রোল পজিশনে ফেরত যাবে
function cancelUnlockCategory(e) {
    if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
    }
    closeUnlockCategoryPopupDirect();

    if (preCategoryChangeState) {
        const prevState = preCategoryChangeState;
        preCategoryChangeState = null;
        lastVisitedCategory = prevState.category;

        // 🚀 ইউজার পূর্বে যে ভিউতে, যে ক্যাটাগরিতে এবং যে পজিশনে ছিলেন সেখানে স্ক্রোল ব্যাক করবে
        switchView(prevState.view, prevState.category, 'replace', prevState.displayedCount, prevState.scrollY);
    } else {
        switchView('home', null, 'replace', 30, 0);
    }
}

// 🖱️ ক্যাটাগরি বিজ্ঞাপনে ক্লিক হ্যান্ডলার (২ ক্লিকে আনলক সম্পন্ন হবে)
function handleUnlockCategoryAdClick(e) {
    if (e && e.target && e.target.closest('button')) return;

    const smartAdLink = "https://www.profitableratecpmnetwork.com/rr3q82zj6?key=c81990371bb12dd6139bb39d8a8b4a4e";
    window.open(smartAdLink, '_blank');

    catUnlockClicksDone++;

    const badge = document.getElementById('catUnlockStepBadge');
    const title = document.getElementById('catUnlockStepTitle');
    const desc = document.getElementById('catUnlockStepDesc');
    const progressPercent = document.getElementById('catUnlockProgressPercent');
    const progressLabel = document.getElementById('catUnlockProgressLabel');

    const node1 = document.getElementById('catStepNode1');
    const node2 = document.getElementById('catStepNode2');
    const line1 = document.getElementById('catStepLine1');
    const line2 = document.getElementById('catStepLine2');

    if (catUnlockClicksDone === 1) {
        // 🚀 ১ম ক্লিক: লাইন ১ পূর্ণ হবে এবং নোড ১ সক্রিয় হবে
        if (badge) badge.innerText = "Step 2 of 2: Final Step";
        if (title) title.innerText = "Almost Done • Final Step";
        if (desc) desc.innerText = "Click the final sponsor box below to view this category.";
        if (progressPercent) {
            progressPercent.innerText = "Step 1 of 2";
            progressPercent.className = "text-amber-400 font-black";
        }
        if (progressLabel) progressLabel.innerText = "In Progress";

        if (line1) line1.style.width = "100%";
        if (node1) {
            node1.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs border-2 border-amber-500 bg-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.7)] transition-all duration-300 z-10";
        }

        renderCatUnlockAdIframe();
    } else if (catUnlockClicksDone >= 2) {
        // 🚀 ২য় ক্লিক: নোড ২ সবুজ হবে এবং ক্যাটাগরি সফলভাবে আনলক হয়ে যাবে
        if (line2) line2.style.width = "100%";
        if (node2) {
            node2.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs border-2 border-emerald-500 bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-all duration-300 z-10";
        }
        if (progressPercent) {
            progressPercent.innerText = "Step 2 of 2 (Done)";
            progressPercent.className = "text-emerald-400 font-black";
        }
        if (progressLabel) progressLabel.innerText = "Unlocked";

        closeUnlockCategoryPopupDirect();
        preCategoryChangeState = null;
    }
}

// ❌ পপ-আপ তাৎক্ষণিক বন্ধ করার ফাংশন
function closeNativeAdPopup(e) {
    if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
    }
    const popup = document.getElementById('nativeAdPopup');
    if (!popup) return;

    popup.classList.remove('active');
    popup.classList.remove('flex');
    popup.classList.add('hidden');
    document.body.style.overflow = '';
}

// 🖱️ ডার্ক ব্যাকড্রপে ক্লিক করলে বন্ধ হবে
function handleNativePopupBackdrop(e) {
    if (e.target.id === 'nativeAdPopup') {
        closeNativeAdPopup(e);
    }
}

// 🖱️ বিজ্ঞাপনে ক্লিক হ্যান্ডলার (২য় ক্লিকে সরাসরি বন্ধ হবে)
function handleNativePopupAdClick(e) {
    // যদি ক্লোজ বাটনে ক্লিক পড়ে তবে বিজ্ঞাপনের কাউন্ট হবে না
    if (e && e.target && e.target.closest('button')) return;

    const smartAdLink = currentItem?.downloadUrl1 || "https://www.profitableratecpmnetwork.com/rr3q82zj6?key=c81990371bb12dd6139bb39d8a8b4a4e";
    window.open(smartAdLink, '_blank');

    nativeAdClicksDone++;

    const badge = document.getElementById('popupStepBadge');
    const title = document.getElementById('popupStepTitle');
    const desc = document.getElementById('popupStepDesc');
    const progressBar = document.getElementById('popupProgressBar');
    const progressPercent = document.getElementById('popupProgressPercent');
    const progressLabel = document.getElementById('popupProgressLabel');

    if (nativeAdClicksDone === 1) {
        // 🚀 ১ম ক্লিক সম্পন্ন: প্রোগ্রেস বার ৫০% পূর্ণ হবে
        if (badge) badge.innerText = "Step 2 of 2: Final Step";
        if (title) title.innerText = "Download Ready • Final Step";
        if (desc) desc.innerText = "Click the final sponsor box below to unlock your verified media file.";
        if (progressBar) progressBar.style.width = "50%";
        if (progressPercent) {
            progressPercent.innerText = "50%";
            progressPercent.className = "text-amber-400 font-black";
        }
        if (progressLabel) progressLabel.innerText = "50% Completed";

        renderNativePopupAdIframe();
    } else if (nativeAdClicksDone >= 2) {
        // 🚀 ২য় ক্লিক সম্পন্ন: সাথে সাথে মডাল বন্ধ হবে এবং মূল বাটনে "DOWNLOAD (FINAL CLICK)" সক্রিয় হবে
        if (progressBar) progressBar.style.width = "100%";
        if (progressPercent) {
            progressPercent.innerText = "100%";
            progressPercent.className = "text-emerald-400 font-black";
        }
        if (progressLabel) progressLabel.innerText = "100% Unlocked";

        closeNativeAdPopup();
        downloadState = 1;
        applyFinalDownloadButtonState();
    }
}

// ==========================================
// 🚀 2-CLICK NATIVE AD POPUP CONTROLLER
// ==========================================
let nativeAdClicksDone = 0;

// 📺 Full-Height Native Ad Renderer (Auto-Expands to Fill Full 300px Box)
function renderNativePopupAdIframe() {
    const container = document.getElementById('nativeAdIframeBox');
    if (!container) return;

    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.style.margin = '0';
    iframe.style.padding = '0';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    container.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <base target="_blank">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: #000000; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                #container-faea46eecf01053afa6ef2518e3c0630 { width: 100% !important; height: 100% !important; display: flex !important; justify-content: center !important; align-items: center !important; margin: 0 !important; padding: 0 !important; }
                #container-faea46eecf01053afa6ef2518e3c0630 * { max-width: 100% !important; max-height: 100% !important; }
                #container-faea46eecf01053afa6ef2518e3c0630 img { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; margin: 0 auto !important; }
                table, tr, td { padding: 0 !important; margin: 0 !important; border: 0 !important; width: 100% !important; height: 100% !important; text-align: center !important; }
            </style>
        </head>
        <body>
            <div id="container-faea46eecf01053afa6ef2518e3c0630"></div>
            <script async="async" data-cfasync="false" src="https://pl30567165.profitableratecpmnetwork.com/faea46eecf01053afa6ef2518e3c0630/invoke.js"><\/script>
        </body>
        </html>
    `);
    doc.close();
}

function showNativeAdPopup() {
    const popup = document.getElementById('nativeAdPopup');
    if (!popup) return;

    nativeAdClicksDone = 0;

    // UI Reset to Step 0
    const badge = document.getElementById('popupStepBadge');
    const title = document.getElementById('popupStepTitle');
    const desc = document.getElementById('popupStepDesc');
    const progressPercent = document.getElementById('popupProgressPercent');
    const progressLabel = document.getElementById('popupProgressLabel');

    const node0 = document.getElementById('stepNode0');
    const node1 = document.getElementById('stepNode1');
    const node2 = document.getElementById('stepNode2');
    const line1 = document.getElementById('stepLine1');
    const line2 = document.getElementById('stepLine2');

    if (badge) badge.innerText = "Step 1 of 2: Verification";
    if (title) title.innerText = "Unlock Download Link";
    if (desc) desc.innerText = "Click the sponsor box below to generate your download link.";
    if (progressPercent) {
        progressPercent.innerText = "Step 0 of 2";
        progressPercent.className = "text-red-400 font-black";
    }
    if (progressLabel) progressLabel.innerText = "Verification Step";

    // Stepper Reset State
    if (node0) node0.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs border-2 border-red-500 bg-red-600 text-white shadow-[0_0_12px_rgba(229,9,20,0.7)] transition-all duration-300 z-10";
    if (node1) node1.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white/20 bg-zinc-900 text-gray-400 transition-all duration-300 z-10";
    if (node2) node2.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white/20 bg-zinc-900 text-gray-400 transition-all duration-300 z-10";
    if (line1) line1.style.width = "0%";
    if (line2) line2.style.width = "0%";

    renderNativePopupAdIframe();
    popup.classList.remove('hidden');
    popup.classList.add('flex');
    void popup.offsetWidth;
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function handleNativePopupAdClick(e) {
    // যদি ক্লোজ বাটনে ক্লিক পড়ে তবে বিজ্ঞাপনের কাউন্ট হবে না
    if (e && e.target && e.target.closest('button')) return;

    const smartAdLink = currentItem?.downloadUrl1 || "https://www.profitableratecpmnetwork.com/rr3q82zj6?key=c81990371bb12dd6139bb39d8a8b4a4e";
    window.open(smartAdLink, '_blank');

    nativeAdClicksDone++;

    const badge = document.getElementById('popupStepBadge');
    const title = document.getElementById('popupStepTitle');
    const desc = document.getElementById('popupStepDesc');
    const progressPercent = document.getElementById('popupProgressPercent');
    const progressLabel = document.getElementById('popupProgressLabel');

    const node1 = document.getElementById('stepNode1');
    const node2 = document.getElementById('stepNode2');
    const line1 = document.getElementById('stepLine1');
    const line2 = document.getElementById('stepLine2');

    if (nativeAdClicksDone === 1) {
        // 🚀 ১ম ক্লিক সম্পন্ন: লাইন ১ সম্পূর্ণ হবে এবং ১ নম্বর নোড অ্যাক্টিভ হবে
        if (badge) badge.innerText = "Step 2 of 2: Final Step";
        if (title) title.innerText = "Download Ready • Final Step";
        if (desc) desc.innerText = "Click the final sponsor box below to unlock your verified media file.";
        if (progressPercent) {
            progressPercent.innerText = "Step 1 of 2";
            progressPercent.className = "text-amber-400 font-black";
        }
        if (progressLabel) progressLabel.innerText = "In Progress";

        if (line1) line1.style.width = "100%";
        if (node1) {
            node1.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs border-2 border-amber-500 bg-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.7)] transition-all duration-300 z-10";
        }

        renderNativePopupAdIframe();
    } else if (nativeAdClicksDone >= 2) {
        // 🚀 ২য় ক্লিক সম্পন্ন: লাইন ২ সম্পূর্ণ হবে, ২ নম্বর নোড সফল হবে এবং মডাল বন্ধ হবে
        if (line2) line2.style.width = "100%";
        if (node2) {
            node2.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs border-2 border-emerald-500 bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-all duration-300 z-10";
        }
        if (progressPercent) {
            progressPercent.innerText = "Step 2 of 2 (Done)";
            progressPercent.className = "text-emerald-400 font-black";
        }
        if (progressLabel) progressLabel.innerText = "Unlocked";

        closeNativeAdPopup();
        downloadState = 1;
        applyFinalDownloadButtonState();
    }
}

// ==========================================
// 🍿 DYNAMIC UP NEXT / RANDOMIZED SUGGESTIONS + MOUSE DRAG
// ==========================================

// 🖥️ ডেস্কটপ ও ল্যাপটপের জন্য অ্যারো বাটন স্ক্রোল ফাংশন
function scrollModalSuggestions(direction) {
    const grid = document.getElementById('modalUpNextGrid');
    if (!grid) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

// 🖱️ অতি-স্মুথ মাউস সোয়াইপ ও ড্র্যাগ ইঞ্জিন (1:1 রিয়েল-টাইম রেসপন্স)
let isSuggestDown = false;
let suggestStartX = 0;
let suggestScrollLeft = 0;
let hasDraggedSuggestions = false;

function initSuggestionMouseDrag() {
    const slider = document.getElementById('modalUpNextGrid');
    if (!slider || slider.dataset.dragInitialized) return;
    slider.dataset.dragInitialized = 'true';

    slider.addEventListener('mousedown', (e) => {
        // শুধুমাত্র মাউসের বাম বাটনে ড্র্যাগ কাজ করবে
        if (e.button !== 0) return;

        isSuggestDown = true;
        hasDraggedSuggestions = false;
        suggestStartX = e.clientX;
        suggestScrollLeft = slider.scrollLeft;

        // ড্র্যাগের সময় স্মুথ বিহেভিয়ার বন্ধ থাকবে যাতে কোনো ল্যাগ না হয়
        slider.style.scrollBehavior = 'auto';
        slider.classList.add('cursor-grabbing');
    });

    window.addEventListener('mouseup', () => {
        if (!isSuggestDown) return;
        isSuggestDown = false;
        if (slider) {
            slider.classList.remove('cursor-grabbing');
            slider.style.scrollBehavior = 'smooth';
        }
        // ক্লিক যাতে অবিলম্বে ট্রিগার না হয় তার জন্য সামান্য বাফার
        setTimeout(() => { hasDraggedSuggestions = false; }, 50);
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isSuggestDown) return;
        e.preventDefault();

        const currentX = e.clientX;
        const walk = currentX - suggestStartX;

        // ৫ পিক্সেল বা তার বেশি সরলে ড্র্যাগ হিসেবে গণ্য হবে
        if (Math.abs(walk) > 5) {
            hasDraggedSuggestions = true;
        }

        // নিখুঁত 1:1 ট্র্যাকিং (ল্যাপটপ ও ডেস্কটপে কোনো ল্যাগ ছাড়া সরবে)
        slider.scrollLeft = suggestScrollLeft - walk;
    });
}

function renderModalSuggestions(currentMovie) {
    const container = document.getElementById('modalUpNextGrid');
    if (!container || !contentData || contentData.length <= 1) return;

    // ১. বর্তমান মুভি বাদ দেওয়া
    let candidates = contentData.filter(m => m.id !== currentMovie.id);

    // ২. একই ক্যাটাগরি বা জেনারের মুভি ফিল্টার করা
    let matchedMovies = candidates.filter(m =>
        (m.category && m.category === currentMovie.category) ||
        (m.genre && currentMovie.genre && m.genre.split(',')[0].trim() === currentMovie.genre.split(',')[0].trim())
    );

    let pool = matchedMovies.length >= 8 ? matchedMovies : candidates;

    // ৩. 🎲 Fisher-Yates Shuffle (ফ্রেশ এবং র‍্যান্ডম সাজেশনের জন্য)
    let shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const finalSelection = shuffled.slice(0, 14);

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    finalSelection.forEach(movie => {
        const card = document.createElement('div');
        // 🎯 মূল মুভি কার্ডের মতো রিলেটিভ ও গ্রুপ ক্লাস
        card.className = 'suggest-card relative flex flex-col group cursor-pointer no-underline shrink-0 select-none';

        // 🏷️ মূল কার্ডের মতো হুবহু একই কোয়ালিটি ও ল্যাঙ্গুয়েজ রেড ব্যাজ
        const qualityBadgeHtml = movie.quality ? `<div class="absolute top-0 left-0 z-20 bg-[#E50914] text-white px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded-br-lg shadow-md">${movie.quality}</div>` : '';
        const languageBadgeHtml = movie.language ? `<div class="absolute top-0 right-0 z-20 bg-[#E50914] text-white px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded-bl-lg shadow-md">${movie.language}</div>` : '';

        // 🎬 মূল কার্ডের হুবহু ইমেজ জুম, ব্যাকড্রপ ব্লার ও হোভার প্লে আইকন
        card.innerHTML = `
            <div class="relative rounded-lg overflow-hidden bg-[#111] shadow-xl aspect-[2/3] ring-1 ring-white/5 transition-all duration-300">
                ${qualityBadgeHtml}
                ${languageBadgeHtml}
                <img src="${getOptimizedImageUrl(movie.posterUrl, 200)}" alt="${movie.title}" class="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110 pointer-events-none block" loading="lazy" decoding="async">
                <div class="play-overlay absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center p-3 transition-opacity duration-500 ease-out pointer-events-none">
                    <div class="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-white flex items-center justify-center bg-black/20 backdrop-blur-[1px] shadow-[0_0_15px_rgba(0,0,0,0.6)] transform scale-90 group-hover:scale-100 transition-all duration-500 ease-out">
                        <i class="fas fa-play text-white text-[10px] sm:text-xs ml-0.5"></i>
                    </div>
                </div>
            </div>
            <div class="mt-2 text-center flex flex-col items-center">
                <h4 class="font-black text-white text-[10px] sm:text-xs uppercase tracking-tight line-clamp-1 group-hover:text-red-500 transition-colors">${movie.title}</h4>
            </div>
        `;

        // 🖱️ ড্র্যাগ প্রোটেকশনসহ কার্ড ক্লিক ইভেন্ট
        card.onclick = (e) => {
            e.stopPropagation();
            if (hasDraggedSuggestions) return;

            openModal(movie.id);
            const modal = document.getElementById('movieModal');
            if (modal) modal.scrollTo({ top: 0, behavior: 'smooth' });
        };

        fragment.appendChild(card);
    });

    container.appendChild(fragment);

    // মাউস ড্র্যাগ ফিচার চালু করা
    initSuggestionMouseDrag();
    container.scrollLeft = 0;
}