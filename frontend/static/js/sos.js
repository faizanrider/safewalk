/**
 * SafeWalk – SOS Emergency Alert Logic
 * Handles SOS button, countdown modal, and alert dispatch.
 */

let sosCountdownInterval = null;
let sosCountdownValue = 5;

// ── Open SOS Modal ──────────────────────────────────────
function openSOSModal() {
    const overlay = document.getElementById('sosModalOverlay');
    if (!overlay) return;

    overlay.classList.add('active');
    sosCountdownValue = 5;
    document.getElementById('sosCountdown').textContent = sosCountdownValue;

    // Start countdown
    sosCountdownInterval = setInterval(() => {
        sosCountdownValue--;
        document.getElementById('sosCountdown').textContent = sosCountdownValue;

        if (sosCountdownValue <= 0) {
            clearInterval(sosCountdownInterval);
            sendSOSNow();
        }
    }, 1000);
}

// ── Cancel SOS ──────────────────────────────────────────
function cancelSOS() {
    clearInterval(sosCountdownInterval);
    const overlay = document.getElementById('sosModalOverlay');
    if (overlay) overlay.classList.remove('active');
    showToast('SOS cancelled', 'info');
}

// ── Send SOS Alert ──────────────────────────────────────
async function sendSOSNow() {
    clearInterval(sosCountdownInterval);
    const overlay = document.getElementById('sosModalOverlay');

    // Update modal to show sending state
    const countdown = document.getElementById('sosCountdown');
    if (countdown) countdown.innerHTML = '<div class="spinner" style="margin: 0 auto;"></div>';

    try {
        // Get current location
        const position = await getCurrentPosition();

        if (!isAuthenticated()) {
            showToast('Please log in to send SOS alerts', 'warning');
            if (overlay) overlay.classList.remove('active');
            return;
        }

        // Send SOS to backend
        const { ok, data } = await apiRequest('/api/sos/trigger', 'POST', {
            latitude: position.latitude,
            longitude: position.longitude,
        });

        if (overlay) overlay.classList.remove('active');

        if (ok) {
            if (data.contacts_notified > 0) {
                showToast(
                    `🚨 SOS Alert sent! ${data.contacts_notified} contacts notified.`,
                    'success',
                    6000
                );
            } else {
                // If 0 notified, check for errors in the logs
                let errorDetails = 'Notify service error.';
                if (data.sms_results && data.sms_results.length > 0 && !data.sms_results[0].success) {
                    errorDetails = `SMS Error: ${data.sms_results[0].error || 'Service failure'}`;
                } else if (data.email_results && data.email_results.length > 0 && !data.email_results[0].success) {
                    errorDetails = `Email Error: ${data.email_results[0].error || 'Service failure'}`;
                }

                showToast(
                    `⚠️ SOS triggered but ${errorDetails}`,
                    'warning',
                    10000
                );
            }
            // Reload SOS history if on dashboard
            if (typeof loadSOSHistory === 'function') {
                loadSOSHistory();
            }
        } else {
            showToast(data.error || 'Failed to send SOS alert', 'error');
        }

    } catch (error) {
        if (overlay) overlay.classList.remove('active');
        showToast(error.message || 'Failed to get location for SOS', 'error');
    }
}

// ── Load SOS History (Dashboard) ────────────────────────
async function loadSOSHistory() {
    if (!isAuthenticated()) return;

    try {
        const { ok, data } = await apiRequest('/api/sos/history');

        if (ok && data.events) {
            const container = document.getElementById('sosHistory');
            const emptyState = document.getElementById('emptySOS');
            const statEl = document.getElementById('statSOS');

            if (statEl) statEl.textContent = data.events.length;

            if (data.events.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            if (emptyState) emptyState.style.display = 'none';

            if (container) {
                container.innerHTML = data.events.slice(0, 10).map(event => `
                    <div class="sos-item">
                        <div class="sos-status ${event.status}"></div>
                        <div class="sos-details">
                            <div style="font-weight: 600; font-size: 0.9rem;">
                                ${event.status === 'resolved' ? '✅ Resolved' : '🚨 ' + (event.status || 'Triggered')}
                            </div>
                            <div class="sos-time">${formatDate(event.created_at)}</div>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">
                            ${event.contacts_notified || 0} notified
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load SOS history:', err);
    }
}
