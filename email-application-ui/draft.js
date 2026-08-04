document.addEventListener('DOMContentLoaded', () => {
    const fetchBtn = document.getElementById('fetchBtn');
    const searchDateInput = document.getElementById('searchDate');
    const slotFilter = document.getElementById('slotFilter');
    const cardsContainer = document.getElementById('cardsContainer');
    const swipeContainer = document.getElementById('swipeContainer');
    const statusMessage = document.getElementById('statusMessage');
    const statsRow = document.getElementById('statsRow');
    const recordCountSpan = document.getElementById('recordCount');
    const viewGridBtn = document.getElementById('viewGridBtn');
    const viewSwipeBtn = document.getElementById('viewSwipeBtn');

    let currentRecords = [];
    let currentViewMode = 'grid'; // 'grid' or 'swipe'
    let currentSwipeIndex = 0;

    const baseUrl = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:' 
        ? 'http://127.0.0.1:8000' 
        : 'https://email-creator-api-1.onrender.com';

    // Automatically fill today's date
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    searchDateInput.value = `${dd}-${mm}-${yy}`;

    // View Toggles
    viewGridBtn.addEventListener('click', () => {
        currentViewMode = 'grid';
        viewGridBtn.classList.add('active');
        viewSwipeBtn.classList.remove('active');
        cardsContainer.classList.remove('hidden');
        swipeContainer.classList.add('hidden');
        renderGrid();
    });

    viewSwipeBtn.addEventListener('click', () => {
        currentViewMode = 'swipe';
        viewSwipeBtn.classList.add('active');
        viewGridBtn.classList.remove('active');
        swipeContainer.classList.remove('hidden');
        cardsContainer.classList.add('hidden');
        renderSwipe();
    });

    // Keyboard navigation for Swipe View
    document.addEventListener('keydown', (e) => {
        if (currentViewMode === 'swipe' && currentRecords.length > 0) {
            if (e.key === 'ArrowRight') {
                window.nextSwipeCard();
            } else if (e.key === 'ArrowLeft') {
                window.prevSwipeCard();
            } else if (e.key === 'Enter') {
                // Try to draft first available email
                const record = currentRecords[currentSwipeIndex];
                let emails = parseEmails(record.emails);
                if (emails.length > 0) {
                    window.swipeDraft(emails[0]);
                }
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                window.swipeReject();
            }
        }
    });

    fetchBtn.addEventListener('click', async () => {
        const targetDate = searchDateInput.value.trim();
        
        if (!targetDate) {
            showError('Please enter a valid date (DD-MM-YY)');
            return;
        }

        hideError();
        statsRow.classList.add('hidden');
        cardsContainer.innerHTML = `<div style="text-align: center; padding: 40px 0;"><div class="loader" style="display: inline-block; border-top-color: #3b82f6;"></div></div>`;
        swipeContainer.innerHTML = '';
        
        fetchBtn.classList.add('loading');
        fetchBtn.disabled = true;

        try {
            const response = await fetch(`${baseUrl}/fetch_scraped_posts?date=${encodeURIComponent(targetDate)}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            const result = await response.json();

            if (response.ok) {
                let records = result.data || [];
                const selectedSlot = slotFilter.value;
                if (selectedSlot !== 'All') {
                    records = records.filter(r => r.slot === selectedSlot);
                }

                // Filter out generic email domains and location keywords
                const blockedDomains = ['@gmail.com', '@programming.com', '@hotmail.com', '@outlook.com', '@protonmail.com'];
                const blockedKeywords = [/lahore/i, /pakistan/i, /riyadh/i, /rawalpindi/i, /indore/i, /gujrat/i];

                records = records.filter(record => {
                    // Check text for blocked keywords
                    if (record.text && blockedKeywords.some(regex => regex.test(record.text))) {
                        return false;
                    }

                    let emails = parseEmails(record.emails);
                    if (emails.length === 0) return true;
                    // Keep record only if it doesn't contain a blocked email
                    const hasBlockedEmail = emails.some(email => {
                        const lowerEmail = email.toLowerCase();
                        return blockedDomains.some(domain => lowerEmail.endsWith(domain));
                    });
                    return !hasBlockedEmail;
                });

                // Clean trailing hashtags from text
                records.forEach(record => {
                    if (record.text) {
                        // Removes blocks of hashtags at the end of the text
                        record.text = record.text.replace(/(?:\s*#[a-zA-Z0-9_]+)+\s*$/g, '').trim();
                        // Also remove any remaining hashtags globally just in case it's heavily spammed (optional, but requested to clean "before showing or any other hastags at bottom")
                        // The user specifically asked to clean "any other hastags at bottom", so the regex above handles trailing ones perfectly.
                    }
                });
                
                currentRecords = records;
                currentSwipeIndex = 0;

                recordCountSpan.textContent = currentRecords.length;
                statsRow.classList.remove('hidden');

                if (currentViewMode === 'grid') {
                    renderGrid();
                } else {
                    renderSwipe();
                }
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

    function parseEmails(emailsData) {
        if (Array.isArray(emailsData)) return emailsData;
        if (typeof emailsData === 'string') {
            try { return JSON.parse(emailsData); } catch(e) { return [emailsData]; }
        }
        return [];
    }

    function renderGrid() {
        cardsContainer.innerHTML = ''; 

        if (currentRecords.length === 0) {
            cardsContainer.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">No scraped posts found for this date.</div>`;
            return;
        }

        currentRecords.forEach(record => {
            const card = document.createElement('div');
            card.className = 'job-card';
            
            let previewText = record.text || '';
            let emails = parseEmails(record.emails);

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
    }

    function renderSwipe() {
        swipeContainer.innerHTML = '';

        if (currentRecords.length === 0) {
            swipeContainer.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">No scraped posts found for this date.</div>`;
            return;
        }

        if (currentSwipeIndex >= currentRecords.length || currentSwipeIndex < 0) {
            swipeContainer.innerHTML = `<div style="text-align: center; color: var(--success); padding: 40px 0; font-size: 18px;">You've reached the end of the list! 🎉</div>
            <button class="toggle-btn active" style="margin-top: 20px;" onclick="window.resetSwipe()">Start Over</button>`;
            return;
        }

        const record = currentRecords[currentSwipeIndex];
        let previewText = record.text || '';
        let emails = parseEmails(record.emails);

        let draftButtonHtml = `<button class="control-btn btn-large btn-draft" title="No Email" disabled style="opacity: 0.5;">✅</button>`;
        if (emails.length > 0) {
            draftButtonHtml = `<button class="control-btn btn-large btn-draft" title="Draft" onclick="window.swipeDraft('${emails[0]}')" id="swipeDraftBtn">✅</button>`;
        }

        const swipeCard = document.createElement('div');
        swipeCard.className = 'swipe-card';
        swipeCard.innerHTML = `
            <div class="card-header">
                <span class="author" style="font-size: 18px;">👤 ${record.author || 'Unknown'}</span>
                <a href="${record.url}" target="_blank" style="color: var(--accent); font-size: 13px; text-decoration: none;">View Post ↗</a>
            </div>
            <div class="swipe-card-body">
                <p>${previewText}</p>
            </div>
            ${emails.length > 0 ? `<div style="margin-bottom: 20px; font-size: 13px; color: var(--accent); text-align: center;">Target: ${emails[0]}</div>` : ''}
            <div class="swipe-controls">
                <button class="control-btn btn-small" title="Previous" onclick="window.prevSwipeCard()">⏪</button>
                <button class="control-btn btn-large btn-reject" title="Reject" onclick="window.swipeReject()">❌</button>
                ${draftButtonHtml}
                <button class="control-btn btn-small" title="Next" onclick="window.nextSwipeCard()">⏩</button>
            </div>
            <div class="swipe-progress">
                Post ${currentSwipeIndex + 1} of ${currentRecords.length}
            </div>
        `;

        swipeContainer.appendChild(swipeCard);
    }

    function showEmptyState(msg = 'Enter a date and click fetch to see scraped posts.') {
        cardsContainer.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">${msg}</div>`;
        swipeContainer.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">${msg}</div>`;
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

    // Grid Draft Button
    window.triggerDraft = async function(btn, email) {
        btn.classList.add('loading');
        btn.disabled = true;
        try {
            const response = await fetch(`${baseUrl}/draft_email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            if (response.ok) {
                btn.innerHTML = '<span>✅ Drafted</span>';
                btn.style.backgroundColor = 'var(--success)';
                btn.style.color = '#fff';
            } else {
                btn.innerHTML = '<span>❌ Failed</span>';
                btn.style.backgroundColor = 'var(--error)';
                btn.style.color = '#fff';
                setTimeout(() => { btn.innerHTML = '<span class="btn-text">Draft</span>'; btn.style.backgroundColor = ''; btn.style.color = ''; }, 3000);
            }
        } catch (error) {
            btn.innerHTML = '<span>❌ Error</span>';
            btn.style.backgroundColor = 'var(--error)';
            btn.style.color = '#fff';
            setTimeout(() => { btn.innerHTML = '<span class="btn-text">Draft</span>'; btn.style.backgroundColor = ''; btn.style.color = ''; }, 3000);
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    };

    // Swipe View Actions
    window.nextSwipeCard = function() {
        if (currentSwipeIndex < currentRecords.length) {
            currentSwipeIndex++;
            renderSwipe();
        }
    };

    window.prevSwipeCard = function() {
        if (currentSwipeIndex > 0) {
            currentSwipeIndex--;
            renderSwipe();
        }
    };

    window.swipeReject = function() {
        // Purely UI action to skip to next
        const card = document.querySelector('.swipe-card');
        if (card) {
            card.style.transform = 'translateX(-100%) rotate(-10deg)';
            card.style.opacity = '0';
            setTimeout(window.nextSwipeCard, 300);
        } else {
            window.nextSwipeCard();
        }
    };

    window.swipeDraft = async function(email) {
        const btn = document.getElementById('swipeDraftBtn');
        if (btn) {
            btn.innerHTML = '⏳';
            btn.disabled = true;
        }
        
        try {
            const response = await fetch(`${baseUrl}/draft_email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            if (response.ok) {
                const card = document.querySelector('.swipe-card');
                if (card) {
                    card.style.transform = 'translateX(100%) rotate(10deg)';
                    card.style.opacity = '0';
                    setTimeout(window.nextSwipeCard, 300);
                } else {
                    window.nextSwipeCard();
                }
            } else {
                if (btn) { btn.innerHTML = '❌'; btn.disabled = false; }
                alert("Failed to draft email.");
            }
        } catch (error) {
            if (btn) { btn.innerHTML = '❌'; btn.disabled = false; }
            alert("Network error drafting email.");
        }
    };

    window.resetSwipe = function() {
        currentSwipeIndex = 0;
        renderSwipe();
    };
});
