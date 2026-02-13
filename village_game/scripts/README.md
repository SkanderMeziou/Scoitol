# Scripts Utilitaires

## calculate-stats.js

Script pour calculer et afficher les difficultés de craft et le DPS attendu des tourelles.

### Utilisation

```bash
node scripts/calculate-stats.js
```

### Ce que le script affiche

- **Tourelles** : Nom, coût, difficulté de craft, et DPS attendu
- **Générateurs** : Nom, coût, et difficulté de craft
- **Collecteurs** : Nom, coût, et difficulté de craft
- **Bâtiments spéciaux** : Nom, coût, et difficulté de craft
- **Graines** : Nom, coût, et difficulté de craft
- **Valeurs de rareté des matériaux**

### Formule de difficulté

```
difficulty = (somme des raretés) * (0.9 + (nombre_matériaux_uniques / 10))^1.1
```

### Formule de DPS

```
DPS = (difficulty / basic_turret_difficulty) * 10
```

La tourelle basique a un DPS de référence de 10.

### Exemple de sortie

```
TURRETS
--------------------------------------------------------------------------------
Name                Cost                          Difficulty     Expected DPS
--------------------------------------------------------------------------------
turret_basic        10 wood, 10 stone             22.21          10.00
turret_iron         10 iron                       50.00          22.51
turret_diamond      10 diamond                    500.00         225.12
```
