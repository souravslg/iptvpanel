// Hook to manage user playlist functionality
import { useState, useCallback } from 'react';

export function useUserPlaylist(user, onUpdate) {
    const [loading, setLoading] = useState(false);
    const [playlistData, setPlaylistData] = useState(null);

    // Generate playlist for user
    const generatePlaylist = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user-playlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            if (res.ok) {
                const data = await res.json();
                setPlaylistData(data);
                if (onUpdate) onUpdate();
                return data;
            }
        } catch (error) {
            console.error('Failed to generate playlist:', error);
        } finally {
            setLoading(false);
        }
    }, [user.id, onUpdate]);

    // Fetch existing playlist
    const fetchPlaylist = useCallback(async () => {
        try {
            const res = await fetch(`/api/user-playlist?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setPlaylistData(data);
                return data;
            }
        } catch (error) {
            console.error('Failed to fetch playlist:', error);
        }
    }, [user.id]);

    // Revoke playlist
    const revokePlaylist = useCallback(async () => {
        try {
            const res = await fetch(`/api/user-playlist?userId=${user.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setPlaylistData(null);
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Failed to revoke playlist:', error);
        }
    }, [user.id, onUpdate]);

    return {
        loading,
        playlistData,
        generatePlaylist,
        fetchPlaylist,
        revokePlaylist
    };
}
