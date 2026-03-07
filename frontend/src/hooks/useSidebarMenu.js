/**
 * useSidebarMenu
 *
 * Fetches the role-aware navigation menu from GET /api/navigation/menu/
 * and caches it in local state.
 *
 * Re-fetches automatically when:
 *   - the component mounts
 *   - the logged-in user changes (auth state changes)
 *
 * On logout / user === null the cached items are cleared immediately.
 *
 * Returns: { menuItems, loading, error, refetch }
 */
import { useState, useEffect, useCallback } from 'react';
import { navigationAPI } from '../services/api';

export default function useSidebarMenu(user) {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);

    const fetchMenu = useCallback(async () => {
        if (!user) {
            setMenuItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data } = await navigationAPI.getMenu();
            setMenuItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[useSidebarMenu] failed to fetch menu:', err);
            setError(err);
            setMenuItems([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.user_type]); // re-fetch if the user identity or role changes

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    return { menuItems, loading, error, refetch: fetchMenu };
}
