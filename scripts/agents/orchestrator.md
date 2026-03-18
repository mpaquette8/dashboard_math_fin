# Orchestrator — Règles de décision

Ce fichier définit comment Claude orchestre le workflow multi-agents pour la gestion des onglets
du Dashboard Math/Finance. Lire ce fichier en premier à chaque demande de gestion d'onglet.

---

## 1. Détection du type d'opération

| Mots-clés dans la demande | Opération |
|---|---|
| "ajoute", "crée", "nouveau", "nouvel", "génère", "implémente", "écris" | `CREATE` |
| "modifie", "change", "améliore", "ajoute une section à", "enrichis", "mets à jour", "complète", "développe" | `MODIFY` |
| "supprime", "retire", "enlève", "efface" | `DELETE` |
| "déplace", "renomme", "restructure" | `RESTRUCTURE` |

---

## 2. Détection du type de sujet

Détermine l'emphase pédagogique à passer au Content Writer.

### Priorité 1 — mots-clés explicites dans la demande
| Mots-clés | subject_type |
|---|---|
| "algorithme", "complexité", "O(n", "python", "SQL", "code", "implémentation", "data science", "ML", "machine learning" | `programming` |
| "Monte Carlo", "simulation", "calibration", "convergence numérique" | `simulation` |

### Priorité 2 — catégorie cible
| category_id | subject_type par défaut |
|---|---|
| `maths-pures` | `math_pure` |
| `maths-finance` | `finance` |
| `maths-energie` | `energy` |
| `informatique` | `programming` |
| `simulation` | `simulation` |

### Emphase par subject_type
| subject_type | Simulation | Pseudocode | SymbolLegend | Recharts | Formules |
|---|:---:|:---:|:---:|:---:|:---:|
| `math_pure` | optionnel | optionnel | **requis** | optionnel | haute |
| `finance` | **requis** | optionnel | **requis** | **requis** | haute |
| `energy` | **requis** | optionnel | **requis** | **requis** | haute |
| `programming` | optionnel | **requis** | — | optionnel | basse |
| `simulation` | **requis** | **requis** | optionnel | **requis** | moyenne |

---

## 3. Format du task spec (JSON)

Produire ce JSON avant de lancer les agents :

```json
{
  "operation": "CREATE",
  "category_id": "maths-finance",
  "category_folder": "MathsFinance",
  "category_path": "/maths-finance",
  "category_label": "Mathématiques Financières",
  "accent_token": "T.a4",
  "accent_hex": "#4ade80",
  "tab_slug": "arbitrage-stat",
  "tab_label": "Arbitrage Statistique",
  "file_name": "ArbitrageStat.jsx",
  "file_path": "src/categories/MathsFinance/tabs/ArbitrageStat.jsx",
  "export_names": ["ArbitrageStatTab"],
  "subject_type": "finance",
  "sub_tabs": null,
  "parallel": false,
  "content_brief": "Description détaillée et précise du concept à couvrir, des formules clés, des exemples souhaités, des visualisations pertinentes."
}
```

### Pour un tab multi-sous-onglets (sub_tabs non null)
```json
{
  "operation": "CREATE",
  "category_id": "maths-finance",
  "category_folder": "MathsFinance",
  "accent_token": "T.a4",
  "accent_hex": "#4ade80",
  "tab_slug": "credit-risk",
  "tab_label": "Risque de Crédit",
  "file_name": "CreditRisk.jsx",
  "file_path": "src/categories/MathsFinance/tabs/CreditRisk.jsx",
  "export_names": ["CreditDefaultSwapTab", "CopulaCreditTab", "BaseCorrelationTab"],
  "subject_type": "finance",
  "sub_tabs": ["CDS & Spreads", "Copules de Crédit", "Base Correlation"],
  "parallel": true,
  "content_brief": "..."
}
```

---

## 4. Règles de parallélisme

### Quand lancer les Content Writers en parallèle
- `sub_tabs` contient ≥ 2 entrées → **N agents en parallèle**, un seul message `<tool_calls>` avec N `Agent` tool calls
- Chaque agent reçoit un `content_brief` **spécifique à son sous-onglet** (pas le brief général)
- Chaque agent retourne un **bloc JSX autonome** (juste le corps de la fonction export, pas les imports)
- Claude assemble : imports communs en tête, puis chaque bloc dans son `export function`

### Quand lancer en séquentiel
- Tab simple (1 export) → 1 Content Writer
- MODIFY sur 1 section ciblée → 1 Content Writer

### Quand lancer plusieurs Content Writers en parallèle pour un MODIFY
- La demande mentionne ≥ 3 sections distinctes à réécrire → autant d'agents que de sections

---

## 5. Correspondance category_id → category_folder

| category_id | category_folder | accent_token | accent_hex |
|---|---|---|---|
| `maths-pures` | `MathsPures` | `T.a1` | `#22d3ee` |
| `maths-finance` | `MathsFinance` | `T.a4` | `#4ade80` |
| `maths-energie` | `MathsEnergie` | `T.a8` | `#f87171` |
| `simulation` | `Simulation` | `T.a3` | `#a78bfa` |
| `informatique` | `Informatique` | `T.a7` | `#38bdf8` |

---

## 6. Workflow séquentiel par opération

### CREATE — tab simple
```
1. [Claude]     Produire task spec JSON
2. [Agent gp]   Lancer Content Writer avec content_writer.md + task spec
                → retourne JSX complet (fichier entier)
3. [Agent Exp]  Lancer Validator avec validator.md + chemin du JSX généré
                → retourne liste de violations (peut être vide)
4. [si violations non vides]
   [Agent gp]   Correction ciblée : fournir violations + section JSX concernée
                → retourne corrections à appliquer
5. [Claude]     Write : écrire le fichier tab
6. [Claude]     Edit×3 : tokens.js + index.jsx (import, TAB_SLUGS, render)
7. [Claude]     git add + commit + push
```

### CREATE — tab multi-sous-onglets
```
1. [Claude]     Produire task spec JSON + brief par sous-onglet
2. [MESSAGE UNIQUE — N Agent tool calls en parallèle]
     Agent A → JSX du sous-onglet 1 (corps de fonction uniquement)
     Agent B → JSX du sous-onglet 2
     Agent C → JSX du sous-onglet 3
3. [Claude]     Assembler : imports + chaque bloc dans export function
4. [Agent Exp]  Validator sur fichier assemblé
5. [si violations] Agent correction ciblée
6. [Claude]     Write fichier tab assemblé
7. [Claude]     Edit×3 : tokens.js + index.jsx avec wrapper sub-tab pattern
8. [Claude]     git add + commit + push
```

### MODIFY — section(s) existante(s)
```
1. [Claude]     Lire le fichier existant avec Read tool
2. [Claude]     Identifier les sections cibles (lignes, noms)
3. [Agent gp]   Content Writer avec : section actuelle + brief de modification
                → retourne le nouveau contenu de la section
4. [Agent Exp]  Validator sur les nouvelles sections
5. [Claude]     Edit tool ciblé (old_string/new_string)
6. [Claude]     git add + commit + push
```

### DELETE — tab
```
1. [Agent Exp]  Chercher les cross-refs : grep sur le slug et le label dans tous les JSX
2. [Claude]     Edit : retirer de tokens.js (ligne { slug, label })
3. [Claude]     Edit×3 : retirer de index.jsx (import + TAB_SLUGS entry + render condition)
4. [si aucune réutilisation]
   [Claude]     Bash : rm du fichier tab
5. [Claude]     git add + commit + push
```

---

## 7. Pattern d'intégration — référence exacte

### tokens.js — ajouter un slug
```js
// Trouver le bon objet dans categoryInfo, dans son tableau tabs :
{ slug: 'nouveau-slug', label: 'Nouveau Label' },
// Insérer après le dernier tab existant de la catégorie
```

### index.jsx — 3 modifications

**Modification 1 — import**
```jsx
import { NouvelleTab } from './tabs/NouveauFichier.jsx'
```

**Modification 2 — TAB_SLUGS**
```js
const TAB_SLUGS = {
  // ... entrées existantes ...
  'nouveau-slug': 'Nouveau Label',   // ← AJOUTER
}
```

**Modification 3 — render JSX**
```jsx
{activeLabel === 'Nouveau Label' && <NouvelleTab />}
```

### index.jsx — pattern wrapper sous-onglets
```jsx
function NouveauTabAvecSousOnglets() {
  const [sub, setSub] = useState('Sous-onglet 1')
  const subTabs = ['Sous-onglet 1', 'Sous-onglet 2']
  return (
    <div>
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'Sous-onglet 1' && <Export1Tab />}
        {sub === 'Sous-onglet 2' && <Export2Tab />}
      </div>
    </div>
  )
}
// Puis dans le rendu principal :
// {activeLabel === 'Nouveau Label' && <NouveauTabAvecSousOnglets />}
```

### App.jsx — seulement si nouvelle catégorie
```jsx
import NouvelleCategorie from './categories/NouvelleCategorie/index.jsx'

// Dans <Routes> :
<Route path="/nouvelle-cat" element={<Navigate to="/nouvelle-cat/premier-slug" replace />} />
<Route path="/nouvelle-cat/:tab" element={<NouvelleCategorie />} />
```

---

## 8. Nommage des fichiers et exports

| Ce qui est demandé | file_name | export_name |
|---|---|---|
| Tab unique | `ConceptName.jsx` | `ConceptNameTab` |
| Multi-sous-onglets dans 1 fichier | `ConceptGroup.jsx` | `Concept1Tab`, `Concept2Tab`, ... |
| Nouvelle catégorie | `NouvelleCategorie/index.jsx` + `tabs/Premier.jsx` | default export pour index |

---

## 9. Message type pour lancer un Content Writer

```
Lire scripts/agents/content_writer.md pour les instructions complètes.

task_spec:
{
  "subject_type": "finance",
  "accent_token": "T.a4",
  "accent_hex": "#4ade80",
  "export_names": ["ArbitrageStatTab"],
  "sub_tab_name": null,
  "content_brief": "Arbitrage statistique sur paires d'actions coïntégrées.
    Couvrir : test de coïntégration (Engle-Granger), spread = S1 - β·S2,
    z-score du spread, signal d'entrée/sortie ±2σ, mean-reversion du spread.
    Simulation interactive : 2 chemins GBM corrélés + spread + z-score.
    Exemple numérique : BP vs Shell."
}

Retourner le fichier JSX complet (~1000 lignes), prêt à être écrit.
```
