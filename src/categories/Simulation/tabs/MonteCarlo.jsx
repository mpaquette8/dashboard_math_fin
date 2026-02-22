import React, { useState, useMemo, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
} from 'recharts'
import { T } from '../../../design/tokens'
import {
  TabBar,
  FormulaBox,
  IntuitionBlock,
  ExampleBlock,
  Slider,
  Accordion,
  Step,
  SymbolLegend,
  SectionTitle,
  InfoChip,
  Grid,
  ChartWrapper,
  Demonstration,
  DemoStep,
  K,
} from '../../../design/components'

const ACCENT = T.a3


function gaussRand() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}


// ─── Tab: Marche Aléatoire ────────────────────────────────────────────────────

// ─── Math helpers ─────────────────────────────────────────────────────────────

function phi(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) }

function normCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const p = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return x >= 0 ? 1 - phi(x) * p : phi(x) * p
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

export function SimulTab() {
  const [rho, setRho] = useState(0.6)
  const [mu1, setMu1] = useState(0.08)
  const [mu2, setMu2] = useState(0.05)
  const [sig1, setSig1] = useState(0.3)
  const [sig2, setSig2] = useState(0.25)
  const [key, setKey] = useState(0)

  const data = useMemo(() => {
    const n = 252; const dt = 1 / n
    let S1 = 100, S2 = 50
    const pts = [{ t: 0, S1: 100, S2: 50 }]
    for (let i = 1; i <= n; i++) {
      const Z1 = gaussRand()
      const Z2 = gaussRand()
      const W1 = Z1
      const W2 = rho * Z1 + Math.sqrt(1 - rho * rho) * Z2
      S1 *= Math.exp((mu1 - 0.5 * sig1 * sig1) * dt + sig1 * Math.sqrt(dt) * W1)
      S2 *= Math.exp((mu2 - 0.5 * sig2 * sig2) * dt + sig2 * Math.sqrt(dt) * W2)
      if (i % 3 === 0) pts.push({ t: +(i * dt).toFixed(3), S1: +S1.toFixed(2), S2: +S2.toFixed(2) })
    }
    return pts
  }, [rho, mu1, mu2, sig1, sig2, key])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Méthodes de simulation numérique :</strong> Quand un modèle n'a pas de formule fermée
        (options asiatiques, modèles à volatilité stochastique, payoffs path-dependent), la <strong>simulation de Monte Carlo</strong>
        est la méthode universelle. On simule N trajectoires du processus sous-jacent, on calcule le payoff pour chaque,
        et on moyenne. La loi des grands nombres garantit la convergence. Cette section illustre la simulation de
        <strong>2 actifs corrélés</strong> — essentielle pour les options sur spread (pétrole vs gaz, crack spread),
        les portefeuilles multi-commodités, et la gestion du risque de corrélation.
      </div>

      <IntuitionBlock emoji="🔗" title="Simulation de 2 actifs corrélés par Cholesky" accent={ACCENT}>
        Pour simuler un portefeuille pétrole + gaz avec corrélation <K>{"\\rho"}</K> :
        On génère <K>{"Z_1, Z_2 \\sim \\mathcal{N}(0,1)"}</K> indépendants, puis on "corèle" avec Cholesky :
        <K>{"W_1 = Z_1"}</K> et <K>{"W_2 = \\rho\\, Z_1 + \\sqrt{1-\\rho^2}\\, Z_2"}</K>.
        Cela garantit <K>{"\\mathrm{Cor}(W_1, W_2) = \\rho"}</K> tout en préservant la marginalité normale de chaque actif.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Cholesky — 2 actifs corrélés">
        <K display>{"W_1 = Z_1"}</K>
        <K display>{"W_2 = \\rho\\, Z_1 + \\sqrt{1-\\rho^2}\\, Z_2 \\quad\\text{où } Z_1, Z_2 \\sim \\mathcal{N}(0,1) \\text{ iid}"}</K>
        <K display>{"\\mathrm{Cov}(W_1, W_2) = E[W_1 \\cdot W_2] = \\rho \\times \\mathrm{Var}(Z_1) = \\rho \\;\\checkmark"}</K>
      </FormulaBox>

      <Grid cols={3} gap="8px">
        <Slider label="ρ (corrélation)" value={rho} min={-0.99} max={0.99} step={0.01} onChange={setRho} accent={ACCENT} />
        <Slider label="µ₁ (WTI drift)" value={mu1} min={-0.2} max={0.4} step={0.01} onChange={setMu1} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="µ₂ (Gaz drift)" value={mu2} min={-0.2} max={0.4} step={0.01} onChange={setMu2} accent={T.a7} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ₁ (WTI vol)" value={sig1} min={0.05} max={0.6} step={0.01} onChange={setSig1} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ₂ (Gaz vol)" value={sig2} min={0.05} max={0.6} step={0.01} onChange={setSig2} accent={T.a7} format={v => `${(v * 100).toFixed(0)}%`} />
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelles trajectoires</button>

      <ChartWrapper title={`WTI (S₁) & Gaz Nat (S₂) corrélés — ρ = ${rho.toFixed(2)}`} accent={ACCENT} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis yAxisId="left" stroke={ACCENT} tick={{ fill: ACCENT, fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" stroke={T.a5} tick={{ fill: T.a5, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="S1" stroke={ACCENT} strokeWidth={2} dot={false} name="WTI ($/bbl)" />
            <Line yAxisId="right" type="monotone" dataKey="S2" stroke={T.a5} strokeWidth={2} dot={false} name="Gaz Nat ($/MMBtu)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Précision de Monte Carlo et réduction de variance</SectionTitle>
      <FormulaBox accent={ACCENT} label="Erreur standard de Monte Carlo">
        <K display>{"\\text{Erreur standard} = \\frac{\\sigma_{\\text{payoff}}}{\\sqrt{N}}"}</K>
        <K display>{"\\text{IC}_{95\\%} :\\; \\text{Prix}_{\\text{MC}} \\pm 1.96 \\times \\frac{\\sigma_{\\text{payoff}}}{\\sqrt{N}}"}</K>
        <K display>{"\\text{Doubler la précision} \\Rightarrow \\text{multiplier } N \\text{ par 4 (coût quadratique !)}"}</K>
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Techniques de réduction de variance — indispensables en pratique :</strong>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>1. Variables antithétiques :</strong> Pour chaque Z ~ N(0,1) utilisé, ajouter aussi -Z.
            On simule <K>{"N/2"}</K> paires <K>{"(Z, -Z)"}</K> au lieu de N variables indépendantes.
            Cela exploite la symétrie de la loi normale. Réduction typique de variance : 30-70%.
            Formule : <K>{"C_{\\text{MC}} = \\tfrac{1}{2}[\\text{payoff}(Z) + \\text{payoff}(-Z)]"}</K> pour chaque paire.
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>2. Variables de contrôle :</strong> On utilise un actif dont on connaît le vrai prix (ex: le call B-S)
            pour corriger l'estimateur MC. Si payoff_BS_MC ≠ prix_BS_vrai, on ajuste proportionnellement.
            <K>{"C_{\\text{ajusté}} = C_{\\text{MC}} + b \\times (\\text{prix}_{\\text{BS,vrai}} - \\text{payoff}_{\\text{BS,MC}})"}</K>. Réduction typique : 80-95% de variance.
          </div>
          <div>
            <strong>3. Stratification :</strong> Diviser l'espace [0,1] en N tranches égales et tirer exactement
            un point dans chaque tranche (au lieu de tirer N points iid). Garantit une meilleure couverture
            de l'espace des scénarios.
          </div>
        </div>
      </div>

      <Accordion title="Exercice — Nombre de simulations nécessaires" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Un call vaut 5€ avec <K>{"\\sigma_{\\text{payoff}} \\approx 20"}</K>€. Combien de simulations pour une précision de <K>{"\\pm 0.10"}</K>€ (95%) ? De <K>{"\\pm 0.01"}</K>€ ?</p>
        <FormulaBox accent={ACCENT}><K>{"N = \\Big(\\frac{1.96\\,\\sigma}{\\varepsilon}\\Big)^{\\!2}"}</K> — précision ×10 → N ×100</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Erreur standard" ruleDetail="N = (1.96·σ/ε)²" accent={ACCENT}>Formule : <K>{"N = \\Big(\\frac{1.96 \\times \\sigma_{\\text{payoff}}}{\\varepsilon}\\Big)^{\\!2}"}</K> où ε est la demi-largeur souhaitée</DemoStep>
          <DemoStep num={2} rule="Loi des grands nombres" ruleDetail="convergence en 1/√N" accent={ACCENT}>Pour ε = 0.10€ : <K>{"N = (1.96 \\times 20 / 0.10)^2 = 392^2 = 153\\,664"}</K> simulations</DemoStep>
          <DemoStep num={3} rule="Loi des grands nombres" ruleDetail="convergence en 1/√N" accent={ACCENT}>Pour ε = 0.01€ : <K>{"N = (3920)^2 = 15\\,366\\,400"}</K> simulations (~15M !)</DemoStep>
          <DemoStep num={4} rule="Erreur standard" ruleDetail="réduction de variance" accent={ACCENT}>Avec variables antithétiques (variance réduite de 50%) : N divisé par 2 → gain de CPU ×2. En pratique : 10 000 sims pour estimation rapide, 1M pour publication, 10M pour pricing de salle de marchés.</DemoStep>
        </Demonstration>
      </Accordion>

      <ExampleBlock title="Cas concret : portefeuille énergie à 1 an" accent={ACCENT}>
        <p>100M$ en WTI (<K>{"\\sigma=30\\%"}</K>) + 50M$ en Gaz Nat (<K>{"\\sigma=25\\%"}</K>), <K>{"\\rho=0.5"}</K></p>
        <FormulaBox accent={ACCENT}><K>{"\\sigma_p = 25.2\\%,\\; \\text{VaR}_{95\\%} = 62.1\\text{M\\$}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Loi des grands nombres" ruleDetail="poids du portefeuille" accent={ACCENT}><K>{"w_1 = 2/3,\\; w_2 = 1/3"}</K> (portefeuille total 150M$)</DemoStep>
          <DemoStep num={2} rule="Loi des grands nombres" ruleDetail="Cov = ρ·σ₁·σ₂" accent={ACCENT}><K>{"\\mathrm{Cov} = 0.5 \\times 0.30 \\times 0.25 = 0.0375"}</K></DemoStep>
          <DemoStep num={3} rule="Erreur standard" ruleDetail="σ²_p = Σ wᵢwⱼ Covᵢⱼ" accent={ACCENT}><K>{"\\sigma_p^2 = (2/3)^2 \\times 0.09 + 2 \\times \\tfrac{2}{3} \\times \\tfrac{1}{3} \\times 0.0375 + (1/3)^2 \\times 0.0625"}</K></DemoStep>
          <DemoStep num={4} rule="Erreur standard" ruleDetail="calcul numérique" accent={ACCENT}><K>{"= 0.04 + 0.01667 + 0.006944 = 0.063611"}</K></DemoStep>
          <DemoStep num={5} rule="Erreur standard" ruleDetail="VaR = z·σ·V" accent={ACCENT}><K>{"\\sigma_p = 25.2\\%"}</K> → VaR 95% (1 an) = <K>{"1.645 \\times 0.252 \\times 150\\text{M\\$} = 62.1\\text{M\\$}"}</K></DemoStep>
        </Demonstration>
      </ExampleBlock>
    </div>
  )
}

export function GBMTab() {
  const [mu, setMu] = useState(0.1)
  const [sigma, setSigma] = useState(0.25)
  const [T2, setT2] = useState(1)
  const [nPaths, setNPaths] = useState(5)
  const [S0, setS0] = useState(100)
  const [key, setKey] = useState(0)

  const paths = useMemo(() => {
    const n = 252
    const dt = T2 / n
    const result = []
    for (let p = 0; p < nPaths; p++) {
      let S = S0
      const pts = [{ t: 0, S: S0 }]
      for (let i = 1; i <= n; i++) {
        S *= Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * gaussRand())
        if (i % 3 === 0) pts.push({ t: +(i * dt).toFixed(3), S: +S.toFixed(2) })
      }
      result.push(pts)
    }
    return result
  }, [mu, sigma, T2, nPaths, S0, key])

  const COLORS = [ACCENT, T.a4, T.a5, T.a6, T.a2, T.a7, T.a8]
  const E_ST = S0 * Math.exp(mu * T2)
  const Vol_ST = S0 * Math.exp(mu * T2) * Math.sqrt(Math.exp(sigma * sigma * T2) - 1)

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>La logique du GBM :</strong> Plutôt que de modéliser directement le prix S (qui peut être très grand ou très petit),
        on modélise les <strong>rendements</strong> log <K>{"dS/S"}</K>. L'idée fondamentale est que chaque petit rendement relatif
        <K>{"dR = dS/S"}</K> est gaussien : <K>{"dR = \\mu\\,dt + \\sigma\\,dW"}</K>. Si on cumule ces petits rendements sur <K>{"[0,T]"}</K>, le prix final est :
        <K>{"S(T) = S_0 \\times \\exp\\!\\big(\\int_0^T dR\\big)"}</K> = <K>{"S_0 \\times \\exp(\\text{log-normal})"}</K>. C'est pourquoi les <em>prix</em> GBM suivent une loi log-normale
        (toujours positifs, asymétriques à droite) — une propriété essentielle pour les actifs financiers.
      </div>

      <IntuitionBlock emoji="📈" title="GBM : le modèle standard des prix financiers" accent={ACCENT}>
        Le Geometric Brownian Motion (GBM) est la brique de base de Black-Scholes.
        L'idée : le <strong>rendement</strong> instantané suit une loi normale avec une composante drift (<K>{"\\mu"}</K>)
        et une composante aléatoire (<K>{"\\sigma \\times \\text{bruit}"}</K>). Cela implique que les <em>prix</em> suivent une
        distribution log-normale : ils ne peuvent jamais être négatifs.
        En énergie : le pétrole, le gaz, les forward d'électricité sont souvent modélisés par GBM en première approximation.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Équation différentielle stochastique (EDS)">
        <K display>{"dS = \\mu\\, S\\, dt + \\sigma\\, S\\, dW"}</K>
      </FormulaBox>

      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        <strong style={{ color: ACCENT }}>Décomposition terme à terme de <K>{"dS = \\mu S\\,dt + \\sigma S\\,dW"}</K> :</strong>
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: ACCENT }}><K>{"\\mu S\\,dt"}</K> — composante déterministe (drift) :</strong> Le prix "tend" à croître à taux <K>{"\\mu"}</K> par an.
          Si <K>{"\\sigma=0"}</K>, on aurait <K>{"dS = \\mu S\\,dt"}</K>, c'est-à-dire <K>{"S(t) = S_0 \\times e^{\\mu t}"}</K> — une croissance exponentielle pure.
          <K>{"\\mu"}</K> représente le rendement espéré annuel : pour les actions <K>{"\\mu \\approx 8\\text{-}12\\%"}</K>, pour les commodités <K>{"\\mu"}</K> dépend du modèle de pricing.
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: ACCENT }}><K>{"\\sigma S\\,dW"}</K> — composante aléatoire (diffusion) :</strong> L'amplitude du choc est <em>proportionnelle au prix</em>.
          Si S double, la volatilité absolue double aussi. C'est ce qui garantit que la <em>volatilité relative</em> (<K>{"\\sigma = \\sigma S / S"}</K>) reste constante.
          Un prix de 100€ avec <K>{"\\sigma=30\\%"}</K> fluctue de <K>{"\\pm 30"}</K>€/an, un prix de 200€ fluctue de <K>{"\\pm 60"}</K>€/an — même 30% relatif.
        </div>
        <div>
          <strong style={{ color: ACCENT }}>Conséquence :</strong> <K>{"dS/S = \\mu\\,dt + \\sigma\\,dW"}</K> → les rendements relatifs sont normaux, les prix sont log-normaux.
          C'est cohérent avec l'observation empirique : on ne modélise pas les prix en absolu, on modélise les rendements.
        </div>
      </div>

      <FormulaBox accent={ACCENT} label="Solution exacte (par lemme d'Itô)">
        <K display>{"S(t) = S_0 \\times \\exp\\!\\Big[\\Big(\\mu - \\frac{\\sigma^2}{2}\\Big)t + \\sigma\\, W(t)\\Big]"}</K>
      </FormulaBox>

      <IntuitionBlock emoji="📊" title="Loi log-normale de S_T : quantiles et probabilités" accent={ACCENT}>
        <K>{"S_T"}</K> suit une loi log-normale : <K>{"\\ln(S_T/S_0) \\sim \\mathcal{N}\\!\\big((\\mu - \\sigma^2/2)T,\\; \\sigma^2 T\\big)"}</K>.
        La médiane de <K>{"S_T"}</K> est <K>{"S_0 \\times \\exp\\!\\big((\\mu - \\sigma^2/2)T\\big)"}</K> — inférieure à l'espérance <K>{"S_0 \\times e^{\\mu T}"}</K>.
        <K>{"P(S_T > K) = N(d_2)"}</K> sous la mesure risque-neutre (avec <K>{"\\mu"}</K> remplacé par <K>{"r"}</K>) — c'est le <K>{"d_2"}</K> de Black-Scholes !
        Les queues sont asymétriques : les grandes hausses (right tail) sont plus probables que dans une loi normale.
      </IntuitionBlock>

      <SymbolLegend accent={ACCENT} symbols={[
        ['dS', 'Variation infinitésimale du prix'],
        ['µ', 'Drift : rendement espéré annuel (ex: 10%)'],
        ['σ', 'Volatilité : amplitude des fluctuations annuelles'],
        ['dW', 'Incrément brownien ~ N(0,dt)'],
        ['σ²/2', "Correction d'Itô (Jensen's inequality)"],
      ]} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="E[S(T)]" value={`${E_ST.toFixed(1)}`} unit={S0 === 100 ? '€' : ''} accent={ACCENT} />
        <InfoChip label="σ(S_T)" value={`${Vol_ST.toFixed(1)}`} accent={T.a5} />
        <InfoChip label="µ - σ²/2" value={(mu - 0.5 * sigma * sigma).toFixed(4)} accent={T.a4} />
      </div>

      <Grid cols={3} gap="10px">
        <Slider label="µ (drift)" value={mu} min={-0.3} max={0.5} step={0.01} onChange={setMu} accent={ACCENT} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ (volatilité)" value={sigma} min={0.05} max={0.8} step={0.01} onChange={setSigma} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="T (horizon)" value={T2} min={0.1} max={3} step={0.1} onChange={setT2} accent={T.a4} format={v => `${v.toFixed(1)}a`} />
        <Slider label="S₀" value={S0} min={50} max={200} step={5} onChange={setS0} accent={T.muted} format={v => `${v}€`} />
        <Slider label="Nb trajectoires" value={nPaths} min={1} max={7} step={1} onChange={setNPaths} accent={T.muted} format={v => v.toFixed(0)} />
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelles trajectoires</button>

      <SectionTitle accent={ACCENT}>Limites du GBM en marchés de l'énergie</SectionTitle>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 16px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Le GBM est une approximation — ses limites motivent les modèles avancés :</strong>
        <div style={{ marginTop: 10 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Pas de mean-reversion :</strong> Dans le GBM, si le prix monte à 150$/bbl, il peut continuer à monter indéfiniment.
            Or les prix pétroliers <em>reviennent</em> vers un coût marginal de production à long terme (~60-80$/bbl).
            → Ceci motive le modèle <strong>Ornstein-Uhlenbeck</strong> (onglet Mean-Reversion).
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Pas de sauts :</strong> Le GBM génère des trajectoires continues. Mais le gaz naturel peut tripler en une nuit
            lors d'une vague de froid extrême, et le pétrole peut chuter de 30% sur une décision OPEP.
            → Ceci motive le modèle <strong>MRJD</strong> (Mean-Reverting Jump Diffusion, onglet Processus à Saut).
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Volatilité constante :</strong> Dans le GBM, σ est fixe. En réalité, la volatilité implicite varie avec le strike
            (smile de volatilité) et le temps (structure par terme). Le prix du call dépend de quel σ on utilise.
            → Ceci motive les modèles à volatilité stochastique comme <strong>Heston</strong>.
          </div>
          <div>
            <strong>Loi log-normale pure :</strong> Les queues de distribution empiriques sont plus épaisses ("fat tails") que
            la log-normale. Les événements extrêmes arrivent plus souvent qu'ils ne devraient.
          </div>
        </div>
      </div>

      <Accordion title="Exercice — Simulation GBM à la main (1 an, 4 trimestres)" accent={ACCENT} badge="Entraînement">
        <p style={{ color: T.text }}>S₀ = 100€, µ = 10%, σ = 20%, T = 1 an, N = 4 pas (Δt = 0.25). Réalisations Z = +0.6, -0.4, +1.1, -0.2.</p>
        <FormulaBox accent={ACCENT}><K>{"S(1) = 127.51\\text{€},\\; \\ln(127.51/100) = +24.6\\%"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Solution exacte du GBM" ruleDetail="S(tᵢ) = S(tᵢ₋₁)·exp[(µ−σ²/2)Δt + σ√Δt·Z]" accent={ACCENT}>Formule : <K>{"S(t_i) = S(t_{i-1}) \\times \\exp\\!\\big[(\\mu - \\tfrac{\\sigma^2}{2})\\Delta t + \\sigma\\sqrt{\\Delta t}\\,Z\\big]"}</K></DemoStep>
          <DemoStep num={2} rule="Solution exacte du GBM" ruleDetail="drift ajusté (µ−σ²/2)Δt" accent={ACCENT}>Drift ajusté : <K>{"(\\mu - \\sigma^2/2)\\Delta t = (0.10 - 0.02)\\times 0.25 = 0.02"}</K></DemoStep>
          <DemoStep num={3} rule="Euler-Maruyama" ruleDetail="σ√Δt" accent={ACCENT}><K>{"\\sigma\\sqrt{\\Delta t} = 0.20 \\times 0.5 = 0.10"}</K></DemoStep>
          <DemoStep num={4} rule="Solution exacte du GBM" ruleDetail="S(0.25)" accent={ACCENT}><K>{"S(0.25) = 100 \\times e^{0.08} = 108.33\\text{€}"}</K></DemoStep>
          <DemoStep num={5} rule="Solution exacte du GBM" ruleDetail="S(0.50)" accent={ACCENT}><K>{"S(0.50) = 108.33 \\times e^{0.016} = 109.98\\text{€}"}</K></DemoStep>
          <DemoStep num={6} rule="Solution exacte du GBM" ruleDetail="S(0.75)" accent={ACCENT}><K>{"S(0.75) = 109.98 \\times e^{0.13} = 125.24\\text{€}"}</K></DemoStep>
          <DemoStep num={7} rule="Solution exacte du GBM" ruleDetail="S(1.00)" accent={ACCENT}><K>{"S(1.00) = 125.24 \\times e^{0.018} = 127.51\\text{€}"}</K>. <K>{"E[S_1] = 100 \\times e^{0.10} = 110.5\\text{€}"}</K> (1 trajectoire ≠ espérance).</DemoStep>
        </Demonstration>
      </Accordion>

      <ChartWrapper title={`GBM : S₀=${S0}€, µ=${(mu * 100).toFixed(0)}%, σ=${(sigma * 100).toFixed(0)}%, T=${T2.toFixed(1)}a`} accent={ACCENT} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" domain={[0, T2]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Temps (années)', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <ReferenceLine y={S0} stroke={T.border} strokeDasharray="3 3" />
            <ReferenceLine y={E_ST} stroke={ACCENT} strokeDasharray="6 3" label={{ value: `E[S_T]=${E_ST.toFixed(0)}`, fill: ACCENT, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            {paths.map((p, i) => (
              <Line key={i} data={p} type="monotone" dataKey="S" stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} dot={false} name={`S${i + 1}(t)`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  )
}

export function MonteCarloTab() {
  const [S, setS] = useState(100)
  const [strike, setStrike] = useState(105)
  const [T2, setT2] = useState(1)
  const [r, setR] = useState(0.05)
  const [sigma, setSigma] = useState(0.25)
  const [nSim, setNSim] = useState(5000)
  const [key, setKey] = useState(0)

  const { mcCall, mcPut, histData } = useMemo(() => {
    const payoffsCall = [], payoffsPut = []
    const sqrtT = Math.sqrt(T2)
    const drift = (r - 0.5 * sigma * sigma) * T2
    for (let i = 0; i < nSim; i++) {
      const ST = S * Math.exp(drift + sigma * sqrtT * gaussRand())
      payoffsCall.push(Math.max(ST - strike, 0))
      payoffsPut.push(Math.max(strike - ST, 0))
    }
    const df = Math.exp(-r * T2)
    const mcCall = df * payoffsCall.reduce((a, b) => a + b, 0) / nSim
    const mcPut = df * payoffsPut.reduce((a, b) => a + b, 0) / nSim

    // Histogram of call payoffs
    const bins = {}
    const bw = Math.max(5, Math.round(strike * 0.05))
    payoffsCall.forEach(p => {
      const bin = Math.round(p / bw) * bw
      bins[bin] = (bins[bin] || 0) + 1
    })
    const histData = Object.entries(bins)
      .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
      .map(([payoff, count]) => ({ payoff: parseFloat(payoff).toFixed(0), count, pct: (count / nSim * 100).toFixed(1) }))

    return { mcCall, mcPut, histData }
  }, [S, strike, T2, r, sigma, nSim, key])

  const bsCall = bs(S, strike, T2, r, sigma, 'call')
  const bsPut = bs(S, strike, T2, r, sigma, 'put')
  const error = Math.abs(mcCall - bsCall)

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Pourquoi Monte Carlo pour les options ?</strong> La formule de Black-Scholes donne une solution analytique
        élégante mais uniquement pour des options <em>européennes vanilles</em> sur un GBM. Dans la réalité des marchés d'énergie,
        les situations nécessitant Monte Carlo sont légion :
        options asiatiques (payoff = moyenne des prix sur une période),
        options à barrière (activation/désactivation selon la trajectoire),
        options sur spread (différence entre deux prix), swing options, modèles à volatilité stochastique (Heston), MRJD.
        Monte Carlo est une <strong>méthode universelle</strong> : si on peut simuler le processus, on peut pricer l'option.
        Son seul défaut : la lenteur (erreur en 1/√N).
      </div>

      <IntuitionBlock emoji="🎰" title="Monte Carlo : simuler 10 000 futurs possibles" accent={ACCENT}>
        Monte Carlo pricing : on simule N trajectoires du prix à maturité, on calcule le payoff
        pour chaque trajectoire, et on prend la moyenne actualisée.
        La loi des grands nombres garantit la convergence vers le vrai prix quand N → ∞.
        L'erreur standard diminue comme σ/√N → doubler la précision coûte 4× plus de simulations.
        En énergie : Monte Carlo est incontournable pour les options path-dependent (asiatiques, lookback...).
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Monte Carlo Pricing">
        <K display>{"C_{MC} = e^{-rT} \\times \\frac{1}{N} \\sum_{i=1}^{N} \\max\\bigl(S_T^{(i)} - K,\\, 0\\bigr)"}</K>
        <K display>{"S_T^{(i)} = S_0 \\times \\exp\\!\\bigl[(r - \\sigma^2/2)\\,T + \\sigma\\sqrt{T}\\, Z_i\\bigr], \\quad Z_i \\sim \\mathcal{N}(0,1)"}</K>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Discrétisation de l'EDS : schéma d'Euler-Maruyama</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Pour les modèles sans solution analytique (MRJD, Heston, etc.), on discrétise l'EDS en N pas de temps.
      </div>
      <FormulaBox accent={ACCENT} label="Schéma d'Euler-Maruyama vs Solution exacte">
        <K display>{"\\text{Euler : } S(t{+}\\Delta t) \\approx S(t) + \\mu\\, S(t)\\,\\Delta t + \\sigma\\, S(t)\\,\\sqrt{\\Delta t}\\, Z"}</K>
        <K display>{"\\text{Exacte : } S(t{+}\\Delta t) = S(t) \\times \\exp\\!\\bigl[(\\mu - \\sigma^2/2)\\,\\Delta t + \\sigma\\sqrt{\\Delta t}\\, Z\\bigr]"}</K>
        Euler : approximation d'ordre 1, biais pour les grands Δt
        Exacte : utiliser quand disponible (GBM, OU) — pas de biais de discrétisation
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Quand utiliser Euler vs solution exacte ?</strong>
        <div style={{ marginTop: 6 }}>
          Solution exacte disponible pour : GBM (log-normal), OU (Ornstein-Uhlenbeck) — préférer toujours la solution exacte car pas de biais de Δt.
          Euler-Maruyama nécessaire pour : MRJD (sauts + diffusion), Heston (vol stochastique), tout modèle à coefficients non-linéaires.
          Règle pratique : avec Euler, utiliser N ≥ 252 pas (journalier) pour 1 an. Pour options asiatiques ou barrières : N ≥ 504 (semi-journalier) pour limiter le biais de discrétisation.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Erreur Monte Carlo et techniques de réduction de variance</SectionTitle>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: ACCENT }}>Erreur standard :</strong> SE = σ_payoff / √N. IC 95% : Prix ± 1.96 × SE. Doubler la précision → ×4 le coût CPU.
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: ACCENT }}>Variables antithétiques :</strong> Pour chaque Z, calculer aussi le payoff avec -Z. La corrélation négative entre payoff(Z) et payoff(-Z) réduit la variance. Réduction typique : 30-70%. Coût : nul (même N simulations).
        </div>
        <div>
          <strong style={{ color: ACCENT }}>Variables de contrôle :</strong> Utiliser le call B-S (dont on connaît le vrai prix) comme variable de contrôle pour un call asiatique ou exotique. C_ajusté = C_MC^exotique + (C_BS_vrai - C_MC^vanilla). Réduction : jusqu'à 95% de variance sur des payoffs similaires.
        </div>
      </div>

      <Grid cols={3} gap="8px">
        <Slider label="S₀" value={S} min={60} max={160} step={1} onChange={setS} accent={ACCENT} format={v => `${v}€`} />
        <Slider label="K" value={strike} min={60} max={160} step={1} onChange={setStrike} accent={T.a5} format={v => `${v}€`} />
        <Slider label="T" value={T2} min={0.1} max={3} step={0.1} onChange={setT2} accent={T.muted} format={v => `${v.toFixed(1)}a`} />
        <Slider label="r" value={r} min={0} max={0.12} step={0.005} onChange={setR} accent={T.muted} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="σ" value={sigma} min={0.05} max={0.7} step={0.01} onChange={setSigma} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="N simulations" value={nSim} min={500} max={20000} step={500} onChange={setNSim} accent={ACCENT} format={v => `${v.toFixed(0)}`} />
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelle simulation</button>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="Call MC" value={mcCall.toFixed(4)} unit="€" accent={ACCENT} />
        <InfoChip label="Call BS" value={bsCall.toFixed(4)} unit="€" accent={T.a5} />
        <InfoChip label="Erreur |MC-BS|" value={error.toFixed(4)} unit="€" accent={T.a2} />
        <InfoChip label="Put MC" value={mcPut.toFixed(4)} unit="€" accent={T.a3} />
        <InfoChip label="Put BS" value={bsPut.toFixed(4)} unit="€" accent={T.muted} />
        <InfoChip label="Err std ≈" value={`${(bsCall * 0.1 / Math.sqrt(nSim / 100)).toFixed(4)}`} accent={T.muted} />
      </div>

      <Accordion title="Exercice — Pricing d'un straddle par Monte Carlo" accent={ACCENT} badge="Entraînement">
        <p style={{ color: T.text }}>
          Un straddle = call + put (même strike, même maturité). S₀ = 100€, K = 100€, T = 0.5 an, r = 3%, σ = 25%.
          Calculez le prix du straddle par Monte Carlo et par B-S.
        </p>
        <FormulaBox accent={ACCENT}>Straddle ≈ 12.30€ = 12.3% de S₀ — "le marché anticipe un mouvement de ±12.3% sur 6 mois"</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Loi des grands nombres" ruleDetail="Payoff = |S_T − K|" accent={ACCENT}>Payoff straddle = max(S_T - 100, 0) + max(100 - S_T, 0) = |S_T - 100|</DemoStep>
          <DemoStep num={2} rule="Actualisation risque-neutre" ruleDetail="S_T = S₀·exp[(r−σ²/2)T+σ√TZ]" accent={ACCENT}>Simulation : S_T = 100 × exp[(0.03 - 0.03125) × 0.5 + 0.25 × √0.5 × Z]</DemoStep>
          <DemoStep num={3} rule="Actualisation risque-neutre" ruleDetail="Drift risque-neutre" accent={ACCENT}>= 100 × exp[-0.00063 + 0.17678 × Z]</DemoStep>
          <DemoStep num={4} rule="Formule de Black-Scholes" ruleDetail="C = S·N(d₁)−K·e^(−rT)·N(d₂)" accent={ACCENT}>Par B-S : C_BS = bs(100, 100, 0.5, 0.03, 0.25, 'call') ≈ 6.88€</DemoStep>
          <DemoStep num={5} rule="Parité put-call" ruleDetail="P = C − S + K·e^(−rT)" accent={ACCENT}>P_BS = bs(100, 100, 0.5, 0.03, 0.25, 'put') ≈ 5.42€ (parité put-call)</DemoStep>
          <DemoStep num={6} rule="Loi des grands nombres" ruleDetail="Convergence MC → BS" accent={ACCENT}>Prix straddle B-S = C + P ≈ 6.88 + 5.42 = 12.30€. Le prix du straddle est une mesure directe de la volatilité attendue par le marché.</DemoStep>
        </Demonstration>
      </Accordion>

      <ChartWrapper title={`Distribution des payoffs du call (${nSim} simulations)`} accent={ACCENT} height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="payoff" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} label={{ value: 'Payoff (€)', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Bar dataKey="count" fill={ACCENT} fillOpacity={0.8} name="Fréquence" />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  )
}

// ─── Math helpers (local) ─────────────────────────────────────────────────────
function gaussRandM4() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
