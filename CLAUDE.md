# CLAUDE.md — Guide de développement du Dashboard Math/Finance

Dashboard d'apprentissage interactif React (Vite + React 18 + Recharts + KaTeX).
Pas de backend, pas de state management externe — tout est local / en mémoire.

---

## Structure du projet (à updater à chaque mise à jour)

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

**Référence de profondeur :** L'onglet `BellmanTab` dans `src/categories/MathsEnergie/tabs/StockageGaz.jsx` illustre le niveau de détail visé. Chaque onglet doit atteindre une densité comparable (~800–1300 lignes JSX), adaptée au sujet.

Il n'y a pas de schéma bloc imposé — l'organisation dépend du sujet. Ce qui est obligatoire, c'est de respecter ces **principes** :

---

### 1. Partir de l'intuition, pas de la formule
- Avant toute notation, expliquer **à quoi ça sert** et **comment ça fonctionne** en langage courant
- Ouvrir avec un `<IntuitionBlock>` contenant une analogie concrète du monde réel
- Présenter les variables / concepts clés et les enjeux **avant** la première formule ou le premier bloc de code
- Minimum **2 analogies distinctes** par onglet (une en introduction, une dans le cœur du contenu)
- *Exemples d'analogies par domaine :* gestionnaire de stock (énergie), joueur d'échecs (optimisation), recette de cuisine (algorithme), balance à plateaux (algèbre), paris sportifs (probabilités), assurance (risk management)

### 2. Ne jamais lâcher une formule sans l'expliquer — à 3 niveaux

> S'applique aux onglets à contenu mathématique. Pour les onglets de programmation pure, remplacer « formule » par « snippet de code » et adapter les niveaux ci-dessous en conséquence (commentaires inline, décomposition ligne par ligne, glossaire des fonctions/méthodes).

**Niveau A — Annotation directe :**
- Utiliser `\underbrace{}` LaTeX pour annoter chaque terme directement dans la formule
- Minimum requis sur toute formule centrale de l'onglet

**Niveau B — Décomposition terme à terme :**
- Après la formule annotée, créer un panneau coloré par terme (3–5 panneaux typiquement)
- Chaque panneau contient : emoji + nom intuitif du terme, explication en langage courant, formule isolée en `<K>`, et un **exemple numérique concret** avec des valeurs réalistes
- Pour les termes complexes, décomposer en sous-étapes (a, b, c, d) avec un calcul chiffré à chaque niveau

**Niveau C — Légende des symboles :**
- `<SymbolLegend>` obligatoire après la première apparition d'une formule avec plus de 3 symboles
- Format : `[['symbole', 'définition (unité) — rôle intuitif']]`

### 3. Exemples concrets — au moins 3 par onglet

Les exemples doivent être **concrets, réalistes et faits à la main**. Trois types obligatoires (adapter la forme au domaine) :

**a) Exemple minimal inline :**
- Juste après la formule / le concept, un calcul rapide ou un cas d'usage simple pour montrer le mécanisme
- Peut être intégré directement dans les panneaux de décomposition (niveau B ci-dessus)
- *Programmation :* un snippet minimal qui tient en 5–10 lignes avec sa sortie attendue

**b) Exemple comparatif :**
- Comparer au moins 2 scénarios côte à côte (`<Grid cols={2}>`)
- Un cas trivial vs un cas réaliste, ou deux approches différentes du même problème
- *Math/Finance :* tableaux de comparaison (5–7 lignes × 4–6 colonnes) avec mise en surbrillance du résultat optimal
- *Programmation :* avant/après refactoring, complexité O(n²) vs O(n log n), etc.

**c) Exercice guidé en Accordion :**
- `<Accordion badge="Moyen|Difficile">` avec un énoncé clair et contextualisé
- `<Demonstration>` + `<DemoStep>` : chaque étape = **une seule règle** nommée + le calcul / raisonnement appliqué
- Minimum 3–4 DemoSteps par exercice
- L'exercice doit **utiliser les concepts vus** — pas être déconnecté du contenu

### 4. Algorithmes et procédures — décomposition en étapes numérotées

Pour tout processus multi-étape (algorithme, méthode de calcul, procédure de calibration, pattern de code) :

- Utiliser `<Step num={1/2/3}>` pour chaque grande étape
- Chaque étape contient : `<FormulaBox>` ou snippet, explication, **et son propre exemple**
- Les étapes complexes doivent être décomposées en sous-blocs numérotés (①②③ ou a/b/c/d)
- Un pseudocode résumé en `<pre>` monospace après les étapes détaillées

### 5. Visualisations et simulations interactives

**Données :**
- Tableaux colorés avec mise en surbrillance quand pertinent (heatmap, comparaison, etc.)
- Visualisations custom quand utile (timeline, grille d'états, diagramme de flux, arbre de décision…)
- Regrouper les visualisations secondaires dans un `<Accordion badge="Détail">` dédié

**Simulation interactive (quand le sujet s'y prête) :**
- Sliders avec labels descriptifs : `"κ — vitesse de retour à la moyenne (an⁻¹)"` et non `"κ"`
- `<InfoChip>` pour les métriques clés recalculées en temps réel (3+ par simulation)
- Graphiques Recharts avec titre explicite dans `<ChartWrapper>`

**Clés de lecture — OBLIGATOIRES pour chaque graphique :**
- Bloc de 3–5 bullet points sous chaque graphique (emoji + `<strong>élément visuel</strong>` + explication)
- Expliquer ce que l'utilisateur doit **observer**, pas juste ce que le graphique montre
- Pour les graphiques interactifs : expliquer comment les sliders affectent le résultat visible

### 6. Règles transversales

- **Jamais d'acronyme sans définition** au premier usage (DP = Dynamic Programming, OU = Ornstein-Uhlenbeck, TSO = Transport System Operator, GWh, API, DOM…)
- **Flow pédagogique systématique :** Intuition → formule/concept annoté → décomposition terme à terme → synthèse 1 phrase → exemples comparatifs → algorithme/procédure en étapes → pseudocode → visualisation → simulation interactive → clés de lecture → exercice guidé
  - Tous les onglets n'auront pas toutes ces étapes (un onglet de maths pures n'a pas forcément de simulation, un onglet d'algorithmique n'a pas forcément de formule). **Appliquer les étapes pertinentes au sujet**, mais ne jamais en sauter une qui s'applique.
- Chaque section doit avoir un `<SectionTitle>` explicite — l'utilisateur doit pouvoir naviguer sans tout lire dans l'ordre
- **Toujours utiliser LaTeX pour les formules mathématiques** — même inline. Utiliser `<K>{"formule"}</K>` pour l'inline et `<K display>{"formule"}</K>` pour les blocs centrés. Ne jamais écrire une expression mathématique en texte brut (ex : écrire `<K>{"e^{-r \\Delta t}"}</K>` et non `e^{-rΔt}`)
- **Synthèse intermédiaire :** Après chaque bloc dense (formule + décomposition, ou concept + exemple), résumer en **une phrase italique** encadrée ce que l'utilisateur doit retenir
- Préférer les **analogies concrètes** aux formulations abstraites dans les clés de lecture et explications
- **Récap en fin d'onglet :** Un encadré "À retenir" ou un exercice de synthèse qui force à mobiliser les concepts vus

### Checklist rapide — Validation d'un onglet

Avant de considérer un onglet terminé, vérifier les critères **applicables au sujet** :

| # | Critère | Math | Finance | Énergie | Prog | Présent ? |
|---|---------|:----:|:-------:|:-------:|:----:|-----------|
| 1 | `<IntuitionBlock>` en ouverture avec analogie concrète | ✓ | ✓ | ✓ | ✓ | ☐ |
| 2 | Formule/concept principal avec `\underbrace{}` ou commentaires inline | ✓ | ✓ | ✓ | ✓ | ☐ |
| 3 | `<SymbolLegend>` après la première formule dense | ✓ | ✓ | ✓ | — | ☐ |
| 4 | Décomposition terme à terme (panneaux colorés) | ✓ | ✓ | ✓ | ~ | ☐ |
| 5 | Au moins 1 exemple numérique/concret inline | ✓ | ✓ | ✓ | ✓ | ☐ |
| 6 | Au moins 1 comparaison côte à côte | ✓ | ✓ | ✓ | ✓ | ☐ |
| 7 | Étapes numérotées (`<Step>`) pour tout algorithme/procédure | ✓ | ✓ | ✓ | ✓ | ☐ |
| 8 | Pseudocode ou snippet résumé si algorithme | ~ | ~ | ✓ | ✓ | ☐ |
| 9 | Simulation interactive (sliders + graphiques) | ~ | ✓ | ✓ | ~ | ☐ |
| 10 | Clés de lecture sous chaque graphique (3–5 bullets) | ✓ | ✓ | ✓ | ✓ | ☐ |
| 11 | Exercice guidé en `<Accordion>` avec `<DemoStep>` (3+ étapes) | ✓ | ✓ | ✓ | ✓ | ☐ |
| 12 | Tous les acronymes définis au premier usage | ✓ | ✓ | ✓ | ✓ | ☐ |
| 13 | Aucune formule en texte brut (tout en `<K>`) | ✓ | ✓ | ✓ | ~ | ☐ |
| 14 | Sliders avec labels descriptifs (pas juste le symbole) | ✓ | ✓ | ✓ | ✓ | ☐ |

*(✓ = obligatoire, ~ = si applicable, — = non pertinent)*

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
