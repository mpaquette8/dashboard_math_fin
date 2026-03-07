import React, { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { T } from '../../../design/tokens'
import {
  FormulaBox, IntuitionBlock,
  Slider, Accordion, Step, SectionTitle, InfoChip, Grid, ChartWrapper,
  Demonstration, DemoStep, K, SymbolLegend,
} from '../../../design/components'

const ACCENT = T.a8

// ─── Utilities ────────────────────────────────────────────────────────────────

function gaussRand() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function linInterp(xArr, yArr, x) {
  const n = xArr.length
  if (x <= xArr[0]) return yArr[0]
  if (x >= xArr[n - 1]) return yArr[n - 1]
  let lo = 0
  while (lo < n - 2 && xArr[lo + 1] < x) lo++
  const t = (x - xArr[lo]) / (xArr[lo + 1] - xArr[lo])
  return yArr[lo] * (1 - t) + yArr[lo + 1] * t
}

function buildTransitionMatrix(NS, sGrid, kappa, mu, sigma, dt) {
  const eMk = Math.exp(-kappa * dt)
  const condVar = (sigma * sigma) * (1 - Math.exp(-2 * kappa * dt)) / (2 * Math.max(kappa, 0.001))
  const condStd = Math.sqrt(condVar) + 1e-8
  const Pi = Array.from({ length: NS }, () => new Array(NS).fill(0))
  for (let j = 0; j < NS; j++) {
    const condMean = sGrid[j] * eMk + mu * (1 - eMk)
    let rowSum = 0
    for (let k = 0; k < NS; k++) {
      const z = (sGrid[k] - condMean) / condStd
      Pi[j][k] = Math.exp(-0.5 * z * z)
      rowSum += Pi[j][k]
    }
    for (let k = 0; k < NS; k++) Pi[j][k] /= Math.max(rowSum, 1e-12)
  }
  return Pi
}

function runBellmanDP({ NV = 15, NS = 12, NT = 12, Vmin = 0, Vmax = 100, qinj = 10, qwit = 10, kappa = 1.5, mu = 40, sigma = 8, r = 0.05, cOp = 0.5, dt = 1 / 12 } = {}) {
  const vGrid = Array.from({ length: NV }, (_, i) => Vmin + (i / (NV - 1)) * (Vmax - Vmin))
  const statStd = sigma / Math.sqrt(2 * Math.max(kappa, 0.01))
  const sGrid = Array.from({ length: NS }, (_, j) => mu - 3 * statStd + (j / (NS - 1)) * 6 * statStd)
  const Pi = buildTransitionMatrix(NS, sGrid, kappa, mu, sigma, dt)
  const NU = 11
  const uGrid = Array.from({ length: NU }, (_, k) => -qwit + (k / (NU - 1)) * (qinj + qwit))
  // V[t][i][j]: value at time t, vol index i, price index j
  const V = Array.from({ length: NT + 1 }, () =>
    Array.from({ length: NV }, () => new Array(NS).fill(0))
  )
  const policy = Array.from({ length: NT }, () =>
    Array.from({ length: NV }, () => new Array(NS).fill(0))
  )
  const disc = Math.exp(-r * dt)
  for (let t = NT - 1; t >= 0; t--) {
    for (let i = 0; i < NV; i++) {
      for (let j = 0; j < NS; j++) {
        const Vi = vGrid[i]
        const Sj = sGrid[j]
        let best = -Infinity
        let bestU = 0
        for (let ku = 0; ku < NU; ku++) {
          const u = uGrid[ku]
          const Vnew = Vi + u * dt
          if (Vnew < Vmin - 1e-9 || Vnew > Vmax + 1e-9) continue
          let EV = 0
          for (let k = 0; k < NS; k++) {
            const col = V[t + 1].map(row => row[k])
            EV += Pi[j][k] * linInterp(vGrid, col, Vnew)
          }
          const cashflow = -u * Sj * dt - cOp * Math.abs(u) * dt
          const gain = cashflow + disc * EV
          if (gain > best) { best = gain; bestU = u }
        }
        V[t][i][j] = best
        policy[t][i][j] = bestU
      }
    }
  }
  return { V, policy, vGrid, sGrid, Pi }
}

function runIntrinsicDP({ NV = 15, NT = 12, Vmin = 0, Vmax = 100, qinj = 10, qwit = 10, mu = 40, spread = 15, r = 0.05, cOp = 0.5, dt = 1 / 12 } = {}) {
  const vGrid = Array.from({ length: NV }, (_, i) => Vmin + (i / (NV - 1)) * (Vmax - Vmin))
  const fwd = Array.from({ length: NT + 1 }, (_, t) => mu + spread * 0.5 * Math.cos(2 * Math.PI * t / NT + Math.PI))
  const NU = 11
  const uGrid = Array.from({ length: NU }, (_, k) => -qwit + (k / (NU - 1)) * (qinj + qwit))
  const V = Array.from({ length: NT + 1 }, () => new Array(NV).fill(0))
  const injProfile = new Array(NT).fill(0)
  const disc = Math.exp(-r * dt)
  for (let t = NT - 1; t >= 0; t--) {
    for (let i = 0; i < NV; i++) {
      const Vi = vGrid[i]
      const Ft = fwd[t]
      let best = -Infinity
      let bestU = 0
      for (let ku = 0; ku < NU; ku++) {
        const u = uGrid[ku]
        const Vnew = Vi + u * dt
        if (Vnew < Vmin - 1e-9 || Vnew > Vmax + 1e-9) continue
        const futV = linInterp(vGrid, V[t + 1], Vnew)
        const cashflow = -u * Ft * dt - cOp * Math.abs(u) * dt
        const gain = cashflow + disc * futV
        if (gain > best) { best = gain; bestU = u }
      }
      V[t][i] = best
      if (i === Math.floor(NV / 2)) injProfile[t] = bestU
    }
  }
  return { V, vGrid, fwd, injProfile }
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

const panelStyle = {
  background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`,
  borderRadius: 8, padding: 16, margin: '14px 0',
}

const tableStyle = {
  width: '100%', borderCollapse: 'collapse', fontSize: 12,
  color: T.text, marginTop: 8,
}

function Th({ children }) {
  return <th style={{ padding: '6px 10px', borderBottom: `1px solid ${ACCENT}44`, color: ACCENT, fontWeight: 700, textAlign: 'left' }}>{children}</th>
}
function Td({ children, accent }) {
  return <td style={{ padding: '6px 10px', borderBottom: `1px solid ${T.border}`, color: accent || T.text }}>{children}</td>
}

// ─── Onglet 1 : Acteur & Modèle ──────────────────────────────────────────────

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const DEMAND_PROFILE = [90, 85, 70, 50, 35, 25, 20, 22, 38, 55, 78, 92]
// Profil attendu saisonnier couvert par les forwards (consommation moyenne par mois)
const EXPECTED_DEMAND = [77, 72, 59, 43, 29, 21, 17, 19, 31, 47, 67, 79]
// Scénarios de stress thermique pour dimensionner la puissance de soutirage
const STRESS_SCENARIOS = [
  { label: 'Hiver doux', dT: 3, days: 2 },
  { label: 'Hiver normal', dT: 6, days: 4 },
  { label: 'Vague de froid', dT: 10, days: 7 },
  { label: 'Grand froid (1/20 ans)', dT: 15, days: 10 },
]

export function ActeurTab() {
  const [spotPrice, setSpotPrice] = useState(40)
  const [control, setControl] = useState(-5)
  const [deltaT, setDeltaT] = useState(10)
  const [thermSens, setThermSens] = useState(1.8)
  const [nJours, setNJours] = useState(5)
  const [qContr, setQContr] = useState(20)

  const cOp = 0.5
  const cashflow = -control * spotPrice * (1 / 12) - cOp * Math.abs(control) * (1 / 12)

  const qRequired = +(thermSens * deltaT).toFixed(1)
  const eRequired = +(thermSens * deltaT * nJours).toFixed(1)
  const coverageOk = qContr >= qRequired

  const loadData = MONTHS.map((m, i) => ({
    mois: m,
    demande: DEMAND_PROFILE[i],
    couvertureForward: EXPECTED_DEMAND[i],
    excèsAléatoire: Math.max(0, DEMAND_PROFILE[i] - EXPECTED_DEMAND[i]),
  }))

  const scenarioData = STRESS_SCENARIOS.map(s => ({
    ...s,
    qRequis: +(thermSens * s.dT).toFixed(1),
    eRequis: +(thermSens * s.dT * s.days).toFixed(1),
    covered: qContr >= thermSens * s.dT,
  }))

  return (
    <div>
      {/* Bloc 1 — Positionnement fournisseur déjà hedgé */}
      <IntuitionBlock emoji="🏢" title="Le fournisseur déjà hedgé en saisonnalité" accent={ACCENT}>
        Un <strong>fournisseur de gaz</strong> couvre sa saisonnalité via des <strong>contrats forward</strong> — achats sur la courbe à terme qui sécurisent la consommation
        <em> moyenne</em> attendue de chaque mois hivernal. Ce hedge saisonnier est géré séparément (produits Cal, Q+1, M+1…).
        Le stockage intervient alors pour un rôle différent : gérer les <strong>aléas climatiques infra-saisonniers</strong> — vagues de froid, pics de consommation journaliers —
        qui dévient de cette moyenne. La question clé n'est plus <em>"combien de GWh stocker ?"</em> mais{' '}
        <em>"quelle <strong>puissance de soutirage</strong> (GWh/j) souscrire pour couvrir un scénario de grand froid ?"</em>
      </IntuitionBlock>

      <div style={panelStyle}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Architecture de couverture — Fournisseur type</div>
        <pre style={{ color: T.text, fontSize: 12, lineHeight: 1.8, margin: 0, fontFamily: 'monospace' }}>
{`  Clients résidentiels  ─┐
  Clients industriels   ─┤→  FOURNISSEUR  ←→  Marché Forward  (saisonnalité ✓)
  Clients collectivités ─┘         ↕
                               STOCKAGE          ← gestion des ALÉAS
                          (cave saline : haute         (vagues de froid,
                           puissance, modulation        imbalances J-1)
                           infra-saisonnière)`}
        </pre>
      </div>

      <SectionTitle accent={ACCENT}>Les rôles du stockage pour un fournisseur hedgé en saisonnalité</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
        {[
          {
            num: '1', color: ACCENT,
            title: 'Puissance de pointe — couverture des vagues de froid',
            desc: "La couverture forward assure le volume mensuel moyen. Mais une vague de froid (−10 °C vs normale) peut doubler la consommation journalière pendant 5–7 jours. Le stockage doit fournir cette puissance de soutirage additionnelle : Q_sout ≥ α × ΔT (GWh/j). C'est la contrainte de dimensionnement principale pour un fournisseur déjà hedgé.",
          },
          {
            num: '2', color: T.a5,
            title: 'Gestion des imbalances J-1',
            desc: "Les nominations J-1 au gestionnaire réseau (GRTgaz/Teréga) imposent de déclarer le programme la veille. Les écarts entre nomination et consommation réalisée — liés aux températures intra-journalières et aux comportements clients — sont absorbés par des ajustements de soutirage ou d'injection de court terme.",
          },
          {
            num: '3', color: T.a4,
            title: 'Optionalité résiduelle sur la courbe forward',
            desc: "La partie non couverte par les forwards (extrêmes de température, profils clients atypiques) génère une valeur d'option résiduelle sur l'écart été/hiver. Ce n'est plus l'objectif principal du stockage pour un fournisseur hedgé, mais une source de P&L additionnelle — c'est cette valeur extrinsèque qu'optimise l'équation de Bellman.",
          },
        ].map(({ num, title, desc, color }) => (
          <div key={num} style={{ background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{num}</div>
            <div>
              <div style={{ color, fontWeight: 700, fontSize: 13 }}>{title}</div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7, marginTop: 3 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bloc 2 — Profil avec décomposition forward / aléas */}
      <SectionTitle accent={ACCENT}>Décomposition de la demande : forward vs aléas météo</SectionTitle>
      <IntuitionBlock emoji="📊" title="Ce que le forward couvre — ce que le stockage couvre" accent={ACCENT}>
        La couverture forward absorbe la consommation <strong>attendue</strong> de chaque mois (profil saisonnier modélisé par régression sur la température historique).
        Le stockage n'intervient que sur l'<strong>excès aléatoire</strong> : la déviation entre la consommation réalisée et ce profil attendu.
        Cet excès est modeste en énergie (~10–13 GWh/mois) mais très concentré dans le temps — quelques jours critiques de grand froid.
      </IntuitionBlock>

      <ChartWrapper title="Profil annuel (GWh/mois) — Décomposition couverture forward / aléas stockage" accent={ACCENT} height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={loadData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="mois" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
            <Line type="monotone" dataKey="demande" stroke={ACCENT} strokeWidth={2.5} dot={false} name="Demande clients (réalisé)" />
            <Line type="monotone" dataKey="couvertureForward" stroke={T.a4} strokeWidth={2} dot={false} strokeDasharray="6 3" name="Couverture forward (profil attendu)" />
            <Line type="monotone" dataKey="excèsAléatoire" stroke={T.a5} strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Excès aléatoire → stockage" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Bloc 3 — Dimensionnement par puissance */}
      <SectionTitle accent={ACCENT}>Dimensionnement de la puissance de soutirage</SectionTitle>
      <IntuitionBlock emoji="🌡️" title="La puissance, pas le volume, est le facteur limitant" accent={ACCENT}>
        Pour un fournisseur hedgé, la contrainte critique du stockage est la <strong>puissance de soutirage</strong> (GWh/j),
        pas le volume total (GWh). Une vague de froid crée un besoin instantané de gaz qu'il faut pouvoir servir en quelques heures.
        Le dimensionnement se fait par scénarios de stress thermique :
        <K display>{"Q_{\\text{sout}}^{\\text{requis}} = \\alpha \\times |\\Delta T| \\quad \\text{(GWh/j)}"}</K>
        où <K>{"\\alpha"}</K> est la <strong>sensibilité thermique</strong> du portefeuille (GWh/j par °C d'écart vs normale saisonnière).
      </IntuitionBlock>

      <div style={{ margin: '14px 0' }}>
        <Grid cols={3} gap="12px">
          <Slider label="Écart température ΔT (°C vs normale)" value={deltaT} min={1} max={20} step={1} onChange={setDeltaT} accent={ACCENT} format={v => `−${v} °C`} />
          <Slider label="Sensibilité thermique α (GWh/j/°C)" value={thermSens} min={0.5} max={5} step={0.1} onChange={setThermSens} accent={ACCENT} format={v => v.toFixed(1)} />
          <Slider label="Durée vague de froid (jours)" value={nJours} min={1} max={14} step={1} onChange={setNJours} accent={ACCENT} format={v => `${v} j`} />
        </Grid>
        <Slider label="Puissance de soutirage contractée Q_contr (GWh/j)" value={qContr} min={5} max={50} step={1} onChange={setQContr} accent={ACCENT} format={v => `${v} GWh/j`} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <InfoChip label="Q requis (pic)" value={qRequired} unit="GWh/j" accent={coverageOk ? T.a4 : ACCENT} />
          <InfoChip label="Énergie à mobiliser" value={eRequired} unit="GWh" accent={T.a5} />
          <InfoChip label="Q contracté" value={qContr} unit="GWh/j" accent={coverageOk ? T.a4 : T.muted} />
          <InfoChip label="Couverture" value={coverageOk ? '✓ OK' : `Déficit ${(qRequired - qContr).toFixed(1)} GWh/j`} accent={coverageOk ? T.a4 : ACCENT} />
        </div>
      </div>

      <div style={{ margin: '14px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Matrice de couverture par scénario de stress thermique</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <Th>Scénario</Th>
              <Th>ΔT (°C)</Th>
              <Th>Durée</Th>
              <Th>Q requis (GWh/j)</Th>
              <Th>E requise (GWh)</Th>
              <Th>Couverture</Th>
            </tr>
          </thead>
          <tbody>
            {scenarioData.map(s => (
              <tr key={s.label}>
                <Td><span style={{ fontWeight: 600 }}>{s.label}</span></Td>
                <Td>−{s.dT}</Td>
                <Td>{s.days} j</Td>
                <Td accent={s.covered ? T.a4 : ACCENT}>{s.qRequis}</Td>
                <Td>{s.eRequis}</Td>
                <Td accent={s.covered ? T.a4 : ACCENT}>{s.covered ? '✓ Couvert' : '✗ Déficit'}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>
          α = {thermSens.toFixed(1)} GWh/j/°C · Q contracté = {qContr} GWh/j — ajustez les sliders ci-dessus pour recalculer.
        </div>
      </div>

      <div style={{ ...panelStyle, margin: '14px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>📋 Quel type de stockage pour un fournisseur hedgé ?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              type: 'Caverne saline', icon: '⚡',
              power: 'Très haute (40–100 % working gas/j)',
              volume: 'Limitée (100–500 GWh typique)',
              usage: 'Idéal : cycles courts, haute puissance de pointe — répond aux vagues de froid et imbalances J-1.',
              color: ACCENT,
            },
            {
              type: 'Aquifère / Gisement', icon: '📦',
              power: 'Modérée (5–15 % working gas/j)',
              volume: 'Très haute (1–10 TWh)',
              usage: 'Adapté à la saisonnalité — mais déjà couverte par les forwards → intérêt moindre pour un fournisseur hedgé.',
              color: T.muted,
            },
          ].map(({ type, icon, power, volume, usage, color }) => (
            <div key={type} style={{ background: T.panel2, border: `1px solid ${color}44`, borderRadius: 8, padding: 12 }}>
              <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{icon} {type}</div>
              <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.7 }}>
                <div><strong style={{ color: T.text }}>Puissance :</strong> {power}</div>
                <div><strong style={{ color: T.text }}>Volume :</strong> {volume}</div>
                <div style={{ marginTop: 4 }}>{usage}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloc 4 — Contraintes opérationnelles */}
      <SectionTitle accent={ACCENT}>Contraintes opérationnelles</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '14px 0' }}>
        {[
          { title: 'Working Gas vs Cushion Gas', icon: '⛽', desc: "Le cushion gas maintient la pression structurelle de la caverne (indisponible). Seul le working gas est mobilisable — c'est la capacité effective pour la gestion des aléas." },
          { title: 'Droits de capacité (TSO)', icon: '📋', desc: "Injection et soutirage sont soumis à des capacités allouées par GRTgaz/Teréga via enchères annuelles (€/GWh/j). La puissance de soutirage est souvent la ressource rare et la plus coûteuse à souscrire." },
          { title: 'Nominations J-1', icon: '📅', desc: "Le programme d'injection/soutirage doit être déclaré la veille. Cette contrainte rend impossible les ajustements infra-journaliers — d'où l'importance d'une prévision météo J+1 précise pour estimer la consommation du lendemain." },
          { title: 'Coût opérationnel C(u)', icon: '💶', desc: "Injecter ou soutirer coûte : compression, usure, frais TSO. C(u) = c_op × |u|. Pour la gestion des aléas, ces coûts sont significatifs car les cycles sont courts et fréquents (vs une campagne saisonnière annuelle)." },
        ].map(({ title, icon, desc }) => (
          <div key={title} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{icon} {title}</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>{desc}</div>
          </div>
        ))}
      </div>

      <SymbolLegend accent={ACCENT} symbols={[
        ['V_t', 'Volume stocké à la date t (GWh) — état du stock'],
        ['S_t', 'Prix spot du gaz à t (€/MWh)'],
        ['u_t', 'Contrôle : débit injection (u>0) / soutirage (u<0) en GWh/j'],
        ['q_wit', 'Puissance de soutirage contractée (GWh/j) — contrainte de dimensionnement principale'],
        ['α', 'Sensibilité thermique du portefeuille (GWh/j par °C d\'écart vs normale)'],
        ['ΔT', 'Écart de température vs normale saisonnière (°C) — scénario de stress'],
        ['C(u)', 'Coût opérationnel : C(u) = c_op × |u|'],
      ]} />

      {/* Bloc 5 — Modèle mathématique */}
      <SectionTitle accent={ACCENT}>Modèle mathématique du problème</SectionTitle>
      <FormulaBox accent={ACCENT} label="Dynamique d'état — contrainte de puissance explicite">
        <K display>{"V_{t+1} = V_t + u_t \\cdot \\Delta t \\qquad V_{\\min} \\leq V_{t+1} \\leq V_{\\max}, \\quad |u_t| \\leq q_{\\text{wit}}"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          La contrainte <K>{"q_{\\text{wit}}"}</K> (puissance maximale de soutirage en GWh/j) est le paramètre de dimensionnement clé pour le fournisseur hedgé — elle doit couvrir le scénario de stress thermique retenu.
        </div>
      </FormulaBox>
      <FormulaBox accent={ACCENT} label="Cashflow instantané">
        <K display>{"\\pi(u_t, S_t) = -u_t \\cdot S_t \\cdot \\Delta t - C(u_t) \\qquad C(u) = c_{\\text{op}} \\cdot |u|"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          Si <K>{"u_t > 0"}</K> (injection) : on <strong>paie</strong> le gaz acheté. Si <K>{"u_t < 0"}</K> (soutirage) : on <strong>encaisse</strong> la vente sur le spot.
        </div>
      </FormulaBox>

      <div style={{ margin: '14px 0' }}>
        <Grid cols={2} gap="12px">
          <Slider label="Prix spot S (€/MWh)" value={spotPrice} min={10} max={80} step={1} onChange={setSpotPrice} accent={ACCENT} format={v => `${v} €`} />
          <Slider label="Contrôle u (GWh/mois)" value={control} min={-10} max={10} step={1} onChange={setControl} accent={ACCENT} format={v => v > 0 ? `+${v} inj` : v < 0 ? `${v} sout` : '0 attente'} />
        </Grid>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <InfoChip label="Cashflow π(u,S)" value={cashflow.toFixed(2)} unit="€" accent={cashflow >= 0 ? T.a4 : ACCENT} />
          <InfoChip label="Revenus bruts" value={(-control * spotPrice / 12).toFixed(2)} unit="€" accent={T.a5} />
          <InfoChip label="Coût opérationnel" value={(cOp * Math.abs(control) / 12).toFixed(2)} unit="€" accent={T.muted} />
          <InfoChip label="Action" value={control > 0 ? 'INJECTION' : control < 0 ? 'SOUTIRAGE' : 'ATTENTE'} accent={control > 0 ? T.a1 : control < 0 ? T.a4 : T.muted} />
        </div>
      </div>

      <Accordion title="Exercice — Dimensionner la puissance de stockage pour un portefeuille résidentiel" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.muted, fontSize: 13 }}>
          Un fournisseur gère 80 000 clients résidentiels. Sensibilité thermique unitaire : 0,3 kWh/client/°C/j.
          Scénario de dimensionnement retenu : vague de froid à −10 °C vs normale pendant 5 jours.
          Calculer la puissance de soutirage requise et l'énergie minimale à avoir en stock au début de l'épisode.
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Sensibilité portefeuille" ruleDetail="α = n_clients × α_unitaire" accent={ACCENT}>
            <K>{"\\alpha = 80\\,000 \\times 0.3 \\text{ kWh/°C/j} = 24\\,000 \\text{ kWh/°C/j} = 0.024 \\text{ GWh/°C/j}"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Puissance requise" ruleDetail="Q = α × ΔT" accent={ACCENT}>
            <K>{"Q_{\\text{sout}} = 0.024 \\times 10 = 0.24 \\text{ GWh/j}"}</K> — à comparer aux droits de soutirage souscrits auprès du TSO.
          </DemoStep>
          <DemoStep num={3} rule="Énergie à mobiliser" ruleDetail="E = Q × durée" accent={ACCENT}>
            <K>{"E = 0.24 \\times 5 = 1.2 \\text{ GWh}"}</K> — volume minimum en working gas au début de l'épisode, au-delà de la fourniture forward déjà contractée.
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ─── Onglet 2 : Équation de Bellman ──────────────────────────────────────────

export function BellmanTab() {
  const [kappa, setKappa] = useState(1.5)
  const [mu, setMu] = useState(40)
  const [sigma, setSigma] = useState(8)
  const [r, setR] = useState(0.05)
  const [qinj, setQinj] = useState(10)
  const [qwit, setQwit] = useState(10)

  const result = useMemo(() => {
    return runBellmanDP({ NV: 15, NS: 12, NT: 12, Vmin: 0, Vmax: 100, qinj, qwit, kappa, mu, sigma, r, cOp: 0.5, dt: 1 / 12 })
  }, [kappa, mu, sigma, r, qinj, qwit])

  const jMid = 6
  const iMid = 7

  const valueData = result.vGrid.map((v, i) => ({
    volume: +v.toFixed(1),
    valeur: +result.V[0][i][jMid].toFixed(2),
  }))

  const policyData = result.vGrid.map((v, i) => ({
    volume: +v.toFixed(1),
    contrôle: +result.policy[0][i][jMid].toFixed(2),
  }))

  const v0 = result.V[0][iMid][jMid]
  const u0 = result.policy[0][iMid][jMid]

  return (
    <div>

      {/* ── Bloc 1 : Intuition ─────────────────────────────────────────────── */}
      <IntuitionBlock emoji="♟️" title="L'idée de Bellman — décider à rebours" accent={ACCENT}>
        Imaginez que vous gérez un entrepôt de gaz sur 12 mois. En janvier, vous devez décider
        combien injecter ou soutirer. Mais cette décision dépend de ce qui se passera en février,
        mars… jusqu'en décembre. Problème classique : pour choisir aujourd'hui, il faut connaître
        la valeur de demain. Mais pour connaître demain, il faut connaître après-demain… et ainsi de suite.
        <br /><br />
        <strong>Bellman a eu une idée géniale en 1957 : résoudre à l'envers.</strong>
        On commence par la fin (décembre) : la réponse est simple, aucun cashflow futur, valeur = 0.
        On remonte ensuite mois par mois : <em>"si je suis en novembre avec X GWh et un prix de Y €/MWh,
        quelle est la meilleure action sachant ce que je sais sur décembre ?"</em>
        <br /><br />
        À chaque étape, on a <strong>déjà calculé la valeur de toutes les situations possibles du mois suivant</strong>.
        On choisit l'action qui maximise : <strong>gain immédiat + valeur future actualisée</strong>.
        C'est le <strong>Principe d'Optimalité</strong> : une décision optimale ne dépend que de l'état
        actuel (volume en stock + prix du gaz), pas du chemin parcouru pour y arriver.
      </IntuitionBlock>

      {/* ── Bloc 2 : Formule décryptée terme à terme ───────────────────────── */}
      <SectionTitle accent={ACCENT}>La formule — chaque terme expliqué</SectionTitle>

      <FormulaBox accent={ACCENT} label="Équation de Bellman — Fonction valeur du stockage">
        <K display>{"\\mathcal{V}_t(V,\\, S) = \\max_{u \\,\\in\\, \\mathcal{U}(V)} \\Bigl[\\; \\underbrace{\\pi(u, S)}_{\\textcircled{1}\\;\\text{gain immédiat}} \\;+\\; \\underbrace{e^{-r\\Delta t}}_{\\textcircled{2}\\;\\text{actualisation}} \\cdot \\underbrace{\\mathbb{E}_t\\!\\left[\\mathcal{V}_{t+1}(V + u\\Delta t,\\; S_{t+1})\\right]}_{\\textcircled{3}\\;\\text{valeur future espérée}} \\;\\Bigr]"}</K>
      </FormulaBox>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
        {[
          {
            tag: '𝒱ₜ(V, S)', color: ACCENT,
            title: 'La fonction valeur — "combien vaut mon stockage ?"',
            lines: [
              { k: 'Définition', v: 'La valeur totale optimale espérée du stockage à partir de la date t, étant donné l\'état actuel (V, S).' },
              { k: 'En français', v: '"Si j\'optimise parfaitement toutes mes décisions futures, combien ce stockage va-t-il me rapporter au total ?"' },
              { k: 'Variables d\'état', v: 'V = volume actuel en stock (GWh) · S = prix spot actuel du gaz (€/MWh). Ce sont les deux informations suffisantes pour décider.' },
              { k: 'Interprétation', v: 'C\'est une surface en 3D : pour chaque combinaison (V, S, t), elle donne la meilleure valeur atteignable.' },
            ],
          },
          {
            tag: 'max u ∈ 𝒰(V)', color: T.a5,
            title: 'Le "max" — choisir la meilleure action',
            lines: [
              { k: 'u (le contrôle)', v: 'Débit d\'injection (u > 0, on achète du gaz) ou de soutirage (u < 0, on vend), en GWh/mois. u = 0 = on attend.' },
              { k: '𝒰(V) (les actions possibles)', v: 'Ensemble des u autorisés physiquement : on ne peut pas soutirer plus que ce qu\'on a (u ≥ −V/Δt), ni injecter au-delà de la capacité max (u ≤ q_inj), ni dépasser V_max.' },
              { k: 'Le "max"', v: 'On teste toutes les actions possibles et on choisit celle qui donne le gain total le plus élevé. C\'est le cœur de l\'optimisation.' },
            ],
          },
          {
            tag: '① π(u, S)', color: T.a4,
            title: 'Le cashflow immédiat — ce qu\'on gagne ou paie maintenant',
            lines: [
              { k: 'Formule', v: 'π(u, S) = −u · S · Δt − c_op · |u|' },
              { k: 'Soutirage (u < 0)', v: 'On vend |u| GWh au prix S → recette = |u| · S · Δt euros (cashflow positif).' },
              { k: 'Injection (u > 0)', v: 'On achète u GWh au prix S → dépense = u · S · Δt euros (cashflow négatif).' },
              { k: 'c_op · |u|', v: 'Coût opérationnel (compression, usure, frais TSO) proportionnel au débit, dans les deux sens.' },
            ],
          },
          {
            tag: '② e^{−rΔt}', color: T.a2,
            title: 'L\'actualisation — un euro demain vaut moins qu\'aujourd\'hui',
            lines: [
              { k: 'r', v: 'Taux d\'actualisation annuel (ex : 5%). Représente le coût du capital — si on peut placer l\'argent à 5%/an, il faut actualiser les gains futurs.' },
              { k: 'Δt', v: 'Pas de temps = 1/12 an (1 mois). Sur un mois à r=5% : e^(−0.05/12) ≈ 0.9958 → la valeur de demain est réduite de ~0.4%.' },
              { k: 'Rôle', v: 'Sans actualisation (r=0), un gain en décembre vaut autant qu\'en janvier. Avec r > 0, on préfère encaisser tôt.' },
            ],
          },
          {
            tag: '③ 𝔼ₜ[𝒱ₜ₊₁(…)]', color: T.a7,
            title: 'L\'espérance — le futur est incertain, on en prend la moyenne pondérée',
            lines: [
              { k: 'Pourquoi une espérance ?', v: 'S_{t+1} (le prix du mois prochain) est aléatoire — on ne le connaît pas encore en t. On calcule la moyenne de 𝒱ₜ₊₁ sur tous les prix possibles, pondérée par leurs probabilités.' },
              { k: 'En pratique', v: 'S est discrétisé en NS valeurs sur une grille. La matrice de transition Π[j][k] donne la probabilité de passer du prix S_j au prix S_k en un mois (calculée depuis le processus OU — voir onglet "Processus de Prix").' },
              { k: 'Calcul', v: '𝔼[𝒱ₜ₊₁(V\', S\')] = Σ_k Π[j][k] · 𝒱ₜ₊₁(V\', S_k) — somme pondérée sur tous les prix futurs possibles S_k.' },
              { k: 'V\' = V + u·Δt', v: 'Le volume au mois suivant est déterministe une fois u choisi : nouvelle quantité en stock après injection/soutirage.' },
            ],
          },
        ].map(({ tag, color, title, lines }) => (
          <div key={tag} style={{ background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <code style={{ color, fontWeight: 800, fontSize: 12, background: `${color}18`, padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>{tag}</code>
              <span style={{ color, fontWeight: 700, fontSize: 13 }}>{title}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {lines.map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.65 }}>
                  <span style={{ color, fontWeight: 700, minWidth: 140, flexShrink: 0 }}>{k} :</span>
                  <span style={{ color: T.muted }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <FormulaBox accent={ACCENT} label="Condition terminale — point de départ du calcul à rebours">
        <K display>{"\\mathcal{V}_T(V, S) = 0"}</K>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 8, lineHeight: 1.75 }}>
          <strong style={{ color: T.text }}>Pourquoi zéro ?</strong> À l'échéance T, plus aucune décision
          n'est possible — le contrat de stockage est terminé. Il n'y a donc plus de cashflows futurs à optimiser.
          C'est le point de départ du calcul à rebours : on sait que 𝒱_T = 0, on peut donc calculer 𝒱_{T-1}, puis 𝒱_{T-2}, etc.
          <br /><br />
          <strong style={{ color: T.text }}>Variante avec pénalité de restitution :</strong> certains contrats
          imposent de restituer le stock à un niveau minimum <K>{"V_{\\min}^T"}</K> (ex : remplissage de début de saison).
          On ajoute alors une pénalité pour les stocks trop bas :
          <K display>{"\\mathcal{V}_T(V, S) = -\\lambda \\cdot \\max(V_{\\min}^T - V,\\; 0)"}</K>
          où <K>{"\\lambda"}</K> (€/GWh) est le prix de pénalité. Cela force l'algorithme à anticiper
          la restitution dès les mois précédents.
        </div>
      </FormulaBox>

      {/* ── Bloc 3 : Algorithme pas à pas ─────────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Comment on résout concrètement — algorithme pas à pas</SectionTitle>

      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, margin: '0 0 12px' }}>
        On discrétise le problème sur trois grilles : <strong style={{ color: ACCENT }}>NV nœuds de volume</strong> (de V_min à V_max),
        <strong style={{ color: T.a5 }}> NS nœuds de prix</strong> (centré sur μ, étalé sur ±3σ),
        et <strong style={{ color: T.a4 }}> NT pas de temps</strong> (12 mois). Total : 15 × 12 × 12 = <strong>2 160 nœuds</strong>,
        chacun avec sa valeur et sa politique optimale.
      </div>

      <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Step num={1} accent={ACCENT}>
          <div>
            <strong>Initialisation (t = T) :</strong> poser{' '}
            <code style={{ color: T.a4, background: `${T.a4}18`, padding: '1px 5px', borderRadius: 3 }}>𝒱[T][i][j] = 0</code>{' '}
            pour tous les nœuds (i = indice de volume, j = indice de prix). C'est notre condition terminale.
          </div>
        </Step>
        <Step num={2} accent={ACCENT}>
          <div>
            <strong>Boucle backward : de t = T−1 jusqu'à t = 0.</strong> À chaque pas, la table du mois
            suivant est déjà complète — on peut donc l'utiliser pour calculer la table du mois courant.
          </div>
        </Step>
        <Step num={3} accent={ACCENT}>
          <div>
            <strong>Pour chaque nœud (V_i, S_j) :</strong> on se pose la question "si je suis
            dans cette situation précise au mois t, quelle est la meilleure action ?"
          </div>
        </Step>
        <Step num={4} accent={ACCENT}>
          <div>
            <strong>Tester toutes les actions u :</strong> on énumère u ∈ {'{'}−q_wit, …, 0, …, +q_inj{'}'} (ici 11 valeurs).
            Pour chaque u, on calcule V' = V_i + u·Δt et on vérifie V_min ≤ V' ≤ V_max.
            Si la contrainte est violée, on ignore cette action (pas physiquement réalisable).
          </div>
        </Step>
        <Step num={5} accent={ACCENT}>
          <div>
            <strong>Calculer l'espérance du mois suivant :</strong>{' '}
            <code style={{ color: T.a5, background: `${T.a5}18`, padding: '1px 5px', borderRadius: 3 }}>
              𝔼[𝒱ₜ₊₁(V', S')] = Σ_k Π[j][k] · interp(𝒱ₜ₊₁[·][k], V')
            </code>{' '}
            où Π[j][k] est la probabilité que le prix passe de S_j à S_k. L'interpolation linéaire
            gère les volumes V' qui tombent entre deux nœuds de la grille.
          </div>
        </Step>
        <Step num={6} accent={ACCENT}>
          <div>
            <strong>Calculer le gain total et sélectionner le meilleur u :</strong>{' '}
            <code style={{ color: T.a4, background: `${T.a4}18`, padding: '1px 5px', borderRadius: 3 }}>
              gain(u) = π(u, S_j) + e^(−rΔt) · 𝔼[𝒱ₜ₊₁(V', S')]
            </code>.
            On retient u* = argmax gain(u) et on stocke{' '}
            <code style={{ color: ACCENT, background: `${ACCENT}18`, padding: '1px 5px', borderRadius: 3 }}>𝒱[t][i][j] = gain(u*)</code>{' '}
            ainsi que la politique <code>u*[t][i][j]</code>.
          </div>
        </Step>
        <Step num={7} accent={ACCENT}>
          <div>
            <strong>Lecture du résultat :</strong> après avoir remonté jusqu'à t = 0, on lit{' '}
            <code style={{ color: ACCENT, background: `${ACCENT}18`, padding: '1px 5px', borderRadius: 3 }}>𝒱[0][i₀][j₀]</code>{' '}
            = valeur totale du stockage à l'état initial. La table <code>u*[t][i][j]</code> donne
            la décision optimale à prendre chaque mois en fonction de l'état réalisé.
          </div>
        </Step>
      </div>

      {/* ── Bloc 4 : Simulation interactive ────────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Explorer l'effet de chaque paramètre</SectionTitle>

      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, margin: '0 0 12px' }}>
        Faites varier les paramètres ci-dessous et observez comment la{' '}
        <strong style={{ color: ACCENT }}>fonction valeur</strong> (graphe gauche) et la{' '}
        <strong style={{ color: T.a4 }}>politique optimale</strong> (graphe droite) réagissent.
        Résultats affichés à prix médian S = μ et en début de période t = 0, avec 50 GWh en stock.
      </div>

      <Grid cols={3} gap="12px">
        <Slider label="κ — vitesse de retour à la moyenne" value={kappa} min={0.5} max={5} step={0.1} onChange={setKappa} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="μ — prix d'équilibre long terme (€/MWh)" value={mu} min={20} max={80} step={1} onChange={setMu} accent={ACCENT} format={v => `${v} €`} />
        <Slider label="σ — volatilité instantanée (€/MWh)" value={sigma} min={1} max={25} step={0.5} onChange={setSigma} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="r — taux d'actualisation annuel" value={r} min={0} max={0.15} step={0.005} onChange={setR} accent={ACCENT} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="q_inj — débit max injection (GWh/mois)" value={qinj} min={2} max={20} step={1} onChange={setQinj} accent={ACCENT} format={v => `${v}`} />
        <Slider label="q_wit — débit max soutirage (GWh/mois)" value={qwit} min={2} max={20} step={1} onChange={setQwit} accent={ACCENT} format={v => `${v}`} />
      </Grid>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="𝒱₀(50 GWh, μ)" value={v0.toFixed(2)} unit="€" accent={ACCENT} />
        <InfoChip label="Décision optimale u*" value={u0 > 0.5 ? `+${u0.toFixed(1)} inj` : u0 < -0.5 ? `${u0.toFixed(1)} sout` : '0 attente'} accent={u0 > 0.5 ? T.a1 : u0 < -0.5 ? T.a4 : T.muted} />
        <InfoChip label="Grille DP" value="15×12×12" unit="nœuds" accent={T.muted} />
      </div>

      <Grid cols={2} gap="16px">
        <ChartWrapper title="Fonction valeur 𝒱₀(V, S=μ) — valeur selon le niveau de stock" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={valueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="volume" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Volume (GWh)', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -3 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
              <Line type="monotone" dataKey="valeur" stroke={ACCENT} strokeWidth={2.5} dot={false} name="𝒱₀(V, μ)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Politique optimale u*(V, S=μ) — action selon le niveau de stock" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={policyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="volume" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Volume (GWh)', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -3 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={T.muted} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="contrôle" stroke={T.a4} strokeWidth={2.5} dot={false} name="u*(V, μ)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>

      {/* Clés de lecture des graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '14px 0' }}>
        {[
          {
            title: 'Lire la fonction valeur (gauche)', color: ACCENT,
            items: [
              'Croissante : plus de stock = plus de flexibilité future = plus de valeur.',
              'S\'aplatit en V_max : on ne peut plus injecter → valeur marginale du GWh supplémentaire → 0.',
              'S\'aplatit en V_min : plus rien à soutirer → même phénomène à l\'autre extrême.',
              'Augmenter σ → courbe plus haute : le stockage est convexe, il profite de la volatilité (valeur d\'option).',
              'Augmenter r → courbe plus basse : les gains futurs sont davantage dépréciés.',
            ],
          },
          {
            title: 'Lire la politique optimale (droite)', color: T.a4,
            items: [
              'Zone u > 0 (en haut) : stock bas → on injecte pour se reconstituer en vue d\'un pic de prix futur.',
              'Zone u < 0 (en bas) : stock élevé → on soutire pour encaisser au prix actuel.',
              'Zone u ≈ 0 (au milieu) : stock intermédiaire + prix médian → on attend un signal plus fort.',
              'Augmenter q_wit ou q_inj → les seuils s\'élargissent, la politique est plus agressive.',
              'Augmenter σ → la zone d\'attente se rétrécit : avec plus de volatilité, agir tôt est plus rentable.',
            ],
          },
        ].map(({ title, color, items }) => (
          <div key={title} style={{ background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>{title}</div>
            {items.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                <span style={{ color, flexShrink: 0, fontSize: 11, fontWeight: 700 }}>→</span>
                <span style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>{p}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Bloc 5 : Exercice ──────────────────────────────────────────────── */}
      <Accordion title="Exercice — Calculer manuellement un nœud de la grille Bellman" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.75 }}>
          Stockage simplifié : 2 pas de temps (t=0 et t=1), 1 nœud de volume (V = 50 GWh),
          2 états de prix possibles au pas suivant : S_bas = 30 €/MWh (probabilité 0.4)
          et S_haut = 60 €/MWh (probabilité 0.6). Condition terminale : 𝒱₁ = 0 partout.
          Paramètres : q_wit = 10 GWh/mois, c_op = 0.5 €/GWh, r = 0, Δt = 1/12 an.
          Prix actuel S₀ = 45 €/MWh.
          <br /><br />
          <strong>Question :</strong> calculer 𝒱₀(50 GWh, 45 €/MWh). Quelle est la décision optimale ?
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Condition terminale" ruleDetail="valeur nulle à l'échéance" accent={ACCENT}>
            𝒱₁(V', S_bas) = 0 et 𝒱₁(V', S_haut) = 0 pour tout V'.
            Aucun cashflow possible après t=1 → valeur nulle. C'est notre point de départ.
          </DemoStep>
          <DemoStep num={2} rule="Tester u = 0 (attendre)" ruleDetail="π = 0, espérance = 0" accent={ACCENT}>
            Pas de mouvement de gaz → π(0, 45) = 0. Volume inchangé : V' = 50 GWh.{' '}
            <K>{"\\mathbb{E}[\\mathcal{V}_1] = 0.4 \\times 0 + 0.6 \\times 0 = 0"}</K>.{' '}
            Gain(u=0) = 0 + 0 = <strong style={{ color: T.a5 }}>0 €</strong>.
          </DemoStep>
          <DemoStep num={3} rule="Tester u = −10 (soutirer 10 GWh)" ruleDetail="π = −u·S·Δt − c_op·|u|" accent={ACCENT}>
            <K>{"\\pi = -(-10) \\times 45 \\times \\tfrac{1}{12} - 0.5 \\times 10 \\times \\tfrac{1}{12} = +37.5 - 0.42 = +37.1 \\;\\text{€}"}</K>
            <br />
            V' = 50 − 10/12 = 49.2 GWh. Espérance future :{' '}
            <K>{"0.4 \\times 0 + 0.6 \\times 0 = 0"}</K>.{' '}
            Gain(u=−10) = 37.1 + 0 = <strong style={{ color: ACCENT }}>+37.1 €</strong>.
          </DemoStep>
          <DemoStep num={4} rule="Sélection du maximum" ruleDetail="u* = argmax gain(u)" accent={ACCENT}>
            max(0, 37.1) = 37.1 → <strong>u* = −10 GWh/mois (soutirer au maximum)</strong>.
            <br />
            <strong style={{ color: ACCENT }}>𝒱₀(50, 45) = 37.1 €</strong>.
            <br />
            <span style={{ color: T.muted }}>
              Interprétation : avec une valeur terminale nulle (pas de cashflow futur dans ce mini-exemple),
              le mieux est de vendre immédiatement le gaz disponible plutôt qu'attendre.
              Dans le modèle complet à 12 mois, l'espérance future serait non nulle et l'arbitrage
              entre "vendre maintenant" et "attendre un prix plus haut" serait moins trivial.
            </span>
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ─── Onglet 3 : Processus de Prix ────────────────────────────────────────────

export function PrixTab() {
  const [kappa, setKappa] = useState(1.5)
  const [mu, setMu] = useState(40)
  const [sigma, setSigma] = useState(8)
  const [s0, setS0] = useState(55)
  const [seed, setSeed] = useState(0)

  const NT = 252
  const dt = 1 / NT
  const COLORS = [ACCENT, T.a4, T.a5]

  const paths = useMemo(() => {
    const eMk = Math.exp(-kappa * dt)
    const condStd = sigma * Math.sqrt((1 - Math.exp(-2 * kappa * dt)) / (2 * Math.max(kappa, 0.01)))
    const result = []
    for (let p = 0; p < 3; p++) {
      let S = s0
      const pts = [{ t: 0, [`S${p + 1}`]: +s0.toFixed(2), mu }]
      for (let i = 1; i <= NT; i++) {
        const condMean = S * eMk + mu * (1 - eMk)
        S = condMean + condStd * gaussRand()
        if (i % 3 === 0) pts.push({ t: +(i * dt).toFixed(3), [`S${p + 1}`]: +S.toFixed(2), mu })
      }
      result.push(pts)
    }
    // merge into single array
    const merged = result[0].map((pt, i) => ({
      ...pt,
      ...result[1][i],
      ...result[2][i],
    }))
    return merged
  }, [kappa, mu, sigma, s0, seed])

  const halfLife = (Math.log(2) / kappa * 365).toFixed(0)
  const statStd = (sigma / Math.sqrt(2 * kappa)).toFixed(1)

  // Build simple 5×5 transition matrix for display
  const NS_display = 5
  const sGridD = Array.from({ length: NS_display }, (_, j) => mu - 2 * parseFloat(statStd) + j * parseFloat(statStd))
  const PiD = buildTransitionMatrix(NS_display, sGridD, kappa, mu, sigma, 1 / 12)

  return (
    <div>
      <IntuitionBlock emoji="🌀" title="Pourquoi un processus de retour à la moyenne ?" accent={ACCENT}>
        Contrairement aux actions, le gaz ne peut pas monter indéfiniment : au-delà d'un certain prix,
        les industriels substituent d'autres sources d'énergie et l'offre s'adapte.
        En dessous d'un plancher, les producteurs ferment des puits.
        Le <strong>coût marginal de production</strong> crée un ancrage fondamental <K>{"\\mu"}</K> vers lequel le prix revient toujours.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Processus Ornstein-Uhlenbeck (OU)">
        <K display>{"dS_t = \\kappa(\\mu - S_t)\\,dt + \\sigma\\,dW_t"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          <K>{"\\kappa"}</K> : force de rappel — <K>{"\\mu"}</K> : niveau moyen long terme — <K>{"\\sigma"}</K> : volatilité instantanée
        </div>
      </FormulaBox>

      <Grid cols={4} gap="12px">
        <Slider label="Vitesse κ" value={kappa} min={0.3} max={5} step={0.1} onChange={setKappa} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="Moyenne μ (€/MWh)" value={mu} min={20} max={80} step={1} onChange={setMu} accent={ACCENT} format={v => `${v}`} />
        <Slider label="Volatilité σ" value={sigma} min={1} max={25} step={0.5} onChange={setSigma} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="Prix initial S₀" value={s0} min={10} max={80} step={1} onChange={setS0} accent={ACCENT} format={v => `${v}`} />
      </Grid>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
        <InfoChip label="Demi-vie" value={halfLife} unit="jours" accent={ACCENT} />
        <InfoChip label="Écart-type stationnaire σ/√(2κ)" value={statStd} unit="€/MWh" accent={T.a5} />
        <InfoChip label="Intervalle ±2σ" value={`[${(mu - 2 * parseFloat(statStd)).toFixed(0)}, ${(mu + 2 * parseFloat(statStd)).toFixed(0)}]`} unit="€" accent={T.muted} />
        <button onClick={() => setSeed(s => s + 1)} style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, borderRadius: 6, padding: '4px 12px', color: ACCENT, fontSize: 11, cursor: 'pointer' }}>
          Nouvelles trajectoires
        </button>
      </div>

      <ChartWrapper title="3 trajectoires du prix du gaz — Processus OU" accent={ACCENT} height={250}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={paths} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 't (années)', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -3 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
            <ReferenceLine y={mu} stroke={T.a4} strokeDasharray="6 3" label={{ value: 'μ', fill: T.a4, fontSize: 12 }} />
            <ReferenceLine y={mu + 2 * parseFloat(statStd)} stroke={T.muted} strokeDasharray="3 3" />
            <ReferenceLine y={mu - 2 * parseFloat(statStd)} stroke={T.muted} strokeDasharray="3 3" />
            {[1, 2, 3].map((p, idx) => (
              <Line key={p} type="monotone" dataKey={`S${p}`} stroke={COLORS[idx]} strokeWidth={1.5} dot={false} name={`Scénario ${p}`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Discrétisation en chaîne de Markov</SectionTitle>
      <FormulaBox accent={ACCENT} label="Solution discrète du processus OU">
        <K display>{"S_{t+1} = S_t \\cdot e^{-\\kappa \\Delta t} + \\mu(1 - e^{-\\kappa \\Delta t}) + \\sigma_{\\Delta t} \\cdot \\varepsilon \\qquad \\varepsilon \\sim \\mathcal{N}(0,1)"}</K>
        <K display>{"\\sigma_{\\Delta t} = \\sigma\\sqrt{\\frac{1 - e^{-2\\kappa\\Delta t}}{2\\kappa}}"}</K>
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, margin: '10px 0' }}>
        Pour le backward DP, on discrétise les états de prix en une grille <K>{"\\{s_1, \\ldots, s_M\\}"}</K> et on calcule la matrice de transition :
      </div>
      <FormulaBox accent={ACCENT} label="Matrice de transition">
        <K display>{"\\Pi_{jk} = \\mathbb{P}(S_{t+1} = s_k \\mid S_t = s_j) \\propto \\exp\\!\\left(-\\frac{(s_k - \\bar{s}_j)^2}{2\\sigma_{\\Delta t}^2}\\right)"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          <K>{"\\bar{s}_j = s_j e^{-\\kappa\\Delta t} + \\mu(1-e^{-\\kappa\\Delta t})"}</K> : espérance conditionnelle. Chaque ligne est normalisée à 1.
        </div>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Matrice de transition Π (grille 5×5 illustrative)</SectionTitle>
      <div style={{ overflowX: 'auto', margin: '10px 0' }}>
        <table style={{ ...tableStyle, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <Th>S_t \ S_{t+1}</Th>
              {sGridD.map((s, k) => <Th key={k}>{s.toFixed(0)} €</Th>)}
            </tr>
          </thead>
          <tbody>
            {PiD.map((row, j) => (
              <tr key={j}>
                <Td accent={ACCENT}>{sGridD[j].toFixed(0)} €</Td>
                {row.map((p, k) => <Td key={k} accent={p > 0.3 ? T.a4 : p > 0.1 ? T.a5 : T.muted}>{(p * 100).toFixed(1)}%</Td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>
        Les valeurs en vert correspondent aux transitions les plus probables (voisins directs dans la grille). Chaque ligne somme à 100%.
      </div>

      <Accordion title="Exercice — Calibrer κ par la méthode des moments" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.muted, fontSize: 13 }}>
          On observe 24 prix mensuels du gaz TTF. La corrélation entre S_t et S_{'{'}t+1{'}'} vaut 0.72.
          Estimer κ et la demi-vie du processus.
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Corrélation OU" ruleDetail="corr = e^{-κΔt}" accent={ACCENT}>
            <K>{"\\text{corr}(S_t, S_{t+1}) = e^{-\\kappa \\Delta t} \\Rightarrow e^{-\\kappa/12} = 0.72"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Résoudre κ" ruleDetail="-ln(corr)/Δt" accent={ACCENT}>
            <K>{"\\kappa = -12 \\ln(0.72) = -12 \\times (-0.329) \\approx 3.94 \\text{ an}^{-1}"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Demi-vie" ruleDetail="ln(2)/κ" accent={ACCENT}>
            <K>{"t_{1/2} = \\frac{\\ln 2}{\\kappa} = \\frac{0.693}{3.94} \\approx 0.176 \\text{ an} \\approx 64 \\text{ jours}"}</K>
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ─── Onglet 4 : Valeur Intrinsèque & Extrinsèque ─────────────────────────────

export function ValeurTab() {
  const [spread, setSpread] = useState(15)
  const [sigma, setSigma] = useState(8)
  const [kappa, setKappa] = useState(1.5)
  const mu = 40

  const dpParams = { NV: 12, NT: 12, Vmin: 0, Vmax: 100, qinj: 10, qwit: 10, mu, r: 0.05, cOp: 0.5, dt: 1 / 12 }

  // Valeur intrinsèque (déterministe)
  const intrinsic = useMemo(() => {
    return runIntrinsicDP({ ...dpParams, spread })
  }, [spread])

  // Valeur stochastique (Bellman complet)
  const stochastic = useMemo(() => {
    return runBellmanDP({ ...dpParams, NS: 10, kappa, sigma })
  }, [kappa, sigma])

  const iMid = 6
  const jMid = 5

  const VI = intrinsic.V[0][iMid]
    ? intrinsic.V[0][iMid]
    : 0
  const viVal = intrinsic.V[0] ? linInterp(intrinsic.vGrid, intrinsic.V[0], 50) : 0
  const vstochVal = stochastic.V[0] ? stochastic.V[0][iMid][jMid] : 0
  const VE = Math.max(0, vstochVal - viVal)
  const ratio = vstochVal > 0.01 ? (VE / vstochVal * 100).toFixed(1) : '—'

  // Profile inject/soutire
  const profileData = intrinsic.injProfile.map((u, t) => ({
    mois: MONTHS[t % 12],
    action: +u.toFixed(2),
    prix: +intrinsic.fwd[t].toFixed(1),
  }))

  // VE vs sigma sweep
  const sigmaRange = [2, 4, 6, 8, 10, 12, 15, 18, 22]
  const veVsSigma = useMemo(() => {
    return sigmaRange.map(s => {
      const stoch = runBellmanDP({ ...dpParams, NS: 8, kappa, sigma: s })
      const vi = intrinsic.V[0] ? linInterp(intrinsic.vGrid, intrinsic.V[0], 50) : 0
      const vs = stoch.V[0][Math.floor(8 / 2)][4]
      return { sigma: s, VE: +Math.max(0, vs - vi).toFixed(2) }
    })
  }, [kappa, spread])

  return (
    <div>
      <IntuitionBlock emoji="💡" title="La décomposition fondamentale V₀ = VI + VE" accent={ACCENT}>
        Toute la valeur d'un stockage se décompose en deux parties orthogonales :<br />
        <strong>Valeur Intrinsèque (VI)</strong> = ce qu'on peut gagner aujourd'hui sur la courbe forward actuelle, en supposant que les prix futurs sont déjà connus (problème déterministe).<br />
        <strong>Valeur Extrinsèque (VE)</strong> = la prime d'optionalité — la valeur supplémentaire que l'incertitude et la flexibilité ajoutent. C'est ce que l'imprévisibilité nous rapporte, pas ce qu'elle nous coûte.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Décomposition VI / VE">
        <K display>{"\\underbrace{\\mathcal{V}_0(V_0, S_0)}_{\\text{Valeur totale (Bellman stochastique)}} = \\underbrace{VI}_{\\text{valeur sur courbe forward figée}} + \\underbrace{VE}_{\\text{prime d'optionalité}}"}</K>
        <K display>{"VE = \\mathcal{V}_0^{\\text{stoch}} - \\mathcal{V}_0^{\\text{déterm}} \\geq 0"}</K>
      </FormulaBox>

      {/* VI section */}
      <SectionTitle accent={ACCENT}>Valeur Intrinsèque — Le plan déterministe</SectionTitle>
      <IntuitionBlock emoji="📋" title="VI : optimisation sur courbe forward figée" accent={ACCENT}>
        La VI correspond à la valeur qu'on obtient en résolvant le même backward DP,
        mais <strong>sans incertitude sur les prix futurs</strong> : on utilise directement la courbe forward <K>{"F(0,t)"}</K>
        comme si les prix futurs étaient parfaitement connus aujourd'hui. C'est le "business plan" du stockage.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Valeur Intrinsèque — Problème déterministe">
        <K display>{"VI = \\max_{\\{u_t\\}} \\sum_{t=0}^{T-1} e^{-rt}\\,\\pi(u_t,\\, F(0,t)) \\quad \\text{s.c. contraintes de stockage}"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          Même backward DP mais <K>{"\\mathbb{E}_t[\\mathcal{V}_{t+1}(V', S_{t+1})]"}</K> remplacé par <K>{"\\mathcal{V}_{t+1}(V', F(0,t+1))"}</K> directement — pas d'intégration stochastique.
        </div>
      </FormulaBox>

      <Slider label="Spread été/hiver (€/MWh)" value={spread} min={0} max={40} step={1} onChange={setSpread} accent={ACCENT} format={v => `${v} €`} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
        <InfoChip label="Valeur Intrinsèque VI" value={viVal.toFixed(2)} unit="€" accent={ACCENT} />
        <InfoChip label="Spread été/hiver" value={`${spread} €/MWh`} accent={T.a5} />
        <InfoChip label="Courbe forward : été" value={`${(mu - spread / 2).toFixed(0)} €`} accent={T.a1} />
        <InfoChip label="Courbe forward : hiver" value={`${(mu + spread / 2).toFixed(0)} €`} accent={T.a8} />
      </div>

      <Grid cols={2} gap="16px">
        <ChartWrapper title="Courbe forward saisonnière F(0,t)" accent={ACCENT} height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profileData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="mois" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
              <ReferenceLine y={mu} stroke={T.muted} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="prix" stroke={T.a5} strokeWidth={2} dot={false} name="F(0,t)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Politique optimale — profil inject/soutire" accent={ACCENT} height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profileData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="mois" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={T.muted} />
              <Bar dataKey="action" fill={ACCENT} name="u* (GWh/mois)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>

      {/* VE section */}
      <SectionTitle accent={ACCENT}>Valeur Extrinsèque — La prime d'optionalité</SectionTitle>
      <IntuitionBlock emoji="🎯" title="VE : ce que l'incertitude nous rapporte" accent={ACCENT}>
        La VE est positive car le stockage est un actif <strong>convexe</strong> (voir onglet Delta &amp; Couverture).
        Quand le prix bouge dans n'importe quelle direction, on peut s'adapter :
        soutirer si le prix monte plus que prévu, injecter si il baisse davantage.
        Cette flexibilité vaut d'autant plus que les prix sont volatils.
      </IntuitionBlock>

      <Grid cols={3} gap="12px">
        <Slider label="Volatilité σ (€/MWh)" value={sigma} min={1} max={22} step={0.5} onChange={setSigma} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="Vitesse retour κ" value={kappa} min={0.3} max={5} step={0.1} onChange={setKappa} accent={ACCENT} format={v => v.toFixed(1)} />
      </Grid>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
        <InfoChip label="Valeur totale V₀" value={vstochVal.toFixed(2)} unit="€" accent={T.a4} />
        <InfoChip label="VI (déterministe)" value={viVal.toFixed(2)} unit="€" accent={T.a5} />
        <InfoChip label="VE (optionalité)" value={VE.toFixed(2)} unit="€" accent={ACCENT} />
        <InfoChip label="Ratio VE/V₀" value={`${ratio}%`} accent={VE > viVal * 0.1 ? ACCENT : T.muted} />
      </div>

      <ChartWrapper title="VE en fonction de σ — La VE croît avec la volatilité" accent={ACCENT} height={200}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={veVsSigma} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sigma" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'σ (€/MWh)', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -3 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
            <Line type="monotone" dataKey="VE" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 3 }} name="Valeur Extrinsèque" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Rolling Intrinsic */}
      <SectionTitle accent={ACCENT}>Stratégie Rolling Intrinsic — La pratique industrielle</SectionTitle>
      <IntuitionBlock emoji="🔄" title="Comment un fournisseur gère son stockage au quotidien" accent={ACCENT}>
        La stratégie <strong>Rolling Intrinsic</strong> est la référence industrielle.
        Elle sépare proprement la valeur certaine (VI, couverte dès le départ) de la valeur optionnelle (VE, capturée progressivement).
        C'est le standard des trading desks gaz en Europe.
      </IntuitionBlock>

      <div style={panelStyle}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Séquence opérationnelle</div>
        {[
          { jour: 'J = 0 (début campagne)', action: 'Calculer la VI sur la courbe forward du jour', resultat: 'Vendre en forward pour "locker" VI = 2 M€. Position : delta-neutre sur VI.' },
          { jour: 'J = 15', action: 'La courbe forward se tend (hiver anticipé plus froid)', resultat: 'Reoptimiser → nouvelle VI = 2.4 M€. Ajuster la position forward. VE capturée = +0.4 M€.' },
          { jour: 'J = 45', action: 'Baisse de température → prix hivernal encore plus haut', resultat: 'Reoptimiser → VI = 2.7 M€. Ajuster. VE totale capturée jusqu\'ici = 0.7 M€.' },
          { jour: 'Échéance', action: 'Exécution physique des injections/soutiages selon le plan final', resultat: 'P&L total = VI initiale + VE capturée - coûts opérationnels.' },
        ].map(({ jour, action, resultat }) => (
          <div key={jour} style={{ borderLeft: `3px solid ${ACCENT}44`, paddingLeft: 12, marginBottom: 12 }}>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12 }}>{jour}</div>
            <div style={{ color: T.text, fontSize: 12, marginTop: 2 }}>{action}</div>
            <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>→ {resultat}</div>
          </div>
        ))}
      </div>

      <SectionTitle accent={ACCENT}>Attribution de P&L</SectionTitle>
      <table style={tableStyle}>
        <thead>
          <tr>
            <Th>Composante P&L</Th>
            <Th>Source</Th>
            <Th>Caractéristiques</Th>
          </tr>
        </thead>
        <tbody>
          {[
            ['P&L Intrinsèque', 'Gain/perte sur les forwards vendus à J=0', 'Quasi-certain, couvert dès le départ'],
            ['P&L Extrinsèque', 'Reoptimisations successives au fil des jours', 'Variable, dépend de la vol réalisée'],
            ['P&L Opérationnel', 'Coûts réels injection/soutirage vs modèle', 'Friction, toujours négatif (coûts > 0)'],
            ['P&L Total', 'VI + VE - coûts', 'Objectif : maximiser sur la durée de vie'],
          ].map(([comp, source, carac]) => (
            <tr key={comp}>
              <Td accent={ACCENT}>{comp}</Td>
              <Td>{source}</Td>
              <Td accent={T.muted}>{carac}</Td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionTitle accent={ACCENT}>Profil fournisseur : qui valorise quoi ?</SectionTitle>
      <table style={tableStyle}>
        <thead>
          <tr>
            <Th>Profil fournisseur</Th>
            <Th>Demande clients</Th>
            <Th>Priorité VI/VE</Th>
            <Th>Stratégie stockage</Th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Résidentiel/collectivités', 'Prévisible, très saisonnière', 'VI dominante (plan fixe)', 'Couvrir le pic hivernal, peu de reoptimisation'],
            ['Industriels', 'Variable, sensible à la production', 'VI + VE équilibrées', 'Rolling intrinsic actif, ajustements fréquents'],
            ['Trader pur', 'Aucune (position nette)', 'VE maximale', 'Maximiser la vol capturée, gamma long'],
          ].map(([profil, demande, priorite, strategie]) => (
            <tr key={profil}>
              <Td accent={ACCENT}>{profil}</Td>
              <Td>{demande}</Td>
              <Td accent={T.a5}>{priorite}</Td>
              <Td>{strategie}</Td>
            </tr>
          ))}
        </tbody>
      </table>

      <Accordion title="Exercice — Comparer VI et VE selon le scénario météo" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.muted, fontSize: 13 }}>
          Le marché intègre un hiver "normal" (spread = 15 €/MWh). Deux scénarios se matérialisent :
          A) Hiver très froid → spread réel = 28 €/MWh. B) Hiver doux → spread réel = 5 €/MWh.
          Pour un fournisseur avec VI lockée à 15 €/MWh : décomposer le P&L dans chaque scénario.
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Scénario A (hiver froid)" ruleDetail="spread réalisé > spread forward" accent={ACCENT}>
            Le fournisseur a vendu en forward à 15 €/MWh. Le prix réel monte à 28 €/MWh.
            P&L intrinsèque = VI lockée (protégé). P&L extrinsèque : la reoptimisation hausse la VI à ~28 € → VE ≈ 13 €/MWh capturée si rolling intrinsic correctement géré.
          </DemoStep>
          <DemoStep num={2} rule="Scénario B (hiver doux)" ruleDetail="spread réalisé < spread forward" accent={ACCENT}>
            Le spread tombe à 5 €/MWh. Mais la VI a été lockée à 15 €/MWh → pas de perte sur la VI. VE ≈ 0 (pas d'opportunité supplémentaire). Le stockage délivre quand même sa VI.
          </DemoStep>
          <DemoStep num={3} rule="Conclusion" ruleDetail="asymétrie = convexité" accent={ACCENT}>
            Dans les deux cas, le P&L est supérieur ou égal à VI. C'est l'asymétrie fondamentale : le stockage participe aux bonnes surprises mais est protégé contre les mauvaises (via la couverture initiale).
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ─── Onglet 5 : Delta & Couverture ───────────────────────────────────────────

export function DeltaTab() {
  const [kappa, setKappa] = useState(1.5)
  const [mu, setMu] = useState(40)
  const [sigma, setSigma] = useState(8)
  const [v0, setV0] = useState(50)
  const [s0, setS0] = useState(40)

  const result = useMemo(() => {
    return runBellmanDP({ NV: 15, NS: 14, NT: 12, Vmin: 0, Vmax: 100, qinj: 10, qwit: 10, kappa, mu, sigma, r: 0.05, cOp: 0.5, dt: 1 / 12 })
  }, [kappa, mu, sigma])

  const eps = 2 // price epsilon for finite differences

  // Delta as function of V (at S=mu)
  const jMid = 7
  const deltaVData = result.vGrid.map((v, i) => {
    const vAbove = result.V[0][i].map((_, j) => result.V[0][i][j])
    // delta = (V(S+eps) - V(S-eps)) / (2*eps) — need neighboring price indices
    const jPlus = Math.min(jMid + 1, result.sGrid.length - 1)
    const jMinus = Math.max(jMid - 1, 0)
    const dS = result.sGrid[jPlus] - result.sGrid[jMinus]
    const delta = (result.V[0][i][jPlus] - result.V[0][i][jMinus]) / (dS + 1e-10)
    return { volume: +v.toFixed(0), delta: +delta.toFixed(3) }
  })

  // Delta as function of S (at V=50%)
  const iMid = 7
  const deltaSData = result.sGrid.map((s, j) => {
    const jPlus = Math.min(j + 1, result.sGrid.length - 1)
    const jMinus = Math.max(j - 1, 0)
    const dS = result.sGrid[jPlus] - result.sGrid[jMinus]
    const delta = (result.V[0][iMid][jPlus] - result.V[0][iMid][jMinus]) / (dS + 1e-10)
    return { prix: +s.toFixed(1), delta: +delta.toFixed(3) }
  })

  // Current delta interpolated
  const jCurr = result.sGrid.reduce((best, s, j) => Math.abs(s - s0) < Math.abs(result.sGrid[best] - s0) ? j : best, 0)
  const jP = Math.min(jCurr + 1, result.sGrid.length - 1)
  const jM = Math.max(jCurr - 1, 0)
  const iCurr = result.vGrid.reduce((best, v, i) => Math.abs(v - v0) < Math.abs(result.vGrid[best] - v0) ? i : best, 0)
  const dSc = result.sGrid[jP] - result.sGrid[jM]
  const currentDelta = (result.V[0][iCurr][jP] - result.V[0][iCurr][jM]) / (dSc + 1e-10)
  const fwdQty = (currentDelta * 100).toFixed(0) // pour 100 GWh de capacité

  // Smile data (value vs S at V=50%)
  const smileData = result.sGrid.map((s, j) => ({
    prix: +s.toFixed(1),
    valeur: +result.V[0][iMid][j].toFixed(2),
    linéaire: +(result.V[0][iMid][jMid] + currentDelta * (s - result.sGrid[jMid])).toFixed(2),
  }))

  return (
    <div>
      <IntuitionBlock emoji="📐" title="Le delta : pont entre modèle et salle des marchés" accent={ACCENT}>
        Le delta d'un stockage répond à : <strong>"Si le prix monte de 1 €, de combien change ma valeur ?"</strong>
        C'est à la fois un indicateur de risque et la quantité de forwards à vendre pour être delta-neutre —
        immunisé contre les mouvements de prix.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Delta par différences finies">
        <K display>{"\\Delta_t(V, S) \\approx \\frac{\\mathcal{V}_t(V,\\ S+\\varepsilon) - \\mathcal{V}_t(V,\\ S-\\varepsilon)}{2\\varepsilon}"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          Directement calculable depuis la grille Bellman déjà connue — pas de calcul supplémentaire.
        </div>
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Récurrence du delta (théorème de l'enveloppe)">
        <K display>{"\\Delta_t(V, S) = \\underbrace{-u^* \\cdot \\Delta t}_{\\text{sensibilité immédiate}} + e^{-r\\Delta t} \\cdot \\underbrace{e^{-\\kappa\\Delta t}}_{\\text{persistance}} \\cdot \\mathbb{E}_t[\\Delta_{t+1}(V', S_{t+1})]"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          Le terme <K>{"e^{-\\kappa\\Delta t}"}</K> est la persistance du choc de prix : un choc est atténué par le retour à la moyenne. Plus κ est grand, plus vite le choc "s'oublie" et moins le delta futur compte.
        </div>
      </FormulaBox>

      <Grid cols={3} gap="12px">
        <Slider label="κ" value={kappa} min={0.5} max={5} step={0.1} onChange={setKappa} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="μ (€/MWh)" value={mu} min={20} max={70} step={1} onChange={setMu} accent={ACCENT} format={v => `${v}`} />
        <Slider label="σ (€/MWh)" value={sigma} min={1} max={20} step={0.5} onChange={setSigma} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="Volume actuel V (GWh)" value={v0} min={0} max={100} step={5} onChange={setV0} accent={ACCENT} format={v => `${v}`} />
        <Slider label="Prix actuel S (€/MWh)" value={s0} min={15} max={65} step={1} onChange={setS0} accent={ACCENT} format={v => `${v}`} />
      </Grid>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="Δ(V, S) courant" value={currentDelta.toFixed(3)} accent={ACCENT} />
        <InfoChip label="Forwards à vendre (sur 100 GWh cap.)" value={`${fwdQty} GWh`} accent={T.a4} />
        <InfoChip label="Action optimale" value={result.policy[0][iCurr][jCurr] > 0.5 ? 'INJECTION' : result.policy[0][iCurr][jCurr] < -0.5 ? 'SOUTIRAGE' : 'ATTENTE'} accent={result.policy[0][iCurr][jCurr] > 0.5 ? T.a1 : result.policy[0][iCurr][jCurr] < -0.5 ? T.a4 : T.muted} />
      </div>

      <Grid cols={2} gap="16px">
        <ChartWrapper title="Delta en fonction du volume V (S = μ)" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deltaVData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="volume" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Volume (GWh)', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -3 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={T.muted} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="delta" stroke={ACCENT} strokeWidth={2.5} dot={false} name="Δ(V, μ)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Delta en fonction du prix S (V = 50 GWh)" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deltaSData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="prix" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Prix (€/MWh)', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -3 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={T.muted} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="delta" stroke={T.a5} strokeWidth={2.5} dot={false} name="Δ(50, S)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>

      <SectionTitle accent={ACCENT}>Cas particuliers du delta</SectionTitle>
      <table style={tableStyle}>
        <thead>
          <tr><Th>Situation</Th><Th>Delta</Th><Th>Intuition</Th></tr>
        </thead>
        <tbody>
          {[
            ['V = 0, loin de T, prix bas', 'Élevé (≈1)', 'Stock vide, prix bas → on va injecter beaucoup. Très sensible au prix futur.'],
            ['V = 0, à l\'échéance T', '= 0', 'Plus de temps pour agir. Un stock vide à T ne peut rien rapporter.'],
            ['V = 0, prix très élevé', 'Faible', 'Même avec un stock vide, injecter maintenant est trop coûteux.'],
            ['V = V_max, prix élevé', 'Négatif ou faible', 'On va soutirer de toute façon. Position "short" naturelle sur le prix.'],
            ['V intermédiaire, prix = μ', 'Modéré', 'Zone d\'incertitude : injecter/attendre/soutirer selon le spread futur attendu.'],
          ].map(([sit, delta, intuition]) => (
            <tr key={sit}><Td accent={ACCENT}>{sit}</Td><Td accent={T.a5}>{delta}</Td><Td>{intuition}</Td></tr>
          ))}
        </tbody>
      </table>

      <SectionTitle accent={ACCENT}>Convexité — Le stockage comme actif optionnel</SectionTitle>
      <FormulaBox accent={ACCENT} label="Développement de Taylor au 2ᵉ ordre">
        <K display>{"\\mathcal{V}(S + \\delta S) \\approx \\mathcal{V}(S) + \\underbrace{\\Delta}_{>0} \\cdot \\delta S + \\frac{1}{2}\\underbrace{\\Gamma}_{>0} \\cdot (\\delta S)^2"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          <K>{"\\Gamma > 0"}</K> signifie que la valeur est convexe en S : les hausses de prix rapportent plus que la droite tangente, les baisses coûtent moins. <strong>Le stockage bénéficie de la volatilité.</strong>
        </div>
      </FormulaBox>

      <ChartWrapper title="Valeur V(S) — Courbe convexe vs approximation linéaire (Δ seul)" accent={ACCENT} height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={smileData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="prix" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Prix S (€/MWh)', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -3 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
            <Line type="monotone" dataKey="valeur" stroke={ACCENT} strokeWidth={2.5} dot={false} name="V(S) — courbe réelle (convexe)" />
            <Line type="monotone" dataKey="linéaire" stroke={T.muted} strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="Δ·(S-S₀) — approx. linéaire" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Comparaison Stockage / Option financière</SectionTitle>
      <table style={tableStyle}>
        <thead>
          <tr><Th>Caractéristique</Th><Th>Option financière</Th><Th>Stockage de gaz</Th></tr>
        </thead>
        <tbody>
          {[
            ['Droit sans obligation', 'Acheter au strike K', 'Soutirer quand prix haut'],
            ['Convexité Γ > 0', 'Oui (Black-Scholes)', 'Oui (Bellman DP)'],
            ['Bénéfice de la vol (Vega > 0)', 'Oui', 'Oui (VE augmente avec σ)'],
            ['Couverture Delta hedging', 'Sur le sous-jacent spot', 'Sur la courbe forward'],
            ['Exercice', 'Date fixe (européenne) ou tout moment', 'Continu, avec contraintes de chemin'],
            ['Dépendance de chemin', 'Non (européenne)', 'Oui — chaque décision modifie les options futures'],
          ].map(([carac, option, stockage]) => (
            <tr key={carac}><Td accent={ACCENT}>{carac}</Td><Td>{option}</Td><Td accent={T.a4}>{stockage}</Td></tr>
          ))}
        </tbody>
      </table>

      <Accordion title="Exercice — Construire la couverture delta au jour J" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.muted, fontSize: 13 }}>
          Volume : 60 GWh, prix spot : 52 €/MWh (au-dessus de μ=40), capacité totale : 100 GWh.
          Le modèle donne Δ = 0.65. Comment couvrir ce stockage sur le marché forward ?
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Quantité forward" ruleDetail="Δ × capacité" accent={ACCENT}>
            Vendre 0.65 × 100 = 65 GWh en forward (livraison dans 1 à 3 mois selon le profil de soutirage attendu).
          </DemoStep>
          <DemoStep num={2} rule="Couverture delta-neutre" ruleDetail="exposition résiduelle = 0" accent={ACCENT}>
            Si le prix monte de 5 €/MWh : gain sur le stockage = +Δ×5×100 = +325 €, perte sur les forwards = -65×5 = -325 €. Net = 0.
          </DemoStep>
          <DemoStep num={3} rule="Rebalancement quotidien" ruleDetail="delta change avec V et S" accent={ACCENT}>
            Le lendemain, V et S ont changé → Δ a changé. Recalculer Δ depuis la grille, ajuster la position forward. C'est le delta hedging dynamique.
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ─── Onglet 6 : Courbe Forward & Portefeuille ─────────────────────────────────

export function ForwardRiskTab() {
  const [spread, setSpread] = useState(15)
  const [level, setLevel] = useState(40)
  const [tilt, setTilt] = useState(0) // additional slope winter vs summer

  const months = MONTHS
  const fwdData = months.map((m, t) => {
    const seasonal = spread * 0.5 * Math.cos(2 * Math.PI * t / 12 + Math.PI)
    const slope = tilt * (t - 5.5) / 5.5
    return {
      mois: m,
      F: +(level + seasonal + slope).toFixed(1),
      niveau: level,
    }
  })

  const intrinsicFromSpread = useMemo(() => {
    const res = runIntrinsicDP({ NV: 10, NT: 12, Vmin: 0, Vmax: 100, qinj: 10, qwit: 10, mu: level, spread, r: 0.05, cOp: 0.5, dt: 1 / 12 })
    return res.V[0] ? linInterp(res.vGrid, res.V[0], 50).toFixed(2) : '—'
  }, [spread, level])

  return (
    <div>
      <IntuitionBlock emoji="📈" title="Le vrai sous-jacent : la courbe forward F(t,T)" accent={ACCENT}>
        Un opérateur de stockage ne se couvre pas sur le prix spot <K>{"S_t"}</K> — il livre du gaz physiquement et ne contrôle pas le spot.
        Ce qui l'intéresse, c'est la <strong>courbe forward</strong> <K>{"F(t,T)"}</K> : le prix auquel le marché accepte <em>aujourd'hui</em>
        de livrer du gaz à la date <K>{"T"}</K> future. C'est la <strong>déformation de cette courbe</strong> qui crée ou détruit la valeur.
      </IntuitionBlock>

      <Grid cols={3} gap="12px">
        <Slider label="Niveau moyen μ (€/MWh)" value={level} min={20} max={70} step={1} onChange={setLevel} accent={ACCENT} format={v => `${v}`} />
        <Slider label="Spread été/hiver (€/MWh)" value={spread} min={0} max={40} step={1} onChange={setSpread} accent={ACCENT} format={v => `${v}`} />
        <Slider label="Tilt long terme (€/MWh)" value={tilt} min={-10} max={10} step={0.5} onChange={setTilt} accent={ACCENT} format={v => v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)} />
      </Grid>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
        <InfoChip label="VI calculée (V=50 GWh)" value={`${intrinsicFromSpread} €`} accent={ACCENT} />
        <InfoChip label="Prix été" value={`${(level - spread / 2).toFixed(0)} €/MWh`} accent={T.a1} />
        <InfoChip label="Prix hiver" value={`${(level + spread / 2).toFixed(0)} €/MWh`} accent={T.a8} />
        <InfoChip label="Spread" value={`${spread} €/MWh`} accent={T.a5} />
      </div>

      <ChartWrapper title="Courbe Forward F(0,T) — 12 maturités mensuelles" accent={ACCENT} height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={fwdData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="mois" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
            <ReferenceLine y={level} stroke={T.muted} strokeDasharray="5 3" label={{ value: 'μ', fill: T.muted, fontSize: 11 }} />
            <Line type="monotone" dataKey="F" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 3 }} name="F(0,t)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Vecteur de deltas par maturité</SectionTitle>
      <IntuitionBlock emoji="🎯" title="Un delta par point de la courbe, pas un seul delta global" accent={ACCENT}>
        En réalité, la position de couverture d'un stockage n'est pas un seul forward, mais un <strong>vecteur</strong> de positions
        à chaque maturité. Chaque composante répond à : "si le prix forward de livraison en mars monte de 1€, ma valeur change de combien ?"
        Un déplacement parallèle de toute la courbe est couvert par le delta global.
        Mais un <strong>changement de pente</strong> (l'hiver se tend, l'été se détend) n'est couvert que par ce vecteur complet.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Vecteur de sensibilités forward">
        <K display>{"\\vec{\\Delta} = \\left(\\frac{\\partial \\mathcal{V}}{\\partial F(0, T_1)},\\ \\frac{\\partial \\mathcal{V}}{\\partial F(0, T_2)},\\ \\ldots,\\ \\frac{\\partial \\mathcal{V}}{\\partial F(0, T_n)}\\right)"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          Le fournisseur doit couvrir chaque composante en vendant/achetant des contrats forward à chaque maturité correspondante.
        </div>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Les 3 facteurs PCA de la courbe forward</SectionTitle>
      <div style={{ ...panelStyle }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
          Décomposition en Composantes Principales — Pourquoi on réduit la dimension
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { num: '1', label: 'Déplacement parallèle', variance: '~80%', desc: 'Toute la courbe monte ou baisse uniformément. Couvert par le delta global du stockage.', color: ACCENT },
            { num: '2', label: 'Changement de pente (été/hiver)', variance: '~15%', desc: "Le spread été/hiver s'élargit ou se rétrécit. C'est le risque principal du stockage — sa valeur intrinsèque en dépend directement.", color: T.a5 },
            { num: '3', label: 'Changement de courbure', variance: '~5%', desc: "Les maturités intermédiaires bougent différemment des extrêmes. Résiduel, souvent non couvert.", color: T.muted },
          ].map(({ num, label, variance, desc, color }) => (
            <div key={num} style={{ background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ color, fontWeight: 700, fontSize: 12 }}>Facteur {num} — {label}</div>
                <div style={{ background: `${color}22`, borderRadius: 4, padding: '2px 8px', color, fontSize: 11, fontWeight: 700 }}>{variance}</div>
              </div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <IntuitionBlock emoji="🔢" title="Malédiction de la dimension — Pourquoi on réduit à 2-3 facteurs" accent={ACCENT}>
        Si on modélise 12 maturités forward comme 12 variables d'état de Bellman,
        la grille aurait <K>{"N_V \\times N_{S_1} \\times \\cdots \\times N_{S_{12}}"}</K> nœuds.
        Avec 10 points par dimension : <K>{"10^{13}"}</K> nœuds — impossible à calculer.
        La PCA réduit à 2-3 facteurs → <K>{"10^3"}</K> à <K>{"10^4"}</K> nœuds → tractable.
        On perd un peu de précision sur les termes résiduels, mais on capture l'essentiel.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Tableau comparatif des méthodes d'optimisation</SectionTitle>
      <table style={tableStyle}>
        <thead>
          <tr><Th>Méthode</Th><Th>Avantage principal</Th><Th>Limite principale</Th><Th>Usage typique</Th></tr>
        </thead>
        <tbody>
          {[
            ['Bellman (DP)', 'Optimal global + politique + delta', 'Malédiction de la dimension (≤3 facteurs)', 'Standard industrie (stockage simple)'],
            ['Least-Squares MC (LSMC)', 'Gère haute dimension, Monte Carlo', 'Approximation, bruit, pas de politique exacte', 'Actifs multi-sous-jacents, options complexes'],
            ['PDE (Hamilton-Jacobi-Bellman)', 'Continu, élégant, grande précision', 'Complexe à implémenter, 2D max', 'Recherche académique'],
            ['Optimisation LP (déterministe)', 'Très rapide si prix connus', 'Ignore la stochasticité → sous-optimal', 'Valeur intrinsèque uniquement'],
          ].map(([methode, avantage, limite, usage]) => (
            <tr key={methode}>
              <Td accent={ACCENT}>{methode}</Td>
              <Td accent={T.a4}>{avantage}</Td>
              <Td accent={T.muted}>{limite}</Td>
              <Td>{usage}</Td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionTitle accent={ACCENT}>Intégration multi-actifs — Le portefeuille de flexibilités</SectionTitle>
      <IntuitionBlock emoji="🗂️" title="Le stockage n'est qu'un outil parmi d'autres" accent={ACCENT}>
        Un fournisseur d'énergie dispose de plusieurs actifs de flexibilité pour équilibrer son portefeuille.
        Le stockage souterrain est le plus flexible mais aussi le plus coûteux à acquérir.
        En pratique, on optimise l'ensemble du portefeuille de flexibilités — le même framework Bellman,
        mais avec plusieurs contrôles simultanés.
      </IntuitionBlock>

      <table style={tableStyle}>
        <thead>
          <tr><Th>Actif de flexibilité</Th><Th>Flexibilité</Th><Th>Coût d'accès</Th><Th>Liquidité marché</Th><Th>Rôle clé</Th></tr>
        </thead>
        <tbody>
          {[
            ['Stockage souterrain', 'Très haute (inject/soutire librement)', 'Élevé (enchères)', 'Faible (OTC)', 'Tampon saisonnier + trading spread'],
            ['Contrat Swing', 'Modérée (volume min/max quotidien)', 'Moyen (prime swing)', 'Moyenne', 'Flexibilité court-terme, complément stockage'],
            ['Capacité LNG', 'Bonne (livraisons par cargaisons)', 'Variable (spot ou term)', 'Bonne (marché global)', 'Approvisionnement alternatif en pointe'],
            ['Interruptibilité clients industriels', 'Haute (réduire livraison clients)', 'Bas (tarif préférentiel client)', 'Nulle (bilatéral)', 'Dernier recours, éviter pénalités déséquilibre'],
          ].map(([actif, flex, cout, liq, role]) => (
            <tr key={actif}>
              <Td accent={ACCENT}>{actif}</Td>
              <Td>{flex}</Td>
              <Td>{cout}</Td>
              <Td>{liq}</Td>
              <Td accent={T.muted}>{role}</Td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ ...panelStyle, marginTop: 16 }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
          Optimisation de portefeuille de flexibilités — Extension naturelle de Bellman
        </div>
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          L'état devient <K>{"(V_{\\text{stock}},\\ V_{\\text{LNG}},\\ Q_{\\text{swing}},\\ S)"}</K> et le contrôle devient vectoriel :
          <K display>{"\\mathbf{u}_t = (u_{\\text{stock}},\\ u_{\\text{LNG}},\\ u_{\\text{swing}},\\ u_{\\text{interr}})"}</K>
          La même équation de Bellman s'applique — le max est pris sur tous les contrôles simultanément.
          La malédiction de la dimension impose ici d'utiliser LSMC ou une approximation par fonctions de base.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        {[
          { label: 'Forward Curves', path: 'Marchés Énergie › Forward Curves', desc: 'Structure de terme et saisonnalité' },
          { label: 'Options Énergie', path: 'Marchés Énergie › Options Énergie', desc: 'Pricing Black-76, Greeks énergie' },
          { label: 'Swing Options', path: 'Marchés Énergie › Swing Options', desc: 'Contrats swing et leur valorisation' },
        ].map(({ label, path, desc }) => (
          <div key={label} style={{ background: `${T.a4}11`, border: `1px solid ${T.a4}33`, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 160 }}>
            <div style={{ color: T.a4, fontWeight: 700, fontSize: 12 }}>📍 {label}</div>
            <div style={{ color: T.muted, fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>
              {desc} — <em>{path}</em>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
