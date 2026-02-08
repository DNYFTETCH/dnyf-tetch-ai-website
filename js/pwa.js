// PWA Functionality for DNYF TETCH Website
class PWAHandler {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.pwaPrompt = null;
        this.isPWA = window.matchMedia('(display-mode: standalone)').matches;
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.checkConnection();
        this.registerServiceWorker();
    }

    cacheElements() {
        this.installButton = document.getElementById('installPWA');
        this.headerInstallBtn = document.getElementById('headerInstallBtn');
        this.pwaPrompt = document.getElementById('pwaPrompt');
        this.closePWA = document.getElementById('closePWA');
        this.dismissPWA = document.getElementById('dismissPWA');
        this.pwaStatus = document.getElementById('pwaStatus');
        this.offlineIndicator = document.getElementById('offlineIndicator');
        this.updateStatus = document.getElementById('updateStatus');
    }

    bindEvents() {
        // Before install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPromotion();
        });

        // App installed
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            this.hideInstallPromotion();
            this.showNotification('App installed successfully!', 'success');
        });

        // Install button click
        if (this.installButton) {
            this.installButton.addEventListener('click', () => this.installPWA());
        }

        if (this.headerInstallBtn) {
            this.headerInstallBtn.addEventListener('click', () => this.installPWA());
        }

        // Close/dismiss prompt
        if (this.closePWA) {
            this.closePWA.addEventListener('click', () => this.hideInstallPromotion());
        }

        if (this.dismissPWA) {
            this.dismissPWA.addEventListener('click', () => this.hideInstallPromotion());
        }

        // Online/offline events
        window.addEventListener('online', () => this.updateConnectionStatus(true));
        window.addEventListener('offline', () => this.updateConnectionStatus(false));

        // Service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                this.showUpdateNotification();
            });
        }
    }

    showInstallPromotion() {
        if (this.isPWA) return;
        
        // Show after 10 seconds
        setTimeout(() => {
            if (this.pwaPrompt && !localStorage.getItem('pwaPromptDismissed')) {
                this.pwaPrompt.classList.add('show');
            }
        }, 10000);

        // Show install button in header
        if (this.headerInstallBtn) {
            this.headerInstallBtn.style.display = 'flex';
        }
    }

    hideInstallPromotion() {
        if (this.pwaPrompt) {
            this.pwaPrompt.classList.remove('show');
            localStorage.setItem('pwaPromptDismissed', 'true');
        }
    }

    async installPWA() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        this.deferredPrompt = null;
        this.hideInstallPromotion();
    }

    checkConnection() {
        const isOnline = navigator.onLine;
        this.updateConnectionStatus(isOnline);
    }

    updateConnectionStatus(isOnline) {
        if (this.offlineIndicator) {
            if (!isOnline) {
                this.offlineIndicator.classList.add('show');
                this.showNotification('You are now offline. Some features may be limited.', 'warning');
            } else {
                this.offlineIndicator.classList.remove('show');
                this.showNotification('You are back online!', 'success');
            }
        }

        if (this.updateStatus) {
            this.updateStatus.textContent = isOnline ? 
                'Auto-synced with GitHub' : 
                'Offline - using cached data';
        }
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });

            // Check for updates every hour
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);

            console.log('Service Worker registered:', registration);
            
            if (this.pwaStatus) {
                this.pwaStatus.innerHTML = '<i class="fas fa-check-circle"></i> PWA Ready';
            }
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            
            if (this.pwaStatus) {
                this.pwaStatus.innerHTML = '<i class="fas fa-times-circle"></i> PWA Not Available';
            }
        }
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <i class="fas fa-sync-alt"></i>
                <div>
                    <h4>Update Available</h4>
                    <p>A new version is available. Refresh to update.</p>
                </div>
                <button class="btn-primary" id="refreshApp">Refresh</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Refresh button
        notification.querySelector('#refreshApp').addEventListener('click', () => {
            window.location.reload();
        });
        
        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 30000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `pwa-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Add to home screen for iOS
    showiOSInstallInstructions() {
        if (this.isIOS() && !this.isPWA) {
            const iosInstructions = document.createElement('div');
            iosInstructions.className = 'ios-instructions';
            iosInstructions.innerHTML = `
                <div class="ios-content">
                    <h4>Install this App</h4>
                    <p>Tap <i class="fas fa-share"></i> then "Add to Home Screen"</p>
                    <button class="btn-secondary" id="closeIOS">Got it</button>
                </div>
            `;
            
            document.body.appendChild(iosInstructions);
            
            iosInstructions.querySelector('#closeIOS').addEventListener('click', () => {
                iosInstructions.remove();
                localStorage.setItem('iosInstructionsShown', 'true');
            });
            
            // Auto-dismiss after 15 seconds
            setTimeout(() => {
                if (iosInstructions.parentNode) {
                    iosInstructions.remove();
                }
            }, 15000);
        }
    }

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pwaHandler = new PWAHandler();
});