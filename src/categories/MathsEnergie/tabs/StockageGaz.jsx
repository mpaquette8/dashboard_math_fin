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
const SUPPLY_CAP = 55

export function ActeurTab() {
  const [spotPrice, setSpotPrice] = useState(40)
  const [control, setControl] = useState(-5)
  const cOp = 0.5
  const cashflow = -control * spotPrice * (1 / 12) - cOp * Math.abs(control) * (1 / 12)
  const loadData = MONTHS.map((m, i) => ({
    mois: m,
    demande: DEMAND_PROFILE[i],
    fourniture: SUPPLY_CAP,
    excès: Math.max(0, DEMAND_PROFILE[i] - SUPPLY_CAP),
  }))
  return (
    <div>
      {/* Bloc 1 — Le fournisseur */}
      <IntuitionBlock emoji="🏢" title="Le fournisseur d'énergie et son portefeuille" accent={ACCENT}>
        Un <strong>fournisseur de gaz</strong> a des <strong>clients avec des engagements fermes de livraison</strong> — des mairies, des industriels, des résidences —
        qui ont besoin de gaz quoi qu'il arrive. Il doit s'approvisionner sur les marchés (spot et forward) pour honorer ces engagements.
        Sa marge dépend entièrement de sa capacité à <strong>acheter bon marché et revendre au bon prix</strong>.
        Le stockage est son principal outil pour y parvenir.
      </IntuitionBlock>

      <div style={panelStyle}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Schéma du portefeuille fournisseur</div>
        <pre style={{ color: T.text, fontSize: 12, lineHeight: 1.8, margin: 0, fontFamily: 'monospace' }}>
{`  Clients résidentiels  ─┐
  Clients industriels   ─┤→  FOURNISSEUR  ←→  Marché spot / Forward
  Clients collectivités ─┘         ↕
                                 STOCKAGE
                          (cave saline / aquifère)`}
        </pre>
      </div>

      <SectionTitle accent={ACCENT}>Les 3 rôles du stockage pour un fournisseur</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
        {[
          { num: '1', title: 'Tampon saisonnier', desc: "Couvrir l'excès de demande hivernal. Les clients chauffent plus en hiver — le stockage comble l'écart entre la fourniture contractuelle (fixe) et la demande (variable).", color: ACCENT },
          { num: '2', title: 'Flexibilité opérationnelle', desc: "Absorber les aléas journaliers. Les écarts entre les nominations J-1 et la consommation réelle sont couverts par des injections/soutirage de court terme.", color: T.a5 },
          { num: '3', title: 'Actif de trading', desc: "Capturer le spread été/hiver. Acheter en été quand le prix est bas (injection), revendre en hiver quand il est haut (soutirage) — c'est l'arbitrage temporel.", color: T.a4 },
        ].map(({ num, title, desc, color }) => (
          <div key={num} style={{ background: `${color}0d`, border: `1px solid ${color}33`, borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{num}</div>
            <div><div style={{ color, fontWeight: 700, fontSize: 13 }}>{title}</div><div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7, marginTop: 3 }}>{desc}</div></div>
          </div>
        ))}
      </div>

      {/* Bloc 2 — Profil de consommation */}
      <SectionTitle accent={ACCENT}>Le profil de consommation saisonnier</SectionTitle>
      <IntuitionBlock emoji="📊" title="La demande de gaz est saisonnière" accent={ACCENT}>
        La consommation des clients monte fortement en hiver (chauffage). La fourniture contractuelle est souvent fixe (contrat d'approvisionnement annuel).
        L'<strong>excès de demande hivernale</strong> que la fourniture ne peut pas couvrir doit venir du stockage.
        La <strong>zone colorée</strong> ci-dessous représente le volume que le stockage doit fournir.
      </IntuitionBlock>

      <ChartWrapper title="Profil de charge annuel — Fournisseur type (GWh/mois)" accent={ACCENT} height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={loadData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="mois" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
            <ReferenceLine y={SUPPLY_CAP} stroke={T.a4} strokeDasharray="6 3" label={{ value: 'Fourniture contractuelle', fill: T.a4, fontSize: 10, position: 'insideBottomRight' }} />
            <Line type="monotone" dataKey="demande" stroke={ACCENT} strokeWidth={2.5} dot={false} name="Demande clients" />
            <Line type="monotone" dataKey="excès" stroke={T.a5} strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Volume stockage requis" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Bloc 3 — Contraintes opérationnelles */}
      <SectionTitle accent={ACCENT}>Contraintes opérationnelles spécifiques</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '14px 0' }}>
        {[
          { title: 'Working Gas vs Cushion Gas', icon: '⛽', desc: "Le cushion gas est le gaz permanent qui maintient la pression structurelle de la caverne (non disponible pour le trading). Seul le working gas est vraiment utilisable — c'est la capacité utile réelle." },
          { title: 'Droits de capacité', icon: '📋', desc: "L'injection et le soutirage sont soumis à des capacités maximales allouées par le gestionnaire du stockage, souvent via des enchères annuelles (TSO). Ces capacités s'expriment en GWh/jour." },
          { title: 'Nominations J-1', icon: '📅', desc: "Chaque veille, le fournisseur doit déclarer son programme d'injection/soutirage pour le lendemain. Cette contrainte rend impossible les ajustements infra-journaliers non planifiés." },
          { title: 'Coûts opérationnels C(u)', icon: '💶', desc: "Injecter ou soutirer n'est pas gratuit : énergie des compresseurs, usure, frais de gestionnaire. Modélisé par C(u) = c_op × |u|, ce coût réduit la marge sur chaque opération." },
        ].map(({ title, icon, desc }) => (
          <div key={title} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{icon} {title}</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>{desc}</div>
          </div>
        ))}
      </div>

      <SymbolLegend accent={ACCENT} symbols={[
        ['V_t', 'Volume stocké à la date t (GWh) — l\'état principal'],
        ['S_t', 'Prix spot du gaz observé à t (€/MWh)'],
        ['u_t', 'Contrôle : débit d\'injection (u>0) ou soutirage (u<0) en GWh/mois'],
        ['V_min, V_max', 'Bornes de volume physique (working gas)'],
        ['q_inj, q_wit', 'Débits maximaux d\'injection et de soutirage'],
        ['Δt', 'Pas de temps (1 mois = 1/12 an dans notre modèle)'],
        ['C(u)', 'Coût opérationnel : C(u) = c_op × |u|'],
      ]} />

      {/* Bloc 4 — Modèle mathématique */}
      <SectionTitle accent={ACCENT}>Modèle mathématique du problème</SectionTitle>
      <FormulaBox accent={ACCENT} label="Dynamique d'état">
        <K display>{"V_{t+1} = V_t + u_t \\cdot \\Delta t \\qquad \\text{avec } V_{\\min} \\leq V_{t+1} \\leq V_{\\max}"}</K>
      </FormulaBox>
      <FormulaBox accent={ACCENT} label="Cashflow instantané">
        <K display>{"\\pi(u_t, S_t) = -u_t \\cdot S_t \\cdot \\Delta t - C(u_t)"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          Si <K>{"u_t > 0"}</K> (injection) : on <strong>paie</strong> le gaz acheté. Si <K>{"u_t < 0"}</K> (soutirage) : on <strong>reçoit</strong> le produit de la vente.
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

      <Accordion title="Exercice — Calculer le P&L d'une campagne injection/soutirage" accent={ACCENT} badge="Facile">
        <p style={{ color: T.muted, fontSize: 13 }}>
          Un fournisseur injecte 8 GWh/mois pendant 4 mois d'été (prix moyen : 32 €/MWh),
          puis soutire 8 GWh/mois pendant 4 mois d'hiver (prix moyen : 58 €/MWh).
          Coûts opérationnels : 0.5 €/MWh par GWh injecté/soutiré. Calculer le gain net.
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Coût injection" ruleDetail="π = -u·S·Δt - C(u)" accent={ACCENT}>
            Injection : <K>{"\\pi_{inj} = -8 \\times 32 \\times \\frac{4}{12} - 0.5 \\times 8 \\times \\frac{4}{12} = -85.3 - 1.3 = -86.7 \\text{ €}"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Revenu soutirage" ruleDetail="u<0 → gain" accent={ACCENT}>
            Soutirage : <K>{"\\pi_{sout} = -(-8) \\times 58 \\times \\frac{4}{12} - 0.5 \\times 8 \\times \\frac{4}{12} = +154.7 - 1.3 = +153.3 \\text{ €}"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Gain net" ruleDetail="spread - coûts" accent={ACCENT}>
            <K>{"\\text{P\\&L} = 153.3 - 86.7 = +66.6 \\text{ €} \\approx (58-32) \\times \\frac{8 \\times 4}{12} - \\text{coûts}"}</K>
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

  const jMid = 6 // median price index
  const iMid = 7 // mid-volume index

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
      <IntuitionBlock emoji="♟️" title="Principe d'optimalité de Bellman (1957)" accent={ACCENT}>
        <strong>L'idée clé :</strong> pour prendre la meilleure décision aujourd'hui,
        il suffit de connaître la <strong>valeur optimale de demain</strong> —
        peu importe le chemin suivi pour y arriver.
        On résout donc à rebours, de la dernière période vers aujourd'hui,
        comme un ordinateur d'échecs qui part des positions finales pour remonter vers l'ouverture.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Équation de Bellman — Fonction valeur">
        <K display>{"\\mathcal{V}_t(V, S) = \\max_{u \\in \\mathcal{U}(V)} \\left[ \\underbrace{\\pi(u, S)}_{\\text{gain immédiat}} + \\underbrace{e^{-r\\Delta t}}_{\\text{actualisation}} \\cdot \\underbrace{\\mathbb{E}_t\\!\\left[\\mathcal{V}_{t+1}(V + u\\Delta t,\\ S_{t+1})\\right]}_{\\text{valeur future espérée}} \\right]"}</K>
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Condition terminale">
        <K display>{"\\mathcal{V}_T(V, S) = 0 \\quad \\text{(plus de cashflows futurs à l'échéance)}"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
          On peut aussi ajouter une pénalité si <K>{"V_T < V_{\\min}^T"}</K> :
          <K display>{"\\mathcal{V}_T(V, S) = -\\lambda \\cdot \\max(V_{\\min}^T - V,\\ 0)"}</K>
        </div>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Simulation interactive — Backward DP</SectionTitle>
      <Grid cols={3} gap="12px">
        <Slider label="Vitesse retour κ" value={kappa} min={0.5} max={5} step={0.1} onChange={setKappa} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="Prix moyen μ (€/MWh)" value={mu} min={20} max={80} step={1} onChange={setMu} accent={ACCENT} format={v => `${v} €`} />
        <Slider label="Volatilité σ (€/MWh)" value={sigma} min={1} max={25} step={0.5} onChange={setSigma} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="Taux d'actualisation r" value={r} min={0} max={0.15} step={0.005} onChange={setR} accent={ACCENT} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="Débit injection max (GWh/m)" value={qinj} min={2} max={20} step={1} onChange={setQinj} accent={ACCENT} format={v => `${v}`} />
        <Slider label="Débit soutirage max (GWh/m)" value={qwit} min={2} max={20} step={1} onChange={setQwit} accent={ACCENT} format={v => `${v}`} />
      </Grid>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="Valeur V₀(50 GWh, μ)" value={v0.toFixed(2)} unit="€" accent={ACCENT} />
        <InfoChip label="Contrôle optimal u*" value={u0 > 0.5 ? `+${u0.toFixed(1)} inj` : u0 < -0.5 ? `${u0.toFixed(1)} sout` : '0 attente'} accent={u0 > 0.5 ? T.a1 : u0 < -0.5 ? T.a4 : T.muted} />
        <InfoChip label="Grille" value={`15×12×12`} unit="nœuds" accent={T.muted} />
      </div>

      <Grid cols={2} gap="16px">
        <ChartWrapper title="Fonction valeur V₀(V, S=μ)" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={valueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="volume" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Volume (GWh)', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -3 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11 }} />
              <Line type="monotone" dataKey="valeur" stroke={ACCENT} strokeWidth={2.5} dot={false} name="V₀(V, μ)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Politique optimale u*(V, S=μ)" accent={ACCENT} height={220}>
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

      <SectionTitle accent={ACCENT}>Algorithme pas à pas</SectionTitle>
      <div style={{ ...panelStyle, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.9, color: T.muted }}>
        <Step num={1} accent={ACCENT}>Initialiser : <span style={{ color: T.a4 }}>V[T][i][j] = 0</span> pour tout (i,j) de la grille</Step>
        <Step num={2} accent={ACCENT}>Pour t de T-1 jusqu'à 0 (backward) :</Step>
        <div style={{ paddingLeft: 20 }}>
          <Step num={3} accent={ACCENT}>Pour chaque nœud (V_i, S_j) de la grille 2D :</Step>
          <div style={{ paddingLeft: 20 }}>
            <Step num={4} accent={ACCENT}>Énumérer u ∈ &#123;-q_wit, ..., 0, ..., q_inj&#125; (11 valeurs)</Step>
            <Step num={5} accent={ACCENT}>Pour chaque u : V' = V_i + u·Δt → vérifier V_min ≤ V' ≤ V_max</Step>
            <Step num={6} accent={ACCENT}>Calculer <span style={{ color: T.a5 }}>E[V[t+1](V', S')] = Σk Π[j][k] · interp(V[t+1][·][k], V')</span></Step>
            <Step num={7} accent={ACCENT}>gain(u) = π(u, S_j) + e^(-rΔt) · E[...]</Step>
          </div>
          <Step num={8} accent={ACCENT}>Stocker <span style={{ color: ACCENT }}>V[t][i][j] = max_u gain(u)</span> et u*[t][i][j]</Step>
        </div>
        <Step num={9} accent={ACCENT}>Lire <span style={{ color: ACCENT }}>V[0][i₀][j₀]</span> = valeur du stockage à l'état initial (V₀, S₀)</Step>
      </div>

      <Accordion title="Exercice — Interpréter la fonction valeur" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.muted, fontSize: 13 }}>
          Observez le graphique de la fonction valeur. Pourquoi est-elle croissante avec le volume V ?
          Pourquoi s'aplatit-elle aux extrêmes (V→V_min et V→V_max) ?
          Que se passe-t-il quand vous augmentez σ ?
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Croissance" ruleDetail="plus de stock = plus de flexibilité" accent={ACCENT}>
            Plus V est grand, plus on a de gaz à revendre lors des pics de prix. La valeur augmente avec le volume disponible.
          </DemoStep>
          <DemoStep num={2} rule="Aplatissement aux bornes" ruleDetail="contraintes actives" accent={ACCENT}>
            À V→V_max : on ne peut plus injecter, la capacité de stockage ne crée plus de valeur marginale.
            À V→V_min : on n'a plus de gaz à vendre. Dans les deux cas, une unité supplémentaire de volume ne change rien.
          </DemoStep>
          <DemoStep num={3} rule="Effet de σ" ruleDetail="convexité → VE" accent={ACCENT}>
            Augmenter σ augmente V₀. C'est la <strong>valeur extrinsèque</strong> — le stockage est un actif convexe qui bénéficie de la volatilité, comme une option. Voir l'onglet "Valeur Intrinsèque & Extrinsèque".
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
