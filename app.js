// app.js - Logique de l'application (V13.9 - UX Fix)

function cryptoApp() {
    return {
        // --- DONNÉES ---
        transactions: JSON.parse(localStorage.getItem('txs') || '[]'),
        settings: JSON.parse(localStorage.getItem('settings') || '{"currency":"USD", "lang":"fr", "goal": 1000}'),
        prices: JSON.parse(localStorage.getItem('cached_prices') || '{}'),
        assets: ASSETS_CONFIG,

        // --- ÉTATS ---
        locked: true,
        pinInput: '',
        savedPin: localStorage.getItem('user_pin'),
        tab: 'dashboard',
        filterWallet: 'all',
        showSettings: false,
        showDCA: false,
        chartRange: 'all',

        darkMode: localStorage.getItem('theme') !== 'light',

        loading: false,
        apiError: false,
        privacy: false,
        chartPie: null,
        chartLine: null,

        // Firebase States
        fbConfigInput: JSON.stringify(USER_FIREBASE_CONFIG, null, 2),
        fbApp: null, fbUser: null, fbEmail: '', fbPass: '', fbLoading: false,
        isSyncing: false, saveTimeout: null, // Auto-Sync States

        // Modales & Formulaires
        confirmModal: { open: false, title: '', message: '', onConfirm: () => { } },
        form: { symbol: 'BNB', date: new Date().toISOString().split('T')[0], amount: '', qty: '', wallet: 'spot' },
        dcaForm: { symbol: 'BTC', currentPrice: '', newAmount: 100 },

        // Indicateurs
        volatility: 0,
        projection: 0,
        riskLevel: 'Low',
        history: JSON.parse(localStorage.getItem('history') || '[]'),

        // --- INITIALISATION ---
        init() {
            if (this.darkMode) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');

            if (!this.savedPin) this.locked = true;

            this.fetchData();
            setInterval(() => this.fetchData(), 120000);

            setTimeout(() => this.initFirebase(true), 1000);

            // Sauvegardes
            this.$watch('transactions', () => {
                localStorage.setItem('txs', JSON.stringify(this.transactions));
                this.updateCharts();
                this.autoSave();
            });
            this.$watch('settings', () => {
                localStorage.setItem('settings', JSON.stringify(this.settings));
                this.autoSave();
            });
            this.$watch('prices', () => localStorage.setItem('cached_prices', JSON.stringify(this.prices)));
            // Watch history for manual edits if any, or just consistent saving
            this.$watch('history', () => {
                localStorage.setItem('history', JSON.stringify(this.history));
                this.autoSave();
            });

            setTimeout(() => {
                this.takeSnapshot();
                this.updateCharts();
            }, 500);
        },

        // --- HELPERS ---
        t(key) { return TRANSLATIONS[this.settings.lang]?.[key] || key; },

        formatMoney(val) {
            if (this.privacy) return '****';
            const s = (this.settings.currency === 'USD') ? '$' : '€';
            return s + (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        // --- FEATURES ---
        toggleTheme() {
            this.darkMode = !this.darkMode;
            if (this.darkMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            this.updateCharts();
        },

        async fetchData() {
            if (!this.assets) return;
            this.loading = true; this.apiError = false;
            const ids = this.assets.map(a => a.id).join(',');
            try {
                const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,eur&include_24hr_change=true`);
                if (!res.ok) throw new Error();
                const data = await res.json();

                // Images via CoinCap
                this.assets.forEach(a => {
                    a.image = `https://assets.coincap.io/assets/icons/${a.symbol.toLowerCase()}@2x.png`;
                });

                this.prices = data;
                this.takeSnapshot();
                this.calculateMetrics();
                this.updateCharts();
            } catch (e) {
                console.warn("API Error", e);
                this.apiError = true;
            }
            finally { this.loading = false; }
        },

        // --- ACTIONS ---
        addTx() {
            // Validation
            if (!this.form.amount || !this.form.qty) {
                // Pas d'alerte bloquante, juste un retour
                return;
            }

            this.transactions.push({
                id: Date.now(),
                ...this.form,
                amount: parseFloat(this.form.amount),
                qty: parseFloat(this.form.qty)
            });

            // RESET COMPLET POUR ENCHAINER
            this.form.amount = '';
            this.form.qty = '';
            // On garde la date et le symbole pour faciliter la saisie multiple
        },

        delTx(id) {
            this.askConfirm('Confirmer', 'Supprimer cette transaction ?', () => {
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.confirmModal.open = false;
            });
        },

        // ... (Reste des fonctions: initFirebase, login, logout, sync, charts...)
        initFirebase(silent = false) {
            try {
                let config = null;
                try { config = JSON.parse(this.fbConfigInput); }
                catch { config = new Function('return ' + this.fbConfigInput)(); }

                if (!firebase.apps.length) {
                    this.fbApp = firebase.initializeApp(config);
                    console.log("Firebase Initialized with config:", config);
                } else {
                    this.fbApp = firebase.app();
                    console.log("Firebase App already initialized");
                }

                firebase.auth().onAuthStateChanged(async u => {
                    this.fbUser = u;
                    console.log("Auth State Changed:", u ? "User Logged In" : "User Logged Out", u);
                    if (u) {
                        // Auto-load on login (silent)
                        await this.fbSyncDown(true);
                    }
                });

                if (!silent) alert("Firebase Initialisé avec succès !");
            } catch (e) {
                console.error("Firebase Init Error:", e);
                if (!silent) alert("Erreur Init Firebase: " + e.message);
            }
        },

        autoSave() {
            if (!this.fbUser || this.isSyncing) return;

            // Debounce: Wait 2s after last change
            if (this.saveTimeout) clearTimeout(this.saveTimeout);

            this.saveTimeout = setTimeout(() => {
                console.log("Auto-saving...");
                this.fbSyncUp(true); // Silent save
            }, 2000);
        },

        async fbLogin() {
            if (!this.fbApp) return alert("Firebase non initialisé");
            try {
                await firebase.auth().signInWithEmailAndPassword(this.fbEmail, this.fbPass);
                alert("Connexion réussie !");
            } catch (e) {
                console.error("Login Error:", e);
                alert("Erreur Connexion (" + e.code + "): " + e.message);
            }
        },
        async fbRegister() {
            if (!this.fbApp) return alert("Firebase non initialisé");
            try {
                await firebase.auth().createUserWithEmailAndPassword(this.fbEmail, this.fbPass);
                alert("Compte créé avec succès !");
            } catch (e) {
                console.error("Register Error:", e);
                alert("Erreur Inscription (" + e.code + "): " + e.message);
            }
        },
        fbLogout() { if (this.fbApp) firebase.auth().signOut(); },
        async fbSyncUp(silent = false) {
            // 1. Check Offline status first
            if (!navigator.onLine) {
                if (!silent) alert("Erreur : Vous êtes hors ligne. Vérifiez votre connexion internet.");
                return;
            }

            // 2. Vérification de la connexion Firebase
            if (!this.fbUser) {
                if (!silent) alert("Erreur : Vous n'êtes pas connecté. Veuillez vous reconnecter via l'onglet Cloud.");
                return;
            }

            console.log("Début sauvegarde pour UID:", this.fbUser.uid);
            this.fbLoading = true;

            try {
                // 3. Timeout de sécurité (15s)
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Délai d'attente dépassé (15s). Le réseau est trop lent.")), 15000));

                // 4. Envoi des données avec course contre le timeout
                await Promise.race([
                    firebase.firestore().collection('users').doc(this.fbUser.uid).set({
                        transactions: this.transactions,
                        history: this.history,
                        settings: this.settings,
                        lastUpdated: new Date().toISOString()
                    }),
                    timeout
                ]);

                if (!silent) alert("✅ Sauvegarde sur le Cloud réussie !");
                else this.showToast("Sauvegarde Auto : OK", "success");

            } catch (e) {
                console.error("Erreur Upload:", e);
                if (!silent) {
                    if (e.code === 'permission-denied') {
                        alert("Erreur Permission : Vérifiez les Règles dans la Console Firebase.");
                    } else if (e.code === 'unavailable' || e.message.includes('offline')) {
                        alert("Erreur Réseau : Le client est hors ligne.");
                    } else {
                        alert("Erreur Sauvegarde : " + e.message);
                    }
                }
            } finally {
                this.fbLoading = false;
            }
        },

        async fbSyncDown(silent = false) {
            if (!navigator.onLine) {
                if (!silent) alert("Erreur : Vous êtes hors ligne.");
                return;
            }
            if (!this.fbUser) {
                if (!silent) alert("Erreur : Vous n'êtes pas connecté.");
                return;
            }

            this.fbLoading = true;
            this.isSyncing = true; // Prevent watchers from triggering autoSave during load

            try {
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Délai d'attente dépassé (15s).")), 15000));

                const doc = await Promise.race([
                    firebase.firestore().collection('users').doc(this.fbUser.uid).get(),
                    timeout
                ]);

                if (doc.exists) {
                    const data = doc.data();

                    // Mise à jour sécurisée des données
                    this.transactions = data.transactions || [];
                    this.history = data.history || [];

                    if (data.settings) {
                        this.settings = { ...this.settings, ...data.settings };
                    }

                    this.save(); // Sauvegarde locale
                    this.updateCharts(); // Rafraîchir les graphiques

                    if (!silent) alert("✅ Données téléchargées avec succès !");
                    else this.showToast("Sync Cloud : Données chargées", "info");

                } else {
                    if (!silent) alert("⚠️ Aucune sauvegarde trouvée pour ce compte.");
                }
            } catch (e) {
                console.error("Erreur Download:", e);
                if (!silent) {
                    if (e.code === 'unavailable' || e.message.includes('offline')) {
                        alert("Erreur Réseau : Impossible de joindre le serveur.");
                    } else {
                        alert("Erreur Téléchargement : " + e.message);
                    }
                }
            } finally {
                this.fbLoading = false;
                // Cooldown to avoid immediate save triggering
                setTimeout(() => this.isSyncing = false, 500);
            }
        },
        unlockApp() {
            if (!this.savedPin) { if (this.pinInput.length >= 4) { localStorage.setItem('user_pin', this.pinInput); this.savedPin = this.pinInput; this.locked = false; } } else { if (this.pinInput === this.savedPin) { this.locked = false; this.updateCharts(); } else { alert('Code PIN Incorrect'); this.pinInput = ''; } }
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
                this.transactions = [{ id: 1, symbol: 'BTC', date: '2024-01-01', amount: 500, qty: 0.012, wallet: 'spot' }, { id: 2, symbol: 'ETH', date: '2024-02-15', amount: 300, qty: 0.12, wallet: 'spot' }];
                this.history = []; for (let i = 30; i >= 0; i--) { let d = new Date(); d.setDate(d.getDate() - i); this.history.push({ date: d.toISOString().split('T')[0], value: 1000 + Math.random() * 200 + (30 - i) * 10, invested: 950 + (30 - i) * 5 }); }
                this.save(); this.showSettings = false; this.confirmModal.open = false;
                setTimeout(() => { this.calculateMetrics(); this.updateCharts(); }, 100);
            });
        },
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
        exportJSON() {
            const data = { transactions: this.transactions, history: this.history, settings: this.settings };
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'crypto_backup.json'; a.click();
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
                    this.save();
                    this.autoSave(); // Trigger auto-save to cloud if needed (optional here, but good for sync)
                    location.reload();
                } catch (e) { alert("Fichier invalide"); }
            }; reader.readAsText(file);
        },
        takeSnapshot() {
            if (this.totalVal === 0) return;
            const today = new Date().toISOString().split('T')[0];
            const idx = this.history.findIndex(h => h.date === today);
            const snap = { date: today, value: this.totalVal, invested: this.totalInv };
            if (idx >= 0) this.history[idx] = snap; else this.history.push(snap);
            localStorage.setItem('history', JSON.stringify(this.history));
        },
        calculateMetrics() { /* Simplifié pour modularité */ },
        updateCharts() {
            if (!this.portfolio.length) return;
            const isDark = document.documentElement.classList.contains('dark');
            const color = isDark ? '#9ca3af' : '#4b5563';
            const ctxPie = document.getElementById('chartPie');
            if (ctxPie) {
                if (this.chartPie) this.chartPie.destroy();
                this.chartPie = new Chart(ctxPie, {
                    type: 'doughnut',
                    data: { labels: this.portfolio.map(i => i.symbol), datasets: [{ data: this.portfolio.map(i => i.currentValue), backgroundColor: this.portfolio.map(i => i.color), borderWidth: 0 }] },
                    options: { plugins: { legend: { display: false } } }
                });
            }
            const ctxLine = document.getElementById('chartLine');
            if (ctxLine && this.history.length) {
                if (this.chartLine) this.chartLine.destroy();
                this.chartLine = new Chart(ctxLine, {
                    type: 'line',
                    data: {
                        labels: this.history.map(h => h.date),
                        datasets: [{ label: 'Valeur', data: this.history.map(h => h.value), borderColor: '#6366f1', tension: 0.3 }]
                    },
                    options: { scales: { x: { display: false }, y: { grid: { color: isDark ? '#374151' : '#e5e7eb' }, ticks: { color } } }, plugins: { legend: { display: false } } }
                });
            }
        },
        save() { localStorage.setItem('txs', JSON.stringify(this.transactions)); }
    }
}