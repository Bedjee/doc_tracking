import '../css/app.css';
// import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from '@/Components/UI/Toast';
import FlashListenerGlobal from '@/Components/UI/FlashListenerGlobal';

const appName = import.meta.env.VITE_APP_NAME || 'Document Tracking';

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),

    setup({ el, App, props }) {
        createRoot(el).render(
            <ToastProvider>
                {/* Global listener – works outside Inertia's React context */}
                <FlashListenerGlobal />

                {/* Inertia app – no children needed */}
                <App {...props} />
            </ToastProvider>
        );
    },

    progress: { color: '#0f172a' },
});