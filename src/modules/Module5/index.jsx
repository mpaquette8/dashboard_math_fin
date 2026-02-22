import React, { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ScatterChart, Scatter, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { T } from '../../design/tokens'
import {
  ModuleHeader, TabBar, FormulaBox, IntuitionBlock, ExampleBlock,
  Slider, Accordion, Step, SymbolLegend, SectionTitle, InfoChip, Grid, ChartWrapper,
} from '../../design/components'

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
        C'est l'écart-type des log-rendements quotidiens, multiplié par √252 pour annualiser.
        Elle répond à : "À quelle vitesse ce prix a-t-il bougé ces dernières semaines ?"
        En énergie, la vol peut varier dramatiquement (pétrole : 20-80% selon les crises).
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Volatilité Historique Annualisée">
        r_t = ln(S_t / S_{'{'}t-1{'}'})      (log-rendement quotidien)
        r̄ = (1/n) Σ r_t
        σ²_daily = (1/(n-1)) Σ (r_t - r̄)²
        σ_ann = σ_daily × √252
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Calcul pas à pas de la volatilité historique</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Voici comment calculer concrètement la volatilité historique à partir d'une série de prix :
      </div>
      <ExampleBlock title="Calcul pas à pas — Données journalières" accent={ACCENT}>
        <Step num={1} accent={ACCENT}>
          <strong>Calculer les log-rendements :</strong> rᵢ = ln(Sᵢ / Sᵢ₋₁). Par exemple, si S₀ = 100 et S₁ = 102, alors r₁ = ln(102/100) = 0.0198. On utilise les log-rendements (et non les rendements simples) car ils sont additifs dans le temps et symétiques pour les hausses/baisses.
        </Step>
        <Step num={2} accent={ACCENT}>
          <strong>Calculer la moyenne :</strong> r̄ = (1/n) × Σᵢ rᵢ. Sur un horizon court, r̄ ≈ 0 (le drift journalier est négligeable devant la vol). Sur n=252 jours avec µ_ann=5%, r̄_daily ≈ 0.0002.
        </Step>
        <Step num={3} accent={ACCENT}>
          <strong>Calculer la variance quotidienne :</strong> σ̂²_daily = (1/(n-1)) × Σᵢ (rᵢ - r̄)². On divise par (n-1) et non n pour avoir un estimateur sans biais (correction de Bessel). Exemple : avec n=21 jours et Σ(rᵢ - r̄)² = 0.0084, on obtient σ̂²_daily = 0.0084/20 = 0.00042, soit σ̂_daily = 2.05%.
        </Step>
        <Step num={4} accent={ACCENT}>
          <strong>Annualiser :</strong> σ_ann = σ_daily × √252. Si σ_daily = 2.05%, alors σ_ann = 2.05% × √252 ≈ 32.5%. Le facteur √252 vient du scaling de la variance : si les rendements sont iid, Var(rendement annuel) = 252 × Var(rendement daily), donc σ_ann = √252 × σ_daily.
        </Step>
      </ExampleBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Pourquoi √252 ?</strong> La variance est additive dans le temps (pour des rendements indépendants). Sur T jours, σ²_T = T × σ²_daily. Donc σ_T = σ_daily × √T. Il y a 252 jours de trading par an (hors week-ends et jours fériés). Le facteur de scaling √252 ≈ 15.87 est donc la conversion standard daily → annuel.
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
          r₁ = ln(81.20/80.00) = ln(1.015) = 0.01489<br />
          r₂ = ln(79.50/81.20) = ln(0.9791) = -0.02113<br />
          r₃ = ln(82.10/79.50) = ln(1.0327) = 0.03218<br />
          r₄ = ln(81.80/82.10) = ln(0.9963) = -0.00365<br />
          r₅ = ln(83.00/81.80) = ln(1.0147) = 0.01458<br /><br />
          <strong>Étape 2 — Moyenne :</strong> r̄ = (0.01489 - 0.02113 + 0.03218 - 0.00365 + 0.01458) / 5 = 0.00737<br /><br />
          <strong>Étape 3 — Variance (n-1 = 4) :</strong><br />
          Σ(rᵢ - r̄)² = (0.01489-0.00737)² + (-0.02113-0.00737)² + (0.03218-0.00737)² + (-0.00365-0.00737)² + (0.01458-0.00737)²<br />
          = 0.0000565 + 0.0008122 + 0.0006155 + 0.0001215 + 0.0000520 = 0.0016577<br />
          σ²_daily = 0.0016577 / 4 = 0.000414 → σ_daily = 2.035%<br /><br />
          <strong>Étape 4 — Annualisation :</strong> σ_ann = 2.035% × √252 = 2.035% × 15.875 = <strong style={{ color: ACCENT }}>32.3%</strong>
        </div>
      </Accordion>

      <Accordion title="Exercice — Volatilité EWMA (pondération exponentielle)" accent={ACCENT} badge="Difficile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Principe :</strong> Dans EWMA (Exponentially Weighted Moving Average), on donne plus de poids aux données récentes via un facteur de décroissance λ (RiskMetrics™ utilise λ = 0.94 pour des données journalières).<br /><br />
          <strong>Formule récursive :</strong> σ²_t = λ × σ²_{'{'}t-1{'}'} + (1-λ) × r²_{'{'}t-1{'}'}<br /><br />
          <strong>Intuition :</strong> Les poids décroissent exponentiellement : le jour t-1 a un poids (1-λ), le jour t-2 a un poids λ(1-λ), etc.<br /><br />
          <strong>Avantage :</strong> Très réactif aux chocs récents. La demi-vie de l'information est ln(0.5)/ln(λ) ≈ 11 jours pour λ=0.94.<br /><br />
          <strong>Calcul exemple (λ=0.94, σ²_0 = 0.0004) :</strong><br />
          r₁ = 0.025 → σ²_1 = 0.94 × 0.0004 + 0.06 × 0.025² = 0.000376 + 0.0000375 = 0.000414<br />
          σ_1_daily = 2.03% → σ_1_ann = 32.2%<br /><br />
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

// ─── Tab: Vol Implicite ───────────────────────────────────────────────────────
export function ImplVolTab() {
  const [S, setS] = useState(100)
  const [K, setK] = useState(100)
  const [T2, setT2] = useState(0.5)
  const [r, setR] = useState(0.04)
  const [marketPrice, setMarketPrice] = useState(6)

  const iv = useMemo(() => impliedVol(marketPrice, S, K, T2, r), [marketPrice, S, K, T2, r])
  const bsPrice = bsCall(S, K, T2, r, iv || 0.3)

  // Price vs vol
  const priceVsVol = useMemo(() => {
    const pts = []
    for (let sig = 0.05; sig <= 0.8; sig += 0.01) {
      pts.push({ sigma: +(sig * 100).toFixed(0), price: +bsCall(S, K, T2, r, sig).toFixed(4) })
    }
    return pts
  }, [S, K, T2, r])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La volatilité implicite est le <strong style={{ color: ACCENT }}>message que le marché envoie aux traders</strong>. Si le marché cote une option à un certain prix, on peut "inverser" la formule Black-Scholes pour trouver la volatilité que le marché "pense" — c'est-à-dire la volatilité future anticipée. C'est un processus d'inversion numérique, car il n'existe pas de formule fermée pour σ en fonction du prix.
      </div>

      <IntuitionBlock emoji="🔍" title="La vol implicite : ce que le marché 'pense'" accent={ACCENT}>
        La volatilité implicite est l'inverse : donné un prix de marché observé pour l'option,
        quelle volatilité faut-il injecter dans Black-Scholes pour retrouver ce prix ?
        C'est la "prévision" du marché de la volatilité future.
        Quand les options sont chères → vol implicite haute → "le marché craint la volatilité".
        En énergie : la vol implicite monte avant les annonces OPEC, les cyclones, etc.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Vol implicite = racine de l'équation">
        Trouver σ_impl tel que : BS(S, K, T, r, σ_impl) = C_marché
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Algorithme Newton-Raphson (itération)">
        σ_{'{'}n+1{'}'} = σ_n - [BS(σ_n) - C_marché] / Vega(σ_n)
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Newton-Raphson pour la vol implicite — étape par étape</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Newton-Raphson est un algorithme d'optimisation qui converge rapidement (quadratiquement). L'idée est simple : partant d'une estimation initiale σ₀, on calcule le prix BS(σ₀), on compare au prix de marché, et on corrige en divisant l'erreur par le Vega (la sensibilité du prix à la vol).
      </div>
      <ExampleBlock title="Newton-Raphson — Recherche de σ_impl" accent={ACCENT}>
        <p>Call sur WTI : S=80, K=80, T=0.25an, r=4%, C_marché=4.50$. Chercher σ_impl.</p>
        <Step num={1} accent={ACCENT}>Initialisation : σ₀ = 0.30 (30%). Calculer BS(σ₀) = 3.86$. Erreur = 3.86 - 4.50 = -0.64$. Vega(σ₀) = S × ϕ(d₁) × √T = 80 × 0.3989 × 0.5 = 15.96. Correction : Δσ = -(-0.64)/15.96 = +0.040.</Step>
        <Step num={2} accent={ACCENT}>Itération 1 : σ₁ = 0.30 + 0.040 = 0.340 (34%). BS(σ₁) ≈ 4.48$. Erreur = -0.02$. Très proche ! Vega ≈ 16.1. Correction : Δσ = 0.02/16.1 ≈ +0.001.</Step>
        <Step num={3} accent={ACCENT}>Itération 2 : σ₂ = 0.341 (34.1%). BS(σ₂) ≈ 4.498$ ≈ 4.50$. Convergence atteinte en seulement 2-3 itérations !</Step>
        <Step num={4} accent={ACCENT}>Résultat : σ_impl ≈ 34.1%. Interprétation : le marché anticipe une volatilité annualisée de 34% pour le WTI sur les 3 prochains mois.</Step>
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
        <strong style={{ color: ACCENT }}>Volatility Risk Premium :</strong> En moyenne, σ_impl {'>'} σ_hist. Cet écart systématique s'appelle la prime de risque de volatilité. Les marchés paient une prime pour la couverture — les vendeurs d'options (qui acceptent le risque) exigent une compensation. En énergie, cette prime est souvent de 3-8 points de vol. C'est la base du "vol selling" (vente de vol) comme stratégie.
      </div>

      <ExampleBlock title="VIX — l'indice de peur du marché" accent={ACCENT}>
        <p>Le VIX mesure la volatilité implicite du S&P500 à 30 jours. C'est le "baromètre de la peur" des marchés.</p>
        <Step num={1} accent={ACCENT}>Construction : on observe les prix de toutes les options (calls et puts) sur le S&P500 avec maturité proche de 30 jours.</Step>
        <Step num={2} accent={ACCENT}>Calcul : VIX² ≈ (2/T) × Σ [ΔK/K² × e^(rT) × Q(K)] — une moyenne pondérée des prix d'options pour tous les strikes, sans hypothèse de modèle.</Step>
        <Step num={3} accent={ACCENT}>Interprétation : VIX=20 signifie que le marché anticipe une vol annualisée de 20% pour le S&P500 sur le prochain mois. VIX{'>'}30 = anxiété. VIX{'>'}40 = panique (ex: Covid mars 2020).</Step>
        <Step num={4} accent={ACCENT}>En énergie : l'OVX (Oil VIX) joue le même rôle pour le WTI. Il peut atteindre 80-100% lors des crises pétrolières majeures (Covid 2020 : OVX à 325% !)</Step>
      </ExampleBlock>

      <Accordion title="Exercice — Calculer σ_impl par bisection step-by-step" accent={ACCENT} badge="Moyen">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Méthode de bisection :</strong> Plus robuste que Newton-Raphson (toujours converge), moins rapide. On encadre la solution entre σ_low et σ_high.<br /><br />
          <strong>Données :</strong> Put WTI K=75, S=80, T=0.5an, r=3%, P_marché=3.20$.<br /><br />
          <strong>Étape 1 :</strong> Trouver un intervalle [σ_low, σ_high] contenant la solution.<br />
          BS_put(σ=0.10) = 0.45$ {'<'} 3.20$. BS_put(σ=0.80) = 8.90$ {'>'} 3.20$. Donc σ_impl ∈ [10%, 80%].<br /><br />
          <strong>Étape 2 :</strong> σ_mid = (10+80)/2 = 45%. BS_put(45%) = 4.82$ {'>'} 3.20$ → σ_impl {'<'} 45%.<br />
          Nouvel intervalle : [10%, 45%].<br /><br />
          <strong>Étape 3 :</strong> σ_mid = (10+45)/2 = 27.5%. BS_put(27.5%) = 3.18$ ≈ 3.20$. Très proche !<br /><br />
          <strong>Étape 4 :</strong> σ_mid = (27.5+45)/2 = 36.25%. BS_put(36.25%) = 3.94$ {'>'} 3.20$ → nouvel intervalle [27.5%, 36.25%].<br /><br />
          Après ~10-15 itérations : <strong style={{ color: ACCENT }}>σ_impl ≈ 27.8%</strong>. La bisection converge lentement (linéairement) mais de façon garantie.
        </div>
      </Accordion>

      <Grid cols={3} gap="8px">
        <Slider label="S" value={S} min={70} max={150} step={1} onChange={setS} accent={ACCENT} format={v => `${v}€`} />
        <Slider label="K" value={K} min={70} max={150} step={1} onChange={setK} accent={T.a5} format={v => `${v}€`} />
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

// ─── Tab: Smile ───────────────────────────────────────────────────────────────
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
        σ(K) = σ_ATM + skew × (K/S - 1) + kurt × (K/S - 1)²
      </FormulaBox>

      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Smile symétrique</strong> (skew=0, kurt{'>'} 0) : puts et calls OTM tous les deux plus chers que prévu par BS. Le marché craint des mouvements violents dans les deux sens. Typique pour les paires de devises, certaines matières premières.<br />
        <strong style={{ color: ACCENT }}>Skew négatif</strong> (skew{'<'} 0) : puts OTM beaucoup plus chers que calls OTM. Typique des marchés actions (peur des crashes) et du pétrole (peur des chutes de prix). Le skew est mesuré par 25Δ-skew = σ(25Δ-put) - σ(25Δ-call).<br />
        <strong style={{ color: ACCENT }}>Skew positif</strong> (skew{'>'} 0) : calls OTM plus chers. Parfois observé en énergie électricité/gaz naturel où le marché craint des spikes haussiers (vague de froid, panne de réseau).
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Pourquoi σ_impl(K) encode la densité risque-neutre</div>
        <Step num={1} accent={ACCENT}>Smile plat (σ_impl identique pour tous K) → la densité risque-neutre est exactement log-normale → B-S est parfait pour tous les strikes → jamais observé en pratique sur les marchés réels.</Step>
        <Step num={2} accent={ACCENT}>σ_impl(K) croît pour les K faibles (put OTM) → les événements S_T {'<'} K sont plus probables que ce que prédit la loi log-normale → queues gauches épaisses. Le marché "paye" une prime pour se protéger contre les crashes.</Step>
        <Step num={3} accent={ACCENT}>Formule de Breeden-Litzenberger (1978) : f_Q(K) = e^(rT) × ∂²C/∂K². La densité risque-neutre se lit directement dans la courbure des prix d'options en K. Une courbure forte à K bas → probabilité élevée d'être près de K à maturité.</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          Le smile de vol est la "carte" de la distribution réelle du sous-jacent vue par le marché. Chaque point du smile correspond à une information sur la densité risque-neutre à ce niveau de prix. Construire une surface de vol cohérente, c'est construire une distribution risque-neutre entière.
        </div>
      </div>

      <IntuitionBlock emoji="🧠" title="Prix d'options → Distribution implicite du marché" accent={ACCENT}>
        Une surface de vol implicite encode exactement la densité de probabilité risque-neutre du sous-jacent. La formule de <strong>Breeden-Litzenberger (1978)</strong> est remarquable : f(K,T) = e^(rT) × ∂²C/∂K². En dérivant deux fois le prix d'un call par rapport au strike K, on obtient directement la densité de probabilité risque-neutre. Un smile avec fort skew négatif correspond à une distribution asymétrique vers la gauche (queue gauche épaisse), c'est-à-dire une probabilité plus élevée de grandes baisses que ne le prédit la loi normale.
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
        <p>WTI à S=80$/bbl, σ_ATM=30%, T=3 mois. Observations marché :</p>
        <Step num={1} accent={ACCENT}>Put K=70 (OTM -12.5%) : σ_impl = 38% (protection crash pétrolier)</Step>
        <Step num={2} accent={ACCENT}>Call K=80 (ATM) : σ_impl = 30% (par définition)</Step>
        <Step num={3} accent={ACCENT}>Call K=90 (OTM +12.5%) : σ_impl = 27% (anticipation haussière moins chère)</Step>
        <Step num={4} accent={ACCENT}>Skew = (σ_25Δput - σ_25Δcall) / 2 ≈ -5% → skew négatif fort = marché craint les baisses</Step>
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
                <td style={{ color: T.muted, padding: '6px 10px' }}>σ_impl</td>
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
          3. Le skew 25Δ = (62% - 52%)/2 = +5%. Que signifie ce skew légèrement positif ? <em>Réponse : les puts OTM (côté baisse) sont légèrement plus valorisés que les calls OTM — le marché craint davantage les chutes que les hausses à ce moment.</em>
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

// ─── Tab: Surface ─────────────────────────────────────────────────────────────
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
        Une surface de vol ne peut pas être n'importe quelle fonction σ(K,T). Pour être cohérente avec l'absence d'arbitrage, elle doit satisfaire plusieurs contraintes :
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.9 }}>
        <strong style={{ color: ACCENT }}>Conditions d'absence d'arbitrage sur la surface :</strong><br />
        • <strong>Convexité en K :</strong> Pour T fixé, C(K,T) doit être convexe en K. Sinon, un butterfly spread serait en arbitrage.<br />
        • <strong>Monotonie en T :</strong> σ²(ATM,T) × T doit être croissant en T (variance totale croissante). Sinon, un calendar spread serait en arbitrage.<br />
        • <strong>Bornes sur σ :</strong> σ(K,T) doit être strictement positive. La variance totale w(K,T) = σ²(K,T)×T doit satisfaire des conditions de Gatheral (SVI).<br />
        • <strong>SVI (Stochastic Volatility Inspired) :</strong> Modèle de Gatheral (2004) pour paramétrer la variance totale w(k) = a + b × (ρ(k-m) + √((k-m)²+σ²)) — permet une calibration sans arbitrage en 5 paramètres.
      </div>

      <Accordion title="Exercice — Calculer la forward vol" accent={ACCENT} badge="Difficile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Données :</strong> Surface de vol WTI. σ_impl(ATM, 3M) = 28%, σ_impl(ATM, 6M) = 25%.<br /><br />
          <strong>Calcul de la forward vol entre 3M et 6M :</strong><br />
          σ²_fwd(3M→6M) = [σ²(6M) × T₂ - σ²(3M) × T₁] / (T₂ - T₁)<br />
          = [0.25² × 0.5 - 0.28² × 0.25] / (0.5 - 0.25)<br />
          = [0.03125 - 0.01960] / 0.25<br />
          = 0.01165 / 0.25 = 0.04660<br />
          σ_fwd(3M→6M) = √0.04660 = <strong style={{ color: ACCENT }}>21.6%</strong><br /><br />
          <strong>Interprétation :</strong> Le marché anticipe une vol de 21.6% entre le 3ème et le 6ème mois — inférieure à la vol de 3M (28%). La structure par terme est en backwardation : le marché pense que la vol va baisser après les 3 prochains mois.<br /><br />
          <strong>Application :</strong> Une option sur pétrole qui commence dans 3 mois et expire dans 6 mois (compound option ou option à départ différé) doit être pricée avec σ_fwd ≈ 21.6%, pas 25% ni 28%.
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

// ─── Tab: Heston ─────────────────────────────────────────────────────────────
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
        Black-Scholes suppose σ constant — mais en réalité, la volatilité elle-même fluctue !
        Le modèle de Heston (1993) modélise v = σ² comme un processus CIR (mean-reversion) :
        la volatilité revient vers un niveau long terme θ avec vitesse κ, et fluctue avec "vol de vol" ξ.
        La corrélation ρ entre prix et vol (généralement négative) génère le skew observé :
        quand le prix baisse, la vol monte — le "leverage effect".
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Modèle de Heston (1993)">
        dS = µS dt + √v · S · dW₁
        dv = κ(θ - v)dt + ξ·√v · dW₂

        avec : E[dW₁·dW₂] = ρ·dt
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
        <strong style={{ color: ACCENT }}>v₀ — Variance initiale :</strong> La variance au moment t=0, soit la vol courante du sous-jacent. v₀ = σ₀². Si le marché est actuellement volatil (σ₀=35%), v₀=0.1225. Si v₀ ≠ θ, la variance va drifter vers θ avec vitesse κ — cela crée la term structure de vol observée.
      </div>

      <SectionTitle accent={ACCENT}>Condition de Feller — garantir v(t) {'>'} 0</SectionTitle>
      <FormulaBox accent={ACCENT} label="Condition de Feller">
        2κθ {'>'} ξ²   →   la variance v(t) reste strictement positive
        Si 2κθ ≤ ξ² : v(t) peut atteindre 0 (problème numérique)
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La condition de Feller est une condition mathématique sur les paramètres du processus CIR (Cox-Ingersoll-Ross) pour garantir que la variance reste positive. En pratique, de nombreuses calibrations ne satisfont pas cette condition (le paramètre ξ calibré sur le marché est souvent trop grand). On utilise alors des schémas de discrétisation robustes (full truncation, absorption) qui troncatent v(t) à 0 pour éviter des valeurs négatives lors des simulations Monte Carlo.
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Comment ρ génère le skew — mécanisme exact</div>
        <Step num={1} accent={ACCENT}>Si ρ {'<'} 0 (leverage effect) : quand S baisse (dW_S {'<'} 0), la variance v tend à monter (car dW_v est corrélé négativement avec dW_S). En crise, baisse de prix et hausse de vol se produisent ensemble → puts OTM beaucoup plus chers que ce que prédit B-S → skew négatif prononcé.</Step>
        <Step num={2} accent={ACCENT}>Si ρ {'>'} 0 (energy spikes) : quand S monte, v monte aussi → calls OTM plus chers que puts OTM → skew positif. Typique du gaz naturel et de l'électricité : les spikes de prix sont haussiers et accompagnés de forte volatilité.</Step>
        <Step num={3} accent={ACCENT}>Si ρ = 0 : les deux processus sont indépendants → smile symétrique autour de l'ATM. B-S serait exact si la vol était constante, mais la vol of vol ξ génère quand même une courbure (kurt) même avec ρ=0.</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          Intuition des termes de l'EDS de v : κ(θ−v)dt = mean-reversion de la variance, θ = variance de LT (vol LT = √θ). ξ√v·dW_v = "vol de vol" — la variance elle-même fluctue, avec amplitude proportionnelle à √v (processus CIR). Plus ξ est grand, plus le smile est courbé.
        </div>
      </div>

      <IntuitionBlock emoji="🔄" title="Pourquoi ρ négatif génère un skew négatif" accent={ACCENT}>
        Le lien entre ρ et le skew est intuitif : avec ρ {'<'} 0, quand W₁ est négatif (prix S baisse), W₂ tend à être positif (variance v monte). Résultat : les grandes baisses de prix sont corrélées avec une forte volatilité. Cela signifie que les puts OTM (qui paient lors des baisses) sont relativement plus chers car ces baisses surviennent justement quand la vol est haute — elles sont "doublement mauvaises". Conséquence directe : le smile est asymétrique, plus haut côté put OTM = skew négatif. Plus |ρ| est grand, plus le skew est prononcé.
      </IntuitionBlock>

      <Accordion title="Exercice — Calibration intuitive de Heston" accent={ACCENT} badge="Difficile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Problème :</strong> On observe le smile suivant pour le WTI (T=3M, S=80) :<br />
          σ_impl(K=70) = 38%, σ_impl(K=80) = 30%, σ_impl(K=90) = 26%.<br />
          Le skew 25Δ = (38-26)/2 = -6%. Comment choisir ρ pour reproduire ce skew ?<br /><br />
          <strong>Règle heuristique :</strong> Plus le skew est négatif (fort), plus ρ doit être négatif. En général : skew ≈ -ρ × ξ × √(T/2) (approximation de premier ordre). Avec ξ=0.5 et T=0.25 : ρ ≈ skew / (ξ × √(T/2)) = -0.06 / (0.5 × 0.354) ≈ -0.34.<br /><br />
          <strong>Itération calibration :</strong><br />
          1. Fixer v₀ = ATM_vol² = 0.09 (σ₀=30%)<br />
          2. Fixer θ = v₀ = 0.09 (vol de long terme similaire à vol courante)<br />
          3. Fixer κ = 2.0 (mean-reversion modérée)<br />
          4. Essayer ξ = 0.5, ρ = -0.7 → calculer le smile Heston (via Fourier ou MC)<br />
          5. Comparer au smile observé. Ajuster ρ pour le skew, ξ pour la courbure.<br /><br />
          <strong>Résultat :</strong> Heston avec ρ=-0.7, ξ=0.5, κ=2, θ=0.09 reproduit typiquement un skew de -5 à -8% selon les autres paramètres. Vérifier la condition de Feller : 2×2×0.09 = 0.36 {'>'} 0.5² = 0.25 ✓.
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

// ─── Main Module 5 ────────────────────────────────────────────────────────────
const TABS = ['Vol Historique', 'Vol Implicite', 'Smile', 'Surface', 'Heston']

export default function Module5() {
  const [tab, setTab] = useState('Smile')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      <ModuleHeader
        num={5}
        title="Volatilité & Surfaces"
        subtitle="Vol historique vs implicite, smile de volatilité, surface σ(K,T) et modèle de Heston — les outils avancés du trader options en énergie."
        accent={ACCENT}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} accent={ACCENT} />
      {tab === 'Vol Historique' && <HistVolTab />}
      {tab === 'Vol Implicite' && <ImplVolTab />}
      {tab === 'Smile' && <SmileTab />}
      {tab === 'Surface' && <SurfaceTab />}
      {tab === 'Heston' && <HestonTab />}
    </div>
  )
}
