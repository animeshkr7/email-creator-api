with open('styles.css', 'a', encoding='utf-8') as f:
    f.write('''
/* View Toggle Styles */
.view-toggle {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 15px;
}

.toggle-btn {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid var(--card-border);
    color: var(--text-secondary);
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.toggle-btn:hover {
    background: rgba(255, 255, 255, 0.05);
}

.toggle-btn.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
}

/* Swipe View Styles */
.swipe-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
    min-height: 400px;
}

.swipe-card {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    padding: 30px;
    width: 100%;
    max-width: 600px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    position: relative;
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.swipe-card-body p {
    font-size: 15px;
    color: var(--text-primary);
    line-height: 1.6;
    margin-bottom: 25px;
    white-space: pre-wrap;
    max-height: 40vh;
    overflow-y: auto;
    padding-right: 10px;
}

.swipe-card-body p::-webkit-scrollbar {
    width: 6px;
}
.swipe-card-body p::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1); 
    border-radius: 10px;
}
.swipe-card-body p::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2); 
    border-radius: 10px;
}

/* Tinder-like controls */
.swipe-controls {
    display: flex;
    justify-content: center;
    gap: 20px;
    align-items: center;
    width: 100%;
    max-width: 600px;
    margin-top: 20px;
    padding: 0 20px;
}

.control-btn {
    border: none;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.control-btn:hover {
    transform: scale(1.1);
}

.control-btn:active {
    transform: scale(0.95);
}

.btn-small {
    width: 45px;
    height: 45px;
    background: rgba(255, 255, 255, 0.1);
    font-size: 18px;
    color: var(--text-primary);
}

.btn-large {
    width: 60px;
    height: 60px;
    font-size: 24px;
}

.btn-reject {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-draft {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
}

.swipe-progress {
    text-align: center;
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 15px;
}
''')
print('Styles appended.')
