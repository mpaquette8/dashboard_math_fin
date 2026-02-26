export const T = {
  // Backgrounds
  bg: '#07090f',
  panel: '#0d1117',
  panel2: '#111827',
  border: '#1c2433',

  // Text
  text: '#dde4f0',
  muted: '#45607a',

  // Accent colors per module (kept for backward compat)
  a1: '#22d3ee',  // cyan    — Module 1 Fondations Math
  a2: '#fb923c',  // orange  — Module 2 Probabilités
  a3: '#a78bfa',  // violet  — Module 3 Processus Stochastiques
  a4: '#4ade80',  // green   — Module 4 Pricing Options
  a5: '#fbbf24',  // amber   — Module 5 Volatilité
  a6: '#f472b6',  // pink    — Module 6 VaR
  a7: '#38bdf8',  // sky     — Module 7 Risk Management
  a8: '#f87171',  // red     — Module 8 Applications Énergie

  // Semantic
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#22d3ee',

  // Radius
  r: '8px',
  r2: '12px',

  // Spacing
  gap: '16px',
  gap2: '24px',
}



export const moduleInfo = [
  { id: 1, label: 'Fondations Math', short: 'M1', accent: T.a1, path: '/module1' },
  { id: 2, label: 'Probabilités & Stats', short: 'M2', accent: T.a2, path: '/module2' },
  { id: 3, label: 'Processus Stochastiques', short: 'M3', accent: T.a3, path: '/module3' },
  { id: 4, label: 'Pricing des Options', short: 'M4', accent: T.a4, path: '/module4' },
  { id: 5, label: 'Volatilité & Surfaces', short: 'M5', accent: T.a5, path: '/module5' },
  { id: 6, label: 'VaR Avancée', short: 'M6', accent: T.a6, path: '/module6' },
  { id: 7, label: 'Risk Management', short: 'M7', accent: T.a7, path: '/module7' },
  { id: 8, label: 'Applications Énergie', short: 'M8', accent: T.a8, path: '/module8' },
]

// ─── New category-based structure ─────────────────────────────────────────────
export const categoryInfo = [
  {
    id: 'maths-pures',
    label: 'Mathématiques Pures',
    icon: '📐',
    accent: T.a1,       // cyan
    path: '/maths-pures',
    tabs: [
      { slug: 'calcul',        label: 'Calcul' },
      { slug: 'algebre',       label: 'Algèbre Linéaire' },
      { slug: 'probabilites',  label: 'Probabilités & Lois' },
      { slug: 'stochastique',  label: 'Processus Stochastiques' },
    ],
  },
  {
    id: 'maths-finance',
    label: 'Mathématiques Financières',
    icon: '📈',
    accent: T.a4,       // green
    path: '/maths-finance',
    tabs: [
      { slug: 'pricing',     label: 'Pricing Options' },
      { slug: 'greeks',      label: 'Greeks & Sensibilités' },
      { slug: 'volatilite',  label: 'Volatilité & Surfaces' },
      { slug: 'risk',        label: 'Risk Management' },
    ],
  },
  {
    id: 'maths-energie',
    label: 'Mathématiques Énergie',
    icon: '⚡',
    accent: T.a8,       // red
    path: '/maths-energie',
    tabs: [
      { slug: 'marches',       label: 'Marchés Énergie' },
      { slug: 'forward',       label: 'Forward Curves' },
      { slug: 'options',       label: 'Options Énergie' },
      { slug: 'mean-reversion', label: 'Mean-Reversion' },
      { slug: 'swing-options',  label: 'Swing Options' },
    ],
  },
  {
    id: 'simulation',
    label: 'Informatique & Simulation',
    icon: '🖥️',
    accent: T.a3,       // violet
    path: '/simulation',
    tabs: [
      { slug: 'monte-carlo',   label: 'Monte Carlo' },
      { slug: 'arbres',        label: 'Arbres & Méthodes' },
      { slug: 'react-vite',    label: 'React & Vite' },
      { slug: 'calibration',   label: 'Calibration' },
      { slug: 'visualisation', label: 'Visualisation & Outils' },
    ],
  },
]
