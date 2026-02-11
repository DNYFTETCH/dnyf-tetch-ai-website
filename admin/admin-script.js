// ============================================
// DNYF TETCH ADMIN PANEL - JavaScript
// ============================================

// Admin configuration
const ADMIN_CONFIG = {
    credentials: {
        username: "admin",
        password: "admin123"
    },
    storageKeys: {
        AUTH: 'dnyf_admin_auth',
        CONTENT: 'dnyf_site_content',
        ANALYTICS: 'dnyf_site_analytics',
        USERS: 'dnyf_admin_users',
        ACTIVITY: 'dnyf_activity_log',
        SETTINGS: 'dnyf_admin_settings',
        FEATURES: 'dnyf_site_features',
        BACKUPS: 'dnyf_backup_history'
    },
    defaultData: {
        content: {
            heroTitle: 'DNYF TETCH',
            heroSubtitle: 'AI Research & Development',
            heroDescription: 'Building Future with AI & Terminal Tech',
            heroBtn1: 'View Projects',
            heroBtn2: 'AI Assistant',
            aboutTitle: 'About DNYF TETCH',
            aboutDescription: 'Specializing in AI research, Termux projects, terminal emulators, Android development, and server creation.',
            contactEmail: 'contact@dnyftetch.com',
            githubUrl: 'https://github.com/dnyftetch'
        },
        features: [
            { 
                title: 'AI Research', 
                description: 'Machine Learning, Neural Networks, NLP',
                icon: 'brain',
                color: '#3DDC84'
            },
            { 
                title: 'Android Development', 
                description: 'Kotlin, Java, Termux integration',
                icon: 'android',
                color: '#34A853'
            },
            { 
                title: 'Termux & Terminal', 
                description: 'CLI tools, automation scripts',
                icon: 'terminal',
                color: '#4285F4'
            },
            { 
                title: 'Server Development', 
                description: 'Backend APIs, deployment, DevOps',
                icon: 'server',
                color: '#EA4335'
            }
        ],
        settings: {
            siteTitle: 'DNYF TETCH',
            maintenanceMode: false,
            analyticsEnabled: true,
            autoBackup: true,
            backupInterval: 24, // hours
            theme: 'dark'
        },
        users: [
            {
                id: 1,
                name: 'Admin User',
                email: 'admin@dnyftetch.com',
                role: 'admin',
                permissions: ['all'],
                lastLogin: new Date().toISOString(),
                status: 'active',
                avatarColor: '#3DDC84'
            }
        ]
    },
    charts: {
        visitorsChart: null,
        trafficChart: null,
        performanceChart: null
    }
};

// Global state
let AdminState = {
    isAuthenticated: false,
    currentUser: null,
    currentTab: 'dashboard',
    isLoading: false,
    toastQueue: [],
    isOnline: true,
    backupInterval: null,
    lastBackup: null
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initAdminPanel();
    setupEventListeners();
    checkConnectivity();
    setupServiceWorker();
});

function initAdminPanel() {
    // Check authentication
    checkAuth();
    
    // Initialize ripple effects
    setupRippleEffects();
    
    // Initialize tooltips
    setupTooltips();
    
    // Initialize charts if on analytics page
    if (window.location.hash === '#analytics') {
        initCharts();
    }
    
    // Start backup interval if enabled
    startAutoBackup();
    
    console.log('🔧 DNYF TETCH Admin Panel initialized');
}

// ============================================
// AUTHENTICATION
// ============================================

function checkAuth() {
    const authData = getStorage(ADMIN_CONFIG.storageKeys.AUTH);
    
    if (authData && authData.token && authData.expires > Date.now()) {
        AdminState.isAuthenticated = true;
        AdminState.currentUser = authData.user;
        showAdminPanel();
        logActivity('System', 'Admin panel accessed');
    } else {
        showLoginScreen();
        // Clear expired auth
        if (authData && authData.expires <= Date.now()) {
            clearStorage(ADMIN_CONFIG.storageKeys.AUTH);
            showToast('Session expired. Please login again.', 'warning');
        }
    }
}

function login() {
    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value;
    
    if (!username || !password) {
        showToast('Please enter username and password', 'error');
        return;
    }
    
    // Simple validation - in production use proper authentication
    if (username === ADMIN_CONFIG.credentials.username && 
        password === ADMIN_CONFIG.credentials.password) {
        
        // Create auth token (in production, use JWT from server)
        const authData = {
            user: {
                username: username,
                role: 'admin',
                permissions: ['all']
            },
            token: generateToken(),
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        setStorage(ADMIN_CONFIG.storageKeys.AUTH, authData);
        
        AdminState.isAuthenticated = true;
        AdminState.currentUser = authData.user;
        
        showAdminPanel();
        showToast('Login successful! Welcome back.', 'success');
        logActivity('Authentication', 'User logged in successfully');
        
        // Update user last login
        updateUserLastLogin(username);
        
    } else {
        showToast('Invalid credentials. Try: admin / admin123', 'error');
        logActivity('Authentication', 'Failed login attempt');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        clearStorage(ADMIN_CONFIG.storageKeys.AUTH);
        AdminState.isAuthenticated = false;
        AdminState.currentUser = null;
        
        showLoginScreen();
        showToast('Logged out successfully', 'success');
        logActivity('Authentication', 'User logged out');
    }
}

function generateToken() {
    return 'dnyf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function updateUserLastLogin(username) {
    const users = getStorage(ADMIN_CONFIG.storageKeys.USERS) || ADMIN_CONFIG.defaultData.users;
    const userIndex = users.findIndex(u => u.email === username || u.name === username);
    
    if (userIndex !== -1) {
        users[userIndex].lastLogin = new Date().toISOString();
        setStorage(ADMIN_CONFIG.storageKeys.USERS, users);
    }
}

// ============================================
// UI MANAGEMENT
// ============================================

function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginScreen) loginScreen.style.display = 'flex';
    if (adminPanel) adminPanel.style.display = 'none';
    
    // Set focus to username field
    setTimeout(() => {
        const usernameField = document.getElementById('username');
        if (usernameField) usernameField.focus();
    }, 100);
}

function showAdminPanel() {
    const loginScreen = document.getElementById('loginScreen');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    
    // Load initial data
    loadDashboardData();
    updateUserGreeting();
}

function switchTab(tabId, event = null) {
    if (event) event.preventDefault();
    
    // Update active tab in navigation
    document.querySelectorAll('.nav-item, .tab-btn').forEach(item => {
        item.classList.remove('active');
    });
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    // Update main content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        AdminState.currentTab = tabId;
        
        // Update page title
        updatePageTitle(tabId);
        
        // Load tab-specific data
        switch(tabId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'content':
                loadContentData();
                break;
            case 'analytics':
                loadAnalyticsData();
                initCharts();
                break;
            case 'users':
                loadUsersData();
                break;
            case 'settings':
                loadSettings();
                break;
        }
        
        logActivity('Navigation', `Switched to ${tabId} tab`);
    }
}

function updatePageTitle(tabId) {
    const titles = {
        dashboard: 'Dashboard',
        content: 'Content Management',
        analytics: 'Analytics',
        users: 'User Management',
        settings: 'Settings'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle && titles[tabId]) {
        pageTitle.textContent = titles[tabId];
    }
}

function updateUserGreeting() {
    const greetingEl = document.getElementById('userGreeting');
    if (greetingEl && AdminState.currentUser) {
        const hour = new Date().getHours();
        let greeting = 'Good ';
        
        if (hour < 12) greeting += 'Morning';
        else if (hour < 18) greeting += 'Afternoon';
        else greeting += 'Evening';
        
        greetingEl.textContent = `${greeting}, ${AdminState.currentUser.username}`;
    }
}

// ============================================
// DASHBOARD
// ============================================

function loadDashboardData() {
    if (AdminState.isLoading) return;
    
    AdminState.isLoading = true;
    showLoading('dashboard');
    
    // Simulate API call
    setTimeout(() => {
        try {
            // Load stats
            const stats = calculateDashboardStats();
            updateDashboardStats(stats);
            
            // Load recent activity
            loadRecentActivity();
            
            // Load quick stats
            loadQuickStats();
            
            // Update backup status
            updateBackupStatus();
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            showToast('Failed to load dashboard data', 'error');
        } finally {
            AdminState.isLoading = false;
            hideLoading('dashboard');
        }
    }, 500);
}

function calculateDashboardStats() {
    const analytics = getStorage(ADMIN_CONFIG.storageKeys.ANALYTICS) || {};
    const activities = getStorage(ADMIN_CONFIG.storageKeys.ACTIVITY) || [];
    const users = getStorage(ADMIN_CONFIG.storageKeys.USERS) || ADMIN_CONFIG.defaultData.users;
    
    // Calculate total visitors (sample data)
    const totalVisitors = analytics.totalVisitors || Math.floor(Math.random() * 10000) + 5000;
    
    // Calculate active users (last 24 hours)
    const activeUsers = activities
        .filter(activity => {
            const activityTime = new Date(activity.timestamp);
            const hoursDiff = (Date.now() - activityTime.getTime()) / (1000 * 60 * 60);
            return hoursDiff <= 24;
        })
        .map(activity => activity.user)
        .filter((user, index, array) => array.indexOf(user) === index)
        .length;
    
    // Calculate storage used
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length * 2; // Approx size in bytes
        }
    }
    const storageUsed = Math.min(100, Math.round((totalSize / (5 * 1024 * 1024)) * 100)); // 5MB limit
    
    // Calculate performance score
    const performance = Math.min(100, 85 + Math.random() * 15);
    
    return {
        totalVisitors,
        activeUsers,
        storageUsed,
        performance,
        totalActivities: activities.length,
        totalUsers: users.length,
        uptime: '99.9%'
    };
}

function updateDashboardStats(stats) {
    const statElements = {
        totalVisitors: document.getElementById('totalVisitors'),
        activeUsers: document.getElementById('activeUsers'),
        totalMessages: document.getElementById('totalMessages'),
        storageUsed: document.getElementById('storageUsed'),
        performanceScore: document.getElementById('performanceScore'),
        uptimePercentage: document.getElementById('uptimePercentage')
    };
    
    // Update stat cards
    if (statElements.totalVisitors) {
        statElements.totalVisitors.textContent = stats.totalVisitors.toLocaleString();
        animateCounter(statElements.totalVisitors, stats.totalVisitors);
    }
    
    if (statElements.activeUsers) {
        statElements.activeUsers.textContent = stats.activeUsers;
        animateCounter(statElements.activeUsers, stats.activeUsers);
    }
    
    if (statElements.totalMessages) {
        statElements.totalMessages.textContent = stats.totalActivities;
        animateCounter(statElements.totalMessages, stats.totalActivities);
    }
    
    if (statElements.storageUsed) {
        statElements.storageUsed.textContent = `${stats.storageUsed}%`;
        updateProgressBar('storageProgress', stats.storageUsed);
    }
    
    if (statElements.performanceScore) {
        statElements.performanceScore.textContent = `${Math.round(stats.performance)}%`;
        updateProgressBar('performanceProgress', stats.performance);
    }
    
    if (statElements.uptimePercentage) {
        statElements.uptimePercentage.textContent = stats.uptime;
    }
}

function animateCounter(element, targetValue) {
    if (!element || typeof targetValue !== 'number') return;
    
    const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = (targetValue - currentValue) / steps;
    let currentStep = 0;
    
    function updateCounter() {
        if (currentStep < steps) {
            const newValue = Math.round(currentValue + (increment * currentStep));
            element.textContent = newValue.toLocaleString();
            currentStep++;
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = targetValue.toLocaleString();
        }
    }
    
    updateCounter();
}

function updateProgressBar(barId, percentage) {
    const bar = document.getElementById(barId);
    if (bar) {
        bar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        
        // Update color based on percentage
        if (percentage > 80) bar.style.backgroundColor = '#EA4335';
        else if (percentage > 60) bar.style.backgroundColor = '#FBBC05';
        else bar.style.backgroundColor = '#34A853';
    }
}

function loadRecentActivity() {
    const activities = getStorage(ADMIN_CONFIG.storageKeys.ACTIVITY) || [];
    const container = document.getElementById('recentActivityList');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    // Get last 10 activities
    const recentActivities = activities.slice(-10).reverse();
    
    if (recentActivities.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="material-icons-round">history</i>
                <p>No activity yet</p>
            </div>
        `;
        return;
    }
    
    recentActivities.forEach(activity => {
        const activityEl = createActivityElement(activity);
        container.appendChild(activityEl);
    });
}

function createActivityElement(activity) {
    const div = document.createElement('div');
    div.className = 'activity-item';
    
    const timeAgo = getTimeAgo(activity.timestamp);
    const icon = getActivityIcon(activity.action);
    
    div.innerHTML = `
        <div class="activity-icon">
            <i class="material-icons-round">${icon}</i>
        </div>
        <div class="activity-content">
            <div class="activity-title">${activity.action}</div>
            <div class="activity-details">${activity.details}</div>
            <div class="activity-meta">
                <span class="activity-user">${activity.user}</span>
                <span class="activity-time">${timeAgo}</span>
            </div>
        </div>
    `;
    
    return div;
}

function loadQuickStats() {
    const stats = calculateDashboardStats();
    const container = document.getElementById('quickStats');
    
    if (!container) return;
    
    const quickStats = [
        { label: 'Page Views', value: Math.floor(stats.totalVisitors * 2.5), icon: 'visibility', trend: '+12%' },
        { label: 'Avg. Session', value: '2:45', icon: 'timer', trend: '+5%' },
        { label: 'Bounce Rate', value: '32%', icon: 'trending_down', trend: '-8%' },
        { label: 'New Users', value: Math.floor(stats.activeUsers * 0.3), icon: 'person_add', trend: '+15%' }
    ];
    
    container.innerHTML = quickStats.map(stat => `
        <div class="quick-stat">
            <div class="quick-stat-icon">
                <i class="material-icons-round">${stat.icon}</i>
            </div>
            <div class="quick-stat-info">
                <div class="quick-stat-value">${stat.value}</div>
                <div class="quick-stat-label">${stat.label}</div>
                <div class="quick-stat-trend ${stat.trend.startsWith('+') ? 'positive' : 'negative'}">
                    ${stat.trend}
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// CONTENT MANAGEMENT
// ============================================

function loadContentData() {
    const content = getStorage(ADMIN_CONFIG.storageKeys.CONTENT) || ADMIN_CONFIG.defaultData.content;
    const features = getStorage(ADMIN_CONFIG.storageKeys.FEATURES) || ADMIN_CONFIG.defaultData.features;
    
    // Populate form fields
    Object.keys(content).forEach(key => {
        const element = document.getElementById(key);
        if (element && content[key] !== undefined) {
            element.value = content[key];
        }
    });
    
    // Load features
    loadFeaturesList(features);
    
    // Load theme settings
    loadThemeSettings();
}

function loadFeaturesList(features) {
    const container = document.getElementById('featuresList');
    if (!container) return;
    
    container.innerHTML = '';
    
    features.forEach((feature, index) => {
        const featureEl = createFeatureElement(feature, index);
        container.appendChild(featureEl);
    });
    
    if (features.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="material-icons-round">extension</i>
                <p>No features added yet</p>
                <button class="btn btn-outline" onclick="addFeature()">
                    Add First Feature
                </button>
            </div>
        `;
    }
}

function createFeatureElement(feature, index) {
    const div = document.createElement('div');
    div.className = 'feature-item';
    div.innerHTML = `
        <div class="feature-header">
            <div class="feature-icon" style="background-color: ${feature.color || '#3DDC84'}">
                <i class="material-icons-round">${feature.icon || 'extension'}</i>
            </div>
            <input type="text" 
                   class="feature-title" 
                   value="${feature.title || ''}"
                   placeholder="Feature title"
                   onchange="updateFeature(${index}, 'title', this.value)">
            <div class="feature-actions">
                <button class="btn-icon" onclick="moveFeature(${index}, 'up')">
                    <i class="material-icons-round">arrow_upward</i>
                </button>
                <button class="btn-icon" onclick="moveFeature(${index}, 'down')">
                    <i class="material-icons-round">arrow_downward</i>
                </button>
                <button class="btn-icon btn-danger" onclick="removeFeature(${index})">
                    <i class="material-icons-round">delete</i>
                </button>
            </div>
        </div>
        <textarea class="feature-description"
                  placeholder="Feature description"
                  onchange="updateFeature(${index}, 'description', this.value)">${feature.description || ''}</textarea>
        <div class="feature-colors">
            <label>Icon Color:</label>
            <input type="color" 
                   value="${feature.color || '#3DDC84'}"
                   onchange="updateFeature(${index}, 'color', this.value)">
            <select onchange="updateFeature(${index}, 'icon', this.value)">
                <option value="brain" ${feature.icon === 'brain' ? 'selected' : ''}>AI</option>
                <option value="android" ${feature.icon === 'android' ? 'selected' : ''}>Android</option>
                <option value="terminal" ${feature.icon === 'terminal' ? 'selected' : ''}>Terminal</option>
                <option value="server" ${feature.icon === 'server' ? 'selected' : ''}>Server</option>
                <option value="code" ${feature.icon === 'code' ? 'selected' : ''}>Code</option>
                <option value="cloud" ${feature.icon === 'cloud' ? 'selected' : ''}>Cloud</option>
            </select>
        </div>
    `;
    
    return div;
}

function addFeature() {
    const features = getStorage(ADMIN_CONFIG.storageKeys.FEATURES) || ADMIN_CONFIG.defaultData.features;
    
    const newFeature = {
        title: 'New Feature',
        description: 'Feature description here',
        icon: 'extension',
        color: '#3DDC84'
    };
    
    features.push(newFeature);
    setStorage(ADMIN_CONFIG.storageKeys.FEATURES, features);
    
    loadFeaturesList(features);
    showToast('Feature added successfully', 'success');
    logActivity('Content', 'Added new feature');
}

function updateFeature(index, field, value) {
    const features = getStorage(ADMIN_CONFIG.storageKeys.FEATURES) || ADMIN_CONFIG.defaultData.features;
    
    if (features[index]) {
        features[index][field] = value;
        setStorage(ADMIN_CONFIG.storageKeys.FEATURES, features);
    }
}

function removeFeature(index) {
    if (!confirm('Are you sure you want to remove this feature?')) return;
    
    const features = getStorage(ADMIN_CONFIG.storageKeys.FEATURES) || ADMIN_CONFIG.defaultData.features;
    
    if (features[index]) {
        features.splice(index, 1);
        setStorage(ADMIN_CONFIG.storageKeys.FEATURES, features);
        
        loadFeaturesList(features);
        showToast('Feature removed', 'success');
        logActivity('Content', 'Removed feature');
    }
}

function moveFeature(index, direction) {
    const features = getStorage(ADMIN_CONFIG.storageKeys.FEATURES) || ADMIN_CONFIG.defaultData.features;
    
    if (direction === 'up' && index > 0) {
        [features[index], features[index - 1]] = [features[index - 1], features[index]];
    } else if (direction === 'down' && index < features.length - 1) {
        [features[index], features[index + 1]] = [features[index + 1], features[index]];
    }
    
    setStorage(ADMIN_CONFIG.storageKeys.FEATURES, features);
    loadFeaturesList(features);
}

function saveContent() {
    if (AdminState.isLoading) return;
    
    AdminState.isLoading = true;
    showLoading('content');
    
    // Collect all content data
    const contentData = {};
    const contentElements = document.querySelectorAll('#content input, #content textarea, #content select');
    
    contentElements.forEach(element => {
        if (element.id && element.value !== undefined) {
            contentData[element.id] = element.value;
        }
    });
    
    // Get features
    const features = getStorage(ADMIN_CONFIG.storageKeys.FEATURES) || ADMIN_CONFIG.defaultData.features;
    
    // Save to storage
    setStorage(ADMIN_CONFIG.storageKeys.CONTENT, contentData);
    setStorage(ADMIN_CONFIG.storageKeys.FEATURES, features);
    
    // Update timestamp
    contentData.lastUpdated = new Date().toISOString();
    
    // Simulate API call
    setTimeout(() => {
        AdminState.isLoading = false;
        hideLoading('content');
        
        showToast('Content saved successfully!', 'success');
        logActivity('Content', 'Updated website content');
        
        // Update main website preview
        updateWebsitePreview();
        
    }, 1000);
}

function updateWebsitePreview() {
    // This function would update a live preview iframe or send data to main site
    console.log('📝 Content updated - preview should refresh');
    
    // For now, just log the update
    const content = getStorage(ADMIN_CONFIG.storageKeys.CONTENT);
    console.log('Updated content:', content);
}

// ============================================
// ANALYTICS
// ============================================

function loadAnalyticsData() {
    if (!AdminState.isAuthenticated) return;
    
    showLoading('analytics');
    
    // Load analytics from storage or generate sample data
    let analytics = getStorage(ADMIN_CONFIG.storageKeys.ANALYTICS);
    
    if (!analytics || !analytics.lastUpdated || isDataStale(analytics.lastUpdated, 1)) {
        analytics = generateSampleAnalytics();
        setStorage(ADMIN_CONFIG.storageKeys.ANALYTICS, analytics);
    }
    
    // Update analytics display
    updateAnalyticsDisplay(analytics);
    hideLoading('analytics');
}

function generateSampleAnalytics(days = 30) {
    const now = new Date();
    const data = {
        visitors: [],
        pageViews: [],
        sources: {
            direct: Math.floor(Math.random() * 40) + 30,
            google: Math.floor(Math.random() * 30) + 20,
            social: Math.floor(Math.random() * 20) + 10,
            referral: Math.floor(Math.random() * 10) + 5
        },
        devices: {
            mobile: Math.floor(Math.random() * 60) + 30,
            desktop: Math.floor(Math.random() * 40) + 30,
            tablet: Math.floor(Math.random() * 10) + 5
        },
        topPages: [
            { page: '/', views: Math.floor(Math.random() * 1000) + 500 },
            { page: '/projects', views: Math.floor(Math.random() * 800) + 300 },
            { page: '/about', views: Math.floor(Math.random() * 600) + 200 },
            { page: '/contact', views: Math.floor(Math.random() * 400) + 100 }
        ],
        lastUpdated: now.toISOString()
    };
    
    // Generate daily data
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        data.visitors.push({
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 200) + 100
        });
        
        data.pageViews.push({
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 500) + 200
        });
    }
    
    return data;
}

function updateAnalyticsDisplay(analytics) {
    // Update summary cards
    const totalVisitors = analytics.visitors.reduce((sum, day) => sum + day.count, 0);
    const totalPageViews = analytics.pageViews.reduce((sum, day) => sum + day.count, 0);
    const avgDuration = '2:45';
    const bounceRate = '32%';
    
    document.getElementById('totalVisitorsCount').textContent = totalVisitors.toLocaleString();
    document.getElementById('totalPageViews').textContent = totalPageViews.toLocaleString();
    document.getElementById('avgDuration').textContent = avgDuration;
    document.getElementById('bounceRate').textContent = bounceRate;
    
    // Update charts
    updateCharts(analytics);
    
    // Update traffic sources
    updateTrafficSources(analytics.sources);
    
    // Update device breakdown
    updateDeviceBreakdown(analytics.devices);
    
    // Update top pages
    updateTopPages(analytics.topPages);
}

function initCharts() {
    if (AdminState.charts.visitorsChart) {
        AdminState.charts.visitorsChart.destroy();
    }
    
    const ctx = document.getElementById('visitorsChart')?.getContext('2d');
    if (!ctx) return;
    
    AdminState.charts.visitorsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Visitors',
                data: [],
                borderColor: '#3DDC84',
                backgroundColor: 'rgba(61, 220, 132, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

function updateCharts(analytics) {
    if (!AdminState.charts.visitorsChart) return;
    
    // Update visitors chart
    const last7Days = analytics.visitors.slice(-7);
    AdminState.charts.visitorsChart.data.labels = last7Days.map(d => 
        new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
    );
    AdminState.charts.visitorsChart.data.datasets[0].data = last7Days.map(d => d.count);
    AdminState.charts.visitorsChart.update();
    
    // Update traffic chart (pie/doughnut)
    updateTrafficChart(analytics.sources);
}

function updateTrafficChart(sources) {
    const ctx = document.getElementById('trafficChart')?.getContext('2d');
    if (!ctx) return;
    
    if (AdminState.charts.trafficChart) {
        AdminState.charts.trafficChart.destroy();
    }
    
    AdminState.charts.trafficChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Direct', 'Google', 'Social', 'Referral'],
            datasets: [{
                data: [sources.direct, sources.google, sources.social, sources.referral],
                backgroundColor: [
                    '#3DDC84',
                    '#4285F4',
                    '#EA4335',
                    '#FBBC05'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateTrafficSources(sources) {
    const container = document.getElementById('trafficSources');
    if (!container) return;
    
    const total = Object.values(sources).reduce((a, b) => a + b, 0);
    
    container.innerHTML = Object.entries(sources).map(([source, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const icons = {
            direct: 'link',
            google: 'search',
            social: 'share',
            referral: 'input'
        };
        
        return `
            <div class="traffic-source">
                <div class="traffic-source-header">
                    <i class="material-icons-round">${icons[source] || 'web'}</i>
                    <span>${source.charAt(0).toUpperCase() + source.slice(1)}</span>
                    <span class="traffic-percentage">${percentage}%</span>
                </div>
                <div class="traffic-bar">
                    <div class="traffic-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="traffic-count">${count} visitors</div>
            </div>
        `;
    }).join('');
}

function updateDeviceBreakdown(devices) {
    const container = document.getElementById('deviceBreakdown');
    if (!container) return;
    
    const total = Object.values(devices).reduce((a, b) => a + b, 0);
    
    container.innerHTML = Object.entries(devices).map(([device, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const icons = {
            mobile: 'smartphone',
            desktop: 'computer',
            tablet: 'tablet_mac'
        };
        
        return `
            <div class="device-item">
                <div class="device-icon">
                    <i class="material-icons-round">${icons[device] || 'devices'}</i>
                </div>
                <div class="device-info">
                    <div class="device-name">${device.charAt(0).toUpperCase() + device.slice(1)}</div>
                    <div class="device-stats">
                        <div class="device-percentage">${percentage}%</div>
                        <div class="device-count">${count}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateTopPages(pages) {
    const container = document.getElementById('topPagesList');
    if (!container) return;
    
    container.innerHTML = pages.map((page, index) => `
        <div class="page-item">
            <div class="page-rank">${index + 1}</div>
            <div class="page-info">
                <div class="page-url">${page.page}</div>
                <div class="page-views">${page.views.toLocaleString()} views</div>
            </div>
            <div class="page-trend">
                <i class="material-icons-round">trending_up</i>
            </div>
        </div>
    `).join('');
}

// ============================================
// USER MANAGEMENT
// ============================================

function loadUsersData() {
    const users = getStorage(ADMIN_CONFIG.storageKeys.USERS) || ADMIN_CONFIG.defaultData.users;
    updateUsersTable(users);
}

function updateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

function createUserRow(user) {
    const tr = document.createElement('tr');
    
    const statusColor = user.status === 'active' ? '#34A853' : '#EA4335';
    const roleColor = user.role === 'admin' ? '#3DDC84' : 
                     user.role === 'editor' ? '#4285F4' : '#FBBC05';
    
    tr.innerHTML = `
        <td>
            <div class="user-avatar" style="background-color: ${user.avatarColor || '#3DDC84'}">
                ${user.name.charAt(0).toUpperCase()}
            </div>
        </td>
        <td>
            <div class="user-info">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
            </div>
        </td>
        <td>
            <span class="user-role" style="background-color: ${roleColor}">${user.role}</span>
        </td>
        <td>
            <span class="user-status" style="color: ${statusColor}">
                <i class="material-icons-round">${user.status === 'active' ? 'circle' : 'cancel'}</i>
                ${user.status}
            </span>
        </td>
        <td>
            ${user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
        </td>
        <td>
            <div class="user-actions">
                <button class="btn-icon" onclick="editUser(${user.id})" title="Edit">
                    <i class="material-icons-round">edit</i>
                </button>
                <button class="btn-icon ${user.role === 'admin' ? 'btn-disabled' : ''}" 
                        onclick="${user.role === 'admin' ? '' : `deleteUser(${user.id})`}" 
                        title="${user.role === 'admin' ? 'Cannot delete admin' : 'Delete'}">
                    <i class="material-icons-round">delete</i>
                </button>
                <button class="btn-icon" onclick="toggleUserStatus(${user.id})" title="Toggle Status">
                    <i class="material-icons-round">${user.status === 'active' ? 'pause' : 'play_arrow'}</i>
                </button>
            </div>
        </td>
    `;
    
    return tr;
}

function addUser() {
    // Show add user modal
    showModal('addUserModal');
}

function editUser(userId) {
    const users = getStorage(ADMIN_CONFIG.storageKeys.USERS) || ADMIN_CONFIG.defaultData.users;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    
    // Populate edit form
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserRole').value = user.role;
    document.getElementById('editUserStatus').value = user.status;
    document.getElementById('editUserId').value = user.id;
    
    showModal('editUserModal');
}

function saveUser() {
    const formId = document.getElementById('editUserId') ? 'editUserForm' : 'addUserForm';
    const form = document.getElementById(formId);
    
    if (!form || !form.checkValidity()) {
        form?.reportValidity();
        return;
    }
    
    const users = getStorage(ADMIN_CONFIG.storageKeys.USERS) || ADMIN_CONFIG.defaultData.users;
    
    if (formId === 'addUserForm') {
        // Add new user
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            name: document.getElementById('addUserName').value,
            email: document.getElementById('addUserEmail').value,
            role: document.getElementById('addUserRole').value,
            status: 'active',
            permissions: getPermissionsForRole(document.getElementById('addUserRole').value),
            avatarColor: getRandomColor(),
            lastLogin: null
        };
        
        users.push(newUser);
        showToast('User added successfully', 'success');
        logActivity('Users', `Added user: ${newUser.name}`);
        
    } else {
        // Edit existing user
        const userId = parseInt(document.getElementById('editUserId').value);
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex].name = document.getElementById('editUserName').value;
            users[userIndex].email = document.getElementById('editUserEmail').value;
            users[userIndex].role = document.getElementById('editUserRole').value;
            users[userIndex].status = document.getElementById('editUserStatus').value;
            
            showToast('User updated successfully', 'success');
            logActivity('Users', `Updated user: ${users[userIndex].name}`);
        }
    }
    
    setStorage(ADMIN_CONFIG.storageKeys.USERS, users);
    updateUsersTable(users);
    hideModal(formId === 'addUserForm' ? 'addUserModal' : 'editUserModal');
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    const users = getStorage(ADMIN_CONFIG.storageKeys.USERS) || ADMIN_CONFIG.defaultData.users;
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        const userName = users[userIndex].name;
        users.splice(userIndex, 1);
        setStorage(ADMIN_CONFIG.storageKeys.USERS, users);
        
        updateUsersTable(users);
        showToast('User deleted successfully', 'success');
        logActivity('Users', `Deleted user: ${userName}`);
    }
}

function toggleUserStatus(userId) {
    const users = getStorage(ADMIN_CONFIG.storageKeys.USERS) || ADMIN_CONFIG.defaultData.users;
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        users[userIndex].status = users[userIndex].status === 'active' ? 'inactive' : 'active';
        setStorage(ADMIN_CONFIG.storageKeys.USERS, users);
        
        updateUsersTable(users);
        showToast(`User ${users[userIndex].status}`, 'success');
        logActivity('Users', `Changed ${users[userIndex].name} status to ${users[userIndex].status}`);
    }
}

function getPermissionsForRole(role) {
    const permissions = {
        admin: ['all'],
        editor: ['read', 'write', 'edit'],
        viewer: ['read']
    };
    
    return permissions[role] || ['read'];
}

// ============================================
// SETTINGS
// ============================================

function loadSettings() {
    const settings = getStorage(ADMIN_CONFIG.storageKeys.SETTINGS) || ADMIN_CONFIG.defaultData.settings;
    
    // Populate form fields
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else {
                element.value = settings[key];
            }
        }
    });
    
    // Update backup status
    updateBackupStatus();
}

function saveSettings() {
    const settings = {};
    const settingsForm = document.getElementById('settingsForm');
    
    if (!settingsForm || !settingsForm.checkValidity()) {
        settingsForm?.reportValidity();
        return;
    }
    
    // Collect settings
    settingsForm.querySelectorAll('input, select, textarea').forEach(element => {
        if (element.id && element.name) {
            if (element.type === 'checkbox') {
                settings[element.id] = element.checked;
            } else {
                settings[element.id] = element.value;
            }
        }
    });
    
    // Save to storage
    setStorage(ADMIN_CONFIG.storageKeys.SETTINGS, settings);
    
    // Update auto-backup if changed
    if (settings.autoBackup !== AdminState.autoBackup) {
        if (settings.autoBackup) {
            startAutoBackup();
        } else {
            stopAutoBackup();
        }
    }
    
    showToast('Settings saved successfully', 'success');
    logActivity('Settings', 'Updated admin settings');
}

function backupData() {
    showLoading('backupBtn');
    
    const backup = {
        timestamp: new Date().toISOString(),
        data: {
            content: getStorage(ADMIN_CONFIG.storageKeys.CONTENT),
            features: getStorage(ADMIN_CONFIG.storageKeys.FEATURES),
            analytics: getStorage(ADMIN_CONFIG.storageKeys.ANALYTICS),
            users: getStorage(ADMIN_CONFIG.storageKeys.USERS),
            settings: getStorage(ADMIN_CONFIG.storageKeys.SETTINGS),
            activities: getStorage(ADMIN_CONFIG.storageKeys.ACTIVITY)
        },
        size: calculateBackupSize()
    };
    
    // Save backup history
    const backups = getStorage(ADMIN_CONFIG.storageKeys.BACKUPS) || [];
    backups.push(backup);
    
    // Keep only last 10 backups
    if (backups.length > 10) {
        backups.splice(0, backups.length - 10);
    }
    
    setStorage(ADMIN_CONFIG.storageKeys.BACKUPS, backups);
    AdminState.lastBackup = backup.timestamp;
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dnyf_backup_${backup.timestamp.replace(/[:.]/g, '-')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    hideLoading('backupBtn');
    showToast('Backup created and downloaded', 'success');
    logActivity('Backup', 'Created system backup');
    updateBackupStatus();
}

function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('Warning: This will overwrite all current data. Continue?')) {
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (!backup.timestamp || !backup.data) {
                throw new Error('Invalid backup file');
            }
            
            // Restore data
            Object.keys(backup.data).forEach(key => {
                if (backup.data[key]) {
                    localStorage.setItem(key, JSON.stringify(backup.data[key]));
                }
            });
            
            showToast(`Backup restored from ${new Date(backup.timestamp).toLocaleDateString()}`, 'success');
            logActivity('Backup', 'Restored system from backup');
            
            // Reload all data
            loadDashboardData();
            loadContentData();
            loadUsersData();
            loadSettings();
            
        } catch (error) {
            console.error('Restore error:', error);
            showToast('Failed to restore backup. Invalid file format.', 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

function resetSettings() {
    if (!confirm('This will reset all settings to default values. Continue?')) return;
    
    // Clear all settings
    clearStorage(ADMIN_CONFIG.storageKeys.SETTINGS);
    
    // Reload default settings
    loadSettings();
    
    showToast('Settings reset to default', 'success');
    logActivity('Settings', 'Reset all settings to default');
}

function exportData(type) {
    let data, filename, mimeType;
    
    switch(type) {
        case 'csv':
            data = convertToCSV();
            filename = `dnyf_data_${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
            break;
        case 'json':
            data = JSON.stringify(getAllData(), null, 2);
            filename = `dnyf_data_${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
            break;
        default:
            return;
    }
    
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`Data exported as ${type.toUpperCase()}`, 'success');
    logActivity('Export', `Exported data as ${type.toUpperCase()}`);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Storage helpers
function getStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error reading ${key}:`, error);
        return null;
    }
}

function setStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
        showToast('Storage error: Data might be too large', 'error');
        return false;
    }
}

function clearStorage(key) {
    localStorage.removeItem(key);
}

function getAllData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('dnyf_')) {
            data[key] = getStorage(key);
        }
    }
    return data;
}

// Date helpers
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

function getTimeAgo(dateString) {
    return formatDate(dateString);
}

function isDataStale(timestamp, hours = 24) {
    const lastUpdate = new Date(timestamp);
    const staleTime = new Date(lastUpdate.getTime() + (hours * 60 * 60 * 1000));
    return new Date() > staleTime;
}

// UI helpers
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="material-icons-round">${getToastIcon(type)}</i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="material-icons-round">close</i>
        </button>
    `;
    
    const container = document.getElementById('toastContainer') || createToastContainer();
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('toast-hiding');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function getToastIcon(type) {
    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };
    return icons[type] || 'info';
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function showLoading(elementId = null) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('loading');
        }
    } else {
        document.body.classList.add('loading');
    }
}

function hideLoading(elementId = null) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('loading');
        }
    } else {
        document.body.classList.remove('loading');
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('modal-show');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('modal-show');
    }
}

function setupRippleEffects() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn, .card, .list-item')) {
            const element = e.target.closest('.btn, .card, .list-item');
            const ripple = document.createElement('span');
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.7);
                transform: scale(0);
                animation: ripple 0.6s linear;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
            `;
            
            element.style.position = 'relative';
            element.style.overflow = 'hidden';
            element.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        }
    });
}

function setupTooltips() {
    // Add tooltip attributes to elements with title
    document.querySelectorAll('[title]').forEach(element => {
        element.setAttribute('data-tooltip', element.getAttribute('title'));
        element.removeAttribute('title');
    });
}

// Activity logging
function logActivity(action, details) {
    const activities = getStorage(ADMIN_CONFIG.storageKeys.ACTIVITY) || [];
    
    activities.push({
        timestamp: new Date().toISOString(),
        user: AdminState.currentUser?.username || 'System',
        action: action,
        details: details,
        ip: '127.0.0.1' // In production, get real IP
    });
    
    // Keep only last 100 activities
    if (activities.length > 100) {
        activities.splice(0, activities.length - 100);
    }
    
    setStorage(ADMIN_CONFIG.storageKeys.ACTIVITY, activities);
}

function getActivityIcon(action) {
    const icons = {
        'Login': 'login',
        'Logout': 'logout',
        'Content': 'edit',
        'Settings': 'settings',
        'Backup': 'backup',
        'Export': 'download',
        'User': 'person',
        'System': 'build',
        'Authentication': 'security',
        'Navigation': 'navigation'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
        if (action.includes(key)) return icon;
    }
    
    return 'event';
}

// Backup functions
function calculateBackupSize() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('dnyf_')) {
            total += localStorage.getItem(key).length;
        }
    }
    return formatFileSize(total);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateBackupStatus() {
    const backups = getStorage(ADMIN_CONFIG.storageKeys.BACKUPS) || [];
    const lastBackup = backups.length > 0 ? backups[backups.length - 1] : null;
    
    const statusEl = document.getElementById('backupStatus');
    const lastBackupEl = document.getElementById('lastBackupTime');
    const nextBackupEl = document.getElementById('nextBackupTime');
    
    if (statusEl) {
        statusEl.textContent = backups.length > 0 ? 'Healthy' : 'No backups';
        statusEl.className = backups.length > 0 ? 'status-healthy' : 'status-warning';
    }
    
    if (lastBackupEl && lastBackup) {
        lastBackupEl.textContent = formatDate(lastBackup.timestamp);
    }
    
    if (nextBackupEl) {
        const settings = getStorage(ADMIN_CONFIG.storageKeys.SETTINGS) || ADMIN_CONFIG.defaultData.settings;
        if (settings.autoBackup && lastBackup) {
            const nextBackup = new Date(lastBackup.timestamp);
            nextBackup.setHours(nextBackup.getHours() + (settings.backupInterval || 24));
            nextBackupEl.textContent = formatDate(nextBackup.toISOString());
        } else {
            nextBackupEl.textContent = 'Manual only';
        }
    }
}

function startAutoBackup() {
    const settings = getStorage(ADMIN_CONFIG.storageKeys.SETTINGS) || ADMIN_CONFIG.defaultData.settings;
    
    if (settings.autoBackup && !AdminState.backupInterval) {
        const intervalHours = settings.backupInterval || 24;
        const intervalMs = intervalHours * 60 * 60 * 1000;
        
        AdminState.backupInterval = setInterval(() => {
            if (AdminState.isOnline) {
                backupData();
            }
        }, intervalMs);
        
        console.log(`🔄 Auto-backup started (every ${intervalHours} hours)`);
    }
}

function stopAutoBackup() {
    if (AdminState.backupInterval) {
        clearInterval(AdminState.backupInterval);
        AdminState.backupInterval = null;
        console.log('🛑 Auto-backup stopped');
    }
}

// Network connectivity
function checkConnectivity() {
    AdminState.isOnline = navigator.onLine;
    
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        statusEl.textContent = AdminState.isOnline ? 'Online' : 'Offline';
        statusEl.className = AdminState.isOnline ? 'status-online' : 'status-offline';
    }
    
    if (!AdminState.isOnline) {
        showToast('You are offline. Some features may be limited.', 'warning');
    }
}

// Service Worker
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/admin-sw.js')
            .then(registration => {
                console.log('🔧 Admin Service Worker registered:', registration.scope);
            })
            .catch(error => {
                console.error('❌ Admin Service Worker registration failed:', error);
            });
    }
}

// Event Listeners
function setupEventListeners() {
    // Network status
    window.addEventListener('online', () => {
        AdminState.isOnline = true;
        checkConnectivity();
        showToast('Back online', 'success');
    });
    
    window.addEventListener('offline', () => {
        AdminState.isOnline = false;
        checkConnectivity();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (AdminState.currentTab === 'content') saveContent();
            if (AdminState.currentTab === 'settings') saveSettings();
        }
        
        // Ctrl + L to logout
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            logout();
        }
        
        // Ctrl + B to backup
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            backupData();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-show').forEach(modal => {
                modal.classList.remove('modal-show');
            });
        }
    });
    
    // Auto-save for content (after 2 seconds of inactivity)
    let saveTimeout;
    document.querySelectorAll('#content input, #content textarea').forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveContent, 2000);
        });
    });
}

// Export functions for global access
window.login = login;
window.logout = logout;
window.switchTab = switchTab;
window.saveContent = saveContent;
window.addFeature = addFeature;
window.updateFeature = updateFeature;
window.removeFeature = removeFeature;
window.moveFeature = moveFeature;
window.backupData = backupData;
window.restoreBackup = restoreBackup;
window.exportData = exportData;
window.resetSettings = resetSettings;
window.saveSettings = saveSettings;
window.addUser = addUser;
window.editUser = editUser;
window.saveUser = saveUser;
window.deleteUser = deleteUser;
window.toggleUserStatus = toggleUserStatus;
window.showModal = showModal;
window.hideModal = hideModal;
window.showToast = showToast;

console.log('🚀 DNYF TETCH Admin JavaScript loaded successfully!');