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

      {/* ── Intuition ────────────────────────────────────────────────────────── */}
      <IntuitionBlock emoji="♟️" title="L'idée de Bellman — raisonner à rebours" accent={ACCENT}>
        Tu gères un stockage souterrain de gaz naturel. Chaque mois, tu dois décider :{' '}
        <strong>injecter du gaz ?</strong> <strong>le retirer ?</strong> <strong>ne rien faire ?</strong>
        <br /><br />
        À tout instant, deux informations suffisent pour prendre ta décision :
        <div style={{ display: 'flex', gap: 12, margin: '10px 0', flexWrap: 'wrap' }}>
          <div style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, borderRadius: 6, padding: '8px 14px', fontSize: 13 }}>
            <strong style={{ color: ACCENT }}>V</strong>
            <span style={{ color: T.muted }}> — le volume actuellement en stock (GWh)</span>
          </div>
          <div style={{ background: `${T.a5}18`, border: `1px solid ${T.a5}44`, borderRadius: 6, padding: '8px 14px', fontSize: 13 }}>
            <strong style={{ color: T.a5 }}>S</strong>
            <span style={{ color: T.muted }}> — le prix du gaz sur le marché en ce moment (€/MWh)</span>
          </div>
        </div>
        Le problème : la bonne décision en janvier dépend du futur (février, mars…). Pour décider
        aujourd'hui il faut connaître la valeur de demain — mais pour connaître demain il faut
        connaître après-demain. <em>On tourne en rond.</em>
        <br /><br />
        <strong>Le coup de génie de Bellman (1957) : résoudre à l'envers.</strong>{' '}
        À l'échéance (fin de contrat), la réponse est triviale — plus aucune décision possible, valeur = 0.
        On remonte mois par mois :{' '}
        <em>"Avec ce volume et ce prix, quelle action maximise le gain immédiat + ce que j'ai déjà
        calculé pour le mois suivant ?"</em>
        <br /><br />
        C'est le <strong>Principe d'Optimalité</strong> : la décision optimale ne dépend que de
        l'état actuel (V, S), jamais de l'historique qui y a conduit — propriété dite de <strong>Markov</strong>.
      </IntuitionBlock>

      {/* ── Formule annotée ─────────────────────────────────────────────────── */}
      <SectionTitle accent={ACCENT}>L'équation de Bellman — lire la formule terme à terme</SectionTitle>

      <FormulaBox accent={ACCENT} label="Équation de Bellman — Fonction valeur du stockage">
        <K display>{"\\mathcal{V}_t(V,\\, S) = \\max_{u \\,\\in\\, \\mathcal{U}(V)} \\Bigl[\\; \\underbrace{\\pi(u, S)}_{\\text{gain immédiat}} \\;+\\; \\underbrace{e^{-r\\Delta t}}_{\\text{actualisation}} \\cdot \\underbrace{\\mathbb{E}_t\\!\\left[\\mathcal{V}_{t+1}(V + u\\Delta t,\\; S_{t+1})\\right]}_{\\text{valeur future espérée}} \\;\\Bigr]"}</K>
      </FormulaBox>

      {/* ── Terme à terme ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '16px 0' }}>

        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🎯 𝒱ₜ(V, S) — La valeur du stockage</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            C'est la valeur totale du stockage à l'instant t, quand il contient un volume V et que
            le prix est S.
            <br />
            <em style={{ color: T.text }}>
              "Si je gère ce stockage de façon optimale jusqu'à la fin, combien vaut-il aujourd'hui ?"
            </em>
            <br /><br />
            Ce n'est pas un nombre fixe — c'est une <strong>surface en 3D</strong> : pour chaque
            combinaison (volume, prix, date), elle donne la meilleure valeur atteignable.
            C'est précisément ce que l'algorithme calcule et stocke à chaque nœud de la grille.
          </div>
        </div>

        <div style={{ background: `${T.a5}0d`, border: `1px solid ${T.a5}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>⚙️ max u ∈ 𝒰(V) — La décision optimale</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            <strong style={{ color: T.a4 }}>u &gt; 0</strong> → tu injectes du gaz (tu achètes sur le marché et tu stockes)<br />
            <strong style={{ color: ACCENT }}>u &lt; 0</strong> → tu retires du gaz (tu vends sur le marché)<br />
            <strong style={{ color: T.muted }}>u = 0</strong> → tu ne fais rien (tu conserves l'optionalité)
            <br /><br />
            <strong>𝒰(V)</strong> est l'ensemble des décisions <em>physiquement possibles</em> : tu ne peux
            pas retirer plus que ce qu'il y a en stock, ni injecter au-delà de la capacité maximale.
            <br /><br />
            Le <strong>max</strong> signifie : parmi toutes les décisions autorisées, tu choisis celle
            qui maximise la valeur totale. C'est le cœur de l'optimisation.
          </div>
        </div>

        <div style={{ background: `${T.a4}0d`, border: `1px solid ${T.a4}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: T.a4, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>💰 π(u, S) — Le gain immédiat</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            C'est ce que tu gagnes (ou paies) <em>maintenant</em> avec ta décision :{' '}
            <K>{"\\pi(u, S) = -u \\cdot S \\cdot \\Delta t \\;-\\; c_{\\mathrm{op}} \\cdot |u| \\cdot \\Delta t"}</K>
            <br /><br />
            • <strong style={{ color: T.a4 }}>Soutirage (u &lt; 0)</strong> : tu vends au prix S → recette = |u|·S·Δt. Gain positif.<br />
            • <strong style={{ color: T.a5 }}>Injection (u &gt; 0)</strong> : tu achètes au prix S → dépense = u·S·Δt.
            Tu investis aujourd'hui pour vendre plus cher plus tard.<br />
            • <strong>c_op</strong> : coût opérationnel (compression, usure, frais TSO — Gestionnaire de Réseau de Transport)
            dans les deux sens.
          </div>
        </div>

        <div style={{ background: `${T.a2}0d`, border: `1px solid ${T.a2}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: T.a2, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{'⏳ e^{−rΔt} — L\'actualisation'}</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            100 € dans un an ne valent pas 100 € aujourd'hui — l'argent futur vaut moins que l'argent
            présent (tu pourrais placer cet argent et gagner des intérêts entre-temps).
            <br /><br />
            Ce coefficient ramène la valeur future à une valeur d'aujourd'hui. À r = 5 %/an et
            Δt = 1 mois : e^(−0.05/12) ≈ 0.9958 — chaque mois, la valeur future est réduite de ~0.4 %.
            <br /><br />
            Plus <strong>r</strong> est élevé, plus le futur est "déprécié" — et plus l'algorithme
            préfère encaisser tôt plutôt qu'attendre.
          </div>
        </div>

        <div style={{ background: `${T.a7}0d`, border: `1px solid ${T.a7}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: T.a7, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🔮 𝔼ₜ[ 𝒱ₜ₊₁(V + uΔt, Sₜ₊₁) ] — La valeur future espérée</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.9 }}>
            C'est la partie la plus riche de la formule. Décomposons-la morceau par morceau :
            <br /><br />
            • <strong style={{ color: ACCENT }}>V + uΔt</strong> : si tu injectes ou retires u, le volume dans le stockage
            change de façon <em>certaine</em> — c'est toi qui le contrôles.
            <br />
            • <strong style={{ color: T.a5 }}>Sₜ₊₁</strong> : le prix du gaz le mois prochain est <em>incertain</em> —
            il peut monter, descendre, stagner, selon un modèle probabiliste (processus Ornstein-Uhlenbeck).
            <br />
            • <strong style={{ color: T.a7 }}>𝒱ₜ₊₁(…)</strong> : dans <em>chaque scénario</em> de prix futur,
            le stockage a une certaine valeur optimale — déjà entièrement calculée par le backward.
            <br />
            • <strong style={{ color: T.a7 }}>𝔼ₜ[…]</strong> : on prend la <em>moyenne pondérée</em> de
            toutes ces valeurs, pondérée par leurs probabilités.
            <br /><br />
            <em style={{ color: T.text }}>
              "En moyenne, selon tous les futurs possibles des prix du gaz, combien vaudra mon stockage
              le mois prochain si je prends la décision u aujourd'hui ?"
            </em>
            <br /><br />
            En pratique : le prix est discrétisé en NS valeurs sur une grille. La matrice de transition
            Π[j][k] (voir onglet suivant) donne la probabilité de passer du prix Sⱼ au prix S_k en un
            mois. L'espérance devient une simple somme pondérée :{' '}
            <K>{"\\mathbb{E}_t[\\mathcal{V}_{t+1}] = \\sum_k \\Pi_{jk} \\cdot \\mathcal{V}_{t+1}(V', S_k)"}</K>
          </div>
        </div>

      </div>

      {/* ── Synthèse ────────────────────────────────────────────────────────── */}
      <div style={{ background: `${ACCENT}18`, border: `2px solid ${ACCENT}55`, borderRadius: 8, padding: '16px 20px', margin: '4px 0 16px' }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>L'intuition globale en une phrase</div>
        <div style={{ color: T.text, fontSize: 14, lineHeight: 1.7, fontStyle: 'italic' }}>
          La valeur du stockage aujourd'hui = le meilleur compromis entre ce que je gagne immédiatement
          et ce que je m'attends à gagner demain, en gérant de façon optimale.
        </div>
      </div>

      <FormulaBox accent={ACCENT} label="Condition terminale — point de départ du calcul à rebours">
        <K display>{"\\mathcal{V}_T(V, S) = 0"}</K>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 8, lineHeight: 1.75 }}>
          À l'échéance T, plus aucune décision n'est possible → valeur = 0.
          C'est de là que part le calcul : on connaît 𝒱_T, on peut calculer 𝒱_{T-1}, puis 𝒱_{T-2}, etc.
          <br /><br />
          <strong style={{ color: T.text }}>Variante avec pénalité de restitution :</strong> certains contrats
          imposent un stock minimum <K>{"V_{\\min}^T"}</K> à l'échéance (ex : restitution de début de saison hivernale).
          <K display>{"\\mathcal{V}_T(V, S) = -\\lambda \\cdot \\max(V_{\\min}^T - V,\\; 0)"}</K>
          où <K>{"\\lambda"}</K> (€/GWh) est le prix de pénalité — l'algorithme anticipe alors la restitution
          dès les mois précédents.
        </div>
      </FormulaBox>

      {/* ── Exemple chiffré minimal ─────────────────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Un calcul à la main pour ancrer l'intuition</SectionTitle>

      {/* Convention / contexte */}
      <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7, margin: '0 0 10px', padding: '8px 12px', background: `${T.a5}10`, border: `1px solid ${T.a5}30`, borderRadius: 6 }}>
        <strong style={{ color: T.a5 }}>Convention de cet exemple :</strong> u est exprimé en <strong>GWh/mois</strong>, Δt = 1 mois (une période).
        La dynamique d'état est donc simplement <K>{"V' = V + u \\cdot 1 = V + u"}</K>.
        On choisit V₀ = q_wit = 10 GWh pour que l'action "soutirer au maximum" vide exactement le stock en un seul mois.
      </div>

      {/* Bandeau paramètres */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '0 0 10px', alignItems: 'center' }}>
        <span style={{ color: T.muted, fontSize: 12, marginRight: 4 }}>Données :</span>
        {[
          ['V₀', '10 GWh', ACCENT],
          ['S', '45 €/GWh', T.a5],
          ['q_wit', '10 GWh/mois', T.a4],
          ['c_op', '0.5 €/GWh', T.a4],
          ['r', '0', T.muted],
          ['Δt', '1 mois', T.muted],
          ['𝒱₁', '0 (fin de contrat)', T.a2],
        ].map(([k, v, c]) => (
          <span key={k} style={{ background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 5, padding: '3px 10px', fontSize: 12 }}>
            <strong style={{ color: c }}>{k}</strong>
            <span style={{ color: T.muted }}> = {v}</span>
          </span>
        ))}
      </div>

      {/* Deux cartes côte à côte */}
      <Grid cols={2} gap="12px">

        {/* Carte u = 0 */}
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ background: `${T.muted}18`, padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>⏸ u = 0 GWh/mois — Attendre</span>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Cashflow π</div>
              <div style={{ color: T.text, fontSize: 13 }}>Aucun mouvement de gaz → <strong>π = 0 €</strong></div>
            </div>
            <div>
              <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Nouveau stock V'</div>
              <div style={{ color: T.text, fontSize: 13 }}><K>{"V' = 10 + 0 \\times 1 ="}</K> <strong>10 GWh</strong> (inchangé)</div>
            </div>
            <div>
              <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Valeur future 𝔼[𝒱₁]</div>
              <div style={{ color: T.text, fontSize: 13 }}>Contrat terminé à t=1 → 𝒱₁ = 0 pour tous les états.</div>
              <div style={{ color: T.text, fontSize: 13, marginTop: 3 }}><K>{"\\mathbb{E}[\\mathcal{V}_1] = \\textstyle\\sum_k \\Pi[j][k] \\cdot 0 = \\mathbf{0}\\text{ €}"}</K></div>
              <div style={{ color: T.muted, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>Les 10 GWh restent en stock mais ne valent rien : le contrat se termine.</div>
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
              <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Gain total = π + e⁻ʳᐩᵗ · 𝔼[𝒱₁]</div>
              <div style={{ color: T.muted, fontSize: 22, fontWeight: 700 }}>0 €</div>
            </div>
          </div>
        </div>

        {/* Carte u = −10 */}
        <div style={{ border: `2px solid ${ACCENT}55`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ background: `${ACCENT}22`, padding: '10px 16px', borderBottom: `1px solid ${ACCENT}44`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: ACCENT, fontWeight: 700, fontSize: 13 }}>📤 u = −10 GWh/mois — Soutirer tout le stock</span>
            <span style={{ background: ACCENT, color: '#000', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '2px 7px' }}>✓ OPTIMAL</span>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Nouveau stock V'</div>
              <div style={{ color: T.text, fontSize: 13 }}>
                <K>{"V' = V_0 + u \\cdot \\Delta t = 10 + (-10) \\times 1 ="}</K>{' '}
                <strong style={{ color: ACCENT }}>0 GWh</strong> — stock vide ✓
              </div>
              <div style={{ color: T.muted, fontSize: 12, marginTop: 3 }}>
                u = −q_wit = −10 GWh/mois : on soutire au rythme maximal pendant 1 mois entier → stock épuisé exactement.
              </div>
            </div>
            <div>
              <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Cashflow π</div>
              <div style={{ fontSize: 13 }}>
                <K>{"\\pi = \\underbrace{|u| \\times S}_{\\text{vente}} \\;-\\; \\underbrace{c_{\\text{op}} \\times |u|}_{\\text{coût op.}} = \\underbrace{10 \\times 45}_{450} - \\underbrace{0.5 \\times 10}_{5}"}</K>
                <div style={{ color: T.a4, fontWeight: 700, fontSize: 15, marginTop: 6 }}>= <strong>+445 €</strong></div>
              </div>
            </div>
            <div>
              <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Valeur future 𝔼[𝒱₁]</div>
              <div style={{ color: T.text, fontSize: 13 }}>V' = 0, et contrat terminé à t=1 → 𝒱₁(0, S) = 0.</div>
              <div style={{ color: T.text, fontSize: 13, marginTop: 3 }}><K>{"\\mathbb{E}[\\mathcal{V}_1] = \\textstyle\\sum_k \\Pi[j][k] \\cdot 0 = \\mathbf{0}\\text{ €}"}</K></div>
            </div>
            <div style={{ borderTop: `1px solid ${ACCENT}33`, paddingTop: 10 }}>
              <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Gain total = π + e⁻ʳᐩᵗ · 𝔼[𝒱₁]</div>
              <div style={{ color: ACCENT, fontSize: 22, fontWeight: 700 }}>+445 €</div>
            </div>
          </div>
        </div>

      </Grid>

      {/* Boîte résultat */}
      <div style={{ background: `${ACCENT}18`, border: `2px solid ${ACCENT}55`, borderRadius: 8, padding: '14px 18px', margin: '10px 0 4px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Décision optimale</div>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 15 }}>
            𝒱₀(10, 45) = max(0, 445) = <strong>445 €</strong>
          </div>
        </div>
        <div style={{ width: 1, background: `${ACCENT}44`, alignSelf: 'stretch' }} />
        <div>
          <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Action u*</div>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 15 }}>Soutirer tout le stock ce mois (u = −q_wit)</div>
        </div>
        <div style={{ width: 1, background: `${ACCENT}44`, alignSelf: 'stretch' }} />
        <div>
          <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>stock final</div>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 15 }}>V₁ = 0 GWh</div>
        </div>
      </div>

      {/* Note sur 12 mois réels */}
      <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7, margin: '6px 0 12px', padding: '0 4px' }}>
        Ici la réponse est triviale : vendre maintenant est toujours optimal quand 𝒱₁ = 0 et S &gt; c_op.
        Sur 12 mois réels, 𝒱₁ ≠ 0 — le gaz restant garde une valeur d'option (le vendre plus cher le mois
        suivant si les prix montent). L'algorithme compare alors "encaisser 445 € maintenant" contre "garder
        du gaz et espérer S plus élevé". C'est là que Bellman devient non-trivial.
      </div>

      {/* ── Algorithme DP ───────────────────────────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Résolution — Programmation Dynamique (DP) backward</SectionTitle>

      <IntuitionBlock emoji="♟️" title="L'idée clé : raisonner à l'envers" accent={ACCENT}>
        Imaginez que vous jouez aux échecs et que vous voulez connaître votre meilleur coup à la première
        minute. La difficulté : votre décision maintenant dépend de ce qui peut arriver dans 12 mois.
        On ne peut pas résoudre ça en avançant dans le temps — on ne sait pas encore quels prix le marché
        proposera. La Programmation Dynamique résout ce paradoxe en partant de <strong>la fin</strong> et en remontant
        vers le présent : "si à l'échéance mon stock et le prix sont dans tels états, que vaut mon stockage ? 0 €, 
        par définition." Puis : "un mois avant l'échéance, sachant que dans un mois il vaudra 0, combien 
        vaut-il ?" Et ainsi de suite, jusqu'à t = 0.
      </IntuitionBlock>

      {/* Pourquoi discrétiser */}
      <div style={{ ...panelStyle, margin: '14px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Pourquoi discrétiser l'espace continu ?</div>
        <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75 }}>
          L'équation de Bellman est définie sur un espace continu : le volume <K>{"V \\in [0, 100]"}</K> GWh et le
          prix <K>{"S \\in \\mathbb{R}^+"}</K> peuvent prendre une infinité de valeurs. On ne peut pas stocker une
          infinité de valeurs en mémoire — on <strong>discrétise</strong> : on choisit un nombre fini de points représentatifs
          sur chaque dimension, et on calcule la valeur exactement en ces points. Entre deux points, on
          <strong> interpole linéairement</strong> (comme lire un thermomètre gradué tous les 5°C et estimer 17°C par interpolation).
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
          {[
            { label: 'NV = 15 nœuds de volume', range: '0 → 100 GWh', detail: 'Un nœud tous les ~7 GWh. Entre deux nœuds, V\' = V + u·Δt est interpolé.', color: ACCENT },
            { label: 'NS = 12 nœuds de prix', range: 'μ ± 3σ (couvre 99.7% des prix OU)', detail: 'Centré sur la moyenne de long terme μ, avec suffisamment d\'amplitude pour capturer les queues.', color: T.a5 },
            { label: 'NT = 12 pas de temps', range: '1 mois chacun', detail: 'Δt = 1 mois. Total : 15 × 12 × 12 = 2 160 nœuds, chacun avec sa valeur et sa politique.', color: T.a4 },
          ].map(({ label, range, detail, color }) => (
            <div key={label} style={{ background: `${color}10`, border: `1px solid ${color}33`, borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{label}</div>
              <div style={{ color: T.text, fontSize: 12, marginBottom: 4 }}>{range}</div>
              <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Les 3 étapes */}
      <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Étape 1 */}
        <Step num={1} accent={ACCENT}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <strong>Initialisation à l'échéance (<K>{"t = T"}</K>) — la condition terminale</strong>
            </div>
            <FormulaBox accent={ACCENT}>
              <K display>{"\\mathcal{V}_T(V_i,\\, S_j) = 0 \\qquad \\forall\\, i,\\, j"}</K>
            </FormulaBox>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75 }}>
              À l'échéance du contrat, <strong>plus aucune décision n'est possible</strong> : on ne peut plus ni injecter
              ni soutirer. Le stockage ne vaut donc rien de plus — quelle que soit la quantité de gaz restante
              ou le prix du marché. C'est le seul moment où la valeur est connue <em>exactement</em>, sans calcul.
              <br /><br />
              💡 <em>Analogie :</em> imaginez un bon de réduction qui expire ce soir. Qu'il reste 50 € ou 0 € dessus,
              si le magasin est fermé et que vous ne pouvez plus l'utiliser, il vaut 0 € maintenant.
              C'est exactement ça la condition terminale.
              <br /><br />
              <strong style={{ color: T.text }}>Variante avec pénalité :</strong> certains contrats imposent de restituer
              un stock minimum <K>{"V_{\\min}^T"}</K> à l'échéance. Dans ce cas{' '}
              <K>{"\\mathcal{V}_T = -\\lambda \\max(V_{\\min}^T - V,\\, 0)"}</K> — l'algorithme anticipe cette
              contrainte dès les mois précédents en se reconstituant progressivement.
            </div>
          </div>
        </Step>

        <div style={{ borderTop: `1px solid ${T.border}` }} />

        {/* Étape 2 */}
        <Step num={2} accent={ACCENT}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <strong>Boucle backward <K>{"t = T{-}1,\\, \\ldots,\\, 0"}</K> — le cœur du calcul</strong>
            </div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75 }}>
              À chaque pas de temps <K>{"t"}</K>, pour chaque nœud <K>{"(V_i,\\, S_j)"}</K> de la grille, on se pose
              la question : <em>"si je suis dans cet état, quelle action u maximise mon gain total ?"</em>
              On teste <strong>toutes les actions admissibles</strong> et on garde la meilleure.
            </div>

            {/* Sous-bloc : les 3 composantes du gain */}
            <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: T.text, fontWeight: 600, fontSize: 12, marginBottom: 2 }}>Les 3 composantes de gain(u) :</div>
              <FormulaBox accent={ACCENT}>
                <K display>{"\\text{gain}(u) = \\underbrace{\\pi(u,\\,S_j)}_{\\text{① cashflow immédiat}} + \\underbrace{e^{-r\\Delta t}}_{\\text{② facteur actualisation}} \\underbrace{\\sum_k \\Pi[j][k]\\cdot\\mathcal{V}_{t+1}\\bigl[V{+}u{\\cdot}\\Delta t\\bigr][k]}_{\\text{③ espérance de la valeur future}}"}</K>
              </FormulaBox>
              {[
                {
                  num: '①', color: T.a5, title: 'Cashflow immédiat π(u, Sⱼ)',
                  tech: <><K>{"\\pi = -u \\cdot S_j \\cdot \\Delta t - c_{\\text{op}} \\cdot |u|"}</K></>,
                  plain: 'Ce qu\'on encaisse (ou dépense) ce mois-ci. Si u < 0 (soutirage) : vente de |u|·Δt GWh au prix Sⱼ. Si u > 0 (injection) : achat de gaz, cashflow négatif. Le coût op c_op·|u| est payé dans les deux cas.',
                },
                {
                  num: '②', color: T.a3, title: 'Facteur d\'actualisation',
                  tech: <><K>{"e^{-r \\Delta t}"}</K> avec <K>{"\\Delta t = 1/12"}</K> an</>,
                  plain: <span>Un euro gagné dans 1 mois ne vaut que <K>{"e^{-r/12} \\approx 1 - r/12"}</K> euros aujourd'hui. Avec r = 5 %, ce facteur vaut ≈ 0.9958 — quasi 1 sur un mois, mais significatif sur 12 mois.</span>,
                },
                {
                  num: '③', color: T.a4, title: 'Espérance de la valeur future — décomposition pas à pas',
                  tech: <><K>{"\\sum_k \\Pi[j][k] \\cdot \\mathcal{V}_{t+1}\\bigl[V{+}u{\\cdot}\\Delta t\\bigr][k]"}</K></>,
                  plain: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      {/* Intro */}
                      <div>
                        Cette somme est le cœur de Bellman. Elle répond à : <em>"si je prends la décision u maintenant,
                        combien vaudra mon stockage le mois prochain, en moyenne sur tous les prix futurs possibles ?"</em>
                        Elle se décompose en 4 éléments imbriqués :
                      </div>
                      {/* 4 sous-blocs */}
                      {[
                        {
                          tag: 'a', color: ACCENT,
                          title: <><K>{"V + u \\cdot \\Delta t"}</K> — ce que ta décision fait au stock</>,
                          body: <>
                            Tu as <K>{"V"}</K> GWh dans le tank. Tu décides <K>{"u"}</K> (négatif = soutirer, positif = injecter).
                            Résultat physique :{' '}
                            <K>{"V' = V + u \\cdot \\Delta t"}</K> — le volume qui sera dans le tank le mois prochain.
                            <br />
                            <span style={{ color: T.muted }}>Ex : V = 50 GWh, u = −10 GWh/mois, Δt = 1 mois → V' = 40 GWh.</span>
                            <br />
                            <em>C'est la seule chose que tu contrôles à 100 %.</em>
                          </>,
                        },
                        {
                          tag: 'b', color: T.a5,
                          title: <><K>{"\\mathcal{V}_{t+1}[V'][k]"}</K> — ce que vaudra le stockage le mois prochain</>,
                          body: <>
                            Pour <strong>chaque prix futur possible</strong> <K>{"S_k"}</K> (12 nœuds dans la grille),
                            l'algorithme a <strong>déjà calculé</strong> combien vaut un stock de <K>{"V'"}</K> GWh
                            si le prix est <K>{"S_k"}</K>. C'est le résultat du backward au pas <K>{"t+1"}</K>.
                            <br />
                            <span style={{ color: T.muted }}>Ex : 𝒱ₜ₊₁(40 GWh, 38 €) = 280 € · 𝒱ₜ₊₁(40 GWh, 45 €) = 340 € · 𝒱ₜ₊₁(40 GWh, 55 €) = 430 €</span>
                          </>,
                        },
                        {
                          tag: 'c', color: T.a3,
                          title: <><K>{"\\Pi[j][k]"}</K> — la probabilité que le prix passe de <K>{"S_j"}</K> à <K>{"S_k"}</K></>,
                          body: <>
                            La <strong>matrice de transition</strong> <K>{"\\Pi"}</K> encode le processus OU (voir onglet suivant) :
                            étant donné le prix actuel <K>{"S_j"}</K>, quelle est la probabilité d'observer chaque prix
                            futur <K>{"S_k"}</K> dans un mois ?
                            <br />
                            <span style={{ color: T.muted }}>Ex avec S_j = 45 € : Π[j][bas] = 0.20 · Π[j][med] = 0.50 · Π[j][haut] = 0.30</span>
                          </>,
                        },
                        {
                          tag: 'd', color: T.a4,
                          title: <>La somme — moyenne pondérée des valeurs futures</>,
                          body: <>
                            On multiplie <strong>chaque valeur future</strong> par <strong>sa probabilité</strong>, puis on additionne —
                            exactement comme une note moyenne pondérée :
                            <K display>{"\\sum_k \\Pi[j][k]\\cdot\\mathcal{V}_{t+1}[V'][k] = \\underbrace{0.20}_{\\text{prob}} \\times \\underbrace{280}_{S_k=38\\,\\text{€}} + \\underbrace{0.50}_{} \\times \\underbrace{340}_{S_k=45\\,\\text{€}} + \\underbrace{0.30}_{} \\times \\underbrace{430}_{S_k=55\\,\\text{€}} = 355\\,\\text{€}"}</K>
                            Résultat : <em>"en moyenne, si je soutire 10 GWh ce mois-ci, mon stockage vaudra 355 € le mois prochain."</em>
                            <br />
                            Multiplié par <K>{"e^{-r\\Delta t}"}</K> pour actualiser, on obtient la valeur future ramenée à aujourd'hui.
                          </>,
                        },
                      ].map(({ tag, color, title, body }) => (
                        <div key={tag} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', paddingLeft: 4 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 3, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 800, fontSize: 10, flexShrink: 0, marginTop: 1 }}>{tag}</div>
                          <div>
                            <div style={{ color, fontWeight: 600, fontSize: 11 }}>{title}</div>
                            <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.65, marginTop: 3 }}>{body}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                },
              ].map(({ num, color, title, tech, plain }) => (
                <div key={num} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 4, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{num}</div>
                  <div>
                    <div style={{ color, fontWeight: 600, fontSize: 12 }}>{title}</div>
                    <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>{tech}</div>
                    <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6, marginTop: 3 }}>{plain}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contrainte d'admissibilité */}
            <div style={{ background: `${T.a2}10`, border: `1px solid ${T.a2}30`, borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ color: T.a2, fontWeight: 600, fontSize: 12, marginBottom: 4 }}>⚠️ Contraintes d'admissibilité — toutes les actions ne sont pas autorisées</div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
                Pour chaque action <K>{"u"}</K> testée, on vérifie que le nouveau stock <K>{"V' = V_i + u \\cdot \\Delta t"}</K>
                reste dans les bornes physiques :{' '}
                <K>{"V_{\\min} \\leq V' \\leq V_{\\max}"}</K>.{' '}
                Et que le débit respecte les limites contractuelles :{' '}
                <K>{"-q_{\\text{wit}} \\leq u \\leq +q_{\\text{inj}}"}</K>.{' '}
                Les actions violant l'une de ces conditions sont simplement ignorées (gain = −∞).
              </div>
            </div>

            {/* Interpolation */}
            <div style={{ background: `${T.a3}10`, border: `1px solid ${T.a3}30`, borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ color: T.a3, fontWeight: 600, fontSize: 12, marginBottom: 4 }}>📐 Pourquoi interpoler ?</div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
                Après soutirage, <K>{"V' = V_i + u \\cdot \\Delta t"}</K> tombe <em>entre</em> deux nœuds de la grille de volume
                (ex : V' = 43.7 GWh alors que la grille a des nœuds à 42.9 et 50 GWh). On estime{' '}
                <K>{"\\mathcal{V}_{t+1}[V'][k]"}</K> par interpolation linéaire entre les deux nœuds voisins —
                comme lire une valeur entre deux graduations d'une règle.
              </div>
            </div>
          </div>
        </Step>

        <div style={{ borderTop: `1px solid ${T.border}` }} />

        {/* Étape 3 */}
        <Step num={3} accent={ACCENT}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <strong>Sélectionner, enregistrer, et remonter au pas précédent</strong>
            </div>

            {/* Formule + explication du argmax */}
            <FormulaBox accent={ACCENT}>
              <K display>{"u^*_{t,i,j} = \\arg\\max_{u\\;\\text{admissible}}\\;\\text{gain}(u) \\qquad \\mathcal{V}_t[i][j] = \\text{gain}(u^*)"}</K>
            </FormulaBox>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75 }}>
              On a calculé <K>{"\\text{gain}(u)"}</K> pour chaque action testée (11 valeurs de{' '}
              <K>{"u"}</K> entre <K>{"- q_{\\text{wit}}"}</K> et <K>{"+ q_{\\text{inj}}"}</K>).{' '}
              <K>{"\\arg\\max"}</K> signifie : <em>"retourne l'action qui donne le gain le plus grand"</em>.{' '}
              On stocke deux choses en mémoire pour chaque nœud <K>{"(t,\\,V_i,\\,S_j)"}</K> :{' '}
              <strong style={{ color: ACCENT }}>la valeur maximale</strong> <K>{"\\mathcal{V}_t[i][j]"}</K> et{' '}
              <strong style={{ color: T.a4 }}>l'action optimale</strong> <K>{"u^*_{t,i,j}"}</K>.
              On passe ensuite au nœud voisin, puis au pas de temps <K>{"t-1"}</K> — on utilise les valeurs
              <K>{"\\mathcal{V}_t"}</K> qu'on vient de calculer pour alimenter le pas <K>{"t-1"}</K>.
            </div>

            {/* Timeline pédagogique */}
            <div style={{ background: `${ACCENT}0e`, border: `1px solid ${ACCENT}33`, borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ color: ACCENT, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>
                📅 Repère temporel — où se situe t = 11 dans le contrat ?
              </div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75 }}>
                Le contrat de stockage couvre <K>{"T = 12"}</K> mois (<K>{"t = 0"}</K> = aujourd'hui,{' '}
                <K>{"t = 12"}</K> = expiration).
                L'algorithme part de <K>{"t = 12"}</K> et remonte vers <K>{"t = 0"}</K> :{' '}
              </div>
              {/* Frise temporelle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 10, overflowX: 'auto' }}>
                {[...Array(13)].map((_, t) => {
                  const isTerminal = t === 12
                  const isCurrent = t === 11
                  const isStart = t === 0
                  return (
                    <React.Fragment key={t}>
                      <div style={{
                        flexShrink: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', border: `2px solid ${isCurrent ? ACCENT : isTerminal ? T.a5 : isStart ? T.a4 : T.border}`,
                          background: isCurrent ? `${ACCENT}33` : isTerminal ? `${T.a5}22` : isStart ? `${T.a4}22` : T.panel2,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isCurrent ? ACCENT : isTerminal ? T.a5 : isStart ? T.a4 : T.muted,
                          fontWeight: (isCurrent || isTerminal || isStart) ? 700 : 400,
                          fontSize: 10,
                        }}>
                          {t}
                        </div>
                        <div style={{ fontSize: 9, color: isCurrent ? ACCENT : isTerminal ? T.a5 : isStart ? T.a4 : 'transparent', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {isCurrent ? '← ici' : isTerminal ? 'T=12' : isStart ? 't=0' : ''}
                        </div>
                      </div>
                      {t < 12 && (
                        <div style={{ flexShrink: 0, height: 2, width: t === 10 ? 14 : 14, background: t === 11 ? `${ACCENT}55` : T.border }} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
              <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
                <span style={{ color: ACCENT, fontWeight: 600 }}>t = 11</span> = <strong>dernier mois opérationnel</strong> (décembre si le contrat finit fin décembre).{' '}
                Le pas d'après, <span style={{ color: T.a5, fontWeight: 600 }}>t = 12</span>, c'est l'expiration :{' '}
                <K>{"\\mathcal{V}_{12}[i][j] = 0"}</K> pour tous les états (condition terminale, étape 1).
              </div>
            </div>

            {/* Exemple 1 : t=11, dernier pas — 𝔼=0 */}
            <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ background: ACCENT, color: '#000', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Exemple A</span>
                <span style={{ color: T.text, fontWeight: 600, fontSize: 12 }}>Nœud (t = 11, V = 50 GWh, S = 45 €/GWh) — <em>dernier mois</em></span>
              </div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
                Comme <K>{"t+1 = 12 = T"}</K>, la condition terminale s'applique :{' '}
                <K>{"\\mathcal{V}_{12}[\\cdot][\\cdot] = 0"}</K> partout.{' '}
                Donc <K>{"e^{-r\\Delta t}\\,\\mathbb{E}[\\mathcal{V}_{12}] = 0"}</K> <strong>quelle que soit l'action choisie</strong>.{' '}
                Il ne reste que le gain immédiat <K>{"\\pi(u)"}</K> :{' '}
                <K display>{"\\text{gain}(u) = \\underbrace{\\pi(u)}_{\\text{seul terme qui compte}} + \\underbrace{0}_{\\mathbb{E}[\\mathcal{V}_{12}]=0}"}</K>
                <strong>Conséquence directe :</strong> au dernier mois, il faut toujours soutirer au maximum <K>{"(u^* = -q_{\\text{wit}})"}</K>.
                On ne garde aucun gaz pour "plus tard" — il n'y a plus de plus tard.
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {["Action u", "V' résultant", "π = |u|×(S−c)", "𝔼[𝒱₁₂] (= 0)", "gain(u) = π + 0", ""].map((h, i) => (
                      <th key={i} style={{ padding: '4px 8px', borderBottom: `1px solid ${ACCENT}44`, color: ACCENT, fontWeight: 700, textAlign: 'left', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { u: '−10 (soutirer max)', vp: '40 GWh', pi: '10×(45−0.5) = +445 €', esp: '0 €', gain: '+445 €', best: true },
                    { u: '−5', vp: '45 GWh', pi: '5×(45−0.5) = +222 €', esp: '0 €', gain: '+222 €', best: false },
                    { u: '0 (attendre)', vp: '50 GWh', pi: '0 €', esp: '0 €', gain: '0 €', best: false },
                    { u: '+5 (injecter)', vp: '55 GWh', pi: '−5×(45+0.5) = −228 €', esp: '0 €', gain: '−228 €', best: false },
                    { u: '+10 (injecter max)', vp: '60 GWh', pi: '−10×(45+0.5) = −455 €', esp: '0 €', gain: '−455 €', best: false },
                  ].map(({ u, vp, pi, esp, gain, best }) => (
                    <tr key={u} style={{ background: best ? `${ACCENT}15` : 'transparent' }}>
                      <td style={{ padding: '4px 8px', color: best ? ACCENT : T.text, fontWeight: best ? 700 : 400, fontSize: 11 }}>{u}</td>
                      <td style={{ padding: '4px 8px', color: T.muted, fontSize: 11 }}>{vp}</td>
                      <td style={{ padding: '4px 8px', color: T.muted, fontSize: 11 }}>{pi}</td>
                      <td style={{ padding: '4px 8px', color: T.a5, fontSize: 11, fontStyle: 'italic' }}>{esp}</td>
                      <td style={{ padding: '4px 8px', color: best ? ACCENT : T.muted, fontWeight: best ? 700 : 400, fontSize: 11 }}>{gain}</td>
                      <td style={{ padding: '4px 8px', fontSize: 11 }}>{best && <span style={{ background: ACCENT, color: '#000', borderRadius: 3, padding: '1px 6px', fontWeight: 700 }}>✓ u*</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
                → <K>{"u^* = -10"}</K> GWh/mois, <K>{"\\mathcal{V}_{11}[50][45] = 445\\,\\text{€}"}</K>.
                Décision triviale : on vidange le tank au prix du marché.
              </div>
            </div>

            {/* Exemple 2 : t=6, milieu — 𝔼 ≠ 0, vrai arbitrage */}
            <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ background: T.a4, color: '#000', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Exemple B</span>
                <span style={{ color: T.text, fontWeight: 600, fontSize: 12 }}>Nœud (t = 6, V = 50 GWh, S = 45 €/GWh) — <em>milieu de contrat</em></span>
              </div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
                Ici <K>{"t+1 = 7"}</K> — il reste encore 6 mois. Les valeurs <K>{"\\mathcal{V}_7[i][j]"}</K> ont déjà été calculées lors
                du passage au nœud <K>{"t=7"}</K>.{' '}
                L'espérance future <strong>dépend du stock résultant <K>{"V'"}</K></strong> :{' '}
                plus le tank est plein, plus la valeur future potentielle est grande (on aura du gaz à vendre si les prix montent).
                <br />
                <K display>{"\\text{gain}(u) = \\underbrace{\\pi(u)}_{\\text{profit spot}} + e^{-r\\Delta t}\\underbrace{\\mathbb{E}[\\mathcal{V}_7(V+u\\cdot\\Delta t,\\,S_{t+1})]}_{\\text{valeur future — dépend de } u}"}</K>
                Il y a maintenant un <strong>vrai arbitrage</strong> entre capter un profit immédiat et préserver du gaz pour l'avenir.
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {["Action u", "V' résultant", "π immédiat", "e⁻ʳ·𝔼[𝒱₇(V',·)]", "gain(u)", ""].map((h, i) => (
                      <th key={i} style={{ padding: '4px 8px', borderBottom: `1px solid ${T.a4}55`, color: T.a4, fontWeight: 700, textAlign: 'left', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { u: '−10 (soutirer max)', vp: '40 GWh', pi: '+445 €', esp: '+275 €', gain: '+720 €', best: true, note: 'tank bas → futur limité' },
                    { u: '−5', vp: '45 GWh', pi: '+222 €', esp: '+315 €', gain: '+537 €', best: false, note: '' },
                    { u: '0 (attendre)', vp: '50 GWh', pi: '0 €', esp: '+355 €', gain: '+355 €', best: false, note: 'conserver optionalité' },
                    { u: '+5 (injecter)', vp: '55 GWh', pi: '−228 €', esp: '+395 €', gain: '+167 €', best: false, note: '' },
                    { u: '+10 (injecter max)', vp: '60 GWh', pi: '−455 €', esp: '+430 €', gain: '−25 €', best: false, note: 'coût > hausse future' },
                  ].map(({ u, vp, pi, esp, gain, best, note }) => (
                    <tr key={u} style={{ background: best ? `${T.a4}15` : 'transparent' }}>
                      <td style={{ padding: '4px 8px', color: best ? T.a4 : T.text, fontWeight: best ? 700 : 400, fontSize: 11 }}>{u}</td>
                      <td style={{ padding: '4px 8px', color: T.muted, fontSize: 11 }}>{vp}</td>
                      <td style={{ padding: '4px 8px', color: T.muted, fontSize: 11 }}>{pi}</td>
                      <td style={{ padding: '4px 8px', color: T.a4, fontSize: 11 }}>{esp}{note && <span style={{ color: T.muted, fontStyle: 'italic' }}> ({note})</span>}</td>
                      <td style={{ padding: '4px 8px', color: best ? T.a4 : T.muted, fontWeight: best ? 700 : 400, fontSize: 11 }}>{gain}</td>
                      <td style={{ padding: '4px 8px', fontSize: 11 }}>{best && <span style={{ background: T.a4, color: '#000', borderRadius: 3, padding: '1px 6px', fontWeight: 700 }}>✓ u*</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
                → <K>{"u^* = -10"}</K> ici aussi, mais <em>pour d'autres raisons</em> : le profit spot l'emporte sur la valeur future perdue.
                Si le prix spot avait été très bas (ex : <K>{"S = 20"}</K> €/GWh), l'arbitrage pourrait basculer vers <K>{"u = 0"}</K>
                ou même <K>{"u > 0"}</K> (stocker pour profiter d'une remontée des prix).
                C'est précisément ce que le DP calcule sans que vous n'ayez à l'anticiper manuellement.
              </div>
            </div>

            {/* Récap comparatif des deux exemples */}
            <div style={{ background: `${T.a5}10`, border: `1px solid ${T.a5}33`, borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ color: T.a5, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>
                🔑 Ce que ces deux exemples illustrent
              </div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75 }}>
                <strong>Exemple A (t = 11)</strong> — dernier mois : <K>{"\\mathbb{E}[\\mathcal{V}_{t+1}] = 0"}</K>,
                la décision est triviale (soutirer tout). <em>La valeur du stockage réside uniquement dans le flux immédiat.</em>
                <br />
                <strong>Exemple B (t = 6)</strong> — milieu de contrat : <K>{"\\mathbb{E}[\\mathcal{V}_{t+1}] \\neq 0"}</K>,
                et elle <em>varie selon l'action choisie</em>. L'algorithme évalue toutes les actions et choisit le meilleur compromis.
                <br />
                <strong>C'est la récursion :</strong> pour calculer l'exemple B, il a fallu calculer 𝒱₇ d'abord —
                qui lui-même avait besoin de 𝒱₈, …, jusqu'à 𝒱₁₂ = 0. C'est pourquoi on part de la fin.
              </div>
            </div>

            {/* Pourquoi stocker u* */}
            <div style={{ background: `${T.a4}10`, border: `1px solid ${T.a4}33`, borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ color: T.a4, fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                💡 Pourquoi stocker <K>{"u^*"}</K> en plus de <K>{"\\mathcal{V}"}</K> ?
              </div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75 }}>
                <K>{"\\mathcal{V}_0[i_0][j_0]"}</K> répond à <em>"combien vaut mon stockage ?"</em> —
                c'est un nombre, utile pour la valorisation et la vente du contrat.
                Mais pour <strong>opérer le stockage au quotidien</strong>, il faut une règle concrète :{' '}
                <em>"ce mois-ci, avec ce niveau de stock et ce prix, qu'est-ce que je fais ?"</em>
                <br /><br />
                La table <K>{"u^*[t][i][j]"}</K> est exactement ça : un <strong>look-up instantané</strong>.
                À chaque début de mois, l'opérateur observe le prix spot <K>{"S"}</K> et le niveau du tank <K>{"V"}</K>,
                trouve le nœud <K>{"(i, j)"}</K> le plus proche, et lit la décision :
                <br />
                <span style={{ color: T.a4, fontFamily: 'monospace', fontSize: 12, marginTop: 4, display: 'block' }}>
                  t=3, V=45 GWh, S=52 €/MWh → u* = −8 GWh/mois (soutirer)
                </span>
                <span style={{ color: T.a4, fontFamily: 'monospace', fontSize: 12 }}>
                  t=8, V=20 GWh, S=30 €/MWh → u* = +6 GWh/mois (injecter)
                </span>
                <br />
                Sans cette table, il faudrait relancer tout le calcul DP à chaque mois — ce qui prendrait
                plusieurs minutes. Avec la table pré-calculée, la décision est instantanée.
              </div>
            </div>

            {/* Ce qu'on obtient à la fin — version enrichie */}
            <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}33`, borderRadius: 6, padding: '12px 14px' }}>
              <div style={{ color: ACCENT, fontWeight: 600, fontSize: 12, marginBottom: 10 }}>Les deux livrables après t = 0 :</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    icon: '💰',
                    label: <><K>{"\\mathcal{V}_0[i_0][j_0]"}</K> — la valeur économique du stockage</>,
                    color: ACCENT,
                    desc: <>
                      C'est <strong>le prix juste du contrat de stockage</strong> à l'état initial (volume V₀, prix spot S₀).
                      Un acheteur rationnel devrait payer exactement ce montant pour acquérir ce stockage —
                      ni plus (il perdrait de l'argent), ni moins (le vendeur laisserait de la valeur sur la table).
                      <br />
                      <span style={{ color: T.muted, fontSize: 11 }}>En pratique : avec κ=1.5, μ=40, σ=8, q=10 GWh/mois — la simulation donne ~390 € pour 50 GWh à prix médian.</span>
                    </>,
                  },
                  {
                    icon: '🗺️',
                    label: <><K>{"u^*[t][i][j]"}</K> — la carte de décision complète (la "policy")</>,
                    color: T.a4,
                    desc: <>
                      Un tableau 3D : <K>{"N_T \\times N_V \\times N_S = 12 \\times 15 \\times 12 = 2\\,160"}</K> entrées,
                      chacune contenant la décision optimale pour cet état.
                      C'est la <strong>stratégie complète</strong> : peu importe l'état futur observé, la réponse optimale
                      est déjà calculée et prête à être appliquée.
                      <br />
                      <span style={{ color: T.muted, fontSize: 11 }}>
                        La simulation interactive ci-dessous visualise une coupe de cette table : la politique optimale
                        <K>{"u^*(V, S{=}\\mu)"}</K> au mois t=0, à prix médian.
                      </span>
                    </>,
                  },
                ].map(({ icon, label, color, desc }) => (
                  <div key={icon} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: `1px solid ${T.border}` }}>
                    <span style={{ flexShrink: 0, fontSize: 18, lineHeight: 1 }}>{icon}</span>
                    <div>
                      <div style={{ color, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                      <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.7 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </Step>
      </div>

      {/* Résumé visuel de la boucle */}
      <div style={{ ...panelStyle, margin: '14px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 10 }}>Vue d'ensemble — ordre d'exécution de l'algorithme</div>
        <pre style={{ color: T.text, fontSize: 11, lineHeight: 2, margin: 0, fontFamily: 'monospace', overflowX: 'auto' }}>
{`  t = T    → 𝒱[T][i][j] = 0  pour tous les (i, j)          ← INITIALISATION

  t = T-1  → pour chaque (V_i, S_j) :
               tester u ∈ {-q_wit, ..., +q_inj}
               gain(u) = π(u, Sⱼ) + e⁻ʳᐩᵗ · Σₖ Π[j][k] · 𝒱[T][V'][k]
               u*[T-1][i][j] = argmax gain(u)
               𝒱[T-1][i][j] = max gain(u)

  t = T-2  → même boucle, mais utilise 𝒱[T-1] déjà calculé
     ⋮
  t = 0    → 𝒱[0][i₀][j₀] = valeur du stockage à l'état initial
             u*[0][i₀][j₀] = action optimale ce mois-ci`}
        </pre>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Chaque ligne utilise la ligne suivante déjà calculée — c'est le principe du <em>backward induction</em>.
          On ne devine pas l'avenir : on le <strong>récapitule</strong> en probabilités via <K>{"\\Pi"}</K>, puis on recule.
        </div>
      </div>

      {/* ── Visualisation pédagogique des structures de données ──────────────── */}
      <Accordion title="Visualisation complète — grilles, matrice Π et backward pas à pas" accent={ACCENT} badge="Détail">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 1. Les 3 axes de la grille */}
          <div>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>1. Les trois axes de la grille 3D</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 10 }}>
              L'espace complet est un cube <K>{"N_T \\times N_V \\times N_S = 12 \\times 15 \\times 12 = 2\\,160"}</K> nœuds.
              Chaque axe est une grille discrète de valeurs régulièrement espacées :
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {/* Volume */}
              <div style={{ background: T.panel2, border: `1px solid ${T.a4}44`, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ color: T.a4, fontWeight: 700, fontSize: 11, marginBottom: 8 }}>Volume V — NV = 15 nœuds</div>
                <div style={{ color: T.muted, fontSize: 10, marginBottom: 6 }}>
                  de <K>{"V_{\\min}=0"}</K> à <K>{"V_{\\max}=100"}</K> GWh, pas <K>{"\\approx 7.1"}</K> GWh
                </div>
                {[0, 7.1, 14.3, 21.4, 28.6, 35.7, 42.9, 50, 57.1, 64.3, 71.4, 78.6, 85.7, 92.9, 100].map((v, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ width: `${v + 4}%`, maxWidth: '60%', minWidth: 8, height: 7, background: i === 7 ? T.a4 : `${T.a4}44`, borderRadius: 2, transition: 'width 0.2s', flexShrink: 0 }} />
                    <span style={{ color: i === 7 ? T.a4 : T.muted, fontSize: 9, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      V[{i}]={v} GWh{i === 7 ? ' ←' : ''}
                    </span>
                  </div>
                ))}
              </div>
              {/* Prix */}
              <div style={{ background: T.panel2, border: `1px solid ${ACCENT}44`, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ color: ACCENT, fontWeight: 700, fontSize: 11, marginBottom: 8 }}>Prix S — NS = 12 nœuds</div>
                <div style={{ color: T.muted, fontSize: 10, marginBottom: 6 }}>
                  de <K>{"\\mu-3\\sigma=16\\,\\text{€}"}</K> à <K>{"\\mu+3\\sigma=64\\,\\text{€}"}</K>, pas <K>{"\\approx 4.4\\,\\text{€}"}</K>
                </div>
                {[16, 20.4, 24.7, 29.1, 33.5, 37.8, 42.2, 46.5, 50.9, 55.3, 59.6, 64].map((s, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ width: `${(s - 16) / (64 - 16) * 60 + 8}%`, maxWidth: '65%', minWidth: 8, height: 7, background: j === 5 ? ACCENT : `${ACCENT}44`, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ color: j === 5 ? ACCENT : T.muted, fontSize: 9, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      S[{j}]={s.toFixed(1)} €{j === 5 ? ' ← S_j' : j === 5 ? '' : ''}
                    </span>
                  </div>
                ))}
              </div>
              {/* Temps */}
              <div style={{ background: T.panel2, border: `1px solid ${T.a5}44`, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ color: T.a5, fontWeight: 700, fontSize: 11, marginBottom: 8 }}>Temps t — 13 pas (t=0…12)</div>
                <div style={{ color: T.muted, fontSize: 10, marginBottom: 6 }}>
                  Backward : calcul de <K>{"t=12"}</K> vers <K>{"t=0"}</K>
                </div>
                {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((t) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ width: t === 12 ? 8 : `${(13 - t) / 13 * 60 + 4}%`, maxWidth: '65%', minWidth: 4, height: 7, background: t === 12 ? T.a5 : t === 0 ? T.a4 : t === 11 ? `${ACCENT}99` : `${T.a5}44`, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ color: t === 12 ? T.a5 : t === 0 ? T.a4 : T.muted, fontSize: 9, fontFamily: 'monospace', fontWeight: (t === 12 || t === 0) ? 700 : 400 }}>
                      t={t}{t === 12 ? ' ← 𝒱=0 (init)' : t === 0 ? ' ← résultat final' : t === 11 ? ' ← dernier mois op.' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. L'espace d'états 2D */}
          <div>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>2. L'espace d'états (V, S) à un instant t — les 180 nœuds</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 10 }}>
              À chaque pas <K>{"t"}</K>, l'algorithme parcourt les <K>{"15 \\times 12 = 180"}</K> combinaisons (volume, prix).
              Ci-dessous une version simplifiée <K>{"6 \\times 5"}</K> pour la lisibilité.
              Le nœud <strong style={{ color: ACCENT }}>(i=2, j=2) = (V=40 GWh, S=40 €)</strong> est l'exemple traité ci-dessous.
            </div>
            <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
              {/* Y-axis */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: 24 }}>
                {[100, 80, 60, 40, 20, 0].map(v => (
                  <div key={v} style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6, color: v === 40 ? T.a4 : T.muted, fontSize: 9, fontFamily: 'monospace', fontWeight: v === 40 ? 700 : 400, width: 52 }}>
                    V={v}
                  </div>
                ))}
                <div style={{ color: T.a4, fontSize: 9, fontStyle: 'italic', marginTop: 4, paddingRight: 6 }}>Volume</div>
              </div>
              {/* Grid */}
              <div>
                <div style={{ display: 'flex', paddingLeft: 2, marginBottom: 4 }}>
                  {[16, 28, 40, 52, 64].map(s => (
                    <div key={s} style={{ width: 62, textAlign: 'center', color: s === 40 ? ACCENT : T.muted, fontSize: 9, fontFamily: 'monospace', fontWeight: s === 40 ? 700 : 400 }}>S={s}€</div>
                  ))}
                </div>
                {[100, 80, 60, 40, 20, 0].map((v, ri) => {
                  const i = [0, 20, 40, 60, 80, 100].indexOf(v)
                  return (
                    <div key={v} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[16, 28, 40, 52, 64].map((s, j) => {
                        const isCurrent = i === 2 && j === 2
                        const sameV = i === 2
                        const sameS = j === 2
                        return (
                          <div key={s} style={{
                            width: 58, height: 30, borderRadius: 4,
                            background: isCurrent ? ACCENT : sameV ? `${ACCENT}28` : sameS ? `${T.a4}22` : `${T.border}55`,
                            border: `1px solid ${isCurrent ? ACCENT : sameV ? `${ACCENT}55` : T.border}`,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: 8, color: isCurrent ? '#000' : T.muted, fontFamily: 'monospace', fontWeight: isCurrent ? 700 : 400 }}>
                              ({i},{j})
                            </span>
                            {isCurrent && <span style={{ fontSize: 7, color: '#000', fontWeight: 700 }}>← nœud</span>}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
                <div style={{ textAlign: 'center', color: ACCENT, fontSize: 9, fontStyle: 'italic', marginTop: 4 }}>Prix S →</div>
              </div>
            </div>
            <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
              Ligne surlignée = tous les états avec V=40 GWh (même volume, prix différents).
              Colonne surlignée = tous les états avec S=40 € (même prix, volumes différents).
              L'algorithme traite chaque cellule, dans n'importe quel ordre sur (i,j), pour un t donné.
            </div>
          </div>

          {/* 3. Matrice Π */}
          <div>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>3. La matrice de transition Π[j][k] — exemple 5×5 (réelle : 12×12)</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 10 }}>
              <K>{"\\Pi[j][k] = \\mathbb{P}(S_{t+1} = S_k \\mid S_t = S_j)"}</K> — chaque <strong>ligne</strong> est une loi de probabilité (somme = 1).
              L'intensité de couleur reflète la probabilité : plus c'est rouge, plus c'est probable.
              Avec κ=1.5 (mean-reversion forte), les probabilités sont concentrées autour de μ=40 €.
            </div>
            {(() => {
              const sLabels = ['16€', '28€', '40€', '52€', '64€']
              const Pi = [
                [0.10, 0.30, 0.40, 0.15, 0.05],
                [0.05, 0.25, 0.45, 0.20, 0.05],
                [0.03, 0.15, 0.52, 0.25, 0.05],
                [0.02, 0.10, 0.40, 0.35, 0.13],
                [0.02, 0.08, 0.30, 0.35, 0.25],
              ]
              return (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 420 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 10px', color: T.muted, fontWeight: 600, fontSize: 10, textAlign: 'left', borderBottom: `2px solid ${T.border}`, background: T.panel2 }}>
                          Π[Sⱼ → Sₖ]
                        </th>
                        {sLabels.map((s, k) => (
                          <th key={k} style={{ padding: '6px 14px', color: k === 2 ? ACCENT : T.muted, fontWeight: k === 2 ? 700 : 600, fontSize: 10, borderBottom: `2px solid ${T.border}`, textAlign: 'center', background: k === 2 ? `${ACCENT}12` : T.panel2 }}>
                            Sₖ={s}
                          </th>
                        ))}
                        <th style={{ padding: '6px 10px', color: T.a4, fontSize: 10, borderBottom: `2px solid ${T.border}`, textAlign: 'center', background: T.panel2 }}>Σ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Pi.map((row, j) => (
                        <tr key={j} style={{ background: j === 2 ? `${ACCENT}10` : 'transparent' }}>
                          <td style={{ padding: '7px 10px', color: j === 2 ? ACCENT : T.muted, fontWeight: j === 2 ? 700 : 400, fontSize: 10, borderRight: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                            Sⱼ={sLabels[j]}{j === 2 ? ' ←' : ''}
                          </td>
                          {row.map((p, k) => (
                            <td key={k} style={{
                              padding: '7px 14px', textAlign: 'center', fontSize: 12,
                              background: `rgba(248,113,113,${(p / 0.52) * 0.55})`,
                              color: p >= 0.25 ? '#fff' : T.muted,
                              fontWeight: j === 2 ? 700 : 400,
                              border: j === 2 && k === 2 ? `2px solid ${ACCENT}` : `1px solid ${T.border}22`,
                            }}>
                              {p.toFixed(2)}
                            </td>
                          ))}
                          <td style={{ padding: '7px 10px', color: T.a4, fontSize: 11, textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>
                            {row.reduce((a, b) => a + b, 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })()}
            <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
              Lecture de la <strong style={{ color: ACCENT }}>ligne j=2 (S=40€)</strong> : depuis le prix médian, 52% de rester à 40€, 25% de monter à 52€, 15% de descendre à 28€.
              La mean-reversion (κ=1.5) tire les probabilités vers μ=40€ — les états extrêmes (16€, 64€) ont faible probabilité même depuis eux-mêmes.
            </div>
          </div>

          {/* 4. Calcul de l'espérance pas à pas */}
          <div>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>4. Calcul de l'espérance — le backward en 3 étapes concrètes</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginBottom: 12 }}>
              On est au nœud <K>{"(t=10,\\; V_i=50\\,\\text{GWh},\\; S_j=40\\,\\text{€})"}</K>.
              On teste l'action <K>{"u = -10"}</K> GWh/mois <K>{"\\Rightarrow V' = 50 + (-10)\\times 1 = 40"}</K> GWh.
              Il faut calculer <K>{"\\mathbb{E}[\\mathcal{V}_{11}(V'{=}40,\\,S_{t+1})]"}</K> — la valeur attendue au pas suivant.
            </div>

            {/* Étape a: vecteur V_{11}[40] */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ background: T.a4, color: '#000', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>a</span>
                <span style={{ color: T.text, fontSize: 12, fontWeight: 600 }}>Lire le vecteur <K>{"\\mathcal{V}_{11}[40\\,\\text{GWh}][\\cdot]"}</K> — déjà calculé au pas t=11</span>
              </div>
              <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6, marginBottom: 8 }}>
                C'est une ligne du tableau 𝒱₁₁ pour V'=40 GWh : <em>combien vaudra le stockage le mois prochain à 40 GWh, pour chacun des 5 (ici 12 en réalité) prix possibles ?</em>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      <td style={{ padding: '5px 10px', color: T.a4, fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${T.border}` }}>V'=40 GWh →</td>
                      {['S₀=16€', 'S₁=28€', 'S₂=40€', 'S₃=52€', 'S₄=64€'].map((h, k) => (
                        <th key={k} style={{ padding: '5px 16px', color: ACCENT, fontWeight: 700, fontSize: 10, textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '7px 10px', color: T.muted, fontSize: 10, fontStyle: 'italic', borderRight: `1px solid ${T.border}` }}>𝒱₁₁[40][k] =</td>
                      {[180, 290, 380, 470, 550].map((v, k) => (
                        <td key={k} style={{ padding: '7px 16px', textAlign: 'center', background: `rgba(248,113,113,${v / 550 * 0.55})`, color: v >= 380 ? '#fff' : T.text, fontSize: 13, fontWeight: 700, borderRight: `1px solid ${T.border}22` }}>
                          {v} €
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ color: T.muted, fontSize: 11, marginTop: 6, lineHeight: 1.6 }}>
                Interprétation : à prix bas (16€), le gaz en stock vaudra peu (180€) car personne ne soutire à perte.
                À prix élevé (64€), 40 GWh vaut 550€ — le marché paie bien la livraison.
              </div>
            </div>

            {/* Étape b: ligne Π[j=2] */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ background: ACCENT, color: '#000', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>b</span>
                <span style={{ color: T.text, fontSize: 12, fontWeight: 600 }}>Lire la ligne <K>{"\\Pi[j{=}2][\\cdot]"}</K> — probabilités depuis S=40€</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      <td style={{ padding: '5px 10px', color: ACCENT, fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${T.border}` }}>S_j=40€ →</td>
                      {['S₀=16€', 'S₁=28€', 'S₂=40€', 'S₃=52€', 'S₄=64€'].map((h, k) => (
                        <th key={k} style={{ padding: '5px 16px', color: ACCENT, fontWeight: 700, fontSize: 10, textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '7px 10px', color: T.muted, fontSize: 10, fontStyle: 'italic', borderRight: `1px solid ${T.border}` }}>Π[2][k] =</td>
                      {[0.03, 0.15, 0.52, 0.25, 0.05].map((p, k) => (
                        <td key={k} style={{ padding: '7px 16px', textAlign: 'center', background: `rgba(248,113,113,${p / 0.52 * 0.55})`, color: p >= 0.3 ? '#fff' : T.muted, fontSize: 13, fontWeight: 700, borderRight: `1px solid ${T.border}22` }}>
                          {p.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Étape c: produit scalaire */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ background: T.a5, color: '#000', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>c</span>
                <span style={{ color: T.text, fontSize: 12, fontWeight: 600 }}>Produit scalaire : <K>{"\\mathbb{E}[\\mathcal{V}_{11}] = \\sum_k \\Pi[2][k] \\cdot \\mathcal{V}_{11}[40][k]"}</K></span>
              </div>
              {/* Tableau de multiplication term à term */}
              <div style={{ overflowX: 'auto', marginBottom: 10 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      {['k', 'Sₖ', 'Π[2][k]', '×', '𝒱₁₁[40][k]', '=', 'terme'].map((h, i) => (
                        <th key={i} style={{ padding: '5px 12px', color: T.muted, fontSize: 10, fontWeight: 600, borderBottom: `1px solid ${T.border}`, textAlign: 'center' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { k: 0, s: '16€', pi: 0.03, v: 180, prod: 5.4 },
                      { k: 1, s: '28€', pi: 0.15, v: 290, prod: 43.5 },
                      { k: 2, s: '40€', pi: 0.52, v: 380, prod: 197.6 },
                      { k: 3, s: '52€', pi: 0.25, v: 470, prod: 117.5 },
                      { k: 4, s: '64€', pi: 0.05, v: 550, prod: 27.5 },
                    ].map(({ k, s, pi, v, prod }) => (
                      <tr key={k} style={{ background: k % 2 === 0 ? `${T.border}22` : 'transparent' }}>
                        <td style={{ padding: '6px 12px', color: T.muted, fontSize: 10, textAlign: 'center', fontFamily: 'monospace' }}>{k}</td>
                        <td style={{ padding: '6px 12px', color: T.muted, fontSize: 11, textAlign: 'center' }}>{s}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', background: `rgba(248,113,113,${pi / 0.52 * 0.4})`, color: pi >= 0.3 ? '#fff' : T.text, fontWeight: 700, fontSize: 11 }}>{pi.toFixed(2)}</td>
                        <td style={{ padding: '6px 8px', color: T.muted, textAlign: 'center', fontSize: 14 }}>×</td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', background: `rgba(248,113,113,${v / 550 * 0.4})`, color: v >= 380 ? '#fff' : T.text, fontWeight: 700, fontSize: 11 }}>{v} €</td>
                        <td style={{ padding: '6px 8px', color: T.muted, textAlign: 'center', fontSize: 14 }}>=</td>
                        <td style={{ padding: '6px 12px', color: ACCENT, fontWeight: 700, fontSize: 12, textAlign: 'center', fontFamily: 'monospace' }}>{prod.toFixed(1)} €</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: `2px solid ${ACCENT}` }}>
                      <td colSpan={6} style={{ padding: '7px 12px', color: ACCENT, fontWeight: 700, fontSize: 12, textAlign: 'right' }}>Total 𝔼[𝒱₁₁] =</td>
                      <td style={{ padding: '7px 12px', color: ACCENT, fontWeight: 700, fontSize: 14, textAlign: 'center', fontFamily: 'monospace', background: `${ACCENT}18` }}>391.5 €</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}33`, borderRadius: 6, padding: '10px 14px' }}>
                <K display>{"\\text{gain}(u{=}{-10}) = \\underbrace{10 \\times (40 - 0.5)}_{\\pi = 395\\,\\text{€}} + \\underbrace{e^{-0.05/12}}_{\\approx 0.9958} \\times \\underbrace{391.5}_{\\mathbb{E}[\\mathcal{V}_{11}]} \\approx 395 + 389.9 = \\mathbf{784.9\\,\\text{€}}"}</K>
                <div style={{ color: T.muted, fontSize: 11, marginTop: 4, lineHeight: 1.6 }}>
                  Ce calcul est répété pour les <strong>11 actions</strong> admissibles à ce nœud, puis <K>{"\\arg\\max"}</K> sélectionne
                  la meilleure. Ensuite on passe au nœud suivant — 180 nœuds par pas, 12 pas = <strong>2 160 nœuds au total</strong>.
                </div>
              </div>
            </div>
          </div>

        </div>
      </Accordion>

      {/* ── Simulation interactive ──────────────────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Explorer l'effet de chaque paramètre</SectionTitle>

      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, margin: '0 0 12px' }}>
        Les deux graphiques montrent une coupe à <strong>prix médian S = μ</strong> et <strong>t = 0</strong>
        (début de la période de 12 mois, 50 GWh en stock pour les métriques).
        Gauche : <em>"combien vaut mon stockage selon son remplissage ?"</em> —
        Droite : <em>"que dois-je faire selon l'état du stock ?"</em>
      </div>

      <Grid cols={3} gap="12px">
        <Slider label="κ — vitesse de retour à la moyenne du prix" value={kappa} min={0.5} max={5} step={0.1} onChange={setKappa} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="μ — prix d'équilibre long terme (€/MWh)" value={mu} min={20} max={80} step={1} onChange={setMu} accent={ACCENT} format={v => `${v} €`} />
        <Slider label="σ — volatilité instantanée du prix (€/MWh)" value={sigma} min={1} max={25} step={0.5} onChange={setSigma} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="r — taux d'actualisation annuel" value={r} min={0} max={0.15} step={0.005} onChange={setR} accent={ACCENT} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="q_inj — débit max d'injection (GWh/mois)" value={qinj} min={2} max={20} step={1} onChange={setQinj} accent={ACCENT} format={v => `${v}`} />
        <Slider label="q_wit — débit max de soutirage (GWh/mois)" value={qwit} min={2} max={20} step={1} onChange={setQwit} accent={ACCENT} format={v => `${v}`} />
      </Grid>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="𝒱₀(50 GWh, prix médian)" value={v0.toFixed(2)} unit="€" accent={ACCENT} />
        <InfoChip label="Décision optimale u*" value={u0 > 0.5 ? `+${u0.toFixed(1)} inj` : u0 < -0.5 ? `${u0.toFixed(1)} sout` : '0 attente'} accent={u0 > 0.5 ? T.a1 : u0 < -0.5 ? T.a4 : T.muted} />
        <InfoChip label="Grille DP" value="15×12×12" unit="nœuds" accent={T.muted} />
      </div>

      <Grid cols={2} gap="16px">
        <ChartWrapper title="Fonction valeur 𝒱₀(V, S=μ) — valeur selon le remplissage du stockage" accent={ACCENT} height={220}>
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
        <ChartWrapper title="Politique optimale u*(V, S=μ) — la règle de décision au prix d'équilibre" accent={ACCENT} height={220}>
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

        {/* ── Fonction valeur ── */}
        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 10 }}>Lire la fonction valeur (gauche)</div>
          {[
            {
              icon: '📈',
              text: <><strong style={{ color: T.text }}>Croissante</strong> — plus de stock = plus de gaz à vendre quand les prix montent. Ex : à V = 100 GWh la valeur est environ 2× celle à V = 50 GWh.</>,
            },
            {
              icon: '🔝',
              text: <><strong style={{ color: T.text }}>S'aplatit à V<sub>max</sub></strong> — stock plein, impossible d'injecter davantage. Le GWh supplémentaire n'a nulle part où aller → valeur marginale nulle, la pente s'efface.</>,
            },
            {
              icon: '🔻',
              text: <><strong style={{ color: T.text }}>S'aplatit à V<sub>min</sub></strong> — stock vide, rien à soutirer. La flexibilité disparaît dans les deux sens.</>,
            },
            {
              icon: '📊',
              text: <><strong style={{ color: T.text }}>↑ σ → courbe plus haute</strong> — le stockage est une option réelle : on vend aux pics, on n'est pas obligé d'agir aux creux. Plus les prix bougent, plus ces occasions sont fréquentes. <K>{"\\mathcal{V}"}</K> est convexe en <K>{"\\sigma"}</K>.</>,
            },
            {
              icon: '⏳',
              text: <><strong style={{ color: T.text }}>↑ r → courbe plus basse</strong> — un gain de 100 € dans 6 mois ne vaut que <K>{"e^{-r \\cdot 0.5} \\times 100\\,\\text{€}"}</K> aujourd'hui. Plus r est élevé, plus les cashflows futurs se déprécient.</>,
            },
          ].map(({ icon, text }, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, fontSize: 14 }}>{icon}</span>
              <span style={{ color: T.muted, fontSize: 12, lineHeight: 1.65 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* ── Politique optimale ── */}
        <div style={{ background: `${T.a4}0d`, border: `1px solid ${T.a4}33`, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ color: T.a4, fontWeight: 700, fontSize: 12, marginBottom: 10 }}>Lire la politique optimale (droite)</div>
          {[
            {
              icon: '⬆️',
              text: <><strong style={{ color: T.text }}>u &gt; 0 — stock bas → injecter</strong> : acheter maintenant pour avoir du gaz à vendre lors d'un futur pic. Comme remplir son garde-manger avant l'hiver.</>,
            },
            {
              icon: '⬇️',
              text: <><strong style={{ color: T.text }}>u &lt; 0 — stock élevé → soutirer</strong> : vendre au prix actuel. À stock plein et prix médian, garder du gaz supplémentaire ne rapporte rien de plus.</>,
            },
            {
              icon: '⏸️',
              text: <><strong style={{ color: T.text }}>u ≈ 0 — stock intermédiaire → attendre</strong> : ni injecter ni soutirer ne se justifie encore. L'algorithme préfère conserver la flexibilité. Une hausse de <K>{"S"}</K> déclenchera le soutirage, une baisse l'injection.</>,
            },
            {
              icon: '🎛️',
              text: <><strong style={{ color: T.text }}>↑ q<sub>wit</sub> ou q<sub>inj</sub> → politique plus agressive</strong> : les plafonds d'action s'élargissent, les seuils de déclenchement s'écartent, la courbe devient plus pentue.</>,
            },
            {
              icon: '⚡',
              text: <><strong style={{ color: T.text }}>↑ σ → zone d'attente rétrécie</strong> : avec une forte volatilité, les pics sont intenses mais courts. Agir vite quand l'occasion se présente devient plus rentable → la bande neutre (u ≈ 0) se réduit.</>,
            },
          ].map(({ icon, text }, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, fontSize: 14 }}>{icon}</span>
              <span style={{ color: T.muted, fontSize: 12, lineHeight: 1.65 }}>{text}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ── Exercice guidé ──────────────────────────────────────────────────── */}
      <Accordion title="Exercice — Calculer manuellement un nœud avec deux états de prix futurs" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.75 }}>
          Stockage simplifié : 2 pas de temps (t = 0 et t = 1), V = 50 GWh, prix actuel S₀ = 45 €/MWh.
          Au mois suivant, deux prix possibles : S_bas = 30 €/MWh (prob. 0.4) et S_haut = 60 €/MWh (prob. 0.6).
          Condition terminale : 𝒱₁ = 0 partout.
          Paramètres : q_wit = 10, c_op = 0.5 €/GWh, r = 0, Δt = 1/12 an.
          <br /><br />
          <strong>Question :</strong> calculer 𝒱₀(50, 45) en testant u = 0 et u = −10. Quelle décision est optimale,
          et pourquoi le résultat serait différent si la valeur terminale n'était pas nulle ?
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Condition terminale" ruleDetail="𝒱₁ = 0 partout" accent={ACCENT}>
            𝒱₁(V', S_bas) = 0 et 𝒱₁(V', S_haut) = 0 pour tout V'.
            Fin de contrat → aucun cashflow futur → valeur nulle. Point de départ du backward.
          </DemoStep>
          <DemoStep num={2} rule="Tester u = 0 (attente)" ruleDetail="π = 0, 𝔼[𝒱₁] = 0" accent={ACCENT}>
            Aucun mouvement de gaz → π(0, 45) = 0. Volume inchangé, espérance future nulle.
            <br />
            <strong style={{ color: T.muted }}>Gain(u = 0) = 0 €</strong>
          </DemoStep>
          <DemoStep num={3} rule="Tester u = −10 (soutirer)" ruleDetail="π = |u|·S·Δt − c_op·|u|·Δt" accent={ACCENT}>
            <K>{"\\pi = 10 \\times 45 \\times \\tfrac{1}{12} \\;-\\; 0.5 \\times 10 \\times \\tfrac{1}{12} = 37.50 - 0.42 = +37.1\\text{ €}"}</K>
            <br />
            V' = 50 − 10/12 ≈ 49.2 GWh.{' '}
            Espérance future : <K>{"0.4 \\times 0 + 0.6 \\times 0 = 0"}</K>.
            <br />
            <strong style={{ color: ACCENT }}>Gain(u = −10) = 37.1 €</strong>
          </DemoStep>
          <DemoStep num={4} rule="Sélection du maximum" ruleDetail="u* = argmax gain(u)" accent={ACCENT}>
            max(0, 37.1) = 37.1 → <strong>u* = −10 GWh/mois (soutirer immédiatement).</strong>
            <br />
            <strong style={{ color: ACCENT }}>𝒱₀(50, 45) = 37.1 €</strong>
            <br />
            <span style={{ color: T.muted }}>
              Avec 𝒱₁ = 0, garder le gaz ne sert à rien — il faut vendre maintenant.
              Dans le modèle complet (12 mois), 𝒱₁ ≠ 0 : conserver 1 GWh a une valeur d'option
              (possibilité de le vendre à 60 €/MWh si S_haut se réalise). L'arbitrage "encaisser maintenant
              vs attendre un prix plus haut" devient non-trivial, et c'est précisément ce que résout Bellman.
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
    const merged = result[0].map((pt, i) => ({
      ...pt,
      ...result[1][i],
      ...result[2][i],
    }))
    return merged
  }, [kappa, mu, sigma, s0, seed])

  const halfLife = (Math.log(2) / kappa * 365).toFixed(0)
  const statStd = (sigma / Math.sqrt(2 * kappa)).toFixed(1)

  const NS_display = 5
  const sGridD = Array.from({ length: NS_display }, (_, j) => mu - 2 * parseFloat(statStd) + j * parseFloat(statStd))
  const PiD = buildTransitionMatrix(NS_display, sGridD, kappa, mu, sigma, 1 / 12)

  return (
    <div>

      {/* ── 1. Intuition ─────────────────────────────────────────── */}
      <IntuitionBlock emoji="🌡️" title="Le thermostat du marché gazier" accent={ACCENT}>
        <strong>Analogie du thermostat :</strong> imagine un thermostat réglé à 20 °C. Si tu ouvres la fenêtre
        en hiver, la température descend — mais dès que tu la refermes, le chauffage ramène la pièce vers 20 °C.
        Plus la différence est grande, plus vite le chauffage agit.
        <br /><br />
        Le gaz naturel fonctionne exactement pareil : au-delà d'un certain prix, les industriels substituent
        d'autres sources d'énergie (fioul, charbon) et l'offre s'adapte. En dessous d'un plancher,
        les producteurs ferment des puits car la production n'est plus rentable.
        Le <strong>coût marginal de production</strong> crée un ancrage fondamental <K>{"\\mu"}</K> vers lequel
        le prix revient toujours — c'est la <strong>mean-reversion</strong> (retour à la moyenne).
        <br /><br />
        Contrairement aux actions (Amazon a pu multiplier par 1 000), le prix du gaz est
        <strong> physiquement ancré</strong> : produire 1 MWh coûte un certain montant, et personne
        ne paie 10× ce montant durablement.
      </IntuitionBlock>

      {/* ── 2. Formule annotée ─────────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Le processus Ornstein-Uhlenbeck — la formule du prix du gaz</SectionTitle>

      <FormulaBox accent={ACCENT} label="Processus Ornstein-Uhlenbeck (OU)">
        <K display>{"dS_t = \\underbrace{\\kappa(\\mu - S_t)}_{\\text{force de rappel vers }\\mu}\\,dt + \\underbrace{\\sigma\\,dW_t}_{\\text{chocs aléatoires du marché}}"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['S_t', 'Prix spot du gaz à l\'instant t (€/MWh) — la variable modélisée'],
        ['\\kappa', 'Vitesse de retour à la moyenne (an⁻¹) — plus κ est grand, plus vite le prix revient vers μ'],
        ['\\mu', 'Prix d\'équilibre long terme (€/MWh) — le "coût fondamental" du gaz'],
        ['\\sigma', 'Volatilité instantanée (€/MWh/√an) — amplitude des chocs quotidiens'],
        ['dW_t', 'Incrément brownien — bruit aléatoire normalisé (moyenne 0, variance dt)'],
        ['dt', 'Pas de temps infinitésimal — durée d\'une micro-période dans le modèle continu'],
      ]} />

      {/* ── 3. Décomposition terme à terme ──────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '16px 0' }}>

        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🧲 κ(μ − Sₜ) · dt — La force de rappel</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            C'est le terme <strong>déterministe</strong> : il tire le prix vers μ comme un élastique.
            <br />
            • Si <K>{"S_t > \\mu"}</K> (prix au-dessus de l'équilibre), alors <K>{"\\mu - S_t < 0"}</K> → terme <strong>négatif</strong> → prix tiré vers le bas
            <br />
            • Si <K>{"S_t < \\mu"}</K>, alors <K>{"\\mu - S_t > 0"}</K> → terme <strong>positif</strong> → prix tiré vers le haut
            <br />
            • Plus l'écart <K>{"|S_t - \\mu|"}</K> est grand, plus la force est intense
            <br /><br />
            <strong style={{ color: T.text }}>Exemple numérique :</strong> avec <K>{"\\kappa = 1.5"}</K>, <K>{"\\mu = 40"}</K>, <K>{"S_t = 55"}</K> €/MWh :
            <K display>{"\\kappa(\\mu - S_t) = 1.5 \\times (40 - 55) = 1.5 \\times (-15) = -22.5 \\text{ €/MWh/an}"}</K>
            Le prix est 15 € au-dessus de l'équilibre → la force de rappel est de −22.5 €/an, soit
            environ −1.9 €/mois. Sans choc aléatoire, le prix descendrait vers ~53 € en un mois.
          </div>
        </div>

        <div style={{ background: `${T.a5}0d`, border: `1px solid ${T.a5}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🎲 σ · dWₜ — Le choc aléatoire</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            C'est la composante <strong>stochastique</strong> : chaque instant, le prix reçoit un "choc"
            aléatoire d'amplitude proportionnelle à σ. <K>{"dW_t"}</K> est un bruit blanc gaussien :
            en moyenne zéro, mais parfois très positif (pic de demande, rupture de pipeline) ou très
            négatif (hiver doux, afflux de GNL — Gaz Naturel Liquéfié).
            <br /><br />
            <strong style={{ color: T.text }}>Exemple numérique :</strong> avec <K>{"\\sigma = 8"}</K>, sur un jour (<K>{"dt = 1/252"}</K>) :
            <K display>{"\\sigma \\sqrt{dt} = 8 \\times \\sqrt{1/252} = 8 \\times 0.063 \\approx 0.50 \\text{ €/MWh}"}</K>
            L'écart-type du choc journalier est de ~0.50 €/MWh. Un choc à ±2σ (probabilité ~5%)
            représente ±1 €/MWh en un seul jour — un mouvement visible sur les écrans Bloomberg.
          </div>
        </div>

        <div style={{ background: `${T.a4}0d`, border: `1px solid ${T.a4}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: T.a4, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>⚖️ L'équilibre rappel vs bruit — la demi-vie</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            Le processus OU est un <em>tir à la corde</em> entre la force de rappel (déterministe, qui veut
            ramener à μ) et les chocs (aléatoires, qui éloignent de μ). Le paramètre qui résume cet
            équilibre est la <strong>demi-vie</strong> :
            <K display>{"t_{1/2} = \\frac{\\ln 2}{\\kappa}"}</K>
            C'est le temps nécessaire pour que l'écart à μ soit divisé par 2 <em>en l'absence de
            nouveaux chocs</em>.
            <br /><br />
            <strong style={{ color: T.text }}>Exemple numérique :</strong> avec κ = 1.5 an⁻¹ :
            <K display>{"t_{1/2} = \\frac{0.693}{1.5} = 0.462 \\text{ an} \\approx 169 \\text{ jours}"}</K>
            Si le prix est à 55 € (écart de +15 € par rapport à μ = 40), dans ~169 jours l'écart moyen
            sera de +7.5 €, soit un prix de ~47.5 €. Encore 169 jours → ~43.75 €.
          </div>
        </div>

      </div>

      {/* ── 4. Synthèse intermédiaire ──────────────────────── */}
      <div style={{ background: `${ACCENT}18`, border: `2px solid ${ACCENT}55`, borderRadius: 8, padding: '14px 18px', margin: '4px 0 16px' }}>
        <div style={{ color: T.text, fontSize: 13, lineHeight: 1.7, fontStyle: 'italic' }}>
          Le processus OU capture l'essentiel de la dynamique du gaz avec seulement 3 paramètres :
          un prix ancré autour d'un coût fondamental μ, avec des excursions aléatoires dont la durée
          dépend de κ et l'amplitude de σ.
        </div>
      </div>

      {/* ── 5. Propriétés stationnaires ──────────────────────── */}
      <SectionTitle accent={ACCENT}>Propriétés stationnaires du processus OU</SectionTitle>

      <FormulaBox accent={ACCENT} label="Distribution stationnaire (long terme)">
        <K display>{"S_\\infty \\sim \\mathcal{N}\\!\\left(\\mu,\\; \\underbrace{\\frac{\\sigma^2}{2\\kappa}}_{\\text{variance stationnaire}}\\right)"}</K>
      </FormulaBox>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, margin: '12px 0' }}>
        {[
          {
            label: 'Espérance stationnaire',
            formula: '\\mathbb{E}[S_\\infty] = \\mu',
            value: `${mu} €/MWh`, color: T.a4,
            desc: 'En moyenne à long terme, le prix est exactement μ. C\'est la "gravité" du marché.',
          },
          {
            label: 'Écart-type stationnaire',
            formula: '\\sigma_{\\text{stat}} = \\sigma / \\sqrt{2\\kappa}',
            value: `${statStd} €/MWh`, color: T.a5,
            desc: 'L\'amplitude typique des fluctuations autour de μ. Augmenter κ réduit cette amplitude.',
          },
          {
            label: 'Autocorrélation 1 mois',
            formula: '\\text{Corr}(S_t, S_{t+h}) = e^{-\\kappa h}',
            value: `ρ = ${Math.exp(-kappa / 12).toFixed(3)}`, color: ACCENT,
            desc: 'La "mémoire" du prix. Plus κ est grand, plus les prix oublient vite leur passé.',
          },
        ].map(({ label, formula, value, color, desc }) => (
          <div key={label} style={{ background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 8, padding: 12 }}>
            <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{label}</div>
            <K display>{formula}</K>
            <div style={{ color: T.text, fontWeight: 600, fontSize: 13, margin: '6px 0' }}>{value}</div>
            <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* ── 6. Comparaison deux régimes ──────────────────────── */}
      <SectionTitle accent={ACCENT}>Comparaison — deux régimes de marché</SectionTitle>

      <Grid cols={2} gap="16px">
        <div style={{ background: `${T.a4}0d`, border: `1px solid ${T.a4}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: T.a4, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🐌 Marché calme — κ = 0.5, σ = 4</div>
          <table style={tableStyle}>
            <tbody>
              {[
                ['Demi-vie', `${(Math.log(2) / 0.5 * 365).toFixed(0)} jours (~1.4 an)`],
                ['σ stationnaire', `${(4 / Math.sqrt(2 * 0.5)).toFixed(1)} €/MWh`],
                ['Bande ±2σ_stat', `[${(40 - 2 * 4 / Math.sqrt(1)).toFixed(0)}, ${(40 + 2 * 4 / Math.sqrt(1)).toFixed(0)}] €`],
                ['Choc journalier (1σ)', `${(4 / Math.sqrt(252)).toFixed(2)} €/MWh`],
                ['Profil', 'Trajectoires lisses, écarts lents et persistants'],
              ].map(([k, v]) => (
                <tr key={k}><Td accent={T.a4}>{k}</Td><Td>{v}</Td></tr>
              ))}
            </tbody>
          </table>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
            Un marché "hibernant" : les prix bougent peu et lentement. Le stockage a peu de
            valeur extrinsèque — les opportunités d'arbitrage sont rares et faibles.
          </div>
        </div>
        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>⚡ Marché stressé — κ = 3, σ = 18</div>
          <table style={tableStyle}>
            <tbody>
              {[
                ['Demi-vie', `${(Math.log(2) / 3 * 365).toFixed(0)} jours (~2.7 mois)`],
                ['σ stationnaire', `${(18 / Math.sqrt(2 * 3)).toFixed(1)} €/MWh`],
                ['Bande ±2σ_stat', `[${(40 - 2 * 18 / Math.sqrt(6)).toFixed(0)}, ${(40 + 2 * 18 / Math.sqrt(6)).toFixed(0)}] €`],
                ['Choc journalier (1σ)', `${(18 / Math.sqrt(252)).toFixed(2)} €/MWh`],
                ['Profil', 'Pics violents mais retour rapide, "spiky"'],
              ].map(([k, v]) => (
                <tr key={k}><Td accent={ACCENT}>{k}</Td><Td>{v}</Td></tr>
              ))}
            </tbody>
          </table>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
            Un marché en ébullition : excursions violentes (+30 %, −20 % en quelques semaines)
            mais retour rapide. Énorme valeur extrinsèque — chaque pic est une occasion de soutirer.
          </div>
        </div>
      </Grid>

      {/* ── 7. Simulation interactive ──────────────────────── */}
      <SectionTitle accent={ACCENT}>Simulation interactive — trajectoires du processus OU</SectionTitle>

      <Grid cols={4} gap="12px">
        <Slider label="κ — vitesse de retour à la moyenne (an⁻¹)" value={kappa} min={0.3} max={5} step={0.1} onChange={setKappa} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="μ — prix moyen long terme (€/MWh)" value={mu} min={20} max={80} step={1} onChange={setMu} accent={ACCENT} format={v => `${v}`} />
        <Slider label="σ — volatilité instantanée (€/MWh/√an)" value={sigma} min={1} max={25} step={0.5} onChange={setSigma} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="S₀ — prix initial du gaz (€/MWh)" value={s0} min={10} max={80} step={1} onChange={setS0} accent={ACCENT} format={v => `${v}`} />
      </Grid>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
        <InfoChip label="Demi-vie" value={halfLife} unit="jours" accent={ACCENT} />
        <InfoChip label="σ_stat = σ/√(2κ)" value={statStd} unit="€/MWh" accent={T.a5} />
        <InfoChip label="Bande ±2σ_stat" value={`[${(mu - 2 * parseFloat(statStd)).toFixed(0)}, ${(mu + 2 * parseFloat(statStd)).toFixed(0)}]`} unit="€" accent={T.muted} />
        <InfoChip label="Choc journalier (1σ)" value={(sigma / Math.sqrt(252)).toFixed(2)} unit="€/MWh" accent={T.a4} />
        <button onClick={() => setSeed(s => s + 1)} style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, borderRadius: 6, padding: '4px 12px', color: ACCENT, fontSize: 11, cursor: 'pointer' }}>
          🔄 Nouvelles trajectoires
        </button>
      </div>

      <ChartWrapper title="3 trajectoires du prix du gaz — Processus OU" accent={ACCENT} height={260}>
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

      {/* Clés de lecture */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0 12px' }}>
        {[
          { icon: '🟢', text: <>La <strong>ligne verte pointillée μ</strong> = prix d'équilibre. Les trajectoires y reviennent toujours — c'est la mean-reversion. Augmenter κ rend ce retour plus rapide.</> },
          { icon: '📏', text: <>Les <strong>pointillés gris ±2σ<sub>stat</sub></strong> = bande à 95 %. Le prix oscille principalement dans cet intervalle. ↑ σ élargit la bande ; ↑ κ la rétrécit (car σ<sub>stat</sub> = σ/√(2κ)).</> },
          { icon: '⚡', text: <>La <strong>demi-vie</strong> (InfoChip) = temps pour que l'écart à μ soit divisé par 2. Si S₀ = 55 et μ = 40, après une demi-vie le prix moyen sera ~47.5 €.</> },
          { icon: '🔀', text: <>Cliquer <strong>"Nouvelles trajectoires"</strong> génère de nouveaux tirages. Mêmes paramètres, résultats différents — c'est la nature stochastique. Le "cône" de dispersion reste le même.</> },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
            <span style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* ── 8. Seconde analogie ──────────────────────── */}
      <IntuitionBlock emoji="🎣" title="Analogie du bouchon de pêche" accent={ACCENT}>
        Le prix du gaz est comme un bouchon de pêche sur une rivière. Le courant (<K>{"\\kappa"}</K>) le ramène
        vers le centre de la rivière (<K>{"\\mu"}</K>), mais le vent et les remous (<K>{"\\sigma"}</K>) le
        poussent à gauche et à droite. Un courant fort (κ élevé) empêche le bouchon de dériver loin,
        même si le vent souffle fort. Un courant faible (κ bas) le laisse s'éloigner — il finit par
        revenir, mais lentement. Pour le stockage : un marché à forte mean-reversion (κ ~3-5) voit
        des pics intenses mais brefs — parfaits pour un stockage rapide qui soutire au moment du pic.
      </IntuitionBlock>

      {/* ── 9. Discrétisation ──────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Discrétisation en chaîne de Markov</SectionTitle>

      <IntuitionBlock emoji="🔢" title="Du continu au discret — pourquoi ?" accent={ACCENT}>
        L'équation OU est définie en temps continu — le prix change à chaque microseconde.
        L'algorithme de Bellman travaille en temps discret (pas mensuels). Il faut donc
        <strong> discrétiser</strong> le processus, c'est-à-dire transformer la loi continue en une
        <strong> matrice de transition </strong> <K>{"\\Pi"}</K> qui dit : "si le prix est à 40 € ce mois-ci,
        quelle est la probabilité qu'il soit à 35, 40, 45 € le mois prochain ?"
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Solution exacte discrète du processus OU (pas Δt)">
        <K display>{"S_{t+\\Delta t} = \\underbrace{S_t \\cdot e^{-\\kappa \\Delta t}}_{\\text{atténuation du prix actuel}} + \\underbrace{\\mu(1 - e^{-\\kappa \\Delta t})}_{\\text{attraction vers }\\mu} + \\underbrace{\\sigma_{\\Delta t} \\cdot \\varepsilon}_{\\text{choc sur la période}} \\qquad \\varepsilon \\sim \\mathcal{N}(0,1)"}</K>
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Volatilité conditionnelle sur un pas Δt">
        <K display>{"\\sigma_{\\Delta t} = \\sigma\\sqrt{\\frac{1 - e^{-2\\kappa\\Delta t}}{2\\kappa}}"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6, lineHeight: 1.7 }}>
          Ce n'est <strong>pas</strong> simplement <K>{"\\sigma\\sqrt{\\Delta t}"}</K> (comme pour un mouvement
          brownien géométrique). La mean-reversion "absorbe" une partie de la volatilité sur la
          période — ce qui réduit σ<sub>Δt</sub> par rapport au cas sans rappel.
        </div>
      </FormulaBox>

      {/* ── 10. Étapes de discrétisation ──────────────────── */}
      <SectionTitle accent={ACCENT}>Algorithme de discrétisation en 3 étapes</SectionTitle>

      <Step num={1} accent={ACCENT}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><strong>Construire la grille de prix</strong></div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75 }}>
            Choisir N<sub>S</sub> nœuds régulièrement espacés dans l'intervalle
            <K>{"[\\mu - 3\\sigma_{\\text{stat}},\\; \\mu + 3\\sigma_{\\text{stat}}]"}</K>.
            Cette bande couvre 99.7 % de la distribution stationnaire.
          </div>
          <FormulaBox accent={ACCENT}>
            <K display>{"s_j = \\mu - 3\\sigma_{\\text{stat}} + j \\cdot \\frac{6\\sigma_{\\text{stat}}}{N_S - 1}, \\quad j = 0, \\ldots, N_S - 1"}</K>
          </FormulaBox>
          <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>
            <strong>Exemple :</strong> avec μ = {mu}, σ<sub>stat</sub> = {statStd} → grille
            de {(mu - 3 * parseFloat(statStd)).toFixed(0)} à {(mu + 3 * parseFloat(statStd)).toFixed(0)} €,
            soit un pas de ~{(6 * parseFloat(statStd) / 11).toFixed(1)} € entre nœuds (pour N<sub>S</sub> = 12).
          </div>
        </div>
      </Step>

      <Step num={2} accent={ACCENT}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><strong>Calculer l'espérance conditionnelle pour chaque nœud</strong></div>
          <FormulaBox accent={ACCENT}>
            <K display>{"\\bar{s}_j = s_j \\cdot e^{-\\kappa\\Delta t} + \\mu(1-e^{-\\kappa\\Delta t})"}</K>
          </FormulaBox>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75 }}>
            Pour chaque prix de départ <K>{"s_j"}</K>, le prix espéré au pas suivant —
            la composante déterministe de la transition.
            <br />
            <strong>Exemple :</strong> depuis <K>{"s_j = 55"}</K> € avec κ = {kappa}, Δt = 1/12 :
            <K display>{`\\bar{s}_j = 55 \\times ${Math.exp(-kappa / 12).toFixed(4)} + 40 \\times ${(1 - Math.exp(-kappa / 12)).toFixed(4)} \\approx ${(55 * Math.exp(-kappa / 12) + 40 * (1 - Math.exp(-kappa / 12))).toFixed(1)} \\text{ €}`}</K>
          </div>
        </div>
      </Step>

      <Step num={3} accent={ACCENT}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><strong>Construire la matrice de transition Π</strong></div>
          <FormulaBox accent={ACCENT}>
            <K display>{"\\Pi_{jk} = \\mathbb{P}(S_{t+1} = s_k \\mid S_t = s_j) \\propto \\exp\\!\\left(-\\frac{(s_k - \\bar{s}_j)^2}{2\\sigma_{\\Delta t}^2}\\right)"}</K>
          </FormulaBox>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75 }}>
            Pour chaque ligne j (prix de départ), évaluer la densité gaussienne centrée sur <K>{"\\bar{s}_j"}</K>
            à chaque nœud d'arrivée <K>{"s_k"}</K>, puis normaliser la ligne (somme → 1).
          </div>
        </div>
      </Step>

      {/* Pseudocode */}
      <div style={panelStyle}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Pseudocode — Construction de Π</div>
        <pre style={{ color: T.text, fontSize: 11, lineHeight: 1.9, margin: 0, fontFamily: 'monospace', overflowX: 'auto' }}>
{`  POUR j = 0 à NS-1 :                               // pour chaque prix de départ
      s̄ⱼ ← sⱼ × exp(-κ·Δt) + μ × (1 - exp(-κ·Δt))   // espérance conditionnelle
      POUR k = 0 à NS-1 :                             // pour chaque prix d'arrivée
          Π[j][k] ← exp(-(sₖ - s̄ⱼ)² / (2·σ²_Δt))    // noyau gaussien
      Π[j][:] ← Π[j][:] / Σₖ Π[j][k]                 // normalisation → somme = 1`}
        </pre>
      </div>

      {/* Matrice affichée */}
      <SectionTitle accent={ACCENT}>Matrice de transition Π (grille 5×5 illustrative)</SectionTitle>
      <div style={{ overflowX: 'auto', margin: '10px 0' }}>
        <table style={{ ...tableStyle, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <Th>{"S_t \\ S_{t+1}"}</Th>
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
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0 12px' }}>
        {[
          { icon: '🟢', text: <>Les <strong>valeurs vertes</strong> (&gt;30 %) sont les transitions les plus probables — vers les nœuds voisins ou le nœud central μ.</> },
          { icon: '🔶', text: <>Les <strong>valeurs dorées</strong> (10-30 %) sont des transitions possibles mais moins fréquentes — excursions modérées.</> },
          { icon: '↕️', text: <>Chaque ligne somme à 100 %. La diagonale n'est pas forcément dominante à forte mean-reversion : le prix "saute" vers μ même depuis les extrêmes.</> },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
            <span style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* ── 11. OU vs GBM ──────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Pourquoi OU et pas un Mouvement Brownien Géométrique (GBM) ?</SectionTitle>

      <table style={tableStyle}>
        <thead>
          <tr><Th>Caractéristique</Th><Th>OU (Ornstein-Uhlenbeck)</Th><Th>GBM (Mouvement Brownien Géométrique)</Th></tr>
        </thead>
        <tbody>
          {[
            ['Retour à la moyenne', '✅ Oui — force de rappel κ(μ − S)', '❌ Non — dérive constante μ·S·dt'],
            ['Distribution stationnaire', '✅ Normale autour de μ', '❌ Diverge (variance → ∞)'],
            ['Prix négatifs', '⚠️ Possibles (rares si μ ≫ σ)', '❌ Impossibles (log-normal ≥ 0)'],
            ['Vol. proportionnelle au prix', '❌ Non — σ absolu (€/MWh)', '✅ Oui — σ relatif (%)'],
            ['Adapté pour…', 'Gaz, électricité, commodités', 'Actions, indices boursiers'],
            ['Utilisé pour le stockage ?', '✅ Standard industrie', '❌ Inadapté (pas de mean-reversion)'],
          ].map(([carac, ou, gbm]) => (
            <tr key={carac}><Td accent={ACCENT}>{carac}</Td><Td accent={T.a4}>{ou}</Td><Td accent={T.muted}>{gbm}</Td></tr>
          ))}
        </tbody>
      </table>

      <div style={{ background: `${T.a5}18`, border: `2px solid ${T.a5}55`, borderRadius: 8, padding: '14px 18px', margin: '12px 0' }}>
        <div style={{ color: T.text, fontSize: 13, lineHeight: 1.7, fontStyle: 'italic' }}>
          Le choix du modèle de prix affecte directement la valeur du stockage : un GBM surestimerait
          la valeur extrinsèque (pas de retour à la moyenne → les pics durent plus longtemps).
          L'OU est le choix standard pour les commodités avec ancrage fondamental.
        </div>
      </div>

      {/* ── 12. Calibration ──────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Calibration — estimer κ, μ, σ sur des données réelles</SectionTitle>

      <Step num={1} accent={ACCENT}>
        <div>
          <strong>Estimer μ — moyenne historique des prix</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            Prendre la moyenne simple des N observations :
            <K>{"\\hat{\\mu} = \\frac{1}{N}\\sum_{i=1}^{N} S_i"}</K>.
            Sur 3-5 ans de données TTF (<em>Title Transfer Facility</em> — hub européen de référence
            pour le gaz naturel), cela donne une estimation stable.
          </div>
        </div>
      </Step>

      <Step num={2} accent={ACCENT}>
        <div>
          <strong>Estimer κ — autocorrélation à 1 pas</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            Mesurer la corrélation entre <K>{"S_t"}</K> et <K>{"S_{t+1}"}</K>, puis inverser :
            <K display>{"\\hat{\\kappa} = -\\frac{\\ln\\bigl(\\text{Corr}(S_t, S_{t+1})\\bigr)}{\\Delta t}"}</K>
            Alternative : régresser <K>{"S_{t+1} - S_t"}</K> sur <K>{"S_t"}</K> — le coefficient
            de pente donne directement <K>{"\\hat{\\kappa}"}</K>.
          </div>
        </div>
      </Step>

      <Step num={3} accent={ACCENT}>
        <div>
          <strong>Estimer σ — volatilité des résidus</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            Après avoir retiré la composante déterministe <K>{"\\kappa(\\mu - S_t)\\Delta t"}</K>,
            l'écart-type des résidus donne <K>{"\\hat{\\sigma}_{\\Delta t}"}</K>. On en déduit :
            <K display>{"\\hat{\\sigma} = \\hat{\\sigma}_{\\Delta t} \\cdot \\sqrt{\\frac{2\\hat{\\kappa}}{1 - e^{-2\\hat{\\kappa}\\Delta t}}}"}</K>
          </div>
        </div>
      </Step>

      {/* ── 13. Exercice ──────────────────────────────── */}
      <Accordion title="Exercice — Calibrer κ par la méthode des moments" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.muted, fontSize: 13 }}>
          On observe 24 prix mensuels du gaz TTF. La corrélation entre <K>{"S_t"}</K> et <K>{"S_{t+1}"}</K>
          vaut 0.72. L'écart-type empirique des prix est de 5.5 €/MWh.
          Estimer <K>{"\\kappa"}</K>, la demi-vie du processus et <K>{"\\sigma"}</K>.
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Corrélation OU" ruleDetail="corr = e^{-κΔt}" accent={ACCENT}>
            Pour un processus OU, la corrélation entre deux observations séparées de Δt est exactement
            <K>{"e^{-\\kappa\\Delta t}"}</K>.
            <br />
            <K>{"\\text{corr}(S_t, S_{t+1}) = e^{-\\kappa \\Delta t} \\Rightarrow e^{-\\kappa/12} = 0.72"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Résoudre κ" ruleDetail="κ = −ln(corr)/Δt" accent={ACCENT}>
            On passe au logarithme :
            <K display>{"\\kappa = -\\frac{\\ln(0.72)}{1/12} = -12 \\times (-0.329) \\approx 3.94 \\text{ an}^{-1}"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Demi-vie" ruleDetail="t₁/₂ = ln(2)/κ" accent={ACCENT}>
            <K display>{"t_{1/2} = \\frac{\\ln 2}{\\kappa} = \\frac{0.693}{3.94} \\approx 0.176 \\text{ an} \\approx 64 \\text{ jours}"}</K>
            Le marché TTF "oublie" la moitié d'un choc en ~2 mois — mean-reversion forte.
          </DemoStep>
          <DemoStep num={4} rule="Déduire σ" ruleDetail="σ_stat = σ/√(2κ)" accent={ACCENT}>
            On mesure σ<sub>stat</sub> = 5.5 €/MWh empiriquement, donc :
            <K display>{"\\sigma = \\sigma_{\\text{stat}} \\times \\sqrt{2\\kappa} = 5.5 \\times \\sqrt{2 \\times 3.94} = 5.5 \\times 2.81 \\approx 15.4 \\text{ €/MWh/}\\sqrt{\\text{an}}"}</K>
            Soit un choc journalier typique de <K>{"15.4 / \\sqrt{252} \\approx 0.97"}</K> €/MWh — cohérent avec le TTF.
          </DemoStep>
        </Demonstration>
      </Accordion>

      {/* ── 14. Récap ──────────────────────────────── */}
      <div style={{ background: `${ACCENT}18`, border: `2px solid ${ACCENT}55`, borderRadius: 8, padding: '16px 20px', margin: '16px 0 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>À retenir</div>
        <div style={{ color: T.text, fontSize: 12, lineHeight: 1.8 }}>
          {[
            'Le processus OU modélise le prix du gaz avec 3 paramètres : κ (vitesse de retour), μ (équilibre), σ (volatilité).',
            'La demi-vie t₁/₂ = ln(2)/κ résume la "mémoire" du marché — typiquement 2-6 mois sur le TTF.',
            'La discrétisation en matrice de transition Π est le pont entre modèle continu et algorithme de Bellman.',
            'Le choix OU (plutôt que GBM) est fondamental : le retour à la moyenne est une propriété physique des commodités.',
            'La calibration utilise l\'autocorrélation (→ κ) et la volatilité résiduelle (→ σ).',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ color: ACCENT, fontWeight: 700, fontSize: 12 }}>•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
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

  const intrinsic = useMemo(() => {
    return runIntrinsicDP({ ...dpParams, spread })
  }, [spread])

  const stochastic = useMemo(() => {
    return runBellmanDP({ ...dpParams, NS: 10, kappa, sigma })
  }, [kappa, sigma])

  const iMid = 6
  const jMid = 5

  const viVal = intrinsic.V[0] ? linInterp(intrinsic.vGrid, intrinsic.V[0], 50) : 0
  const vstochVal = stochastic.V[0] ? stochastic.V[0][iMid][jMid] : 0
  const VE = Math.max(0, vstochVal - viVal)
  const ratio = vstochVal > 0.01 ? (VE / vstochVal * 100).toFixed(1) : '—'

  const profileData = intrinsic.injProfile.map((u, t) => ({
    mois: MONTHS[t % 12],
    action: +u.toFixed(2),
    prix: +intrinsic.fwd[t].toFixed(1),
  }))

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

      {/* ── 1. Intuition ─────────────────────────────────── */}
      <IntuitionBlock emoji="💡" title="La décomposition fondamentale V₀ = VI + VE" accent={ACCENT}>
        <strong>Analogie de l'assurance :</strong> imagine que tu possèdes une maison (= le stockage)
        dans une région parfois inondée. La maison vaut un loyer certain si tout se passe bien
        — c'est la <strong>Valeur Intrinsèque (VI)</strong>.
        Mais en plus, tu as implicitement une "assurance gratuite" : si une opportunité se présente
        (prix qui flambent = inondation → tu peux revendre du gaz cher), tu en profites. Si rien ne se
        passe, tu ne perds rien. Cette assurance gratuite, c'est la <strong>Valeur Extrinsèque (VE)</strong>.
        <br /><br />
        Toute la valeur d'un stockage se décompose en deux parties :
        <br />
        <strong>VI</strong> = ce qu'on gagnerait sur la courbe forward actuelle, <em>si les prix futurs étaient
        parfaitement connus</em> (problème déterministe).
        <br />
        <strong>VE</strong> = la prime d'optionalité — la valeur <em>supplémentaire</em> que l'incertitude
        et la flexibilité ajoutent. C'est ce que l'imprévisibilité nous <em>rapporte</em>, pas ce
        qu'elle nous coûte.
      </IntuitionBlock>

      {/* ── 2. Formule annotée ─────────────────────────── */}
      <SectionTitle accent={ACCENT}>Formule de la décomposition VI / VE</SectionTitle>

      <FormulaBox accent={ACCENT} label="Décomposition VI / VE">
        <K display>{"\\underbrace{\\mathcal{V}_0(V_0, S_0)}_{\\text{Valeur totale (Bellman)}} = \\underbrace{VI}_{\\text{valeur sur courbe forward figée}} + \\underbrace{VE}_{\\text{prime d'optionalité}}"}</K>
        <K display>{"VE = \\mathcal{V}_0^{\\text{stoch}} - \\mathcal{V}_0^{\\text{déterm}} \\geq 0"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['\\mathcal{V}_0', 'Valeur totale du stockage à t = 0, calculée par Bellman (€)'],
        ['VI', 'Valeur Intrinsèque — optimisation déterministe sur la courbe forward (€)'],
        ['VE', 'Valeur Extrinsèque — prime d\'optionalité due à l\'incertitude des prix (€)'],
        ['F(0,T)', 'Prix forward : prix fixé aujourd\'hui pour une livraison à la date T (€/MWh)'],
        ['\\text{stoch}', 'Modèle stochastique complet (Bellman avec incertitude sur S)'],
        ['\\text{déterm}', 'Modèle déterministe (même DP mais avec prix forward connus)'],
      ]} />

      {/* ── 3. Décomposition terme à terme ──────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '16px 0' }}>

        <div style={{ background: `${T.a4}0d`, border: `1px solid ${T.a4}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: T.a4, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📋 Valeur Intrinsèque (VI) — le "business plan"</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            La VI répond à : <em>"Si je connaissais parfaitement les prix futurs (la courbe forward),
            combien pourrais-je gagner en optimisant mes injections et soutirage ?"</em>
            <br /><br />
            C'est le même backward DP que Bellman, mais <strong>sans incertitude</strong> : on remplace
            <K>{"\\mathbb{E}_t[\\mathcal{V}_{t+1}(V', S_{t+1})]"}</K> par
            <K>{"\\mathcal{V}_{t+1}(V', F(0,t+1))"}</K> directement.
            <br /><br />
            <strong style={{ color: T.text }}>Exemple numérique :</strong> spread été/hiver = 15 €, μ = 40 €.
            Prix été = 32.5 €, prix hiver = 47.5 €. Pour 50 GWh :
            <K display>{"VI \\approx 50 \\times (47.5 - 32.5 - 2 \\times c_{\\text{op}}) = 50 \\times 14 = 700 \\text{ € (avant actualisation)}"}</K>
          </div>
        </div>

        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🎯 Valeur Extrinsèque (VE) — la "loterie gratuite"</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            La VE répond à : <em>"Combien vaut le droit de changer d'avis en cours de route ?"</em>
            <br /><br />
            Elle est <strong>toujours ≥ 0</strong> car le stockage est un actif
            <strong> convexe</strong> : quand le prix bouge dans n'importe quelle direction,
            on peut s'adapter — soutirer si le prix monte plus que prévu, injecter s'il baisse.
            <br /><br />
            <strong style={{ color: T.text }}>Propriétés clés :</strong>
            <br />• VE ↑ quand σ ↑ — plus de volatilité = plus d'occasions de profit
            <br />• VE ↑ quand temps restant ↑ — plus d'horizon = plus de chances de voir des pics
            <br />• VE = 0 si σ = 0 — sans incertitude, l'optionalité ne vaut rien
            <br />• VE est convexe en σ — doubler σ fait <em>plus</em> que doubler VE
          </div>
        </div>

      </div>

      <div style={{ background: `${ACCENT}18`, border: `2px solid ${ACCENT}55`, borderRadius: 8, padding: '14px 18px', margin: '4px 0 16px' }}>
        <div style={{ color: T.text, fontSize: 13, lineHeight: 1.7, fontStyle: 'italic' }}>
          La VI est le "salaire fixe" du stockage (couvrable dès J = 0), la VE est le "bonus variable"
          qui dépend des aléas du marché. Un bon opérateur cherche à maximiser les deux.
        </div>
      </div>

      {/* ── 4. Section VI ─────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Valeur Intrinsèque — le plan déterministe</SectionTitle>

      <FormulaBox accent={ACCENT} label="Valeur Intrinsèque — optimisation déterministe">
        <K display>{"VI = \\max_{\\{u_t\\}} \\sum_{t=0}^{T-1} \\underbrace{e^{-rt}}_{\\text{actualisation}} \\cdot \\underbrace{\\pi(u_t,\\, F(0,t))}_{\\text{cashflow au prix forward}} \\quad \\text{s.c. contraintes de stockage}"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          Même backward DP que Bellman mais avec des prix <em>connus</em> — pas d'intégration stochastique.
        </div>
      </FormulaBox>

      <Step num={1} accent={ACCENT}>
        <div>
          <strong>Construire la courbe forward saisonnière</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            Les prix forward suivent un profil saisonnier : <strong>bas en été</strong> (faible demande de
            chauffage, on injecte) et <strong>hauts en hiver</strong> (forte demande, on soutire).
            Le spread été/hiver détermine l'amplitude de ce cycle.
          </div>
        </div>
      </Step>

      <Step num={2} accent={ACCENT}>
        <div>
          <strong>Backward DP déterministe — optimiser sur F(0,t)</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            À chaque pas t et volume V, tester toutes les actions u admissibles. Comme le prix est
            <em> connu</em> (forward), pas besoin de matrice Π — on calcule directement la valeur future
            au prix forward du mois suivant.
          </div>
        </div>
      </Step>

      <Step num={3} accent={ACCENT}>
        <div>
          <strong>Lire le profil optimal inject/soutire et la VI</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            Le résultat est un plan d'injection/soutirage mois par mois et une valeur totale = VI.
            Ce plan est "lockable" immédiatement par des contrats forward.
          </div>
        </div>
      </Step>

      <Slider label="Spread été/hiver — écart saisonnier de prix (€/MWh)" value={spread} min={0} max={40} step={1} onChange={setSpread} accent={ACCENT} format={v => `${v} €`} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
        <InfoChip label="Valeur Intrinsèque VI" value={viVal.toFixed(2)} unit="€" accent={ACCENT} />
        <InfoChip label="Spread été/hiver" value={`${spread} €/MWh`} accent={T.a5} />
        <InfoChip label="Prix été" value={`${(mu - spread / 2).toFixed(0)} €/MWh`} accent={T.a1} />
        <InfoChip label="Prix hiver" value={`${(mu + spread / 2).toFixed(0)} €/MWh`} accent={T.a8} />
      </div>

      <Grid cols={2} gap="16px">
        <ChartWrapper title="Courbe forward saisonnière F(0,T)" accent={ACCENT} height={200}>
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

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0 12px' }}>
        {[
          { icon: '📉', text: <><strong>Graphe gauche</strong> : la courbe forward. Les creux (été) = période d'injection. Les pics (hiver) = période de soutirage. Le spread entre les deux = marge brute.</> },
          { icon: '📊', text: <><strong>Graphe droit</strong> : u &gt; 0 (barres vers le haut) = injection. u &lt; 0 = soutirage. Le profil est symétrique et suit la saisonnalité : on remplit le tank en été, on le vide en hiver.</> },
          { icon: '💰', text: <>La <strong>VI</strong> (InfoChip) augmente linéairement avec le spread : chaque € de spread en plus rapporte directement en marge d'arbitrage saisonnier.</> },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
            <span style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* ── 5. Section VE ─────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Valeur Extrinsèque — la prime d'optionalité</SectionTitle>

      <IntuitionBlock emoji="🎰" title="La VE : pourquoi l'incertitude nous rapporte" accent={ACCENT}>
        Imagine un jeu de pile ou face : si face, tu gagnes 100 € ; si pile, tu perds 0 €
        (tu ne fais rien). L'espérance est de +50 €, et elle est <em>toujours</em> positive,
        quelle que soit la pièce. Le stockage fonctionne pareil : quand le prix monte, tu peux
        soutirer (gagner) ; quand il baisse, tu ne fais rien (pas de perte). L'asymétrie du payoff
        fait que <em>tout</em> mouvement de prix a un espérance de gain positive.
      </IntuitionBlock>

      <Grid cols={3} gap="12px">
        <Slider label="σ — volatilité du spot (€/MWh)" value={sigma} min={1} max={22} step={0.5} onChange={setSigma} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="κ — vitesse de retour à la moyenne (an⁻¹)" value={kappa} min={0.3} max={5} step={0.1} onChange={setKappa} accent={ACCENT} format={v => v.toFixed(1)} />
      </Grid>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
        <InfoChip label="Valeur totale V₀" value={vstochVal.toFixed(2)} unit="€" accent={T.a4} />
        <InfoChip label="VI (déterministe)" value={viVal.toFixed(2)} unit="€" accent={T.a5} />
        <InfoChip label="VE (optionalité)" value={VE.toFixed(2)} unit="€" accent={ACCENT} />
        <InfoChip label="Ratio VE / V₀" value={`${ratio}%`} accent={VE > viVal * 0.1 ? ACCENT : T.muted} />
      </div>

      <ChartWrapper title="VE en fonction de σ — la VE croît et accélère avec la volatilité" accent={ACCENT} height={200}>
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

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0 12px' }}>
        {[
          { icon: '📈', text: <>La courbe est <strong>croissante et convexe</strong> : doubler σ fait plus que doubler la VE. Le stockage bénéficie des mouvements de prix dans les deux sens (asymétrie de payoff).</> },
          { icon: '📍', text: <>Si <K>{"\\sigma = 0"}</K>, la VE est nulle — sans incertitude, la valeur se réduit à la VI. <strong>L'optionalité ne vaut rien quand l'avenir est certain.</strong></> },
          { icon: '⚡', text: <>↑ κ <strong>réduit</strong> la VE à σ fixé — les pics sont plus brefs et moins extrêmes. Mais κ élevé + σ élevé peut donner des pics violents et fréquents → VE quand même significative.</> },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
            <span style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* ── 6. Rolling Intrinsic ─────────────────────── */}
      <SectionTitle accent={ACCENT}>Stratégie Rolling Intrinsic — la pratique industrielle</SectionTitle>

      <IntuitionBlock emoji="🔄" title="Comment un fournisseur capture la VE en pratique" accent={ACCENT}>
        La stratégie <strong>Rolling Intrinsic</strong> est la référence des trading desks gaz en Europe.
        Elle sépare proprement la valeur certaine (VI, couverte dès le départ) de la valeur optionnelle
        (VE, capturée progressivement par des reoptimisations).
        <br /><br />
        <em>Delta-neutre</em> = position dont la valeur ne change pas quand le prix spot bouge de 1 €
        (obtenu en vendant des forwards en quantité = Δ).
        <br /><em>P&amp;L</em> = Profit &amp; Loss (gains et pertes réalisés).
      </IntuitionBlock>

      <Step num={1} accent={ACCENT}>
        <div>
          <strong>J = 0 — Locker la VI initiale</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            Calculer la VI sur la courbe forward du jour. Vendre en forward pour "locker" cette VI.
            La position est maintenant delta-neutre sur la composante intrinsèque.
            <br />
            <strong>Exemple :</strong> VI = 2 M€ → vendre le profil forward inject/soutire correspondant.
          </div>
        </div>
      </Step>

      <Step num={2} accent={ACCENT}>
        <div>
          <strong>J = 15, 30, … — Reoptimiser périodiquement</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            La courbe forward a bougé (météo, géopolitique, offre/demande). Recalculer la VI sur la
            <em> nouvelle</em> courbe. Si la nouvelle VI &gt; ancienne VI → ajuster la position forward →
            "locker" le gain supplémentaire.
            <br />
            <strong>Exemple :</strong> hiver anticipé plus froid → spread ↑ → nouvelle VI = 2.4 M€ →
            VE capturée cette période = +0.4 M€.
          </div>
        </div>
      </Step>

      <Step num={3} accent={ACCENT}>
        <div>
          <strong>Échéance — exécution physique</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            Exécuter les injections/soutirages selon le dernier plan optimisé.
            Le P&amp;L total = VI initiale lockée + somme des VE capturées − coûts opérationnels.
          </div>
        </div>
      </Step>

      {/* Pseudocode Rolling Intrinsic */}
      <div style={panelStyle}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Pseudocode — Rolling Intrinsic</div>
        <pre style={{ color: T.text, fontSize: 11, lineHeight: 1.9, margin: 0, fontFamily: 'monospace', overflowX: 'auto' }}>
{`  VI_lockée ← Calculer_VI(courbe_forward_J0)
  position_forward ← Vendre_profil(VI_lockée)

  POUR chaque date de reoptimisation J :
      nouvelle_VI ← Calculer_VI(courbe_forward_J)
      SI nouvelle_VI > VI_lockée :
          VE_capturée += (nouvelle_VI - VI_lockée)
          Ajuster position_forward → nouvelle_VI
          VI_lockée ← nouvelle_VI

  P&L_total = VI_lockée + VE_capturée - coûts_opérationnels`}
        </pre>
      </div>

      {/* P&L Attribution */}
      <SectionTitle accent={ACCENT}>Attribution de P&amp;L</SectionTitle>
      <table style={tableStyle}>
        <thead>
          <tr><Th>Composante P&amp;L</Th><Th>Source</Th><Th>Caractéristiques</Th></tr>
        </thead>
        <tbody>
          {[
            ['P&L Intrinsèque', 'Gain/perte sur les forwards vendus à J = 0', 'Quasi-certain, couvert dès le départ'],
            ['P&L Extrinsèque', 'Reoptimisations successives au fil des jours', 'Variable, dépend de la volatilité réalisée'],
            ['P&L Opérationnel', 'Coûts réels injection/soutirage vs modèle', 'Friction, toujours négatif (coûts > 0)'],
            ['P&L Total', 'VI + VE − coûts', 'Objectif : maximiser sur la durée de vie'],
          ].map(([comp, source, carac]) => (
            <tr key={comp}>
              <Td accent={ACCENT}>{comp}</Td>
              <Td>{source}</Td>
              <Td accent={T.muted}>{carac}</Td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Comparaison profils fournisseur */}
      <SectionTitle accent={ACCENT}>Profil fournisseur : qui valorise quoi ?</SectionTitle>
      <table style={tableStyle}>
        <thead>
          <tr><Th>Profil</Th><Th>Demande clients</Th><Th>Priorité VI/VE</Th><Th>Stratégie stockage</Th></tr>
        </thead>
        <tbody>
          {[
            ['Résidentiel / collectivités', 'Prévisible, très saisonnière', 'VI dominante', 'Couvrir le pic hivernal, peu de reoptimisation'],
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

      <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6, margin: '8px 0' }}>
        <em>Gamma long</em> = la convexité de la valeur du stockage en fonction du prix bénéficie de tout mouvement de prix, dans les deux directions. Voir l'onglet Delta &amp; Couverture pour les détails.
      </div>

      {/* ── 7. Exercice ──────────────────────────────── */}
      <Accordion title="Exercice — Comparer VI et VE selon le scénario météo" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.muted, fontSize: 13 }}>
          Le marché intègre un hiver "normal" (spread = 15 €/MWh). Deux scénarios se matérialisent :
          A) Hiver très froid → spread réel = 28 €/MWh.
          B) Hiver doux → spread réel = 5 €/MWh.
          Pour un fournisseur avec VI lockée à spread = 15 €/MWh : décomposer le P&amp;L dans chaque cas.
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Setup" ruleDetail="VI lockée sur la courbe forward initiale" accent={ACCENT}>
            Le fournisseur a calculé VI sur un spread de 15 €/MWh et a vendu les forwards correspondants.
            Prix été = 32.5 €, prix hiver = 47.5 €. VI lockée ≈ 2 M€ (par exemple).
          </DemoStep>
          <DemoStep num={2} rule="Scénario A (hiver froid)" ruleDetail="spread réalisé > forward" accent={ACCENT}>
            Le spread réel monte à 28 €/MWh. La nouvelle VI sur la courbe à jour = ~3.7 M€.
            En rolling intrinsic, la reoptimisation capture cette hausse :
            VE capturée = 3.7 − 2 = <strong>+1.7 M€</strong>.
            <br />P&amp;L total = VI (2 M€) + VE (1.7 M€) − coûts ≈ <strong>+3.5 M€</strong>.
          </DemoStep>
          <DemoStep num={3} rule="Scénario B (hiver doux)" ruleDetail="spread réalisé < forward" accent={ACCENT}>
            Le spread tombe à 5 €/MWh. Mais la VI a été <em>lockée</em> à 15 €/MWh via les forwards !
            La baisse du spread ne se matérialise pas en perte (les forwards protègent).
            VE ≈ 0 (pas d'opportunité supplémentaire).
            <br />P&amp;L total ≈ VI lockée (2 M€) − coûts ≈ <strong>+1.8 M€</strong>.
          </DemoStep>
          <DemoStep num={4} rule="Conclusion" ruleDetail="asymétrie = convexité" accent={ACCENT}>
            Dans les deux cas, P&amp;L ≥ VI initiale. C'est l'<strong>asymétrie fondamentale</strong> :
            le stockage participe aux bonnes surprises mais est protégé contre les mauvaises
            (via la couverture forward initiale). C'est exactement le profil de gain d'une option.
          </DemoStep>
        </Demonstration>
      </Accordion>

      {/* ── 8. Récap ──────────────────────────────── */}
      <div style={{ background: `${ACCENT}18`, border: `2px solid ${ACCENT}55`, borderRadius: 8, padding: '16px 20px', margin: '16px 0 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>À retenir</div>
        <div style={{ color: T.text, fontSize: 12, lineHeight: 1.8 }}>
          {[
            'V₀ = VI + VE : la valeur totale du stockage se décompose en valeur intrinsèque (déterministe) et extrinsèque (optionalité).',
            'La VI se "locke" dès J = 0 par des forwards — c\'est le revenu certain, le "salaire fixe" du stockage.',
            'La VE ≥ 0 toujours — l\'incertitude ne peut qu\'ajouter de la valeur, jamais en retirer.',
            'VE croît de façon convexe avec σ : la volatilité est l\'amie de l\'opérateur de stockage.',
            'Le Rolling Intrinsic capture la VE par des reoptimisations périodiques de la VI.',
            'Profil trader pur → maximiser VE. Profil fournisseur résidentiel → maximiser VI.',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ color: ACCENT, fontWeight: 700, fontSize: 12 }}>•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
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

  const jMid = 7
  const deltaVData = result.vGrid.map((v, i) => {
    const jPlus = Math.min(jMid + 1, result.sGrid.length - 1)
    const jMinus = Math.max(jMid - 1, 0)
    const dS = result.sGrid[jPlus] - result.sGrid[jMinus]
    const delta = (result.V[0][i][jPlus] - result.V[0][i][jMinus]) / (dS + 1e-10)
    return { volume: +v.toFixed(0), delta: +delta.toFixed(3) }
  })

  const iMid = 7
  const deltaSData = result.sGrid.map((s, j) => {
    const jPlus = Math.min(j + 1, result.sGrid.length - 1)
    const jMinus = Math.max(j - 1, 0)
    const dS = result.sGrid[jPlus] - result.sGrid[jMinus]
    const delta = (result.V[0][iMid][jPlus] - result.V[0][iMid][jMinus]) / (dS + 1e-10)
    return { prix: +s.toFixed(1), delta: +delta.toFixed(3) }
  })

  const jCurr = result.sGrid.reduce((best, s, j) => Math.abs(s - s0) < Math.abs(result.sGrid[best] - s0) ? j : best, 0)
  const jP = Math.min(jCurr + 1, result.sGrid.length - 1)
  const jM = Math.max(jCurr - 1, 0)
  const iCurr = result.vGrid.reduce((best, v, i) => Math.abs(v - v0) < Math.abs(result.vGrid[best] - v0) ? i : best, 0)
  const dSc = result.sGrid[jP] - result.sGrid[jM]
  const currentDelta = (result.V[0][iCurr][jP] - result.V[0][iCurr][jM]) / (dSc + 1e-10)
  const fwdQty = (currentDelta * 100).toFixed(0)

  const smileData = result.sGrid.map((s, j) => ({
    prix: +s.toFixed(1),
    valeur: +result.V[0][iMid][j].toFixed(2),
    linéaire: +(result.V[0][iMid][jMid] + currentDelta * (s - result.sGrid[jMid])).toFixed(2),
  }))

  // Gamma computation
  const gammaData = result.sGrid.map((s, j) => {
    const jPlus = Math.min(j + 1, result.sGrid.length - 1)
    const jMinus = Math.max(j - 1, 0)
    const dS = (result.sGrid[jPlus] - result.sGrid[jMinus]) / 2
    const d2V = (result.V[0][iMid][jPlus] - 2 * result.V[0][iMid][j] + result.V[0][iMid][jMinus]) / (dS * dS + 1e-10)
    return { prix: +s.toFixed(1), gamma: +d2V.toFixed(4) }
  })

  return (
    <div>

      {/* ── 1. Intuition ─────────────────────────────────── */}
      <IntuitionBlock emoji="📐" title="Le delta : pont entre modèle et salle des marchés" accent={ACCENT}>
        <strong>Analogie du compteur de vitesse :</strong> quand tu conduis, le compteur de vitesse
        te dit "si tu continues 1 seconde de plus, tu auras parcouru X mètres". Le delta fait
        exactement la même chose pour le prix du gaz : <em>"si le prix monte de 1 €, ma valeur
        change de Δ €."</em>
        <br /><br />
        Le delta est à la fois :
        <br />• Un <strong>indicateur de risque</strong> — à quel point suis-je exposé au prix ?
        <br />• Une <strong>recette de couverture</strong> — combien de forwards vendre pour être immunisé ?
        <br />• Un <strong>lien avec Bellman</strong> — il se lit directement dans la grille de valeurs déjà calculée.
      </IntuitionBlock>

      {/* ── 2. Formule annotée ─────────────────────────── */}
      <SectionTitle accent={ACCENT}>Le delta par différences finies</SectionTitle>

      <FormulaBox accent={ACCENT} label="Delta par différences finies">
        <K display>{"\\Delta_t(V, S) \\approx \\frac{\\overbrace{\\mathcal{V}_t(V,\\, S+\\varepsilon)}^{\\text{valeur si prix monte}} - \\overbrace{\\mathcal{V}_t(V,\\, S-\\varepsilon)}^{\\text{valeur si prix baisse}}}{\\underbrace{2\\varepsilon}_{\\text{écart de prix testé}}}"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['\\Delta_t(V, S)', 'Delta = sensibilité de la valeur au prix, à l\'instant t (€ par €/MWh)'],
        ['\\mathcal{V}_t', 'Fonction valeur du stockage, calculée par Bellman (€)'],
        ['\\varepsilon', 'Petit écart de prix pour le calcul numérique (typiquement 1 nœud de grille)'],
        ['V', 'Volume actuellement en stock (GWh)'],
        ['S', 'Prix spot actuel du gaz (€/MWh)'],
      ]} />

      {/* ── 3. Décomposition ──────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '16px 0' }}>

        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📖 Comment lire la formule ?</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            On prend <strong>deux valeurs voisines</strong> dans la grille Bellman (même volume, deux prix
            adjacents) et on divise par l'écart. C'est exactement le calcul d'une dérivée par la
            <strong> méthode des différences finies centrées</strong>.
            <br /><br />
            <strong style={{ color: T.text }}>Exemple numérique :</strong> V = 50 GWh, S = 40 €, ε = 2 €.
            La grille Bellman donne :
            <K display>{"\\mathcal{V}(50,\\,42) = 380\\text{ €}, \\quad \\mathcal{V}(50,\\,38) = 355\\text{ €}"}</K>
            <K display>{"\\Delta \\approx \\frac{380 - 355}{2 \\times 2} = \\frac{25}{4} = 6.25 \\text{ € par €/MWh}"}</K>
            <em>Interprétation :</em> si le prix du gaz monte de 1 €/MWh, la valeur du stockage
            augmente d'environ 6.25 €.
          </div>
        </div>

        <div style={{ background: `${T.a5}0d`, border: `1px solid ${T.a5}44`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🛡️ Du delta à la couverture</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            Le delta indique <strong>combien de forwards vendre</strong> pour être immunisé :
            <K display>{"\\text{Forwards à vendre} = \\Delta \\times \\text{capacité du stockage}"}</K>
            <strong>Exemple :</strong> Δ = 6.25, capacité = 100 GWh → vendre 625 GWh en forward.
            Si le prix monte de 1 € : gain stockage ≈ +625 €, perte forward = −625 €. Net ≈ 0 €.
            <br /><br />
            C'est le <strong>delta hedging</strong> — la même technique que pour couvrir une option
            financière, mais appliquée à un actif physique.
          </div>
        </div>

      </div>

      {/* ── 4. Formule de récurrence ──────────────────── */}
      <SectionTitle accent={ACCENT}>Récurrence du delta (théorème de l'enveloppe)</SectionTitle>

      <FormulaBox accent={ACCENT} label="Récurrence du delta">
        <K display>{"\\Delta_t(V, S) = \\underbrace{-u^* \\cdot \\Delta t}_{\\text{sensibilité immédiate}} + \\underbrace{e^{-r\\Delta t} \\cdot e^{-\\kappa\\Delta t}}_{\\text{actualisation × persistance}} \\cdot \\underbrace{\\mathbb{E}_t[\\Delta_{t+1}(V', S_{t+1})]}_{\\text{delta futur espéré}}"}</K>
      </FormulaBox>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, margin: '12px 0' }}>
        {[
          {
            label: '−u* · Δt', color: T.a4,
            desc: 'Le soutirage immédiat crée une exposition directe au prix. Si u* = −10 (soutire), vendre 10·Δt GWh → delta positif.',
          },
          {
            label: 'e^{−κΔt}', color: T.a5,
            desc: "La persistance du choc de prix. Un choc est atténué par la mean-reversion. Plus κ est grand, plus le choc \"s'oublie\" vite.",
          },
          {
            label: '𝔼[Δₜ₊₁]', color: ACCENT,
            desc: 'Le delta futur espéré — contribution des décisions futures. Se propage récursivement depuis l\'échéance.',
          },
        ].map(({ label, color, desc }) => (
          <div key={label} style={{ background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 8, padding: 12 }}>
            <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 6 }}><K>{label}</K></div>
            <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div style={{ background: `${ACCENT}18`, border: `2px solid ${ACCENT}55`, borderRadius: 8, padding: '14px 18px', margin: '4px 0 16px' }}>
        <div style={{ color: T.text, fontSize: 13, lineHeight: 1.7, fontStyle: 'italic' }}>
          Le delta est la somme d'un effet immédiat (action u* de ce mois) et d'effets futurs
          (propagation récursive), le tout pondéré par la persistance du choc (mean-reversion).
        </div>
      </div>

      {/* ── 5. Simulation interactive ──────────────────── */}
      <SectionTitle accent={ACCENT}>Explorer le delta interactivement</SectionTitle>

      <Grid cols={3} gap="12px">
        <Slider label="κ — vitesse de retour à la moyenne (an⁻¹)" value={kappa} min={0.5} max={5} step={0.1} onChange={setKappa} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="μ — prix moyen long terme (€/MWh)" value={mu} min={20} max={70} step={1} onChange={setMu} accent={ACCENT} format={v => `${v}`} />
        <Slider label="σ — volatilité du spot (€/MWh)" value={sigma} min={1} max={20} step={0.5} onChange={setSigma} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="V — volume actuel dans le tank (GWh)" value={v0} min={0} max={100} step={5} onChange={setV0} accent={ACCENT} format={v => `${v}`} />
        <Slider label="S — prix spot actuel (€/MWh)" value={s0} min={15} max={65} step={1} onChange={setS0} accent={ACCENT} format={v => `${v}`} />
      </Grid>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="Δ(V, S) courant" value={currentDelta.toFixed(3)} accent={ACCENT} />
        <InfoChip label="Forwards à vendre (100 GWh cap.)" value={`${fwdQty} GWh`} accent={T.a4} />
        <InfoChip label="Action optimale u*" value={result.policy[0][iCurr][jCurr] > 0.5 ? 'INJECTION' : result.policy[0][iCurr][jCurr] < -0.5 ? 'SOUTIRAGE' : 'ATTENTE'} accent={result.policy[0][iCurr][jCurr] > 0.5 ? T.a1 : result.policy[0][iCurr][jCurr] < -0.5 ? T.a4 : T.muted} />
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

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0 14px' }}>
        {[
          { icon: '🟥', text: <><strong>Graphe gauche Δ(V)</strong> : le delta décroît quand le tank se remplit — un stock plein est moins sensible au prix (il va soutirer quoi qu'il arrive). Stock vide → delta maximal (beaucoup de flexibilité restante).</> },
          { icon: '🟨', text: <><strong>Graphe droit Δ(S)</strong> : le delta augmente avec le prix — plus le prix est élevé, plus le stockage "veut" soutirer, donc plus il est exposé au marché.</> },
          { icon: '📊', text: <><strong>Forwards à vendre</strong> (InfoChip vert) = Δ × capacité — c'est la couverture instantanée pour neutraliser le risque prix que porte le stockage.</> },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
            <span style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* ── 6. Seconde analogie ──────────────────────── */}
      <IntuitionBlock emoji="🧭" title="Analogie de la boussole financière" accent={ACCENT}>
        Le delta est comme une boussole qui indique en permanence "vers quel montant le vent du
        marché pousse ta valeur". Si Δ &gt; 0, tu es exposé à la hausse (tu gagnes si le prix monte).
        Si Δ &lt; 0, tu es exposé à la baisse. Vendre des forwards en quantité Δ, c'est comme
        <em> tourner ton bateau face au vent</em> pour que la houle ne te fasse plus tanguer —
        tu deviens insensible aux vagues de prix.
      </IntuitionBlock>

      {/* ── 7. Cas particuliers ──────────────────────── */}
      <SectionTitle accent={ACCENT}>Cas particuliers du delta</SectionTitle>
      <table style={tableStyle}>
        <thead>
          <tr><Th>Situation</Th><Th>Delta</Th><Th>Intuition</Th></tr>
        </thead>
        <tbody>
          {[
            ['V = 0, loin de T, prix bas', 'Élevé (≈ 1)', 'Stock vide, prix bas → on va injecter beaucoup. Très sensible au prix futur.'],
            ['V = 0, à l\'échéance T', '= 0', 'Plus de temps pour agir. Un stock vide à T ne vaut rien.'],
            ['V = 0, prix très élevé', 'Faible', 'Stock vide : pas de gaz à soutirer, même à prix élevé.'],
            ['V = V_max, prix élevé', 'Négatif ou faible', 'On va soutirer de toute façon. Position "short" naturelle sur le prix.'],
            ['V intermédiaire, S = μ', 'Modéré', 'Zone d\'incertitude : injecter/attendre/soutirer dépend du spread futur.'],
          ].map(([sit, delta, intuition]) => (
            <tr key={sit}><Td accent={ACCENT}>{sit}</Td><Td accent={T.a5}>{delta}</Td><Td>{intuition}</Td></tr>
          ))}
        </tbody>
      </table>

      {/* ── 8. Convexité / Gamma ──────────────────────── */}
      <SectionTitle accent={ACCENT}>Convexité (Γ) — le stockage comme actif optionnel</SectionTitle>

      <FormulaBox accent={ACCENT} label="Développement de Taylor au 2ᵉ ordre">
        <K display>{"\\mathcal{V}(S + \\delta S) \\approx \\mathcal{V}(S) + \\underbrace{\\Delta}_{\\text{pente}} \\cdot \\delta S + \\frac{1}{2}\\underbrace{\\Gamma}_{\\text{courbure > 0}} \\cdot (\\delta S)^2"}</K>
      </FormulaBox>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '12px 0' }}>
        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}44`, borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Γ &gt; 0 — pourquoi c'est fondamental</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            <K>{"\\Gamma > 0"}</K> signifie que la valeur est <strong>convexe</strong> en S :
            les hausses de prix rapportent <em>plus</em> que ce que la droite tangente (Δ) prédit,
            et les baisses coûtent <em>moins</em>. Résultat : le stockage <strong>bénéficie
            de la volatilité</strong>.
            <br /><br />
            C'est la propriété fondamentale d'une option : l'asymétrie du payoff.
            Le propriétaire du stockage est "long gamma" — il profite de tout mouvement
            de prix, dans les deux directions.
          </div>
        </div>
        <div style={{ background: `${T.a5}0d`, border: `1px solid ${T.a5}44`, borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Le P&amp;L gamma en pratique</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Si le prix bouge de <K>{"\\delta S"}</K> et qu'on est couvert en delta :
            <K display>{"\\text{P\\&L}_{\\text{gamma}} = \\frac{1}{2}\\Gamma \\cdot (\\delta S)^2 \\geq 0"}</K>
            Ce gain est <strong>toujours positif</strong> (carré !). C'est le mécanisme par lequel
            le trading desk capture la VE : chaque mouvement de prix génère un P&amp;L positif
            proportionnel au carré du mouvement.
            <br /><br />
            <strong>Exemple :</strong> Γ = 0.1, δS = 5 € → P&amp;L = ½ × 0.1 × 25 = 1.25 €.
          </div>
        </div>
      </div>

      <Grid cols={2} gap="16px">
        <ChartWrapper title="V(S) — Courbe convexe vs approximation linéaire" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={smileData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="prix" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Prix S (€/MWh)', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -3 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
              <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
              <Line type="monotone" dataKey="valeur" stroke={ACCENT} strokeWidth={2.5} dot={false} name="V(S) convexe" />
              <Line type="monotone" dataKey="linéaire" stroke={T.muted} strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="Δ·(S−S₀) linéaire" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Gamma Γ(S) — courbure de la fonction valeur" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gammaData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="prix" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Prix S (€/MWh)', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -3 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={T.muted} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="gamma" stroke={T.a5} strokeWidth={2.5} dot={false} name="Γ(50, S)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0 12px' }}>
        {[
          { icon: '📈', text: <><strong>Graphe gauche</strong> : la courbe rouge (valeur réelle) est <em>au-dessus</em> de la droite grise (approximation Δ) aux extrêmes. C'est la convexité Γ &gt; 0 : les mouvements de prix rapportent plus que prévu par Δ seul.</> },
          { icon: '🔔', text: <><strong>Graphe droit</strong> : le gamma est maximal autour de S ≈ μ (zone d'incertitude maximale) et diminue aux extrêmes (où la décision est "évidente" : soutirer tout ou injecter tout).</> },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
            <span style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* ── 9. Algorithme de couverture ──────────────── */}
      <SectionTitle accent={ACCENT}>Procédure de delta hedging quotidien</SectionTitle>

      <Step num={1} accent={ACCENT}>
        <div>
          <strong>Observer (V, S) et lire Δ dans la grille Bellman</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            Chaque matin, relever le prix spot S et le niveau du tank V.
            Interpoler dans la fonction valeur pré-calculée pour obtenir Δ(V, S).
          </div>
        </div>
      </Step>

      <Step num={2} accent={ACCENT}>
        <div>
          <strong>Calculer la position forward cible</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            <K>{"\\text{Position cible} = \\Delta(V, S) \\times \\text{capacité}"}</K>.
            Comparer avec la position forward détenue actuellement.
          </div>
        </div>
      </Step>

      <Step num={3} accent={ACCENT}>
        <div>
          <strong>Ajuster — acheter ou vendre la différence en forward</strong>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.75, marginTop: 4 }}>
            Si Δ<sub>nouveau</sub> &gt; Δ<sub>ancien</sub> → acheter des forwards (exposition augmentée).
            Si Δ<sub>nouveau</sub> &lt; Δ<sub>ancien</sub> → vendre des forwards.
            Le coût du rebalancement est typiquement faible (marché forward liquide).
          </div>
        </div>
      </Step>

      <div style={panelStyle}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Pseudocode — Delta Hedging quotidien</div>
        <pre style={{ color: T.text, fontSize: 11, lineHeight: 1.9, margin: 0, fontFamily: 'monospace', overflowX: 'auto' }}>
{`  CHAQUE jour J :
      Observer (V_J, S_J)
      Δ_J ← Lire_grille_Bellman(V_J, S_J, t_J)         // interpolation bilinéaire
      Position_cible ← Δ_J × Capacité
      Déséquilibre ← Position_cible - Position_actuelle
      SI |Déséquilibre| > seuil_minimum :
          Acheter/vendre Déséquilibre en forward
          Position_actuelle ← Position_cible
      P&L_gamma ← ½ × Γ_J × (ΔS_J)²                    // gain de convexité`}
        </pre>
      </div>

      {/* ── 10. Comparaison stockage / option ──────────── */}
      <SectionTitle accent={ACCENT}>Stockage vs option financière</SectionTitle>

      <table style={tableStyle}>
        <thead>
          <tr><Th>Caractéristique</Th><Th>Option financière</Th><Th>Stockage de gaz</Th></tr>
        </thead>
        <tbody>
          {[
            ['Droit sans obligation', 'Acheter au strike K', 'Soutirer quand prix haut'],
            ['Convexité Γ > 0', 'Oui (Black-Scholes)', 'Oui (Bellman DP)'],
            ['Bénéfice de la vol (Vega > 0)', 'Oui', 'Oui (VE augmente avec σ)'],
            ['Couverture delta hedging', 'Sur le sous-jacent spot', 'Sur la courbe forward'],
            ['Exercice', 'Date fixe (europ.) ou tout moment', 'Continu, contraintes de chemin'],
            ['Dépendance de chemin', 'Non (européenne)', 'Oui — chaque décision modifie l\'état'],
          ].map(([carac, option, stockage]) => (
            <tr key={carac}><Td accent={ACCENT}>{carac}</Td><Td>{option}</Td><Td accent={T.a4}>{stockage}</Td></tr>
          ))}
        </tbody>
      </table>

      {/* ── 11. Exercice ──────────────────────────────── */}
      <Accordion title="Exercice — Construire la couverture delta au jour J" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.muted, fontSize: 13 }}>
          Volume : 60 GWh, prix spot : 52 €/MWh (au-dessus de μ = 40), capacité totale : 100 GWh.
          Le modèle Bellman donne Δ = 0.65. Comment couvrir ? Que se passe-t-il le lendemain
          si le prix monte de 5 € ?
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Quantité forward" ruleDetail="Δ × capacité" accent={ACCENT}>
            Vendre <K>{"0.65 \\times 100 = 65"}</K> GWh en forward (livraison 1 à 3 mois selon
            le profil de soutirage attendu). Position delta-neutre.
          </DemoStep>
          <DemoStep num={2} rule="Vérification delta-neutre" ruleDetail="gain + perte = 0" accent={ACCENT}>
            Si S monte de 5 € : gain stockage ≈ +Δ × 5 × 100 = +325 €,
            perte forward = −65 × 5 = −325 €. <strong>Net ≈ 0 €</strong> (couvert).
          </DemoStep>
          <DemoStep num={3} rule="Gain gamma" ruleDetail="½Γ(δS)²" accent={ACCENT}>
            En réalité, Δ a changé pendant le mouvement (convexité). Si Γ = 0.05 :
            <K display>{"\\text{P\\&L}_{\\text{gamma}} = \\tfrac{1}{2} \\times 0.05 \\times 5^2 = 0.625 \\text{ €}"}</K>
            Ce gain de convexité est la <strong>VE réalisée</strong> — il s'accumule au fil des jours.
          </DemoStep>
          <DemoStep num={4} rule="Rebalancement J+1" ruleDetail="nouveau Δ" accent={ACCENT}>
            Le lendemain, V et S ont changé (soutirage effectué, prix monté). Recalculer Δ
            depuis la grille, ajuster la position forward. C'est le <strong>delta hedging dynamique</strong>.
          </DemoStep>
        </Demonstration>
      </Accordion>

      {/* ── 12. Récap ──────────────────────────────── */}
      <div style={{ background: `${ACCENT}18`, border: `2px solid ${ACCENT}55`, borderRadius: 8, padding: '16px 20px', margin: '16px 0 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>À retenir</div>
        <div style={{ color: T.text, fontSize: 12, lineHeight: 1.8 }}>
          {[
            'Le delta Δ = ∂V/∂S se calcule par différences finies sur la grille Bellman — pas besoin de résoudre une nouvelle équation.',
            'Δ donne directement la couverture : vendre Δ × capacité en forward pour être delta-neutre.',
            'Le delta décroît avec le volume (stock plein ≈ obligation de soutirer) et croît avec le prix (prix haut ≈ soutirage imminent).',
            'Γ > 0 (convexité) → le stockage bénéficie de tout mouvement de prix → c\'est une option réelle.',
            'Le P&L gamma = ½Γ(δS)² est le mécanisme par lequel le trading desk capture la VE jour après jour.',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ color: ACCENT, fontWeight: 700, fontSize: 12 }}>•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Onglet 6 : Courbe Forward & Portefeuille ─────────────────────────────────

export function ForwardRiskTab() {
  const [spread, setSpread] = useState(15)
  const [level, setLevel] = useState(40)
  const [tilt, setTilt] = useState(0)

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

  // Simplified delta vector by maturity
  const deltaVector = months.map((m, t) => {
    const seasonal = spread * 0.5 * Math.cos(2 * Math.PI * t / 12 + Math.PI)
    const F = level + seasonal
    const isInjection = F < level
    return {
      mois: m,
      delta: +(isInjection ? 0.3 + 0.4 * (level - F) / (spread / 2 + 0.1) : -0.2 - 0.5 * (F - level) / (spread / 2 + 0.1)).toFixed(2),
    }
  })

  return (
    <div>

      {/* ── 1. Intuition ─────────────────────────────────── */}
      <IntuitionBlock emoji="📈" title="Le vrai sous-jacent : la courbe forward F(t,T)" accent={ACCENT}>
        <strong>Analogie de l'égaliseur audio :</strong> un égaliseur a des curseurs pour chaque
        fréquence (graves, médiums, aigus). La courbe forward, c'est pareil : chaque maturité mensuelle
        (jan, fév, mar…) est un "curseur" de prix indépendant. Quand tu bouges un curseur (le prix
        forward de mars change), ça n'affecte pas forcément les autres. Le stockeur doit surveiller
        et couvrir <em>chaque curseur séparément</em>, pas juste le volume global.
        <br /><br />
        Un opérateur de stockage ne se couvre pas sur le prix spot <K>{"S_t"}</K> — il livre du gaz
        physiquement et ne contrôle pas le spot. Ce qui l'intéresse, c'est la <strong>courbe forward</strong>
        <K>{"F(t,T)"}</K> : le prix auquel le marché accepte <em>aujourd'hui</em> de livrer du gaz
        à la date <K>{"T"}</K> future. C'est la <strong>déformation de cette courbe</strong> qui crée
        ou détruit la valeur du stockage.
      </IntuitionBlock>

      {/* ── 2. Sliders + graphique ──────────────────────── */}
      <SectionTitle accent={ACCENT}>Explorer la courbe forward interactivement</SectionTitle>

      <Grid cols={3} gap="12px">
        <Slider label="μ — niveau moyen de la courbe (€/MWh)" value={level} min={20} max={70} step={1} onChange={setLevel} accent={ACCENT} format={v => `${v}`} />
        <Slider label="Spread — écart été/hiver (€/MWh)" value={spread} min={0} max={40} step={1} onChange={setSpread} accent={ACCENT} format={v => `${v}`} />
        <Slider label="Tilt — pente contango/backwardation (€)" value={tilt} min={-10} max={10} step={0.5} onChange={setTilt} accent={ACCENT} format={v => v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)} />
      </Grid>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0' }}>
        <InfoChip label="VI calculée (V = 50 GWh)" value={`${intrinsicFromSpread} €`} accent={ACCENT} />
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

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0 12px' }}>
        {[
          { icon: '❄️', text: <><strong>Creux = été</strong> (injection) : gaz moins cher, on remplit. <strong>Pic = hiver</strong> (soutirage) : forte demande de chauffage, prix élevés.</> },
          { icon: '💰', text: <>La <strong>VI du stockage</strong> (InfoChip) augmente avec le spread : c'est la différence entre achat estival et vente hivernale, moins les coûts opérationnels.</> },
          { icon: '📀', text: <>Le <strong>Tilt</strong> incline toute la courbe : tilt positif = contango (prix lointains &gt; prix proches), négatif = backwardation (prix proches &gt; lointains).</> },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
            <span style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* ── 3. Formule annotée — Vecteur de deltas ──────── */}
      <SectionTitle accent={ACCENT}>Vecteur de deltas par maturité</SectionTitle>

      <IntuitionBlock emoji="🎯" title="Un delta par point de la courbe, pas un seul delta global" accent={ACCENT}>
        La position de couverture d'un stockage n'est pas un seul forward, mais un <strong>vecteur</strong>
        de positions à chaque maturité. Chaque composante répond à : <em>"si le prix forward de livraison
        en mars monte de 1 €, ma valeur change de combien ?"</em>
        <br /><br />
        Un déplacement <strong>parallèle</strong> de toute la courbe est couvert par le delta global.
        Mais un <strong>changement de pente</strong> (l'hiver se tend, l'été se détend) n'est couvert
        que par ce vecteur complet.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Vecteur de sensibilités forward">
        <K display>{"\\vec{\\Delta} = \\left(\\underbrace{\\frac{\\partial \\mathcal{V}}{\\partial F(0, T_1)}}_{\\text{delta janv.}},\\; \\underbrace{\\frac{\\partial \\mathcal{V}}{\\partial F(0, T_2)}}_{\\text{delta fév.}},\\; \\ldots,\\; \\underbrace{\\frac{\\partial \\mathcal{V}}{\\partial F(0, T_{12})}}_{\\text{delta déc.}}\\right)"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['\\vec{\\Delta}', 'Vecteur de deltas forward — une composante par maturité mensuelle'],
        ['\\partial \\mathcal{V} / \\partial F(0,T_k)', 'Sensibilité de la valeur du stockage au prix forward de maturité T_k (€ par €/MWh)'],
        ['F(0,T_k)', 'Prix forward observé aujourd\'hui pour une livraison au mois k (€/MWh)'],
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '12px 0' }}>
        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}44`, borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Mois d'injection (été) → Δ &gt; 0</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Si le prix forward d'été <em>baisse</em>, on injecte moins cher → valeur du stockage ↑.
            L'opérateur est <strong>long</strong> les forward été (il achète du gaz, donc il bénéficie
            d'une baisse de prix).
          </div>
        </div>
        <div style={{ background: `${T.a5}0d`, border: `1px solid ${T.a5}44`, borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Mois de soutirage (hiver) → Δ &lt; 0</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Si le prix forward d'hiver <em>monte</em>, on soutire plus cher → valeur du stockage ↑.
            L'opérateur est <strong>short</strong> les forward hiver (il vendra du gaz → bénéficie
            d'une hausse de prix de vente).
          </div>
        </div>
      </div>

      {/* Exemple numérique delta vector */}
      <div style={panelStyle}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Exemple — Profil typique du vecteur Δ</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Mois</Th>
                {months.map(m => <Th key={m}>{m}</Th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td accent={ACCENT}>Δ_k</Td>
                {deltaVector.map((d, i) => (
                  <Td key={i} accent={d.delta > 0 ? T.a4 : d.delta < 0 ? ACCENT : T.muted}>
                    {d.delta > 0 ? '+' : ''}{d.delta}
                  </Td>
                ))}
              </tr>
              <tr>
                <Td accent={T.muted}>F(0,T_k)</Td>
                {fwdData.map((d, i) => (
                  <Td key={i} accent={d.F < level ? T.a1 : T.a8}>{d.F}</Td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Les deltas positifs (vert) correspondent aux mois d'injection — l'opérateur est "long" ces maturités.
          Les deltas négatifs (rouge) correspondent au soutirage — "short" ces maturités. Les profils se compensent partiellement.
        </div>
      </div>

      {/* ── 4. PCA ──────────────────────────────────── */}
      <SectionTitle accent={ACCENT}>Les 3 facteurs PCA de la courbe forward</SectionTitle>

      <IntuitionBlock emoji="🎛️" title="PCA = réduire 12 curseurs à 3 manettes" accent={ACCENT}>
        En pratique, les 12 prix forward ne bougent pas indépendamment — ils sont très corrélés.
        L'Analyse en Composantes Principales (PCA — <em>Principal Component Analysis</em>) identifie
        les 3 "manettes" fondamentales qui expliquent ~95 % des mouvements de la courbe.
        <br /><br />
        <em>Pourquoi c'est crucial ?</em> Si on modélisait 12 maturités comme 12 variables d'état
        dans Bellman, la grille aurait <K>{"N_V \\times N_{S_1} \\times \\cdots \\times N_{S_{12}}"}</K>
        nœuds. Avec 10 points par dimension : <K>{"10^{13}"}</K> nœuds — impossible à calculer.
        La PCA réduit à 2-3 facteurs → <K>{"10^3"}</K> à <K>{"10^4"}</K> nœuds → tractable.
      </IntuitionBlock>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, margin: '12px 0' }}>
        {[
          { num: '1', label: 'Déplacement parallèle', variance: '~80 %', desc: 'Toute la courbe monte ou baisse uniformément. Couvert par le delta global du stockage.', color: ACCENT },
          { num: '2', label: 'Changement de pente (spread)', variance: '~15 %', desc: "Le spread été/hiver s'élargit ou se rétrécit. C'est le risque PRINCIPAL du stockage — la VI en dépend directement.", color: T.a5 },
          { num: '3', label: 'Changement de courbure', variance: '~5 %', desc: 'Les maturités intermédiaires bougent différemment des extrêmes. Résiduel, souvent non couvert.', color: T.muted },
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

      <FormulaBox accent={ACCENT} label="Décomposition PCA de la courbe forward">
        <K display>{"\\Delta F(0,T_k) \\approx \\underbrace{\\beta_1 \\cdot \\mathbf{e}_1(k)}_{\\text{parallèle}} + \\underbrace{\\beta_2 \\cdot \\mathbf{e}_2(k)}_{\\text{pente}} + \\underbrace{\\beta_3 \\cdot \\mathbf{e}_3(k)}_{\\text{courbure}}"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6, lineHeight: 1.7 }}>
          <K>{"\\mathbf{e}_i(k)"}</K> = vecteur propre i évalué à la maturité k (la "forme" du mouvement).
          <K>{"\\beta_i"}</K> = amplitude du mouvement dans la direction i (le score du facteur). Les
          <K>{"\\beta_i"}</K> sont indépendants entre eux, ce qui facilite la couverture et la simulation.
        </div>
      </FormulaBox>

      {/* ── 5. Comparaison des méthodes ──────────────── */}
      <SectionTitle accent={ACCENT}>Méthodes d'optimisation — comparaison</SectionTitle>

      <table style={tableStyle}>
        <thead>
          <tr><Th>Méthode</Th><Th>Avantage</Th><Th>Limite</Th><Th>Usage typique</Th></tr>
        </thead>
        <tbody>
          {[
            ['Bellman (DP)', 'Optimal global + politique + delta', 'Malédiction dimension (≤ 3 facteurs)', 'Standard industrie (stockage simple)'],
            ['LSMC', 'Gère haute dimension, Monte Carlo', 'Approximation, bruit, pas de politique exacte', 'Multi-sous-jacents, options complexes'],
            ['PDE (Hamilton-Jacobi-Bellman)', 'Continu, élégant, grande précision', 'Complexe, 2D max en pratique', 'Recherche académique'],
            ['LP (programmation linéaire)', 'Très rapide si prix connus', 'Ignore la stochasticité → sous-optimal', 'Valeur intrinsèque uniquement'],
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

      <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6, margin: '8px 0' }}>
        <em>LSMC</em> = Least-Squares Monte Carlo (méthode de Longstaff-Schwartz).
        <em> PDE</em> = Partial Differential Equation (équation aux dérivées partielles).
        <em> LP</em> = Linear Programming (programmation linéaire). <em> DP</em> = Dynamic Programming (programmation dynamique).
      </div>

      {/* ── 6. Portefeuille de flexibilités ──────────── */}
      <SectionTitle accent={ACCENT}>Intégration multi-actifs — le portefeuille de flexibilités</SectionTitle>

      <IntuitionBlock emoji="🗂️" title="Le stockage n'est qu'un outil parmi d'autres" accent={ACCENT}>
        Un fournisseur d'énergie dispose de <strong>plusieurs actifs de flexibilité</strong> pour
        équilibrer son portefeuille. Le stockage est le plus flexible mais aussi le plus coûteux.
        En pratique, on optimise l'<strong>ensemble</strong> — le même framework Bellman, mais avec
        plusieurs contrôles simultanés. Comme un chef d'orchestre qui coordonne
        les instruments : chacun a un rôle, l'objectif est l'harmonie du portefeuille.
      </IntuitionBlock>

      <table style={tableStyle}>
        <thead>
          <tr><Th>Actif</Th><Th>Flexibilité</Th><Th>Coût d'accès</Th><Th>Rôle clé</Th></tr>
        </thead>
        <tbody>
          {[
            ['Stockage souterrain', 'Très haute (inject/soutire)', 'Élevé (enchères)', 'Tampon saisonnier + trading spread'],
            ['Contrat Swing', 'Modérée (vol. min/max jour)', 'Moyen (prime swing)', 'Flexibilité court-terme'],
            ['Capacité LNG', 'Bonne (cargaisons)', 'Variable (spot/term)', 'Approvisionnement alternatif pointe'],
            ['Interruptibilité clients', 'Haute (réduire livraison)', 'Bas (tarif préférentiel)', 'Dernier recours, éviter pénalités'],
          ].map(([actif, flex, cout, role]) => (
            <tr key={actif}>
              <Td accent={ACCENT}>{actif}</Td>
              <Td>{flex}</Td>
              <Td>{cout}</Td>
              <Td accent={T.muted}>{role}</Td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6, margin: '8px 0' }}>
        <em>LNG</em> = Liquefied Natural Gas (Gaz Naturel Liquéfié). <em>OTC</em> = Over The Counter (marché de gré à gré).
      </div>

      <FormulaBox accent={ACCENT} label="Extension Bellman multi-actifs">
        <K display>{"\\text{État} : (V_{\\text{stock}},\\; V_{\\text{LNG}},\\; Q_{\\text{swing}},\\; S) \\qquad \\text{Contrôle} : \\mathbf{u}_t = (u_{\\text{stock}},\\; u_{\\text{LNG}},\\; u_{\\text{swing}},\\; u_{\\text{interr}})"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6, lineHeight: 1.7 }}>
          La même équation de Bellman s'applique — le max est pris sur <strong>tous les contrôles
          simultanément</strong>. La malédiction de la dimension impose ici d'utiliser LSMC
          ou une approximation par fonctions de base.
        </div>
      </FormulaBox>

      {/* ── 7. Exercice ──────────────────────────────── */}
      <Accordion title="Exercice — Impact d'un élargissement du spread sur la VI" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.muted, fontSize: 13 }}>
          Un fournisseur possède un stockage de 100 GWh (50 GWh injectés).
          Courbe forward initiale : spread = 12 €/MWh, μ = 40 €.
          Prévisions météo froides → spread élargit à 20 €/MWh. Estimer l'impact sur la VI.
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Courbe initiale" ruleDetail="spread = 12 €" accent={ACCENT}>
            Prix été = <K>{"40 - 6 = 34"}</K> €, hiver = <K>{"40 + 6 = 46"}</K> €.
            Recette brute : <K>{"50 \\times (46 - 34) = 600"}</K> € (hors coûts op.).
          </DemoStep>
          <DemoStep num={2} rule="Courbe après choc météo" ruleDetail="spread = 20 €" accent={ACCENT}>
            Prix été = <K>{"40 - 10 = 30"}</K> €, hiver = <K>{"40 + 10 = 50"}</K> €.
            Recette brute : <K>{"50 \\times (50 - 30) = 1\\,000"}</K> €.
          </DemoStep>
          <DemoStep num={3} rule="Variation de VI" ruleDetail="ΔVI = nouvelle − ancienne" accent={ACCENT}>
            <K>{"\\Delta VI \\approx 1\\,000 - 600 = +400"}</K> €. Le fournisseur a gagné 400 € de valeur
            sans rien faire — simple revalorisation par le marché. En rolling intrinsic, il ajuste
            ses forwards pour "locker" ce gain.
          </DemoStep>
          <DemoStep num={4} rule="Sensibilité au spread" ruleDetail="ΔVI / Δspread" accent={ACCENT}>
            <K>{"\\frac{\\Delta VI}{\\Delta \\text{spread}} = \\frac{400}{8} = 50 \\text{ €/(€/MWh)}"}</K>.
            Chaque euro de spread supplémentaire rapporte ~50 € de VI. C'est la <strong>sensibilité
            au facteur 2 de la PCA</strong> (changement de pente).
          </DemoStep>
        </Demonstration>
      </Accordion>

      {/* ── 8. Liens ──────────────────────────────── */}
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

      {/* ── 9. Récap ──────────────────────────────── */}
      <div style={{ background: `${ACCENT}18`, border: `2px solid ${ACCENT}55`, borderRadius: 8, padding: '16px 20px', margin: '16px 0 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>À retenir</div>
        <div style={{ color: T.text, fontSize: 12, lineHeight: 1.8 }}>
          {[
            'Le sous-jacent du stockage n\'est pas le spot mais la courbe forward F(0,T) — un objet multi-dimensionnel.',
            'La couverture nécessite un vecteur de deltas (un par maturité), pas un seul delta global.',
            'La PCA réduit les 12 maturités à 3 facteurs : parallèle (~80 %), pente (~15 %), courbure (~5 %).',
            'Le facteur 2 (spread été/hiver) est le risque principal du stockage — c\'est lui qui drive la VI.',
            'Le portefeuille de flexibilités (stockage + swing + LNG + interruptibilité) s\'optimise conjointement.',
            'La malédiction de la dimension impose LSMC ou PCA pour les problèmes multi-facteurs.',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ color: ACCENT, fontWeight: 700, fontSize: 12 }}>•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
