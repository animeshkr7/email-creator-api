document.addEventListener('DOMContentLoaded', () => {
    const fetchBtn = document.getElementById('fetchBtn');
    const searchDateInput = document.getElementById('searchDate');
    const slotFilter = document.getElementById('slotFilter');
    const cardsContainer = document.getElementById('cardsContainer');
    const statusMessage = document.getElementById('statusMessage');
    const statsRow = document.getElementById('statsRow');
    const recordCountSpan = document.getElementById('recordCount');

    const baseUrl = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:' 
        ? 'http://127.0.0.1:8000' 
        : 'https://email-creator-api-1.onrender.com';

    // Automatically fill today's date
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    searchDateInput.value = `${dd}-${mm}-${yy}`;

    fetchBtn.addEventListener('click', async () => {
        const targetDate = searchDateInput.value.trim();
        
        if (!targetDate) {
            showError('Please enter a valid date (DD-MM-YY)');
            return;
        }

        // Reset UI
        hideError();
        statsRow.classList.add('hidden');
        cardsContainer.innerHTML = `<div style="text-align: center; padding: 40px 0;"><div class="loader" style="display: inline-block; border-top-color: #3b82f6;"></div></div>`;
        
        fetchBtn.classList.add('loading');
        fetchBtn.disabled = true;

        try {
            const response = await fetch(`${baseUrl}/fetch_scraped_posts?date=${encodeURIComponent(targetDate)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                let records = result.data || [];
                const selectedSlot = slotFilter.value;
                
                if (selectedSlot !== 'All') {
                    records = records.filter(r => r.slot === selectedSlot);
                }
                
                renderCards(records);
            } else {
                showError(`Error: ${result.detail || result.message || 'Failed to fetch'}`);
                showEmptyState();
            }
        } catch (error) {
            showError(`Network Error: Ensure the API is awake and running. (${error.message})`);
            showEmptyState();
        } finally {
            fetchBtn.classList.remove('loading');
            fetchBtn.disabled = false;
        }
    });

    function renderCards(records) {
        cardsContainer.innerHTML = ''; // Clear previous

        if (records.length === 0) {
            showEmptyState('No scraped posts found for this date.');
            return;
        }

        records.forEach(record => {
            const card = document.createElement('div');
            card.className = 'job-card';
            
            // Use full text
            let previewText = record.text || '';

            // Emails might be stored as an array or string
            let emails = [];
            if (Array.isArray(record.emails)) {
                emails = record.emails;
            } else if (typeof record.emails === 'string') {
                try {
                    emails = JSON.parse(record.emails);
                } catch(e) {
                    emails = [record.emails];
                }
            }

            // Build emails HTML
            let emailsHtml = '';
            emails.forEach(email => {
                emailsHtml += `
                    <div class="email-badge">
                        <span>✉️ ${email}</span>
                        <button class="draft-btn" onclick="triggerDraft(this, '${email}')">
                            <span class="btn-text">Draft</span>
                            <div class="loader" style="width: 12px; height: 12px; border-width: 2px;"></div>
                        </button>
                    </div>
                `;
            });

            if (emails.length === 0) {
                emailsHtml = `<span style="font-size: 12px; color: var(--text-secondary);">No emails extracted</span>`;
            }

            card.innerHTML = `
                <div class="card-header">
                    <span class="author">👤 ${record.author || 'Unknown'}</span>
                    <a href="${record.url}" target="_blank" style="color: var(--accent); font-size: 12px; text-decoration: none;">View Post ↗</a>
                </div>
                <div class="card-body">
                    <p>${previewText}</p>
                </div>
                <div class="card-actions">
                    ${emailsHtml}
                </div>
            `;
            
            cardsContainer.appendChild(card);
        });

        // Show stats
        recordCountSpan.textContent = records.length;
        statsRow.classList.remove('hidden');
    }

    function showEmptyState(msg = 'Enter a date and click fetch to see scraped posts.') {
        cardsContainer.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">${msg}</div>`;
        statsRow.classList.add('hidden');
    }

    function showError(message) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message status-error show';
    }

    function hideError() {
        statusMessage.classList.remove('show');
        statusMessage.className = 'status-message hidden';
    }

    // Attach to window so onclick attribute can see it
    window.triggerDraft = async function(btn, email) {
        btn.classList.add('loading');
        btn.disabled = true;

        try {
            const response = await fetch(`${baseUrl}/draft_email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            const result = await response.json();

            if (response.ok) {
                btn.innerHTML = '<span>✅ Drafted</span>';
                btn.style.backgroundColor = 'var(--success)';
                btn.style.color = '#fff';
            } else {
                btn.innerHTML = '<span>❌ Failed</span>';
                btn.style.backgroundColor = 'var(--error)';
                btn.style.color = '#fff';
                console.error(`Error: ${result.detail || result.message || 'Failed to create draft'}`);
                setTimeout(() => {
                    btn.innerHTML = '<span class="btn-text">Draft</span>';
                    btn.style.backgroundColor = '';
                    btn.style.color = '';
                }, 3000);
            }
        } catch (error) {
            btn.innerHTML = '<span>❌ Error</span>';
            btn.style.backgroundColor = 'var(--error)';
            btn.style.color = '#fff';
            console.error(`Network Error: Make sure your backend API is live. (${error.message})`);
            setTimeout(() => {
                btn.innerHTML = '<span class="btn-text">Draft</span>';
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }, 3000);
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    };
});
