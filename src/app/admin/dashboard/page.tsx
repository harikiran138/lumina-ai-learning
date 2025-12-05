'use client';

import { useEffect } from 'react';

export default function AdminDashboard() {
    useEffect(() => {
        const init = async () => {
            if (typeof window === 'undefined') return;

            // Wait for global objects to be available
            let attempts = 0;
            while ((!(window as any).luminaDB || !(window as any).navigationManager) && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!(window as any).luminaDB) return;

            try {
                // Initialize managers
                await (window as any).luminaDB.init();
                if ((window as any).navigationManager) await (window as any).navigationManager.init();

                // Populate navigation
                const topNavContainer = document.getElementById('top-nav-container');
                const sidebarContainer = document.getElementById('sidebar-container');
                const currentUser = await (window as any).luminaDB.getCurrentUser();

                if (!currentUser) {
                    window.location.href = '/login';
                    return;
                }

                if (topNavContainer && (window as any).navigationManager) {
                    topNavContainer.innerHTML = (window as any).navigationManager.generateTopNav('admin');
                }
                if (sidebarContainer && (window as any).navigationManager) {
                    sidebarContainer.innerHTML = (window as any).navigationManager.generateSidebar('admin');
                }
                if ((window as any).navigationManager) {
                    (window as any).navigationManager.setupEventListeners();
                }

                // Update user name
                const shortName = currentUser.name.split(' ')[0];
                const userNameEls = document.querySelectorAll('#user-name');
                userNameEls.forEach(el => el.textContent = shortName);

            } catch (error) {
                console.error('Dashboard initialization error:', error);
            }
        };

        init();
    }, []);

    return (
        <>
            <div id="top-nav-container"></div>
            <div className="flex">
                <div id="sidebar-container"></div>
                <main className="flex-1 pt-20 pb-8">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="mb-6">
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, <span className="text-amber-500" id="user-name">Admin</span>!</h1>
                            <p className="text-gray-600 dark:text-gray-400">Admin Dashboard Placeholder</p>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
