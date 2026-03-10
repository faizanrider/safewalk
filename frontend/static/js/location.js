/**
 * SafeWalk – Live Location Tracking
 * Continuous geolocation updates using Browser Geolocation API.
 */

let watchId = null;
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 30000; // Send location update every 30 seconds

// ── Start Tracking ──────────────────────────────────────
function startLocationTracking() {
    if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
        }
    );

    console.log('[SafeWalk] Location tracking started');
}

// ── Stop Tracking ───────────────────────────────────────
function stopLocationTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        console.log('[SafeWalk] Location tracking stopped');
    }
}

// ── Handle Position Update ──────────────────────────────
async function handlePositionUpdate(position) {
    const now = Date.now();
    const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
    };

    // Update map marker if available
    if (typeof updateUserMarker === 'function') {
        updateUserMarker(coords.latitude, coords.longitude);
    }

    // Throttle backend updates
    if (now - lastUpdateTime < UPDATE_INTERVAL) return;
    lastUpdateTime = now;

    // Send to backend (only if authenticated)
    if (isAuthenticated()) {
        try {
            await apiRequest('/api/location/update', 'POST', coords);
        } catch (err) {
            console.warn('[SafeWalk] Location update failed:', err);
        }
    }
}

// ── Handle Position Error ───────────────────────────────
function handlePositionError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.warn('[SafeWalk] Location permission denied');
            break;
        case error.POSITION_UNAVAILABLE:
            console.warn('[SafeWalk] Location unavailable');
            break;
        case error.TIMEOUT:
            console.warn('[SafeWalk] Location request timed out');
            break;
    }
}

// ── Auto-start tracking when page loads ─────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLocationTracking);
} else {
    startLocationTracking();
}
