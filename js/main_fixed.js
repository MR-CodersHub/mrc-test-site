/**
 * MR CODERS HUB — Shared Navigation & Auth JavaScript
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Inject Tailwind Configuration if not present
    if (typeof tailwind !== 'undefined') {
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'brand-blue': '#1E3A8A',
                        'brand-purple': '#7C3AED',
                        'brand-orange': '#F59E0B',
                    }
                }
            }
        }
    }

    // Initial UI Injection
    injectGlobalUI();
    
    // Ensure Lucide is initialized
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        // Dynamic load if script tag was missing
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/lucide@latest';
            script.onload = () => {
                if (typeof lucide !== 'undefined') lucide.createIcons();
                resolve();
            };
            document.head.appendChild(script);
        });
    }
    
    initNavbar();
    handleActiveLinks();
    initScrollReveal();
    // Initialize sliders after a short delay to ensure DOM is ready
    setTimeout(() => {
        initMobileSliders();
    }, 150);
});

// Failsafe for icons
window.addEventListener('load', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                // Optional: stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
}

function handleActiveLinks() {
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop() || 'index.html';

    const navLinks = document.querySelectorAll('nav a, #global-mobile-menu a');
    
    // Reset dropdown triggers
    document.querySelectorAll('.dropdown-trigger').forEach(trigger => {
        trigger.classList.remove('nav-link-active');
    });

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || link.querySelector('img')) return;

        // Skip CTA buttons (detected by gradient or rounded-full classes)
        if (link.classList.contains('rounded-full') || link.classList.contains('from-brand-blue')) return;

        const normalizedHref = href.split('/').pop().split('?')[0].split('#')[0];

        const isMatch = (normalizedHref === pageName) ||
            (pageName === 'index.html' && (normalizedHref === '' || normalizedHref === './' || normalizedHref === 'index.html')) ||
            ((pageName === '' || pageName === '/') && normalizedHref === 'index.html');

        if (isMatch) {
            link.setAttribute('aria-current', 'page');
            link.classList.add('nav-link-active');

            // Highlight parent dropdown if exists
            const parentDropdown = link.closest('.group');
            if (parentDropdown) {
                const trigger = parentDropdown.querySelector('.dropdown-trigger');
                if (trigger) {
                    trigger.classList.add('nav-link-active');
                }
            }
        } else {
            link.removeAttribute('aria-current');
            link.classList.remove('nav-link-active');
        }
    });
}

function initNavbar() {
    // 1. Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('global-mobile-menu-btn');
    const mobileMenuClose = document.getElementById('global-mobile-menu-close');
    const mobileMenuOverlay = document.getElementById('global-mobile-menu-overlay');
    const mobileMenu = document.getElementById('global-mobile-menu');
    const mobileMenuContainer = document.getElementById('global-mobile-menu-container');

    if (mobileMenuBtn && mobileMenu && mobileMenuContainer) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            mobileMenu.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                mobileMenuContainer.classList.remove('translate-x-full');
            }, 10);
        });
    }

    const closeMenu = (e) => {
        // Only prevent default if it's NOT a link (to allow navigation)
        if (e && e.currentTarget && e.currentTarget.tagName !== 'A') {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (mobileMenu && mobileMenuContainer) {
            mobileMenuContainer.classList.add('translate-x-full');
            setTimeout(() => {
                mobileMenu.classList.add('hidden');
                document.body.style.overflow = '';
            }, 300);
        }
    };

    mobileMenuClose?.addEventListener('click', closeMenu);
    mobileMenuOverlay?.addEventListener('click', closeMenu);

    // Close menu when clicking links
    const mobileLinks = mobileMenu?.querySelectorAll('a');
    mobileLinks?.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // 2. Auth state logic removed by user manually from UI
    // Leaving variables for future use if needed, but removing broken function calls
    // const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    // const desktopAuthEl = document.getElementById('auth-dropdown-desktop') || document.getElementById('auth-dropdown');
    // const mobileAuthEl = document.getElementById('auth-mobile');

    // if (desktopAuthEl) renderAuth(desktopAuthEl, isLoggedIn, false);
    // if (mobileAuthEl) renderAuth(mobileAuthEl, isLoggedIn, true);

    // 3. Click-based Desktop Auth Dropdown
    const desktopAuthEl = document.getElementById('auth-dropdown-desktop') || document.getElementById('auth-dropdown');
    if (desktopAuthEl) {
        const dropdownPanel = desktopAuthEl.parentElement;
        const outerGroup = dropdownPanel?.parentElement;
        const triggerBtn = outerGroup?.querySelector('button');

        if (triggerBtn && dropdownPanel && outerGroup) {
            outerGroup.classList.remove('group');
            dropdownPanel.style.opacity = '0';
            dropdownPanel.style.visibility = 'hidden';
            dropdownPanel.style.transform = 'translateY(8px)';
            dropdownPanel.style.transition = 'all 0.2s ease';
            dropdownPanel.style.pointerEvents = 'none';

            let isOpen = false;

            const openDropdown = () => {
                isOpen = true;
                dropdownPanel.style.opacity = '1';
                dropdownPanel.style.visibility = 'visible';
                dropdownPanel.style.transform = 'translateY(0)';
                dropdownPanel.style.pointerEvents = 'auto';
            };

            const closeDropdown = () => {
                isOpen = false;
                dropdownPanel.style.opacity = '0';
                dropdownPanel.style.visibility = 'hidden';
                dropdownPanel.style.transform = 'translateY(8px)';
                dropdownPanel.style.pointerEvents = 'none';
            };

            triggerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                isOpen ? closeDropdown() : openDropdown();
            });

            document.addEventListener('click', (e) => {
                if (isOpen && !outerGroup.contains(e.target)) closeDropdown();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isOpen) closeDropdown();
            });
        }
    }
}


// ──────────────────────────────────────────
// Global UI Injection
// ─�const GLOBAL_NAV = `
<nav
        class="bg-white/90 backdrop-blur-md fixed top-0 left-0 right-0 z-50 border-b border-gray-100 px-6 md:px-8 lg:px-10 h-16 flex items-center">
        <div class="max-w-7xl mx-auto w-full flex justify-between items-center h-full">
            <div class="flex items-center shrink-0 h-full">
                <a href="./index.html" class="flex items-center gap-2 md:gap-3 group">
                    <img src="./assets/img/logo-1.png" alt="MR Coders Hub" class="h-9 md:h-11 w-auto object-contain transition-transform group-hover:scale-105">
                </a>
            </div>

            <div
                class="hidden lg:flex items-center lg:space-x-4 xl:space-x-8 lg:text-[12px] xl:text-sm font-medium text-gray-600 mx-4 h-full">
                <a href="./index.html" class="hover:text-brand-blue transition whitespace-nowrap flex items-center h-full">Home</a>
                <a href="./about.html" class="hover:text-brand-blue transition whitespace-nowrap flex items-center h-full">About Us</a>

                <div class="relative group h-full flex items-center">
                    <div
                        class="dropdown-trigger hover:text-brand-blue transition flex items-center gap-1 outline-none h-full group-hover:text-brand-blue whitespace-nowrap cursor-pointer">
                        For Students
                        <svg class="w-3 h-3 transition-transform duration-300 group-hover:rotate-180 opacity-70"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                        </svg>
                    </div>
                    <!-- Dropdown Content -->
                    <div
                        class="absolute top-full left-1/2 -translate-x-1/2 pt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 w-72 z-50">
                        <div class="pt-4">
                            <div class="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl p-2 shadow-2xl shadow-blue-500/10 ring-1 ring-black/5">
                                <!-- Edtech Section -->
                                <div class="px-4 py-3 mt-1">
                                    <p class="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em] mb-3 ml-1">Edtech</p>
                                    <div class="grid grid-cols-1 gap-1">
                                        <a href="./category1.html" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-brand-blue/5 text-gray-600 hover:text-brand-blue transition-all group/sub">
                                            <div class="w-1.5 h-1.5 rounded-full bg-brand-blue/20 group-hover/sub:bg-brand-blue transition-colors"></div>
                                            <span class="text-[12px] font-bold">Skill-Based Courses</span>
                                        </a>
                                        <a href="./booking.html" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-brand-blue/5 text-gray-600 hover:text-brand-blue transition-all group/sub">
                                            <div class="w-1.5 h-1.5 rounded-full bg-brand-blue/20 group-hover/sub:bg-brand-blue transition-colors"></div>
                                            <span class="text-[12px] font-bold">Internships</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="relative group h-full flex items-center">
                    <div
                        class="dropdown-trigger hover:text-brand-blue transition flex items-center gap-1 outline-none h-full group-hover:text-brand-blue whitespace-nowrap cursor-pointer">
                        For Businesses
                        <svg class="w-3 h-3 transition-transform duration-300 group-hover:rotate-180 opacity-70"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                        </svg>
                    </div>
                    <!-- Dropdown Content -->
                    <div
                        class="absolute top-full left-1/2 -translate-x-1/2 pt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 w-72 z-50">
                        <div class="pt-4">
                            <div class="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl p-2 shadow-2xl shadow-blue-500/10 ring-1 ring-black/5">
                                <!-- Services Section -->
                                <div class="px-4 py-3 mt-1">
                                    <p class="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] mb-3 ml-1">Services</p>
                                    <div class="grid grid-cols-1 gap-1">
                                        <a href="./category2.html" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-pink-50 text-gray-600 hover:text-pink-600 transition-all group/sub">
                                            <div class="w-1.5 h-1.5 rounded-full bg-pink-200 group-hover/sub:bg-pink-600 transition-colors"></div>
                                            <span class="text-[12px] font-bold">Digital Marketing</span>
                                        </a>
                                        <a href="./category3.html" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-pink-50 text-gray-600 hover:text-pink-600 transition-all group/sub">
                                            <div class="w-1.5 h-1.5 rounded-full bg-pink-200 group-hover/sub:bg-pink-600 transition-colors"></div>
                                            <span class="text-[12px] font-bold">Web Development</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <a href="./projects.html" class="hover:text-brand-blue transition whitespace-nowrap flex items-center h-full">Projects</a>
                <a href="./blog.html" class="hover:text-brand-blue transition whitespace-nowrap flex items-center h-full">Blogs</a>
                <a href="./contact.html" class="hover:text-brand-blue transition whitespace-nowrap flex items-center h-full">Contact</a>
            </div>

            <div class="flex items-center gap-4 justify-end h-full">
                <!-- Desktop CTA -->
                <a href="./contact.html"
                    class="hidden lg:inline-block px-8 py-3 bg-gradient-to-r from-brand-blue to-brand-purple rounded-full text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:scale-105 hover:shadow-blue-600/40 transition-all duration-300 whitespace-nowrap tracking-wide">Start a Project</a>

                <!-- Hamburger Button (Mobile) -->
                <button id="global-mobile-menu-btn"
                    class="lg:hidden w-11 h-11 flex items-center justify-center text-gray-900 bg-gray-50 rounded-xl hover:bg-gray-100 focus:outline-none relative z-50 transition-all border border-gray-100 active:scale-95">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
            </div>
        </div>
    </nav>`; border-gray-100 active:scale-95">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
            </div>
        </div>
    </nav>`;

const GLOBAL_MOBILE = `
    <!-- Mobile Menu Overlay -->
    <div id="global-mobile-menu" class="fixed inset-0 z-[100] hidden">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" id="global-mobile-menu-overlay"></div>
        
        <div class="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col overflow-hidden transform translate-x-full transition-transform duration-500 ease-[cubic-bezier(0.22, 1, 0.36, 1)]" id="global-mobile-menu-container">
            <!-- Header -->
            <div class="flex justify-between items-center p-6 border-b border-gray-50">
                <img src="./assets/img/logo-1.png" alt="MR Coders Hub" class="h-8 w-auto">
                <button id="global-mobile-menu-close" class="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-all">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            
            <!-- Content Scrollable Area -->
            <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div class="space-y-10">
                    <!-- Main Navigation -->
                    <div class="space-y-4">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Navigation</p>
                        <div class="grid grid-cols-1 gap-2">
                            <a href="./index.html" class="flex items-center gap-4 py-3 text-lg font-bold text-gray-700 font-outfit hover:text-brand-blue transition-all">Home</a>
                            <a href="./about.html" class="flex items-center gap-4 py-3 text-lg font-bold text-gray-700 font-outfit hover:text-brand-blue transition-all">About Us</a>
                        </div>
                    </div>

                    <!-- Edtech Mobile -->
                    <div class="space-y-6">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-brand-blue"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"></path><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg></div>
                            <p class="text-[10px] font-black text-brand-blue uppercase tracking-[0.3em]">Learning Hub</p>
                        </div>
                        <div class="grid grid-cols-1 gap-1 pl-4 border-l-2 border-gray-100">
                            <a href="./category1.html" class="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 group transition-all">
                                <span class="font-bold text-gray-700">Skill-Based Courses</span>
                                <svg class="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                            </a>
                             <a href="./booking.html" class="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 group transition-all">
                                <span class="font-bold text-gray-700">Internships</span>
                                <svg class="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                            </a>
                         </div>
                    </div>

                    <!-- Services Mobile -->
                    <div class="space-y-6">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>
                            <p class="text-[10px] font-black text-pink-600 uppercase tracking-[0.3em]">Business Solutions</p>
                        </div>
                        <div class="grid grid-cols-1 gap-1 pl-4 border-l-2 border-gray-100">
                            <a href="./category2.html" class="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 group transition-all">
                                <span class="font-bold text-gray-700">Digital Strategy</span>
                                <svg class="w-4 h-4 text-gray-300 group-hover:text-pink-600 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                            </a>
                            <a href="./category3.html" class="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 group transition-all">
                                <span class="font-bold text-gray-700">Web Development</span>
                                <svg class="w-4 h-4 text-gray-300 group-hover:text-pink-600 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                            </a>
                        </div>
                    </div>

                    <!-- Other Links -->
                    <div class="grid grid-cols-2 gap-4">
                        <a href="./blog.html" class="p-4 bg-gray-50 rounded-2xl text-center font-bold text-gray-600 hover:bg-gray-100 transition-all">Blogs</a>
                        <a href="./projects.html" class="p-4 bg-gray-50 rounded-2xl text-center font-bold text-gray-600 hover:bg-gray-100 transition-all">Projects</a>
                    </div>
                </div>
            </div>

            <!-- Footer Section in Menu -->
            <div class="p-8 border-t border-gray-50 bg-gray-50/50">
                <a href="./contact.html" class="block w-full py-5 text-center bg-brand-blue text-white rounded-2xl font-black shadow-xl shadow-blue-900/10 hover:scale-[1.02] active:scale-95 transition-all mb-8">
                    Contact Us
                </a>
            </div>
        </div>
    </div>
`;

const GLOBAL_FOOTER = `<footer class="bg-gradient-to-b from-slate-950 to-slate-900 text-white pt-16 pb-12 px-6 md:px-8 lg:px-10 relative overflow-hidden">
    <!-- Subtle Background Element -->
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
    
    <div class="max-w-7xl mx-auto w-full relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">

            <!-- Brand Column -->
            <div class="lg:col-span-4 space-y-8">
                <div class="space-y-4">
                    <a href="./index.html" class="flex items-center gap-3 group">
                        <img src="./assets/img/logo-1.png" alt="MR Coders Hub" class="h-9 md:h-11 w-auto object-contain transition-transform group-hover:scale-105"> </a>
                    <p class="text-slate-400 text-sm leading-relaxed max-w-sm font-medium">
                        Empowering the next generation of developers and scaling businesses through execution-driven learning and digital transformation.
                    </p>
                </div>
                
                <div class="flex gap-4">
                    <a href="https://www.instagram.com/mr_coders_hub?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" aria-label="Instagram" class="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-white hover:text-pink-600 hover:border-pink-600 transition-all duration-300 group">
                        <svg class="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
                    </a>
                    <a href="https://www.facebook.com/profile.php?id=61585504880348" aria-label="Facebook" class="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all duration-300 group">
                        <svg class="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                    </a>
                    <a href="https://www.linkedin.com/in/mr-codeds-hub-b96b95406?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" aria-label="LinkedIn" class="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all duration-300 group">
                        <svg class="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554V15.034c0-1.291-.026-2.953-1.798-2.953-1.8 0-2.075 1.405-2.075 2.859v5.512h-3.556V9h3.413v1.561h.048c.475-.9 1.636-1.85 3.367-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path></svg>
                    </a>
                    <a href="https://github.com/" aria-label="GitHub" class="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-white hover:text-black hover:border-white transition-all duration-300 group">
                        <svg class="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
                    </a>
                </div>
            </div>

            <!-- Quick Links -->
            <div class="lg:col-span-2 space-y-6">
                <h4 class="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Explore</h4>
                <ul class="space-y-4 text-sm font-semibold">
                    <li><a href="index.html" class="text-slate-400 hover:text-white transition-colors">Home</a></li>
                    <li><a href="about.html" class="text-slate-400 hover:text-white transition-colors">About Us</a></li>
                    <li><a href="projects.html" class="text-slate-400 hover:text-white transition-colors">Projects</a></li>
                    <li><a href="blog.html" class="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                    <li><a href="contact.html" class="text-slate-400 hover:text-white transition-colors">Contact</a></li>
                </ul>
            </div>

            <!-- Services -->
            <div class="lg:col-span-3 space-y-6">
                <h4 class="text-[10px] font-black text-brand-purple uppercase tracking-[0.3em]">Our Services</h4>
                <ul class="space-y-4 text-sm font-semibold">
                    <li><a href="category1.html" class="text-slate-400 hover:text-white transition-colors flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Skill-Based Courses</a></li>
                    <li><a href="category2.html" class="text-slate-400 hover:text-white transition-colors flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-brand-purple"></span> Digital Marketing</a></li>
                    <li><a href="category3.html" class="text-slate-400 hover:text-white transition-colors flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-brand-orange"></span> Web Development</a></li>
                    <li><a href="booking.html" class="text-slate-400 hover:text-white transition-colors flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Internships</a></li>
                </ul>
            </div>

            <!-- Contact Info -->
            <div class="lg:col-span-3 space-y-6">
                <h4 class="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em]">Get In Touch</h4>
                <div class="space-y-5">
                    <div class="flex items-start gap-4">
                        <div class="mt-1 w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-orange shrink-0">
                            <i data-lucide="map-pin" class="w-4 h-4"></i>
                        </div>
                        <p class="text-sm text-slate-400 leading-relaxed font-medium">9th street, Kamaraj Nagar, <br> Avadi, Chennai,<br>Tamil Nadu, India</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-orange shrink-0">
                            <i data-lucide="mail" class="w-4 h-4"></i>
                        </div>
                        <a href="mailto:info@mrcodershub.com" class="text-sm text-slate-400 hover:text-white transition-colors font-medium">info@mrcodershub.com</a>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-orange shrink-0">
                            <i data-lucide="phone" class="w-4 h-4"></i>
                        </div>
                        <div class="text-sm text-slate-400 font-medium">
                            <p>+91 93607 39559</p>
                            <p>+91 72002 21422</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Bar -->
        <div class="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-center md:text-left">
                <p class="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                    © 2026 MR CODERS HUB. ALL RIGHTS RESERVED.
                </p>
            </div>
            <div class="flex items-center gap-10">
                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Terms</p>
                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Privacy</p>
            </div>
        </div>
    </div>
</footer>`;

function injectGlobalUI() {
    // Inject Navbar & Responsive Styles
    if (!document.getElementById('global-nav-styles')) {
        const style = document.createElement('style');
        style.id = 'global-nav-styles';
        style.textContent = `
            :root {
                --brand-blue: #1E3A8A;
                --brand-purple: #7C3AED;
                --brand-orange: #F59E0B;
            }
            
            /* Responsive Utilities */
            .hero-title {
                font-size: clamp(2rem, 5vw, 5.5rem);
                line-height: 1;
                letter-spacing: -0.05em;
            }
            
            .section-title {
                font-size: clamp(1.5rem, 4vw, 3rem);
                line-height: 1.1;
                letter-spacing: -0.03em;
            }
            
            .responsive-py {
                padding-top: clamp(2rem, 5vw, 4.5rem);
                padding-bottom: clamp(2rem, 5vw, 4.5rem);
            }

            .responsive-px {
                padding-left: clamp(1rem, 4vw, 2.5rem);
                padding-right: clamp(1rem, 4vw, 2.5rem);
            }

            .responsive-p {
                padding: clamp(1rem, 4vw, 2.5rem);
            }

            .responsive-gap {
                gap: clamp(1rem, 4vw, 3rem);
            }

            .responsive-mx {
                margin-left: clamp(0rem, 4vw, 1.5rem);
                margin-right: clamp(0rem, 4vw, 1.5rem);
            }

            .adaptive-rounded {
                border-radius: clamp(1rem, 3vw, 3rem);
            }

            @media (max-width: 1023px) {
                #global-mobile-menu-btn { 
                    display: flex !important;
                    padding: 8px !important; 
                    margin-right: -8px !important; 
                    color: #4B5563 !important;
                }
            }
            
            .shadow-premium {
                box-shadow: 0 20px 50px -15px rgba(30, 58, 138, 0.12);
            }
            
            /* Navbar Active State */
            .nav-link-active:not(.rounded-full) { 
                color: var(--brand-blue) !important; 
                font-weight: 700 !important;
            }
            
            /* Desktop underline indicator */
            nav .nav-link-active:not(.rounded-full) {
                position: relative;
            }
            
            nav .nav-link-active:not(.rounded-full)::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 100%;
                height: 2px;
                background-color: var(--brand-blue);
                border-radius: 2px;
                transform: scaleX(1);
                transition: transform 0.3s ease;
            }

            /* Dropdown trigger specific active state */
            .dropdown-trigger.nav-link-active svg {
                color: var(--brand-blue);
                opacity: 1;
            }
            
            /* Global Icon Visibility Fix */
            i[data-lucide] {
                display: inline-block;
                stroke-width: 2.5;
            }

            #global-mobile-menu .nav-link-active {
                background-color: rgba(30, 58, 138, 0.05);
                border-left: 4px solid var(--brand-blue);
                padding-left: 1rem !important;
                border-bottom: none !important;
            }

            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }

            /* Mobile Horizontal Slider Utility */
            @media (max-width: 767px) {
                .mobile-slider {
                    display: flex !important;
                    flex-wrap: nowrap !important;
                    overflow-x: auto !important;
                    overflow-y: visible !important;
                    scroll-snap-type: x mandatory !important;
                    -webkit-overflow-scrolling: touch !important;
                    scroll-behavior: smooth;
                    padding-top: 1.5rem !important;
                    padding-bottom: 2rem !important;
                    gap: 1rem !important;
                    margin-left: -1rem !important;
                    margin-right: -1rem !important;
                    padding-left: 1.5rem !important;
                    padding-right: 1.5rem !important;
                    justify-content: flex-start !important; /* Critical: prevents unscrollable areas when overflowing */
                    scroll-padding: 0 1.5rem; /* Aligns with padding for better snapping */
                    scrollbar-width: none; /* Firefox */
                    position: relative;
                }
                .mobile-slider::-webkit-scrollbar {
                    display: none; /* Chrome, Safari, Edge */
                }
                .mobile-slider > * {
                    flex-shrink: 0 !important;
                    width: 85% !important;
                    scroll-snap-align: center !important;
                    min-height: auto !important;
                    transition: transform 0.4s ease, opacity 0.4s ease;
                }

                /* Dots for mobile-slider */
                .slider-dots {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-top: -1rem;
                    margin-bottom: 2rem;
                }
                .slider-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 9999px;
                    background: #d1d5db;
                    transition: all 0.3s ease;
                }
                .slider-dot.active {
                    background: var(--brand-blue);
                    width: 18px;
                }
                
                /* Compact internal elements for mobile-slider cards */
                .mobile-slider h2, .mobile-slider h3, .mobile-slider h4 {
                    font-size: 1.25rem !important;
                    margin-bottom: 0.5rem !important;
                    line-height: 1.2 !important;
                }
                .mobile-slider p {
                    font-size: 0.85rem !important;
                    margin-bottom: 0.75rem !important;
                    line-height: 1.4 !important;
                }
                .mobile-slider ul {
                    margin-bottom: 0.5rem !important;
                    display: block !important;
                    font-size: 0.75rem !important;
                }
                .mobile-slider ul li {
                    margin-bottom: 0.25rem !important;
                    gap: 0.5rem !important;
                }
                .mobile-slider ul li i, .mobile-slider ul li svg {
                    width: 0.85rem !important;
                    height: 0.85rem !important;
                }
                .mobile-slider .w-14, .mobile-slider .h-14 {
                    width: 2.75rem !important;
                    height: 2.75rem !important;
                    margin-bottom: 0.75rem !important;
                }
                .mobile-slider .tag-pill {
                    padding: 2px 8px !important;
                    font-size: 8px !important;
                }
                .mobile-slider .mt-auto {
                    padding-top: 0.75rem !important;
                    margin-top: 0.5rem !important;
                }
                .mobile-slider .text-2xl {
                    font-size: 1.1rem !important;
                }
                .mobile-slider i, .mobile-slider svg {
                    width: 1.25rem !important;
                    height: 1.25rem !important;
                }
            }

            /* Premium High-Contrast Selection */
            ::selection {
                background-color: var(--brand-blue);
                color: #ffffff !important;
                text-shadow: none;
            }
            ::-moz-selection {
                background-color: var(--brand-blue);
                color: #ffffff !important;
                text-shadow: none;
            }
        `;
        document.head.appendChild(style);
    }

    // Inject Favicon
    let head = document.head;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        head.appendChild(link);
    }
    link.href = GLOBAL_FAVICON;

    // Inject Nav & Mobile Menu
    if (!document.querySelector('nav')) {
        document.body.insertAdjacentHTML('afterbegin', GLOBAL_NAV + '\n' + GLOBAL_MOBILE);
    }

    // Inject Footer
    if (!document.querySelector('footer')) {
        document.body.insertAdjacentHTML('beforeend', GLOBAL_FOOTER);
    }

    // Refresh icons for dynamically injected content
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ──────────────────────────────────────────
// Global Mobile Slider Handler
// ──────────────────────────────────────────
function initMobileSliders() {
    const sliders = document.querySelectorAll('.mobile-slider');
    
    sliders.forEach(slider => {
        const cards = Array.from(slider.children);
        if (cards.length <= 1) return;

        // Create Dots Container if not present
        let dotsContainer = slider.nextElementSibling;
        if (!dotsContainer || !dotsContainer.classList.contains('slider-dots')) {
            dotsContainer = document.createElement('div');
            dotsContainer.className = 'slider-dots';
            slider.parentNode.insertBefore(dotsContainer, slider.nextSibling);
        } else {
            dotsContainer.innerHTML = ''; // Reset
        }

        // Initialize Dots
        cards.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
            dot.style.cursor = 'pointer';
            dot.addEventListener('click', () => {
                const cardWidth = cards[0].offsetWidth + 16;
                slider.scrollTo({
                    left: i * cardWidth,
                    behavior: 'smooth'
                });
            });
            dotsContainer.appendChild(dot);
        });

        const dots = dotsContainer.querySelectorAll('.slider-dot');
        let isPaused = false;
        let rotationInterval;

        const updateActiveDot = () => {
            const cardWidth = cards[0].offsetWidth + 16;
            // Use a small buffer to handle floating point precision
            const index = Math.round(slider.scrollLeft / cardWidth);
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        const startRotation = () => {
            if (rotationInterval) return;
            rotationInterval = setInterval(() => {
                if (isPaused || window.innerWidth >= 768) return;

                const cardWidth = cards[0].offsetWidth + 16;
                const maxScroll = slider.scrollWidth - slider.offsetWidth;

                if (slider.scrollLeft >= maxScroll - 20) {
                    slider.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    slider.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            }, 3500);
        };

        const stopRotation = () => {
            clearInterval(rotationInterval);
            rotationInterval = null;
        };

        // Event Listeners
        slider.addEventListener('scroll', updateActiveDot, { passive: true });
        slider.addEventListener('touchstart', () => isPaused = true, { passive: true });
        slider.addEventListener('touchend', () => setTimeout(() => isPaused = false, 2000), { passive: true });
        slider.addEventListener('mouseenter', () => isPaused = true);
        slider.addEventListener('mouseleave', () => isPaused = false);

        // Initial Start
        if (window.innerWidth < 768) {
            startRotation();
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) stopRotation();
            else startRotation();
        });
    });
}

// ──────────────────────────────────────────
// Deprecated: Testimonial Carousel (Now uses global mobile-slider)
// ──────────────────────────────────────────
function initTestimonialCarousel() {
    // Legacy support: if index.html still has old testimonial structure
    const container = document.getElementById('testimonialContainer');
    if (container && !container.classList.contains('mobile-slider')) {
        container.classList.add('mobile-slider');
        initMobileSliders();
    }
}
