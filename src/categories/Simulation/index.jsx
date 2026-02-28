import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { T } from '../../design/tokens'
import { TabBar, IntuitionBlock, FormulaBox, SectionTitle } from '../../design/components'

// ─── Tab content imports from existing modules ────────────────────────────────
import { SimulTab, GBMTab } from './tabs/MonteCarlo.jsx'
import { MonteCarloTab } from './tabs/MonteCarlo.jsx'
import { ArbreTab } from './tabs/Arbres.jsx'

const ACCENT = T.a3  // violet

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
        <strong style={{ color: T.a1 }}>Liens avec d'autres sections : </strong>
        {label} — accessible via le menu <em>{to}</em>.
      </div>
    </div>
  )
}

// ─── Monte Carlo tab ──────────────────────────────────────────────────────────
function MCTab() {
  const [sub, setSub] = useState('Trajectoires GBM')
  const subTabs = ['Trajectoires GBM', 'Actifs Corrélés', 'Pricing MC']
  return (
    <div>
      <CrossRef
        to="Mathématiques Pures › Processus Stochastiques"
        label="Marche aléatoire, Mouvement Brownien — fondements théoriques de la simulation"
      />
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'Trajectoires GBM' && <GBMTab />}
        {sub === 'Actifs Corrélés'  && <SimulTab />}
        {sub === 'Pricing MC'       && <MonteCarloTab />}
      </div>
    </div>
  )
}

// ─── Arbres Binomiaux tab ─────────────────────────────────────────────────────
function ArbresTab() {
  return (
    <div>
      <CrossRef
        to="Mathématiques Financières › Pricing Options"
        label="Arbres binomiaux dans le contexte du pricing d'options"
      />
      <ArbreTab />
    </div>
  )
}

// ─── Coming soon placeholder ──────────────────────────────────────────────────
function ComingSoon({ title, description, items }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <div style={{ color: ACCENT, fontWeight: 800, fontSize: 22, marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ color: T.muted, fontSize: 14, lineHeight: 1.8, maxWidth: 520, margin: '0 auto 24px' }}>
        {description}
      </div>
      {items && (
        <div style={{
          background: T.panel, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: '16px 24px', maxWidth: 400, margin: '0 auto',
          textAlign: 'left',
        }}>
          <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Contenu prévu
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ color: ACCENT, fontSize: 12, marginTop: 1 }}>›</div>
              <div style={{ color: T.text, fontSize: 13 }}>{item}</div>
            </div>
          ))}
        </div>
      )}
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
        }}>🎲</div>
        <div>
          <div style={{ color: ACCENT, fontWeight: 800, fontSize: 22, letterSpacing: 0.3 }}>
            Simulation Numérique
          </div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>
            Monte Carlo · GBM · Actifs Corrélés · Arbres Binomiaux · Calibration
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab slugs → display names ────────────────────────────────────────────────
const TAB_SLUGS = {
  'monte-carlo':   'Monte Carlo',
  arbres:          'Arbres Binomiaux',
  calibration:     'Calibration',
  visualisation:   'Visualisation & Outils',
}
const DISPLAY_TABS = Object.values(TAB_SLUGS)
const slugOf = (label) => Object.keys(TAB_SLUGS).find(k => TAB_SLUGS[k] === label) || 'monte-carlo'

// ─── Main component ───────────────────────────────────────────────────────────
export default function Simulation() {
  const { tab } = useParams()
  const navigate = useNavigate()

  const activeLabel = TAB_SLUGS[tab] || 'Monte Carlo'

  const handleTabChange = (label) => {
    navigate(`/simulation/${slugOf(label)}`)
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
        {activeLabel === 'Monte Carlo'      && <MCTab />}
        {activeLabel === 'Arbres Binomiaux' && <ArbresTab />}
        {activeLabel === 'Calibration' && (
          <ComingSoon
            title="Calibration & Optimisation"
            description="Ce module couvrira les techniques de calibration de modèles financiers et les algorithmes d'optimisation."
            items={[
              'Calibration du modèle de Heston (vol stochastique)',
              'Calibration de la surface de volatilité',
              'Algorithmes : gradient descent, Nelder-Mead, différentiel évolutif',
              'Calibration du modèle de Schwartz (énergie)',
              'Bootstrap de courbes de taux et de forward curves',
            ]}
          />
        )}
        {activeLabel === 'Visualisation & Outils' && (
          <ComingSoon
            title="Visualisation & Outils Interactifs"
            description="Un espace dédié aux outils de visualisation paramétriques et aux dashboards interactifs pour explorer les modèles."
            items={[
              'Surface de volatilité interactive (3D)',
              'Comparateur de modèles de pricing en temps réel',
              'Simulateur de trajectoires multi-actifs corrélés',
              'Heatmap de sensibilités (Greeks en fonction de S et T)',
              'Backtester simplifié de stratégies delta-hedging',
            ]}
          />
        )}
      </div>
    </div>
  )
}
