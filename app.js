// UST-Legazpi Mental Health Support Application
// Main application logic and state management

// ============================================================================
// API CONFIGURATION
// ============================================================================

const API_BASE_URL = 'http://localhost:3000/api';

// API helper functions
const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Include cookies for session-based auth
        };
        
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Session expired or invalid
                localStorage.removeItem('currentUser');
                logout();
                throw new Error('Session expired. Please login again.');
            }
            throw new Error(`API Error: ${response.status}`);
        }
        
        return response.json();
    },
    
    async get(endpoint) {
        return this.request(endpoint);
    },
    
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
};

// ============================================================================
// APPLICATION STATE MANAGEMENT
// ============================================================================

// Current user state (in-memory storage)
let currentUser = {
    email: null,
    type: null, // 'student' or 'admin'
    isAuthenticated: false
};

// Application data
let appData = {
    // User statistics
    userStats: {
        counselingSessions: 0,
        resourcesBookmarked: 0,
        moodLogs: 0
    },
    
    // Bookmarked resources
    bookmarkedResources: [],
    
    // Mood history
    moodHistory: [],
    
    // Current chat session
    currentChatSession: null,
    
    // Selected counseling category
    selectedCategory: null
};

// Mental health resources data
const mentalHealthResources = [
    {
        name: "UST-Legazpi Office of Guidance and Testing",
        type: "University Counseling",
        address: "Aquinas University Campus, Rawis, Legazpi City",
        phone: "(052) 482-0203 local 312",
        email: "ogt@ust-legazpi.edu.ph",
        specialties: ["Student Counseling", "Academic Support", "Career Guidance"],
        cost: "Free for students",
        hours: "Monday-Friday 7:30am-5:30pm",
        rating: 4.5
    },
    {
        name: "Dr. Tan Mental Health Clinic",
        type: "Private Practice",
        address: "Estevez Street, Legazpi City",
        phone: "Contact via UST Hospital",
        specialties: ["General Psychiatry", "Depression", "Anxiety"],
        cost: "₱1,500 per session",
        hours: "By appointment",
        rating: 4.2
    },
    {
        name: "Clinica Legazpi - Dr. Cabacang",
        type: "Mental Health Clinic",
        address: "Legazpi City",
        specialties: ["Clinical Psychology", "Therapy", "Mental Health Assessment"],
        cost: "Varies",
        hours: "By appointment",
        rating: 4.0
    },
    {
        name: "UST-Legazpi Hospital Psychiatry Department",
        type: "Hospital Service",
        address: "UST-Legazpi Hospital, Legazpi City",
        phone: "(052) 482-0234",
        specialties: ["Psychiatry", "Crisis Intervention", "Inpatient Care"],
        cost: "According to PhilHealth rates",
        hours: "24/7 emergency, scheduled appointments",
        rating: 4.3
    },
    {
        name: "Legazpi City Mental Health Unit",
        type: "Government Service",
        address: "Legazpi City Health Office, Legazpi City",
        phone: "(052) 480-2234",
        specialties: ["Community Mental Health", "Basic Counseling", "Referrals"],
        cost: "Free",
        hours: "Monday-Friday 8:00am-5:00pm",
        rating: 3.8
    }
];

// Crisis contacts data
const crisisContacts = [
    {
        name: "National Crisis Hotline",
        number: "1553",
        description: "24/7 crisis intervention and suicide prevention"
    },
    {
        name: "UST-Legazpi Security",
        number: "(052) 482-0203",
        description: "Campus emergency response"
    },
    {
        name: "Legazpi City Emergency",
        number: "911",
        description: "Local emergency services"
    },
    {
        name: "DOH Mental Health Hotline",
        number: "1553",
        description: "Department of Health crisis support"
    }
];

// Educational resources data
const educationalResources = [
    {
        title: "Understanding Mental Health",
        type: "Article",
        content: "Basic information about mental health, common conditions, and when to seek help. Learn about the importance of mental wellness and how to recognize signs of common mental health issues."
    },
    {
        title: "Stress Management Techniques",
        type: "Guide",
        content: "Practical strategies for managing academic and personal stress. Includes breathing exercises, time management tips, and healthy coping mechanisms."
    },
    {
        title: "Building Resilience",
        type: "Interactive Module",
        content: "Self-paced learning on developing emotional resilience and coping skills. Explore techniques for bouncing back from challenges and building mental strength."
    },
    {
        title: "Sleep and Mental Health",
        type: "Video Series",
        content: "Educational videos on the connection between sleep and psychological well-being. Learn about healthy sleep habits and their impact on mental health."
    },
    {
        title: "Managing Anxiety in College",
        type: "Workbook",
        content: "Comprehensive guide specifically designed for college students dealing with anxiety. Includes practical exercises and coping strategies."
    },
    {
        title: "Building Healthy Relationships",
        type: "Workshop",
        content: "Learn about communication skills, boundary setting, and maintaining healthy relationships with peers, family, and romantic partners."
    }
];

// Peer counseling categories
const counselingCategories = [
    {
        category: "Academic Stress",
        description: "Support for study pressures, exam anxiety, academic performance concerns"
    },
    {
        category: "Social Anxiety",
        description: "Help with social interactions, making friends, public speaking fears"
    },
    {
        category: "Depression & Mood",
        description: "Support for feelings of sadness, hopelessness, mood fluctuations"
    },
    {
        category: "Relationship Issues",
        description: "Family conflicts, romantic relationships, friendship problems"
    },
    {
        category: "Identity & Self-Esteem",
        description: "Self-worth concerns, identity exploration, confidence building"
    },
    {
        category: "Life Transitions",
        description: "Adjusting to college, career decisions, major life changes"
    }
];

// Sample chat responses for simulation
const counselorResponses = [
    "I understand how you're feeling. That sounds really challenging.",
    "Can you tell me more about what's been on your mind?",
    "It's completely normal to feel that way. You're not alone.",
    "What do you think might help you feel better about this situation?",
    "Have you considered talking to someone close to you about this?",
    "Let's explore some strategies that might help you cope with these feelings.",
    "Thank you for sharing that with me. It takes courage to open up.",
    "How has this been affecting your daily life?",
    "What are some things that usually help you feel better?",
    "Would you like to talk about some coping strategies?"
];

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('email-error');
    const submitButton = event.target.querySelector('button[type="submit"]');
    
    // Clear previous errors
    errorElement.textContent = '';
    
    // Show loading state
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Signing in...';
    submitButton.disabled = true;
    
    try {
        // Validate email domain
        if (!email.endsWith('@ust-legazpi.edu.ph')) {
            errorElement.textContent = 'Only @ust-legazpi.edu.ph email addresses are allowed.';
            return;
        }
        
        // Make API call to login
        const response = await api.post('/login', {
            email: email,
            password: password
        });
        
        if (response.success) {
            // Store user data in session (handled by server-side session)
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            // Update current user state
            currentUser = {
                ...response.user,
                type: 'student',
                isAuthenticated: true
            };
            
            // Redirect to student dashboard
            showStudentDashboard();
        } else {
            errorElement.textContent = response.error || 'Login failed.';
        }
        
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = error.message || 'Login failed. Please try again.';
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

/**
 * Show student dashboard
 */
async function showStudentDashboard() {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('student-dashboard').classList.add('active');
    await updateUserStats();
    populateResources();
    populateEducationalContent();
}

/**
 * Show admin dashboard
 */
function showAdminDashboard() {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('admin-dashboard').classList.add('active');
    updateAdminStats();
    populateAdminResources();
}

/**
 * Logout user
 */
async function logout() {
    try {
        // Call logout API to clear server-side session
        await api.post('/logout');
    } catch (error) {
        // Ignore logout API errors
        console.warn('Logout API call failed:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('currentUser');
    
    // Reset current user state
    currentUser = {
        email: null,
        type: null,
        isAuthenticated: false
    };
    
    // Reset all views
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.student-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.admin-view').forEach(view => view.classList.remove('active'));
    
    // Show login page
    document.getElementById('login-page').classList.add('active');
    
    // Clear form
    document.getElementById('login-form').reset();
    document.getElementById('email-error').textContent = '';
}

/**
 * Check if user is authenticated and restore session
 */
async function checkAuthentication() {
    try {
        // Check authentication status with server
        const response = await api.get('/auth/status');
        
        if (response.authenticated) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                currentUser = {
                    ...JSON.parse(storedUser),
                    isAuthenticated: true
                };
                
                // Redirect based on user role
                if (response.userRole === 'admin') {
                    showAdminDashboard();
                } else {
                    showStudentDashboard();
                }
                return true;
            }
        }
    } catch (error) {
        console.warn('Authentication check failed:', error);
    }
    
    // Not authenticated, show login page
    document.getElementById('login-page').classList.add('active');
    return false;
}

/**
 * Handle sign-up form submission
 */
async function handleSignUp(event) {
    event.preventDefault();
    
    // Get form elements
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Get form data
    const studentId = document.getElementById('signup-student-id').value;
    const firstName = document.getElementById('signup-first-name').value;
    const lastName = document.getElementById('signup-last-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const yearLevel = document.getElementById('signup-year-level').value;
    const course = document.getElementById('signup-course').value;
    const agreement = document.getElementById('signup-agreement').checked;
    
    // Clear previous errors
    clearSignUpErrors();
    
    // Show loading state
    submitButton.textContent = 'Creating Account...';
    submitButton.disabled = true;
    
    try {
        // Validate form data
        const validationErrors = validateSignUpForm({
            studentId, firstName, lastName, email, password, confirmPassword, yearLevel, course, agreement
        });
        
        if (validationErrors.length > 0) {
            displaySignUpErrors(validationErrors);
            return;
        }
        
        // Make API call to register user
        const response = await api.post('/register', {
            student_id: studentId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password,
            year_level: yearLevel,
            course: course
        });
        
        if (response.success) {
            // Show success message
            showSignUpSuccess();
            
            // Switch to login form after a delay
            setTimeout(() => {
                showLoginForm();
                // Pre-fill email field
                document.getElementById('email').value = email;
            }, 2000);
            
        } else {
            displaySignUpErrors([response.error || 'Registration failed. Please try again.']);
        }
        
    } catch (error) {
        console.error('Sign-up error:', error);
        displaySignUpErrors([error.message || 'Registration failed. Please try again.']);
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

/**
 * Validate sign-up form data
 */
function validateSignUpForm(data) {
    const errors = [];
    
    // Student ID validation
    if (!data.studentId.trim()) {
        errors.push({ field: 'student-id', message: 'Student ID is required.' });
    } else if (!/^\d{7}$/.test(data.studentId.trim())) {
        errors.push({ field: 'student-id', message: 'Student ID must be 7 digits (e.g., 0000000).' });
    }
    
    // Name validation
    if (!data.firstName.trim()) {
        errors.push({ field: 'first-name', message: 'First name is required.' });
    } else if (data.firstName.trim().length < 2) {
        errors.push({ field: 'first-name', message: 'First name must be at least 2 characters.' });
    }
    
    if (!data.lastName.trim()) {
        errors.push({ field: 'last-name', message: 'Last name is required.' });
    } else if (data.lastName.trim().length < 2) {
        errors.push({ field: 'last-name', message: 'Last name must be at least 2 characters.' });
    }
    
    // Email validation
    if (!data.email.trim()) {
        errors.push({ field: 'signup-email', message: 'Email is required.' });
    } else if (!data.email.endsWith('@ust-legazpi.edu.ph')) {
        errors.push({ field: 'signup-email', message: 'Only @ust-legazpi.edu.ph email addresses are allowed.' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push({ field: 'signup-email', message: 'Please enter a valid email address.' });
    }
    
    // Password validation
    if (!data.password) {
        errors.push({ field: 'signup-password', message: 'Password is required.' });
    } else if (data.password.length < 8) {
        errors.push({ field: 'signup-password', message: 'Password must be at least 8 characters long.' });
    }
    
    // Confirm password validation
    if (!data.confirmPassword) {
        errors.push({ field: 'confirm-password', message: 'Please confirm your password.' });
    } else if (data.password !== data.confirmPassword) {
        errors.push({ field: 'confirm-password', message: 'Passwords do not match.' });
    }
    
    // Year level validation
    if (!data.yearLevel) {
        errors.push({ field: 'year-level', message: 'Please select your year level.' });
    }
    
    // Course validation
    if (!data.course.trim()) {
        errors.push({ field: 'course', message: 'Course/Program is required.' });
    }
    
    // Agreement validation
    if (!data.agreement) {
        errors.push({ field: 'agreement', message: 'You must agree to the Terms of Service and Privacy Policy.' });
    }
    
    return errors;
}

/**
 * Display sign-up form errors
 */
function displaySignUpErrors(errors) {
    errors.forEach(error => {
        const errorElement = document.getElementById(`${error.field}-error`);
        if (errorElement) {
            errorElement.textContent = error.message;
        }
    });
}

/**
 * Clear all sign-up form errors
 */
function clearSignUpErrors() {
    const errorFields = ['student-id', 'first-name', 'last-name', 'signup-email', 'signup-password', 'confirm-password', 'year-level', 'course', 'agreement'];
    errorFields.forEach(field => {
        const errorElement = document.getElementById(`${field}-error`);
        if (errorElement) {
            errorElement.textContent = '';
        }
    });
}

/**
 * Show sign-up success message
 */
function showSignUpSuccess() {
    const signupForm = document.getElementById('signup-form');
    signupForm.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
            <h3 style="color: #27ae60; margin-bottom: 15px;">Account Created Successfully!</h3>
            <p style="color: #666; margin-bottom: 20px;">Welcome to UST-Legazpi Mental Health Support Portal.</p>
            <p style="color: #666; font-size: 14px;">Redirecting to login page...</p>
        </div>
    `;
}

/**
 * Show sign-up form
 */
function showSignUpForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    clearSignUpErrors();
}

/**
 * Show login form
 */
function showLoginForm() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    clearSignUpErrors();
}

// ============================================================================
// STUDENT DASHBOARD FUNCTIONS
// ============================================================================

/**
 * Show specific student view
 */
function showStudentView(viewName) {
    // Hide all student views
    document.querySelectorAll('.student-view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(`student-${viewName}-content`).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
}

/**
 * Update user statistics display
 */
async function updateUserStats() {
    try {
        // Fetch dashboard data from API
        const response = await api.get('/user/dashboard');
        
        if (response) {
            document.getElementById('counseling-sessions').textContent = response.counseling_sessions;
            document.getElementById('resources-bookmarked').textContent = response.resources_bookmarked;
            document.getElementById('mood-logs').textContent = response.mood_logs;
            
            // Update local app data
            appData.userStats.counselingSessions = response.counseling_sessions;
            appData.userStats.resourcesBookmarked = response.resources_bookmarked;
            appData.userStats.moodLogs = response.mood_logs;
        }
    } catch (error) {
        console.error('Error fetching user stats:', error);
        // Fallback to local data
        document.getElementById('counseling-sessions').textContent = appData.userStats.counselingSessions;
        document.getElementById('resources-bookmarked').textContent = appData.userStats.resourcesBookmarked;
        document.getElementById('mood-logs').textContent = appData.userStats.moodLogs;
    }
}

/**
 * Log mood and show feedback
 */
async function logMood(mood) {
    // Remove previous selections
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Select current mood
    const moodButton = document.querySelector(`[data-mood="${mood}"]`);
    moodButton.classList.add('selected');
    moodButton.disabled = true;
    
    // Show loading state
    const originalText = moodButton.textContent;
    moodButton.textContent = 'Logging...';
    
    try {
        // Make API call to log mood
        const response = await api.post('/user/mood', {
            mood: mood
        });
        
        if (response.success) {
            // Add to local mood history
            appData.moodHistory.push({
                mood: mood,
                timestamp: new Date()
            });
            
            // Update stats
            appData.userStats.moodLogs++;
            updateUserStats();
            
            // Show feedback
            const feedbackElement = document.getElementById('mood-feedback');
            feedbackElement.classList.add('show');
            
            let feedbackMessage = '';
            switch(mood) {
                case 'excellent':
                    feedbackMessage = '🌟 That\'s wonderful! Keep taking care of yourself.';
                    break;
                case 'good':
                    feedbackMessage = '😊 Great to hear! Remember to maintain those positive habits.';
                    break;
                case 'okay':
                    feedbackMessage = '👍 That\'s okay. Some days are just average, and that\'s normal.';
                    break;
                case 'difficult':
                    feedbackMessage = '💙 I understand. Consider reaching out to a peer counselor or exploring our resources.';
                    break;
                case 'struggling':
                    feedbackMessage = '🫂 You\'re not alone. Please consider talking to someone - our crisis support is available 24/7.';
                    break;
            }
            
            feedbackElement.innerHTML = `<p>${feedbackMessage}</p>`;
            
            // Show crisis support for struggling moods
            if (mood === 'struggling' || mood === 'difficult') {
                feedbackElement.innerHTML += `<button class="btn btn--outline btn--sm" onclick="showCrisisSupport()">Get Immediate Support</button>`;
            }
            
            // Show success state briefly
            moodButton.textContent = '✓';
            setTimeout(() => {
                moodButton.textContent = originalText;
                moodButton.disabled = false;
            }, 1000);
            
        } else {
            throw new Error(response.message || 'Failed to log mood');
        }
        
    } catch (error) {
        console.error('Log mood error:', error);
        
        // Reset button state
        moodButton.textContent = originalText;
        moodButton.disabled = false;
        moodButton.classList.remove('selected');
        
        // Show error message
        const feedbackElement = document.getElementById('mood-feedback');
        feedbackElement.classList.add('show');
        feedbackElement.innerHTML = `<p style="color: #dc3545;">❌ Failed to log mood. Please try again.</p>`;
    }
}

// ============================================================================
// PEER COUNSELING FUNCTIONS
// ============================================================================

/**
 * Handle matching form submission
 */
function handleCounselorMatching(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const category = formData.get('category');
    const urgency = formData.get('urgency');
    
    if (!category) {
        alert('Please select a category for support.');
        return;
    }
    
    appData.selectedCategory = category;
    
    // Simulate matching process
    document.getElementById('counseling-start').classList.remove('active');
    document.getElementById('counseling-matched').classList.add('active');
}

/**
 * Start anonymous chat session
 */
function startChat() {
    document.getElementById('counseling-matched').classList.remove('active');
    document.getElementById('counseling-chat').classList.add('active');
    
    // Initialize chat session
    appData.currentChatSession = {
        category: appData.selectedCategory,
        startTime: new Date(),
        messages: []
    };
    
    // Add welcome message
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = `
        <div class="message counselor-message">
            <strong>Peer Counselor:</strong> Hello! I'm here to listen and support you regarding ${appData.selectedCategory}. What would you like to talk about today?
        </div>
    `;
}

/**
 * Send chat message
 */
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    const chatMessages = document.getElementById('chat-messages');
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerHTML = `<strong>You:</strong> ${message}`;
    chatMessages.appendChild(userMessage);
    
    // Clear input
    input.value = '';
    
    // Check for crisis keywords
    checkCrisisKeywords(message);
    
    // Simulate counselor response after a delay
    setTimeout(() => {
        const counselorResponse = getCounselorResponse(message);
        const counselorMessage = document.createElement('div');
        counselorMessage.className = 'message counselor-message';
        counselorMessage.innerHTML = `<strong>Peer Counselor:</strong> ${counselorResponse}`;
        chatMessages.appendChild(counselorMessage);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000 + Math.random() * 2000);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Get appropriate counselor response
 */
function getCounselorResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Crisis response
    if (message.includes('hurt') || message.includes('kill') || message.includes('suicide') || message.includes('end it all')) {
        return "I'm really concerned about what you're sharing. It sounds like you're going through a very difficult time. Please know that you're not alone, and there are people who want to help. Would it be okay if we talked about connecting you with professional support right now?";
    }
    
    // Academic stress responses
    if (message.includes('exam') || message.includes('study') || message.includes('grade') || message.includes('academic')) {
        const responses = [
            "Academic pressure can be really overwhelming. What specific aspect of your studies is causing you the most stress?",
            "It sounds like you're dealing with a lot of academic pressure. Have you tried breaking down your tasks into smaller, manageable goals?",
            "Academic stress is very common among students. Let's talk about some strategies that might help you manage it better."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Social anxiety responses
    if (message.includes('social') || message.includes('friend') || message.includes('people') || message.includes('anxiety')) {
        const responses = [
            "Social situations can feel really challenging. What specific social situations make you feel most anxious?",
            "It's understandable to feel anxious around people sometimes. Can you tell me more about when these feelings are strongest?",
            "Many students struggle with social anxiety. You're definitely not alone in feeling this way."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Default responses
    return counselorResponses[Math.floor(Math.random() * counselorResponses.length)];
}

/**
 * Check for crisis keywords in messages
 */
function checkCrisisKeywords(message) {
    const crisisWords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'can\'t go on', 'want to die'];
    const lowerMessage = message.toLowerCase();
    
    for (let word of crisisWords) {
        if (lowerMessage.includes(word)) {
            setTimeout(() => {
                showCrisisSupport();
            }, 500);
            break;
        }
    }
}

/**
 * End chat session
 */
function endChat() {
    if (appData.currentChatSession) {
        appData.userStats.counselingSessions++;
        updateUserStats();
    }
    
    // Show rating/feedback (simplified)
    alert('Thank you for using peer counseling. Your session has been recorded for continuity of care.');
    
    // Reset to counseling start
    resetCounselorMatching();
}

/**
 * Reset counselor matching
 */
function resetCounselorMatching() {
    document.getElementById('counseling-chat').classList.remove('active');
    document.getElementById('counseling-matched').classList.remove('active');
    document.getElementById('counseling-start').classList.add('active');
    
    // Reset form
    document.getElementById('matching-form').reset();
    appData.currentChatSession = null;
    appData.selectedCategory = null;
}

// ============================================================================
// RESOURCES FUNCTIONS
// ============================================================================

/**
 * Populate resources grid
 */
function populateResources() {
    const resourcesGrid = document.getElementById('resources-grid');
    resourcesGrid.innerHTML = '';
    
    mentalHealthResources.forEach((resource, index) => {
        const resourceCard = createResourceCard(resource, index);
        resourcesGrid.appendChild(resourceCard);
    });
}

/**
 * Create resource card element
 */
function createResourceCard(resource, index) {
    const card = document.createElement('div');
    card.className = 'resource-card';
    
    const isBookmarked = appData.bookmarkedResources.includes(index);
    
    card.innerHTML = `
        <div class="resource-type">${resource.type}</div>
        <h3 class="resource-name">${resource.name}</h3>
        <div class="resource-details">
            <p><strong>Address:</strong> ${resource.address}</p>
            ${resource.phone ? `<p><strong>Phone:</strong> ${resource.phone}</p>` : ''}
            ${resource.email ? `<p><strong>Email:</strong> ${resource.email}</p>` : ''}
            <p><strong>Specialties:</strong> ${resource.specialties.join(', ')}</p>
            <p><strong>Cost:</strong> ${resource.cost}</p>
            <p><strong>Hours:</strong> ${resource.hours}</p>
            <p><strong>Rating:</strong> ${'⭐'.repeat(Math.floor(resource.rating))} (${resource.rating}/5)</p>
        </div>
        <div class="resource-actions">
            <button class="btn btn--outline" onclick="contactResource('${resource.phone || resource.email}')">Contact</button>
            <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${index})">
                ${isBookmarked ? '⭐' : '☆'}
            </button>
        </div>
    `;
    
    return card;
}

/**
 * Filter resources by type
 */
function filterResources() {
    const filter = document.getElementById('resource-filter').value;
    const resourcesGrid = document.getElementById('resources-grid');
    resourcesGrid.innerHTML = '';
    
    const filteredResources = filter === 'all' 
        ? mentalHealthResources 
        : mentalHealthResources.filter(resource => resource.type === filter);
    
    filteredResources.forEach((resource, index) => {
        const resourceCard = createResourceCard(resource, mentalHealthResources.indexOf(resource));
        resourcesGrid.appendChild(resourceCard);
    });
}

/**
 * Toggle bookmark for resource
 */
function toggleBookmark(index) {
    if (appData.bookmarkedResources.includes(index)) {
        appData.bookmarkedResources = appData.bookmarkedResources.filter(i => i !== index);
        appData.userStats.resourcesBookmarked--;
    } else {
        appData.bookmarkedResources.push(index);
        appData.userStats.resourcesBookmarked++;
    }
    
    updateUserStats();
    populateResources(); // Refresh the display
}

/**
 * Contact resource (simplified)
 */
function contactResource(contact) {
    if (contact.includes('@')) {
        window.open(`mailto:${contact}`, '_blank');
    } else if (contact.includes('(') || contact.includes('-')) {
        window.open(`tel:${contact}`, '_blank');
    } else {
        alert(`Contact: ${contact}`);
    }
}

// ============================================================================
// EDUCATIONAL CONTENT FUNCTIONS
// ============================================================================

/**
 * Populate educational content
 */
function populateEducationalContent() {
    const educationGrid = document.getElementById('student-education-content').querySelector('.education-grid');
    educationGrid.innerHTML = '';
    
    educationalResources.forEach((resource) => {
        const educationCard = createEducationCard(resource);
        educationGrid.appendChild(educationCard);
    });
}

/**
 * Create education card element
 */
function createEducationCard(resource) {
    const card = document.createElement('div');
    card.className = 'education-card';
    
    card.innerHTML = `
        <div class="education-type">${resource.type}</div>
        <h3>${resource.title}</h3>
        <p>${resource.content}</p>
        <button class="btn btn--primary" onclick="viewEducationalResource('${resource.title}')">
            ${resource.type === 'Video Series' ? 'Watch Videos' : resource.type === 'Interactive Module' ? 'Start Module' : 'Read More'}
        </button>
    `;
    
    return card;
}

/**
 * View educational resource (simplified)
 */
function viewEducationalResource(title) {
    alert(`Opening: ${title}\n\nThis would open the full educational resource in a new window or modal.`);
}

// ============================================================================
// CRISIS SUPPORT FUNCTIONS
// ============================================================================

/**
 * Show crisis support modal
 */
function showCrisisSupport() {
    document.getElementById('crisis-modal').classList.add('show');
}

/**
 * Close crisis support modal
 */
function closeCrisisModal() {
    document.getElementById('crisis-modal').classList.remove('show');
}

// ============================================================================
// ADMIN DASHBOARD FUNCTIONS
// ============================================================================

/**
 * Show specific admin view
 */
function showAdminView(viewName) {
    // Hide all admin views
    document.querySelectorAll('.admin-view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(`admin-${viewName}-content`).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
}

/**
 * Update admin statistics
 */
function updateAdminStats() {
    // Simulate dynamic stats
    document.getElementById('total-users').textContent = 127 + Math.floor(Math.random() * 20);
    document.getElementById('active-sessions').textContent = 8 + Math.floor(Math.random() * 5);
    document.getElementById('total-resources').textContent = mentalHealthResources.length;
    document.getElementById('peer-counselors').textContent = 23 + Math.floor(Math.random() * 10);
}

/**
 * Populate admin resources management
 */
function populateAdminResources() {
    const resourcesList = document.getElementById('admin-resources-list');
    if (!resourcesList) return;
    
    resourcesList.innerHTML = '';
    
    mentalHealthResources.forEach((resource, index) => {
        const resourceItem = createAdminResourceCard(resource, index);
        resourcesList.appendChild(resourceItem);
    });
}

/**
 * Create admin resource card
 */
function createAdminResourceCard(resource, index) {
    const card = document.createElement('div');
    card.className = 'resource-card';
    
    card.innerHTML = `
        <div class="resource-type">${resource.type}</div>
        <h3 class="resource-name">${resource.name}</h3>
        <div class="resource-details">
            <p><strong>Address:</strong> ${resource.address}</p>
            <p><strong>Specialties:</strong> ${resource.specialties.join(', ')}</p>
            <p><strong>Rating:</strong> ${resource.rating}/5</p>
        </div>
        <div class="resource-actions">
            <button class="btn btn--outline btn--sm" onclick="editResource(${index})">Edit</button>
            <button class="btn btn--outline btn--sm" onclick="deleteResource(${index})">Delete</button>
        </div>
    `;
    
    return card;
}

/**
 * Edit resource (simplified)
 */
function editResource(index) {
    alert(`Edit resource: ${mentalHealthResources[index].name}\n\nThis would open an edit form.`);
}

/**
 * Delete resource (simplified)
 */
function deleteResource(index) {
    if (confirm(`Are you sure you want to delete: ${mentalHealthResources[index].name}?`)) {
        alert('Resource deleted successfully.\n\nIn a real application, this would remove the resource from the database.');
    }
}

/**
 * Show add resource form (simplified)
 */
function showAddResourceForm() {
    alert('Add New Resource\n\nThis would open a form to add a new mental health resource to the database.');
}

// ============================================================================
// EVENT LISTENERS AND INITIALIZATION
// ============================================================================

/**
 * Handle chat input enter key
 */
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
}

/**
 * Handle form submissions and clicks outside modals
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication status first
    const isAuthenticated = await checkAuthentication();
    
    if (!isAuthenticated) {
        // Show login page if not authenticated
        document.getElementById('login-page').classList.add('active');
    }
    
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Sign-up form submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignUp);
    }
    
    // Counselor matching form submission
    const matchingForm = document.getElementById('matching-form');
    if (matchingForm) {
        matchingForm.addEventListener('submit', handleCounselorMatching);
    }
    
    // Chat input enter key handler
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', handleChatKeyPress);
    }
    
    // Click outside modal to close
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('crisis-modal');
        if (event.target === modal) {
            closeCrisisModal();
        }
    });
    
    // Initialize resources on page load
    setTimeout(() => {
        if (document.getElementById('resources-grid')) {
            populateResources();
            populateEducationalContent();
        }
    }, 100);
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format date for display
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * Show loading state
 */
function showLoading(element) {
    element.classList.add('loading');
}

/**
 * Hide loading state
 */
function hideLoading(element) {
    element.classList.remove('loading');
}

/**
 * Show notification (simplified)
 */
function showNotification(message, type = 'info') {
    alert(`${type.toUpperCase()}: ${message}`);
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleLogin,
        showStudentView,
        showAdminView,
        logMood,
        toggleBookmark,
        sendMessage,
        showCrisisSupport
    };
}