// AI Terminal Chat Interface
class AITerminal {
    constructor() {
        this.commandHistory = [];
        this.responseCount = 0;
        this.commandCount = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHistory();
        this.updateStats();
    }

    setupEventListeners() {
        const input = document.getElementById('aiInput');
        const sendBtn = document.getElementById('sendCommand');
        
        if (input && sendBtn) {
            // Send on button click
            sendBtn.addEventListener('click', () => this.processCommand());
            
            // Send on Enter key
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.processCommand();
                }
            });
            
            // Command history with arrow keys
            let historyIndex = -1;
            input.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (this.commandHistory.length > 0) {
                        historyIndex = Math.min(historyIndex + 1, this.commandHistory.length - 1);
                        input.value = this.commandHistory[this.commandHistory.length - 1 - historyIndex];
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (historyIndex > 0) {
                        historyIndex--;
                        input.value = this.commandHistory[this.commandHistory.length - 1 - historyIndex];
                    } else {
                        historyIndex = -1;
                        input.value = '';
                    }
                }
            });
        }
    }

    processCommand() {
        const input = document.getElementById('aiInput');
        const command = input.value.trim();
        
        if (!command) return;
        
        // Add to history
        this.commandHistory.push(command);
        this.commandCount++;
        
        // Display user command
        this.displayUserCommand(command);
        
        // Process command
        this.executeCommand(command);
        
        // Clear input
        input.value = '';
        
        // Update stats
        this.updateStats();
        
        // Save history
        this.saveHistory();
    }

    displayUserCommand(command) {
        const terminal = document.getElementById('aiTerminalBody');
        if (!terminal) return;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const message = document.createElement('div');
        message.className = 'user-message';
        message.innerHTML = `
            <div class="message-content">${this.escapeHtml(command)}</div>
            <div class="message-time">${time}</div>
        `;
        
        terminal.appendChild(message);
        terminal.scrollTop = terminal.scrollHeight;
    }

    displayAIResponse(response, type = 'info') {
        const terminal = document.getElementById('aiTerminalBody');
        if (!terminal) return;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const message = document.createElement('div');
        message.className = 'ai-message';
        message.innerHTML = `
            <div class="message-content">${response}</div>
            <div class="message-time">${time}</div>
        `;
        
        terminal.appendChild(message);
        terminal.scrollTop = terminal.scrollHeight;
        
        this.responseCount++;
        this.updateStats();
    }

    executeCommand(command) {
        const cmd = command.toLowerCase().trim();
        
        switch(cmd) {
            case 'help':
                this.showHelp();
                break;
                
            case 'projects':
                this.showProjects();
                break;
                
            case 'skills':
                this.showSkills();
                break;
                
            case 'about':
                this.showAbout();
                break;
                
            case 'contact':
                this.showContact();
                break;
                
            case 'clear':
                this.clearTerminal();
                break;
                
            case 'github':
                this.openGitHub();
                break;
                
            case 'ai research':
            case 'research':
                this.showAIResearch();
                break;
                
            case 'termux':
                this.showTermuxInfo();
                break;
                
            case 'status':
                this.showStatus();
                break;
                
            default:
                this.handleUnknownCommand(cmd);
        }
    }

    showHelp() {
        const helpText = `
<strong>Available commands:</strong><br><br>
• <code>projects</code> - List GitHub projects<br>
• <code>skills</code> - Show technology stack<br>
• <code>about</code> - About DNYF TETCH<br>
• <code>contact</code> - Contact information<br>
• <code>github</code> - Open GitHub profile<br>
• <code>research</code> - AI research info<br>
• <code>termux</code> - Termux projects info<br>
• <code>status</code> - System status<br>
• <code>clear</code> - Clear terminal<br>
• <code>help</code> - Show this help
        `;
        
        this.displayAIResponse(helpText);
    }

    showProjects() {
        if (window.github && window.github.repos && window.github.repos.length > 0) {
            const recentProjects = window.github.repos.slice(0, 5);
            let response = '<strong>Recent Projects:</strong><br><br>';
            
            recentProjects.forEach((repo, index) => {
                response += `${index + 1}. <strong>${repo.name}</strong><br>`;
                if (repo.description) {
                    response += `   ${repo.description}<br>`;
                }
                response += `   🌟 ${repo.stargazers_count} | 🍴 ${repo.forks_count}<br>`;
                response += `   <a href="${repo.html_url}" target="_blank">View on GitHub</a><br><br>`;
            });
            
            response += 'Type "github" to view all projects.';
            this.displayAIResponse(response);
        } else {
            this.displayAIResponse('Loading projects from GitHub...');
            // Try to load if not already loaded
            if (window.github && typeof window.github.loadAllData === 'function') {
                window.github.loadAllData().then(() => {
                    this.showProjects();
                });
            }
        }
    }

    showSkills() {
        if (window.github && window.github.languages) {
            const languages = window.github.languages;
            const topLanguages = Object.entries(languages)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            let response = '<strong>Top Technologies:</strong><br><br>';
            
            topLanguages.forEach(([lang, count]) => {
                const barLength = Math.min(Math.floor(count * 20 / Math.max(...Object.values(languages))), 20);
                const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
                response += `<strong>${lang}</strong><br>`;
                response += `${bar} ${count} repos<br><br>`;
            });
            
            this.displayAIResponse(response);
        } else {
            this.displayAIResponse('AI Research • Android Development • Termux • Server Architecture • Machine Learning');
        }
    }

    showAbout() {
        const aboutText = `
<strong>DNYF TETCH - AI Research & Development</strong><br><br>
<strong>Specializing in:</strong><br>
• <strong>AI Research</strong> - Machine Learning, Neural Networks, NLP<br>
• <strong>Android Development</strong> - Kotlin, Java, Termux integration<br>
• <strong>Termux Projects</strong> - CLI tools, automation scripts<br>
• <strong>Server Development</strong> - Backend APIs, deployment, DevOps<br>
• <strong>Terminal Tools</strong> - Custom terminal emulators, CLI apps<br><br>
All projects are open-source and available on GitHub.
        `;
        
        this.displayAIResponse(aboutText);
    }

    showContact() {
        const contactText = `
<strong>Contact Information:</strong><br><br>
• <strong>GitHub</strong>: <a href="https://github.com/dnyftetch" target="_blank">dnyftetch</a><br>
• <strong>Email</strong>: contact@dnyftetch.com<br>
• <strong>Website</strong>: <a href="https://dnyf-tetch-ai-website.netlify.app" target="_blank">dnyf-tetch-ai-website.netlify.app</a><br><br>
For collaboration on AI research or development projects.
        `;
        
        this.displayAIResponse(contactText);
    }

    clearTerminal() {
        const terminal = document.getElementById('aiTerminalBody');
        if (terminal) {
            terminal.innerHTML = `
                <div class="ai-message">
                    <div class="message-content">Terminal cleared. How can I help you?</div>
                    <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `;
        }
    }

    openGitHub() {
        window.open('https://github.com/dnyftetch', '_blank');
        this.displayAIResponse('Opening GitHub profile in new tab...');
    }

    showAIResearch() {
        const researchText = `
<strong>AI Research Areas:</strong><br><br>
• <strong>Machine Learning</strong> - Neural networks, deep learning models<br>
• <strong>Natural Language Processing</strong> - Text generation, analysis<br>
• <strong>Computer Vision</strong> - Image recognition, processing<br>
• <strong>Reinforcement Learning</strong> - AI agents, optimization<br>
• <strong>Model Deployment</strong> - Server setup, API development<br><br>
Research focuses on practical applications and open-source tools.
        `;
        
        this.displayAIResponse(researchText);
    }

    showTermuxInfo() {
        const termuxText = `
<strong>Termux Projects:</strong><br><br>
Termux is a terminal emulator and Linux environment for Android.<br><br>
<strong>Project Types:</strong><br>
• CLI tools for Android development<br>
• Automation scripts for mobile<br>
• AI modules for Termux<br>
• Server setup on Android<br>
• Educational tools for developers<br><br>
Explore Termux projects on GitHub.
        `;
        
        this.displayAIResponse(termuxText);
    }

    showStatus() {
        const isOnline = navigator.onLine;
        const time = new Date().toLocaleTimeString();
        const date = new Date().toLocaleDateString();
        
        let status = `
<strong>System Status:</strong><br><br>
• <strong>Network</strong>: ${isOnline ? '🟢 Online' : '🔴 Offline'}<br>
• <strong>Time</strong>: ${time}<br>
• <strong>Date</strong>: ${date}<br>
• <strong>AI Status</strong>: 🟢 Operational<br>
• <strong>GitHub API</strong>: ${window.github ? '🟢 Connected' : '🟡 Connecting...'}<br>
• <strong>PWA</strong>: ${'serviceWorker' in navigator ? '🟢 Available' : '🔴 Not available'}<br><br>
All systems ${isOnline ? 'operational' : 'limited - offline mode'}.
        `;
        
        this.displayAIResponse(status);
    }

    handleUnknownCommand(command) {
        const responses = [
            `I don't understand "${command}". Type "help" for available commands.`,
            `Command not found: "${command}". Try "help" to see what I can do.`,
            `Sorry, I don't recognize "${command}". Need help? Type "help".`,
            `Unknown command. Type "help" to see available options.`
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.displayAIResponse(randomResponse);
    }

    updateStats() {
        const updateElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        
        updateElement('aiResponses', this.responseCount);
        updateElement('aiCommands', this.commandCount);
    }

    saveHistory() {
        if (this.commandHistory.length > 50) {
            this.commandHistory = this.commandHistory.slice(-50);
        }
        localStorage.setItem('aiCommandHistory', JSON.stringify(this.commandHistory));
    }

    loadHistory() {
        const saved = localStorage.getItem('aiCommandHistory');
        if (saved) {
            this.commandHistory = JSON.parse(saved);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiTerminal = new AITerminal();
});