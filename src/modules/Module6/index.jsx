import React, { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { T } from '../../design/tokens'
import {
  ModuleHeader, TabBar, FormulaBox, IntuitionBlock, ExampleBlock,
  Slider, Accordion, Step, SymbolLegend, SectionTitle, InfoChip, Grid, ChartWrapper,
  Demonstration, DemoStep, K,
} from '../../design/components'

const ACCENT = T.a6

function normCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const p = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  const phi = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
  return x >= 0 ? 1 - phi * p : phi * p
}
function normInv(p) {
  // Rational approximation of inverse normal CDF
  const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
  const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01]
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00]
  const pLow = 0.02425, pHigh = 1 - pLow
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p <= pHigh) {
    const q = p - 0.5, r = q * q
    return (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q / (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1)
  }
  const q = Math.sqrt(-2 * Math.log(1 - p))
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
}
function gaussRand() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ─── Tab: VaR Variance-Covariance ─────────────────────────────────────────────
export function VarCovTab() {
  const [mu, setMu] = useState(0)
  const [sigma, setSigma] = useState(0.02)
  const [alpha, setAlpha] = useState(0.99)
  const [horizon, setHorizon] = useState(1)
  const [position, setPosition] = useState(1000000)

  const zAlpha = -normInv(1 - alpha)
  const varAmount = position * (mu * horizon - zAlpha * sigma * Math.sqrt(horizon))
  const varPct = (mu * horizon - zAlpha * sigma * Math.sqrt(horizon)) * 100
  const cvar = position * (sigma * Math.sqrt(horizon) * Math.exp(-zAlpha * zAlpha / 2) / (Math.sqrt(2 * Math.PI) * (1 - alpha)) - mu * horizon)

  const dist = useMemo(() => {
    const pts = []
    for (let x = -6 * sigma; x <= 6 * sigma; x += sigma / 20) {
      const z = (x - mu * horizon) / (sigma * Math.sqrt(horizon))
      const pdf = Math.exp(-z * z / 2) / (sigma * Math.sqrt(horizon) * Math.sqrt(2 * Math.PI))
      pts.push({
        ret: +(x * 100).toFixed(3),
        pdf: +pdf.toFixed(4),
        shade: x <= varPct / 100 ? +pdf.toFixed(4) : null,
      })
    }
    return pts
  }, [mu, sigma, alpha, horizon])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La <strong style={{ color: ACCENT }}>Value at Risk (VaR)</strong> répond à une question simple : <em>"Combien puis-je perdre au maximum avec X% de probabilité sur un horizon T ?"</em> C'est devenu le standard réglementaire mondial depuis <strong>Bâle II (2004)</strong> et reste central dans Bâle III. Chaque grande banque, chaque trader d'énergie doit calculer et reporter sa VaR quotidiennement. La méthode variance-covariance (dite "paramétrique") est la plus rapide à calculer — elle suppose que les rendements suivent une loi normale.
      </div>

      <IntuitionBlock emoji="🎯" title="VaR : la perte maximale avec X% de confiance" accent={ACCENT}>
        La VaR (Value at Risk) répond à : "Avec 99% de confiance, quelle est la perte maximale
        sur les prochains N jours ?" Si VaR(99%, 1j) = 1M€, cela signifie que dans 1% des cas
        (≈ 2-3 jours par an), la perte dépassera 1M€. C'est le standard réglementaire (Bâle II/III).
        En énergie : les traders doivent reporter leur VaR quotidienne au risk management.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="VaR Variance-Covariance (approche paramétrique)">
        VaR(α) = -[µ·H - z_α·σ·√H] × Valeur du portefeuille

        z_α = N⁻¹(α) : quantile de la loi normale standard
      </FormulaBox>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie de la VaR paramétrique — VaR_α = −µ_ΔP + z_α × σ_ΔP</div>
        <Step num={1} accent={ACCENT}>−µ_ΔP : on soustrait la tendance (drift). Si le portefeuille a un rendement espéré positif µ, cela améliore la VaR (réduit la perte potentielle). En pratique, µ ≈ 0 sur 1 jour, mais important sur horizons longs (10 jours, 1 mois).</Step>
        <Step num={2} accent={ACCENT}>z_α × σ_ΔP : le "quantile × volatilité". z_α est le quantile de la loi normale standard au niveau α. Pour VaR 95% : z = 1.645 (perte dépassée 5% du temps). Pour VaR 99% : z = 2.326 (dépassée 1%). Pour VaR 99.9% (capital Bâle) : z = 3.09 (dépassée 0.1%).</Step>
        <Step num={3} accent={ACCENT}>Pour un portefeuille : σ_ΔP = √(wᵀΣw) × V. Le terme wᵀΣw est la variance relative du portefeuille — quadratique, donc les corrélations jouent un rôle clé. Si ρ {'<'} 1 entre actifs, wᵀΣw {'<'} Σᵢ wᵢ²σᵢ² : la diversification réduit la variance !</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          L'effet de diversification apparaît dans les termes croisés de Σ : si ρ {'<'} 1, wᵀΣw {'<'} somme des variances individuelles → VaR portefeuille {'<'} somme des VaR individuelles → bénéfice de diversification mesurable.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Dérivation step-by-step de la VaR paramétrique</SectionTitle>
      <ExampleBlock title="Dérivation de la formule VaR" accent={ACCENT}>
        <FormulaBox accent={ACCENT} label="Résultat">
          <K>{"\\text{VaR}_{\\alpha} = -\\mu_{\\Delta P} + z_{\\alpha} \\cdot \\sigma_{\\Delta P}"}</K>
        </FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="VaR paramétrique" ruleDetail="ΔP ~ N(µ, σ²)" accent={ACCENT}><strong>Hypothèse de normalité :</strong> On suppose <K>{"\\Delta P \\sim \\mathcal{N}(\\mu_{\\Delta P},\\, \\sigma_{\\Delta P}^2)"}</K>, c'est-à-dire que le P&L du portefeuille est distribué normalement avec moyenne µ_ΔP et variance σ_ΔP².</DemoStep>
          <DemoStep num={2} rule="Quantile de risque" ruleDetail="P(ΔP < −VaR) = 1−α" accent={ACCENT}><strong>Définition de la VaR :</strong> <K>{"\\text{VaR}_{\\alpha}"}</K> est le seuil tel que <K>{"P(\\Delta P < -\\text{VaR}_{\\alpha}) = 1 - \\alpha"}</K>. En d'autres termes, VaR_α est le (1-α)-quantile de la distribution des pertes.</DemoStep>
          <DemoStep num={3} rule="Standardisation" ruleDetail="Z = (X−µ)/σ" accent={ACCENT}><strong>Standardisation :</strong> <K>{"P(\\Delta P < -\\text{VaR}_{\\alpha}) = P\\!\\left(Z < \\frac{-\\text{VaR}_{\\alpha} - \\mu}{\\sigma}\\right) = 1-\\alpha"}</K>, où Z ~ N(0,1). Donc <K>{"\\text{VaR}_{\\alpha} = -\\mu_{\\Delta P} + z_{\\alpha} \\cdot \\sigma_{\\Delta P}"}</K> en convention perte positive.</DemoStep>
          <DemoStep num={4} rule="Corrélation" ruleDetail="σ_p = √(wᵀΣw)" accent={ACCENT}><strong>Portefeuille :</strong> Pour un portefeuille multi-actifs, <K>{"\\sigma_{\\Delta P} = \\sqrt{\\mathbf{w}^\\top \\Sigma \\mathbf{w}} \\times V"}</K>, où Σ est la matrice de variance-covariance des rendements. En pratique : <K>{"\\sigma_p = \\sqrt{\\sum_i \\sum_j w_i w_j \\sigma_i \\sigma_j \\rho_{ij}} \\times V"}</K>.</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.9 }}>
        <strong style={{ color: ACCENT }}>Ce que la VaR N'EST PAS — 3 limites critiques :</strong><br />
        1. <strong>La VaR ne dit pas combien on perd SI on dépasse le seuil.</strong> Si VaR(99%)=1M€ et qu'on a un jour noir, la perte peut être 1M€ ou 50M€ — la VaR ne le dit pas. Pour ça, on utilise le CVaR (Expected Shortfall).<br />
        2. <strong>La VaR n'est pas sous-additive</strong> — paradoxe majeur : VaR(A+B) peut être supérieure à VaR(A) + VaR(B). Elle peut "punir" la diversification ! C'est pourquoi le CVaR (qui est sous-additif) est préféré pour l'allocation de capital.<br />
        3. <strong>La VaR paramétrique suppose la normalité.</strong> Sur des marchés énergétiques à queues épaisses, cela sous-estime systématiquement les pertes extrêmes. La VaR normale à 99.9% peut être 2-3 fois trop petite comparée à la réalité (EVT).
      </div>

      <SectionTitle accent={ACCENT}>Expected Shortfall (ES) / CVaR — la mesure de risque cohérente</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        L'Expected Shortfall (ES), aussi appelé CVaR (Conditional VaR) ou Expected Tail Loss (ETL), répond à la question : "En moyenne, combien perd-on dans les (1-α)% pires cas ?" C'est une mesure de risque <em>cohérente</em> (au sens d'Artzner et al., 1999), ce qui signifie notamment qu'elle est sous-additive.
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>ES vs VaR — ce que chaque mesure regarde</div>
        <Step num={1} accent={ACCENT}>VaR dit : "Je perds au maximum X avec probabilité α" → elle fixe un seuil, mais ne dit RIEN sur ce qui se passe au-delà. Une VaR 99% de 1M€ est compatible avec une perte maximale possible de 1M€ ou de 1 milliard€.</Step>
        <Step num={2} accent={ACCENT}>ES dit : "Quand je dépasse la VaR, je perds en moyenne X_ES" → c'est la perte espérée conditionnelle dans le scénario défavorable. ES_99% = E[perte | perte {'>'} VaR_99%].</Step>
        <Step num={3} accent={ACCENT}>Sous normalité : ES_α = µ − σ × φ(z_α)/(1−α). Pour α=95% : φ(1.645)/0.05 ≈ 2.063 → ES_95% ≈ VaR_95% × 1.33 (33% de plus). Pour α=99% : φ(2.326)/0.01 ≈ 2.665 → ES_99% ≈ VaR_99% × 1.15 (15% de plus).</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          ES est "cohérente" (sous-additive) : ES(A+B) ≤ ES(A) + ES(B) → la diversification est toujours récompensée. VaR ne l'est pas. C'est pourquoi Bâle III (FRTB) a adopté ES 97.5% comme standard réglementaire en remplacement de VaR 99%.
        </div>
      </div>

      <FormulaBox accent={ACCENT} label="Expected Shortfall (CVaR)">
        ES_α = E[Perte | Perte {'>'} VaR_α]

        Formule continue : ES_α = (1/(1-α)) × ∫_α^1 VaR_u du

        Pour une distribution normale : ES_α = µ + σ × ϕ(z_α) / (1-α)
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Bâle III / FRTB :</strong> Depuis la réforme FRTB (Fundamental Review of the Trading Book, 2016), les banques doivent utiliser l'ES à 97.5% (au lieu de la VaR à 99%). ES_97.5% ≈ VaR_99% numériquement, mais ES est une meilleure mesure théoriquement car elle capture l'amplitude des pertes dans la queue, pas juste le seuil.
      </div>

      <Accordion title="Exercice — VaR d'un portefeuille bivarié" accent={ACCENT} badge="Moyen">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Portefeuille :</strong> WTI (w₁=60%, σ₁=25%) + Gaz Nat (w₂=40%, σ₂=40%), corrélation ρ=0.3. Valeur totale = 10M€. α=99%, H=1j.<br /><br />
          <strong>Étape 1 — Variance du portefeuille :</strong><br />
          σ²_p = w₁²σ₁² + w₂²σ₂² + 2w₁w₂σ₁σ₂ρ<br />
          = (0.6)²×(0.25/√252)² + (0.4)²×(0.40/√252)² + 2×0.6×0.4×(0.25/√252)×(0.40/√252)×0.3<br />
          (en rendements daily) = 0.36×0.000248 + 0.16×0.000635 + 2×0.24×0.000397×0.3<br />
          = 0.0000893 + 0.0001016 + 0.0000571 = 0.000248<br />
          σ_p_daily = √0.000248 = 1.574%<br /><br />
          <strong>Étape 2 — VaR :</strong> z_99% = 2.326<br />
          VaR_p = 2.326 × 1.574% × 10M€ = <strong style={{ color: ACCENT }}>366 000€</strong><br /><br />
          <strong>Comparaison sans diversification :</strong><br />
          VaR_WTI_alone = 2.326 × 25%/√252 × 6M€ = 220 500€<br />
          VaR_Gaz_alone = 2.326 × 40%/√252 × 4M€ = 233 900€<br />
          VaR_somme = 454 400€ {'>'} VaR_p = 366 000€ → bénéfice de diversification = 88 400€ (19.4%)
        </div>
      </Accordion>

      <Accordion title="Exercice — CVaR vs VaR comparaison" accent={ACCENT} badge="Moyen">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Même portefeuille :</strong> σ_daily = 1.574%, µ ≈ 0, Valeur = 10M€, α=99%.<br /><br />
          <strong>VaR(99%) = 2.326 × 1.574% × 10M€ = 366 000€</strong><br /><br />
          <strong>CVaR(99%) = σ × ϕ(z_99%) / (1-99%) × Valeur</strong><br />
          ϕ(2.326) = (1/√2π) × e^(-2.326²/2) = 0.3989 × e^(-2.706) = 0.3989 × 0.0670 = 0.02672<br />
          CVaR = 1.574% × 0.02672 / 0.01 × 10M€ = 1.574% × 2.672 × 10M€ = <strong style={{ color: ACCENT }}>420 600€</strong><br /><br />
          <strong>Ratio CVaR/VaR = 420 600 / 366 000 = 1.149</strong> — le CVaR est 14.9% plus élevé que la VaR, représentant la perte moyenne dans les 1% pires cas. Ce ratio est toujours {'>'} 1 et augmente avec les queues épaisses.
        </div>
      </Accordion>

      <SymbolLegend accent={ACCENT} symbols={[
        ['α', 'Niveau de confiance (95% ou 99%)'],
        ['z_α', 'Quantile : z_{95%}=1.645, z_{99%}=2.326'],
        ['µ', 'Rendement espéré journalier'],
        ['σ', 'Volatilité journalière'],
        ['H', 'Horizon (jours)'],
      ]} />

      <Grid cols={3} gap="8px">
        <Slider label="µ (drift journalier)" value={mu} min={-0.005} max={0.005} step={0.0001} onChange={setMu} accent={ACCENT} format={v => `${(v * 100).toFixed(2)}%`} />
        <Slider label="σ (vol journalière)" value={sigma} min={0.005} max={0.05} step={0.001} onChange={setSigma} accent={T.a5} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="Niveau de confiance α" value={alpha} min={0.9} max={0.999} step={0.001} onChange={setAlpha} accent={ACCENT} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="Horizon H (jours)" value={horizon} min={1} max={10} step={1} onChange={setHorizon} accent={T.muted} format={v => `${v}j`} />
        <Slider label="Position (€)" value={position} min={100000} max={10000000} step={100000} onChange={setPosition} accent={T.muted} format={v => `${(v / 1e6).toFixed(1)}M€`} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
        <InfoChip label={`z_α (${(alpha * 100).toFixed(0)}%)`} value={zAlpha.toFixed(4)} accent={ACCENT} />
        <InfoChip label="VaR (%)" value={`${(-varPct).toFixed(2)}%`} accent={T.a2} />
        <InfoChip label="VaR (€)" value={`${(-varAmount / 1e6).toFixed(3)}M€`} accent={ACCENT} />
        <InfoChip label="CVaR (€)" value={`${(cvar / 1e6).toFixed(3)}M€`} accent={T.a8} />
      </div>

      <ChartWrapper title={`Distribution P&L — Zone rouge = ${(1 - alpha) * 100}% des cas (queue de perte)`} accent={ACCENT} height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dist} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="ret" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} unit="%" />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <ReferenceLine x={varPct.toFixed(2)} stroke={ACCENT} strokeWidth={2} label={{ value: `-VaR${(alpha * 100).toFixed(0)}%`, fill: ACCENT, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Line type="monotone" dataKey="pdf" stroke={T.a5} strokeWidth={2.5} dot={false} name="f(r)" />
            <Line type="monotone" dataKey="shade" stroke={ACCENT} strokeWidth={0} dot={false} fill={`${ACCENT}55`} name={`Queue ${(1 - alpha) * 100}%`} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ExampleBlock title="VaR d'un portefeuille pétrole" accent={ACCENT}>
        <p>Portefeuille WTI : 100 000 barils @ 80$/bbl = 8M$, σ_daily=2%, H=1j, α=99%</p>
        <FormulaBox accent={ACCENT} label="Résultat">
          <K>{"\\text{VaR}(99\\%,\\,10j) \\approx 1{,}18\\,\\text{M\\$}"}</K>
        </FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="VaR paramétrique" ruleDetail="σ_pos = V × σ" accent={ACCENT}><K>{"\\sigma_{\\text{pos}} = 8\\text{M\\$} \\times 2\\% = 160\\,000\\text{\\$/j}"}</K></DemoStep>
          <DemoStep num={2} rule="Quantile normal" ruleDetail="z = Φ⁻¹(α)" accent={ACCENT}><K>{"z_{99\\%} = \\Phi^{-1}(0.99) = 2.326"}</K></DemoStep>
          <DemoStep num={3} rule="VaR paramétrique" ruleDetail="VaR = z × σ" accent={ACCENT}><K>{"\\text{VaR}(99\\%,\\,1j) = 2.326 \\times 160\\,000 = 372\\,160\\$"}</K></DemoStep>
          <DemoStep num={4} rule="Diversification" ruleDetail="VaR(H) = VaR(1)×√H" accent={ACCENT}><K>{"\\text{VaR}(99\\%,\\,10j) = 372\\,160 \\times \\sqrt{10} = 1\\,176\\,810\\$ \\approx 1{,}18\\,\\text{M\\$}"}</K>. La « règle √T » (racine du temps) suppose des rendements iid normaux.</DemoStep>
        </Demonstration>
      </ExampleBlock>
    </div>
  )
}

// ─── Tab: VaR Historique ──────────────────────────────────────────────────────
export function VarHistTab() {
  const [alpha, setAlpha] = useState(0.99)
  const [sigma, setSigma] = useState(0.02)
  const [nDays, setNDays] = useState(500)
  const [key, setKey] = useState(0)

  const returns = useMemo(() => {
    const r = []
    for (let i = 0; i < nDays; i++) r.push(gaussRand() * sigma)
    return r.sort((a, b) => a - b)
  }, [sigma, nDays, key])

  const varIdx = Math.floor((1 - alpha) * nDays)
  const varHist = -returns[varIdx]
  const esTail = returns.slice(0, varIdx + 1)
  const esHist = -esTail.reduce((a, b) => a + b, 0) / esTail.length

  const histogram = useMemo(() => {
    const bins = {}
    const bw = 0.004
    returns.forEach(r => {
      const bin = (Math.round(r / bw) * bw).toFixed(3)
      bins[bin] = (bins[bin] || 0) + 1
    })
    return Object.entries(bins).sort(([a], [b]) => parseFloat(a) - parseFloat(b))
      .map(([r, count]) => ({
        r: (parseFloat(r) * 100).toFixed(1),
        count,
        tail: parseFloat(r) <= -varHist ? count : 0,
      }))
  }, [returns, varHist])

  const varNorm = sigma * -normInv(1 - alpha)

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La <strong style={{ color: ACCENT }}>VaR historique</strong> est une méthode <em>non-paramétrique</em> : elle n'assume aucune distribution des rendements. Elle utilise directement les données passées — l'hypothèse implicite est que le futur ressemble au passé. C'est conceptuellement la méthode la plus simple et la plus facile à expliquer aux régulateurs et aux comités de risque.
      </div>

      <IntuitionBlock emoji="📜" title="VaR historique : utiliser le passé directement" accent={ACCENT}>
        Au lieu d'assumer une distribution normale, on prend les rendements historiques réels,
        on les trie du pire au meilleur, et on lit le percentile directement.
        Avantage : capture les vraies queues épaisses (fat tails) et les événements extrêmes.
        Inconvénient : dépend de l'échantillon historique — rare d'avoir un autre 2008 dans les données !
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="VaR Historique — Méthode">
        1. Collecter n rendements historiques : r₁, r₂, ..., rₙ
        2. Trier par ordre croissant : r₍₁₎ ≤ r₍₂₎ ≤ ... ≤ r₍ₙ₎
        3. VaR(α) = -r₍⌊(1-α)×n⌋₎
        4. CVaR(α) = -moyenne des ⌊(1-α)×n⌋ pires rendements
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Avantages et inconvénients de la VaR historique</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Avantages</div>
          {[
            'Capture automatiquement les queues épaisses (fat tails) sans hypothèse paramétrique',
            'Capture les corrélations de crise (qui augmentent fortement lors des crashs)',
            'Applicable à des distributions non-normales, non-symétriques, multimodales',
            'Simple à comprendre et à expliquer aux régulateurs et aux conseils d\'administration',
            'Reflète fidèlement ce qui s\'est réellement passé sur les marchés',
          ].map((item, i) => <div key={i} style={{ color: T.muted, fontSize: 12, marginBottom: 4 }}>✅ {item}</div>)}
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Inconvénients</div>
          {[
            '"Ghost effects" : un événement extrême passé (ex: 2008) impacte la VaR pendant toute la fenêtre puis disparaît soudainement quand il sort de la fenêtre',
            'Ne peut pas extrapoler au-delà des données historiques — un événement jamais vu = VaR nulle pour cet événement',
            'Tous les scénarios passés ont le même poids, qu\'ils datent d\'hier ou de 2 ans',
            'Nécessite une longue série historique (idéalement 250-1000 jours) pour des quantiles élevés',
            'Peu réactive aux changements de régime de marché récents',
          ].map((item, i) => <div key={i} style={{ color: T.muted, fontSize: 12, marginBottom: 4 }}>❌ {item}</div>)}
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Age-Weighting — pondération EWMA historique</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Pour corriger le problème de "tous les poids égaux", on peut appliquer une pondération exponentielle aux données historiques — les observations récentes reçoivent plus de poids. C'est l'approche BRW (Boudoukh, Richardson, Whitelaw, 1998).
      </div>
      <FormulaBox accent={ACCENT} label="EWMA Age-Weighting (BRW)">
        wᵢ = (1-λ) × λⁱ   pour i = 0, 1, ..., n-1
        (i=0 = observation la plus récente)

        λ = 0.99 (standard) → demi-vie ≈ 69 jours
        λ = 0.97 → demi-vie ≈ 23 jours (plus réactif)
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Demi-vie :</strong> La demi-vie de l'information avec un facteur λ est ln(0.5)/ln(λ). Pour λ=0.99, demi-vie ≈ 69 jours — cela signifie que les données de plus de 69 jours contribuent pour moins de 50% du poids total. Pour l'énergie, une demi-vie de 20-40 jours (λ ≈ 0.97-0.98) est souvent plus appropriée car la vol change rapidement.
      </div>

      <Accordion title="Exercice — Back-testing de la VaR historique (test de Kupiec)" accent={ACCENT} badge="Difficile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Principe du back-testing :</strong> On calcule la VaR chaque jour sur les données passées, puis on compare avec la perte réelle du lendemain. Un "excès" (violation) se produit quand la perte réelle dépasse la VaR.<br /><br />
          <strong>Test de Kupiec (1995) — Proportion of Failures (POF) :</strong><br />
          Sous H₀ (VaR correcte), le nombre d'excès X suit une loi binomiale B(n, 1-α).<br />
          Statistique : LR_pof = -2×ln[(1-p₀)^(n-x) × p₀^x] + 2×ln[(1-p̂)^(n-x) × p̂^x]<br />
          où p₀ = 1-α (taux théorique), p̂ = x/n (taux observé), n = nombre de jours, x = nombre d'excès.<br /><br />
          <strong>Exemple numérique :</strong><br />
          n = 250 jours, α = 99%, x = 8 excès observés.<br />
          Taux attendu : p₀ = 1% → excès attendus = 2.5.<br />
          Taux observé : p̂ = 8/250 = 3.2%.<br />
          LR_pof = -2×ln[0.99^242 × 0.01^8] + 2×ln[0.968^242 × 0.032^8] ≈ 9.78<br />
          Valeur critique χ²(1) à 5% = 3.84. Comme 9.78 {'>'} 3.84 → <strong style={{ color: ACCENT }}>VaR rejetée</strong> : trop d'excès, la VaR est sous-estimée.<br /><br />
          <strong>Interprétation :</strong> Une bonne VaR à 99% sur 250 jours devrait avoir entre 0 et 5 violations (approximativement). 8 violations = modèle sous-estime le risque.
        </div>
      </Accordion>

      <Grid cols={3} gap="8px">
        <Slider label="α" value={alpha} min={0.9} max={0.999} step={0.001} onChange={setAlpha} accent={ACCENT} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="σ vraie" value={sigma} min={0.005} max={0.05} step={0.001} onChange={setSigma} accent={T.a5} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="n (jours historiques)" value={nDays} min={100} max={2000} step={50} onChange={setNDays} accent={T.muted} format={v => `${v}j`} />
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelle série</button>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="VaR hist." value={`${(varHist * 100).toFixed(2)}%`} accent={ACCENT} />
        <InfoChip label="CVaR/ES hist." value={`${(esHist * 100).toFixed(2)}%`} accent={T.a8} />
        <InfoChip label="VaR normale" value={`${(varNorm * 100).toFixed(2)}%`} accent={T.muted} />
        <InfoChip label="Obs. dans la queue" value={`${varIdx + 1}`} accent={T.muted} />
      </div>

      <ChartWrapper title={`Histogramme P&L — Queue rouge = ${(1 - alpha) * 100}% des pires jours`} accent={ACCENT} height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="r" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} unit="%" />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
            <ReferenceLine x={(-varHist * 100).toFixed(1)} stroke={ACCENT} strokeWidth={2} label={{ value: `-VaR`, fill: ACCENT, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Bar dataKey="count" fill={T.a5} fillOpacity={0.6} name="Fréquence" />
            <Bar dataKey="tail" fill={ACCENT} fillOpacity={0.9} name="Tail (VaR region)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>CVaR vs VaR</SectionTitle>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 16, margin: '12px 0' }}>
        <div style={{ color: T.text, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>VaR</strong> = seuil de perte dépassé avec prob (1-α). Ne dit rien sur <em>combien</em> on perd au-delà.<br />
          <strong style={{ color: T.a8 }}>CVaR / Expected Shortfall</strong> = perte moyenne dans les (1-α)% pires cas.<br />
          CVaR ≥ VaR toujours. CVaR est cohérente (sous-additivité) contrairement à VaR.<br />
          <strong style={{ color: T.muted }}>Réglementation :</strong> Bâle III/FRTB impose CVaR 97.5% au lieu de VaR 99%.
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Monte Carlo VaR ─────────────────────────────────────────────────────
export function VarMCTab() {
  const [sigma1, setSigma1] = useState(0.25)
  const [sigma2, setSigma2] = useState(0.35)
  const [rho, setRho] = useState(0.5)
  const [w1, setW1] = useState(0.6)
  const [T2, setT2] = useState(1 / 252)
  const [nSim, setNSim] = useState(10000)
  const [alpha, setAlpha] = useState(0.99)
  const [key, setKey] = useState(0)

  const { varMC, esMC, histData } = useMemo(() => {
    const w2 = 1 - w1
    const dt = T2
    const plArray = []
    for (let i = 0; i < nSim; i++) {
      const Z1 = gaussRand()
      const Z2 = gaussRand()
      const W1 = Z1
      const W2 = rho * Z1 + Math.sqrt(1 - rho * rho) * Z2
      const r1 = (-0.5 * sigma1 * sigma1 * dt) + sigma1 * Math.sqrt(dt) * W1
      const r2 = (-0.5 * sigma2 * sigma2 * dt) + sigma2 * Math.sqrt(dt) * W2
      const portReturn = w1 * r1 + w2 * r2
      plArray.push(portReturn)
    }
    plArray.sort((a, b) => a - b)
    const varIdx = Math.floor((1 - alpha) * nSim)
    const varMC = -plArray[varIdx]
    const esMC = -plArray.slice(0, varIdx + 1).reduce((a, b) => a + b, 0) / (varIdx + 1)

    const bins = {}
    const bw = 0.003
    plArray.forEach(r => {
      const bin = (Math.round(r / bw) * bw).toFixed(3)
      bins[bin] = (bins[bin] || 0) + 1
    })
    const histData = Object.entries(bins).sort(([a], [b]) => parseFloat(a) - parseFloat(b))
      .map(([r, count]) => ({
        r: (parseFloat(r) * 100).toFixed(1),
        count,
        tail: parseFloat(r) <= -varMC ? count : 0,
      }))

    return { varMC, esMC, histData }
  }, [sigma1, sigma2, rho, w1, T2, nSim, alpha, key])

  const varAnal = (w1 * sigma1 + (1 - w1) * sigma2) * Math.sqrt(T2) * -normInv(1 - alpha)

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La <strong style={{ color: ACCENT }}>VaR Monte Carlo</strong> est la méthode la plus flexible et la plus puissante. Elle peut gérer n'importe quel modèle de prix (GBM, Ornstein-Uhlenbeck, MRJD), n'importe quel type d'option (vanilles, exotiques, path-dependent), et n'importe quelle structure de portefeuille. Son seul inconvénient est le coût computationnel — mais avec les processeurs modernes, simuler 100 000 scénarios prend moins d'une seconde.
      </div>

      <IntuitionBlock emoji="🎰" title="Monte Carlo VaR : simuler des milliers de scénarios" accent={ACCENT}>
        Pour un portefeuille de plusieurs actifs corrélés, l'approche analytique devient complexe.
        Monte Carlo : on simule N scénarios de rendements corrélés, on calcule le P&L du portefeuille
        pour chaque scénario, et on lit le percentile voulu. C'est la méthode la plus flexible :
        elle gère les corrélations non-linéaires, les options, les instruments exotiques.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Monte Carlo VaR — 2 actifs corrélés">
        Pour i = 1..N :
          Z₁, Z₂ ~ N(0,1) iid
          r₁ = σ₁√H × W₁,   r₂ = σ₂√H × W₂   (avec Cholesky)
          P&amp;L_i = w₁ × r₁ + w₂ × r₂
        VaR_MC(α) = -percentile(P&amp;L, 1-α)
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Étapes de la VaR Monte Carlo</SectionTitle>
      <ExampleBlock title="Procédure complète VaR MC" accent={ACCENT}>
        <FormulaBox accent={ACCENT} label="Résultat">
          <K>{"\\text{VaR}_{MC}(\\alpha) = -\\text{PnL}_{\\lfloor(1-\\alpha)N\\rfloor}"}</K>
        </FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Monte Carlo" ruleDetail="Calibration µ, σ, ρ" accent={ACCENT}><strong>Calibrer les paramètres du modèle :</strong> Estimer <K>{"\\mu,\\,\\sigma,\\,\\rho"}</K> pour chaque actif à partir des données historiques. Pour un portefeuille énergie : µ_WTI, σ_WTI, µ_Gaz, σ_Gaz, ρ(WTI, Gaz). Utiliser éventuellement des modèles plus sophistiqués (GARCH pour la vol, mean-reversion pour les spreads).</DemoStep>
          <DemoStep num={2} rule="Simulation" ruleDetail="Cholesky : W = LZ" accent={ACCENT}><strong>Simuler N scénarios de prix à l'horizon T :</strong> Pour chaque simulation i, tirer des aléas corrélés via la décomposition de Cholesky. Pour 2 actifs : <K>{"W_1 = Z_1,\\; W_2 = \\rho Z_1 + \\sqrt{1-\\rho^2}\\,Z_2"}</K> avec <K>{"Z_1, Z_2 \\sim \\mathcal{N}(0,1)"}</K>. Pour n actifs, utiliser la décomposition complète de Cholesky de la matrice de corrélation.</DemoStep>
          <DemoStep num={3} rule="Simulation" ruleDetail="PnL = Σ wⱼ rⱼ V" accent={ACCENT}><strong>Valoriser le portefeuille dans chaque scénario :</strong> Calculer la valeur du portefeuille à t+H sous chaque scénario. Pour des positions simples (futures) : <K>{"\\text{PnL}_i = \\sum_j w_j \\cdot r_{j,i} \\cdot V"}</K>. Pour des options : recalculer le prix BS ou regreek dans chaque scénario.</DemoStep>
          <DemoStep num={4} rule="Quantile empirique" ruleDetail="VaR = −PnL₍ₖ₎" accent={ACCENT}><strong>Lire le quantile :</strong> Trier les N P&L simulés. <K>{"\\text{VaR}_{MC}(\\alpha) = -\\text{PnL}_{\\lfloor(1-\\alpha)N\\rfloor}"}</K>. <K>{"\\text{CVaR}_{MC} = -\\frac{1}{k}\\sum_{i=1}^{k} \\text{PnL}_{(i)}"}</K>. L'erreur d'estimation MC est de l'ordre de <K>{"\\frac{\\text{VaR}}{\\sqrt{N(1-\\alpha)}}"}</K>.</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Corrélations en Monte Carlo — l'outil Cholesky</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Simuler des actifs corrélés correctement est crucial. La <strong style={{ color: ACCENT }}>décomposition de Cholesky</strong> L de la matrice de corrélation Σ = LLᵀ permet de générer des vecteurs aléatoires corrélés : X = L × Z où Z ~ N(0,I). Pour une matrice 3×3, Cholesky donne une matrice triangulaire inférieure L telle que Z₁_corr = L₁₁Z₁, Z₂_corr = L₂₁Z₁ + L₂₂Z₂, etc.
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Corrélations de crise :</strong> En période normale, ρ(WTI, Gaz) ≈ 0.3-0.5. En période de crise (krach pétrolier 2020), toutes les corrélations entre matières premières énergétiques peuvent monter vers 0.7-0.9. Pour le stress testing, on utilise des matrices de corrélation de crise historiques (période 2008-2009 ou 2020) pour calculer une "Stressed VaR" — mesure réglementaire imposée depuis Bâle II.5.
      </div>

      <IntuitionBlock emoji="🔥" title="Stressed VaR — la VaR sous stress réglementaire" accent={ACCENT}>
        Le Stressed VaR (sVaR) est une VaR Monte Carlo calculée en utilisant les paramètres calibrés sur une période historique de stress intense (ex: 2008-2009 pour les marchés financiers, 2020 pour l'énergie). Bâle II.5 (2009) l'a rendu obligatoire : capital_MR = max(VaR, multiplier × VaR_moy60j) + max(sVaR, multiplier × sVaR_moy60j). L'idée est de forcer les banques à se capitaliser pour des scénarios de crise, pas seulement pour les conditions normales de marché.
      </IntuitionBlock>

      <Accordion title="Exercice — VaR MC pour un portefeuille 2 actifs énergétiques" accent={ACCENT} badge="Moyen">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Paramètres :</strong> WTI (w₁=60%, σ₁=25%/an), Gaz Nat (w₂=40%, σ₂=45%/an), ρ=0.4. Valeur = 5M€. H=1 jour = 1/252 an. α=99%.<br /><br />
          <strong>Simulation manuelle (1 scénario) :</strong><br />
          Tirer Z₁=1.2, Z₂=-0.8 (indépendants).<br />
          Cholesky : W₁ = Z₁ = 1.2, W₂ = ρ×Z₁ + √(1-ρ²)×Z₂ = 0.4×1.2 + 0.917×(-0.8) = 0.48 - 0.734 = -0.254.<br />
          Rendements : r₁ = 25%/√252 × 1.2 = 25%×0.0632×1.2 = 1.895%<br />
          r₂ = 45%/√252 × (-0.254) = 45%×0.0632×(-0.254) = -0.723%<br />
          P&L_scénario = (0.6×1.895% + 0.4×(-0.723%)) × 5M€ = (1.137% - 0.289%) × 5M€ = 0.848% × 5M€ = 42 400€<br /><br />
          <strong>Résultat MC (N=10 000 simulations) :</strong><br />
          VaR_MC(99%) ≈ σ_p × z_99% × Valeur = 1.57% × 2.326 × 5M€ ≈ <strong style={{ color: ACCENT }}>183 000€</strong><br />
          La variance MC converge vers la formule analytique avec une erreur de l'ordre de 1/√N.
        </div>
      </Accordion>

      <Grid cols={3} gap="8px">
        <Slider label="σ₁ (Actif 1)" value={sigma1} min={0.05} max={0.8} step={0.01} onChange={setSigma1} accent={ACCENT} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ₂ (Actif 2)" value={sigma2} min={0.05} max={0.8} step={0.01} onChange={setSigma2} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="ρ (corrélation)" value={rho} min={-0.99} max={0.99} step={0.01} onChange={setRho} accent={T.a3} />
        <Slider label="w₁ (poids Actif 1)" value={w1} min={0} max={1} step={0.05} onChange={setW1} accent={T.muted} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="H (horizon)" value={T2} min={1 / 252} max={10 / 252} step={1 / 252} onChange={setT2} accent={T.muted} format={v => `${Math.round(v * 252)}j`} />
        <Slider label="N simulations" value={nSim} min={1000} max={50000} step={1000} onChange={setNSim} accent={ACCENT} format={v => `${v.toLocaleString()}`} />
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelle simulation</button>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label={`VaR MC (${(alpha * 100).toFixed(0)}%)`} value={`${(varMC * 100).toFixed(3)}%`} accent={ACCENT} />
        <InfoChip label="CVaR MC" value={`${(esMC * 100).toFixed(3)}%`} accent={T.a8} />
        <InfoChip label="VaR analytique" value={`${(varAnal * 100).toFixed(3)}%`} accent={T.muted} />
      </div>

      <ChartWrapper title={`Distribution P&L Monte Carlo (${nSim.toLocaleString()} simulations)`} accent={ACCENT} height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="r" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} unit="%" />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Bar dataKey="count" fill={T.a5} fillOpacity={0.6} name="P&L" />
            <Bar dataKey="tail" fill={ACCENT} fillOpacity={0.9} name="Tail" />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  )
}

// ─── Tab: EVT ─────────────────────────────────────────────────────────────────
export function EVTTab() {
  const [xi2, setXi2] = useState(0.3)  // shape parameter (tail index)
  const [beta, setBeta] = useState(0.02)  // scale
  const [u, setU] = useState(0.03)  // threshold

  const compData = useMemo(() => {
    const pts = []
    for (let x = 0; x <= 0.15; x += 0.001) {
      // Normal tail (beyond threshold u)
      const sigmaHist = 0.02
      const normTail = 1 - (x > u ? (1 - Math.exp(-(x - u) / sigmaHist)) : 0)

      // GPD (Generalized Pareto Distribution) for EVT
      let gpdSurv
      if (xi2 !== 0) {
        gpdSurv = x > u ? Math.pow(1 + xi2 * (x - u) / beta, -1 / xi2) : 1
      } else {
        gpdSurv = x > u ? Math.exp(-(x - u) / beta) : 1
      }

      // VaR from normal vs EVT (conditional on exceeding u)
      pts.push({
        loss: +(x * 100).toFixed(1),
        normalSurv: +(1 - (1 - normCDF(-x / sigmaHist))).toFixed(5),
        evtSurv: +gpdSurv.toFixed(5),
      })
    }
    return pts
  }, [xi2, beta, u])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La <strong style={{ color: ACCENT }}>théorie des valeurs extrêmes (EVT — Extreme Value Theory)</strong> est la branche de la statistique dédiée à la modélisation des événements rares et extrêmes. Quand un "black swan" (cygne noir) arrive — crash pétrolier, vague de froid extrême, défaut souverain — la loi normale est complètement inadaptée. EVT nous donne les outils mathématiques rigoureux pour modéliser et quantifier ces queues de distribution, permettant de calculer des VaR à 99.9% ou 99.99% qui soient crédibles.
      </div>

      <IntuitionBlock emoji="🌊" title="EVT : la statistique des événements extrêmes" accent={ACCENT}>
        Les queues épaisses (fat tails) des marchés financiers impliquent que les événements extrêmes
        (crises, crashes pétroliers) arrivent bien plus souvent que prévu par la loi normale.
        L'Extreme Value Theory (EVT) modélise spécifiquement ces queues avec la distribution GPD.
        En énergie : les spikes de prix gaz/électricité sont des événements à queue épaisse typiques.
        La VaR normale sous-estime systématiquement ces risques extrêmes.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Deux approches EVT — BM et POT</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px 16px', border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Block Maxima (BM) — GEV</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            On divise la série temporelle en blocs de taille n (ex: blocs mensuels de 21 jours). On extrait le maximum de chaque bloc. <strong>Théorème Fisher-Tippett :</strong> Ces maxima convergent vers une loi des valeurs extrêmes généralisée (GEV). La GEV unifie trois familles : Gumbel (ξ=0, queues légères), Fréchet (ξ{'>'} 0, queues épaisses), Weibull (ξ{'<'}0, queue bornée). Avantage : théorie élégante. Inconvénient : gaspille beaucoup de données (seul le max de chaque bloc est utilisé).
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px 16px', border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Peak Over Threshold (POT) — GPD</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            On fixe un seuil u élevé et on conserve tous les dépassements de u (les "exceedances" X-u). <strong>Théorème Pickands-Balkema-de Haan :</strong> Pour u suffisamment grand, la distribution des excès converge vers une loi de Pareto généralisée (GPD). Avantage : utilise toutes les observations extrêmes (plus efficient). En pratique, POT est la méthode standard en finance pour la VaR EVT.
          </div>
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Paramètres de la GPD — le tail index ξ</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Le paramètre de forme ξ (xi) de la GPD est le plus important — il détermine l'épaisseur de la queue et donc la gravité des événements extrêmes :
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'ξ > 0 — Queues épaisses (Pareto)', desc: 'Les moments d\'ordre 1/ξ et au-dessus n\'existent pas. Si ξ=0.5, la variance est infinie ! Cas typique des commodités énergétiques, des taux de change, des actions. La loi de puissance (power law) est un cas particulier. Les pertes extrêmes peuvent être très grandes.', color: ACCENT },
          { label: 'ξ = 0 — Queue exponentielle', desc: 'Queue qui décroit exponentiellement — plus légère que Pareto. Cas de la loi normale, log-normale. Tous les moments existent. C\'est l\'hypothèse implicite de la VaR gaussienne. En pratique, jamais vraiment observé sur les marchés financiers.', color: T.a4 },
          { label: 'ξ < 0 — Queue bornée', desc: 'Il existe un maximum possible pour les pertes. Cas rare en finance. Exemple : une variable qui ne peut pas dépasser une valeur maximale. Plus pertinent pour les variables physiques bornées (temperature, humidité relative).', color: T.a3 },
        ].map(s => (
          <div key={s.label} style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <IntuitionBlock emoji="⚡" title="Application énergie — ξ et la VaR réelle" accent={ACCENT}>
        Un ξ = 0.3 pour le pétrole WTI signifie que les pertes extrêmes sont bien plus fréquentes que la normale ne le prédit. Concrètement : la VaR à 99.9% calculée par EVT (GPD) peut être 2 à 3 fois plus grande que la VaR gaussienne au même niveau de confiance. Pour l'électricité spot (ξ ≈ 0.5-1.0), les spikes de prix peuvent être 10-20× la moyenne — phénomène impossible à capturer avec un modèle normal. C'est pourquoi les régulateurs imposent des calculs EVT pour les positions en énergie.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Distribution de Pareto Généralisée (GPD) — Théorème Pickands-Balkema-de Haan">
        F_u(y) = P(X - u ≤ y | X {'>'} u) ≈ G_{ξ,β}(y)

        G_{ξ,β}(y) = 1 - (1 + ξ·y/β)^(-1/ξ)   si ξ ≠ 0

        ξ {'>'} 0 : queues épaisses (Pareto)
        ξ = 0 : exponentielle (queues normales)
        ξ {'<'} 0 : queues bornées (Weibull)
      </FormulaBox>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Les 3 régimes du tail index ξ — visualisation des queues</div>
        <Step num={1} accent={ACCENT}>ξ {'>'} 0 (Pareto — queues infiniment épaisses) : plus ξ est grand, plus les extrêmes sont fréquents et sévères. Pour le pétrole brut WTI : ξ ≈ 0.2−0.4 → VaR 99.9% est environ 2−3× la VaR normale. Pour l'électricité spot : ξ ≈ 0.5−1.0 → spikes de 10−20× la moyenne.</Step>
        <Step num={2} accent={ACCENT}>ξ = 0 (Gumbel/Normal — queues exponentielles) : décroissance exponentielle de la queue. Correspond à la loi normale, log-normale, exponentielle. Tous les moments existent. C'est l'hypothèse (incorrecte) de la VaR gaussienne standard.</Step>
        <Step num={3} accent={ACCENT}>ξ {'<'} 0 (Weibull — queues bornées) : il existe un maximum absolu pour les pertes. Extrêmement rare pour les prix financiers. Plus pertinent pour des variables physiques bornées. En pratique, jamais utilisé pour la VaR énergie.</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          Intuition : ξ mesure l'épaisseur des queues. Une compagnie pétrolière avec ξ=0.4 devrait avoir une VaR de stress 3× plus grande que ce que la normale prédit — et sous-capitaliser de ce facteur si elle utilise un modèle gaussien.
        </div>
      </div>

      <SymbolLegend accent={ACCENT} symbols={[
        ['u', 'Seuil (threshold) : on étudie les pertes au-delà de u'],
        ['ξ', 'Paramètre de forme (tail index) : plus ξ grand, plus la queue est épaisse'],
        ['β', 'Paramètre d\'échelle'],
        ['GPD', 'Generalized Pareto Distribution'],
      ]} />

      <Grid cols={3} gap="8px">
        <Slider label="ξ (tail index)" value={xi2} min={-0.5} max={1} step={0.05} onChange={setXi2} accent={ACCENT} format={v => v.toFixed(2)} />
        <Slider label="β (échelle)" value={beta} min={0.005} max={0.05} step={0.001} onChange={setBeta} accent={T.a5} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="Seuil u" value={u} min={0.01} max={0.06} step={0.005} onChange={setU} accent={T.muted} format={v => `${(v * 100).toFixed(1)}%`} />
      </Grid>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '12px 0', fontSize: 13, color: T.text, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Pour l'énergie :</strong> ξ typique pour gaz nat ≈ 0.3–0.5 (queues épaisses).
        WTI : ξ ≈ 0.2–0.4. Électricité (spot) : ξ ≈ 0.5–1.0 (très heavy-tailed).
        La VaR normale avec ξ=0.3 peut sous-estimer la VaR réelle de 30-50% sur les grands quantiles.
      </div>

      <ChartWrapper title="Queue de distribution : Normale vs EVT/GPD (probabilité de survie)" accent={ACCENT} height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={compData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="loss" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} unit="%" label={{ value: 'Perte (%)', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
            <ReferenceLine x={u * 100} stroke={T.border} strokeDasharray="4 3" label={{ value: `Seuil u=${(u * 100).toFixed(0)}%`, fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 12 }} />
            <Line type="monotone" dataKey="normalSurv" stroke={T.muted} strokeWidth={2} dot={false} name="Queue Normale" />
            <Line type="monotone" dataKey="evtSurv" stroke={ACCENT} strokeWidth={2.5} dot={false} name={`Queue GPD (ξ=${xi2.toFixed(1)})`} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <Accordion title="Exercice — Interpréter les paramètres GPD pour le WTI" accent={ACCENT} badge="Moyen">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Calibration GPD sur données WTI (2010-2020) :</strong><br />
          Seuil u = 3% (pertes journalières {'>'} 3%), ξ = 0.28, β = 0.015 (1.5%).<br /><br />
          <strong>Interprétation de ξ = 0.28 :</strong><br />
          • Queue épaisse mais modérée. Les moments d'ordre {'<'} 1/0.28 = 3.57 existent (moyenne, variance, skewness existent ; kurtosis ≈ à la limite).<br />
          • Les événements à 5σ (normalement une fois tous les 13 000 ans) arrivent en pratique beaucoup plus souvent.<br /><br />
          <strong>Calcul de VaR EVT à 99.9% :</strong><br />
          P(X {'>'} VaR | X {'>'} u) = (n_u/n) × (1 + ξ × (VaR-u)/β)^(-1/ξ) = 0.001<br />
          Si u=3%, n_u/n ≈ 5%, alors P(X {'>'} VaR | X {'>'} u) = 0.001/0.05 = 0.02.<br />
          (1 + 0.28 × (VaR-0.03)/0.015)^(-1/0.28) = 0.02<br />
          → VaR_EVT(99.9%) ≈ <strong style={{ color: ACCENT }}>8.4%</strong><br />
          Comparé à VaR_normale(99.9%) = 3.09 × 2% ≈ 6.2% → EVT prédit une VaR 35% plus élevée !
        </div>
      </Accordion>

      <Accordion title="Exercice — Choisir le seuil u en méthode POT" accent={ACCENT} badge="Difficile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Le dilemme du seuil :</strong> Trop bas → les excès ne suivent pas la GPD (mélange de distribution corps + queue). Trop haut → peu d'observations, grande variance d'estimation.<br /><br />
          <strong>Outils diagnostiques :</strong><br />
          1. <strong>Mean Excess Plot (MEP) :</strong> Tracer e(u) = E[X-u | X{'>'} u] en fonction de u. Si la GPD est appropriée, e(u) doit être linéaire en u. La linéarité commence au bon seuil u*.<br />
          2. <strong>Stability plots :</strong> Estimer ξ(u) et β(u) pour différents seuils u. Choisir u tel que ξ(u) et β(u) = β - ξu se stabilisent.<br />
          3. <strong>Règle empirique :</strong> Viser environ 10-15% des observations dans la queue → n_u/n ≈ 10-15%.<br /><br />
          <strong>Exemple WTI :</strong> Sur 2520 jours (10 ans), on prend les 5% pires journées : n_u = 126 observations au-dessus de u=3%. C'est suffisant pour une calibration GPD raisonnable. Si on prenait u=5%, n_u ≈ 38 → trop peu pour calibration fiable.
        </div>
      </Accordion>
    </div>
  )
}

// ─── Tab: VaR Marginale ───────────────────────────────────────────────────────
export function MarginalVarTab() {
  const [w1, setW1] = useState(0.5)
  const [w2, setW2] = useState(0.3)
  const [sigma1, setSigma1] = useState(0.25)
  const [sigma2, setSigma2] = useState(0.3)
  const [sigma3, setSigma3] = useState(0.2)
  const [rho12, setRho12] = useState(0.5)
  const [rho13, setRho13] = useState(0.3)
  const [rho23, setRho23] = useState(0.4)
  const [alpha, setAlpha] = useState(0.99)

  const w3 = Math.max(0, 1 - w1 - w2)
  const zAlpha = -normInv(1 - alpha)

  // Covariance matrix
  const cov = [
    [sigma1 * sigma1, rho12 * sigma1 * sigma2, rho13 * sigma1 * sigma3],
    [rho12 * sigma1 * sigma2, sigma2 * sigma2, rho23 * sigma2 * sigma3],
    [rho13 * sigma1 * sigma3, rho23 * sigma2 * sigma3, sigma3 * sigma3],
  ]
  const w = [w1, w2, w3]

  // Portfolio variance
  let portVar = 0
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) portVar += w[i] * w[j] * cov[i][j]
  const portVol = Math.sqrt(portVar)
  const portVaR = zAlpha * portVol

  // Marginal VaR = ∂VaR/∂w_i = z_α × ∂σ_p/∂w_i = z_α × (Cov(r_i, r_p) / σ_p)
  const covWithPort = w.map((_, i) => w.reduce((s, wj, j) => s + wj * cov[i][j], 0))
  const marginalVaR = covWithPort.map(c => zAlpha * c / portVol)
  const componentVaR = marginalVaR.map((mv, i) => mv * w[i])
  const sumComp = componentVaR.reduce((a, b) => a + b, 0)

  const assets = [
    { name: 'WTI (A1)', color: T.a5 },
    { name: 'Gas Nat (A2)', color: T.a3 },
    { name: `Elect (A3, w=${(w3 * 100).toFixed(0)}%)`, color: T.a7 },
  ]

  const barData = assets.map((a, i) => ({
    asset: a.name,
    margVaR: +(marginalVaR[i] * 100).toFixed(3),
    compVaR: +(componentVaR[i] * 100).toFixed(3),
    pct: +((componentVaR[i] / sumComp) * 100).toFixed(1),
    color: a.color,
  }))

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La <strong style={{ color: ACCENT }}>VaR marginale</strong> répond à une question cruciale pour la gestion de portefeuille : <em>"Quel actif contribue le plus au risque total de mon portefeuille ?"</em> Ce n'est pas simplement l'actif le plus volatile — cela dépend aussi de ses corrélations avec les autres actifs. Un actif très volatile mais non corrélé peut contribuer peu au risque total (effet de diversification). C'est l'outil clé pour l'allocation de capital et l'optimisation de portefeuille du point de vue du risque.
      </div>

      <IntuitionBlock emoji="🔬" title="VaR Marginale : contribution de chaque actif au risque total" accent={ACCENT}>
        La VaR du portefeuille ≠ somme des VaR individuelles (car corrélation {'<'} 1 → diversification).
        La VaR marginale mesure l'impact d'augmenter légèrement la position dans l'actif i.
        La VaR de composante = VaR marginale × poids = contribution de l'actif au risque total.
        Σ VaR_composante = VaR_portefeuille (décomposition exacte !)
        Utile pour décider où réduire le risque : l'actif avec la plus grande contribution est le plus "dangereux".
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="VaR Marginale & VaR de Composante">
        MVaR_i = z_α × Cov(r_i, r_p) / σ_p = z_α × β_i × σ_p

        CVaR_i = w_i × MVaR_i     (VaR de composante)

        Σᵢ CVaR_i = VaR_p         (décomposition exacte)
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Les trois concepts de VaR de contribution</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'VaR Marginale (MVaR)', formula: 'MVaR_i = ∂VaR_p / ∂w_i', desc: 'Dérivée partielle de la VaR totale par rapport au poids de l\'actif i. Mesure comment la VaR du portefeuille change si j\'augmente infinitésimalement le poids de l\'actif i. = z_α × Cov(rᵢ, r_p) / σ_p. Exprimé en unités de VaR par unité de poids.', color: ACCENT },
          { label: 'VaR de Composante (CVaR)', formula: 'CVaR_i = w_i × MVaR_i', desc: 'Contribution absolue de l\'actif i à la VaR totale. C\'est la MVaR pondérée par le poids. Peut être négative si l\'actif est un "couvreur naturel" (corrélation négative avec le portefeuille). La somme des CVaR_i = VaR_totale.', color: T.a4 },
          { label: 'VaR de Composante %', formula: 'CVaR_i% = CVaR_i / VaR_p', desc: 'Part de la VaR totale attribuable à l\'actif i. Permet de comparer des actifs de tailles différentes. La somme = 100%. Si CVaR_i% = 60%, l\'actif i "explique" 60% du risque total — c\'est la cible prioritaire de couverture.', color: T.a3 },
        ].map(s => (
          <div key={s.label} style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: s.color, fontFamily: 'monospace', fontSize: 11, marginBottom: 6, background: `${s.color}11`, padding: '4px 8px', borderRadius: 4 }}>{s.formula}</div>
            <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Théorème d'Euler (décomposition homogène) :</strong> Puisque la VaR est homogène de degré 1 en w (doubler tous les poids double la VaR), le théorème d'Euler garantit que Σᵢ wᵢ × (∂VaR/∂wᵢ) = VaR_p. Autrement dit : Σᵢ CVaR_i = VaR_totale. Cette propriété est cruciale — elle permet une décomposition <em>exacte</em> et additive du risque total entre tous les actifs.
      </div>

      <SectionTitle accent={ACCENT}>Application : réduction de risque et allocation optimale</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La VaR marginale guide directement les décisions de réduction de risque. Pour réduire la VaR totale de façon optimale, on doit agir en priorité sur les actifs à <strong style={{ color: ACCENT }}>MVaR élevée</strong> (forte contribution marginale). L'optimum est atteint quand toutes les MVaR_i sont égales (optimum de portefeuille en termes de risque pur).
      </div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Si MVaR_WTI {'>'} MVaR_Gaz : on réduit d'abord la position WTI. Si MVaR_i {'<'} 0 pour un actif : cet actif réduit le risque total — augmenter sa position diminue la VaR (parfait couvreur). Cette logique est la base de l'optimisation de portefeuille par rapport au risque (Risk Budgeting).
      </div>

      <Grid cols={3} gap="8px">
        <Slider label="w₁ (WTI)" value={w1} min={0} max={0.9} step={0.05} onChange={setW1} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="w₂ (Gaz)" value={w2} min={0} max={1 - w1} step={0.05} onChange={setW2} accent={T.a3} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ₁ (WTI)" value={sigma1} min={0.05} max={0.6} step={0.01} onChange={setSigma1} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ₂ (Gaz)" value={sigma2} min={0.05} max={0.6} step={0.01} onChange={setSigma2} accent={T.a3} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ₃ (Elect.)" value={sigma3} min={0.05} max={0.6} step={0.01} onChange={setSigma3} accent={T.a7} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="ρ₁₂" value={rho12} min={-0.9} max={0.9} step={0.05} onChange={setRho12} accent={T.muted} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="σ_p" value={`${(portVol * 100).toFixed(2)}%`} accent={ACCENT} />
        <InfoChip label="VaR_p" value={`${(portVaR * 100).toFixed(2)}%`} accent={T.a2} />
        <InfoChip label="Σ CVaR_i" value={`${(sumComp * 100).toFixed(2)}%`} accent={T.a4} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '16px 0' }}>
        {barData.map((d, i) => (
          <div key={i} style={{ background: T.panel2, borderRadius: 8, padding: '14px 16px', border: `1px solid ${assets[i].color}33` }}>
            <div style={{ color: assets[i].color, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{assets[i].name}</div>
            <div style={{ color: T.muted, fontSize: 11 }}>MVaR : <span style={{ color: T.text }}>{d.margVaR}%</span></div>
            <div style={{ color: T.muted, fontSize: 11 }}>CVaR : <span style={{ color: assets[i].color, fontWeight: 700 }}>{d.compVaR}%</span></div>
            <div style={{ color: T.muted, fontSize: 11 }}>Contribution : <span style={{ color: T.a4, fontWeight: 700 }}>{d.pct}%</span></div>
          </div>
        ))}
      </div>

      <ChartWrapper title="Contribution au risque par actif (VaR de Composante)" accent={ACCENT} height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="asset" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} unit="%" />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Bar dataKey="compVaR" name="VaR Composante (%)" fill={ACCENT} fillOpacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <Accordion title="Exercice — Décomposition de VaR pour 3 actifs énergétiques" accent={ACCENT} badge="Difficile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Portefeuille :</strong> WTI (w₁=50%, σ₁=25%), Gaz Nat (w₂=30%, σ₂=40%), Électricité (w₃=20%, σ₃=60%). Corrélations : ρ₁₂=0.5, ρ₁₃=0.3, ρ₂₃=0.4. Valeur = 10M€, α=99%.<br /><br />
          <strong>Étape 1 — Matrice de variance-covariance (daily, divisé par 252) :</strong><br />
          σ₁_d = 25%/√252 = 1.575%, σ₂_d = 40%/√252 = 2.520%, σ₃_d = 60%/√252 = 3.779%<br />
          Cov₁₂ = 0.5 × 1.575% × 2.520% = 0.000198<br />
          Cov₁₃ = 0.3 × 1.575% × 3.779% = 0.000178<br />
          Cov₂₃ = 0.4 × 2.520% × 3.779% = 0.000381<br /><br />
          <strong>Étape 2 — Variance portefeuille :</strong><br />
          σ²_p = w₁²σ₁² + w₂²σ₂² + w₃²σ₃² + 2w₁w₂Cov₁₂ + 2w₁w₃Cov₁₃ + 2w₂w₃Cov₂₃<br />
          = 0.25×0.000248 + 0.09×0.000635 + 0.04×0.001428 + 2×0.15×0.000198 + 2×0.10×0.000178 + 2×0.06×0.000381<br />
          = 0.0000620 + 0.0000572 + 0.0000571 + 0.0000594 + 0.0000356 + 0.0000457 = 0.000317<br />
          σ_p = 1.781% → VaR_p = 2.326 × 1.781% × 10M€ = <strong style={{ color: ACCENT }}>414 400€</strong><br /><br />
          <strong>Étape 3 — Covariances avec le portefeuille :</strong><br />
          Cov(r₁, r_p) = w₁σ₁² + w₂Cov₁₂ + w₃Cov₁₃ = 0.5×0.000248 + 0.3×0.000198 + 0.2×0.000178 = 0.0001953<br />
          MVaR₁ = 2.326 × 0.0001953/0.0001781 = 2.554% → CVaR₁ = 0.5 × 2.554% = 1.277% (50.7% du total)<br /><br />
          <strong>Interprétation :</strong> Malgré son poids modeste (50%), le WTI contribue à 50.7% du risque total car sa forte corrélation avec les autres actifs amplifie son impact marginal.
        </div>
      </Accordion>
    </div>
  )
}

// ─── Main Module 6 ────────────────────────────────────────────────────────────
const TABS = ['Var-Cov', 'Historique', 'Monte Carlo', 'EVT', 'VaR Marginale']

export default function Module6() {
  const [tab, setTab] = useState('Var-Cov')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      <ModuleHeader
        num={6}
        title="VaR Avancée"
        subtitle="Maîtriser la Value at Risk sous toutes ses formes : paramétrique, historique, Monte Carlo, EVT et décomposition marginale — pour le risk management des portefeuilles énergie."
        accent={ACCENT}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} accent={ACCENT} />
      {tab === 'Var-Cov' && <VarCovTab />}
      {tab === 'Historique' && <VarHistTab />}
      {tab === 'Monte Carlo' && <VarMCTab />}
      {tab === 'EVT' && <EVTTab />}
      {tab === 'VaR Marginale' && <MarginalVarTab />}
    </div>
  )
}
