// Main Application Script
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initMobileMenu();
    initThemeToggle();
    initSmoothScroll();
    initContactForm();
    initTerminal();
    updateCurrentYear();
    
    console.log('DNYF TETCH website initialized');
});

// Mobile Menu Toggle
function initMobileMenu() {
    const toggle = document.getElementById('navbarToggle');
    const menu = document.getElementById('navbarMenu');
    
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            toggle.innerHTML = menu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                toggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
}

// Theme Toggle
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    
    if (toggle) {
        toggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            toggle.innerHTML = `<i class="fas fa-${newTheme === 'dark' ? 'moon' : 'sun'}"></i>`;
            localStorage.setItem('theme', newTheme);
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            toggle.innerHTML = `<i class="fas fa-${savedTheme === 'dark' ? 'moon' : 'sun'}"></i>`;
        }
    }
}

// Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Contact Form
function initContactForm() {
    const form = document.getElementById('contactForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Show success message
            showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
            
            // Reset form
            form.reset();
            
            // In a real app, you would send this to a server
            console.log('Contact form submitted:', data);
        });
    }
}

// Terminal Animation
function initTerminal() {
    const terminal = document.getElementById('terminalOutput');
    if (!terminal) return;
    
    const commands = [
        { cmd: 'whoami', out: 'dnyf_tetch' },
        { cmd: 'pwd', out: '/home/dnyf/research' },
        { cmd: 'ls -la', out: 'total 24\n[AI Research] [Android Projects]\n[Termux Tools] [Server Configs]' },
        { cmd: 'cd ai-research', out: '' },
        { cmd: 'git status', out: 'On branch main\nYour branch is up to date.' },
        { cmd: 'echo "Welcome to DNYF TETCH"', out: 'Welcome to DNYF TETCH' }
    ];
    
    let output = '';
    let delay = 100;
    
    commands.forEach((item, index) => {
        setTimeout(() => {
            output += `<div class="terminal-line"><span class="prompt">$</span> <span class="command">${item.cmd}</span></div>`;
            if (item.out) {
                output += `<div class="terminal-line output">${item.out}</div>`;
            }
            terminal.innerHTML = output;
            terminal.scrollTop = terminal.scrollHeight;
        }, delay);
        
        delay += 300;
    });
    
    // Add blinking cursor
    setTimeout(() => {
        output += `<div class="terminal-line"><span class="prompt">$</span> <span class="command"></span><span class="blinking-cursor">█</span></div>`;
        terminal.innerHTML = output;
    }, delay);
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Update Current Year
function updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// GitHub Button
const viewGitHubBtn = document.getElementById('viewGitHub');
if (viewGitHubBtn) {
    viewGitHubBtn.addEventListener('click', () => {
        window.open('https://github.com/dnyftetch', '_blank');
    });
}

// Loading Overlay
window.addEventListener('load', () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }, 1000);
    }
});
