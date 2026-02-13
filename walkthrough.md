# Refonte du Gameplay et des Visuels

J'ai effectué une refonte majeure du jeu pour le rendre plus dynamique et plus joli.

## Changements de Gameplay

### 1. Vitesse Accélérée (x3)

- **Vagues** : Toutes les 30 secondes (au lieu de 90s).
- **Graines** : Poussent en 60 secondes (au lieu de 180s).
- **Générateurs** : Produisent toutes les 20 secondes (au lieu de 60s).
- **Spawn Ennemis** : Beaucoup plus agressif dès le début.

### 2. Auto-Action (Plus de clics !)

- **Attaque** : Le joueur attaque automatiquement l'ennemi le plus proche.
- **Récolte** : Le joueur récolte automatiquement les ressources à proximité.
- **Cooldown** : 0.5s entre chaque action automatique.
- _Note : Le clic gauche sert toujours à construire._

### 3. Système de Grille & Limites

- **Construction** : Les bâtiments s'alignent maintenant sur une grille (50x50). Impossible de construire deux bâtiments l'un sur l'autre.
- **Limites** : Le monde est fini (4000x4000). Le joueur ne peut plus sortir de la carte.

## Changements Visuels

### 1. Sprites Procéduraux

Au lieu de simples cercles, les objets ont maintenant des formes plus évocatrices (dessinées avec des formes géométriques) :

- **Arbres** : Tronc marron + feuillage vert (plusieurs cercles).
- **Rochers** : Forme grise irrégulière avec des reflets.
- **Gemmes** : Forme de losange (diamant) avec éclat.

### 2. Ambiance

- **Fond** : Vert émeraude (`#2ecc71`) pour rappeler l'herbe.
- **Trail du Joueur** : Les particules sortent maintenant de tout le volume du joueur (offset aléatoire) pour un effet de traînée plus naturel.

## Fichiers Modifiés

- `src/game/Game.js` : Vitesse, Limites, Couleur de fond.
- `src/entities/Player.js` : Auto-attaque, Grille, Trail amélioré.
- `src/entities/Resource.js` : Nouveaux sprites procéduraux.
- `src/entities/Seed.js` : Vitesse de pousse.
- `src/entities/Building.js` : Vitesse de production.
