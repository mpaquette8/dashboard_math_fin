# Multi-Agent System — Dashboard Math/Finance

Système de génération et gestion des onglets pédagogiques via agents Claude Code natifs.
Pas de script externe, pas d'infrastructure supplémentaire — tout passe par Claude Code.

---

## Fichiers de l'architecture

| Fichier | Rôle |
|---|---|
| `orchestrator.md` | Règles de décision : détection opération + sujet + parallélisme + intégration |
| `content_writer.md` | Prompt complet du Content Writer : génère le JSX (~1000 lignes) |
| `validator.md` | Checklist 14 points : valide le JSX généré avant intégration |
| `README.md` | Ce fichier |

---

## Comment formuler une demande

### Exemples de demandes → ce qui se passe

**Ajouter un tab simple**
> "Ajoute un onglet Arbitrage Statistique dans Maths Finance. Couvrir la coïntégration, le spread, le z-score. Simulation interactive avec deux actifs corrélés."

→ CREATE / finance / 1 Content Writer / intégration dans maths-finance

**Ajouter un tab avec sous-onglets**
> "Crée un onglet Risque de Crédit dans Maths Finance avec 3 sous-onglets : CDS & Spreads, Copules de Crédit, Base Correlation."

→ CREATE / finance / 3 Content Writers en parallèle / assemblage / intégration

**Ajouter un tab programming**
> "Ajoute un onglet Algorithmique dans Informatique. Couvrir tri rapide, BFS/DFS, programmation dynamique. Avec pseudocode et analyse de complexité."

→ CREATE / programming / 1 Content Writer (emphase snippets + pseudocode)

**Modifier une section**
> "Dans l'onglet Greeks, améliore la section simulation du Delta pour ajouter un graphique Delta vs Strike."

→ MODIFY / finance / lecture fichier + Edit ciblé

**Supprimer un tab**
> "Supprime l'onglet Calibration de la catégorie Simulation."

→ DELETE / vérif cross-refs / retrait tokens.js + index.jsx

---

## Mettre à jour les prompts

### Ajouter un nouveau type de sujet

Dans `orchestrator.md`, section "2. Détection du type de sujet" :
1. Ajouter les mots-clés déclencheurs dans la table Priorité 1
2. Ajouter la ligne dans la table "Emphase par subject_type"

Dans `content_writer.md`, section "Emphase par subject_type" :
1. Ajouter le bloc `### \`nouveau_type\`` avec ses sections obligatoires

### Modifier la checklist de validation

Éditer `validator.md`, section "Checklist — 14 vérifications".
Chaque check a : pattern, obligatoire-pour, niveau (critique vs avertissement).

### Améliorer la qualité des contenus générés

Enrichir `content_writer.md` :
- Section "Pattern de simulation interactive" : ajouter des exemples de patterns Recharts
- Section "Règles absolues" : ajouter des règles supplémentaires
- Ajouter des exemples de snippets pour des types de contenu récurrents

---

## Débogage

### Le JSX généré ne compile pas
1. Vérifier les imports (chemins `../../../design/`)
2. Vérifier les `{` et `}` des expressions JSX
3. Vérifier les chaînes LaTeX : les `\` doivent être doublés dans les strings JS : `"\\alpha"` pas `"\alpha"`

### Le validator signale des violations en masse
Souvent dû à un mauvais `subject_type` détecté par l'orchestrateur.
Re-spécifier explicitement dans la demande : "de type finance" ou "orienté programmation".

### L'intégration échoue (tokens.js ou index.jsx)
Vérifier manuellement :
- `tokens.js` : le slug est dans le bon objet de `categoryInfo`
- `index.jsx` : les 3 modifications (import, TAB_SLUGS, render) sont cohérentes entre elles

---

## Architecture de génération parallèle (multi-sous-onglets)

```
Demande: "3 sous-onglets"
        │
        ▼
Orchestrateur produit 3 task_specs avec sub_tab_name respectifs
        │
        ├─── Agent A (Content Writer) → fragment JSX du sous-onglet 1
        ├─── Agent B (Content Writer) → fragment JSX du sous-onglet 2
        └─── Agent C (Content Writer) → fragment JSX du sous-onglet 3
        │    (lancés simultanément dans 1 message)
        │
        ▼
Claude assemble:
  - Imports uniques en tête
  - gaussRand() et helpers dédupliqués
  - export function SousOnglet1Tab() { ... }
  - export function SousOnglet2Tab() { ... }
  - export function SousOnglet3Tab() { ... }
        │
        ▼
Validator sur le fichier assemblé
        │
        ▼
Intégration (tokens.js + index.jsx avec wrapper TabBar)
        │
        ▼
commit + push
```

---

## Niveaux de qualité visés

- **Référence absolue** : `BellmanTab` dans `src/categories/MathsEnergie/tabs/StockageGaz.jsx`
- **Densité cible** : 800–1300 lignes par export function
- **Test rapide** : `npm run build` puis nav vers l'onglet + vérifier : IntuitionBlock, KaTeX, sliders, graphiques
