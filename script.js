/**
 * Özge Törer Fan Photo Album & Portfolio
 * Interactivity & Logic Script
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 1. Data Store: Curated Gallery Images
    // ==========================================================================
    const GALLERY_DATA = window.GALLERY_DATA || [];

    // ==========================================================================
    // 2. State Variables
    // ==========================================================================
    let favorites = JSON.parse(localStorage.getItem('ozge_favorites')) || [];
    let currentFilter = 'all';
    let searchQuery = '';
    let filteredImages = [...GALLERY_DATA];
    
    // Lightbox & Slideshow State
    let currentImageIndex = 0;
    let slideshowInterval = null;
    let slideshowProgressInterval = null;
    let isSlideshowPlaying = false;
    const SLIDESHOW_DURATION = 4000; // 4 seconds per slide

    // DOM Elements
    const loaderWrapper = document.getElementById('loader-wrapper');
    const loaderProgress = document.querySelector('.loader-progress');
    const header = document.querySelector('.main-header');
    const navMenu = document.getElementById('nav-menu');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const searchInput = document.getElementById('search-input');
    const favCountBadge = document.getElementById('fav-count');
    const galleryGrid = document.getElementById('gallery-grid');
    const emptyState = document.getElementById('gallery-empty-state');
    const filterButtons = document.querySelectorAll('.filter-bar .filter-btn');
    const favToggleBtn = document.getElementById('fav-toggle-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const pdfDownloadBtn = document.getElementById('pdf-download-btn');
    
    // Lightbox DOM Elements
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-image');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxCategory = document.getElementById('lightbox-category');
    const lightboxDesc = document.getElementById('lightbox-desc');
    const lightboxCloseBtn = document.getElementById('lightbox-close');
    const lightboxPrevBtn = document.getElementById('lightbox-prev');
    const lightboxNextBtn = document.getElementById('lightbox-next');
    
    const lightboxFavBtn = document.getElementById('lightbox-fav-btn');
    const lightboxPlayBtn = document.getElementById('lightbox-play-btn');
    const lightboxFsBtn = document.getElementById('lightbox-fs-btn');
    const lightboxDownloadBtn = document.getElementById('lightbox-download-btn');
    const slideshowProgressBar = document.getElementById('slideshow-progress');

    // ==========================================================================
    // 3. Loader & Splash Screen Progress Simulation
    // ==========================================================================
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                loaderWrapper.classList.add('fade-out');
                animateCounters();
            }, 300);
        }
        loaderProgress.style.width = `${progress}%`;
    }, 80);

    // ==========================================================================
    // 4. Initialization & Render Gallery
    // ==========================================================================
    updateFavoritesBadge();
    renderGallery();

    function renderGallery() {
        // Filter by Category
        if (currentFilter === 'all') {
            filteredImages = GALLERY_DATA;
        } else if (currentFilter === 'favorites') {
            filteredImages = GALLERY_DATA.filter(img => favorites.includes(img.id));
        } else {
            filteredImages = GALLERY_DATA.filter(img => img.category === currentFilter);
        }

        // Filter by Search query
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            filteredImages = filteredImages.filter(img => 
                img.title.toLowerCase().includes(query) || 
                img.desc.toLowerCase().includes(query)
            );
        }

        // Empty state check
        if (filteredImages.length === 0) {
            galleryGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            galleryGrid.classList.remove('hidden');
            
            // Build grid HTML
            galleryGrid.innerHTML = '';
            filteredImages.forEach((img, idx) => {
                const isFav = favorites.includes(img.id);
                const card = document.createElement('div');
                card.className = 'gallery-card loading';
                card.setAttribute('data-id', img.id);
                card.setAttribute('data-index', idx);
                
                card.innerHTML = `
                    <img src="${img.src}" alt="${img.title}" loading="lazy" class="lazy-load">
                    <div class="card-overlay">
                        <h3 class="card-title">${img.title}</h3>
                        <div class="card-bottom">
                            <span class="card-category">${img.category.replace('-', ' ')}</span>
                            <div class="card-actions">
                                <button class="card-action-btn zoom-btn" title="Zoom View">
                                    <i class="fa-solid fa-expand"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                // Remove loading animation once image loads
                const imageEl = card.querySelector('img');
                if (imageEl.complete) {
                    card.classList.remove('loading');
                } else {
                    imageEl.addEventListener('load', () => card.classList.remove('loading'));
                }

                // Click Card (open lightbox)
                card.addEventListener('click', () => {
                    openLightbox(idx);
                });

                galleryGrid.appendChild(card);
            });
        }
    }

    // ==========================================================================
    // 5. Filter & Search Logic
    // ==========================================================================
    
    // Category click
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderGallery();
        });
    });

    // Special Header Favorites button filter trigger
    if (favToggleBtn) {
        favToggleBtn.addEventListener('click', () => {
            const favFilterBtn = document.querySelector('.filter-bar [data-filter="favorites"]');
            if (favFilterBtn) {
                favFilterBtn.click();
                // Scroll to gallery
                document.getElementById('gallery-section').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Real-time Search input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderGallery();
        });
    }

    // ==========================================================================
    // 6. Favorites System (localStorage)
    // ==========================================================================
    function toggleFavorite(id, btnElement = null) {
        const index = favorites.indexOf(id);
        if (index > -1) {
            // Remove from favorites
            favorites.splice(index, 1);
        } else {
            // Add to favorites
            favorites.push(id);
        }
        
        localStorage.setItem('ozge_favorites', JSON.stringify(favorites));
        updateFavoritesBadge();
        
        // If we are currently in favorites category, re-render gallery completely
        if (currentFilter === 'favorites') {
            renderGallery();
        } else {
            // Otherwise just update the button icon/class in real-time
            if (btnElement) {
                const icon = btnElement.querySelector('i');
                if (favorites.includes(id)) {
                    btnElement.classList.add('active');
                    icon.className = 'fa-solid fa-heart';
                } else {
                    btnElement.classList.remove('active');
                    icon.className = 'fa-regular fa-heart';
                }
            }
        }

        // Sync Lightbox Fav Button state if open
        if (lightbox.classList.contains('active') && filteredImages[currentImageIndex]?.id === id) {
            updateLightboxFavBtn();
        }
    }

    function updateFavoritesBadge() {
        if (!favCountBadge) return;
        const count = favorites.length;
        favCountBadge.textContent = count;
        
        // Add subtle animation when count changes
        favCountBadge.classList.add('pop');
        setTimeout(() => favCountBadge.classList.remove('pop'), 300);
    }

    // ==========================================================================
    // 7. Lightbox, Slider & Slideshow Logic
    // ==========================================================================
    function openLightbox(index) {
        currentImageIndex = index;
        const currentImgData = filteredImages[currentImageIndex];
        if (!currentImgData) return;

        // Reset slideshow and fullscreen states on opening new
        stopSlideshow();
        lightbox.classList.remove('fullscreen');

        // Populate Content
        updateLightboxContent();

        // Display Modal
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Stop background scrolling
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.classList.remove('fullscreen');
        document.body.style.overflow = ''; // Resume background scrolling
        stopSlideshow();
    }

    function updateLightboxContent() {
        const data = filteredImages[currentImageIndex];
        if (!data) return;

        // Fade effect during transitions
        lightboxImg.style.opacity = '0';
        lightboxImg.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            lightboxImg.src = data.src;
            lightboxImg.alt = data.title;
            if (lightboxTitle) lightboxTitle.textContent = data.title;
            if (lightboxCategory) lightboxCategory.textContent = data.category.replace('-', ' ');
            if (lightboxDesc) lightboxDesc.textContent = data.desc;
            
            updateLightboxFavBtn();
            
            lightboxImg.style.opacity = '1';
            lightboxImg.style.transform = 'scale(1)';
        }, 150);
    }

    function updateLightboxFavBtn() {
        if (!lightboxFavBtn) return;
        const currentData = filteredImages[currentImageIndex];
        if (!currentData) return;

        const isFav = favorites.includes(currentData.id);
        const icon = lightboxFavBtn.querySelector('i');
        
        if (isFav) {
            lightboxFavBtn.classList.add('active');
            icon.className = 'fa-solid fa-heart';
        } else {
            lightboxFavBtn.classList.remove('active');
            icon.className = 'fa-regular fa-heart';
        }
    }

    // Slide navigation
    function navigateSlide(direction) {
        if (direction === 'next') {
            currentImageIndex = (currentImageIndex + 1) % filteredImages.length;
        } else if (direction === 'prev') {
            currentImageIndex = (currentImageIndex - 1 + filteredImages.length) % filteredImages.length;
        }
        updateLightboxContent();
        
        // Reset slideshow progress if playing
        if (isSlideshowPlaying) {
            resetSlideshowTimer();
        }
    }

    // Slideshow controls
    function toggleSlideshow() {
        if (isSlideshowPlaying) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    }

    function startSlideshow() {
        isSlideshowPlaying = true;
        lightboxPlayBtn.classList.add('active');
        lightboxPlayBtn.querySelector('i').className = 'fa-solid fa-pause';
        
        resetSlideshowTimer();
    }

    function stopSlideshow() {
        isSlideshowPlaying = false;
        lightboxPlayBtn.classList.remove('active');
        lightboxPlayBtn.querySelector('i').className = 'fa-solid fa-play';
        
        clearInterval(slideshowInterval);
        clearInterval(slideshowProgressInterval);
        slideshowProgressBar.style.width = '0%';
    }

    function resetSlideshowTimer() {
        clearInterval(slideshowInterval);
        clearInterval(slideshowProgressInterval);
        
        let timeLeft = SLIDESHOW_DURATION;
        const intervalStep = 50; // update progress every 50ms
        
        slideshowProgressBar.style.width = '0%';
        
        slideshowProgressInterval = setInterval(() => {
            timeLeft -= intervalStep;
            const progressPercent = ((SLIDESHOW_DURATION - timeLeft) / SLIDESHOW_DURATION) * 100;
            slideshowProgressBar.style.width = `${progressPercent}%`;
            
            if (timeLeft <= 0) {
                clearInterval(slideshowProgressInterval);
            }
        }, intervalStep);

        slideshowInterval = setInterval(() => {
            navigateSlide('next');
        }, SLIDESHOW_DURATION);
    }

    // Event Listeners for Lightbox
    lightboxCloseBtn.addEventListener('click', closeLightbox);
    lightboxPrevBtn.addEventListener('click', () => navigateSlide('prev'));
    lightboxNextBtn.addEventListener('click', () => navigateSlide('next'));
    
    // Close lightbox on click outside the image frame
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Lightbox Feature Actions
    if (lightboxFavBtn) {
        lightboxFavBtn.addEventListener('click', () => {
            const currentData = filteredImages[currentImageIndex];
            if (currentData) {
                toggleFavorite(currentData.id);
            }
        });
    }
    
    lightboxPlayBtn.addEventListener('click', toggleSlideshow);
    
    lightboxFsBtn.addEventListener('click', () => {
        lightbox.classList.toggle('fullscreen');
        const icon = lightboxFsBtn.querySelector('i');
        if (lightbox.classList.contains('fullscreen')) {
            icon.className = 'fa-solid fa-compress';
        } else {
            icon.className = 'fa-solid fa-expand';
        }
    });

    lightboxDownloadBtn.addEventListener('click', () => {
        const currentData = filteredImages[currentImageIndex];
        if (!currentData) return;
        
        // Mock download via link element
        const a = document.createElement('a');
        a.href = currentData.src;
        a.download = `${currentData.title.toLowerCase().replace(/\s+/g, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowRight') {
            navigateSlide('next');
        } else if (e.key === 'ArrowLeft') {
            navigateSlide('prev');
        }
    });

    // Swipe Support for Lightbox (Touch devices)
    let touchStartX = 0;
    let touchEndX = 0;
    
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    
    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    }, {passive: true});

    function handleSwipeGesture() {
        const swipeDistance = 50; // Minimum threshold
        if (touchEndX < touchStartX - swipeDistance) {
            navigateSlide('next'); // Swipe Left
        }
        if (touchEndX > touchStartX + swipeDistance) {
            navigateSlide('prev'); // Swipe Right
        }
    }

    // ==========================================================================
    // 8. Sticky Navigation & Scroll Event
    // ==========================================================================
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        // Sticky Header Check
        if (window.scrollY > 50) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }

        // Active Section Navigation Sync
        let currentSectionId = '';
        sections.forEach(sec => {
            const sectionTop = sec.offsetTop - 120;
            const sectionHeight = sec.clientHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = sec.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // Mobile Navigation Drawer Toggle
    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close Menu drawer when clicking a navigation link
    if (navLinks && hamburgerBtn && navMenu) {
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // ==========================================================================
    // 9. Statistics Counters Animation
    // ==========================================================================
    const statCounters = document.querySelectorAll('.stat-number');

    function animateCounters() {
        statCounters.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-target'));
            const suffix = counter.getAttribute('data-suffix') || '';
            const prefix = counter.getAttribute('data-prefix') || '';
            
            let current = 0;
            const duration = 1500; // 1.5 seconds animation duration
            const frameTime = 1000 / 60; // 60 FPS
            const totalFrames = duration / frameTime;
            const increment = target / totalFrames;
            
            const counterInterval = setInterval(() => {
                current += increment;
                
                if (current >= target) {
                    current = target;
                    clearInterval(counterInterval);
                }

                // Float numbers check (like 5.5)
                if (Number.isInteger(target)) {
                    counter.textContent = `${prefix}${Math.floor(current)}${suffix}`;
                } else {
                    counter.textContent = `${prefix}${current.toFixed(1)}${suffix}`;
                }
            }, frameTime);
        });
    }

    // ==========================================================================
    // 10. Dark / Light Mode Toggle
    // ==========================================================================
    const savedTheme = localStorage.getItem('ozge_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('ozge_theme', newTheme);
        });
    }

    // ==========================================================================
    // 11. PDF Export / Print Document
    // ==========================================================================
    if (pdfDownloadBtn) {
        pdfDownloadBtn.addEventListener('click', () => {
            // Highlight printing action
            const printConfirm = confirm("Prepare printable Luxury Album Portfolio? You can save as PDF using your browser's Print Destination.");
            if (printConfirm) {
                window.print();
            }
        });
    }
});
