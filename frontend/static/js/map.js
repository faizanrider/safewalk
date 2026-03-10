/**
 * SafeWalk – Hybrid Leaflet + Google Maps Directions Integration
 * Google Maps powers exact distances & routing. Leaflet powers the visual map & zones.
 */

let map = null;
let userMarker = null;
let userCircle = null;
let safetyZoneMarkers = [];
let reportMarkers = [];
let zonesVisible = true;
let userPosition = { lat: 28.6139, lng: 77.2090 }; // Default

let satelliteLayer, digitalLayer, labelsLayer;

// Google Maps Services & Leaflet Polyline
let directionsService = null;
let directionsRenderer = null; // Removed Autocomplete references
let routePolyline = null;
let startMarker = null;
let endMarker = null;

// ── Initialize Map ──────────────────────────────────────
function initMap() {
    // Basic Leaflet map setup
    map = L.map('map', { zoomControl: false }).setView([userPosition.lat, userPosition.lng], 15);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layers
    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }).addTo(map);
    labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
    digitalLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const baseMaps = {
        "Digital Street View": digitalLayer,
        "Satellite View": satelliteLayer
    };
    L.control.layers(baseMaps, { "Street Labels": labelsLayer }).addTo(map);

    getCurrentUserLocation();

    loadSafetyZones();
    loadSafetyReports();
}

function setBaseMap(type) {
    if (type === 'satellite') {
        if (map.hasLayer(digitalLayer)) map.removeLayer(digitalLayer);
        if (!map.hasLayer(satelliteLayer)) map.addLayer(satelliteLayer);
        if (!map.hasLayer(labelsLayer)) map.addLayer(labelsLayer);
    } else {
        if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
        if (map.hasLayer(labelsLayer)) map.removeLayer(labelsLayer);
        if (!map.hasLayer(digitalLayer)) map.addLayer(digitalLayer);
    }
}

// ── Get User Location ───────────────────────────────────
function getCurrentUserLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userPosition = { lat: position.coords.latitude, lng: position.coords.longitude };
            map.setView([userPosition.lat, userPosition.lng], 16);
            updateUserMarker(userPosition.lat, userPosition.lng);
        },
        (error) => { console.warn(error); },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function updateUserMarker(lat, lng) {
    userPosition = { lat, lng };
    if (!userMarker) {
        const userIcon = L.divIcon({
            className: 'custom-user-marker',
            html: `<div style="width: 16px; height: 16px; background-color: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
            iconSize: [22, 22], iconAnchor: [11, 11]
        });
        userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        userCircle = L.circle([lat, lng], { radius: 80, fillColor: '#3b82f6', fillOpacity: 0.15, color: '#3b82f6', opacity: 0.3, weight: 1, interactive: false }).addTo(map);
    } else {
        userMarker.setLatLng([lat, lng]);
        userCircle.setLatLng([lat, lng]);
    }
}

function centerOnUser() {
    if (userPosition) map.setView([userPosition.lat, userPosition.lng], 16);
    getCurrentUserLocation();
}

// ── Custom OSRM Routing (Google Maps Feel) ──────────────

function swapLocations() {
    const startInput = document.getElementById('startLocation');
    const endInput = document.getElementById('endLocation');
    const temp = startInput.value;
    startInput.value = endInput.value;
    endInput.value = temp;
}

async function calculateGoogleRoute() {
    const startVal = document.getElementById('startLocation').value.trim();
    const endVal = document.getElementById('endLocation').value.trim();
    const btn = document.getElementById('directionsBtn');

    if (!startVal || !endVal) {
        showToast('Please enter both Start and End locations.', 'warning');
        return;
    }

    // Set Loading State
    btn.innerHTML = `<span class="spinner" style="display:inline-block; width:16px; height:16px; margin-right:8px; border-width:2px;"></span><span>Calculating...</span>`;
    btn.disabled = true;

    try {
        // 1. Geocode Start (If not "Your Location")
        let startCoords = [userPosition.lat, userPosition.lng];
        if (startVal.toLowerCase() !== 'your location' && startVal !== '') {
            startCoords = await geocodeAddress(startVal);
        }

        // 2. Geocode End
        const endCoords = await geocodeAddress(endVal);

        if (!startCoords || !endCoords) {
            showToast('Could not find one of the locations.', 'error');
            resetDirectionsBtn(btn);
            return;
        }

        // 3. Fetch OSRM Route
        const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            showToast('No walking route found.', 'error');
            resetDirectionsBtn(btn);
            return;
        }

        drawRouteOnLeaflet(data.routes[0], startCoords, endCoords);

    } catch (err) {
        console.error("Routing Error:", err);
        showToast('Routing failed. Please try again.', 'error');
    } finally {
        resetDirectionsBtn(btn);
    }
}

function resetDirectionsBtn(btn) {
    btn.innerHTML = `<span>Directions</span><span class="btn-icon-right">→</span>`;
    btn.disabled = false;
}

async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
}

function drawRouteOnLeaflet(route, startLL, endLL) {
    // Clear old route
    if (routePolyline) map.removeLayer(routePolyline);
    if (startMarker) map.removeLayer(startMarker);
    if (endMarker) map.removeLayer(endMarker);

    // Swap GeoJSON [lon, lat] to Leaflet [lat, lon]
    const path = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

    // 1. Draw Polyline
    routePolyline = L.polyline(path, {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.8,
        lineJoin: 'round'
    }).addTo(map);

    map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });

    // 2. Add Start & End Markers
    startMarker = L.marker(startLL, {
        icon: L.divIcon({
            html: `<div style="width: 14px; height: 14px; background-color: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
            className: '', iconSize: [20, 20], iconAnchor: [10, 10]
        })
    }).addTo(map);

    endMarker = L.marker(endLL, {
        icon: L.divIcon({
            html: `<div style="font-size: 24px;">📍</div>`,
            className: '', iconSize: [24, 24], iconAnchor: [12, 24]
        })
    }).addTo(map);

    // 3. Update UI
    const distKm = (route.distance / 1000).toFixed(1);
    const timeMin = Math.round(route.duration / 60);

    document.getElementById('routeDistance').textContent = `${distKm} km`;
    document.getElementById('routeDuration').textContent = `${timeMin} min`;
    document.getElementById('routeResultPanel').classList.remove('hidden');

    // 4. Safety
    analyzeRouteSafety(path);
}

function analyzeRouteSafety(pathCoordinates) {
    let highRiskPts = 0;
    let safePts = 0;

    pathCoordinates.forEach(coord => {
        const pLatLng = L.latLng(coord[0], coord[1]);
        safetyZoneMarkers.forEach(zone => {
            const center = zone.getLatLng();
            const radius = zone.getRadius();
            if (center.distanceTo(pLatLng) <= radius) {
                const color = zone.options.fillColor;
                if (color === '#ef4444') highRiskPts++;
                else if (color === '#22c55e') safePts++;
            }
        });
    });

    const badge = document.getElementById('routeSafetyWarning');
    const text = document.getElementById('routeSafetyText');
    badge.classList.remove('hidden', 'safe', 'unsafe', 'normal');

    if (highRiskPts > 2) {
        badge.classList.add('unsafe');
        badge.innerHTML = `<span class="safety-icon">⚠️</span><span>High Risk Route: Red Zones Ahead</span>`;
    } else if (safePts > 2) {
        badge.classList.add('safe');
        badge.innerHTML = `<span class="safety-icon">🛡️</span><span>Safe Route: Green Zones Available</span>`;
    } else {
        badge.classList.add('normal');
        badge.innerHTML = `<span class="safety-icon">📍</span><span>Normal Route</span>`;
    }
}


// ── Load Safety Zones ───────────────────────────────────
async function loadSafetyZones() {
    try {
        const { ok, data } = await apiRequest('/api/safety/zones');
        if (ok && data.zones) {
            data.zones.forEach(zone => addSafetyZoneMarker(zone));
        }
    } catch (err) {
        console.warn('[SafeWalk] Could not load safety zones:', err);
    }
    if (safetyZoneMarkers.length === 0) addDemoSafetyZones();
}

function addSafetyZoneMarker(zone) {
    const colors = {
        safe: { fill: '#22c55e', opacity: 0.18, stroke: '#15803d', label: 'SAFE (Residential)' },
        normal: { fill: '#eab308', opacity: 0.20, stroke: '#a16207', label: 'MODERATE (School/College)' },
        unsafe: { fill: '#ef4444', opacity: 0.22, stroke: '#b91c1c', label: 'RISKY (Pubs/Bars)' },
    };
    const style = colors[zone.safety_level] || colors.normal;

    const circle = L.circle([zone.latitude, zone.longitude], {
        radius: zone.radius_meters || 500,
        fillColor: style.fill, fillOpacity: style.opacity,
        color: style.stroke, weight: 2, opacity: 0.5
    }).addTo(map);

    circle.bindPopup(`
        <div style="padding: 4px; color: #333; font-family: 'Inter', sans-serif;">
            <strong style="font-size: 1.1rem; display: block; margin-bottom: 2px;">${zone.name || 'Safety Zone'}</strong>
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: ${style.fill}; color: #fff; font-size: 0.75rem; font-weight: 800; margin-bottom: 8px;">
                ${style.label}
            </span>
            <p style="margin: 0; font-size: 0.9rem; color: #555;">${zone.description || ''}</p>
        </div>
    `);
    safetyZoneMarkers.push(circle);
}

function addDemoSafetyZones() {
    const telanganaPOIs = [
        // Hyderabad - Central
        { latitude: 17.3850, longitude: 78.4867, safety_level: 'safe', name: 'Banjara Hills Residential', radius_meters: 800, description: 'Premium residential area, high patrolling' },
        { latitude: 17.4065, longitude: 78.4691, safety_level: 'normal', name: 'Osmania University Campus', radius_meters: 600, description: 'Educational hub, moderate activity' },
        { latitude: 17.4300, longitude: 78.4500, safety_level: 'unsafe', name: 'Jubilee Hills Pub Row', radius_meters: 400, description: 'High nightlife activity, late night risk' },

        // Hyderabad - IT Corridor
        { latitude: 17.4448, longitude: 78.3498, safety_level: 'safe', name: 'Gachibowli IT Hub', radius_meters: 900, description: 'Well-lit, 24/7 security presence' },
        { latitude: 17.4486, longitude: 78.3908, safety_level: 'unsafe', name: 'Madhapur Bars Area', radius_meters: 350, description: 'Crowded late hours, caution advised' },

        // Warangal (Hanamkonda)
        { latitude: 17.9689, longitude: 79.5941, safety_level: 'safe', name: 'Hanamkonda Residential', radius_meters: 700, description: 'Quiet family residential zone' },
        { latitude: 17.9836, longitude: 79.5308, safety_level: 'normal', name: 'NIT Warangal Campus', radius_meters: 500, description: 'Student area, generally safe' },
        { latitude: 17.9744, longitude: 79.6019, safety_level: 'unsafe', name: 'Warangal Station Vicinity', radius_meters: 400, description: 'Isolated spots at night' },

        // Nizamabad
        { latitude: 18.6725, longitude: 78.0941, safety_level: 'safe', name: 'Nizamabad Colony', radius_meters: 600, description: 'Safe residential pocket' },

        // Random Telangana State Coverage
        { latitude: 18.4386, longitude: 79.1288, safety_level: 'normal', name: 'Karimnagar City Center', radius_meters: 800, description: 'Active commercial zone' },
        { latitude: 17.2473, longitude: 80.1514, safety_level: 'safe', name: 'Khammam Residential', radius_meters: 500, description: 'Safe neighborhood' }
    ];

    // Also keep local ones around user
    const localZones = [
        { latitude: userPosition.lat + 0.005, longitude: userPosition.lng + 0.003, safety_level: 'safe', name: 'Residential Zone', radius_meters: 400, description: 'High foot traffic, residential' },
        { latitude: userPosition.lat - 0.003, longitude: userPosition.lng + 0.006, safety_level: 'normal', name: 'College Vicinity', radius_meters: 350, description: 'Educational area, moderate safety' },
        { latitude: userPosition.lat - 0.008, longitude: userPosition.lng + 0.008, safety_level: 'unsafe', name: 'Pub & Bar Street', radius_meters: 250, description: 'Late night risky zone' }
    ];

    telanganaPOIs.forEach(zone => addSafetyZoneMarker(zone));
    localZones.forEach(zone => addSafetyZoneMarker(zone));
}

// ── Load Safety Reports ─────────────────────────────────
async function loadSafetyReports() {
    try {
        const { ok, data } = await apiRequest('/api/safety/reports');
        if (ok && data.reports) {
            data.reports.forEach(report => {
                const isHigh = report.severity === 'high';
                const reportIcon = L.divIcon({
                    className: 'custom-report-marker',
                    html: `<div style="width: 14px; height: 14px; background-color: ${isHigh ? '#ef4444' : '#f59e0b'}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                    iconSize: [18, 18], iconAnchor: [9, 9]
                });
                const marker = L.marker([report.latitude, report.longitude], { icon: reportIcon }).addTo(map);
                marker.bindPopup(`
                    <div style="padding: 4px; color: #333; font-family: 'Inter', sans-serif;">
                        <strong>⚠️ Safety Report</strong><br>
                        <p style="margin: 4px 0;">${report.description}</p>
                        <small>Severity: ${report.severity} · ${new Date(report.created_at).toLocaleDateString()}</small>
                    </div>
                `);
                reportMarkers.push(marker);
            });
        }
    } catch (err) {
        console.warn('[SafeWalk] Could not load safety reports:', err);
    }
}

// ── Toggle Safety Zones ─────────────────────────────────
function toggleSafetyZones() {
    zonesVisible = !zonesVisible;
    safetyZoneMarkers.forEach(layer => {
        if (zonesVisible) map.addLayer(layer);
        else map.removeLayer(layer);
    });
    const btn = document.getElementById('toggleZonesBtn');
    if (btn) zonesVisible ? btn.classList.add('active') : btn.classList.remove('active');
    showToast(zonesVisible ? 'Safety zones visible' : 'Safety zones hidden', 'info');
}

// ── Report Unsafe Area ──────────────────────────────────
function openReportModal() {
    const overlay = document.getElementById('reportModalOverlay');
    if (overlay) overlay.classList.add('active');
    if (userPosition) {
        document.getElementById('reportLocation').value = `${userPosition.lat.toFixed(6)}, ${userPosition.lng.toFixed(6)}`;
        document.getElementById('reportLat').value = userPosition.lat;
        document.getElementById('reportLng').value = userPosition.lng;
    }
}

function closeReportModal() {
    const overlay = document.getElementById('reportModalOverlay');
    if (overlay) overlay.classList.remove('active');
}

function selectSeverity(el) {
    document.querySelectorAll('.severity-option').forEach(opt => opt.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('reportSeverity').value = el.dataset.value;
}

async function handleReport(e) {
    e.preventDefault();
    if (!isAuthenticated()) {
        showToast('Please log in to report unsafe areas', 'warning');
        return;
    }
    const latitude = parseFloat(document.getElementById('reportLat').value);
    const longitude = parseFloat(document.getElementById('reportLng').value);
    const description = document.getElementById('reportDesc').value.trim();
    const severity = document.getElementById('reportSeverity').value;

    if (!latitude || !longitude) {
        showToast('Location not available', 'error');
        return;
    }

    try {
        const { ok, data } = await apiRequest('/api/safety/report', 'POST', { latitude, longitude, description, severity });
        if (ok) {
            showToast('Unsafe area reported. Thank you!', 'success');
            closeReportModal();
            const isHigh = severity === 'high';
            const reportIcon = L.divIcon({
                className: 'custom-report-marker',
                html: `<div style="width: 14px; height: 14px; background-color: ${isHigh ? '#ef4444' : '#f59e0b'}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                iconSize: [18, 18], iconAnchor: [9, 9]
            });
            const marker = L.marker([latitude, longitude], { icon: reportIcon }).addTo(map);
            reportMarkers.push(marker);
        } else {
            showToast(data.error || 'Failed to submit report', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    }
}
