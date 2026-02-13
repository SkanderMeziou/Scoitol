# Structure du Projet

Ce document explique l'organisation des fichiers et dossiers du projet après la restructuration pour le portfolio.

## Vue d'ensemble

Le projet est divisé en deux parties principales :

1.  **Le Portfolio (Racine)** : Le site web principal qui présente vos projets.
2.  **Le Jeu (Village Game)** : Le projet de jeu intégré comme un sous-dossier.

```
/ (Racine du projet)
├── index.html              # Page d'accueil du Portfolio
├── style.css               # Styles graphiques du Portfolio (Design Premium)
├── vite.config.js          # Configuration pour compiler le site ET le jeu
├── package.json            # Dépendances (Vite, etc.)
│
├── village_game/           # Dossier contenant TOUT le jeu
│   ├── index.html          # Point d'entrée du jeu
│   ├── src/                # Code source Javascript du jeu
│   │   ├── entities/       # Ennemis, Joueur, Tourelles...
│   │   ├── game/           # Logique du jeu (Game.js, HUD.js...)
│   │   └── main.js         # Initialisation du jeu
│   │
│   └── public/             # Assets statiques du jeu
│       └── assets/         # Images, Spritesheets (ex: player.png)
│
└── dist/                   # (Généré après build) Le site final prêt à être hébergé
    ├── index.html          # Le portfolio compilé
    └── village_game/       # Le jeu compilé
```

## Détails des Dossiers

### 1. Racine (Portfolio)

C'est la vitrine.

- **`index.html`** : Contient le code HTML de votre portfolio. C'est ici que vous ajoutez de nouvelles "cartes" pour vos futurs projets.
- **`style.css`** : Contient le design "glassmorphism" et les animations du portfolio.
- **`vite.config.js`** : Un fichier très important. Il dit à l'outil de construction (Vite) de créer _deux_ sites : le portfolio (`main`) et le jeu (`village_game`).

### 2. `village_game/` (Le Jeu)

C'est votre ancien projet, déplacé ici pour ne pas se mélanger avec le portfolio.

- Il est autonome. Si vous voulez travailler sur le jeu, vous touchez principalement aux fichiers dans ce dossier.
- **`src/`** et **`public/`** fonctionnent exactement comme avant, mais sont rangés ici.

### 3. `dist/` (Distribution)

Ce dossier apparaît quand vous lancez `npm run build`.

- Il contient la version optimisée et minifiée de votre site.
- C'est **CE** dossier que vous envoyez sur internet (GitHub Pages, Vercel, etc.) pour mettre le site en ligne.

## Comment ajouter un nouveau projet ?

Si demain vous créez "Project Delta" :

1. Créez un dossier `project_delta/` à la racine.
2. Mettez-y votre `index.html` et vos fichiers.
3. Ajoutez une ligne dans `vite.config.js` pour qu'il soit détecté.
4. Ajoutez une carte (lien) dans le `index.html` principal du portfolio.
