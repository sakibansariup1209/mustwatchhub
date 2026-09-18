
document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Logic ---
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');

    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });

    // --- Desktop Navbar Horizontal Scroll Logic ---
    const categoryNav = document.getElementById('category-nav');
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRightBtn = document.getElementById('scroll-right');
    const scrollLeftContainer = document.getElementById('scroll-left-container');
    const scrollRightContainer = document.getElementById('scroll-right-container');

    if (categoryNav && scrollLeftBtn && scrollRightBtn) {
        const scrollAmount = 300;

        scrollLeftBtn.addEventListener('click', () => {
            categoryNav.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        scrollRightBtn.addEventListener('click', () => {
            categoryNav.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        let isDown = false;
        let startX;
        let scrollLeft;
        let isDragging = false;

        categoryNav.addEventListener('mousedown', (e) => {
            isDown = true;
            isDragging = false;
            categoryNav.classList.add('cursor-grabbing');
            categoryNav.classList.remove('cursor-grab', 'scroll-smooth');
            startX = e.pageX - categoryNav.offsetLeft;
            scrollLeft = categoryNav.scrollLeft;
        });

        categoryNav.addEventListener('mouseleave', () => {
            isDown = false;
            categoryNav.classList.remove('cursor-grabbing');
            categoryNav.classList.add('cursor-grab', 'scroll-smooth');
        });

        categoryNav.addEventListener('mouseup', () => {
            isDown = false;
            categoryNav.classList.remove('cursor-grabbing');
            categoryNav.classList.add('cursor-grab', 'scroll-smooth');
        });

        categoryNav.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - categoryNav.offsetLeft;
            const walk = (x - startX) * 2;

            if (Math.abs(walk) > 5) {
                isDragging = true;
            }

            categoryNav.scrollLeft = scrollLeft - walk;
        });

        categoryNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('dragstart', (e) => e.preventDefault());
            link.addEventListener('click', (e) => {
                if (isDragging) e.preventDefault();
            });
        });

        const updateScrollButtons = () => {
            if (!scrollLeftContainer || !scrollRightContainer) return;
            if (Math.ceil(categoryNav.scrollLeft) <= 1) {
                scrollLeftContainer.classList.replace('flex', 'hidden');
            } else {
                scrollLeftContainer.classList.replace('hidden', 'flex');
            }

            if (Math.ceil(categoryNav.scrollLeft) + categoryNav.clientWidth >= categoryNav.scrollWidth - 2) {
                scrollRightContainer.classList.replace('flex', 'hidden');
            } else {
                scrollRightContainer.classList.replace('hidden', 'flex');
            }
        };

        categoryNav.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', updateScrollButtons);
        setTimeout(updateScrollButtons, 150);
    }

    // --- Remove 'min read' Logic ---
    const removeMinRead = () => {
        document.querySelectorAll('article').forEach(article => {
            const containers = article.querySelectorAll('.text-slate-500.flex.items-center, .text-slate-300.flex.items-center');
            containers.forEach(container => {
                const spans = container.querySelectorAll('span');
                if (spans.length === 4) {
                    spans[2].remove();
                    spans[3].remove();
                } else if (spans.length === 3) {
                    spans[1].remove();
                    spans[2].remove();
                }
            });
        });
    };
    removeMinRead();

    // --- Nav Link Active State Toggle ---
    const desktopNavLinks = document.querySelectorAll('#category-nav a');
    const mobileNavLinks = document.querySelectorAll('#mobile-menu .space-y-1 a');

    const desktopActive = ['font-semibold', 'text-brand-600', 'bg-brand-50'];
    const desktopInactive = ['font-medium', 'text-slate-600', 'hover:text-brand-600', 'hover:bg-slate-50'];
    const mobileActive = ['bg-brand-50', 'text-brand-600', 'font-semibold'];
    const mobileInactive = ['text-slate-600', 'font-medium', 'hover:bg-slate-50'];

    const setActiveLink = (clickedLink, isMobile = false) => {
        const links = isMobile ? mobileNavLinks : desktopNavLinks;
        const active = isMobile ? mobileActive : desktopActive;
        const inactive = isMobile ? mobileInactive : desktopInactive;

        links.forEach(link => {
            link.classList.remove(...active);
            link.classList.add(...inactive);
        });
        clickedLink.classList.remove(...inactive);
        clickedLink.classList.add(...active);
    };

    desktopNavLinks.forEach(link => {
        link.addEventListener('click', function () { setActiveLink(this, false); });
    });

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function () {
            setActiveLink(this, true);
            menu.classList.add('hidden');
        });
    });

    // --- Load More / Show More Logic ---
    const initLoadMoreLogic = () => {
        const categorySections = document.querySelectorAll('.category-section');

        categorySections.forEach(section => {
            const posts = section.querySelectorAll('.post-item');
            const loadMoreBtn = section.querySelector('.load-more-btn');

            if (!loadMoreBtn) return;

            const INITIAL_POSTS_TO_SHOW = 4;
            const isExpanded = loadMoreBtn.getAttribute('data-expanded') === 'true';

            if (!isExpanded) {
                posts.forEach((post, index) => {
                    if (index >= INITIAL_POSTS_TO_SHOW) {
                        post.style.display = 'none';
                    } else {
                        post.style.display = '';
                    }
                });

                if (posts.length <= INITIAL_POSTS_TO_SHOW) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'inline-flex';
                }
            } else {
                posts.forEach(post => post.style.display = '');
                loadMoreBtn.style.display = 'none';
            }

            const newBtn = loadMoreBtn.cloneNode(true);
            loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);

            newBtn.addEventListener('click', function (e) {
                e.preventDefault();
                this.setAttribute('data-expanded', 'true');

                posts.forEach((post, index) => {
                    if (index >= INITIAL_POSTS_TO_SHOW) {
                        post.style.display = '';
                        post.style.opacity = '0';
                        setTimeout(() => {
                            post.style.transition = 'opacity 0.5s ease';
                            post.style.opacity = '1';
                        }, 50);
                    }
                });
                this.style.display = 'none';
            });
        });
    };

    initLoadMoreLogic();

    // --- Search Bar Functionality ---
    const searchIconBtn = document.getElementById('search-icon-btn');
    const searchInput = document.getElementById('search-input');
    const searchWrapper = document.getElementById('search-wrapper');
    const desktopSearchClearBtn = document.getElementById('desktop-search-clear');

    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobileSearchClearBtn = document.getElementById('mobile-search-clear');
    const heroSection = document.getElementById('hero-section');
    const searchResultsHeader = document.getElementById('search-results-header');
    const searchQueryDisplay = document.getElementById('search-query-display');
    const mainTopAd = document.getElementById('main-top-ad');
    const mainBottomAd = document.getElementById('main-bottom-ad');

    const railAds = document.querySelectorAll('.rail-ad-left, .rail-ad-right');

    const allArticles = document.querySelectorAll('article');
    allArticles.forEach(article => {
        const titleEl = article.querySelector('h2 a, h4 a, h3 a') || article.querySelector('h2, h4, h3');
        if (titleEl) {
            article.dataset.originalTitle = titleEl.textContent;
        }
    });

    const highlightText = (text, query) => {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, `<mark class="bg-brand-100 dark:bg-brand-900 dark:text-brand-100 text-brand-900 rounded px-0.5">$1</mark>`);
    };

    if (searchIconBtn && searchInput && searchWrapper) {
        searchIconBtn.addEventListener('click', (e) => {
            e.preventDefault();
            searchWrapper.classList.remove('w-8');
            searchWrapper.classList.add('w-64', 'md:w-80');
            searchInput.classList.remove('opacity-0', 'pointer-events-none', 'cursor-pointer');
            searchInput.classList.add('opacity-100', 'cursor-text');
            searchInput.focus();
        });

        searchInput.addEventListener('blur', () => {
            if (searchInput.value.trim() === '') {
                searchWrapper.classList.remove('w-64', 'md:w-80');
                searchWrapper.classList.add('w-8');
                searchInput.classList.remove('opacity-100', 'cursor-text');
                searchInput.classList.add('opacity-0', 'pointer-events-none', 'cursor-pointer');
                if (desktopSearchClearBtn) desktopSearchClearBtn.classList.add('hidden');
            }
        });
    }

    const performSearch = (query) => {
        const rawQuery = query;
        query = query.toLowerCase().trim();
        const sections = document.querySelectorAll('.category-section');
        const loadMoreBtns = document.querySelectorAll('.load-more-btn');
        const mobileCategoryLinks = document.querySelector('#mobile-menu .space-y-1');
        const mainAds = document.querySelectorAll('main .category-section .ad-space, main > .bg-white.p-6');

        if (query === '') {
            if (heroSection) heroSection.style.display = '';
            if (mainTopAd) mainTopAd.style.display = '';
            if (mainBottomAd) mainBottomAd.style.display = '';
            if (searchResultsHeader) searchResultsHeader.classList.add('hidden');
            railAds.forEach(ad => ad.style.opacity = '1');

            sections.forEach(sec => {
                sec.style.display = '';
                const header = sec.querySelector('.flex.items-end.justify-between');
                if (header) header.style.display = '';
            });
            if (mobileCategoryLinks) mobileCategoryLinks.style.display = '';
            mainAds.forEach(ad => ad.style.display = '');

            allArticles.forEach(article => {
                const titleEl = article.querySelector('h2 a, h4 a, h3 a') || article.querySelector('h2, h4, h3');
                if (titleEl && article.dataset.originalTitle) {
                    titleEl.textContent = article.dataset.originalTitle;
                }
                article.style.display = '';
                article.style.opacity = '1';
            });

            initLoadMoreLogic();
        } else {
            if (heroSection) heroSection.style.display = 'none';
            if (mainTopAd) mainTopAd.style.display = 'none';
            if (mainBottomAd) mainBottomAd.style.display = 'none';
            if (searchResultsHeader) {
                searchResultsHeader.classList.remove('hidden');
                searchQueryDisplay.textContent = `"${rawQuery}"`;
            }
            loadMoreBtns.forEach(btn => btn.style.display = 'none');
            if (mobileCategoryLinks) mobileCategoryLinks.style.display = 'none';
            mainAds.forEach(ad => ad.style.display = 'none');
            railAds.forEach(ad => ad.style.opacity = '0');

            allArticles.forEach(article => {
                const originalTitle = article.dataset.originalTitle || '';
                const titleLower = originalTitle.toLowerCase();
                const desc = article.querySelector('p')?.textContent.toLowerCase() || '';

                if (titleLower.includes(query) || desc.includes(query)) {
                    article.style.display = '';
                    article.style.opacity = '1';

                    const titleEl = article.querySelector('h2 a, h4 a, h3 a') || article.querySelector('h2, h4, h3');
                    if (titleEl) {
                        titleEl.innerHTML = highlightText(originalTitle, query);
                    }

                    if (heroSection && heroSection.contains(article)) {
                        heroSection.style.display = '';
                    }
                } else {
                    article.style.display = 'none';
                }
            });

            sections.forEach(sec => {
                const visiblePosts = Array.from(sec.querySelectorAll('.post-item')).filter(p => p.style.display !== 'none');
                const header = sec.querySelector('.flex.items-end.justify-between');

                if (visiblePosts.length === 0) {
                    sec.style.display = 'none';
                } else {
                    sec.style.display = '';
                    if (header) header.style.display = 'none';
                }
            });
        }
    };

    const scrollToTopIfNeeded = () => {
        if (window.scrollY > 100) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (e.target.value.trim().length > 0) scrollToTopIfNeeded();
            performSearch(e.target.value);
            if (desktopSearchClearBtn) {
                if (e.target.value.length > 0) desktopSearchClearBtn.classList.remove('hidden');
                else desktopSearchClearBtn.classList.add('hidden');
            }
        });

        if (desktopSearchClearBtn) {
            desktopSearchClearBtn.addEventListener('mousedown', (e) => e.preventDefault());
            desktopSearchClearBtn.addEventListener('click', () => {
                searchInput.value = '';
                performSearch('');
                desktopSearchClearBtn.classList.add('hidden');
                searchInput.focus();
            });
        }
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', (e) => {
            if (e.target.value.trim().length > 0) scrollToTopIfNeeded();
            performSearch(e.target.value);
            if (mobileSearchClearBtn) {
                if (e.target.value.length > 0) mobileSearchClearBtn.classList.remove('hidden');
                else mobileSearchClearBtn.classList.add('hidden');
            }
        });

        if (mobileSearchClearBtn) {
            mobileSearchClearBtn.addEventListener('mousedown', (e) => e.preventDefault());
            mobileSearchClearBtn.addEventListener('click', () => {
                mobileSearchInput.value = '';
                performSearch('');
                mobileSearchClearBtn.classList.add('hidden');
                mobileSearchInput.focus();
            });
        }
    }

    // --- Real-Time Live US Date Logic ---
    const updateUSDateTime = () => {
        const now = new Date();
        const usDateTimeString = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(now);

        allArticles.forEach((article) => {
            const titleElement = article.querySelector('h2 a, h4 a, h3 a') || article.querySelector('h2, h4, h3');
            if (!titleElement) return;

            const postTitle = titleElement.textContent.trim();
            const storageKey = 'tech_nova_date_' + encodeURIComponent(postTitle);

            let storedDate = localStorage.getItem(storageKey);

            if (!storedDate) {
                storedDate = usDateTimeString;
                localStorage.setItem(storageKey, storedDate);
            }

            const normalPostDateContainer = article.querySelector('.text-slate-500.flex.items-center');
            const heroPostDateContainer = article.querySelector('.text-slate-300.flex.items-center');

            if (normalPostDateContainer) {
                const spans = normalPostDateContainer.querySelectorAll('span');
                if (spans.length >= 2) spans[1].textContent = storedDate;
            } else if (heroPostDateContainer) {
                const spans = heroPostDateContainer.querySelectorAll('span');
                if (spans.length >= 1) spans[0].textContent = storedDate;
            }
        });
    };

    updateUSDateTime();

    // --- Logo Reset to Home Logic ---
    const headerLogo = document.getElementById('header-logo');
    if (headerLogo) {
        headerLogo.addEventListener('click', (e) => {
            e.preventDefault();
            if (searchInput) searchInput.value = '';
            if (mobileSearchInput) mobileSearchInput.value = '';
            if (desktopSearchClearBtn) desktopSearchClearBtn.classList.add('hidden');
            if (mobileSearchClearBtn) mobileSearchClearBtn.classList.add('hidden');

            if (searchWrapper && searchInput) {
                searchWrapper.classList.remove('w-64', 'md:w-80');
                searchWrapper.classList.add('w-8');
                searchInput.classList.remove('opacity-100', 'cursor-text');
                searchInput.classList.add('opacity-0', 'pointer-events-none', 'cursor-pointer');
            }

            performSearch('');
            if (desktopNavLinks.length > 0) setActiveLink(desktopNavLinks[0], false);
            if (mobileNavLinks.length > 0) setActiveLink(mobileNavLinks[0], true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Full Box Clickable Links ---
    document.querySelectorAll('article').forEach(article => {
        const titleLink = article.querySelector('h2 a, h4 a, h3 a');
        if (titleLink) {
            const fullLink = document.createElement('a');
            fullLink.href = titleLink.href || '#';
            fullLink.className = 'absolute inset-0 z-[40] rounded-2xl';
            fullLink.setAttribute('aria-label', titleLink.textContent);
            article.appendChild(fullLink);

            const titleEl = titleLink.parentElement;
            titleEl.innerHTML = titleLink.innerHTML;
            article.classList.add('cursor-pointer');

            const tags = article.querySelectorAll('.bg-brand-50, .bg-purple-600, .bg-emerald-600, .bg-amber-600, .text-brand-600');
            tags.forEach(tag => {
                if (!tag.closest('.absolute.inset-0')) tag.classList.add('relative', 'z-[50]');
            });
        }
    });

    // --- Dark Mode Toggle Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const mobileThemeToggleBtn = document.getElementById('mobile-theme-toggle');

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
    };

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleDarkMode);
    if (mobileThemeToggleBtn) mobileThemeToggleBtn.addEventListener('click', toggleDarkMode);

    // --- Dynamic SEO & Schema Generator ---
    const initDynamicSEO = () => {
        const schemaData = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": []
        };

        document.querySelectorAll('.category-section').forEach((section) => {
            const categoryTitleEl = section.querySelector('h2');
            if (categoryTitleEl) {
                categoryTitleEl.setAttribute('aria-label', `Category: ${categoryTitleEl.textContent}`);
            }
        });

        document.querySelectorAll('article').forEach((article, index) => {
            const titleEl = article.querySelector('h3, h2, h4');
            if (titleEl && !article.classList.contains('group-hover')) {
                const link = article.querySelector('.absolute.inset-0') || article.querySelector('a');
                const url = link ? link.href : "https://mustwatchhub.com/article-" + index;

                titleEl.setAttribute('title', titleEl.textContent.trim());

                schemaData.itemListElement.push({
                    "@type": "ListItem",
                    "position": index + 1,
                    "url": url,
                    "name": titleEl.textContent.trim()
                });
            }
        });

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schemaData);
        document.head.appendChild(script);
    };

    initDynamicSEO();

    // --- Prevent Fixed Ads Overlapping Footer Logic ---
    const preventAdOverlap = () => {
        const footer = document.querySelector('footer');
        const leftAd = document.querySelector('.rail-ad-left');
        const rightAd = document.querySelector('.rail-ad-right');

        if (!footer || (!leftAd && !rightAd)) return;

        const checkOverlap = () => {
            if (window.innerWidth < 1920) {
                if (leftAd) { leftAd.style.position = ''; leftAd.style.bottom = ''; leftAd.style.top = ''; }
                if (rightAd) { rightAd.style.position = ''; rightAd.style.bottom = ''; rightAd.style.top = ''; }
                return;
            }

            const footerRect = footer.getBoundingClientRect();
            const footerTop = footerRect.top;

            // Exactly 88px to mathematically align with the bottom of the grid and sticky ad
            const adGap = 88;

            // Fixed top position as defined in CSS top-[120px]
            const fixedTop = 120;

            [leftAd, rightAd].forEach(ad => {
                if (!ad) return;

                const adHeight = ad.offsetHeight;
                const adBottomPosition = fixedTop + adHeight;

                if (footerTop <= adBottomPosition + adGap) {
                    ad.style.position = 'absolute';
                    const absoluteTop = (window.scrollY + footerTop) - adHeight - adGap;
                    ad.style.top = `${absoluteTop}px`;
                    ad.style.bottom = 'auto';
                } else {
                    ad.style.position = 'fixed';
                    ad.style.top = `${fixedTop}px`;
                    ad.style.bottom = 'auto';
                }
            });
        };

        window.addEventListener('scroll', checkOverlap);
        window.addEventListener('resize', checkOverlap);

        checkOverlap();
    };

    preventAdOverlap();

});
