'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                // Use modern API to get current user
                // Note: The API currently checks sessionStorage
                // In a real production app, we would verify the session validy with the server
                const user = await import('@/lib/api').then(m => m.api.getCurrentUser());

                if (user) {
                    const targetPath = `/${user.role}/dashboard`;
                    router.push(targetPath);
                } else {
                    router.push('/login');
                }
            } catch (e) {
                console.error("Dashboard redirect error:", e);
                router.push('/login');
            }
        };

        checkSession();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-lumina-dark text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-primary mx-auto mb-4"></div>
                <p>Redirecting...</p>
            </div>
        </div>
    );
}
