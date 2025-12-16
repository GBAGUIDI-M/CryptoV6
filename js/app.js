
// --- LOGIQUE APP ---
function cryptoApp() {
    return {
        // DONNÉES
        transactions: JSON.parse(localStorage.getItem('txs') || '[]'),
        settings: JSON.parse(localStorage.getItem('settings') || '{"currency":"USD", "lang":"fr", "goal": 1000, "theme": "dark"}'),
        prices: JSON.parse(localStorage.getItem('cached_prices') || '{}'),
        assets: ASSETS_CONFIG,

        // ÉTATS UX
        locked: true, pinInput: '', savedPin: localStorage.getItem('user_pin'),
        tab: 'dashboard', filterWallet: 'all', showSettings: false, showDCA: false, chartRange: 'all',
        loading: false, apiError: false, privacy: false, isDemo: false,
        viewOnly: false, syncTimer: null, autoLockTimer: null,
        swipeId: null, touchStartX: 0,

        // ANALYTICS
        fng: { value: 50, classification: 'Neutral', color: 'text-gray-500' },
        selectedCrypto: 'BTCUSDT', // TradingView symbol format

        // TOASTS
        toasts: [],

        // FIREBASE
        fbConfigInput: '', // Hidden by default for security
        showFbConfig: false,
        fbApp: null, fbUser: null, fbEmail: '', fbPass: '', fbLoading: false,

        // MODALES & FORMULAIRES
        confirmModal: { open: false, title: '', message: '', onConfirm: () => { } },
        form: { symbol: 'BNB', date: new Date().toISOString().split('T')[0], amount: '', qty: '', wallet: 'spot' },
        dcaForm: { symbol: 'BTC', currentPrice: '', newAmount: 100 },

        // DATA
        history: JSON.parse(localStorage.getItem('history') || '[]'),
        dna: null,

        init() {
            // Application du thème au démarrage
            this.setTheme(this.settings.theme || 'dark');

            // Check Shared URL
            const urlParams = new URLSearchParams(window.location.search);
            const sharedUid = urlParams.get('user');
            if (sharedUid) {
                this.viewOnly = true;
                this.initFirebase(true); // Ensure firebase is ready
                setTimeout(() => this.fbLoadPublic(sharedUid), 1000); // Wait for firebase init
            }

            if (!this.savedPin && !this.viewOnly) this.locked = true;
            else if (this.viewOnly) this.locked = false; // No lock on public view

            this.fetchData();
            setInterval(() => this.fetchData(), 120000);
            if (!this.viewOnly) setTimeout(() => this.initFirebase(true), 1000);

            // Auto-Lock Activity Listeners
            if (!this.viewOnly) {
                const reset = () => this.resetLockTimer();
                window.addEventListener('mousemove', reset);
                window.addEventListener('touchstart', reset);
                window.addEventListener('keydown', reset);
                window.addEventListener('click', reset);
                this.resetLockTimer(); // Start timer
            }

            // Watchers
            this.$watch('transactions', () => {
                localStorage.setItem('txs', JSON.stringify(this.transactions));
                this.updateCharts();
                if (!this.viewOnly && this.fbUser) {
                    clearTimeout(this.syncTimer);
                    this.syncTimer = setTimeout(() => this.fbSyncUp(true), 2000);
                }
            });
            this.$watch('settings', () => localStorage.setItem('settings', JSON.stringify(this.settings)));

            // DNA init
            this.dna = new InvestorDNA(this.transactions, this.history);

            // NOTIFICATIONS init
            this.notifSystem = new NotificationSystem();
            window.addEventListener('app-toast', (e) => {
                this.showToast(e.detail.message, e.detail.type);
            });
            // Request permission on first interaction if needed, or wait for user setting toggle

            setTimeout(() => {
                this.dna.init();
                this.takeSnapshot();
                this.updateCharts();
            }, 500);
        },

        resetLockTimer() {
            if (this.viewOnly) return;
            clearTimeout(this.autoLockTimer);
            if (!this.locked && this.savedPin) {
                this.autoLockTimer = setTimeout(() => {
                    this.locked = true;
                    this.showToast("Verrouillage automatique (inactivité)", 'info');
                }, 300000); // 5 minutes
            }
        },

        async hashPin(pin) {
            const msgBuffer = new TextEncoder().encode(pin);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        },

        // --- GESTION DES THÈMES ---
        setTheme(themeName) {
            this.settings.theme = themeName;
            const html = document.documentElement;

            // Reset des classes
            html.classList.remove('dark', 'theme-cyberpunk', 'theme-ocean', 'theme-forest');

            if (themeName === 'light') {
                // Rien à ajouter
            } else {
                html.classList.add('dark');
                if (themeName !== 'dark') {
                    html.classList.add('theme-' + themeName);
                }
            }
            this.updateCharts();
        },

        // --- GESTION DES NOTIFICATIONS ---
        showToast(message, type = 'success') {
            const id = Date.now();
            this.toasts.push({ id, message, type, visible: true });
            setTimeout(() => { this.removeToast(id); }, 3000);
        },
        removeToast(id) {
            const index = this.toasts.findIndex(t => t.id === id);
            if (index > -1) {
                this.toasts[index].visible = false;
                setTimeout(() => {
                    this.toasts = this.toasts.filter(t => t.id !== id);
                }, 300);
            }
        },

        // HELPERS
        tStart(e) { this.touchStartX = e.changedTouches[0].screenX; },
        tEnd(e, id) {
            if (this.touchStartX - e.changedTouches[0].screenX > 50) this.swipeId = id; // Swipe Left
            else this.swipeId = null;
        },
        t(key) { return TRANSLATIONS[this.settings.lang]?.[key] || key; },
        formatMoney(val) {
            if (this.privacy) return '****';
            const s = (this.settings.currency === 'USD') ? '$' : '€';
            return s + (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        async fetchData() {
            if (!this.assets) return;
            this.loading = true; this.apiError = false;
            const ids = this.assets.map(a => a.id).join(',');
            try {
                const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,eur&include_24hr_change=true`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                this.assets.forEach(a => { a.image = `https://assets.coincap.io/assets/icons/${a.symbol.toLowerCase()}@2x.png`; });
                this.prices = data;
                this.takeSnapshot();
                this.updateCharts();
                this.fetchFnG(); // Also fetch FnG
            } catch (e) {
                console.warn("API Error", e);
                this.apiError = true;
                this.showToast("Erreur API CoinGecko", 'error');
            }
            finally { this.loading = false; }
        },

        async fetchFnG() {
            try {
                const res = await fetch('https://api.alternative.me/fng/');
                const data = await res.json();
                const item = data.data[0];
                this.fng.value = item.value;
                this.fng.classification = item.value_classification;
                if (item.value < 25) this.fng.color = 'text-red-500';
                else if (item.value < 45) this.fng.color = 'text-orange-500';
                else if (item.value < 55) this.fng.color = 'text-yellow-500';
                else if (item.value < 75) this.fng.color = 'text-lime-500';
                else this.fng.color = 'text-green-500';
            } catch (e) { console.warn('FnG error', e); }
        },

        addTx() {
            if (!this.form.amount || !this.form.qty) return;
            this.transactions.push({ id: Date.now(), ...this.form, amount: parseFloat(this.form.amount), qty: parseFloat(this.form.qty) });
            this.form.amount = ''; this.form.qty = '';
            this.showToast("Transaction ajoutée !", 'success');
        },

        delTx(id) {
            this.askConfirm('Confirmer', 'Supprimer cette transaction ?', () => {
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.showToast("Transaction supprimée", 'info');
            });
        },

        // FIREBASE & SYNC
        initFirebase(silent = false) {
            try {
                if (typeof firebase === 'undefined') return;

                let config = USER_FIREBASE_CONFIG; // Default to secure constant

                // Allow override only if user provided input
                if (this.fbConfigInput && this.fbConfigInput.length > 10) {
                    try { config = JSON.parse(this.fbConfigInput); }
                    catch { config = new Function('return ' + this.fbConfigInput)(); }
                }

                if (!firebase.apps.length) this.fbApp = firebase.initializeApp(config);
                else this.fbApp = firebase.app();

                firebase.auth().onAuthStateChanged(u => this.fbUser = u);
                if (!silent) this.showToast("Firebase Prêt", 'success');
            } catch (e) { if (!silent) this.showToast("Erreur Config Firebase", 'error'); }
        },
        async fbGoogleLogin() {
            if (!this.fbApp) return;
            if (this.fbLoading) return;
            this.fbLoading = true;
            try { await firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()); this.showToast("Connexion réussie", 'success'); }
            catch (e) { if (e.code !== 'auth/cancelled-popup-request') this.showToast(e.message, 'error'); }
            this.fbLoading = false;
        },
        async fbLogin() {
            if (!this.fbApp) return this.showToast("Firebase non initialisé", 'error');
            try { await firebase.auth().signInWithEmailAndPassword(this.fbEmail, this.fbPass); this.showToast("Connexion réussie", 'success'); } catch (e) { this.showToast(e.message, 'error'); }
        },
        async fbRegister() {
            if (!this.fbApp) return this.showToast("Firebase non initialisé", 'error');
            try { await firebase.auth().createUserWithEmailAndPassword(this.fbEmail, this.fbPass); this.showToast("Compte créé !", 'success'); } catch (e) { this.showToast(e.message, 'error'); }
        },
        fbLogout() { if (this.fbApp) { firebase.auth().signOut(); this.showToast("Déconnecté", 'info'); } },
        async fbSyncUp() {
            if (!this.fbUser) return;
            this.fbLoading = true;
            try { await firebase.firestore().collection('users').doc(this.fbUser.uid).set({ transactions: this.transactions, settings: this.settings, history: this.history, date: new Date().toISOString() }); this.showToast("Sauvegarde Cloud réussie !", 'success'); } catch (e) { this.showToast(e.message, 'error'); }
            this.fbLoading = false;
        },
        async fbSyncDown() {
            if (!this.fbUser) return;
            this.fbLoading = true;
            try { const doc = await firebase.firestore().collection('users').doc(this.fbUser.uid).get(); if (doc.exists) { const data = doc.data(); this.transactions = data.transactions || []; this.settings = data.settings || this.settings; this.history = data.history || []; this.showToast("Données téléchargées !", 'success'); this.updateCharts(); } } catch (e) { this.showToast(e.message, 'error'); }
            this.fbLoading = false;
        },

        async fbLoadPublic(uid) {
            this.loading = true;
            try {
                const doc = await firebase.firestore().collection('users').doc(uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    this.transactions = data.transactions || [];
                    this.history = data.history || [];
                    // Keep local settings mostly, but maybe respect currency?
                    this.showToast("Portfolio Partagé Chargé", 'info');
                    this.updateCharts();
                    this.locked = false; // Ensure unlocked
                } else {
                    this.showToast("Lien invalide ou expiré", 'error');
                }
            } catch (e) { console.error(e); this.showToast("Erreur chargement public", 'error'); }
            this.loading = false;
        },


        // UTILS
        async unlockApp() {
            if (!this.savedPin) {
                // First time setup
                if (this.pinInput.length < 4) return this.showToast("PIN trop court", 'error');
                this.savedPin = await this.hashPin(this.pinInput);
                localStorage.setItem('user_pin', this.savedPin);
                this.locked = false;
                this.pinInput = '';
                this.resetLockTimer();
                this.showToast("PIN configuré !", 'success');
            } else {
                // Unlock
                const h = await this.hashPin(this.pinInput);

                // 1. Try Hash Match
                if (h === this.savedPin) {
                    this.locked = false;
                    this.pinInput = '';
                    this.resetLockTimer();
                    this.showToast("Déverrouillé", 'success');
                    return;
                }

                // 2. Try Legacy Match (Plain Text Migration)
                // If savedPin looks like plain text (length < 64) and matches input
                if (this.savedPin.length < 64 && this.pinInput === this.savedPin) {
                    this.locked = false;
                    this.showToast("Mise à jour sécurité PIN...", 'info');

                    // Migrate to Hash
                    this.savedPin = h;
                    localStorage.setItem('user_pin', h);

                    this.pinInput = '';
                    this.resetLockTimer();
                    return;
                }

                this.showToast("PIN Incorrect", 'error');
                this.pinInput = '';
            }
        },
        checkPriceAlerts() {
            if (!this.notifSystem) return;
            // Simple Threshold Logic for Demo: Alert if BTC moves significantly (mock)
            // In real app: compare current price vs stored previous price

            // For MVP demo, let's just trigger a welcome notification if permission not granted yet
            if (Notification.permission === 'default') {
                // this.notifSystem.requestPermission(); // Don't force without user action
            }
        },
        testAlert() {
            this.notifSystem.notify('Test Alerte', 'Ceci est une notification de test', 'info');
        },
        toggleCurrency() { this.settings.currency = this.settings.currency === 'USD' ? 'EUR' : 'USD'; this.fetchData(); },
        toggleLang() { this.settings.lang = this.settings.lang === 'fr' ? 'en' : 'fr'; },
        togglePriv() { this.privacy = !this.privacy; },
        editGoal() { const newGoal = prompt("Nouvel Objectif :", this.settings.goal); if (newGoal && !isNaN(newGoal)) this.settings.goal = parseFloat(newGoal); },
        askConfirm(title, message, callback) { this.confirmModal.title = title; this.confirmModal.message = message; this.confirmModal.onConfirm = () => { callback(); this.confirmModal.open = false; }; this.confirmModal.open = true; },
        triggerReset() { this.askConfirm('Reset', 'Tout effacer ?', () => { localStorage.clear(); location.reload(); }); },
        triggerDemo() {
            this.askConfirm('Demo', 'Charger données démo ?', () => {
                const today = new Date().toISOString().split('T')[0];
                this.isDemo = true;
                this.transactions = [{ id: 1, symbol: 'BTC', date: '2024-01-01', amount: 500, qty: 0.012, wallet: 'spot' }, { id: 2, symbol: 'ETH', date: '2024-02-15', amount: 300, qty: 0.12, wallet: 'spot' }];
                this.history = []; for (let i = 30; i >= 0; i--) { let d = new Date(); d.setDate(d.getDate() - i); this.history.push({ date: d.toISOString().split('T')[0], value: 1000 + Math.random() * 200 + (30 - i) * 10, invested: 950 + (30 - i) * 5 }); }
                this.showSettings = false; this.confirmModal.open = false;
                setTimeout(() => {
                    this.updateCharts();
                    if (this.dna) this.dna.init(); // Refresh DNA
                    this.showToast("Mode Démo Activé", 'info');
                }, 100);
            });
        },
        disableDemo() {
            this.askConfirm('Démo', 'Quitter le mode démo (Reset) ?', () => {
                this.isDemo = false;
                this.transactions = [];
                this.history = [];
                localStorage.removeItem('txs');
                localStorage.removeItem('history');
                this.showSettings = false; this.confirmModal.open = false;
                setTimeout(() => {
                    this.updateCharts();
                    location.reload(); // Safer to reload to clean state
                }, 100);
            });
        },

        // GETTERS
        get portfolio() {
            if (!this.assets) return [];
            const cur = this.settings.currency.toLowerCase();
            let relevantTxs = this.transactions;
            if (this.filterWallet !== 'all') relevantTxs = relevantTxs.filter(t => t.wallet === this.filterWallet);
            return this.assets.map(a => {
                const txs = relevantTxs.filter(t => t.symbol === a.symbol);
                if (txs.length === 0) return null;
                const qty = txs.reduce((s, t) => s + parseFloat(t.qty), 0);
                const inv = txs.reduce((s, t) => s + parseFloat(t.amount), 0);
                const price = this.prices[a.id]?.[cur] || 0;
                return { ...a, totalQty: qty, totalInvested: inv, currentPrice: price, currentValue: qty * price, pnl: (qty * price) - inv };
            }).filter(x => x);
        },
        get totalVal() { return this.portfolio.reduce((s, i) => s + i.currentValue, 0); },
        get totalInv() { return this.portfolio.reduce((s, i) => s + i.totalInvested, 0); },
        get totalPnL() { return this.totalVal - this.totalInv; },
        get progressPercent() { return Math.min((this.totalVal / this.settings.goal) * 100, 100); },
        get dcaSimulation() {
            if (!this.assets) return { currentAvg: 0, newAvg: 0, currentPrice: 0, simPrice: 0, changePct: 0, owned: false };
            const assetConfig = this.assets.find(a => a.symbol === this.dcaForm.symbol);
            const curCode = this.settings.currency.toLowerCase();
            const livePrice = (this.prices[assetConfig?.id]?.[curCode]) || 0;
            const simPrice = parseFloat(this.dcaForm.currentPrice) || livePrice;
            const globalTxs = this.transactions.filter(t => t.symbol === this.dcaForm.symbol);
            const currentInvested = globalTxs.reduce((s, t) => s + parseFloat(t.amount), 0);
            const currentQty = globalTxs.reduce((s, t) => s + parseFloat(t.qty), 0);
            const currentAvg = currentQty > 0 ? currentInvested / currentQty : 0;
            const newInvested = parseFloat(this.dcaForm.newAmount) || 0;
            const newQty = simPrice > 0 ? newInvested / simPrice : 0;
            const finalAvg = (currentQty + newQty) > 0 ? (currentInvested + newInvested) / (currentQty + newQty) : 0;
            let changePct = 0;
            if (currentAvg > 0) changePct = ((finalAvg - currentAvg) / currentAvg) * 100;
            return { currentAvg, newAvg: finalAvg, currentPrice: livePrice, simPrice, changePct, owned: currentQty > 0 };
        },

        // TOUCH & SWIPE
        tStart(e) {
            this.touchStartX = e.changedTouches[0].screenX;
        },
        tEnd(e, id) {
            const endX = e.changedTouches[0].screenX;
            const diff = this.touchStartX - endX;
            // Swipe Left (> 50px) to Show Delete Overlay
            if (diff > 50) this.swipeId = id;
            // Swipe Right or Tap (< 10px diff or negative) to Cancel
            else if (diff < -50 || Math.abs(diff) < 10) this.swipeId = null;
        },

        // EXPORT/IMPORT
        exportCSV() {
            let csvContent = "data:text/csv;charset=utf-8,Date,Symbol,Type,Amount,Qty\n";
            this.transactions.forEach(t => { csvContent += `${t.date},${t.symbol},BUY,${t.amount},${t.qty}\n`; });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "crypto_transactions.csv");
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            this.showToast("Export CSV généré", 'success');
        },
        exportJSON() {
            const data = { transactions: this.transactions, history: this.history, settings: this.settings };
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'crypto_backup.json'; a.click();
            this.showToast("Export JSON généré", 'success');
        },
        triggerImport() { document.getElementById('jsonInput').click(); },
        handleImport(e) {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = JSON.parse(evt.target.result);
                    if (data.transactions) this.transactions = data.transactions;
                    if (data.history) this.history = data.history;
                    if (data.settings) this.settings = data.settings;
                    localStorage.setItem('txs', JSON.stringify(this.transactions));
                    location.reload();
                } catch (e) { this.showToast("Fichier invalide", 'error'); }
            }; reader.readAsText(file);
        },

        // CHARTS
        takeSnapshot() {
            if (this.totalVal === 0) return;
            const today = new Date().toISOString().split('T')[0];
            const idx = this.history.findIndex(h => h.date === today);
            const snap = { date: today, value: this.totalVal, invested: this.totalInv };
            if (idx >= 0) this.history[idx] = snap; else this.history.push(snap);
            localStorage.setItem('history', JSON.stringify(this.history));
        },
        updateCharts() {
            // DELEGATION to window.charts
            if (window.charts) {
                window.charts.update(this.portfolio, this.history, this.settings, this.chartRange, this.sectors);
            }
        },

        openChart(symbol) {
            this.selectedCrypto = symbol.toUpperCase() + (this.settings.currency === 'USD' ? 'USDT' : 'EUR');
            this.tab = 'analytics';
            setTimeout(() => {
                const el = document.getElementById('tradingview_container');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        },

        initTradingView() {
            if (typeof TradingView === 'undefined') return;
            const container = document.getElementById('tradingview_container');
            if (!container) return;
            container.innerHTML = '';

            new TradingView.widget({
                "autosize": true,
                "symbol": "BINANCE:" + this.selectedCrypto,
                "interval": "D",
                "timezone": "Etc/UTC",
                "theme": this.settings.theme === 'light' ? 'light' : 'dark',
                "style": "1", // 1 = Candles
                "locale": this.settings.lang,
                "toolbar_bg": "#f1f3f6",
                "enable_publishing": false,
                "allow_symbol_change": true,
                "hide_side_toolbar": false,
                "container_id": "tradingview_container"
            });
        },

        get sectors() {
            if (!this.portfolio.length) return [];
            const map = {};
            this.portfolio.forEach(p => {
                const cat = p.category || 'Autres';
                if (!map[cat]) map[cat] = 0;
                map[cat] += p.currentValue;
            });
            // Convert to array sorted by value desc
            return Object.keys(map).map(k => ({ label: k, value: map[k] })).sort((a, b) => b.value - a.value);
        },

        get indicators() {
            if (this.history.length < 2) return { volatility: 0, projection: 0, risk: { label: 'Inconnu', color: 'text-gray-500' } };

            // 1. VOLATILITY (StdDev of Daily Returns)
            const returns = [];
            for (let i = 1; i < this.history.length; i++) {
                const valPrev = this.history[i - 1].value;
                const valCurr = this.history[i].value;
                if (valPrev > 0) returns.push((valCurr - valPrev) / valPrev);
            }
            if (!returns.length) return { volatility: 0, projection: 0, risk: { label: 'Inconnu', color: 'text-gray-500' } };

            const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
            const stdDev = Math.sqrt(variance);
            const volatility = (stdDev * 100).toFixed(2); // In %

            // 2. LINEAR REGRESSION for PROJECTION (Next Step)
            // x = index, y = value
            const n = this.history.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            for (let i = 0; i < n; i++) {
                const x = i;
                const y = this.history[i].value;
                sumX += x;
                sumY += y;
                sumXY += x * y;
                sumXX += x * x;
            }
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            const nextX = n; // Predict for next period
            const projection = (slope * nextX + intercept).toFixed(2);

            // 3. RISK ASSESSMENT
            let risk = { label: 'Faible', color: 'text-green-500' };
            if (stdDev > 0.03) risk = { label: 'Élevé', color: 'text-red-500' };
            else if (stdDev > 0.01) risk = { label: 'Modéré', color: 'text-orange-500' };

            return { volatility, projection, risk };
        }

    }
}
