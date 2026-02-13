# Propositions d'Amélioration des Performances et Portages

Si le jeu semble lent sur Canvas (API 2D native), c'est souvent dû au fait que le rendu logiciel du navigateur atteint ses limites avec beaucoup d'entités. Voici plusieurs options pour améliorer les performances, classées par effort et gain potentiel.

## 1. PixiJS (Recommandé pour la performance pure)
PixiJS est un moteur de rendu 2D très rapide qui utilise **WebGL** (accélération carte graphique) avec un fallback sur Canvas si nécessaire. C'est souvent le choix par défaut pour passer d'un Canvas lent à quelque chose de fluide.

### Avantages
*   **Performance Extrême** : Utilise le GPU. Peut gérer des milliers de sprites à 60 FPS sans transpirer.
*   **API Similaire** : L'approche "Scène graph" (Container, Sprite) est assez intuitive si on vient du Canvas.
*   **Flexible** : C'est juste un moteur de rendu. Vous gardez votre logique de jeu (boucle, entités, input) telle quelle.
*   **Filtres & Shaders** : Accès facile à des effets visuels avancés (Glow, Bloom, déformations).

### Inconvénients
*   **Juste un rendu** : Ne gère pas la physique ou le son (il faut garder vos systèmes actuels).
*   **Refactoring** : Il faut remplacer tous les appels `ctx.drawImage`, `ctx.beginPath`, etc. par des objets Pixi (`new PIXI.Sprite`, `new PIXI.Graphics`).

---

## 2. Phaser (Moteur de Jeu Complet)
Phaser est un framework complet qui inclut PixiJS (ou son propre rendu WebGL) sous le capot, mais ajoute aussi la physique, le son, la gestion des scènes, etc.

### Avantages
*   **Tout-en-un** : Physique (Arcade, Matter.js), Audio, Input, Loader de ressources, tout est inclus.
*   **Communauté** : Énormément de tutos et d'exemples.
*   **Structure** : Impose une structure de jeu solide (Preload, Create, Update).

### Inconvénients
*   **Lourd** : Le bundle est plus gros que PixiJS seul.
*   **Réécriture** : Demande probablement de réécrire une plus grande partie de l'architecture du jeu pour coller au "style Phaser".
*   **Overkill** : Si vous avez déjà une bonne logique de jeu et que seul le rendu pêche, c'est peut-être trop.

---

## 3. Optimisation du Canvas Existant (Sans Portage)
Avant de tout changer, il est parfois possible d'optimiser le code existant.

### Pistes d'optimisation
*   **OffscreenCanvas** : Faire le rendu des éléments statiques (background, grille) sur un canvas invisible et le copier en une fois.
*   **Culling** : Ne pas dessiner les entités qui sont hors de l'écran (très important pour les grandes maps).
*   **Object Pooling** : Réutiliser les objets (projectiles, ennemis) au lieu de les créer/détruire en boucle (réduit le Garbage Collection).
*   **Réduire les appels d'état** : Changer la couleur (`fillStyle`) ou la police coûte cher. Grouper les dessins par couleur.

### Avantages
*   **Pas de nouvelles dépendances**.
*   **Contrôle total**.

### Inconvénients
*   **Plafond de performance** : Même optimisé, le Canvas 2D restera plus lent que WebGL pour un grand nombre d'objets.
*   **Complexité** : Le code d'optimisation peut devenir complexe à maintenir.

---

## Résumé et Recommandation

| Technologie | Performance | Effort de migration | Verdict |
| :--- | :--- | :--- | :--- |
| **PixiJS** | ⭐⭐⭐⭐⭐ | Moyen | **Meilleur choix** si vous voulez garder votre logique actuelle mais booster le rendu. |
| **Phaser** | ⭐⭐⭐⭐ | Élevé | Bon si vous voulez repartir sur des bases "pro" avec physique intégrée. |
| **Canvas Opti**| ⭐⭐ | Variable | À tenter en premier (ex: Culling) si le lag est léger. |

**Mon conseil :** Si vous avez beaucoup d'unités/tours et que ça rame, passez à **PixiJS**. C'est le standard pour la 2D performante sur le web et ça s'intègre bien dans un projet existant sans tout casser.
