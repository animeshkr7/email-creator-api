document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recordForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');

    // Automatically fill today's date in DD-MM-YY format for convenience
    const dateInput = document.getElementById('date');
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    dateInput.value = `${dd}-${mm}-${yy}`;

    const typeSelect = document.getElementById('type');
    const customTypeGroup = document.getElementById('customTypeGroup');
    const customTypeInput = document.getElementById('customType');

    // Toggle custom type input based on dropdown selection
    typeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Custom') {
            customTypeGroup.classList.remove('hidden');
            customTypeInput.required = true;
            customTypeInput.focus();
        } else {
            customTypeGroup.classList.add('hidden');
            customTypeInput.required = false;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide previous status
        hideStatus();

        // Get values
        const email = document.getElementById('email').value.trim();
        let type = typeSelect.value;
        if (type === 'Custom') {
            type = customTypeInput.value.trim();
        }
        const date = document.getElementById('date').value.trim();
        const apiUrl = 'https://email-creator-api.onrender.com/store_record';

        // Basic validation
        if (!email || !type || !date) {
            showStatus('Please fill out all fields.', 'error');
            return;
        }



        // Set loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const payload = { email, type, date };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                showStatus('Success! Application record safely stored in Supabase.', 'success');
                // Reset form slightly
                document.getElementById('email').value = '';
                // Keep type and date for fast multi-entry
            } else {
                showStatus(`Error: ${result.detail || result.message || 'Failed to store record'}`, 'error');
            }
        } catch (error) {
            showStatus(`Network Error: Make sure your Render API is live. (${error.message})`, 'error');
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message status-${type}`;
        
        // Trigger reflow for animation
        void statusMessage.offsetWidth;
        statusMessage.classList.add('show');
    }

    function hideStatus() {
        statusMessage.classList.remove('show');
        statusMessage.className = 'status-message hidden';
    }
});
