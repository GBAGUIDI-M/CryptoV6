class InvestorDNA {
    constructor(transactions, history) {
        this.transactions = transactions;
        this.history = history;
        this.scores = {
            impulsivity: 50,
            discipline: 50,
            riskTolerance: 50,
            emotionalExposure: 50
        };
        this.fngHistory = JSON.parse(localStorage.getItem('fng_history') || '[]');
        this.profile = {
            archetype: 'Inconnu',
            description: 'En attente de données...',
            color: 'text-gray-500'
        };
        this.snapshots = JSON.parse(localStorage.getItem('dna_snapshots') || '[]');
        this.coachMessages = [];
    }

    async init() {
        if (this.fngHistory.length === 0 || this.isFngStale()) {
            await this.fetchFngHistory();
        }
        this.analyze();
    }

    isFngStale() {
        const last = this.fngHistory[0];
        if (!last) return true;
        const today = new Date().toISOString().split('T')[0];
        // API returns timestamp, check if recent enough (e.g. 1 day old)
        return (Date.now() - last.timestamp * 1000) > 86400000;
    }

    async fetchFngHistory() {
        try {
            // Limit 0 gets all avail data
            const res = await fetch('https://api.alternative.me/fng/?limit=0');
            const data = await res.json();
            if (data.data) {
                this.fngHistory = data.data; // { value, value_classification, timestamp }
                localStorage.setItem('fng_history', JSON.stringify(this.fngHistory));
            }
        } catch (e) {
            console.warn("DNA: Failed to fetch F&G history", e);
        }
    }

    analyze() {
        if (!this.transactions || this.transactions.length < 2) return;

        this.calculateImpulsivity();
        this.calculateDiscipline();
        this.calculateRisk();
        this.calculateEmotion();

        this.determineProfile();
        this.generateCoachMessages();
        this.saveSnapshot();
    }

    saveSnapshot() {
        const today = new Date().toISOString().split('T')[0];
        const lastSnap = this.snapshots[this.snapshots.length - 1];

        // Avoid duplicates for same day
        if (lastSnap && lastSnap.date === today) return;

        const snapshot = {
            date: today,
            profile: this.profile.archetype,
            scores: { ...this.scores }
        };

        this.snapshots.push(snapshot);
        // Keep last 30 snapshots only to save space
        if (this.snapshots.length > 30) this.snapshots.shift();

        localStorage.setItem('dna_snapshots', JSON.stringify(this.snapshots));
    }

    // 1. IMPULSIVITY: Frequency of trades & panic moves
    calculateImpulsivity() {
        // Simple metric: Avg time between trades
        // Less time = Higher Impulsivity
        const sorted = [...this.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        let totalDiff = 0;
        for (let i = 1; i < sorted.length; i++) {
            const d1 = new Date(sorted[i - 1].date);
            const d2 = new Date(sorted[i].date);
            totalDiff += (d2 - d1) / (1000 * 3600 * 24); // Days
        }
        const avgDays = totalDiff / (sorted.length - 1);

        // Scale: 1 day avg = 100 impulsivity, 30 days = 0
        this.scores.impulsivity = Math.max(0, Math.min(100, 100 - (avgDays * 3.3)));
    }

    // 2. DISCIPLINE: Regularity (DCA-like) & Holding
    calculateDiscipline() {
        // Check standard deviation of trade intervals (Regularity)
        // Check "HODL" behavior (selling quickly after buy?)
        // For MVP: Inverse of Impulsivity + Bonus for "No Sells"
        const sells = this.transactions.filter(t => t.qty < 0 || t.type === 'SELL'); // Assuming negative qty or type
        const sellRatio = sells.length / this.transactions.length;

        let score = (1 - sellRatio) * 100;
        this.scores.discipline = score;
    }

    // 3. RISK TOLERANCE: Volatility of portfolio vs Stablecoins
    calculateRisk() {
        // Simplified: Based on asset types (if we had categories)
        // Or history volatility
        // Let's use the volatility computed in app.js if available, or recompute
        // Here we use a heuristic based on transaction count and variety
        const symbols = new Set(this.transactions.map(t => t.symbol)).size;
        // More symbols = Diversification = Lower Risk? Or Higher exposure?
        // Let's say Diversification reduces risk score (0 = High Risk/Concentrated)

        // Actually "Risk Tolerance" usually means "How much risk I TAKE".
        // High Tolerance = High Volatility Portfolio.
        // Let's mock it for now based on 'BTC' vs others presence
        const hasHighRisk = this.transactions.some(t => !['BTC', 'ETH', 'USDT', 'USDC'].includes(t.symbol));
        this.scores.riskTolerance = hasHighRisk ? 75 : 30;
    }

    // 4. EMOTIONAL EXPOSURE: Buying at Greed / Selling at Fear
    calculateEmotion() {
        if (!this.fngHistory.length) return;

        let emotionalMoves = 0;
        let counted = 0;

        this.transactions.forEach(tx => {
            const txDate = new Date(tx.date).setHours(0, 0, 0, 0);
            // Find closest F&G
            const fng = this.fngHistory.find(f => {
                const fDate = new Date(f.timestamp * 1000).setHours(0, 0, 0, 0);
                return fDate === txDate;
            });

            if (fng) {
                const val = parseInt(fng.value);
                // BUYING when GREED (>70) = FOMO (Emotional)
                // SELLING when FEAR (<30) = PANIC (Emotional)
                // Note: we assume all transactions are BUYs for now unless we check type/qty
                // In V15 logic, check logic of addTx (qty positive) vs delTx
                // As we only have simple Add Form which adds positive amounts, treat as BUYs

                if (val > 75) emotionalMoves++; // FOMO Buy
                counted++;
            }
        });

        if (counted > 0) {
            this.scores.emotionalExposure = (emotionalMoves / counted) * 100;
        }
    }

    determineProfile() {
        const { impulsivity, discipline, riskTolerance, emotionalExposure } = this.scores;

        // Classification Logic
        if (discipline > 70 && riskTolerance < 40) {
            this.profile = { archetype: '🧘 Le Stratège Zen', color: 'text-emerald-500', description: 'Calme, réfléchi et orienté long terme. Vous ne vous laissez pas influencer par le bruit du marché.' };
        } else if (impulsivity > 70 && emotionalExposure > 60) {
            this.profile = { archetype: '🔥 Le Chasseur de FOMO', color: 'text-orange-500', description: 'Sensible aux émotions du marché. Attention à ne pas acheter les sommets !' };
        } else if (riskTolerance > 80) {
            this.profile = { archetype: '🎢 Le Maverick du Risque', color: 'text-purple-500', description: 'Vous aimez la volatilité et les paris audacieux. Haut risque, haute récompense ?' };
        } else {
            this.profile = { archetype: '⚖️ L\'Investisseur Équilibré', color: 'text-blue-500', description: 'Un bon mélange de prudence et d\'opportunisme. Continuez sur cette voie.' };
        }
    }

    generateCoachMessages() {
        this.coachMessages = [];
        const { impulsivity, emotionalExposure } = this.scores;

        if (impulsivity > 70) {
            this.coachMessages.push({ icon: 'fa-stopwatch', text: "Tu as tendance à trader fréquemment. Historiquement, attendre 24h avant de valider une décision améliore la performance." });
        }
        if (emotionalExposure > 50) {
            this.coachMessages.push({ icon: 'fa-brain', text: "Tes achats coïncident souvent avec des pics d'euphorie (Greed). Essaie la méthode DCA pour lisser ton prix d'entrée." });
        }
        if (this.scores.discipline < 40) {
            this.coachMessages.push({ icon: 'fa-calendar-check', text: "Ta régularité est en baisse. Fixe-toi un jour précis dans le mois pour investir une somme fixe." });
        }
        if (this.coachMessages.length === 0) {
            this.coachMessages.push({ icon: 'fa-check-circle', text: "Rien à signaler ! Ton comportement est exemplaire récemment." });
        }
    }
}
