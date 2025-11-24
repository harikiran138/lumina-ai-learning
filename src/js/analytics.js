/**
 * Vercel Analytics Integration
 * Tracks page views and Web Vitals
 */

import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics
inject();

export { inject };
