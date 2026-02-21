import React, { useState, useEffect } from 'react'
import { T } from '../design/tokens'
import { Panel, ModuleHeader } from '../design/components'

const CHECKLIST_KEY = 'dph3v_checklist'

const items = [
  {
    module: 1, color: T.a1, label: 'Module 1 — Fondations Mathématiques',
    tasks: [
      'Maîtriser les règles de dérivation (produit, quotient, chaîne)',
      'Calculer Delta = ∂C/∂S, Gamma = ∂²C/∂S², Vega = ∂C/∂σ',
      'Comprendre les intégrales comme aire sous la courbe',
      'Relier intégrales et probabilités (CDF normale)',
      'Distinguer rendements simples et log-rendements',
      'Multiplier et inverser des matrices 2×2',
      'Construire et interpréter une matrice de covariance',
      'Appliquer la décomposition de Cholesky',
    ]
  },
  {
    module: 2, color: T.a2, label: 'Module 2 — Probabilités & Statistiques',
    tasks: [
      'Standardiser : Z = (X - µ) / σ',
      'Lire et interpréter N(d₁) dans Black-Scholes',
      'Expliquer pourquoi les prix suivent une log-normale',
      'Calculer corrélation et covariance empiriques',
      'Appliquer la loi des grands nombres',
      'Calculer intervalle de confiance à 95% et 99%',
      'Distinguer variance historique et volatilité annualisée',
    ]
  },
  {
    module: 3, color: T.a3, label: 'Module 3 — Processus Stochastiques',
    tasks: [
      'Définir le mouvement brownien et ses propriétés',
      'Écrire l\'équation du GBM : dS = µS dt + σS dW',
      'Simuler des trajectoires GBM par méthode d\'Euler',
      'Écrire le processus Ornstein-Uhlenbeck (mean-reversion)',
      'Appliquer le lemme d\'Itô à f(S) = ln(S)',
      'Dériver la solution exacte du GBM',
      'Générer 2 actifs corrélés par décomposition de Cholesky',
    ]
  },
  {
    module: 4, color: T.a4, label: 'Module 4 — Pricing des Options',
    tasks: [
      'Énoncer le principe de no-arbitrage',
      'Calculer C et P par Black-Scholes (formule complète)',
      'Calculer d₁ et d₂ à la main',
      'Appliquer Black-76 pour les options sur futures (énergie)',
      'Calculer Delta, Gamma, Vega, Theta, Rho d\'une option',
      'Construire un arbre binomial (2 périodes)',
      'Estimer le prix d\'option par Monte Carlo (≥1000 simulations)',
      'Vérifier la parité Put-Call',
    ]
  },
  {
    module: 5, color: T.a5, label: 'Module 5 — Volatilité & Surfaces',
    tasks: [
      'Calculer σ_hist = std(r_log) × √252',
      'Expliquer la différence vol historique vs vol implicite',
      'Interpréter le smile de volatilité',
      'Lire une surface de volatilité σ(K, T)',
      'Expliquer le skew de volatilité (put skew pour l\'énergie)',
      'Présenter l\'intuition du modèle de Heston',
      'Calculer la vol implicite par Newton-Raphson (1 itération)',
    ]
  },
  {
    module: 6, color: T.a6, label: 'Module 6 — VaR Avancée',
    tasks: [
      'Calculer la VaR variance-covariance : µ - z_α × σ',
      'Calculer la VaR historique au percentile 99%',
      'Estimer la VaR par Monte Carlo sur portefeuille',
      'Expliquer les limites de la VaR normale (queues épaisses)',
      'Présenter l\'EVT et la distribution GPD',
      'Calculer la VaR marginale et la contribution au risque',
      'Distinguer VaR, CVaR (Expected Shortfall)',
    ]
  },
  {
    module: 7, color: T.a7, label: 'Module 7 — Risk Management & Contrepartie',
    tasks: [
      'Définir EaR (Earnings at Risk) sur cash flows futurs',
      'Calculer CFaR d\'un producteur gazier',
      'Calculer RAROC = NIACC / Economic Capital',
      'Tracer le profil PFE (Potential Future Exposure)',
      'Calculer CVA = Σ PD × LGD × EE(t) × DF(t)',
      'Distinguer CVA, DVA, FVA',
      'Expliquer le netting et les accords ISDA/CSA',
    ]
  },
  {
    module: 8, color: T.a8, label: 'Module 8 — Applications Énergie',
    tasks: [
      'Décrire la structure des marchés spot/forward énergie',
      'Interpréter une forward curve (contango vs backwardation)',
      'Appliquer Black-76 à une option sur pétrole',
      'Calculer le prix d\'un cap sur gaz naturel',
      'Gérer le risque de base (basis risk)',
      'Relier tous les modules sur un cas pétrole/gaz complet',
      'Rédiger une note de risk management pour un producteur',
    ]
  },
]

export default function Checklist() {
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}') } catch { return {} }
  })

  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checked))
  }, [checked])

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }))

  const totalTasks = items.reduce((a, m) => a + m.tasks.length, 0)
  const doneCount = Object.values(checked).filter(Boolean).length
  const pct = Math.round((doneCount / totalTasks) * 100)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px 60px' }}>
      <ModuleHeader
        num="✓"
        title="Checklist DPH3V"
        subtitle="Cochez les concepts maîtrisés. Progression sauvegardée automatiquement dans le navigateur."
        accent={T.text}
      />

      {/* Progress */}
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

      {/* Module checklists */}
      {items.map(mod => {
        const modDone = mod.tasks.filter((_, i) => checked[`${mod.module}_${i}`]).length
        return (
          <Panel key={mod.module} accent={mod.color} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: `${mod.color}22`, border: `1px solid ${mod.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: mod.color, fontWeight: 800, fontSize: 12,
                }}>M{mod.module}</div>
                <span style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>{mod.label}</span>
              </div>
              <span style={{ color: mod.color, fontWeight: 700, fontSize: 13 }}>
                {modDone}/{mod.tasks.length}
              </span>
            </div>
            <div style={{ background: T.border, borderRadius: 3, height: 4, marginBottom: 14 }}>
              <div style={{
                height: 4, borderRadius: 3, background: mod.color,
                width: `${(modDone / mod.tasks.length) * 100}%`, transition: 'width 0.3s',
              }} />
            </div>
            {mod.tasks.map((task, i) => {
              const key = `${mod.module}_${i}`
              const done = !!checked[key]
              return (
                <div
                  key={i}
                  onClick={() => toggle(key)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '9px 10px', borderRadius: 6, cursor: 'pointer',
                    background: done ? `${mod.color}0d` : 'transparent',
                    marginBottom: 2, transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                    border: `2px solid ${done ? mod.color : T.border}`,
                    background: done ? mod.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {done && <span style={{ color: T.bg, fontSize: 11, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{
                    color: done ? T.muted : T.text, fontSize: 13, lineHeight: 1.5,
                    textDecoration: done ? 'line-through' : 'none',
                  }}>{task}</span>
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
