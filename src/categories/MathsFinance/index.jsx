import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { T } from '../../design/tokens'
import { TabBar } from '../../design/components'

// ─── Tab content imports from existing modules ────────────────────────────────
import { NoArbTab, BSTab, Black76Tab, ArbreTab, ExotiquesTab } from './tabs/Pricing.jsx'
import { GreeksTab } from './tabs/Greeks.jsx'
import { HistVolTab, ImplVolTab, SmileTab, SmileRotationTab, SurfaceTab, HestonTab } from './tabs/Volatilite.jsx'
import { VarCovTab, VarHistTab, VarMCTab, EVTTab, MarginalVarTab } from './tabs/Risk.jsx'
import { EaRTab, RAROCTab, PFETab, CVATab } from './tabs/Risk.jsx'

const ACCENT = T.a4  // green

// ─── Callout box for cross-category references ────────────────────────────────
function CrossRef({ to, label }) {
  return (
    <div style={{
      background: `${T.a1}11`, border: `1px solid ${T.a1}44`,
      borderRadius: 8, padding: '10px 14px', margin: '16px 0',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 16 }}>📍</span>
      <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
        <strong style={{ color: T.a1 }}>Prérequis dans Mathématiques Pures : </strong>
        {label} — accessible via le menu <em>{to}</em>.
      </div>
    </div>
  )
}

// ─── Pricing Options tab ──────────────────────────────────────────────────────
function PricingTab() {
  const [sub, setSub] = useState('No-Arbitrage')
  const subTabs = ['No-Arbitrage', 'Black-Scholes', 'Black-76', 'Arbres Binomiaux', 'Exotiques']
  return (
    <div>
      <CrossRef
        to="Mathématiques Pures › Calcul"
        label="Dérivées partielles, règle de chaîne — briques de base du pricing"
      />
      <CrossRef
        to="Mathématiques Pures › Processus Stochastiques"
        label="GBM, Lemme d'Itô — fondements du modèle de Black-Scholes"
      />
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'No-Arbitrage'    && <NoArbTab />}
        {sub === 'Black-Scholes'   && <BSTab />}
        {sub === 'Black-76'        && <Black76Tab />}
        {sub === 'Arbres Binomiaux' && <ArbreTab />}
        {sub === 'Exotiques'       && <ExotiquesTab />}
      </div>
    </div>
  )
}

// ─── Greeks & Sensibilités tab ────────────────────────────────────────────────
function GreeksAndSensitivitiesTab() {
  return (
    <div>
      <CrossRef
        to="Mathématiques Pures › Calcul"
        label="Dérivées partielles, théorie des dérivées — base mathématique des Greeks"
      />
      <GreeksTab />
    </div>
  )
}

// ─── Volatilité & Surfaces tab ────────────────────────────────────────────────
function VolTab() {
  const [sub, setSub] = useState('Vol Historique')
  const subTabs = ['Vol Historique', 'Vol Implicite', 'Smile', 'Rotation du Smile', 'Surface', 'Heston']
  return (
    <div>
      <CrossRef
        to="Mathématiques Pures › Probabilités & Lois"
        label="Loi log-normale, estimation statistique — base de la volatilité historique"
      />
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'Vol Historique' && <HistVolTab />}
        {sub === 'Vol Implicite'  && <ImplVolTab />}
        {sub === 'Smile'             && <SmileTab />}
        {sub === 'Rotation du Smile' && <SmileRotationTab />}
        {sub === 'Surface'           && <SurfaceTab />}
        {sub === 'Heston'         && <HestonTab />}
      </div>
    </div>
  )
}

// ─── Risk Management tab ──────────────────────────────────────────────────────
function RiskTab() {
  const [sub, setSub] = useState('VaR Var-Cov')
  const subTabs = ['VaR Var-Cov', 'VaR Historique', 'VaR Monte Carlo', 'EVT', 'VaR Marginale', 'EaR & CFaR', 'RAROC', 'PFE', 'CVA']
  return (
    <div>
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'VaR Var-Cov'     && <VarCovTab />}
        {sub === 'VaR Historique'  && <VarHistTab />}
        {sub === 'VaR Monte Carlo' && <VarMCTab />}
        {sub === 'EVT'             && <EVTTab />}
        {sub === 'VaR Marginale'   && <MarginalVarTab />}
        {sub === 'EaR & CFaR'      && <EaRTab />}
        {sub === 'RAROC'           && <RAROCTab />}
        {sub === 'PFE'             && <PFETab />}
        {sub === 'CVA'             && <CVATab />}
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
        }}>📈</div>
        <div>
          <div style={{ color: ACCENT, fontWeight: 800, fontSize: 22, letterSpacing: 0.3 }}>
            Mathématiques Financières
          </div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>
            Pricing Options · Greeks · Volatilité · Risk Management
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab slugs → display names ────────────────────────────────────────────────
const TAB_SLUGS = {
  pricing:    'Pricing Options',
  greeks:     'Greeks & Sensibilités',
  volatilite: 'Volatilité & Surfaces',
  risk:       'Risk Management',
}
const DISPLAY_TABS = Object.values(TAB_SLUGS)
const slugOf = (label) => Object.keys(TAB_SLUGS).find(k => TAB_SLUGS[k] === label) || 'pricing'

// ─── Main component ───────────────────────────────────────────────────────────
export default function MathsFinance() {
  const { tab } = useParams()
  const navigate = useNavigate()

  const activeLabel = TAB_SLUGS[tab] || 'Pricing Options'

  const handleTabChange = (label) => {
    navigate(`/maths-finance/${slugOf(label)}`)
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
        {activeLabel === 'Pricing Options'      && <PricingTab />}
        {activeLabel === 'Greeks & Sensibilités' && <GreeksAndSensitivitiesTab />}
        {activeLabel === 'Volatilité & Surfaces' && <VolTab />}
        {activeLabel === 'Risk Management'       && <RiskTab />}
      </div>
    </div>
  )
}
