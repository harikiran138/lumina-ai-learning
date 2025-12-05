'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            if (typeof window !== 'undefined' && (window as any).luminaAPI) {
                try {
                    const user = await (window as any).luminaAPI.getCurrentUser();
                    if (user) {
                        (window as any).luminaUI.redirectToDashboard(user.role);
                    } else {
                        router.push('/login');
                    }
                } catch (e) {
                    router.push('/login');
                }
            } else {
                // If API not loaded yet, wait or redirect to login
                setTimeout(checkSession, 500);
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
