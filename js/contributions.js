// GitHub Contributions Graph
class GitHubContributions {
    constructor(username = 'dnyftetch') {
        this.username = username;
        this.contributions = [];
        this.activity = [];
        this.stats = {
            currentStreak: 0,
            longestStreak: 0,
            totalContributions: 0,
            commits: 0,
            prs: 0,
            issues: 0,
            reviews: 0
        };
    }

    async fetchContributions() {
        try {
            // Fetch recent events
            const response = await fetch(`https://api.github.com/users/${this.username}/events?per_page=100`);
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const events = await response.json();
            this.processEvents(events);
            this.calculateStats();
            this.renderGraph();
            this.renderActivity();
            
            return events;
        } catch (error) {
            console.error('Failed to fetch contributions:', error);
            return [];
        }
    }

    processEvents(events) {
        // Process events to get daily contributions
        const contributionsMap = {};
        
        events.forEach(event => {
            const date = new Date(event.created_at).toISOString().split('T')[0];
            contributionsMap[date] = (contributionsMap[date] || 0) + 1;
            
            // Count by type
            switch(event.type) {
                case 'PushEvent':
                    this.stats.commits += event.payload.commits?.length || 0;
                    break;
                case 'PullRequestEvent':
                    this.stats.prs++;
                    break;
                case 'IssuesEvent':
                    this.stats.issues++;
                    break;
                case 'PullRequestReviewEvent':
                    this.stats.reviews++;
                    break;
            }
        });
        
        // Convert to array and generate last 365 days
        const today = new Date();
        this.contributions = [];
        
        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = contributionsMap[dateStr] || 0;
            
            this.contributions.push({
                date: dateStr,
                count: count,
                level: this.getContributionLevel(count)
            });
        }
        
        // Store recent activity
        this.activity = events.slice(0, 10);
    }

    getContributionLevel(count) {
        if (count === 0) return 0;
        if (count <= 3) return 1;
        if (count <= 6) return 2;
        if (count <= 9) return 3;
        return 4;
    }

    calculateStats() {
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let totalContributions = 0;
        
        // Calculate streaks (reverse for chronological order)
        const reversed = [...this.contributions].reverse();
        
        reversed.forEach(day => {
            totalContributions += day.count;
            
            if (day.count > 0) {
                tempStreak++;
                currentStreak = tempStreak;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        });
        
        this.stats.currentStreak = currentStreak;
        this.stats.longestStreak = longestStreak;
        this.stats.totalContributions = totalContributions;
    }

    renderGraph() {
        const container = document.getElementById('contributionsGraph');
        if (!container) return;
        
        // Group by months
        const months = {};
        this.contributions.forEach(day => {
            const month = day.date.substring(0, 7); // YYYY-MM
            if (!months[month]) months[month] = [];
            months[month].push(day);
        });
        
        let html = '<div class="github-graph">';
        
        // Generate graph cells
        Object.entries(months).forEach(([month, days]) => {
            html += `<div class="graph-month">`;
            
            // Split into weeks (7 days each)
            for (let i = 0; i < days.length; i += 7) {
                const week = days.slice(i, i + 7);
                html += `<div class="graph-week">`;
                
                week.forEach(day => {
                    html += `
                        <div class="graph-day" 
                             data-level="${day.level}"
                             data-count="${day.count}"
                             data-date="${this.formatDate(day.date)}"
                             title="${day.count} contributions on ${this.formatDate(day.date)}">
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
            html += '</div>';
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Update stats
        this.updateStatsUI();
    }

    renderActivity() {
        const container = document.getElementById('recentActivityList');
        if (!container) return;
        
        if (!this.activity.length) {
            container.innerHTML = '<div class="activity-item"><div class="activity-content"><div class="activity-desc">No recent activity</div></div></div>';
            return;
        }
        
        let html = '';
        
        this.activity.forEach(event => {
            const icon = this.getActivityIcon(event.type);
            const description = this.getActivityDescription(event);
            const repo = event.repo?.name || 'Unknown';
            const time = this.formatTime(new Date(event.created_at));
            
            html += `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-repo">${repo}</div>
                        <div class="activity-desc">${description}</div>
                    </div>
                    <div class="activity-time">${time}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    getActivityIcon(type) {
        const icons = {
            'PushEvent': 'fas fa-code-commit',
            'CreateEvent': 'fas fa-plus-circle',
            'PullRequestEvent': 'fas fa-code-pull-request',
            'IssuesEvent': 'fas fa-exclamation-circle',
            'WatchEvent': 'fas fa-star',
            'ForkEvent': 'fas fa-code-branch',
            'ReleaseEvent': 'fas fa-tag',
            'PullRequestReviewEvent': 'fas fa-eye',
            'PublicEvent': 'fas fa-globe'
        };
        
        return icons[type] || 'fas fa-code';
    }

    getActivityDescription(event) {
        switch(event.type) {
            case 'PushEvent':
                const commits = event.payload.commits?.length || 0;
                return `Pushed ${commits} commit${commits !== 1 ? 's' : ''}`;
            case 'CreateEvent':
                return `Created ${event.payload.ref_type}`;
            case 'PullRequestEvent':
                return `${event.payload.action} pull request`;
            case 'IssuesEvent':
                return `${event.payload.action} issue`;
            case 'WatchEvent':
                return 'Starred repository';
            case 'ForkEvent':
                return 'Forked repository';
            default:
                return event.type.replace('Event', '');
        }
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

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

    updateStatsUI() {
        // Update contribution stats
        const updateElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        
        updateElement('currentStreak', this.stats.currentStreak);
        updateElement('longestStreak', this.stats.longestStreak);
        updateElement('totalContributions', this.stats.totalContributions);
        updateElement('commitsCount', this.stats.commits);
        updateElement('prsCount', this.stats.prs);
        updateElement('issuesCount', this.stats.issues);
        updateElement('reviewsCount', this.stats.reviews);
    }

    async init() {
        await this.fetchContributions();
        
        // Auto-refresh every 5 minutes
        setInterval(() => {
            this.fetchContributions();
        }, 5 * 60 * 1000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.githubContributions = new GitHubContributions('dnyftetch');
    window.githubContributions.init();
});