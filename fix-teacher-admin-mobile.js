#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of teacher and admin pages to fix
const teacherPages = [
    'teacher/dashboard.html',
    'teacher/assessment_management.html',
    'teacher/community.html',
    'teacher/content_upload.html',
    'teacher/reports.html'
];

const adminPages = [
    'admin/dashboard.html',
    'admin/community.html'
];

const allPages = [...teacherPages, ...adminPages];

const tailwindConfig = `    <script>
        tailwind.config = {
            theme: {
                screens: {
                    'sm': '640px',
                    'md': '768px',
                    'lg': '1024px',
                    'xl': '1280px',
                    '2xl': '1536px',
                }
            }
        }
    </script>`;

const mobileCSS = `        
        /* Mobile Responsiveness Fallback */
        @media (max-width: 1023px) {
            .mobile-sidebar-hidden {
                transform: translateX(-100%) !important;
            }
            .mobile-sidebar-visible {
                transform: translateX(0) !important;
            }
            #sidebar {
                position: fixed !important;
                z-index: 40 !important;
            }
            #main-content {
                width: 100% !important;
            }
        }
        
        @media (min-width: 1024px) {
            #sidebar {
                position: relative !important;
                transform: translateX(0) !important;
            }
        }`;

const newToggleFunction = `        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            
            if (sidebar.classList.contains('mobile-sidebar-hidden')) {
                // Open sidebar
                sidebar.classList.remove('mobile-sidebar-hidden');
                sidebar.classList.add('mobile-sidebar-visible');
                overlay.classList.remove('hidden');
            } else {
                // Close sidebar
                sidebar.classList.remove('mobile-sidebar-visible');
                sidebar.classList.add('mobile-sidebar-hidden');
                overlay.classList.add('hidden');
            }
        }`;

function processFile(filePath) {
    console.log(`Processing: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Add Tailwind config after <script src="https://cdn.tailwindcss.com"></script>
    if (!content.includes('tailwind.config')) {
        content = content.replace(
            /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/,
            `<script src="https://cdn.tailwindcss.com"></script>\n${tailwindConfig}`
        );
    }
    
    // 2. Add mobile CSS before </style> if not already present
    if (!content.includes('Mobile Responsiveness Fallback')) {
        content = content.replace(
            /(\s*)<\/style>/,
            `${mobileCSS}$1</style>`
        );
    }
    
    // 3. Replace sidebar class
    content = content.replace(
        /class="([^"]*)-translate-x-full lg:translate-x-0([^"]*)"/,
        'class="$1mobile-sidebar-hidden lg:translate-x-0$2"'
    );
    
    // 4. Replace toggleSidebar function
    content = content.replace(
        /function toggleSidebar\(\) \{[\s\S]*?\n        \}/,
        newToggleFunction
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated: ${filePath}`);
}

// Process all teacher and admin pages
const baseDir = 's:/work/lumnia/';
allPages.forEach(page => {
    const filePath = path.join(baseDir, page).replace(/\\/g, '/');
    processFile(filePath);
});

console.log('All teacher and admin files processed!');