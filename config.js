// config.js - Configuration Générale

// 1. CONFIGURATION FIREBASE (VOTRE CLÉ EST ICI)
const USER_FIREBASE_CONFIG = {
    apiKey: "AIzaSyBc-nsjHfjO02U3QH_pC1z0sO7LWuce8N4",
    authDomain: "cryptosystem-88cb1.firebaseapp.com",
    projectId: "cryptosystem-88cb1",
    storageBucket: "cryptosystem-88cb1.firebasestorage.app",
    messagingSenderId: "202665600158",
    appId: "1:202665600158:web:fd2baf77d38d029534c78f"
};

// 2. LISTE DES CRYPTOS SUPPORTÉES
const ASSETS_CONFIG = [
    { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin', color: '#F7931A' },
    { symbol: 'ETH', name: 'Ethereum', id: 'ethereum', color: '#627EEA' },
    { symbol: 'BNB', name: 'Binance Coin', id: 'binancecoin', color: '#F3BA2F' },
    { symbol: 'SOL', name: 'Solana', id: 'solana', color: '#14F195' },
    { symbol: 'TON', name: 'Toncoin', id: 'the-open-network', color: '#0088CC' },
    { symbol: 'ADA', name: 'Cardano', id: 'cardano', color: '#0033AD' },
    { symbol: 'XRP', name: 'Ripple', id: 'ripple', color: '#23292F' },
    { symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin', color: '#C2A633' },
    { symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2', color: '#E84142' },
    { symbol: 'DOT', name: 'Polkadot', id: 'polkadot', color: '#E6007A' },
    { symbol: 'PEPE', name: 'Pepe', id: 'pepe', color: '#4CAF50' },
    { symbol: 'LINK', name: 'Chainlink', id: 'chainlink', color: '#2A5ADA' }
];

// 3. TRADUCTIONS
const TRANSLATIONS = {
    fr: {
        dashboard: "Tableau de bord", analytics: "Analyses", settings: "Réglages", cloud: "Cloud Sync",
        netWorth: "Valeur Totale", invested: "Investi", pnl: "PnL (Latent)", perf: "Performance",
        addTx: "Transaction", cancel: "Annuler", confirmAction: "Oui",
        enterPin: "Code PIN", unlock: "Déverrouiller", setPin: "Créer PIN", welcomeShare: "Stockage Local Sécurisé",
        goalTitle: "Objectif Global", setGoal: "Nouvel Objectif :",
        cloudTitle: "Synchronisation Cloud", cloudDesc: "Connectez-vous pour sauvegarder vos données.",
        pasteConfig: "Configuration :", initFirebase: "Initialiser",
        login: "Connexion", register: "Inscription", loginGoogle: "Google Login",
        syncNow: "Sauvegarder", loadCloud: "Télécharger",
        importSuccess: "Données chargées !", cloudSuccess: "Sauvegarde réussie !", statusOnline: "En ligne", statusError: "Erreur API"
    },
    en: {
        dashboard: "Dashboard", analytics: "Analytics", settings: "Settings", cloud: "Cloud Sync",
        netWorth: "Net Worth", invested: "Invested", pnl: "Unrealized PnL", perf: "Performance",
        addTx: "Transaction", cancel: "Cancel", confirmAction: "Yes",
        enterPin: "Enter PIN", unlock: "Unlock", setPin: "Set PIN", welcomeShare: "Secure Local Storage",
        goalTitle: "Global Goal", setGoal: "New Goal:",
        cloudTitle: "Cloud Sync", cloudDesc: "Log in to backup your data.",
        pasteConfig: "Configuration:", initFirebase: "Initialize",
        login: "Login", register: "Register", loginGoogle: "Google Login",
        syncNow: "Backup", loadCloud: "Download",
        importSuccess: "Data loaded!", cloudSuccess: "Backup successful!", statusOnline: "Online", statusError: "API Error"
    }
};