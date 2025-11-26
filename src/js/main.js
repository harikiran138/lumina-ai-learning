document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            
            // Optional: Animate icon or change icon state
            const iconPath = mobileMenuBtn.querySelector('path');
            if (mobileMenu.classList.contains('hidden')) {
                // Hamburger icon
                iconPath.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
            } else {
                // Close icon
                iconPath.setAttribute('d', 'M6 18L18 6M6 6l12 12');
            }
        });
    }

    // Close mobile menu when clicking a link
    const mobileLinks = mobileMenu?.querySelectorAll('a');
    mobileLinks?.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            const iconPath = mobileMenuBtn.querySelector('path');
            iconPath.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
        });
    });

    // Active Link Highlighting (Scroll Spy)
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function highlightNavigation() {
        let scrollY = window.scrollY;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100; // Offset for fixed header
            const sectionId = current.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href').includes(sectionId)) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightNavigation);
});
