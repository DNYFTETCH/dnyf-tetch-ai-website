// GitHub API Integration for DNYF TETCH Website
class GitHubIntegration {
    constructor() {
        this.username = 'dnyftetch';
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
        this.baseURL = 'https://api.github.com';
        this.initialize();
    }

    initialize() {
        this.cache = {
            repos: null,
            user: null,
            activities: null,
            languages: null
        };
        
        this.stats = {
            totalRepos: 0,
            totalStars: 0,
            totalForks: 0,
            totalCommits: 0,
            languages: {},
            lastUpdated: null
        };
    }

    // GitHub API Request with caching
    async fetchGitHub(endpoint) {
        const cacheKey = endpoint;
        const cached = localStorage.getItem(cacheKey);
        const timestamp = localStorage.getItem(`${cacheKey}_timestamp`);
        
        // Return cached data if not expired
        if (cached && timestamp && Date.now() - timestamp < this.cacheDuration) {
            return JSON.parse(cached);
        }
        
        try {
            const response = await fetch(`${this.baseURL}/${endpoint}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'DNYF-TETCH-Website'
                }
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the data
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(`${cacheKey}_timestamp`, Date.now());
            
            return data;
        } catch (error) {
            console.error('GitHub fetch error:', error);
            // Return cached data even if expired as fallback
            if (cached) {
                return JSON.parse(cached);
            }
            throw error;
        }
    }

    // Get user profile
    async getUserProfile() {
        try {
            const user = await this.fetchGitHub(`users/${this.username}`);
            this.cache.user = user;
            return user;
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            return null;
        }
    }

    // Get all repositories
    async getRepositories() {
        try {
            const repos = await this.fetchGitHub(`users/${this.username}/repos?per_page=100&sort=updated`);
            this.cache.repos = repos;
            this.calculateStats(repos);
            return repos;
        } catch (error) {
            console.error('Failed to fetch repositories:', error);
            return [];
        }
    }

    // Get repository activities (events)
    async getActivities() {
        try {
            const events = await this.fetchGitHub(`users/${this.username}/events?per_page=30`);
            this.cache.activities = events;
            return events;
        } catch (error) {
            console.error('Failed to fetch activities:', error);
            return [];
        }
    }

    // Calculate statistics
    calculateStats(repos) {
        this.stats.totalRepos = repos.length;
        this.stats.totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        this.stats.totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
        this.stats.lastUpdated = new Date().toISOString();
        
        // Calculate language distribution
        this.stats.languages = {};
        repos.forEach(repo => {
            if (repo.language) {
                this.stats.languages[repo.language] = (this.stats.languages[repo.language] || 0) + 1;
            }
        });
        
        // Update UI
        this.updateStatsUI();
    }

    // Update statistics in UI
    updateStatsUI() {
        // Update main stats
        document.getElementById('totalRepos').textContent = this.stats.totalRepos;
        document.getElementById('totalStars').textContent = this.stats.totalStars;
        document.getElementById('totalForks').textContent = this.stats.totalForks;
        document.getElementById('repoCount').textContent = this.stats.totalRepos;
        document.getElementById('publicRepos').textContent = this.stats.totalRepos;
        document.getElementById('totalStars2').textContent = this.stats.totalStars;
        document.getElementById('totalLanguages').textContent = Object.keys(this.stats.languages).length;
        document.getElementById('footerRepoCount').textContent = this.stats.totalRepos;
        document.getElementById('footerStarCount').textContent = this.stats.totalStars;
        document.getElementById('lastUpdateTime').textContent = 'Just now';
        
        // Update account age if user data available
        if (this.cache.user) {
            const created = new Date(this.cache.user.created_at);
            const now = new Date();
            const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
            document.getElementById('accountAge').textContent = days;
        }
    }

    // Render repositories
    renderRepositories(repos) {
        const container = document.getElementById('projectsContainer');
        if (!container) return;
        
        if (!repos || repos.length === 0) {
            container.innerHTML = `
                <div class="projects-empty">
                    <i class="fas fa-code"></i>
                    <h3>No repositories found</h3>
                    <p>No GitHub repositories found for ${this.username}</p>
                </div>
            `;
            return;
        }
        
        // Sort repositories based on selected option
        const sortBy = document.getElementById('projectSort')?.value || 'updated';
        const sortedRepos = this.sortRepositories(repos, sortBy);
        
        // Filter by search
        const searchTerm = document.getElementById('projectSearch')?.value.toLowerCase() || '';
        const filteredRepos = sortedRepos.filter(repo => 
            repo.name.toLowerCase().includes(searchTerm) || 
            (repo.description && repo.description.toLowerCase().includes(searchTerm))
        );
        
        // Get view mode
        const viewMode = document.querySelector('.view-btn.active')?.dataset.view || 'grid';
        
        // Render projects
        container.innerHTML = filteredRepos.map(repo => this.createProjectCard(repo, viewMode)).join('');
        
        // Update project count in terminal
        document.getElementById('projectCount').textContent = `${filteredRepos.length} projects found`;
    }

    // Sort repositories
    sortRepositories(repos, sortBy) {
        return [...repos].sort((a, b) => {
            switch(sortBy) {
                case 'stars':
                    return b.stargazers_count - a.stargazers_count;
                case 'forks':
                    return b.forks_count - a.forks_count;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'updated':
                default:
                    return new Date(b.updated_at) - new Date(a.updated_at);
            }
        });
    }

    // Create project card HTML
    createProjectCard(repo, viewMode = 'grid') {
        const isGrid = viewMode === 'grid';
        const language = repo.language || 'Other';
        const updated = new Date(repo.updated_at).toLocaleDateString();
        
        return `
            <div class="project-card" data-language="${language.toLowerCase()}" data-stars="${repo.stargazers_count}">
                <div class="project-header">
                    <div class="project-title">
                        <i class="fas fa-code-branch"></i>
                        ${repo.name}
                    </div>
                    <div class="project-description">
                        ${repo.description || 'No description available'}
                    </div>
                    <div class="project-meta">
                        <span class="meta-item">
                            <i class="fas fa-code"></i> ${language}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-calendar-alt"></i> Updated ${updated}
                        </span>
                    </div>
                </div>
                <div class="project-body">
                    <div class="project-tech">
                        <span class="tech-tag">${language}</span>
                        ${repo.license?.name ? `<span class="tech-tag">${repo.license.name}</span>` : ''}
                        ${repo.topics?.slice(0, 3).map(topic => `<span class="tech-tag">${topic}</span>`).join('') || ''}
                    </div>
                    <div class="project-footer">
                        <div class="project-stats">
                            <span class="stat">
                                <i class="fas fa-star"></i> ${repo.stargazers_count}
                            </span>
                            <span class="stat">
                                <i class="fas fa-code-branch"></i> ${repo.forks_count}
                            </span>
                            <span class="stat">
                                <i class="fas fa-eye"></i> ${repo.watchers_count}
                            </span>
                        </div>
                        <a href="${repo.html_url}" class="project-link" target="_blank">
                            View on GitHub <i class="fas fa-external-link-alt"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Render activities
    renderActivities(activities) {
        const container = document.getElementById('activityFeed');
        if (!container) return;
        
        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="activity-empty">
                    <i class="fas fa-history"></i>
                    <h3>No recent activities</h3>
                    <p>No recent GitHub activities found</p>
                </div>
            `;
            return;
        }
        
        const filteredActivities = this.filterActivities(activities);
        
        container.innerHTML = filteredActivities.map(activity => this.createActivityItem(activity)).join('');
        
        // Update last updated time
        document.getElementById('lastUpdated').textContent = 'Just now';
    }

    // Filter activities by type
    filterActivities(activities) {
        const filter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        
        if (filter === 'all') return activities.slice(0, 10);
        
        return activities
            .filter(activity => activity.type.includes(filter))
            .slice(0, 10);
    }

    // Create activity item HTML
    createActivityItem(activity) {
        const type = this.getActivityType(activity.type);
        const time = this.formatTime(new Date(activity.created_at));
        const repo = activity.repo?.name || 'Unknown';
        
        let content = '';
        switch(activity.type) {
            case 'PushEvent':
                const commits = activity.payload?.commits?.length || 0;
                content = `Pushed ${commits} commit${commits !== 1 ? 's' : ''} to <span class="activity-repo">${repo}</span>`;
                break;
            case 'CreateEvent':
                const refType = activity.payload?.ref_type || 'repository';
                content = `Created new ${refType}: <span class="activity-repo">${repo}</span>`;
                break;
            case 'WatchEvent':
                content = `Starred <span class="activity-repo">${repo}</span>`;
                break;
            case 'IssuesEvent':
                const action = activity.payload?.action || 'updated';
                content = `${action} issue in <span class="activity-repo">${repo}</span>`;
                break;
            default:
                content = `Activity in <span class="activity-repo">${repo}</span>`;
        }
        
        return `
            <div class="activity-item" data-type="${activity.type}">
                <div class="activity-header">
                    <span class="activity-type">${type}</span>
                    <span class="activity-time">${time}</span>
                </div>
                <div class="activity-content">
                    ${content}
                </div>
            </div>
        `;
    }

    // Get activity type display text
    getActivityType(type) {
        const types = {
            'PushEvent': 'Push',
            'CreateEvent': 'Create',
            'WatchEvent': 'Star',
            'IssuesEvent': 'Issue',
            'PullRequestEvent': 'PR',
            'ForkEvent': 'Fork'
        };
        return types[type] || type;
    }

    // Format time
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }

    // Render skills/languages
    renderSkills() {
        const skillsGrid = document.getElementById('skillsGrid');
        const footerTech = document.getElementById('footerTechTags');
        
        if (!skillsGrid || !footerTech) return;
        
        const languages = Object.entries(this.stats.languages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
        
        // Render skills grid
        skillsGrid.innerHTML = languages.map(([language, count]) => `
            <div class="skill-item">
                <div class="skill-icon">
                    ${this.getLanguageIcon(language)}
                </div>
                <div class="skill-name">${language}</div>
                <div class="skill-level">${count} repos</div>
            </div>
        `).join('');
        
        // Render footer tech tags
        footerTech.innerHTML = languages.map(([language]) => `
            <span>${language}</span>
        `).join('');
        
        // Update language count
        document.getElementById('totalLanguages').textContent = Object.keys(this.stats.languages).length;
    }

    // Get language icon
    getLanguageIcon(language) {
        const icons = {
            'JavaScript': 'fab fa-js',
            'TypeScript': 'fas fa-code',
            'Python': 'fab fa-python',
            'Java': 'fab fa-java',
            'Kotlin': 'fas fa-mobile-alt',
            'C++': 'fas fa-cogs',
            'HTML': 'fab fa-html5',
            'CSS': 'fab fa-css3',
            'Shell': 'fas fa-terminal',
            'Dart': 'fab fa-flutter',
            'Go': 'fab fa-golang',
            'Rust': 'fas fa-cog',
            'PHP': 'fab fa-php',
            'Ruby': 'fas fa-gem',
            'Swift': 'fab fa-swift'
        };
        
        return icons[language] || 'fas fa-code';
    }

    // Render language chart
    renderLanguageChart() {
        const ctx = document.getElementById('languageChart');
        if (!ctx) return;
        
        const languages = Object.entries(this.stats.languages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const labels = languages.map(([language]) => language);
        const data = languages.map(([, count]) => count);
        const colors = ['#3ddc84', '#00d9ff', '#b967ff', '#ffbd2e', '#ff5f56'];
        
        // Destroy existing chart if it exists
        if (this.languageChart) {
            this.languageChart.destroy();
        }
        
        this.languageChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: 'transparent',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'var(--text-primary)',
                            font: {
                                family: 'var(--font-sans)'
                            }
                        }
                    }
                }
            }
        });
    }

    // Initialize terminal output
    initTerminal() {
        const terminal = document.getElementById('terminalOutput');
        if (!terminal) return;
        
        const commands = [
            { cmd: 'whoami', out: 'dnyf_tetch', delay: 100 },
            { cmd: 'pwd', out: '/home/dnyf/research', delay: 200 },
            { cmd: 'ls -la', out: 'total 24\ndrwxr-xr-x  6 dnyf  staff   192B Jan  1 00:00 .\ndrwxr-xr-x  3 dnyf  staff    96B Jan  1 00:00 ..\ndrwxr-xr-x  8 dnyf  staff   256B Jan  1 00:00 .git\ndrwxr-xr-x  4 dnyf  staff   128B Jan  1 00:00 ai-research\ndrwxr-xr-x  5 dnyf  staff   160B Jan  1 00:00 android-projects\ndrwxr-xr-x  3 dnyf  staff    96B Jan  1 00:00 termux-tools\ndrwxr-xr-x  4 dnyf  staff   128B Jan  1 00:00 server-configs', delay: 300 },
            { cmd: 'cd ai-research', out: '', delay: 400 },
            { cmd: 'git status', out: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean', delay: 500 },
            { cmd: 'echo "Welcome to DNYF TETCH"', out: 'Welcome to DNYF TETCH', delay: 600 }
        ];
        
        let output = '';
        commands.forEach((item, index) => {
            setTimeout(() => {
                output += `<div class="terminal-line"><span class="prompt">$</span> <span class="command">${item.cmd}</span></div>`;
                if (item.out) {
                    output += `<div class="terminal-line output">${item.out}</div>`;
                }
                terminal.innerHTML = output;
                terminal.scrollTop = terminal.scrollHeight;
            }, item.delay);
        });
        
        // Add blinking cursor
        setTimeout(() => {
            output += `<div class="terminal-line"><span class="prompt">$</span> <span class="command"></span><span class="blinking-cursor">|</span></div>`;
            terminal.innerHTML = output;
        }, 700);
    }

    // Refresh all data
    async refreshData() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
        
        try {
            // Clear cache
            localStorage.clear();
            this.initialize();
            
            // Fetch fresh data
            await Promise.all([
                this.getUserProfile(),
                this.getRepositories(),
                this.getActivities()
            ]);
            
            // Update UI
            this.updateUI();
            
            // Show success message
            this.showNotification('Data refreshed successfully', 'success');
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showNotification('Failed to refresh data', 'error');
        } finally {
            if (loadingOverlay) {
                setTimeout(() => {
                    loadingOverlay.classList.add('hidden');
                }, 500);
            }
        }
    }

    // Update all UI components
    updateUI() {
        this.updateStatsUI();
        this.renderRepositories(this.cache.repos);
        this.renderActivities(this.cache.activities);
        this.renderSkills();
        this.renderLanguageChart();
        
        // Update latest project
        if (this.cache.repos && this.cache.repos.length > 0) {
            const latestRepo = this.cache.repos[0];
            document.getElementById('latestProject').textContent = latestRepo.name;
            document.getElementById('latestProjectLink').href = latestRepo.html_url;
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Initialize event listeners
    initEventListeners() {
        // Search input
        const searchInput = document.getElementById('projectSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.renderRepositories(this.cache.repos);
            });
        }
        
        // Sort select
        const sortSelect = document.getElementById('projectSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.renderRepositories(this.cache.repos);
            });
        }
        
        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderRepositories(this.cache.repos);
            });
        });
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderActivities(this.cache.activities);
            });
        });
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshActivity');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // View GitHub button
        const viewGitHubBtn = document.getElementById('viewGitHub');
        if (viewGitHubBtn) {
            viewGitHubBtn.addEventListener('click', () => {
                window.open(`https://github.com/${this.username}`, '_blank');
            });
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                themeToggle.innerHTML = `<i class="fas fa-${newTheme === 'dark' ? 'moon' : 'sun'}"></i>`;
                localStorage.setItem('theme', newTheme);
            });
            
            // Load saved theme
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
                themeToggle.innerHTML = `<i class="fas fa-${savedTheme === 'dark' ? 'moon' : 'sun'}"></i>`;
            }
        }
        
        // Contact form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactForm(contactForm);
            });
        }
    }

    // Handle contact form submission
    async handleContactForm(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // In a real application, you would send this to a server
        // For now, we'll just show a success message
        this.showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
        form.reset();
    }

    // Initialize everything
    async init() {
        try {
            // Show loading
            document.getElementById('loadingOverlay')?.classList.remove('hidden');
            
            // Initialize terminal
            this.initTerminal();
            
            // Initialize event listeners
            this.initEventListeners();
            
            // Load data
            await Promise.all([
                this.getUserProfile(),
                this.getRepositories(),
                this.getActivities()
            ]);
            
            // Update UI
            this.updateUI();
            
            // Hide loading
            setTimeout(() => {
                document.getElementById('loadingOverlay')?.classList.add('hidden');
            }, 1000);
            
            console.log('GitHub integration initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
            document.getElementById('loadingOverlay')?.classList.add('hidden');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.github = new GitHubIntegration();
    window.github.init();
});