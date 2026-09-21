import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useToast } from '@/Components/UI/Toast';

export default function FlashListenerGlobal() {
    const toast = useToast();

    useEffect(() => {
        const handler = (event) => {
            const flash = event.detail?.flash;
            if (!flash) return;

            ['success', 'error', 'warning', 'info'].forEach((type) => {
                if (flash[type]) toast[type](flash[type]);
            });
        };

        router.on('flash', handler);

        // Inertia v1 has no router.off(); the listener is registered once
        // (toast is memoized) so it never needs to be removed.
        return () => {};
    }, [toast]);

    return null;
}