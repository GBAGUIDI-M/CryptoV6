class NotificationSystem {
    constructor() {
        this.permission = Notification.permission;
        this.queue = [];
        this.maxDaily = 5; // Anti-spam limit
        this.sentCount = 0;
    }

    async requestPermission() {
        if (!('Notification' in window)) return false;
        const p = await Notification.requestPermission();
        this.permission = p;
        return p === 'granted';
    }

    // Main entry point
    notify(title, body, type = 'info', priority = 'low') {
        const options = {
            body: body,
            icon: 'assets/icon.png',
            badge: 'assets/icon.png',
            tag: 'crypto-station-' + type,
            timestamp: Date.now()
        };

        // 1. In-App Toast (Always)
        this.showToast(title, body, type);

        // 2. Browser Notification (If granted & criteria met)
        if (this.permission === 'granted' && this.shouldNotify(priority)) {
            try {
                new Notification(title, options);
                this.sentCount++;
            } catch (e) {
                console.warn("Notification failed", e);
            }
        }
    }

    shouldNotify(priority) {
        // High priority always goes through
        if (priority === 'high') return true;

        // Anti-spam for others
        if (this.sentCount >= this.maxDaily) return false;

        return true;
    }

    showToast(title, body, type) {
        // Dispatch event for Alpine / App.js to handle UI
        window.dispatchEvent(new CustomEvent('app-toast', {
            detail: { title, message: body, type }
        }));
    }

    // CHECKERS
    checkDCA(dcaForm, settings) {
        // Simple mock check
        // Real implementation would check dates against storage
    }
}
