import React, { useState, useMemo, Component } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { T } from '../../../design/tokens'
import {
  ModuleHeader, TabBar, FormulaBox, IntuitionBlock, ExampleBlock,
  Slider, Accordion, Step, SymbolLegend, SectionTitle, InfoChip, Grid, ChartWrapper,
  Demonstration, DemoStep, K,
} from '../../../design/components'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div style={{ color: '#f87171', padding: 24, fontFamily: 'monospace', fontSize: 13, background: '#1a0a0a', borderRadius: 8, margin: 16 }}>
        <strong>Runtime Error in {this.props.name}:</strong><br />
        {this.state.error.toString()}<br /><br />
        <pre>{this.state.error.stack}</pre>
      </div>
    )
    return this.props.children
  }
}

const ACCENT = T.a4

// ─── Math helpers ─────────────────────────────────────────────────────────────
function phi(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) }
function normCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const p = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return x >= 0 ? 1 - phi(x) * p : phi(x) * p
}
function gaussRand() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
function bs(S, K, T, r, sigma, type = 'call') {
  if (T <= 0) return Math.max(type === 'call' ? S - K : K - S, 0)
  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT
  if (type === 'call') return S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2)
  return K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1)
}
function bsGreeks(S, K, T, r, sigma) {
  if (T <= 0) return { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 }
  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT
  const Nd1 = normCDF(d1), Nd2 = normCDF(d2)
  const nd1 = phi(d1)
  const delta = Nd1
  const gamma = nd1 / (S * sigma * sqrtT)
  const vega = S * nd1 * sqrtT / 100 // per 1% vol
  const theta = (-S * nd1 * sigma / (2 * sqrtT) - r * K * Math.exp(-r * T) * Nd2) / 365
  const rho = K * T * Math.exp(-r * T) * Nd2 / 100 // per 1% rate
  return { delta, gamma, vega, theta, rho, d1, d2, Nd1, Nd2 }
}
function black76(F, K, T, r, sigma, type = 'call') {
  if (T <= 0) return Math.max(type === 'call' ? F - K : K - F, 0)
  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(F / K) + 0.5 * sigma * sigma * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT
  const df = Math.exp(-r * T)
  if (type === 'call') return df * (F * normCDF(d1) - K * normCDF(d2))
  return df * (K * normCDF(-d2) - F * normCDF(-d1))
}

// ─── Tab: No-Arbitrage ────────────────────────────────────────────────────────

export function GreeksTab() {
  const [S, setS] = useState(100)
  const [strike, setStrike] = useState(100)
  const [T2, setT2] = useState(1)
  const [r, setR] = useState(0.05)
  const [sigma, setSigma] = useState(0.2)

  const g = bsGreeks(S, strike, T2, r, sigma)
  const call = bs(S, strike, T2, r, sigma, 'call')

  const greekVsS = useMemo(() => {
    const pts = []
    for (let s = 60; s <= 160; s += 2) {
      const gr = bsGreeks(s, strike, T2, r, sigma)
      pts.push({ S: s, delta: +gr.delta.toFixed(4), gamma: +(gr.gamma * 100).toFixed(5), vega: +gr.vega.toFixed(4) })
    }
    return pts
  }, [strike, T2, r, sigma])

  const greekVsT = useMemo(() => {
    const pts = []
    for (let t = 0.02; t <= 2; t += 0.04) {
      const gr = bsGreeks(S, strike, t, r, sigma)
      pts.push({ T: +t.toFixed(2), vega: +gr.vega.toFixed(4), gamma: +(gr.gamma * 100).toFixed(5) })
    }
    return pts
  }, [S, strike, r, sigma])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Les Greeks : le tableau de bord du trader d'options.</strong> Ils quantifient exactement comment
        la valeur de l'option réagit à chaque facteur de marché. Un trader qui possède un book d'options
        surveille en permanence ses Greeks agrégés pour savoir : est-il long ou court le marché (Delta) ?
        Est-il exposé à une chute de volatilité (Vega) ? Perd-il de la valeur chaque jour (Theta) ?
        Chaque Greek correspond à une source de risque spécifique qu'on peut couvrir indépendamment.
      </div>

      <IntuitionBlock emoji="🎛️" title="Les Greeks : tableau de bord de sensibilité" accent={ACCENT}>
        Un trader en options ne regarde pas seulement le prix de l'option.
        Il surveille ses <strong>sensibilités</strong> aux différents facteurs de risque.
        Delta: risque directionnel. Gamma: risque de convexité. Vega: risque de volatilité.
        Theta: coût du temps. Chaque Greek mesure "de combien varie mon P&L si X change de 1 unité ?"
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Descriptions détaillées des Greeks</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          {
            name: 'Delta (Δ)',
            color: ACCENT,
            content: <>Ratio de couverture (hedge ratio) : pour couvrir 1 call, vendre Δ actions. Call ATM : <K>{"\\Delta \\approx 0.5"}</K>. Call ITM profond : <K>{"\\Delta \\to 1"}</K>. Call OTM profond : <K>{"\\Delta \\to 0"}</K>. Propriété : <K>{"\\Delta_{\\text{call}} + |\\Delta_{\\text{put}}| = 1"}</K> pour même strike/maturité (parité put-call différentiée). Le Delta est dynamique → il faut rééquilibrer le hedge en continu.</>,
          },
          {
            name: 'Gamma (Γ)',
            color: T.a3,
            content: <>Convexité de l'option : <K>{"\\Gamma = \\frac{\\partial \\Delta}{\\partial S} = \\frac{\\partial^2 C}{\\partial S^2}"}</K>. Toujours positif (long gamma = long convexité). Maximum pour les options ATM proches de l'échéance. Coût de couverture dynamique : si Γ {'>'} 0, le hedge Delta génère un profit quadratique en <K>{"(\\Delta S)^2"}</K>. "Être long Gamma" signifie profiter des grands mouvements du marché.</>,
          },
          {
            name: 'Vega (ν)',
            color: T.a5,
            content: 'Sensibilité à la volatilité implicite (pas réalisée). Toujours positif : plus de vol → plus d\'incertitude → option plus chère. Maximum ATM. Vega est crucial pour les options à long terme et en période de crise (vol spike). En énergie : le Vega d\'un cap gaz peut être énorme lors d\'une vague de froid inattendue.',
          },
          {
            name: 'Theta (Θ)',
            color: T.a2,
            content: 'Dégradation temporelle : combien l\'option perd de valeur par jour. Toujours négatif pour un acheteur (la valeur temps s\'étiole). S\'accélère à l\'approche de la maturité. Vendeur d\'option : Theta positif (il encaisse le Theta). Acheteur : Theta négatif (il le subit). Compromis fondamental avec le Gamma.',
          },
          {
            name: 'Rho (ρ)',
            color: T.a7,
            content: <>Sensibilité au taux sans risque. Peu important pour options court terme ({'<'} 1 an). Crucial pour options longues et obligations. <K>{"\\rho_{\\text{call}} > 0"}</K> : si r augmente, le coût de portage <K>{"Ke^{-rT}"}</K> baisse → call plus cher. <K>{"\\rho_{\\text{put}} < 0"}</K> : symétrie inverse. En énergie : Rho souvent négligé car la vol domine.</>,
          },
          {
            name: 'Theta-Gamma tradeoff',
            color: ACCENT,
            content: <>La relation fondamentale de la PDE B-S : <K>{"\\Theta + \\tfrac{1}{2}\\Gamma\\sigma^2 S^2 = rV"}</K>. Dans un portefeuille Delta-neutre (<K>{"\\Delta=0"}</K>) : Θ et Γ se compensent exactement ! Être long Gamma (profiter des mouvements) coûte du Theta (perte de valeur temps quotidienne). Le marché fixe ce prix implicitement via la vol implicite.</>,
          },
        ].map((g2, i) => (
          <div key={i} style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${g2.color}22`, fontSize: 12 }}>
            <div style={{ color: g2.color, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{g2.name}</div>
            <div style={{ color: T.muted, lineHeight: 1.7 }}>{g2.content}</div>
          </div>
        ))}
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Pourquoi ces formules ? — Dérivation intuitive de chaque Greek</div>
        <Step num={1} accent={ACCENT}>Delta = N(d₁) : en dérivant C = S·N(d₁) − K·e^(−rT)·N(d₂) par S, les termes S·∂N(d₁)/∂S et K·e^(−rT)·∂N(d₂)/∂S se compensent exactement (car d₁ et d₂ sont tous deux fonctions de S), laissant ∂C/∂S = N(d₁). Le Delta est donc la probabilité sous Q^S que l'option finisse dans la monnaie.</Step>
        <Step num={2} accent={ACCENT}>Gamma = φ(d₁)/(Sσ√T) : Gamma = ∂Delta/∂S = ∂N(d₁)/∂S = φ(d₁) × ∂d₁/∂S = φ(d₁)/(Sσ√T). Il atteint son pic à la monnaie (d₁=0 → φ(0) = 1/√(2π) est maximum), et s'effondre ITM et OTM. Plus T est court, plus le pic est étroit et élevé.</Step>
        <Step num={3} accent={ACCENT}>Vega = Sφ(d₁)√T : augmenter σ de 1% élargit la distribution de log(S_T/S) d'une quantité proportionnelle à √T. La "zone d'exercice" s'élargit d'autant, et la sensibilité marginale à cet élargissement est proportionnelle à φ(d₁) × S × √T — la densité de probabilité autour du strike fois le niveau de prix fois le temps.</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          Relation Vega-Gamma : Vega = Gamma × S² × σ × T. Ainsi Gamma et Vega sont toujours du même signe — long Vega implique toujours long Gamma. La grande différence : Vega mesure la sensibilité à la vol implicite (ce que le marché pense), Gamma mesure la sensibilité à la vol réalisée (ce qui se passe vraiment).
        </div>
      </div>

      <FormulaBox accent={ACCENT} label="Theta-Gamma tradeoff — de la PDE de Black-Scholes">
        <K display>{"\\Theta + \\tfrac{1}{2}\\Gamma\\sigma^2 S^2 = rV"}</K>
        Dans un portefeuille Delta-neutre (V = call, Δ = 0 couvert) :
        <K display>{"-(\\text{valeur temps perdue/j}) = \\tfrac{1}{2}\\Gamma\\sigma^2 S^2 \\quad \\text{[gain de convexité espéré]}"}</K>
        Le marché fixe ce "prix du Gamma" via la vol implicite σ.
      </FormulaBox>

      <Accordion title="Exercice — Attribution complète du P&L (Taylor expansion)" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text }}>
          Call sur WTI : S = 80$/bbl, K = 80$, T = 0.5 an, σ = 30%, r = 4%.
          Δ = 0.58, Γ = 0.021, ν = 0.22 (par 1% vol), Θ = -0.08 (par jour).
          Le lendemain : S → 82$, σ implicite → 31%. Calculez le P&L du call.
        </p>
        <FormulaBox accent={ACCENT}>P&L = Δ·ΔS + ½Γ(ΔS)² + ν·Δσ + Θ·Δt ≈ +1.342 $/bbl par bbl de notionnel</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="P&L attribution" ruleDetail="Δ × ΔS" accent={ACCENT}>Contribution Delta : Δ × ΔS = 0.58 × (+2) = +1.16 $/bbl</DemoStep>
          <DemoStep num={2} rule="Taylor expansion" ruleDetail="½Γ(ΔS)²" accent={ACCENT}>Contribution Gamma : ½Γ(ΔS)² = ½ × 0.021 × 4 = +0.042 $/bbl</DemoStep>
          <DemoStep num={3} rule="P&L attribution" ruleDetail="ν × Δσ" accent={ACCENT}>Contribution Vega : ν × Δσ = 0.22 × (+1%) = +0.22 $/bbl</DemoStep>
          <DemoStep num={4} rule="P&L attribution" ruleDetail="Θ × Δt" accent={ACCENT}>Contribution Theta : Θ × Δt = -0.08 × 1 = -0.08 $/bbl</DemoStep>
          <DemoStep num={5} rule="Taylor expansion" ruleDetail="Somme des contributions" accent={ACCENT}>P&L total ≈ 1.16 + 0.042 + 0.22 - 0.08 = +1.342 $/bbl. Pour 1 000 barils de notionnel : P&L total ≈ +1 342$</DemoStep>
        </Demonstration>
      </Accordion>

      <Grid cols={5} gap="8px">
        <Slider label="S" value={S} min={60} max={160} step={1} onChange={setS} accent={ACCENT} format={v => `${v}€`} />
        <Slider label="K" value={strike} min={60} max={160} step={1} onChange={setStrike} accent={T.a5} format={v => `${v}€`} />
        <Slider label="T" value={T2} min={0.05} max={2} step={0.05} onChange={setT2} accent={T.muted} format={v => `${v.toFixed(2)}a`} />
        <Slider label="r" value={r} min={0} max={0.15} step={0.005} onChange={setR} accent={T.muted} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="σ" value={sigma} min={0.05} max={0.7} step={0.01} onChange={setSigma} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
      </Grid>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '16px 0' }}>
        {[
          { name: 'Δ Delta', val: g.delta.toFixed(4), desc: 'Si S +1€ → Call +Δ€', interp: `${(g.delta * 100).toFixed(1)}% ITM prob.`, c: ACCENT },
          { name: 'Γ Gamma', val: (g.gamma * 100).toFixed(5), desc: 'Si S +1€ → Δ +Γ', interp: 'Convexité (toujours ≥ 0)', c: T.a3 },
          { name: 'ν Vega', val: g.vega.toFixed(4), desc: 'Si σ +1% → Call +ν€', interp: 'Risque de volatilité', c: T.a5 },
          { name: 'Θ Theta', val: g.theta.toFixed(5), desc: 'Si +1j → Call +Θ€', interp: 'Coût de temps (par jour)', c: T.a2 },
          { name: 'ρ Rho', val: g.rho.toFixed(5), desc: 'Si r +1% → Call +ρ€', interp: 'Risque de taux', c: T.a7 },
          { name: 'Call BS', val: call.toFixed(4), desc: `S=${S}€, K=${strike}€`, interp: `${S >= strike ? 'ITM' : 'OTM'} (moneyness ${(S / strike).toFixed(2)})`, c: ACCENT },
        ].map(g2 => (
          <div key={g2.name} style={{ background: T.panel2, borderRadius: 8, padding: '14px 16px', border: `1px solid ${g2.c}33` }}>
            <div style={{ color: g2.c, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{g2.name}</div>
            <div style={{ color: T.text, fontFamily: 'monospace', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{g2.val}</div>
            <div style={{ color: T.muted, fontSize: 11 }}>{g2.desc}</div>
            <div style={{ color: g2.c, fontSize: 10, marginTop: 4 }}>{g2.interp}</div>
          </div>
        ))}
      </div>

      <Grid cols={2} gap="12px">
        <ChartWrapper title="Delta & Gamma en fonction de S" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={greekVsS} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="S" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <ReferenceLine x={strike} stroke={T.border} strokeDasharray="3 3" />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
              <Line type="monotone" dataKey="delta" stroke={ACCENT} strokeWidth={2} dot={false} name="Delta" />
              <Line type="monotone" dataKey="gamma" stroke={T.a3} strokeWidth={2} dot={false} name="Gamma ×100" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Vega en fonction de S" accent={T.a5} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={greekVsS} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="S" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <ReferenceLine x={strike} stroke={T.border} strokeDasharray="3 3" />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Line type="monotone" dataKey="vega" stroke={T.a5} strokeWidth={2} dot={false} name="Vega (per 1% vol)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>
    </div>
  )
}

// ─── Tab: Monte Carlo ─────────────────────────────────────────────────────────
