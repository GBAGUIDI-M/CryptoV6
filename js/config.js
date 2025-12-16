// --- 1. CONFIGURATION ---
const USER_FIREBASE_CONFIG = {
    apiKey: "AIzaSyAGxCWBLXDzfSt5Q1lPndsfnl5Pl6aYvlI",
    authDomain: "crypto-1443a.firebaseapp.com",
    projectId: "crypto-1443a",
    storageBucket: "crypto-1443a.firebasestorage.app",
    messagingSenderId: "1050036363674",
    appId: "1:1050036363674:web:fdc652962dcedac8da1a23",
    measurementId: "G-ZXJCRPGYR4"
};

const ASSETS_CONFIG = [
    { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin', color: '#F7931A', category: 'Layer 1' },
    { symbol: 'ETH', name: 'Ethereum', id: 'ethereum', color: '#627EEA', category: 'Layer 1' },
    { symbol: 'BNB', name: 'Binance Coin', id: 'binancecoin', color: '#F3BA2F', category: 'Layer 1' },
    { symbol: 'SOL', name: 'Solana', id: 'solana', color: '#14F195', category: 'Layer 1' },
    { symbol: 'TON', name: 'Toncoin', id: 'the-open-network', color: '#0088CC', category: 'Layer 1' },
    { symbol: 'ADA', name: 'Cardano', id: 'cardano', color: '#0033AD', category: 'Layer 1' },
    { symbol: 'XRP', name: 'Ripple', id: 'ripple', color: '#23292F', category: 'Payment' },
    { symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin', color: '#C2A633', category: 'Meme' },
    { symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2', color: '#E84142', category: 'Layer 1' },
    { symbol: 'DOT', name: 'Polkadot', id: 'polkadot', color: '#E6007A', category: 'Layer 1' },
    { symbol: 'PEPE', name: 'Pepe', id: 'pepe', color: '#4CAF50', category: 'Meme' },
    { symbol: 'LINK', name: 'Chainlink', id: 'chainlink', color: '#2A5ADA', category: 'Oracle' }
];

const TRANSLATIONS = {
    fr: { dashboard: "Tableau de bord", analytics: "Analyses", settings: "Réglages", cloud: "Cloud Sync", netWorth: "Valeur Totale", invested: "Investi", pnl: "PnL (Latent)", perf: "Performance", addTx: "Transaction", cancel: "Annuler", confirmAction: "Oui", enterPin: "Code PIN", unlock: "Déverrouiller", setPin: "Créer PIN", welcomeShare: "Stockage Local Sécurisé", goalTitle: "Objectif Global", setGoal: "Nouvel Objectif :", cloudTitle: "Synchronisation Cloud", cloudDesc: "Connectez-vous pour sauvegarder vos données.", pasteConfig: "Configuration :", initFirebase: "Initialiser", login: "Connexion", register: "Inscription", loginGoogle: "Google Login", syncNow: "Sauvegarder", loadCloud: "Télécharger", importSuccess: "Données chargées !", cloudSuccess: "Sauvegarde réussie !", statusOnline: "En ligne", statusError: "Erreur API", resetApp: "RAZ App", demoMode: "Mode Démo", disableDemo: "Désactiver Démo", backupTitle: "Sauvegarde / Restauration", exportCSV: "Export CSV", exportJSON: "Export JSON", importJSON: "Import JSON", email: "Email", password: "Mot de passe", loggedInAs: "Connecté en tant que:", logout: "Déconnexion", dcaTitle: "Simulateur DCA", simPrice: "Prix Simulé", newBuy: "Achat", currentAvg: "Prix Moyen Actuel", newAvg: "Nouveau Prix Moyen", dca: "DCA", date: "Date", symbol: "Symbole", type: "Type", amount: "Montant", qty: "Quantité", action: "Action" },
    en: { dashboard: "Dashboard", analytics: "Analytics", settings: "Settings", cloud: "Cloud Sync", netWorth: "Net Worth", invested: "Invested", pnl: "Unrealized PnL", perf: "Performance", addTx: "Transaction", cancel: "Cancel", confirmAction: "Yes", enterPin: "Enter PIN", unlock: "Unlock", setPin: "Set PIN", welcomeShare: "Secure Local Storage", goalTitle: "Global Goal", setGoal: "New Goal:", cloudTitle: "Cloud Sync", cloudDesc: "Log in to backup your data.", pasteConfig: "Configuration:", initFirebase: "Initialize", login: "Login", register: "Register", loginGoogle: "Google Login", syncNow: "Backup", loadCloud: "Download", importSuccess: "Data loaded!", cloudSuccess: "Backup successful!", statusOnline: "Online", statusError: "API Error", resetApp: "Reset App", demoMode: "Demo Mode", backupTitle: "Backup / Restore", exportCSV: "Export CSV", exportJSON: "Export JSON", importJSON: "Import JSON", email: "Email", password: "Password", loggedInAs: "Logged in as:", logout: "Logout", dcaTitle: "DCA Simulator", simPrice: "Simulated Price", newBuy: "Buy Amount", currentAvg: "Current Avg Price", newAvg: "New Avg Price", dca: "DCA", date: "Date", symbol: "Symbol", type: "Type", amount: "Amount", qty: "Quantity", action: "Action" }
};
