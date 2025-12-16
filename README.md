# Crypto Station V16

**Application de Gestion de Portfolio Crypto Moderne & Sécurisée**

Crypto Station V16 est une Progressive Web App (PWA) conçue pour offrir une expérience native sur mobile tout en restant accessible via le web. Elle intègre des outils d'analyse financière avancés, une synchronisation Cloud (Firebase) et des fonctionnalités de sécurité renforcées.

## 🚀 Fonctionnalités Clés

### 📱 Expérience Mobile Native (PWA)
- **Installable** : Ajoutez l'application à votre écran d'accueil (Android & iOS).
- **Mode Hors-ligne** : Consultez votre portfolio même sans connexion grâce au Service Worker.
- **Gestuelles** : Swipez vers la gauche pour supprimer une transaction.

### 📊 Analyses Financières
- **Fear & Greed Index** : Suivez le sentiment du marché (API Alternative.me).
- **TradingView Chart** : Graphiques avancés interactifs pour chaque crypto.
- **Répartition Sectorielle** : Visualisez votre diversification par catégorie (Layer 1, DeFi, Meme, etc.).
- **Calculateur DCA** : Simulez l'impact de nouveaux achats sur votre prix moyen.

### ☁️ Cloud & Partage
- **Synchronisation Firebase** : Sauvegardez vos données et retrouvez-les sur tous vos appareils.
- **Auto-save** : Sauvegarde silencieuse automatique après modification.
- **Portfolio Partagé** : Générez un lien public en lecture seule pour partager votre performance sans donner accès à vos comptes.

### 🔒 Sécurité
- **Code PIN Haché** : Protection par code PIN (chiffré SHA-256 localement).
- **Auto-Lock** : Verrouillage automatique après 5 minutes d'inactivité.
- **Mode Privé** : Masquez les montants sensibles d'un simple clic.

## 🛠 Installation & Développement

L'application ne nécessite aucune installation de serveur (Serverless via Firebase).

1. **Ouvrir `index.html`** dans un navigateur moderne.
2. Pour activer la PWA et le cache, il est recommandé de servir les fichiers via un serveur local (ex: Live Server sur VSCode ou `python -m http.server`).

## 📁 Structure du Projet

- `index.html` : Point d'entrée principal.
- `css/` : Styles (Tailwind + Thèmes personnalisés).
- `js/` :
  - `app.js` : Logique principale (Alpine.js).
  - `charts.js` : Gestion des graphiques (Chart.js).
  - `config.js` : Configuration des assets et de Firebase.
- `assets/` : Icônes et images.
- `manifest.json` & `service-worker.js` : Configuration PWA.

## 🤝 Crédits

Développé sur la base de Crypto Station V15.
Technologies : Alpine.js, Tailwind CSS, Chart.js, Firebase.
