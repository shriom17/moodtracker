const API_URL = 'https://moodtracker-1-3dmf.onrender.com';

// Google Sign-In callback function
function handleCredentialResponse(response) {
    // Decode JWT token to get user info
    const userObject = parseJwt(response.credential);
    
    const userData = {
        name: userObject.name,
        email: userObject.email,
        picture: userObject.picture,
        googleId: userObject.sub
    };
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    showAppContent(userData);
    loadMoodHistory();
}

// Parse JWT token
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Load and display mood history when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    
    // Initialize Google Sign-In
    if (window.GOOGLE_CLIENT_ID && window.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID') {
        window.onload = function() {
            google.accounts.id.initialize({
                client_id: window.GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse
            });
            google.accounts.id.renderButton(
                document.getElementById('g_id_signin'),
                { 
                    theme: 'outline', 
                    size: 'large',
                    type: 'standard',
                    text: 'sign_in_with',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                }
            );
        };
    }
    
    // Handle form submission
    const form = document.getElementById('mood-form');
    if (form) {
        form.addEventListener('submit', handleMoodSubmit);
    }
});

// Check if user is logged in
function checkAuthStatus() {
    const user = localStorage.getItem('user');
    
    if (user) {
        const userData = JSON.parse(user);
        showAppContent(userData);
        loadMoodHistory();
    } else {
        showLoginSection();
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('user');
    
    // Sign out from Google
    google.accounts.id.disableAutoSelect();
    
    showLoginSection();
    
    // Re-initialize Google Sign-In
    setTimeout(() => {
        google.accounts.id.initialize({
            client_id: window.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
            callback: handleCredentialResponse
        });
        google.accounts.id.renderButton(
            document.querySelector('.g_id_signin'),
            { theme: 'outline', size: 'large' }
        );
    }, 100);
}

// Show login section
function showLoginSection() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('app-content').classList.remove('active');
    document.getElementById('user-section').classList.remove('active');
}

// Show app content after login
function showAppContent(userData) {
    // Hide login section
    document.getElementById('login-section').classList.add('hidden');
    
    // Show app content
    document.getElementById('app-content').classList.add('active');
    
    // Update user section
    const userSection = document.getElementById('user-section');
    userSection.classList.add('active');
    userSection.innerHTML = `
        <div class="user-info">
            <img src="${userData.picture}" alt="Profile" class="user-profile-pic">
            <span class="user-name">${userData.name}</span>
        </div>
        <button class="btn btn-logout" id="logout-btn">Logout</button>
    `;
    
    // Re-attach logout button listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Fetch and display mood history
async function loadMoodHistory() {
    try {
        const response = await fetch(`${API_URL}/get_moods`);
        const allMoods = await response.json();
        
        // Get current user's name
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userName = user.name || '';
        
        // Filter moods for current user only
        const userMoods = allMoods.filter(mood => mood.name === userName);
        
        displayMoodHistory(userMoods);
    } catch (error) {
        console.error('Error loading mood history:', error);
        showError('Failed to load mood history');
    }
}

// Display moods in the history section
function displayMoodHistory(moods) {
    const historyDiv = document.getElementById('mood-history');
    
    if (moods.length === 0) {
        historyDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>No mood history yet!</p>
                <p>You're a first-time user. Submit your first mood to get started!</p>
            </div>
        `;
        return;
    }
    
    // Sort by timestamp (newest first)
    const sortedMoods = moods.reverse();
    
    historyDiv.innerHTML = `
        <h3>Mood History</h3>
        <div id="mood-list">
            ${sortedMoods.map(mood => createMoodCard(mood)).join('')}
        </div>
    `;
}

// Create a mood card HTML
function createMoodCard(mood) {
    const icon = getMoodIcon(mood.mood);
    const formattedTime = formatTimestamp(mood.timestamp);
    
    return `
        <div class="mood-item">
            <div class="mood-item-content">
                <div class="mood-item-icon">${icon}</div>
                <div class="mood-item-details">
                    <div class="mood-item-mood">${mood.mood}</div>
                    <div class="mood-item-name">${mood.name}</div>
                    <div class="mood-item-timestamp">${formattedTime}</div>
                </div>
            </div>
        </div>
    `;
}

// Get emoji icon based on mood
function getMoodIcon(mood) {
    const moodLower = mood.toLowerCase();
    
    if (moodLower.includes('happy') || moodLower.includes('good') || moodLower.includes('great') || moodLower.includes('excellent')) {
        return '😊';
    } else if (moodLower.includes('sad') || moodLower.includes('down') || moodLower.includes('depressed')) {
        return '😢';
    } else if (moodLower.includes('angry') || moodLower.includes('mad') || moodLower.includes('frustrated')) {
        return '😠';
    } else if (moodLower.includes('excited') || moodLower.includes('amazing')) {
        return '🤩';
    } else if (moodLower.includes('anxious') || moodLower.includes('nervous') || moodLower.includes('worried')) {
        return '😰';
    } else if (moodLower.includes('calm') || moodLower.includes('peaceful') || moodLower.includes('relaxed')) {
        return '😌';
    } else if (moodLower.includes('tired') || moodLower.includes('sleepy')) {
        return '😴';
    } else {
        return '😐';
    }
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // If less than 1 minute ago
        if (diff < 60000) {
            return 'Just now';
        }
        // If less than 1 hour ago
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        // If less than 24 hours ago
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        // Otherwise show date and time
        return date.toLocaleString();
    } catch (error) {
        return timestamp;
    }
}

// Handle mood form submission
async function handleMoodSubmit(event) {
    event.preventDefault();
    
    const moodInput = document.getElementById('mood-input');
    const mood = moodInput.value.trim();
    
    if (!mood) {
        showError('Please enter your mood');
        return;
    }
    
    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.name || 'User';
    
    try {
        const response = await fetch(`${API_URL}/submit_mood`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: userName,
                mood: mood,
                timestamp: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            moodInput.value = '';
            showSuccess('Mood submitted successfully!');
            loadMoodHistory(); // Reload history
        } else {
            showError('Failed to submit mood');
        }
    } catch (error) {
        console.error('Error submitting mood:', error);
        showError('Failed to submit mood');
    }
}

// Show success message
function showSuccess(message) {
    showMessage(message, 'success');
}

// Show error message
function showError(message) {
    showMessage(message, 'error');
}

// Show message (success or error)
function showMessage(message, type) {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const form = document.getElementById('mood-form');
    form.parentElement.insertBefore(messageDiv, form);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}
