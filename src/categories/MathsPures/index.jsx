import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { T } from '../../design/tokens'
import { TabBar, SectionTitle } from '../../design/components'

// ─── Tab content imports from existing modules ────────────────────────────────
import { DerivTab, IntegTab, ExpLogTab, AlgebraTab } from '../../modules/Module1/index.jsx'
import { NormalTab, LogNormalTab, CorrelTab, EstimationTab } from '../../modules/Module2/index.jsx'
import { RandomWalkTab, ItoTab } from '../../modules/Module3/index.jsx'

const ACCENT = T.a1  // cyan

// ─── Callout box for cross-category references ────────────────────────────────
function CrossRef({ to, label }) {
  return (
    <div style={{
      background: `${T.a4}11`, border: `1px solid ${T.a4}44`,
      borderRadius: 8, padding: '10px 14px', margin: '16px 0',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 16 }}>📍</span>
      <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
        <strong style={{ color: T.a4 }}>Contenu lié dans Mathématiques Financières : </strong>
        {label} — accessible via le menu <em>{to}</em>.
      </div>
    </div>
  )
}

// ─── Calcul tab: Dérivées (pure) + Intégrales + Exp & Log ────────────────────
function CalcTab() {
  const [sub, setSub] = useState('Dérivées')
  const subTabs = ['Dérivées', 'Intégrales', 'Exp & Log']
  return (
    <div>
      <CrossRef
        to="Mathématiques Financières › Greeks & Sensibilités"
        label="Dérivation complète de Delta, Gamma, Vega, Theta, Rho (Greeks des options Black-Scholes)"
      />
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'Dérivées'   && <DerivTab />}
        {sub === 'Intégrales' && <IntegTab />}
        {sub === 'Exp & Log'  && <ExpLogTab />}
      </div>
    </div>
  )
}

// ─── Probabilités & Lois tab ──────────────────────────────────────────────────
function ProbaTab() {
  const [sub, setSub] = useState('Loi Normale')
  const subTabs = ['Loi Normale', 'Log-Normale', 'Corrélation', 'Estimation']
  return (
    <div>
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'Loi Normale'  && <NormalTab />}
        {sub === 'Log-Normale'  && <LogNormalTab />}
        {sub === 'Corrélation'  && <CorrelTab />}
        {sub === 'Estimation'   && <EstimationTab />}
      </div>
    </div>
  )
}

// ─── Processus Stochastiques tab (fondements purs) ───────────────────────────
function StochTab() {
  const [sub, setSub] = useState('Marche Aléatoire')
  const subTabs = ['Marche Aléatoire', "Lemme d'Itô"]
  return (
    <div>
      <CrossRef
        to="Mathématiques Financières › Pricing Options"
        label="GBM appliqué au pricing (Black-Scholes), simulation de trajectoires dans un contexte financier"
      />
      <CrossRef
        to="Mathématiques Énergie › Mean-Reversion"
        label="Processus Ornstein-Uhlenbeck et Mean-Reversion appliqués aux marchés de l'énergie"
      />
      <CrossRef
        to="Informatique & Simulation › Monte Carlo"
        label="Simulation numérique de processus stochastiques (GBM, OU, sauts)"
      />
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'Marche Aléatoire' && <RandomWalkTab />}
        {sub === "Lemme d'Itô"      && <ItoTab />}
      </div>
    </div>
  )
}

// ─── Category header ──────────────────────────────────────────────────────────
function CategoryHeader() {
  return (
    <div style={{
      background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`,
      borderRadius: 12, padding: '20px 24px', marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>📐</div>
        <div>
          <div style={{ color: ACCENT, fontWeight: 800, fontSize: 22, letterSpacing: 0.3 }}>
            Mathématiques Pures
          </div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>
            Calcul · Algèbre Linéaire · Probabilités · Processus Stochastiques fondamentaux
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab slugs → display names ────────────────────────────────────────────────
const TAB_SLUGS = {
  calcul:       'Calcul',
  algebre:      'Algèbre Linéaire',
  probabilites: 'Probabilités & Lois',
  stochastique: 'Processus Stochastiques',
}
const DISPLAY_TABS = Object.values(TAB_SLUGS)
const slugOf = (label) => Object.keys(TAB_SLUGS).find(k => TAB_SLUGS[k] === label) || 'calcul'

// ─── Main component ───────────────────────────────────────────────────────────
export default function MathsPures() {
  const { tab } = useParams()
  const navigate = useNavigate()

  const activeLabel = TAB_SLUGS[tab] || 'Calcul'

  const handleTabChange = (label) => {
    navigate(`/maths-pures/${slugOf(label)}`)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      <CategoryHeader />
      <TabBar
        tabs={DISPLAY_TABS}
        active={activeLabel}
        onChange={handleTabChange}
        accent={ACCENT}
      />
      <div style={{ marginTop: 24 }}>
        {activeLabel === 'Calcul'                   && <CalcTab />}
        {activeLabel === 'Algèbre Linéaire'         && <AlgebraTab />}
        {activeLabel === 'Probabilités & Lois'      && <ProbaTab />}
        {activeLabel === 'Processus Stochastiques'  && <StochTab />}
      </div>
    </div>
  )
}
