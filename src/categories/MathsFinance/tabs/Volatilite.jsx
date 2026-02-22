import React, { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  ReferenceLine,
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

const ACCENT = T.a5


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

function bsCall(S, K, T, r, sigma) {
  if (T <= 0) return Math.max(S - K, 0)
  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT
  return S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2)
}

// Newton-Raphson implied vol

function impliedVol(C, S, K, T, r, tol = 1e-6, maxIter = 100) {
  let sigma = 0.3
  for (let i = 0; i < maxIter; i++) {
    const sqrtT = Math.sqrt(T)
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT)
    const price = bsCall(S, K, T, r, sigma)
    const vega = S * phi(d1) * sqrtT
    const diff = price - C
    if (Math.abs(diff) < tol) return sigma
    sigma -= diff / vega
    if (sigma < 0.001) sigma = 0.001
    if (sigma > 5) return NaN
  }
  return sigma
}


// ─── Tab: Vol Historique ──────────────────────────────────────────────────────

export function HistVolTab() {
  const [window2, setWindow2] = useState(21)
  const [sigma, setSigma] = useState(0.25)
  const [nDays, setNDays] = useState(252)
  const [key, setKey] = useState(0)

  const { returns, prices, rollingVol } = useMemo(() => {
    let S = 100
    const prices = [{ t: 0, S: 100 }]
    const returns = []
    for (let i = 1; i <= nDays; i++) {
      const r = (sigma / Math.sqrt(252)) * gaussRand()
      S *= Math.exp(r)
      if (i % 2 === 0) prices.push({ t: i, S: +S.toFixed(2) })
      returns.push(r)
    }
    // Rolling volatility
    const rollingVol = []
    for (let i = window2; i <= returns.length; i++) {
      const slice = returns.slice(i - window2, i)
      const mean = slice.reduce((a, b) => a + b, 0) / window2
      const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / (window2 - 1)
      rollingVol.push({ t: i, vol: +(Math.sqrt(variance * 252) * 100).toFixed(2) })
    }
    return { returns, prices, rollingVol }
  }, [window2, sigma, nDays, key])

  const histVol = useMemo(() => {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1)
    return Math.sqrt(variance * 252)
  }, [returns])

  const histogram = useMemo(() => {
    const bins = {}
    const bw = 0.003
    returns.forEach(r => {
      const bin = (Math.round(r / bw) * bw).toFixed(3)
      bins[bin] = (bins[bin] || 0) + 1
    })
    return Object.entries(bins).sort(([a], [b]) => parseFloat(a) - parseFloat(b))
      .map(([r, count]) => ({ r, count }))
  }, [returns])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La volatilité est la mesure centrale du risque en finance des options. Comprendre ses deux visages — <strong style={{ color: ACCENT }}>historique</strong> (ce que le marché a fait dans le passé) et <strong style={{ color: ACCENT }}>implicite</strong> (ce que le marché anticipe pour le futur) — est indispensable pour le pricing et le risk management. Sans une bonne compréhension de la volatilité, il est impossible de pricer une option correctement ou de gérer un book d'options.
      </div>

      <IntuitionBlock emoji="📊" title="La volatilité historique : mesurer les fluctuations passées" accent={ACCENT}>
        La volatilité historique mesure l'amplitude des rendements passés.
        C'est l'écart-type des log-rendements quotidiens, multiplié par <K>{"\\sqrt{252}"}</K> pour annualiser.
        Elle répond à : "À quelle vitesse ce prix a-t-il bougé ces dernières semaines ?"
        En énergie, la vol peut varier dramatiquement (pétrole : 20-80% selon les crises).
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Volatilité Historique Annualisée">
        <K display>{"r_t = \\ln\\!\\left(\\frac{S_t}{S_{t-1}}\\right) \\quad \\text{(log-rendement quotidien)}"}</K>
        <K display>{"\\bar{r} = \\frac{1}{n} \\sum r_t"}</K>
        <K display>{"\\sigma^2_{daily} = \\frac{1}{n-1} \\sum (r_t - \\bar{r})^2"}</K>
        <K display>{"\\sigma_{ann} = \\sigma_{daily} \\times \\sqrt{252}"}</K>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Calcul pas à pas de la volatilité historique</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Voici comment calculer concrètement la volatilité historique à partir d'une série de prix :
      </div>
      <ExampleBlock title="Calcul pas à pas — Données journalières" accent={ACCENT}>
        <p style={{ color: T.muted, fontSize: 13 }}>Calculer la volatilité historique annualisée à partir d'une série de prix journaliers.</p>
        <FormulaBox accent={ACCENT} label="Résultat">
          <K display>{"\\sigma_{ann} = \\sigma_{daily} \\times \\sqrt{252}"}</K>
        </FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Log-rendements" ruleDetail="rᵢ = ln(Sᵢ/Sᵢ₋₁)" accent={ACCENT}>
            <strong>Calculer les log-rendements :</strong> <K>{"r_i = \\ln\\!\\left(\\frac{S_i}{S_{i-1}}\\right)"}</K>. Par exemple, si S₀ = 100 et S₁ = 102, alors r₁ = ln(102/100) = 0.0198. On utilise les log-rendements (et non les rendements simples) car ils sont additifs dans le temps et symétriques pour les hausses/baisses.
          </DemoStep>
          <DemoStep num={2} rule="Moyenne arithmétique" ruleDetail="r̄ = (1/n) Σ rᵢ" accent={ACCENT}>
            <strong>Calculer la moyenne :</strong> <K>{"\\bar{r} = \\frac{1}{n} \\sum_i r_i"}</K>. Sur un horizon court, <K>{"\\bar{r} \\approx 0"}</K> (le drift journalier est négligeable devant la vol). Sur <K>{"n=252"}</K> jours avec <K>{"\\mu_{ann}=5\\%"}</K>, <K>{"\\bar{r}_{daily} \\approx 0.0002"}</K>.
          </DemoStep>
          <DemoStep num={3} rule="Variance de Bessel" ruleDetail="σ² = Σ(rᵢ−r̄)²/(n−1)" accent={ACCENT}>
            <strong>Calculer la variance quotidienne :</strong> <K>{"\\hat{\\sigma}^2_{daily} = \\frac{1}{n-1} \\sum_i (r_i - \\bar{r})^2"}</K>. On divise par (n-1) et non n pour avoir un estimateur sans biais (correction de Bessel). Exemple : avec <K>{"n=21"}</K> jours et <K>{"\\sum(r_i - \\bar{r})^2 = 0.0084"}</K>, on obtient <K>{"\\hat{\\sigma}^2_{daily} = 0.0084/20 = 0.00042"}</K>, soit <K>{"\\hat{\\sigma}_{daily} = 2.05\\%"}</K>.
          </DemoStep>
          <DemoStep num={4} rule="Annualisation √252" ruleDetail="σ_ann = σ_daily × √252" accent={ACCENT}>
            <strong>Annualiser :</strong> <K>{"\\sigma_{ann} = \\sigma_{daily} \\times \\sqrt{252}"}</K>. Si <K>{"\\sigma_{daily} = 2.05\\%"}</K>, alors <K>{"\\sigma_{ann} = 2.05\\% \\times \\sqrt{252} \\approx 32.5\\%"}</K>. Le facteur <K>{"\\sqrt{252}"}</K> vient du scaling de la variance : si les rendements sont iid, <K>{"\\text{Var}(\\text{rendement annuel}) = 252 \\times \\text{Var}(\\text{rendement daily})"}</K>, donc <K>{"\\sigma_{ann} = \\sqrt{252} \\times \\sigma_{daily}"}</K>.
          </DemoStep>
        </Demonstration>
      </ExampleBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Pourquoi <K>{"\\sqrt{252}"}</K> ?</strong> La variance est additive dans le temps (pour des rendements indépendants). Sur T jours, <K>{"\\sigma^2_T = T \\times \\sigma^2_{daily}"}</K>. Donc <K>{"\\sigma_T = \\sigma_{daily} \\times \\sqrt{T}"}</K>. Il y a 252 jours de trading par an (hors week-ends et jours fériés). Le facteur de scaling <K>{"\\sqrt{252} \\approx 15.87"}</K> est donc la conversion standard daily → annuel.
      </div>

      <IntuitionBlock emoji="🌊" title="Volatility Clustering — ARCH/GARCH" accent={ACCENT}>
        Un fait stylisé fondamental des marchés financiers : <strong>les périodes de forte volatilité ont tendance à se suivre</strong>, et les périodes calmes aussi. Ce phénomène s'appelle le "volatility clustering". Les marchés calmes restent calmes, les marchés agités restent agités. Cela implique que la volatilité est <em>autocorrélée</em> — ce que les modèles ARCH (Engle, 1982) et GARCH (Bollerslev, 1986) capturent. En énergie, ce clustering est particulièrement prononcé : un choc géopolitique crée des semaines de vol élevée, puis le marché se stabilise.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Fenêtre d'estimation : quel passé utiliser ?</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Le choix de la fenêtre d'estimation est un trade-off fondamental. Une fenêtre trop courte réagit vite aux chocs mais est instable. Une fenêtre trop longue est stable mais lente à réagir.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: '30 jours', desc: 'Très réactive. Idéale pour le trading intraday et les options court terme. Très bruitée.', color: T.a3 },
          { label: '60 jours', desc: 'Compromis standard. Bon équilibre réactivité/stabilité. Utilisée pour les options 1-3 mois.', color: ACCENT },
          { label: '252 jours', desc: 'Vol annualisée sur 1 an. Stable, utilisée pour le pricing long terme et la réglementation.', color: T.a4 },
        ].map(s => (
          <div key={s.label} style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: T.muted, fontSize: 12 }}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>En énergie :</strong> les fenêtres courtes (21-30 jours) sont souvent préférées car la volatilité change rapidement — saisonnalité (hiver/été pour le gaz), événements géopolitiques (décisions OPEP), phénomènes météo (ouragans pour le WTI). Une fenêtre de 252 jours lisse trop ces variations importantes.
      </div>

      <Accordion title="Exercice — Calcul de volatilité historique step-by-step" accent={ACCENT} badge="Moyen">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Données :</strong> 6 prix journaliers WTI ($/bbl) : 80.00, 81.20, 79.50, 82.10, 81.80, 83.00.
          <br /><br />
          <strong>Étape 1 — Log-rendements :</strong><br />
          <K>{"r_1 = \\ln(81.20/80.00) = 0.01489"}</K><br />
          <K>{"r_2 = \\ln(79.50/81.20) = -0.02113"}</K><br />
          <K>{"r_3 = \\ln(82.10/79.50) = 0.03218"}</K><br />
          <K>{"r_4 = \\ln(81.80/82.10) = -0.00365"}</K><br />
          <K>{"r_5 = \\ln(83.00/81.80) = 0.01458"}</K><br /><br />
          <strong>Étape 2 — Moyenne :</strong> <K>{"\\bar{r} = \\frac{0.01489 - 0.02113 + 0.03218 - 0.00365 + 0.01458}{5} = 0.00737"}</K><br /><br />
          <strong>Étape 3 — Variance (n-1 = 4) :</strong><br />
          <K>{"\\sum(r_i - \\bar{r})^2 = 0.0000565 + 0.0008122 + 0.0006155 + 0.0001215 + 0.0000520 = 0.0016577"}</K><br />
          <K>{"\\sigma^2_{daily} = 0.0016577 / 4 = 0.000414"}</K> → <K>{"\\sigma_{daily} = 2.035\\%"}</K><br /><br />
          <strong>Étape 4 — Annualisation :</strong> <K>{"\\sigma_{ann} = 2.035\\% \\times \\sqrt{252} = 2.035\\% \\times 15.875"}</K> = <strong style={{ color: ACCENT }}>32.3%</strong>
        </div>
      </Accordion>

      <Accordion title="Exercice — Volatilité EWMA (pondération exponentielle)" accent={ACCENT} badge="Difficile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Principe :</strong> Dans EWMA (Exponentially Weighted Moving Average), on donne plus de poids aux données récentes via un facteur de décroissance <K>{"\\lambda"}</K> (RiskMetrics™ utilise <K>{"\\lambda = 0.94"}</K> pour des données journalières).<br /><br />
          <strong>Formule récursive :</strong> <K>{"\\sigma^2_t = \\lambda \\, \\sigma^2_{t-1} + (1-\\lambda) \\, r^2_{t-1}"}</K><br /><br />
          <strong>Intuition :</strong> Les poids décroissent exponentiellement : le jour t-1 a un poids <K>{"(1-\\lambda)"}</K>, le jour t-2 a un poids <K>{"\\lambda(1-\\lambda)"}</K>, etc.<br /><br />
          <strong>Avantage :</strong> Très réactif aux chocs récents. La demi-vie de l'information est <K>{"\\frac{\\ln 0.5}{\\ln \\lambda} \\approx 11"}</K> jours pour <K>{"\\lambda=0.94"}</K>.<br /><br />
          <strong>Calcul exemple (<K>{"\\lambda=0.94"}</K>, <K>{"\\sigma^2_0 = 0.0004"}</K>) :</strong><br />
          <K>{"r_1 = 0.025"}</K> → <K>{"\\sigma^2_1 = 0.94 \\times 0.0004 + 0.06 \\times 0.025^2 = 0.000414"}</K><br />
          <K>{"\\sigma_{1,daily} = 2.03\\%"}</K> → <K>{"\\sigma_{1,ann} = 32.2\\%"}</K><br /><br />
          <strong>Usage :</strong> EWMA est la base de RiskMetrics™ (JP Morgan, 1994), largement utilisé pour la VaR en énergie car il réagit vite aux changements de régime de vol.
        </div>
      </Accordion>

      <Grid cols={3} gap="8px">
        <Slider label="σ vraie" value={sigma} min={0.1} max={0.8} step={0.01} onChange={setSigma} accent={ACCENT} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="Fenêtre rolling (jours)" value={window2} min={5} max={63} step={1} onChange={setWindow2} accent={T.a4} format={v => `${v}j`} />
        <Slider label="Horizon (jours)" value={nDays} min={63} max={504} step={21} onChange={setNDays} accent={T.muted} format={v => `${v}j`} />
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelle série</button>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        <InfoChip label="σ_hist (total)" value={`${(histVol * 100).toFixed(1)}%`} accent={ACCENT} />
        <InfoChip label="σ vraie" value={`${(sigma * 100).toFixed(0)}%`} accent={T.muted} />
      </div>

      <Grid cols={2} gap="12px">
        <ChartWrapper title="Prix simulé" accent={ACCENT} height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={prices} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="t" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <Line type="monotone" dataKey="S" stroke={ACCENT} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Volatilité rolling (annualisée)" accent={T.a4} height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rollingVol} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="t" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} unit="%" />
              <ReferenceLine y={sigma * 100} stroke={ACCENT} strokeDasharray="4 3" label={{ value: 'σ vraie', fill: ACCENT, fontSize: 10 }} />
              <Line type="monotone" dataKey="vol" stroke={T.a4} strokeWidth={1.5} dot={false} name="Vol rolling" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>
    </div>
  )
}

export function ImplVolTab() {
  const [S, setS] = useState(100)
  const [strike, setStrike] = useState(100)
  const [T2, setT2] = useState(0.5)
  const [r, setR] = useState(0.04)
  const [marketPrice, setMarketPrice] = useState(6)

  const iv = useMemo(() => impliedVol(marketPrice, S, strike, T2, r), [marketPrice, S, strike, T2, r])
  const bsPrice = bsCall(S, strike, T2, r, iv || 0.3)

  // Price vs vol
  const priceVsVol = useMemo(() => {
    const pts = []
    for (let sig = 0.05; sig <= 0.8; sig += 0.01) {
      pts.push({ sigma: +(sig * 100).toFixed(0), price: +bsCall(S, strike, T2, r, sig).toFixed(4) })
    }
    return pts
  }, [S, strike, T2, r])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La volatilité implicite est le <strong style={{ color: ACCENT }}>message que le marché envoie aux traders</strong>. Si le marché cote une option à un certain prix, on peut "inverser" la formule Black-Scholes pour trouver la volatilité que le marché "pense" — c'est-à-dire la volatilité future anticipée. C'est un processus d'inversion numérique, car il n'existe pas de formule fermée pour <K>{"\\sigma"}</K> en fonction du prix.
      </div>

      <IntuitionBlock emoji="🔍" title="La vol implicite : ce que le marché 'pense'" accent={ACCENT}>
        La volatilité implicite est l'inverse : donné un prix de marché observé pour l'option,
        quelle volatilité faut-il injecter dans Black-Scholes pour retrouver ce prix ?
        C'est la "prévision" du marché de la volatilité future.
        Quand les options sont chères → vol implicite haute → "le marché craint la volatilité".
        En énergie : la vol implicite monte avant les annonces OPEC, les cyclones, etc.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Vol implicite = racine de l'équation">
        <K display>{"\\text{Trouver }\\sigma_{impl}\\text{ tel que : }BS(S,\\,K,\\,T,\\,r,\\,\\sigma_{impl}) = C_{\\text{marché}}"}</K>
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Algorithme Newton-Raphson (itération)">
        <K display>{"\\sigma_{n+1} = \\sigma_n - \\frac{BS(\\sigma_n) - C_{\\text{marché}}}{\\text{Vega}(\\sigma_n)}"}</K>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Newton-Raphson pour la vol implicite — étape par étape</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Newton-Raphson est un algorithme d'optimisation qui converge rapidement (quadratiquement). L'idée est simple : partant d'une estimation initiale <K>{"\\sigma_0"}</K>, on calcule le prix <K>{"BS(\\sigma_0)"}</K>, on compare au prix de marché, et on corrige en divisant l'erreur par le Vega (la sensibilité du prix à la vol).
      </div>
      <ExampleBlock title="Newton-Raphson — Recherche de σ_impl" accent={ACCENT}>
        <p>Call sur WTI : <K>{"S=80,\\; K=80,\\; T=0.25"}</K>an, <K>{"r=4\\%"}</K>, <K>{"C_{\\text{marché}}=4.50\\$"}</K>. Chercher <K>{"\\sigma_{impl}"}</K>.</p>
        <FormulaBox accent={ACCENT} label="Résultat">
          <K display>{"\\sigma_{impl} \\approx 34.1\\%"}</K>
        </FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Newton-Raphson" ruleDetail="σₙ₊₁ = σₙ − (BS−C)/Vega" accent={ACCENT}>Initialisation : <K>{"\\sigma_0 = 0.30"}</K> (30%). Calculer <K>{"BS(\\sigma_0) = 3.86\\$"}</K>. Erreur <K>{"= 3.86 - 4.50 = -0.64\\$"}</K>. <K>{"\\text{Vega}(\\sigma_0) = S \\times \\phi(d_1) \\times \\sqrt{T} = 80 \\times 0.3989 \\times 0.5 = 15.96"}</K>. Correction : <K>{"\\Delta\\sigma = +0.040"}</K>.</DemoStep>
          <DemoStep num={2} rule="Newton-Raphson" ruleDetail="Itération convergente" accent={ACCENT}>Itération 1 : <K>{"\\sigma_1 = 0.30 + 0.040 = 0.340"}</K> (34%). <K>{"BS(\\sigma_1) \\approx 4.48\\$"}</K>. Erreur <K>{"= -0.02\\$"}</K>. Très proche ! <K>{"\\text{Vega} \\approx 16.1"}</K>. Correction : <K>{"\\Delta\\sigma = 0.02/16.1 \\approx +0.001"}</K>.</DemoStep>
          <DemoStep num={3} rule="Newton-Raphson" ruleDetail="Convergence quadratique" accent={ACCENT}>Itération 2 : <K>{"\\sigma_2 = 0.341"}</K> (34.1%). <K>{"BS(\\sigma_2) \\approx 4.498\\$ \\approx 4.50\\$"}</K>. Convergence atteinte en seulement 2-3 itérations !</DemoStep>
          <DemoStep num={4} rule="Vega" ruleDetail="∂C/∂σ = S·ϕ(d₁)·√T" accent={ACCENT}>Résultat : <K>{"\\sigma_{impl} \\approx 34.1\\%"}</K>. Le marché anticipe une volatilité annualisée de 34% pour le WTI sur les 3 prochains mois.</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Vol historique vs Vol implicite — Comparaison</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Vol Historique (réalisée)', items: ['Calculée à partir des prix passés', 'Regarde en arrière (backward-looking)', 'Objective et mesurable', 'Disponible sans marché d\'options', 'Stable mais lente à réagir'], color: T.a4 },
          { label: 'Vol Implicite (de marché)', items: ['Extraite des prix d\'options cotées', 'Regarde en avant (forward-looking)', 'Subjective — reflète les anticipations', 'Nécessite un marché d\'options actif', 'Réactive mais contient une prime de risque'], color: ACCENT },
        ].map(s => (
          <div key={s.label} style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>{s.label}</div>
            {s.items.map((item, i) => <div key={i} style={{ color: T.muted, fontSize: 12, marginBottom: 4 }}>• {item}</div>)}
          </div>
        ))}
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Volatility Risk Premium :</strong> En moyenne, <K>{"\\sigma_{impl} > \\sigma_{hist}"}</K>. Cet écart systématique s'appelle la prime de risque de volatilité. Les marchés paient une prime pour la couverture — les vendeurs d'options (qui acceptent le risque) exigent une compensation. En énergie, cette prime est souvent de 3-8 points de vol. C'est la base du "vol selling" (vente de vol) comme stratégie.
      </div>

      <ExampleBlock title="VIX — l'indice de peur du marché" accent={ACCENT}>
        <p>Le VIX mesure la volatilité implicite du S&P500 à 30 jours. C'est le "baromètre de la peur" des marchés.</p>
        <FormulaBox accent={ACCENT} label="Résultat">
          <K display>{"VIX^2 \\approx \\frac{2}{T} \\sum \\left[\\frac{\\Delta K}{K^2} \\cdot e^{rT} \\cdot Q(K)\\right]"}</K>
        </FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Implied vol" ruleDetail="Extraction depuis prix d'options" accent={ACCENT}>Construction : on observe les prix de toutes les options (calls et puts) sur le S&P500 avec maturité proche de 30 jours.</DemoStep>
          <DemoStep num={2} rule="Implied vol" ruleDetail="VIX² = (2/T) Σ ΔK/K² · e^(rT) · Q(K)" accent={ACCENT}>Calcul : <K>{"VIX^2 \\approx \\frac{2}{T} \\sum \\left[\\frac{\\Delta K}{K^2} \\cdot e^{rT} \\cdot Q(K)\\right]"}</K> — une moyenne pondérée des prix d'options pour tous les strikes, sans hypothèse de modèle.</DemoStep>
          <DemoStep num={3} rule="Implied vol" ruleDetail="Baromètre de la peur" accent={ACCENT}>Interprétation : <K>{"VIX=20"}</K> signifie que le marché anticipe une vol annualisée de 20% pour le S&P500 sur le prochain mois. <K>{"VIX > 30"}</K> = anxiété. <K>{"VIX > 40"}</K> = panique (ex: Covid mars 2020).</DemoStep>
          <DemoStep num={4} rule="Implied vol" ruleDetail="OVX = VIX pétrole" accent={ACCENT}>En énergie : l'OVX (Oil VIX) joue le même rôle pour le WTI. Il peut atteindre 80-100% lors des crises pétrolières majeures (Covid 2020 : OVX à 325% !)</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <Accordion title="Exercice — Calculer σ_impl par bisection step-by-step" accent={ACCENT} badge="Moyen">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Méthode de bisection :</strong> Plus robuste que Newton-Raphson (toujours converge), moins rapide. On encadre la solution entre <K>{"\\sigma_{low}"}</K> et <K>{"\\sigma_{high}"}</K>.<br /><br />
          <strong>Données :</strong> Put WTI <K>{"K=75,\\; S=80,\\; T=0.5"}</K>an, <K>{"r=3\\%"}</K>, <K>{"P_{\\text{marché}}=3.20\\$"}</K>.<br /><br />
          <strong>Étape 1 :</strong> Trouver un intervalle <K>{"[\\sigma_{low},\\,\\sigma_{high}]"}</K> contenant la solution.<br />
          <K>{"BS_{put}(\\sigma{=}0.10) = 0.45\\$ < 3.20\\$"}</K>. <K>{"BS_{put}(\\sigma{=}0.80) = 8.90\\$ > 3.20\\$"}</K>. Donc <K>{"\\sigma_{impl} \\in [10\\%,\\,80\\%]"}</K>.<br /><br />
          <strong>Étape 2 :</strong> <K>{"\\sigma_{mid} = (10{+}80)/2 = 45\\%"}</K>. <K>{"BS_{put}(45\\%) = 4.82\\$ > 3.20\\$"}</K> → <K>{"\\sigma_{impl} < 45\\%"}</K>.<br />
          Nouvel intervalle : [10%, 45%].<br /><br />
          <strong>Étape 3 :</strong> <K>{"\\sigma_{mid} = (10{+}45)/2 = 27.5\\%"}</K>. <K>{"BS_{put}(27.5\\%) = 3.18\\$ \\approx 3.20\\$"}</K>. Très proche !<br /><br />
          <strong>Étape 4 :</strong> <K>{"\\sigma_{mid} = (27.5{+}45)/2 = 36.25\\%"}</K>. <K>{"BS_{put}(36.25\\%) = 3.94\\$ > 3.20\\$"}</K> → nouvel intervalle [27.5%, 36.25%].<br /><br />
          Après ~10-15 itérations : <strong style={{ color: ACCENT }}><K>{"\\sigma_{impl} \\approx 27.8\\%"}</K></strong>. La bisection converge lentement (linéairement) mais de façon garantie.
        </div>
      </Accordion>

      <Grid cols={3} gap="8px">
        <Slider label="S" value={S} min={70} max={150} step={1} onChange={setS} accent={ACCENT} format={v => `${v}€`} />
        <Slider label="K" value={strike} min={70} max={150} step={1} onChange={setStrike} accent={T.a5} format={v => `${v}€`} />
        <Slider label="T" value={T2} min={0.05} max={2} step={0.05} onChange={setT2} accent={T.muted} format={v => `${v.toFixed(2)}a`} />
        <Slider label="r" value={r} min={0} max={0.12} step={0.005} onChange={setR} accent={T.muted} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="Prix de marché C" value={marketPrice} min={0.1} max={40} step={0.1} onChange={setMarketPrice} accent={ACCENT} format={v => `${v.toFixed(1)}€`} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        <InfoChip label="σ implicite" value={iv && !isNaN(iv) ? `${(iv * 100).toFixed(2)}%` : 'N/A'} accent={ACCENT} />
        <InfoChip label="Prix BS(σ_impl)" value={bsPrice.toFixed(4)} unit="€" accent={T.a4} />
        <InfoChip label="Prix marché" value={marketPrice.toFixed(1)} unit="€" accent={T.muted} />
      </div>

      <ChartWrapper title="Prix BS en fonction de σ — vol implicite = intersection avec prix marché" accent={ACCENT} height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceVsVol} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sigma" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} unit="%" label={{ value: 'σ (%)', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <ReferenceLine y={marketPrice} stroke={T.a4} strokeWidth={2} strokeDasharray="5 3" label={{ value: `C_mkt=${marketPrice}`, fill: T.a4, fontSize: 11 }} />
            {iv && !isNaN(iv) && <ReferenceLine x={+(iv * 100).toFixed(0)} stroke={ACCENT} strokeWidth={2} label={{ value: `σ_impl=${(iv * 100).toFixed(1)}%`, fill: ACCENT, fontSize: 11 }} />}
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Line type="monotone" dataKey="price" stroke={ACCENT} strokeWidth={2.5} dot={false} name="BS Call Price" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  )
}

export function SmileTab() {
  const [S, setS] = useState(100)
  const [T2, setT2] = useState(0.5)
  const [r, setR] = useState(0.04)
  const [atm, setAtm] = useState(0.25)
  const [skew, setSkew] = useState(-0.1)
  const [kurt, setKurt] = useState(0.05)

  // Parametric smile: σ(K) = atm + skew*(K/S-1) + kurt*(K/S-1)²
  const smileData = useMemo(() => {
    const pts = []
    for (let K = S * 0.7; K <= S * 1.4; K += S * 0.02) {
      const m = K / S - 1
      const iv = Math.max(atm + skew * m + kurt * m * m, 0.05)
      const price = bsCall(S, K, T2, r, iv)
      pts.push({ K: +K.toFixed(1), iv: +(iv * 100).toFixed(2), moneyness: +(m * 100).toFixed(1), price: +price.toFixed(4) })
    }
    return pts
  }, [S, T2, r, atm, skew, kurt])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Si Black-Scholes était le modèle parfait du monde, la volatilité implicite serait <strong style={{ color: ACCENT }}>identique pour tous les strikes</strong> — on appellerait ça une "flat smile". En réalité, elle varie selon le strike K — c'est le <em>smile de volatilité</em>. Ce phénomène contient toute l'information sur les limites du modèle gaussien : les marchés ne sont pas normaux, et les traders le savent.
      </div>

      <IntuitionBlock emoji="😊" title="Le smile de volatilité : les marchés ne sont pas gaussiens" accent={ACCENT}>
        Si Black-Scholes était parfait, la vol implicite serait la même pour tous les strikes.
        En réalité, les options OTM (surtout les puts OTM) sont plus chères que prévu par BS :
        le marché "paye" pour se protéger contre des crashes extrêmes.
        Cela crée le <strong>smile</strong> (forme de U) ou le <strong>skew</strong> (asymétrique vers les puts).
        En énergie : les puts OTM pétrole sont très demandés par les producteurs → fort skew négatif.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Pourquoi le smile existe — 4 raisons fondamentales</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { title: 'Queues épaisses (Fat Tails)', desc: 'Les rendements réels ont des queues bien plus épaisses que la loi normale. Les événements à -5σ (quasi impossibles en théorie gaussienne) arrivent en pratique. Les options OTM protègent contre ces événements → elles sont valorisées plus cher que BS ne le prédit.', color: ACCENT },
          { title: 'Risque de sauts (Jump Risk)', desc: 'Les prix ne bougent pas en continu — ils peuvent "sauter" brusquement (annonce OPEP, accident de pipeline). Les modèles de Merton (1976) avec sauts génèrent naturellement un smile. Les crashes sont asymétriques → skew négatif plus prononcé.', color: T.a4 },
          { title: "Effet de levier (Leverage Effect)", desc: 'Quand le prix S baisse, la dette/capital augmente → la volatilité de l\'entreprise monte. Corrélation négative empirique entre prix et vol (ρ < 0). Cela rend les puts OTM relativement plus chers (la vol est haute quand ils sont dans la monnaie).', color: T.a3 },
          { title: 'Offre et demande', desc: 'Les gestionnaires de portefeuille achètent massivement des puts OTM comme assurance portefeuille. Cette demande structurelle surévalue ces options, créant un skew négatif persistant. En énergie : les producteurs de pétrole achètent des puts → skew fort côté baisse.', color: T.a5 },
        ].map(s => (
          <div key={s.title} style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{s.title}</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <SectionTitle accent={ACCENT}>Skew vs Smile — les différentes formes</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Le "smile" et le "skew" sont deux manifestations différentes du même phénomène (vol implicite variable) :
      </div>

      <SectionTitle accent={ACCENT}>Formes typiques de smile</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { type: 'Smile symétrique', desc: 'Options OTM plus chères des deux côtés. Equity (crash + rally).', color: T.a4 },
          { type: 'Skew négatif (put skew)', desc: 'Puts OTM bien plus chers. Typique énergie, equity (protection downside).', color: ACCENT },
          { type: 'Skew positif', desc: 'Calls OTM plus chers. Parfois en énergie (gas spikes).', color: T.a3 },
        ].map(s => (
          <div key={s.type} style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{s.type}</div>
            <div style={{ color: T.muted, fontSize: 12 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <FormulaBox accent={ACCENT} label="Modèle de smile paramétrique (SVI simplifié)">
        <K display>{"\\sigma(K) = \\sigma_{ATM} + \\text{skew} \\times \\left(\\frac{K}{S} - 1\\right) + \\text{kurt} \\times \\left(\\frac{K}{S} - 1\\right)^2"}</K>
      </FormulaBox>

      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Smile symétrique</strong> (skew=0, kurt{'>'} 0) : puts et calls OTM tous les deux plus chers que prévu par BS. Le marché craint des mouvements violents dans les deux sens. Typique pour les paires de devises, certaines matières premières.<br />
        <strong style={{ color: ACCENT }}>Skew négatif</strong> (skew{'<'} 0) : puts OTM beaucoup plus chers que calls OTM. Typique des marchés actions (peur des crashes) et du pétrole (peur des chutes de prix). Le skew est mesuré par <K>{"25\\Delta\\text{-skew} = \\sigma(25\\Delta\\text{-put}) - \\sigma(25\\Delta\\text{-call})"}</K>.<br />
        <strong style={{ color: ACCENT }}>Skew positif</strong> (skew{'>'} 0) : calls OTM plus chers. Parfois observé en énergie électricité/gaz naturel où le marché craint des spikes haussiers (vague de froid, panne de réseau).
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Pourquoi <K>{"\\sigma_{impl}(K)"}</K> encode la densité risque-neutre</div>
        <Step num={1} accent={ACCENT}>Smile plat (<K>{"\\sigma_{impl}"}</K> identique pour tous K) → la densité risque-neutre est exactement log-normale → B-S est parfait pour tous les strikes → jamais observé en pratique sur les marchés réels.</Step>
        <Step num={2} accent={ACCENT}><K>{"\\sigma_{impl}(K)"}</K> croît pour les K faibles (put OTM) → les événements <K>{"S_T < K"}</K> sont plus probables que ce que prédit la loi log-normale → queues gauches épaisses. Le marché "paye" une prime pour se protéger contre les crashes.</Step>
        <Step num={3} accent={ACCENT}>Formule de Breeden-Litzenberger (1978) : <K>{"f_Q(K) = e^{rT} \\times \\frac{\\partial^2 C}{\\partial K^2}"}</K>. La densité risque-neutre se lit directement dans la courbure des prix d'options en K. Une courbure forte à K bas → probabilité élevée d'être près de K à maturité.</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          Le smile de vol est la "carte" de la distribution réelle du sous-jacent vue par le marché. Chaque point du smile correspond à une information sur la densité risque-neutre à ce niveau de prix. Construire une surface de vol cohérente, c'est construire une distribution risque-neutre entière.
        </div>
      </div>

      <IntuitionBlock emoji="🧠" title="Prix d'options → Distribution implicite du marché" accent={ACCENT}>
        Une surface de vol implicite encode exactement la densité de probabilité risque-neutre du sous-jacent. La formule de <strong>Breeden-Litzenberger (1978)</strong> est remarquable : <K>{"f(K,T) = e^{rT} \\times \\frac{\\partial^2 C}{\\partial K^2}"}</K>. En dérivant deux fois le prix d'un call par rapport au strike K, on obtient directement la densité de probabilité risque-neutre. Un smile avec fort skew négatif correspond à une distribution asymétrique vers la gauche (queue gauche épaisse), c'est-à-dire une probabilité plus élevée de grandes baisses que ne le prédit la loi normale.
      </IntuitionBlock>

      <Grid cols={2} gap="10px">
        <Slider label="σ_ATM (vol at-the-money)" value={atm} min={0.1} max={0.6} step={0.01} onChange={setAtm} accent={ACCENT} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="Skew (asymétrie)" value={skew} min={-0.4} max={0.4} step={0.01} onChange={setSkew} accent={T.a3} format={v => v.toFixed(2)} />
        <Slider label="Kurt (courbure)" value={kurt} min={-0.2} max={0.5} step={0.01} onChange={setKurt} accent={T.a5} format={v => v.toFixed(2)} />
        <Slider label="T (maturité)" value={T2} min={0.05} max={2} step={0.05} onChange={setT2} accent={T.muted} format={v => `${v.toFixed(2)}a`} />
      </Grid>

      <ChartWrapper title="Smile de volatilité σ(K) — vol implicite en fonction du strike" accent={ACCENT} height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={smileData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="K" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Strike K', fill: T.muted, fontSize: 11 }} />
            <YAxis yAxisId="left" stroke={ACCENT} tick={{ fill: ACCENT, fontSize: 10 }} unit="%" />
            <ReferenceLine yAxisId="left" x={S} stroke={T.border} strokeDasharray="4 3" label={{ value: `ATM (S=${S})`, fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Line yAxisId="left" type="monotone" dataKey="iv" stroke={ACCENT} strokeWidth={2.5} dot={false} name="σ impl (%)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ExampleBlock title="Skew pétrole brut — Analyse typique" accent={ACCENT}>
        <p>WTI à <K>{"S=80"}</K>$/bbl, <K>{"\\sigma_{ATM}=30\\%"}</K>, <K>{"T=3"}</K> mois. Observations marché :</p>
        <FormulaBox accent={ACCENT} label="Résultat">
          <K display>{"\\text{Skew}\\;25\\Delta \\approx -5\\% \\;\\rightarrow\\; \\text{fort skew négatif}"}</K>
        </FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Smile de volatilité" ruleDetail="σ_impl varie selon K" accent={ACCENT}>Put K=70 (OTM -12.5%) : <K>{"\\sigma_{impl} = 38\\%"}</K> (protection crash pétrolier)</DemoStep>
          <DemoStep num={2} rule="Smile de volatilité" ruleDetail="σ_ATM = référence" accent={ACCENT}>Call K=80 (ATM) : <K>{"\\sigma_{impl} = 30\\%"}</K> (par définition)</DemoStep>
          <DemoStep num={3} rule="Skew" ruleDetail="Asymétrie put/call OTM" accent={ACCENT}>Call K=90 (OTM +12.5%) : <K>{"\\sigma_{impl} = 27\\%"}</K> (anticipation haussière moins chère)</DemoStep>
          <DemoStep num={4} rule="Risk reversal" ruleDetail="Skew = (σ_put − σ_call)/2" accent={ACCENT}>Skew = <K>{"\\frac{\\sigma_{25\\Delta\\,put} - \\sigma_{25\\Delta\\,call}}{2} \\approx -5\\%"}</K> → skew négatif fort = marché craint les baisses</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <Accordion title="Exercice — Lire un smile de vol" accent={ACCENT} badge="Facile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Données smile Gaz Naturel (T=1 mois) :</strong>
          <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 10, fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ color: ACCENT, padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${ACCENT}33` }}>Strike</th>
                <th style={{ color: ACCENT, padding: '6px 10px', textAlign: 'center', borderBottom: `1px solid ${ACCENT}33` }}>K=2.50</th>
                <th style={{ color: ACCENT, padding: '6px 10px', textAlign: 'center', borderBottom: `1px solid ${ACCENT}33` }}>K=3.00 (ATM)</th>
                <th style={{ color: ACCENT, padding: '6px 10px', textAlign: 'center', borderBottom: `1px solid ${ACCENT}33` }}>K=3.50</th>
                <th style={{ color: ACCENT, padding: '6px 10px', textAlign: 'center', borderBottom: `1px solid ${ACCENT}33` }}>K=4.00</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: T.muted, padding: '6px 10px' }}><K>{"\\sigma_{impl}"}</K></td>
                <td style={{ color: T.text, padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>62%</td>
                <td style={{ color: ACCENT, padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>45%</td>
                <td style={{ color: T.text, padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>52%</td>
                <td style={{ color: T.text, padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>68%</td>
              </tr>
            </tbody>
          </table>
          <br />
          <strong>Questions :</strong><br />
          1. Quelle est la forme du smile ? <em>Réponse : smile asymétrique (skew mixte) — les deux côtés OTM sont plus chers, avec le côté put (K=2.50) légèrement plus cher.</em><br />
          2. Que dit le marché sur les risques ? <em>Réponse : le marché craint des mouvements importants dans les deux sens pour le gaz, ce qui est typique. La courbure (kurt {'>'} 0) reflète la nature non-gaussienne des prix du gaz.</em><br />
          3. Le skew <K>{"25\\Delta = (62\\% - 52\\%)/2 = +5\\%"}</K>. Que signifie ce skew légèrement positif ? <em>Réponse : les puts OTM (côté baisse) sont légèrement plus valorisés que les calls OTM — le marché craint davantage les chutes que les hausses à ce moment.</em>
        </div>
      </Accordion>

      <Accordion title="Exercice — Interpréter le skew pétrolier" accent={ACCENT} badge="Moyen">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Contexte :</strong> Le WTI à 80$/bbl présente un smile avec skew = -8% (fort skew négatif), mesuré par 25Δ-put minus 25Δ-call.<br /><br />
          <strong>Ce que cela révèle :</strong><br />
          1. <strong>Hedging asymétrique :</strong> Les producteurs de pétrole (compagnies pétrolières) achètent massivement des puts pour se protéger contre une baisse. Cette demande asymétrique élève le prix des puts OTM.<br />
          2. <strong>Risque asymétrique perçu :</strong> Le marché considère qu'un crash pétrolier (WTI à 50$) est beaucoup plus probable qu'un rally (WTI à 110$) dans le court terme.<br />
          3. <strong>Prime de risque géopolitique :</strong> Le skew augmente avant les réunions OPEP — l'incertitude sur les quotas de production crée une demande de protection downside.<br /><br />
          <strong>Impact pour un trader :</strong><br />
          • Vendre un strangle (vendre put OTM + vendre call OTM) collecte une prime plus élevée côté put → position implicitement longue skew.<br />
          • Acheter un risk reversal (acheter call OTM + vendre put OTM) est moins cher que si le smile était flat → stratégie pour anticiper une hausse à moindre coût.
        </div>
      </Accordion>
    </div>
  )
}

export function SurfaceTab() {
  const [S] = useState(100)

  // Parameterized surface: σ(K, T) with smile + term structure
  const maturities = [0.083, 0.25, 0.5, 1, 2]  // 1m, 3m, 6m, 1y, 2y
  const matLabels = ['1M', '3M', '6M', '1Y', '2Y']

  const strikeMoneyness = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]  // K/S - 1
  const strikeLabels = ['70', '80', '90', 'ATM', '110', '120', '130']

  // Vol surface parameters (energy-like: high near-term vol + steep skew)
  function surfVol(m, T) {
    const atmVol = 0.25 + 0.05 * Math.exp(-T * 2)  // term structure: higher near-term
    const skew = -0.15 + 0.05 * T  // skew flattens over time
    const kurt = 0.08 - 0.02 * T
    return Math.max(atmVol + skew * m + kurt * m * m, 0.05)
  }

  // Heatmap data: for each (T, K), vol value
  const heatData = maturities.map((T, ti) => {
    const row = { maturity: matLabels[ti] }
    strikeMoneyness.forEach((m, ki) => {
      row[strikeLabels[ki]] = +(surfVol(m, T) * 100).toFixed(1)
    })
    return row
  })

  // Line chart: vol smile for each maturity
  const smileByMat = strikeMoneyness.map((m, ki) => {
    const row = { K: strikeLabels[ki] }
    maturities.forEach((T, ti) => {
      row[matLabels[ti]] = +(surfVol(m, T) * 100).toFixed(1)
    })
    return row
  })

  const lineColors = [ACCENT, T.a4, T.a3, T.a6, T.a2]

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La surface de volatilité σ(K,T) est <strong style={{ color: ACCENT }}>l'objet central du trading d'options avancé</strong>. C'est une "carte" complète du pricing du marché pour tous les strikes K et toutes les maturités T. Maîtriser la surface de vol, c'est maîtriser l'ensemble de l'information contenue dans les prix d'options cotées sur un sous-jacent donné.
      </div>

      <IntuitionBlock emoji="🏔️" title="La surface de volatilité : σ(K, T) en 2D" accent={ACCENT}>
        La surface de volatilité généralise le smile à toutes les maturités.
        Pour chaque couple (Strike K, Maturité T), il y a une vol implicite différente.
        En énergie : la vol est souvent plus haute sur les courtes maturités (incertitude immédiate)
        et le skew est plus prononcé en front-month (protections proches maturité).
        Les traders doivent interpoler entre les points observés pour pricer des options exotiques.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Structure par terme de la volatilité</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La structure par terme (term structure) de la vol décrit comment la vol ATM évolue avec la maturité T. Elle révèle ce que le marché anticipe sur l'évolution future de la volatilité :
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Vol court terme élevée', desc: 'Signal : anticipation d\'un événement imminent (résultat d\'entreprise, décision OPEP, données EIA). Le marché est nerveux à court terme mais calme à long terme. Forme "inversée" (backwardation de vol).', color: ACCENT },
          { label: 'Vol long terme plus basse', desc: 'Phénomène de mean-reversion de la volatilité elle-même : la vol tend à revenir vers sa moyenne de long terme θ. Plus la maturité est longue, plus la vol converge vers θ — capturé par les modèles de vol stochastique (Heston).', color: T.a4 },
          { label: 'Forward Vol', desc: 'La vol implicite entre deux maturités futures T₁ et T₂. Formule : σ_fwd²(T₁,T₂) = [σ²_impl(T₂)×T₂ - σ²_impl(T₁)×T₁] / (T₂-T₁). Permet de pricer les options à départ différé et les vol swaps.', color: T.a3 },
        ].map(s => (
          <div key={s.label} style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <SectionTitle accent={ACCENT}>Interpolation et conditions d'absence d'arbitrage</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Une surface de vol ne peut pas être n'importe quelle fonction <K>{"\\sigma(K,T)"}</K>. Pour être cohérente avec l'absence d'arbitrage, elle doit satisfaire plusieurs contraintes :
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.9 }}>
        <strong style={{ color: ACCENT }}>Conditions d'absence d'arbitrage sur la surface :</strong><br />
        • <strong>Convexité en K :</strong> Pour T fixé, <K>{"C(K,T)"}</K> doit être convexe en K. Sinon, un butterfly spread serait en arbitrage.<br />
        • <strong>Monotonie en T :</strong> <K>{"\\sigma^2(ATM,T) \\times T"}</K> doit être croissant en T (variance totale croissante). Sinon, un calendar spread serait en arbitrage.<br />
        • <strong>Bornes sur σ :</strong> <K>{"\\sigma(K,T)"}</K> doit être strictement positive. La variance totale <K>{"w(K,T) = \\sigma^2(K,T) \\times T"}</K> doit satisfaire des conditions de Gatheral (SVI).<br />
        • <strong>SVI (Stochastic Volatility Inspired) :</strong> Modèle de Gatheral (2004) pour paramétrer la variance totale <K>{"w(k) = a + b\\left(\\rho(k-m) + \\sqrt{(k-m)^2 + \\sigma^2}\\right)"}</K> — permet une calibration sans arbitrage en 5 paramètres.
      </div>

      <Accordion title="Exercice — Calculer la forward vol" accent={ACCENT} badge="Difficile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Données :</strong> Surface de vol WTI. <K>{"\\sigma_{impl}(ATM,\\,3M) = 28\\%"}</K>, <K>{"\\sigma_{impl}(ATM,\\,6M) = 25\\%"}</K>.<br /><br />
          <strong>Calcul de la forward vol entre 3M et 6M :</strong><br />
          <K display>{"\\sigma^2_{fwd}(3M{\\to}6M) = \\frac{\\sigma^2(6M) \\times T_2 - \\sigma^2(3M) \\times T_1}{T_2 - T_1}"}</K>
          <K display>{"= \\frac{0.25^2 \\times 0.5 - 0.28^2 \\times 0.25}{0.5 - 0.25} = \\frac{0.03125 - 0.01960}{0.25} = 0.04660"}</K>
          <K display>{"\\sigma_{fwd}(3M{\\to}6M) = \\sqrt{0.04660}"}</K> = <strong style={{ color: ACCENT }}>21.6%</strong><br /><br />
          <strong>Interprétation :</strong> Le marché anticipe une vol de 21.6% entre le 3ème et le 6ème mois — inférieure à la vol de 3M (28%). La structure par terme est en backwardation : le marché pense que la vol va baisser après les 3 prochains mois.<br /><br />
          <strong>Application :</strong> Une option sur pétrole qui commence dans 3 mois et expire dans 6 mois (compound option ou option à départ différé) doit être pricée avec <K>{"\\sigma_{fwd} \\approx 21.6\\%"}</K>, pas 25% ni 28%.
        </div>
      </Accordion>

      <SectionTitle accent={ACCENT}>Surface de volatilité — Pétrole type (Heatmap)</SectionTitle>

      <div style={{ background: T.panel2, borderRadius: 10, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16, overflowX: 'auto' }}>
        <div style={{ marginBottom: 10, color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>σ impl % — Maturité × Strike (K/ATM)</div>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 500 }}>
          <thead>
            <tr>
              <th style={{ color: T.muted, padding: '6px 12px', fontSize: 11, textAlign: 'left' }}>Mat\Strike</th>
              {strikeLabels.map(k => (
                <th key={k} style={{ color: k === 'ATM' ? ACCENT : T.muted, padding: '6px 12px', fontSize: 11, textAlign: 'center' }}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatData.map(row => (
              <tr key={row.maturity}>
                <td style={{ color: ACCENT, padding: '8px 12px', fontWeight: 700, fontSize: 12 }}>{row.maturity}</td>
                {strikeLabels.map(k => {
                  const v = row[k]
                  const intensity = (v - 20) / 25  // normalize to [0,1]
                  const bg = `rgba(251, 191, 36, ${Math.min(Math.max(intensity, 0.05), 0.6)})`
                  return (
                    <td key={k} style={{
                      padding: '8px 12px', textAlign: 'center', fontSize: 13, fontWeight: 600,
                      color: T.text, background: bg, borderRadius: 4,
                    }}>{v}%</td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 10 }}>
          → Gradient de couleur : plus jaune = vol plus haute. Remarquez : vol plus haute en 1M et pour les puts OTM (K=70,80).
        </div>
      </div>

      <ChartWrapper title="Smile par maturité — term structure du smile" accent={ACCENT} height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={smileByMat} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="K" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Strike', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} unit="%" />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
            {matLabels.map((m, i) => (
              <Line key={m} type="monotone" dataKey={m} stroke={lineColors[i]} strokeWidth={2} dot={false} name={m} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>
        Observations : le smile est plus prononcé en court terme (1M) qu'en long terme (2Y).
        Le skew (inclinaison vers la gauche) est typique de l'énergie : les producteurs achètent des puts pour se protéger.
        La term structure montre une vol ATM plus haute en court terme (mean-reversion de la vol).
      </div>
    </div>
  )
}

export function HestonTab() {
  const [v0, setV0] = useState(0.04)  // initial variance
  const [kappa, setKappa] = useState(2)
  const [theta, setTheta] = useState(0.04)
  const [xi, setXi] = useState(0.5)  // vol of vol
  const [rho, setRho] = useState(-0.7)
  const [key, setKey] = useState(0)

  function gaussRand2() {
    const Z1 = gaussRand(), Z2 = gaussRand()
    return [Z1, rho * Z1 + Math.sqrt(1 - rho * rho) * Z2]
  }

  const paths = useMemo(() => {
    const n = 252; const dt = 1 / n
    const result = { S: [], vol: [] }
    for (let p = 0; p < 3; p++) {
      let S = 100, v = v0
      const spts = [{ t: 0, S: 100 }]
      const vpts = [{ t: 0, vol: +(Math.sqrt(v0) * 100).toFixed(2) }]
      for (let i = 1; i <= n; i++) {
        const [Z1, Z2] = gaussRand2()
        v = Math.max(v + kappa * (theta - v) * dt + xi * Math.sqrt(Math.max(v, 0) * dt) * Z2, 0)
        S *= Math.exp(-0.5 * v * dt + Math.sqrt(Math.max(v, 0) * dt) * Z1)
        if (i % 3 === 0) {
          spts.push({ t: +(i * dt).toFixed(3), S: +S.toFixed(2) })
          vpts.push({ t: +(i * dt).toFixed(3), vol: +(Math.sqrt(v) * 100).toFixed(2) })
        }
      }
      result.S.push(spts)
      result.vol.push(vpts)
    }
    return result
  }, [v0, kappa, theta, xi, rho, key])

  const COLORS = [ACCENT, T.a4, T.a3]

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Le modèle de <strong style={{ color: ACCENT }}>Heston (1993)</strong> est la première extension réaliste de Black-Scholes : la volatilité elle-même est stochastique, c'est-à-dire qu'elle suit un processus aléatoire. C'est le modèle de volatilité stochastique le plus utilisé en pratique dans l'industrie financière, notamment parce qu'il possède une <em>solution semi-analytique</em> (via la transformée de Fourier) qui permet un pricing rapide.
      </div>

      <IntuitionBlock emoji="🌊" title="Heston : la volatilité stochastique" accent={ACCENT}>
        Black-Scholes suppose <K>{"\\sigma"}</K> constant — mais en réalité, la volatilité elle-même fluctue !
        Le modèle de Heston (1993) modélise <K>{"v = \\sigma^2"}</K> comme un processus CIR (mean-reversion) :
        la volatilité revient vers un niveau long terme <K>{"\\theta"}</K> avec vitesse <K>{"\\kappa"}</K>, et fluctue avec "vol de vol" <K>{"\\xi"}</K>.
        La corrélation <K>{"\\rho"}</K> entre prix et vol (généralement négative) génère le skew observé :
        quand le prix baisse, la vol monte — le "leverage effect".
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Modèle de Heston (1993)">
        <K display>{"dS = \\mu S \\, dt + \\sqrt{v} \\cdot S \\cdot dW_1"}</K>
        <K display>{"dv = \\kappa(\\theta - v)\\,dt + \\xi\\sqrt{v} \\cdot dW_2"}</K>
        <K display>{"\\text{avec : } E[dW_1 \\cdot dW_2] = \\rho \\, dt"}</K>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Les 5 paramètres de Heston — intuitions</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { param: 'κ (kappa) — Vitesse de mean-reversion', desc: 'Contrôle à quelle vitesse la variance v(t) revient vers sa valeur de long terme θ. κ=0 : pas de mean-reversion (variance peut dériver). κ=5 : très forte mean-reversion (retour rapide à θ). En pratique, κ ∈ [0.5, 5]. Analogie : un ressort — plus κ est grand, plus le ressort est raide.', color: ACCENT },
          { param: 'θ (theta) — Variance de long terme', desc: 'La valeur vers laquelle v(t) converge en moyenne. Vol de long terme = √θ. Si θ=0.09, alors σ_LT = 30%. C\'est la "vol normale" du sous-jacent sur le long terme. En énergie, θ peut être saisonnier (hiver vs été pour le gaz).', color: T.a4 },
          { param: 'ξ (xi) — Vol de vol (vol of vol)', desc: 'L\'amplitude des fluctuations de la variance elle-même. ξ élevé → la vol est très volatile → smile de vol plus prononcé (plus de courbure). ξ faible → vol quasi-déterministe → smile plat. Paramètre qui "gonfle" le smile symétrique.', color: T.a3 },
          { param: 'ρ (rho) — Corrélation browniens', desc: 'Corrélation entre les deux mouvements browniens W₁ (prix) et W₂ (variance). ρ négatif → quand S baisse, v monte (leverage effect) → skew négatif. ρ positif → quand S monte, v monte → skew positif (rare, parfois en énergie). C\'est le paramètre qui génère l\'asymétrie du smile.', color: T.a5 },
        ].map(s => (
          <div key={s.param} style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{s.param}</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>v₀ — Variance initiale :</strong> La variance au moment <K>{"t=0"}</K>, soit la vol courante du sous-jacent. <K>{"v_0 = \\sigma_0^2"}</K>. Si le marché est actuellement volatil (<K>{"\\sigma_0=35\\%"}</K>), <K>{"v_0=0.1225"}</K>. Si <K>{"v_0 \\neq \\theta"}</K>, la variance va drifter vers <K>{"\\theta"}</K> avec vitesse <K>{"\\kappa"}</K> — cela crée la term structure de vol observée.
      </div>

      <SectionTitle accent={ACCENT}>Condition de Feller — garantir v(t) {'>'} 0</SectionTitle>
      <FormulaBox accent={ACCENT} label="Condition de Feller">
        <K display>{"2\\kappa\\theta > \\xi^2 \\quad \\Rightarrow \\quad \\text{la variance } v(t) \\text{ reste strictement positive}"}</K>
        <K display>{"\\text{Si } 2\\kappa\\theta \\leq \\xi^2 \\text{ : } v(t) \\text{ peut atteindre 0 (problème numérique)}"}</K>
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La condition de Feller est une condition mathématique sur les paramètres du processus CIR (Cox-Ingersoll-Ross) pour garantir que la variance reste positive. En pratique, de nombreuses calibrations ne satisfont pas cette condition (le paramètre <K>{"\\xi"}</K> calibré sur le marché est souvent trop grand). On utilise alors des schémas de discrétisation robustes (full truncation, absorption) qui troncatent <K>{"v(t)"}</K> à 0 pour éviter des valeurs négatives lors des simulations Monte Carlo.
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Comment ρ génère le skew — mécanisme exact</div>
        <Step num={1} accent={ACCENT}>Si <K>{"\\rho < 0"}</K> (leverage effect) : quand S baisse (<K>{"dW_S < 0"}</K>), la variance <K>{"v"}</K> tend à monter (car <K>{"dW_v"}</K> est corrélé négativement avec <K>{"dW_S"}</K>). En crise, baisse de prix et hausse de vol se produisent ensemble → puts OTM beaucoup plus chers que ce que prédit B-S → skew négatif prononcé.</Step>
        <Step num={2} accent={ACCENT}>Si <K>{"\\rho > 0"}</K> (energy spikes) : quand S monte, <K>{"v"}</K> monte aussi → calls OTM plus chers que puts OTM → skew positif. Typique du gaz naturel et de l'électricité : les spikes de prix sont haussiers et accompagnés de forte volatilité.</Step>
        <Step num={3} accent={ACCENT}>Si <K>{"\\rho = 0"}</K> : les deux processus sont indépendants → smile symétrique autour de l'ATM. B-S serait exact si la vol était constante, mais la vol of vol <K>{"\\xi"}</K> génère quand même une courbure (kurt) même avec <K>{"\\rho=0"}</K>.</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          Intuition des termes de l'EDS de <K>{"v"}</K> : <K>{"\\kappa(\\theta - v)\\,dt"}</K> = mean-reversion de la variance, <K>{"\\theta"}</K> = variance de LT (vol LT = <K>{"\\sqrt{\\theta}"}</K>). <K>{"\\xi\\sqrt{v} \\cdot dW_v"}</K> = "vol de vol" — la variance elle-même fluctue, avec amplitude proportionnelle à <K>{"\\sqrt{v}"}</K> (processus CIR). Plus <K>{"\\xi"}</K> est grand, plus le smile est courbé.
        </div>
      </div>

      <IntuitionBlock emoji="🔄" title="Pourquoi ρ négatif génère un skew négatif" accent={ACCENT}>
        Le lien entre <K>{"\\rho"}</K> et le skew est intuitif : avec <K>{"\\rho < 0"}</K>, quand <K>{"W_1"}</K> est négatif (prix S baisse), <K>{"W_2"}</K> tend à être positif (variance <K>{"v"}</K> monte). Résultat : les grandes baisses de prix sont corrélées avec une forte volatilité. Cela signifie que les puts OTM (qui paient lors des baisses) sont relativement plus chers car ces baisses surviennent justement quand la vol est haute — elles sont "doublement mauvaises". Conséquence directe : le smile est asymétrique, plus haut côté put OTM = skew négatif. Plus <K>{"\\lvert\\rho\\rvert"}</K> est grand, plus le skew est prononcé.
      </IntuitionBlock>

      <Accordion title="Exercice — Calibration intuitive de Heston" accent={ACCENT} badge="Difficile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Problème :</strong> On observe le smile suivant pour le WTI (<K>{"T=3M,\\; S=80"}</K>) :<br />
          <K>{"\\sigma_{impl}(K{=}70) = 38\\%"}</K>, <K>{"\\sigma_{impl}(K{=}80) = 30\\%"}</K>, <K>{"\\sigma_{impl}(K{=}90) = 26\\%"}</K>.<br />
          Le skew <K>{"25\\Delta = (38{-}26)/2 = -6\\%"}</K>. Comment choisir <K>{"\\rho"}</K> pour reproduire ce skew ?<br /><br />
          <strong>Règle heuristique :</strong> Plus le skew est négatif (fort), plus <K>{"\\rho"}</K> doit être négatif. En général : <K>{"\\text{skew} \\approx -\\rho \\times \\xi \\times \\sqrt{T/2}"}</K> (approximation de premier ordre). Avec <K>{"\\xi=0.5"}</K> et <K>{"T=0.25"}</K> : <K>{"\\rho \\approx \\frac{\\text{skew}}{\\xi \\times \\sqrt{T/2}} = \\frac{-0.06}{0.5 \\times 0.354} \\approx -0.34"}</K>.<br /><br />
          <strong>Itération calibration :</strong><br />
          1. Fixer <K>{"v_0 = ATM_{vol}^2 = 0.09"}</K> (<K>{"\\sigma_0=30\\%"}</K>)<br />
          2. Fixer <K>{"\\theta = v_0 = 0.09"}</K> (vol de long terme similaire à vol courante)<br />
          3. Fixer <K>{"\\kappa = 2.0"}</K> (mean-reversion modérée)<br />
          4. Essayer <K>{"\\xi = 0.5,\\; \\rho = -0.7"}</K> → calculer le smile Heston (via Fourier ou MC)<br />
          5. Comparer au smile observé. Ajuster <K>{"\\rho"}</K> pour le skew, <K>{"\\xi"}</K> pour la courbure.<br /><br />
          <strong>Résultat :</strong> Heston avec <K>{"\\rho=-0.7,\\; \\xi=0.5,\\; \\kappa=2,\\; \\theta=0.09"}</K> reproduit typiquement un skew de -5 à -8% selon les autres paramètres. Vérifier la condition de Feller : <K>{"2 \\times 2 \\times 0.09 = 0.36 > 0.5^2 = 0.25"}</K> ✓.
        </div>
      </Accordion>

      <SymbolLegend accent={ACCENT} symbols={[
        ['v₀', 'Variance initiale (v₀ = σ₀²)'],
        ['κ', 'Vitesse de retour à la moyenne de la variance'],
        ['θ', 'Variance long terme (niveau moyen)'],
        ['ξ', '"Vol de vol" : amplitude des fluctuations de variance'],
        ['ρ', 'Corrélation prix-vol (ρ < 0 → leverage effect → skew)'],
      ]} />

      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        <InfoChip label="σ₀ = √v₀" value={`${(Math.sqrt(v0) * 100).toFixed(1)}%`} accent={ACCENT} />
        <InfoChip label="σ_LT = √θ" value={`${(Math.sqrt(theta) * 100).toFixed(1)}%`} accent={T.a4} />
        <InfoChip label="ρ (skew)" value={rho.toFixed(2)} accent={T.a3} />
      </div>

      <Grid cols={3} gap="8px">
        <Slider label="v₀ (variance init.)" value={v0} min={0.01} max={0.25} step={0.01} onChange={setV0} accent={ACCENT} format={v => `${(Math.sqrt(v) * 100).toFixed(1)}%`} />
        <Slider label="κ (mean-reversion)" value={kappa} min={0.1} max={10} step={0.1} onChange={setKappa} accent={T.a4} format={v => v.toFixed(1)} />
        <Slider label="θ (variance LT)" value={theta} min={0.01} max={0.25} step={0.01} onChange={setTheta} accent={T.a5} format={v => `${(Math.sqrt(v) * 100).toFixed(1)}%`} />
        <Slider label="ξ (vol de vol)" value={xi} min={0.05} max={1.5} step={0.05} onChange={setXi} accent={T.a3} format={v => v.toFixed(2)} />
        <Slider label="ρ (corrélation)" value={rho} min={-0.99} max={0.99} step={0.01} onChange={setRho} accent={T.a2} />
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelles trajectoires</button>

      <Grid cols={2} gap="12px">
        <ChartWrapper title="Trajectoires S(t) — Heston" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="t" type="number" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              {paths.S.map((p, i) => <Line key={i} data={p} type="monotone" dataKey="S" stroke={COLORS[i]} strokeWidth={1.5} dot={false} />)}
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Volatilité stochastique σ(t) = √v(t)" accent={T.a4} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="t" type="number" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} unit="%" />
              <ReferenceLine y={Math.sqrt(theta) * 100} stroke={T.a4} strokeDasharray="4 3" label={{ value: 'σ_LT', fill: T.a4, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              {paths.vol.map((p, i) => <Line key={i} data={p} type="monotone" dataKey="vol" stroke={COLORS[i]} strokeWidth={1.5} dot={false} name={`σ${i + 1}`} />)}
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>
    </div>
  )
}
