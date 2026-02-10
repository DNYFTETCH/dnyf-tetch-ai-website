// GitHub Integration
class GitHubIntegration {
    constructor(username = 'dnyftetch') {
        this.username = username;
        this.baseURL = 'https://api.github.com';
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
        this.init();
    }

    init() {
        this.repos = [];
        this.languages = {};
        this.user = null;
        this.stats = {
            totalRepos: 0,
            totalStars: 0,
            totalForks: 0
        };
    }

    async fetchWithCache(endpoint) {
        const cacheKey = `github_${endpoint.replace(/\//g, '_')}`;
        const cached = localStorage.getItem(cacheKey);
        const timestamp = localStorage.getItem(`${cacheKey}_time`);
        
        // Return cached data if valid
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
            localStorage.setItem(`${cacheKey}_time`, Date.now());
            
            return data;
        } catch (error) {
            console.error('GitHub fetch error:', error);
            
            // Return cached data as fallback
            if (cached) {
                return JSON.parse(cached);
            }
            
            return null;
        }
    }

    async getUser() {
        try {
            this.user = await this.fetchWithCache(`users/${this.username}`);
            return this.user;
        } catch (error) {
            console.error('Failed to fetch user:', error);
            return null;
        }
    }

    async getRepositories() {
        try {
            this.repos = await this.fetchWithCache(`users/${this.username}/repos?per_page=100&sort=updated`);
            this.calculateStats();
            this.calculateLanguages();
            return this.repos;
        } catch (error) {
            console.error('Failed to fetch repositories:', error);
            return [];
        }
    }

    calculateStats() {
        if (!this.repos || !this.repos.length) return;
        
        this.stats.totalRepos = this.repos.length;
        this.stats.totalStars = this.repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        this.stats.totalForks = this.repos.reduce((sum, repo) => sum + repo.forks_count, 0);
        
        // Update UI if app exists
        if (window.app && window.app.updateStats) {
            window.app.updateStats(this.repos);
        }
    }

    calculateLanguages() {
        this.languages = {};
        
        if (!this.repos) return;
        
        this.repos.forEach(repo => {
            if (repo.language) {
                this.languages[repo.language] = (this.languages[repo.language] || 0) + 1;
            }
        });
        
        // Update UI if app exists
        if (window.app) {
            if (window.app.renderSkills) {
                window.app.renderSkills(this.languages);
            }
            if (window.app.renderLanguageChart) {
                window.app.renderLanguageChart(this.languages);
            }
        }
    }

    async loadAllData() {
        try {
            // Fetch data
            const [user, repos] = await Promise.all([
                this.getUser(),
                this.getRepositories()
            ]);
            
            // Render projects
            if (window.app && window.app.renderProjects) {
                window.app.renderProjects(this.repos);
            }
            
            return { user, repos };
        } catch (error) {
            console.error('Failed to load GitHub data:', error);
            return { user: null, repos: [] };
        }
    }

    async refreshData() {
        // Clear cache
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('github_')) {
                localStorage.removeItem(key);
            }
        });
        
        // Reload data
        this.init();
        return await this.loadAllData();
    }

    // Search and filter methods
    searchProjects(query) {
        if (!query || !this.repos) return this.repos || [];
        
        return this.repos.filter(repo => 
            repo.name.toLowerCase().includes(query.toLowerCase()) ||
            (repo.description && repo.description.toLowerCase().includes(query.toLowerCase())) ||
            (repo.topics && repo.topics.some(topic => topic.toLowerCase().includes(query.toLowerCase())))
        );
    }

    sortProjects(sortBy = 'updated') {
        if (!this.repos) return [];
        
        return [...this.repos].sort((a, b) => {
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
}

// Initialize GitHub integration
let github = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for app to initialize
    setTimeout(async () => {
        github = new GitHubIntegration('dnyftetch');
        window.github = github;
        
        // Load GitHub data
        await github.loadAllData();
    }, 1000);
});