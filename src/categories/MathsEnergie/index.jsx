import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { T } from '../../design/tokens'
import { TabBar } from '../../design/components'

// ─── Tab content imports from existing modules ────────────────────────────────
import { MarchesTab } from './tabs/Marches.jsx'
import { ForwardCurvesTab } from './tabs/ForwardCurves.jsx'
import { OptionsTab, CasIntegrateurTab } from './tabs/OptionsEnergie.jsx'
import { MeanRevTab, JumpTab } from './tabs/MeanReversion.jsx'

const ACCENT = T.a8  // red

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
        <strong style={{ color: T.a4 }}>Liens avec d'autres sections : </strong>
        {label} — accessible via le menu <em>{to}</em>.
      </div>
    </div>
  )
}

// ─── Mean-Reversion & Processus Énergie tab ───────────────────────────────────
function MeanRevEnergyTab() {
  const [sub, setSub] = useState('Mean-Reversion (OU)')
  const subTabs = ['Mean-Reversion (OU)', 'Processus à Saut']
  return (
    <div>
      <CrossRef
        to="Mathématiques Pures › Processus Stochastiques"
        label="Mouvement Brownien, Lemme d'Itô — fondements théoriques du Mean-Reversion"
      />
      <CrossRef
        to="Informatique & Simulation › Monte Carlo"
        label="Simulation numérique des processus Mean-Reversion et à sauts"
      />
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'Mean-Reversion (OU)' && <MeanRevTab />}
        {sub === 'Processus à Saut'    && <JumpTab />}
      </div>
    </div>
  )
}

// ─── Options Énergie tab ─────────────────────────────────────────────────────
function OptionsEnergieTab() {
  const [sub, setSub] = useState("Options Énergie")
  const subTabs = ["Options Énergie", "Cas Intégrateur"]
  return (
    <div>
      <CrossRef
        to="Mathématiques Financières › Pricing Options"
        label="Black-76, Arbres Binomiaux, Monte Carlo — méthodes de pricing génériques"
      />
      <CrossRef
        to="Mathématiques Financières › Greeks & Sensibilités"
        label="Greeks appliqués aux options sur commodités et énergie"
      />
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'Options Énergie'  && <OptionsTab />}
        {sub === 'Cas Intégrateur'  && <CasIntegrateurTab />}
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
        }}>⚡</div>
        <div>
          <div style={{ color: ACCENT, fontWeight: 800, fontSize: 22, letterSpacing: 0.3 }}>
            Mathématiques Énergie
          </div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>
            Marchés Énergie · Forward Curves · Options · Mean-Reversion
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab slugs → display names ────────────────────────────────────────────────
const TAB_SLUGS = {
  marches:          'Marchés Énergie',
  forward:          'Forward Curves',
  options:          'Options Énergie',
  'mean-reversion': 'Mean-Reversion',
}
const DISPLAY_TABS = Object.values(TAB_SLUGS)
const slugOf = (label) => Object.keys(TAB_SLUGS).find(k => TAB_SLUGS[k] === label) || 'marches'

// ─── Main component ───────────────────────────────────────────────────────────
export default function MathsEnergie() {
  const { tab } = useParams()
  const navigate = useNavigate()

  const activeLabel = TAB_SLUGS[tab] || 'Marchés Énergie'

  const handleTabChange = (label) => {
    navigate(`/maths-energie/${slugOf(label)}`)
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
        {activeLabel === 'Marchés Énergie'  && <MarchesTab />}
        {activeLabel === 'Forward Curves'   && <ForwardCurvesTab />}
        {activeLabel === 'Options Énergie'  && <OptionsEnergieTab />}
        {activeLabel === 'Mean-Reversion'   && <MeanRevEnergyTab />}
      </div>
    </div>
  )
}
