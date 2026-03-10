/**
 * SafeWalk – Emergency Contacts Management
 * CRUD operations for contacts on the dashboard.
 */

// ── Load Contacts ───────────────────────────────────────
async function loadContacts() {
    if (!isAuthenticated()) return;

    try {
        const { ok, data } = await apiRequest('/api/contacts');

        if (ok && data.contacts) {
            const list = document.getElementById('contactList');
            const emptyState = document.getElementById('emptyContacts');
            const statEl = document.getElementById('statContacts');

            if (statEl) statEl.textContent = data.contacts.length;

            if (data.contacts.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            if (emptyState) emptyState.style.display = 'none';

            if (list) {
                list.innerHTML = data.contacts.map(contact => `
                    <li class="contact-item">
                        <div class="contact-info">
                            <div class="contact-avatar">${getInitials(contact.contact_name)}</div>
                            <div>
                                <div class="contact-name">${escapeHtml(contact.contact_name)}</div>
                                <div class="contact-phone">${escapeHtml(contact.phone_number)}${contact.relationship ? ' · ' + escapeHtml(contact.relationship) : ''}</div>
                            </div>
                        </div>
                        <div class="contact-actions">
                            <button class="btn btn-icon btn-secondary btn-sm" 
                                    onclick="deleteContact('${contact.contact_id}')" 
                                    title="Delete contact">🗑️</button>
                        </div>
                    </li>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load contacts:', err);
    }
}

// ── Add Contact ─────────────────────────────────────────
async function handleAddContact(e) {
    e.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const relationship = document.getElementById('contactRelation').value.trim();

    if (!name || !phone) {
        showToast('Name and phone number are required', 'error');
        return;
    }

    try {
        const { ok, data } = await apiRequest('/api/contacts', 'POST', {
            contact_name: name,
            phone_number: phone,
            email: email || null,
            relationship: relationship || null,
        });

        if (ok) {
            showToast('Contact added successfully!', 'success');
            closeContactModal();
            loadContacts();
        } else {
            showToast(data.error || 'Failed to add contact', 'error');
        }
    } catch (err) {
        showToast('Network error. Please try again.', 'error');
    }
}

// ── Delete Contact ──────────────────────────────────────
async function deleteContact(contactId) {
    if (!confirm('Remove this emergency contact?')) return;

    try {
        const { ok, data } = await apiRequest(`/api/contacts/${contactId}`, 'DELETE');

        if (ok) {
            showToast('Contact removed', 'success');
            loadContacts();
        } else {
            showToast(data.error || 'Failed to delete contact', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    }
}

// ── Modal Controls ──────────────────────────────────────
function openAddContactModal() {
    document.getElementById('contactForm').reset();
    document.getElementById('contactModalOverlay').classList.add('active');
}

function closeContactModal() {
    document.getElementById('contactModalOverlay').classList.remove('active');
}

// ── Utility: Escape HTML ────────────────────────────────
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
