import React, { useState, useEffect } from 'react'
import { T, categoryInfo } from '../design/tokens'
import { Panel } from '../design/components'

const CHECKLIST_KEY = 'dashboard_checklist_v2'

// ─── Checklist items organised by the 4 new categories ───────────────────────
const items = [
  {
    id: 'maths-pures',
    label: 'Mathématiques Pures',
    icon: '📐',
    color: T.a1,
    sections: [
      {
        label: 'Calcul (Dérivées & Intégrales)',
        tasks: [
          'Maîtriser les règles de dérivation (puissance, produit, quotient, chaîne)',
          'Calculer des dérivées partielles ∂f/∂x, ∂f/∂y sur des fonctions à plusieurs variables',
          'Comprendre la différence dérivée partielle vs dérivée totale',
          'Calculer d₁ et d₂ de Black-Scholes par dérivation de l\'exponentielle',
          'Comprendre les intégrales comme aire sous la courbe',
          'Relier intégrales et probabilités (CDF normale)',
          'Distinguer rendements simples et log-rendements',
          'Maîtriser les propriétés de exp et ln (composition, Taylor)',
        ],
      },
      {
        label: 'Algèbre Linéaire',
        tasks: [
          'Multiplier et inverser des matrices 2×2',
          'Construire et interpréter une matrice de covariance Σ',
          'Calculer valeurs propres et vecteurs propres d\'une matrice 2×2',
          'Appliquer la décomposition de Cholesky Σ = LLᵀ',
          'Générer des vecteurs corrélés à partir de bruits indépendants',
        ],
      },
      {
        label: 'Probabilités & Lois',
        tasks: [
          'Standardiser : Z = (X − µ) / σ',
          'Lire et interpréter N(d₁) dans Black-Scholes',
          'Expliquer pourquoi les prix suivent une loi log-normale',
          'Calculer corrélation et covariance empiriques',
          'Appliquer la loi des grands nombres et le TCL',
          'Calculer un intervalle de confiance à 95% et 99%',
          'Distinguer variance historique et volatilité annualisée',
        ],
      },
      {
        label: 'Processus Stochastiques (fondements)',
        tasks: [
          'Définir le mouvement brownien et ses 4 propriétés fondamentales',
          'Comprendre la non-différentiabilité de Wt et la variation quadratique',
          'Énoncer et appliquer le Lemme d\'Itô à f(t, Wt)',
          'Appliquer le Lemme d\'Itô à f(S) = ln(S) pour dériver la solution du GBM',
          'Distinguer intégrale ordinaire et intégrale d\'Itô',
        ],
      },
    ],
  },
  {
    id: 'maths-finance',
    label: 'Mathématiques Financières',
    icon: '📈',
    color: T.a4,
    sections: [
      {
        label: 'Pricing Options',
        tasks: [
          'Énoncer le principe de no-arbitrage et démontrer la parité Put-Call',
          'Calculer C et P par Black-Scholes (formule complète)',
          'Appliquer Black-76 pour les options sur futures et commodités',
          'Construire un arbre binomial (2 périodes) et calculer le prix d\'une option',
          'Estimer le prix d\'option par Monte Carlo (≥ 1000 simulations)',
          'Identifier et pricer une option barrière et un lookback',
        ],
      },
      {
        label: 'Greeks & Sensibilités',
        tasks: [
          'Dériver Delta = N(d₁) à partir de la formule BS',
          'Dériver Gamma = φ(d₁) / (S·σ·√T) à partir de Delta',
          'Dériver Vega = S·φ(d₁)·√T en utilisant l\'identité S·φ(d₁) = K·e^(-rT)·φ(d₂)',
          'Calculer Theta et Rho et interpréter leur signe',
          'Décomposer le P&L quotidien en contributions Δ, Γ, ν, Θ',
          'Construire et delta-hedger un portefeuille d\'options',
        ],
      },
      {
        label: 'Volatilité & Surfaces',
        tasks: [
          'Calculer σ_hist = std(r_log) × √252',
          'Expliquer la différence vol historique vs vol implicite',
          'Interpréter le smile de volatilité (OTM puts plus chers)',
          'Lire une surface de volatilité σ(K, T)',
          'Expliquer le skew de volatilité (put skew pour l\'énergie)',
          'Présenter l\'intuition du modèle de Heston (vol stochastique)',
          'Calculer la vol implicite par Newton-Raphson (1 itération)',
        ],
      },
      {
        label: 'Risk Management (VaR & Contrepartie)',
        tasks: [
          'Calculer la VaR variance-covariance : µ − z_α × σ',
          'Calculer la VaR historique au percentile 99%',
          'Estimer la VaR par Monte Carlo sur portefeuille multi-actifs',
          'Expliquer les limites de la VaR normale (queues épaisses)',
          'Présenter l\'EVT et la distribution GPD',
          'Calculer la VaR marginale et la contribution au risque',
          'Définir EaR (Earnings at Risk) et CFaR',
          'Calculer RAROC = NIACC / Economic Capital',
          'Tracer le profil PFE (Potential Future Exposure)',
          'Calculer CVA = Σ PD × LGD × EE(t) × DF(t)',
        ],
      },
    ],
  },
  {
    id: 'maths-energie',
    label: 'Mathématiques Énergie',
    icon: '⚡',
    color: T.a8,
    sections: [
      {
        label: 'Marchés Énergie',
        tasks: [
          'Décrire la structure des marchés spot/forward électro-gaziers',
          'Distinguer marchés réglementés et OTC (ISDA, CSA)',
          'Expliquer le rôle de la saisonnalité dans les prix énergie',
          'Interpréter une forward curve (contango vs backwardation)',
          'Analyser les spécificités de l\'électricité (non-stockable)',
        ],
      },
      {
        label: 'Forward Curves & Modélisation',
        tasks: [
          'Construire une courbe forward à partir des prix de marché',
          'Appliquer le modèle de coût de stockage (cost-of-carry)',
          'Expliquer les modèles de prix spot énergie (modèle de Schwartz)',
          'Calibrer une forward curve sur données de marché',
        ],
      },
      {
        label: 'Options Énergie & Exotiques',
        tasks: [
          'Appliquer Black-76 à une option sur pétrole ou gaz naturel',
          'Calculer le prix d\'un cap sur gaz naturel',
          'Pricer une swing option (flexibilité de volume)',
          'Gérer le risque de base (basis risk)',
          'Relier tous les modules sur un cas pétrole/gaz complet',
        ],
      },
      {
        label: 'Mean-Reversion & Processus Énergie',
        tasks: [
          'Écrire le processus Ornstein-Uhlenbeck : dX = κ(θ − X)dt + σdW',
          'Interpréter les paramètres κ (vitesse), θ (moyenne), σ (vol)',
          'Distinguer GBM (finance actions) vs OU (commodités énergie)',
          'Modéliser les sauts de prix (spike) avec processus à saut',
          'Simuler des trajectoires OU par méthode d\'Euler-Maruyama',
        ],
      },
    ],
  },
  {
    id: 'simulation',
    label: 'Informatique & Simulation',
    icon: '🖥️',
    color: T.a3,
    sections: [
      {
        label: 'Monte Carlo',
        tasks: [
          'Simuler des trajectoires GBM par méthode d\'Euler-Maruyama',
          'Générer 2 actifs corrélés par décomposition de Cholesky',
          'Estimer le prix d\'option par Monte Carlo avec ≥ 1000 simulations',
          'Appliquer la technique de réduction de variance (variable antithétique)',
          'Calculer la VaR Monte Carlo sur un portefeuille multi-actifs',
        ],
      },
      {
        label: 'Arbres & Méthodes Numériques',
        tasks: [
          'Construire un arbre binomial CRR (Cox-Ross-Rubinstein) à 2 périodes',
          'Calculer le prix d\'une option américaine par backward induction',
          'Comparer prix arbre vs Black-Scholes en fonction du nombre de pas',
          'Présenter l\'idée des différences finies pour les EDP de pricing',
        ],
      },
      {
        label: 'Calibration & Optimisation',
        tasks: [
          'Calibrer le modèle de Heston sur une surface de volatilité',
          'Appliquer Newton-Raphson pour trouver la vol implicite',
          'Comprendre la calibration bootstrap d\'une courbe de taux',
          'Utiliser la minimisation Nelder-Mead pour la calibration',
        ],
      },
      {
        label: 'Visualisation & Outils',
        tasks: [
          'Créer un graphique interactif de profil de payoff d\'option',
          'Visualiser la surface de volatilité (grille K × T)',
          'Simuler et afficher des trajectoires GBM / OU en temps réel',
          'Construire un heatmap de Greeks (Δ, Γ) en fonction de S et T',
        ],
      },
    ],
  },
]

// ─── Main Checklist component ─────────────────────────────────────────────────
export default function Checklist() {
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}') } catch { return {} }
  })

  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checked))
  }, [checked])

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }))

  const totalTasks = items.reduce((a, cat) => a + cat.sections.reduce((b, s) => b + s.tasks.length, 0), 0)
  const doneCount = Object.values(checked).filter(Boolean).length
  const pct = Math.round((doneCount / totalTasks) * 100)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
      {/* Header */}
      <div style={{
        background: `${T.a4}0d`, border: `1px solid ${T.a4}33`,
        borderRadius: 12, padding: '20px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: `${T.a4}22`, border: `1px solid ${T.a4}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>✓</div>
        <div>
          <div style={{ color: T.a4, fontWeight: 800, fontSize: 22 }}>Checklist de progression</div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>
            Cochez les concepts maîtrisés. Progression sauvegardée automatiquement.
          </div>
        </div>
      </div>

      {/* Global progress */}
      <Panel style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: T.text, fontWeight: 700 }}>Progression globale</span>
          <span style={{ color: T.a4, fontWeight: 800, fontSize: 20 }}>{pct}%</span>
        </div>
        <div style={{ background: T.border, borderRadius: 4, height: 8 }}>
          <div style={{
            height: 8, borderRadius: 4,
            background: `linear-gradient(90deg, ${T.a1}, ${T.a4})`,
            width: `${pct}%`, transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>{doneCount} / {totalTasks} items cochés</div>
      </Panel>

      {/* Category checklists */}
      {items.map(cat => {
        const catTotal = cat.sections.reduce((a, s) => a + s.tasks.length, 0)
        const catDone = cat.sections.reduce((a, s) =>
          a + s.tasks.filter((_, i) => checked[`${cat.id}_${s.label}_${i}`]).length, 0)
        const catPct = Math.round((catDone / catTotal) * 100)

        return (
          <Panel key={cat.id} accent={cat.color} style={{ marginBottom: 20 }}>
            {/* Category header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${cat.color}22`, border: `1px solid ${cat.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>{cat.icon}</div>
                <span style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>{cat.label}</span>
              </div>
              <span style={{ color: cat.color, fontWeight: 700, fontSize: 13 }}>
                {catDone}/{catTotal} — {catPct}%
              </span>
            </div>
            <div style={{ background: T.border, borderRadius: 3, height: 4, marginBottom: 20 }}>
              <div style={{
                height: 4, borderRadius: 3, background: cat.color,
                width: `${catPct}%`, transition: 'width 0.3s',
              }} />
            </div>

            {/* Sections */}
            {cat.sections.map((section, sIdx) => {
              const secDone = section.tasks.filter((_, i) => checked[`${cat.id}_${section.label}_${i}`]).length
              return (
                <div key={section.label} style={{ marginBottom: sIdx < cat.sections.length - 1 ? 18 : 0 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 8,
                    borderLeft: `3px solid ${cat.color}66`,
                    paddingLeft: 10,
                  }}>
                    <div style={{ color: cat.color, fontSize: 12, fontWeight: 700 }}>{section.label}</div>
                    <div style={{ color: T.muted, fontSize: 11 }}>{secDone}/{section.tasks.length}</div>
                  </div>
                  {section.tasks.map((task, i) => {
                    const key = `${cat.id}_${section.label}_${i}`
                    const done = !!checked[key]
                    return (
                      <div
                        key={i}
                        onClick={() => toggle(key)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                          background: done ? `${cat.color}0d` : 'transparent',
                          marginBottom: 2, transition: 'background 0.15s',
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
                          border: `2px solid ${done ? cat.color : T.border}`,
                          background: done ? cat.color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}>
                          {done && <span style={{ color: T.bg, fontSize: 10, fontWeight: 900 }}>✓</span>}
                        </div>
                        <span style={{
                          color: done ? T.muted : T.text, fontSize: 13, lineHeight: 1.5,
                          textDecoration: done ? 'line-through' : 'none',
                        }}>{task}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </Panel>
        )
      })}

      {/* Reset */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button
          onClick={() => { if (window.confirm('Réinitialiser toute la checklist ?')) setChecked({}) }}
          style={{
            background: 'transparent', border: `1px solid ${T.border}`,
            color: T.muted, padding: '8px 20px', borderRadius: 6,
            cursor: 'pointer', fontSize: 12,
          }}
        >
          Réinitialiser la checklist
        </button>
      </div>
    </div>
  )
}
