# CLAUDE.md — Guide de développement du Dashboard Math/Finance

Dashboard d'apprentissage interactif React (Vite + React 18 + Recharts + KaTeX).
Pas de backend, pas de state management externe — tout est local / en mémoire.

---

## Structure du projet

```
src/
├── App.jsx                          # Routing principal, layout, composant Home
├── main.jsx                         # Point d'entrée React
├── categories/
│   ├── MathsPures/
│   │   ├── index.jsx                # Composant de catégorie (routing interne + sous-onglets)
│   │   └── tabs/
│   │       ├── Calcul.jsx           # export function DerivTab, IntegTab, ExpLogTab
│   │       ├── Algebre.jsx          # export function AlgebraTab
│   │       ├── Probabilites.jsx     # export function NormalTab, LogNormalTab, CorrelTab, EstimationTab
│   │       └── Stochastique.jsx     # export function RandomWalkTab, ItoTab
│   ├── MathsFinance/
│   │   ├── index.jsx
│   │   └── tabs/
│   │       ├── Pricing.jsx          # export function NoArbTab, BSTab, Black76Tab, ArbreTab, ExotiquesTab
│   │       ├── Greeks.jsx           # export function GreeksTab
│   │       ├── Volatilite.jsx       # export function HistVolTab, ImplVolTab, SmileTab, SurfaceTab, HestonTab
│   │       └── Risk.jsx             # export function VarCovTab, VarHistTab, VarMCTab, EVTTab, MarginalVarTab, EaRTab, RAROCTab, PFETab, CVATab
│   ├── MathsEnergie/
│   │   ├── index.jsx
│   │   └── tabs/
│   │       ├── Marches.jsx          # export function MarchesTab
│   │       ├── ForwardCurves.jsx    # export function ForwardCurvesTab
│   │       ├── OptionsEnergie.jsx   # export function OptionsTab, CasIntegrateurTab
│   │       └── MeanReversion.jsx    # export function MeanRevTab, JumpTab
│   └── Simulation/
│       ├── index.jsx
│       └── tabs/
│           ├── MonteCarlo.jsx       # export function SimulTab, GBMTab, MonteCarloTab
│           └── Arbres.jsx           # re-export { ArbreTab } depuis MathsFinance/tabs/Pricing.jsx
├── design/
│   ├── tokens.js                    # Couleurs (T), categoryInfo (navigation)
│   └── components.jsx               # Bibliothèque de composants UI réutilisables
└── shared/
    ├── Sidebar.jsx                  # Sidebar responsive (3 modes)
    └── Checklist.jsx                # Page checklist
```

---

## Standard pédagogique — OBLIGATOIRE pour tous les onglets

L'objectif du dashboard est d'être **compréhensible par quelqu'un qui voit le concept pour la première fois**, tout en étant **rigoureux pour un praticien**.

Chaque onglet doit respecter ce plan en 5 blocs dans l'ordre suivant :

### Bloc 1 — Intuition vulgarisée (`<IntuitionBlock>`)
- Commencer par une **analogie concrète du monde réel** (pas de maths, pas de symboles)
- Répondre à la question : *"à quoi ça sert ?"* et *"comment ça fonctionne ?"* en langage courant
- Une métaphore forte vaut mieux qu'une définition formelle
- Exemples de bons points d'entrée : un joueur d'échecs, un gestionnaire de stock, un trader sur un marché de fruits

### Bloc 2 — Décryptage terme à terme de la formule
- **Ne jamais lâcher une formule sans expliquer CHAQUE symbole/terme individuellement**
- Pattern obligatoire : formule → liste de chaque terme avec sa signification en français clair + son rôle dans le calcul
- Utiliser `<SymbolLegend>` pour le tableau de définitions
- Pour les formules complexes : utiliser les `\underbrace{}` LaTeX pour annoter directement dans la formule
- Chaque symbole doit avoir : (1) sa définition littérale, (2) son unité, (3) son interprétation intuitive

### Bloc 3 — Construction pas à pas (`<Step>` ou `<DemoStep>`)
- Dérouler l'algorithme ou le raisonnement **étape par étape numérotée**
- Chaque étape = une seule idée, formulée d'abord en **français simple**, puis en notation technique
- Ne pas sauter d'étapes — même les étapes "évidentes" doivent être explicitées

### Bloc 4 — Simulation interactive (sliders + graphiques)
- Permettre à l'utilisateur de **sentir** l'effet de chaque paramètre
- Chaque slider doit avoir un label qui explique ce qu'il contrôle
- Les `<InfoChip>` affichent les résultats clés recalculés en temps réel
- Les graphiques doivent avoir un titre descriptif et des annotations si nécessaire

### Bloc 5 — Exercice guidé (`<Accordion>` + `<Demonstration>`)
- Un exercice concret avec des chiffres réels
- La démonstration est **step by step**, chaque étape avec la règle appliquée (`<DemoStep>`)
- Clore par une interprétation du résultat en langage métier

### Règles transversales
- **Jamais de formule seule** : toute expression mathématique est accompagnée d'une phrase en français
- **Jamais d'acronyme sans définition** au premier usage (DP, OU, TSO…)
- Alterner systématiquement : concept vulgarisé → formulation technique → exemple chiffré
- Chaque section doit pouvoir se lire indépendamment (titres explicites, rappels des notations)

---

## Ajouter un nouvel onglet à une catégorie existante

### Étape 1 — Créer le fichier de contenu

Créer `src/categories/[Categorie]/tabs/NouvelOnglet.jsx` :

```jsx
import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { T } from '../../../design/tokens'
import {
  FormulaBox, IntuitionBlock, ExampleBlock,
  Slider, Accordion, Step, SectionTitle, InfoChip, Grid, ChartWrapper,
  Demonstration, DemoStep, K,
} from '../../../design/components'

const ACCENT = T.aX  // choisir la couleur de la catégorie (voir tokens.js)

export function MonNouvelOngletTab() {
  const [param, setParam] = useState(0.5)

  return (
    <div>
      <IntuitionBlock emoji="📐" title="Titre intuitif" accent={ACCENT}>
        Explication conceptuelle accessible.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Formule clé">
        <K display>{"f(x) = \\int_0^x g(t)\\,dt"}</K>
      </FormulaBox>

      <Slider label="Paramètre" value={param} min={0} max={1} step={0.01}
              onChange={setParam} accent={ACCENT} format={v => v.toFixed(2)} />

      <Accordion title="Exercice — Titre" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Énoncé de l'exercice.</p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Règle" ruleDetail="détail" accent={ACCENT}>
            Étape 1 de la solution.
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}
```

**Points critiques sur les chemins d'import :**
- `'../../../design/tokens'` → 3 niveaux depuis `src/categories/*/tabs/`
- `'../../../design/components'` → idem
- Ne pas oublier `import { T }` — `T` n'est pas global

### Étape 2 — Déclarer l'onglet dans `tokens.js`

Dans `src/design/tokens.js`, ajouter le slug dans `categoryInfo` :

```js
{
  id: 'maths-pures',
  // ...
  tabs: [
    { slug: 'calcul',         label: 'Calcul' },
    { slug: 'algebre',        label: 'Algèbre Linéaire' },
    { slug: 'mon-onglet',     label: 'Mon Nouvel Onglet' },  // ← AJOUTER ICI
  ],
},
```

### Étape 3 — Brancher dans le `index.jsx` de la catégorie

Dans `src/categories/[Categorie]/index.jsx`, trois endroits à modifier :

```jsx
// 1. Importer la fonction
import { MonNouvelOngletTab } from './tabs/NouvelOnglet.jsx'

// 2. Ajouter dans TAB_SLUGS
const TAB_SLUGS = {
  'calcul':       'Calcul',
  'mon-onglet':   'Mon Nouvel Onglet',  // ← AJOUTER
}

// 3. Brancher dans le rendu JSX
{activeLabel === 'Mon Nouvel Onglet' && <MonNouvelOngletTab />}
```

---

## Ajouter une nouvelle catégorie entière

### 1. Créer la structure de dossiers

```
src/categories/MaNouvelleCategorie/
├── index.jsx
└── tabs/
    └── PremierOnglet.jsx
```

### 2. Déclarer dans `tokens.js`

```js
export const categoryInfo = [
  // ... catégories existantes ...
  {
    id: 'ma-categorie',
    label: 'Ma Nouvelle Catégorie',
    icon: '🔬',
    accent: T.a2,           // choisir une couleur
    path: '/ma-categorie',
    tabs: [
      { slug: 'premier-onglet', label: 'Premier Onglet' },
    ],
  },
]
```

### 3. Créer `index.jsx` en copiant le pattern des catégories existantes

Le pattern est identique pour toutes les catégories — voir `src/categories/MathsPures/index.jsx` comme référence.

### 4. Brancher dans `App.jsx`

```jsx
import MaNouvelleCategorie from './categories/MaNouvelleCategorie/index.jsx'

// Dans <Routes> :
<Route path="/ma-categorie" element={<Navigate to="/ma-categorie/premier-onglet" replace />} />
<Route path="/ma-categorie/:tab" element={<MaNouvelleCategorie />} />
```

La sidebar se met à jour automatiquement via `categoryInfo`.

---

## Onglets avec sous-onglets

Quand un onglet regroupe plusieurs contenus (ex: Calcul = Dérivées + Intégrales + Exp&Log), créer un wrapper local dans `index.jsx` :

```jsx
function MonOngletAvecSous() {
  const [sub, setSub] = useState('Sous-onglet 1')
  const subTabs = ['Sous-onglet 1', 'Sous-onglet 2']
  return (
    <div>
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'Sous-onglet 1' && <FonctionTab1 />}
        {sub === 'Sous-onglet 2' && <FonctionTab2 />}
      </div>
    </div>
  )
}
```

---

## Onglets "en construction"

Pour déclarer un onglet prévu mais pas encore implémenté, utiliser le composant `ComingSoon` (présent dans tous les `index.jsx`) :

```jsx
{activeLabel === 'Onglet Futur' && (
  <ComingSoon
    title="Titre de l'onglet"
    description="Description du contenu prévu."
    items={[
      'Point 1 prévu',
      'Point 2 prévu',
    ]}
  />
)}
```

---

## Couleurs par catégorie (`T` dans `tokens.js`)

| Token  | Hex       | Couleur  | Catégorie principale          |
|--------|-----------|----------|-------------------------------|
| `T.a1` | `#22d3ee` | Cyan     | Mathématiques Pures           |
| `T.a2` | `#fb923c` | Orange   | Probabilités                  |
| `T.a3` | `#a78bfa` | Violet   | Informatique & Simulation     |
| `T.a4` | `#4ade80` | Vert     | Mathématiques Financières     |
| `T.a5` | `#fbbf24` | Ambre    | Volatilité                    |
| `T.a6` | `#f472b6` | Rose     | VaR / Risk                    |
| `T.a7` | `#38bdf8` | Bleu ciel| Risk Management               |
| `T.a8` | `#f87171` | Rouge    | Mathématiques Énergie         |

Utiliser `${ACCENT}22` pour fond léger, `${ACCENT}44` pour bordure, `${ACCENT}` pour texte/titre.

---

## Composants UI disponibles (`src/design/components.jsx`)

| Composant       | Usage                                                             |
|-----------------|-------------------------------------------------------------------|
| `<K>`           | Formule LaTeX inline : `<K>{"\\alpha + \\beta"}</K>`             |
| `<K display>`   | Formule LaTeX en bloc centré                                      |
| `<FormulaBox>`  | Encadré formule avec bordure colorée, prop `label` optionnelle    |
| `<IntuitionBlock>` | Bloc explicatif (fond coloré, emoji, titre)                   |
| `<ExampleBlock>`| Bloc exemple (accent vert énergie par défaut)                     |
| `<Slider>`      | Curseur interactif avec label et format d'affichage               |
| `<InfoChip>`    | Métrique affichée : label + valeur                                |
| `<Grid>`        | Grille responsive : `<Grid cols={3} gap="12px">`                  |
| `<ChartWrapper>`| Container Recharts avec titre et hauteur                          |
| `<SectionTitle>`| Titre de section avec accent coloré                               |
| `<Accordion>`   | Section repliable avec badge difficulté (Facile/Moyen/Difficile)  |
| `<Step>`        | Étape numérotée dans une démonstration                            |
| `<Demonstration>` | Wrapper repliable pour démonstrations                           |
| `<DemoStep>`    | Étape + badge de règle combinés                                   |
| `<SymbolLegend>`| Tableau de définitions de symboles mathématiques                  |
| `<TabBar>`      | Barre d'onglets — utilisée dans index.jsx et dans les sous-onglets|
| `<Panel>`       | Panneau avec fond et bordure                                      |

---

## Routing

- URL pattern : `/categorie/:tab` (ex: `/maths-pures/calcul`)
- Le slug dans l'URL correspond à la clé dans `TAB_SLUGS` de chaque `index.jsx`
- La redirection par défaut (ex: `/maths-pures` → `/maths-pures/calcul`) est dans `App.jsx`
- `document.title` est mis à jour via `useEffect` dans chaque composant catégorie

---

## Ce qu'il ne faut pas modifier sans raison

- `src/design/tokens.js` — ne modifier que pour ajouter des tabs/catégories dans `categoryInfo`
- `src/design/components.jsx` — ne pas toucher sauf pour ajouter un nouveau composant UI générique
- `src/shared/Sidebar.jsx` — la sidebar se génère automatiquement depuis `categoryInfo`
- `src/App.jsx` — ne modifier que pour ajouter les routes d'une nouvelle catégorie

---

## Commandes

```bash
npm run dev      # Serveur de développement (http://localhost:5173)
npm run build    # Build de production (dossier dist/)
npm run preview  # Prévisualiser le build de production
```
