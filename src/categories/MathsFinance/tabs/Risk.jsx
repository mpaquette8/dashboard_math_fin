import React, { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  AreaChart,
  Area,
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

// ─── Tab: EaR & CFaR ─────────────────────────────────────────────────────────

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
        sur les prochains N jours ?" Si <K>{"\\text{VaR}(99\\%,\,1j) = 1\\text{M€}"}</K>, cela signifie que dans 1% des cas
        (≈ 2-3 jours par an), la perte dépassera 1M€. C'est le standard réglementaire (Bâle II/III).
        En énergie : les traders doivent reporter leur VaR quotidienne au risk management.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="VaR Variance-Covariance (approche paramétrique)">
        <K display>{"\\text{VaR}(\\alpha) = -[\\mu \\cdot H - z_{\\alpha} \\cdot \\sigma \\cdot \\sqrt{H}] \\times \\text{Valeur du portefeuille}"}</K>
        <K>{"z_{\\alpha} = N^{-1}(\\alpha)"}</K> : quantile de la loi normale standard
      </FormulaBox>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie de la VaR paramétrique — <K>{"\\text{VaR}_{\\alpha} = -\\mu_{\\Delta P} + z_{\\alpha} \\times \\sigma_{\\Delta P}"}</K></div>
        <Step num={1} accent={ACCENT}><K>{"-\\mu_{\\Delta P}"}</K> : on soustrait la tendance (drift). Si le portefeuille a un rendement espéré positif <K>{"\\mu"}</K>, cela améliore la VaR (réduit la perte potentielle). En pratique, <K>{"\\mu \\approx 0"}</K> sur 1 jour, mais important sur horizons longs (10 jours, 1 mois).</Step>
        <Step num={2} accent={ACCENT}><K>{"z_{\\alpha} \\times \\sigma_{\\Delta P}"}</K> : le "quantile × volatilité". <K>{"z_{\\alpha}"}</K> est le quantile de la loi normale standard au niveau <K>{"\\alpha"}</K>. Pour VaR 95% : <K>{"z = 1.645"}</K> (perte dépassée 5% du temps). Pour VaR 99% : <K>{"z = 2.326"}</K> (dépassée 1%). Pour VaR 99.9% (capital Bâle) : <K>{"z = 3.09"}</K> (dépassée 0.1%).</Step>
        <Step num={3} accent={ACCENT}>Pour un portefeuille : <K>{"\\sigma_{\\Delta P} = \\sqrt{\\mathbf{w}^\\top \\Sigma \\mathbf{w}} \\times V"}</K>. Le terme <K>{"\\mathbf{w}^\\top \\Sigma \\mathbf{w}"}</K> est la variance relative du portefeuille — quadratique, donc les corrélations jouent un rôle clé. Si <K>{"\\rho < 1"}</K> entre actifs, <K>{"\\mathbf{w}^\\top \\Sigma \\mathbf{w} < \\sum_i w_i^2 \\sigma_i^2"}</K> : la diversification réduit la variance !</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          L'effet de diversification apparaît dans les termes croisés de <K>{"\\Sigma"}</K> : si <K>{"\\rho < 1"}</K>, <K>{"\\mathbf{w}^\\top \\Sigma \\mathbf{w}"}</K> {'<'} somme des variances individuelles → VaR portefeuille {'<'} somme des VaR individuelles → bénéfice de diversification mesurable.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Dérivation step-by-step de la VaR paramétrique</SectionTitle>
      <ExampleBlock title="Dérivation de la formule VaR" accent={ACCENT}>
        <FormulaBox accent={ACCENT} label="Résultat">
          <K>{"\\text{VaR}_{\\alpha} = -\\mu_{\\Delta P} + z_{\\alpha} \\cdot \\sigma_{\\Delta P}"}</K>
        </FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="VaR paramétrique" ruleDetail="ΔP ~ N(µ, σ²)" accent={ACCENT}><strong>Hypothèse de normalité :</strong> On suppose <K>{"\\Delta P \\sim \\mathcal{N}(\\mu_{\\Delta P},\\, \\sigma_{\\Delta P}^2)"}</K>, c'est-à-dire que le P&L du portefeuille est distribué normalement avec moyenne <K>{"\\mu_{\\Delta P}"}</K> et variance <K>{"\\sigma_{\\Delta P}^2"}</K>.</DemoStep>
          <DemoStep num={2} rule="Quantile de risque" ruleDetail="P(ΔP < −VaR) = 1−α" accent={ACCENT}><strong>Définition de la VaR :</strong> <K>{"\\text{VaR}_{\\alpha}"}</K> est le seuil tel que <K>{"P(\\Delta P < -\\text{VaR}_{\\alpha}) = 1 - \\alpha"}</K>. En d'autres termes, <K>{"\\text{VaR}_{\\alpha}"}</K> est le <K>{"(1-\\alpha)"}</K>-quantile de la distribution des pertes.</DemoStep>
          <DemoStep num={3} rule="Standardisation" ruleDetail="Z = (X−µ)/σ" accent={ACCENT}><strong>Standardisation :</strong> <K>{"P(\\Delta P < -\\text{VaR}_{\\alpha}) = P\\!\\left(Z < \\frac{-\\text{VaR}_{\\alpha} - \\mu}{\\sigma}\\right) = 1-\\alpha"}</K>, où <K>{"Z \\sim \\mathcal{N}(0,1)"}</K>. Donc <K>{"\\text{VaR}_{\\alpha} = -\\mu_{\\Delta P} + z_{\\alpha} \\cdot \\sigma_{\\Delta P}"}</K> en convention perte positive.</DemoStep>
          <DemoStep num={4} rule="Corrélation" ruleDetail="σ_p = √(wᵀΣw)" accent={ACCENT}><strong>Portefeuille :</strong> Pour un portefeuille multi-actifs, <K>{"\\sigma_{\\Delta P} = \\sqrt{\\mathbf{w}^\\top \\Sigma \\mathbf{w}} \\times V"}</K>, où <K>{"\\Sigma"}</K> est la matrice de variance-covariance des rendements. En pratique : <K>{"\\sigma_p = \\sqrt{\\sum_i \\sum_j w_i w_j \\sigma_i \\sigma_j \\rho_{ij}} \\times V"}</K>.</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.9 }}>
        <strong style={{ color: ACCENT }}>Ce que la VaR N'EST PAS — 3 limites critiques :</strong><br />
        1. <strong>La VaR ne dit pas combien on perd SI on dépasse le seuil.</strong> Si <K>{"\\text{VaR}(99\\%) = 1\\text{M€}"}</K> et qu'on a un jour noir, la perte peut être 1M€ ou 50M€ — la VaR ne le dit pas. Pour ça, on utilise le CVaR (Expected Shortfall).<br />
        2. <strong>La VaR n'est pas sous-additive</strong> — paradoxe majeur : <K>{"\\text{VaR}(A+B)"}</K> peut être supérieure à <K>{"\\text{VaR}(A) + \\text{VaR}(B)"}</K>. Elle peut "punir" la diversification ! C'est pourquoi le CVaR (qui est sous-additif) est préféré pour l'allocation de capital.<br />
        3. <strong>La VaR paramétrique suppose la normalité.</strong> Sur des marchés énergétiques à queues épaisses, cela sous-estime systématiquement les pertes extrêmes. La VaR normale à 99.9% peut être 2-3 fois trop petite comparée à la réalité (EVT).
      </div>

      <SectionTitle accent={ACCENT}>Expected Shortfall (ES) / CVaR — la mesure de risque cohérente</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        L'Expected Shortfall (ES), aussi appelé CVaR (Conditional VaR) ou Expected Tail Loss (ETL), répond à la question : "En moyenne, combien perd-on dans les <K>{"(1-\\alpha)\\%"}</K> pires cas ?" C'est une mesure de risque <em>cohérente</em> (au sens d'Artzner et al., 1999), ce qui signifie notamment qu'elle est sous-additive.
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>ES vs VaR — ce que chaque mesure regarde</div>
        <Step num={1} accent={ACCENT}>VaR dit : "Je perds au maximum X avec probabilité <K>{"\\alpha"}</K>" → elle fixe un seuil, mais ne dit RIEN sur ce qui se passe au-delà. Une VaR 99% de 1M€ est compatible avec une perte maximale possible de 1M€ ou de 1 milliard€.</Step>
        <Step num={2} accent={ACCENT}>ES dit : "Quand je dépasse la VaR, je perds en moyenne <K>{"X_{ES}"}</K>" → c'est la perte espérée conditionnelle dans le scénario défavorable. <K>{"\\text{ES}_{99\\%} = E[\\text{perte} \\mid \\text{perte} > \\text{VaR}_{99\\%}]"}</K>.</Step>
        <Step num={3} accent={ACCENT}>Sous normalité : <K>{"\\text{ES}_{\\alpha} = \\mu - \\sigma \\times \\varphi(z_{\\alpha})/(1-\\alpha)"}</K>. Pour <K>{"\\alpha=95\\%"}</K> : <K>{"\\varphi(1.645)/0.05 \\approx 2.063"}</K> → <K>{"\\text{ES}_{95\\%} \\approx \\text{VaR}_{95\\%} \\times 1.33"}</K> (33% de plus). Pour <K>{"\\alpha=99\\%"}</K> : <K>{"\\varphi(2.326)/0.01 \\approx 2.665"}</K> → <K>{"\\text{ES}_{99\\%} \\approx \\text{VaR}_{99\\%} \\times 1.15"}</K> (15% de plus).</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          ES est "cohérente" (sous-additive) : <K>{"\\text{ES}(A+B) \\leq \\text{ES}(A) + \\text{ES}(B)"}</K> → la diversification est toujours récompensée. VaR ne l'est pas. C'est pourquoi Bâle III (FRTB) a adopté ES 97.5% comme standard réglementaire en remplacement de VaR 99%.
        </div>
      </div>

      <FormulaBox accent={ACCENT} label="Expected Shortfall (CVaR)">
        <K display>{"\\text{ES}_{\\alpha} = E[\\text{Perte} \\mid \\text{Perte} > \\text{VaR}_{\\alpha}]"}</K>
        Formule continue : <K display>{"\\text{ES}_{\\alpha} = \\frac{1}{1-\\alpha} \\int_{\\alpha}^{1} \\text{VaR}_u \\, du"}</K>
        Pour une distribution normale : <K display>{"\\text{ES}_{\\alpha} = \\mu + \\sigma \\times \\frac{\\varphi(z_{\\alpha})}{1-\\alpha}"}</K>
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Bâle III / FRTB :</strong> Depuis la réforme FRTB (Fundamental Review of the Trading Book, 2016), les banques doivent utiliser l'ES à 97.5% (au lieu de la VaR à 99%). <K>{"\\text{ES}_{97.5\\%} \\approx \\text{VaR}_{99\\%}"}</K> numériquement, mais ES est une meilleure mesure théoriquement car elle capture l'amplitude des pertes dans la queue, pas juste le seuil.
      </div>

      <Accordion title="Exercice — VaR d'un portefeuille bivarié" accent={ACCENT} badge="Moyen">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Portefeuille :</strong> WTI (<K>{"w_1=60\\%,\\,\\sigma_1=25\\%"}</K>) + Gaz Nat (<K>{"w_2=40\\%,\\,\\sigma_2=40\\%"}</K>), corrélation <K>{"\\rho=0.3"}</K>. Valeur totale = 10M€. <K>{"\\alpha=99\\%,\\,H=1j"}</K>.<br /><br />
          <strong>Étape 1 — Variance du portefeuille :</strong><br />
          <K display>{"\\sigma_p^2 = w_1^2\\sigma_1^2 + w_2^2\\sigma_2^2 + 2w_1 w_2 \\sigma_1 \\sigma_2 \\rho"}</K>
          <K>{"= (0.6)^2 \\times (0.25/\\sqrt{252})^2 + (0.4)^2 \\times (0.40/\\sqrt{252})^2 + 2 \\times 0.6 \\times 0.4 \\times (0.25/\\sqrt{252}) \\times (0.40/\\sqrt{252}) \\times 0.3"}</K><br />
          <K>{"= 0.36 \\times 0.000248 + 0.16 \\times 0.000635 + 2 \\times 0.24 \\times 0.000397 \\times 0.3"}</K><br />
          <K>{"= 0.0000893 + 0.0001016 + 0.0000571 = 0.000248"}</K><br />
          <K>{"\\sigma_{p,\\text{daily}} = \\sqrt{0.000248} = 1.574\\%"}</K><br /><br />
          <strong>Étape 2 — VaR :</strong> <K>{"z_{99\\%} = 2.326"}</K><br />
          <K>{"\\text{VaR}_p = 2.326 \\times 1.574\\% \\times 10\\text{M€}"}</K> = <strong style={{ color: ACCENT }}>366 000€</strong><br /><br />
          <strong>Comparaison sans diversification :</strong><br />
          <K>{"\\text{VaR}_{\\text{WTI}} = 2.326 \\times 25\\%/\\sqrt{252} \\times 6\\text{M€} = 220\\,500\\text{€}"}</K><br />
          <K>{"\\text{VaR}_{\\text{Gaz}} = 2.326 \\times 40\\%/\\sqrt{252} \\times 4\\text{M€} = 233\\,900\\text{€}"}</K><br />
          <K>{"\\text{VaR}_{\\text{somme}} = 454\\,400\\text{€}"}</K> {'>'} <K>{"\\text{VaR}_p = 366\\,000\\text{€}"}</K> → bénéfice de diversification = 88 400€ (19.4%)
        </div>
      </Accordion>

      <Accordion title="Exercice — CVaR vs VaR comparaison" accent={ACCENT} badge="Moyen">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Même portefeuille :</strong> <K>{"\\sigma_{\\text{daily}} = 1.574\\%"}</K>, <K>{"\\mu \\approx 0"}</K>, Valeur = 10M€, <K>{"\\alpha=99\\%"}</K>.<br /><br />
          <strong><K>{"\\text{VaR}(99\\%) = 2.326 \\times 1.574\\% \\times 10\\text{M€} = 366\\,000\\text{€}"}</K></strong><br /><br />
          <strong><K>{"\\text{CVaR}(99\\%) = \\sigma \\times \\varphi(z_{99\\%}) / (1-99\\%) \\times \\text{Valeur}"}</K></strong><br />
          <K>{"\\varphi(2.326) = \\frac{1}{\\sqrt{2\\pi}} \\times e^{-2.326^2/2} = 0.3989 \\times e^{-2.706} = 0.3989 \\times 0.0670 = 0.02672"}</K><br />
          <K>{"\\text{CVaR} = 1.574\\% \\times 0.02672 / 0.01 \\times 10\\text{M€} = 1.574\\% \\times 2.672 \\times 10\\text{M€}"}</K> = <strong style={{ color: ACCENT }}>420 600€</strong><br /><br />
          <strong><K>{"\\text{Ratio CVaR/VaR} = 420\\,600 / 366\\,000 = 1.149"}</K></strong> — le CVaR est 14.9% plus élevé que la VaR, représentant la perte moyenne dans les 1% pires cas. Ce ratio est toujours {'>'} 1 et augmente avec les queues épaisses.
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
        <p>Portefeuille WTI : 100 000 barils @ 80$/bbl = 8M$, <K>{"\\sigma_{\\text{daily}}=2\\%"}</K>, <K>{"H=1j"}</K>, <K>{"\\alpha=99\\%"}</K></p>
        <FormulaBox accent={ACCENT} label="Résultat">
          <K>{"\\text{VaR}(99\\%,\\,10j) \\approx 1{,}18\\,\\text{M\\$}"}</K>
        </FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="VaR paramétrique" ruleDetail="σ_pos = V × σ" accent={ACCENT}><K>{"\\sigma_{\\text{pos}} = 8\\text{M\\$} \\times 2\\% = 160\\,000\\text{\\$/j}"}</K></DemoStep>
          <DemoStep num={2} rule="Quantile normal" ruleDetail="z = Φ⁻¹(α)" accent={ACCENT}><K>{"z_{99\\%} = \\Phi^{-1}(0.99) = 2.326"}</K></DemoStep>
          <DemoStep num={3} rule="VaR paramétrique" ruleDetail="VaR = z × σ" accent={ACCENT}><K>{"\\text{VaR}(99\\%,\\,1j) = 2.326 \\times 160\\,000 = 372\\,160\\$"}</K></DemoStep>
          <DemoStep num={4} rule="Diversification" ruleDetail="VaR(H) = VaR(1)×√H" accent={ACCENT}><K>{"\\text{VaR}(99\\%,\\,10j) = 372\\,160 \\times \\sqrt{10} = 1\\,176\\,810\\$ \\approx 1{,}18\\,\\text{M\\$}"}</K>. La « règle <K>{"\\sqrt{T}"}</K> » (racine du temps) suppose des rendements iid normaux.</DemoStep>
        </Demonstration>
      </ExampleBlock>
    </div>
  )
}

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
        1. Collecter <K>{"n"}</K> rendements historiques : <K>{"r_1, r_2, \\ldots, r_n"}</K>
        2. Trier par ordre croissant : <K>{"r_{(1)} \\leq r_{(2)} \\leq \\ldots \\leq r_{(n)}"}</K>
        3. <K display>{"\\text{VaR}(\\alpha) = -r_{(\\lfloor(1-\\alpha) \\times n\\rfloor)}"}</K>
        4. <K display>{"\\text{CVaR}(\\alpha) = -\\text{moyenne des } \\lfloor(1-\\alpha) \\times n\\rfloor \\text{ pires rendements}"}</K>
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
        <K display>{"w_i = (1-\\lambda) \\times \\lambda^i \\quad \\text{pour } i = 0, 1, \\ldots, n-1"}</K>
        (<K>{"i=0"}</K> = observation la plus récente)
        <K>{"\\lambda = 0.99"}</K> (standard) → demi-vie ≈ 69 jours
        <K>{"\\lambda = 0.97"}</K> → demi-vie ≈ 23 jours (plus réactif)
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Demi-vie :</strong> La demi-vie de l'information avec un facteur <K>{"\\lambda"}</K> est <K>{"\\ln(0.5)/\\ln(\\lambda)"}</K>. Pour <K>{"\\lambda=0.99"}</K>, demi-vie ≈ 69 jours — cela signifie que les données de plus de 69 jours contribuent pour moins de 50% du poids total. Pour l'énergie, une demi-vie de 20-40 jours (<K>{"\\lambda \\approx 0.97\\text{–}0.98"}</K>) est souvent plus appropriée car la vol change rapidement.
      </div>

      <Accordion title="Exercice — Back-testing de la VaR historique (test de Kupiec)" accent={ACCENT} badge="Difficile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Principe du back-testing :</strong> On calcule la VaR chaque jour sur les données passées, puis on compare avec la perte réelle du lendemain. Un "excès" (violation) se produit quand la perte réelle dépasse la VaR.<br /><br />
          <strong>Test de Kupiec (1995) — Proportion of Failures (POF) :</strong><br />
          Sous <K>{"H_0"}</K> (VaR correcte), le nombre d'excès <K>{"X"}</K> suit une loi binomiale <K>{"B(n,\\,1-\\alpha)"}</K>.<br />
          Statistique : <K display>{"LR_{\\text{pof}} = -2\\ln[(1-p_0)^{n-x} \\cdot p_0^x] + 2\\ln[(1-\\hat{p})^{n-x} \\cdot \\hat{p}^x]"}</K>
          où <K>{"p_0 = 1-\\alpha"}</K> (taux théorique), <K>{"\\hat{p} = x/n"}</K> (taux observé), <K>{"n"}</K> = nombre de jours, <K>{"x"}</K> = nombre d'excès.<br /><br />
          <strong>Exemple numérique :</strong><br />
          <K>{"n = 250"}</K> jours, <K>{"\\alpha = 99\\%"}</K>, <K>{"x = 8"}</K> excès observés.<br />
          Taux attendu : <K>{"p_0 = 1\\%"}</K> → excès attendus = 2.5.<br />
          Taux observé : <K>{"\\hat{p} = 8/250 = 3.2\\%"}</K>.<br />
          <K>{"LR_{\\text{pof}} = -2\\ln[0.99^{242} \\times 0.01^8] + 2\\ln[0.968^{242} \\times 0.032^8] \\approx 9.78"}</K><br />
          Valeur critique <K>{"\\chi^2(1)"}</K> à 5% = 3.84. Comme <K>{"9.78 > 3.84"}</K> → <strong style={{ color: ACCENT }}>VaR rejetée</strong> : trop d'excès, la VaR est sous-estimée.<br /><br />
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
          <strong style={{ color: ACCENT }}>VaR</strong> = seuil de perte dépassé avec prob <K>{"(1-\\alpha)"}</K>. Ne dit rien sur <em>combien</em> on perd au-delà.<br />
          <strong style={{ color: T.a8 }}>CVaR / Expected Shortfall</strong> = perte moyenne dans les <K>{"(1-\\alpha)\\%"}</K> pires cas.<br />
          <K>{"\\text{CVaR} \\geq \\text{VaR}"}</K> toujours. CVaR est cohérente (sous-additivité) contrairement à VaR.<br />
          <strong style={{ color: T.muted }}>Réglementation :</strong> Bâle III/FRTB impose CVaR 97.5% au lieu de VaR 99%.
        </div>
      </div>
    </div>
  )
}

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
        Pour <K>{"i = 1..N"}</K> :
          <K>{"Z_1, Z_2 \\sim \\mathcal{N}(0,1)"}</K> iid
          <K>{"r_1 = \\sigma_1\\sqrt{H} \\times W_1,\\quad r_2 = \\sigma_2\\sqrt{H} \\times W_2"}</K>   (avec Cholesky)
          <K>{"\\text{PnL}_i = w_1 \\times r_1 + w_2 \\times r_2"}</K>
        <K display>{"\\text{VaR}_{MC}(\\alpha) = -\\text{percentile}(\\text{PnL},\\,1-\\alpha)"}</K>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Étapes de la VaR Monte Carlo</SectionTitle>
      <ExampleBlock title="Procédure complète VaR MC" accent={ACCENT}>
        <FormulaBox accent={ACCENT} label="Résultat">
          <K>{"\\text{VaR}_{MC}(\\alpha) = -\\text{PnL}_{\\lfloor(1-\\alpha)N\\rfloor}"}</K>
        </FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Monte Carlo" ruleDetail="Calibration µ, σ, ρ" accent={ACCENT}><strong>Calibrer les paramètres du modèle :</strong> Estimer <K>{"\\mu,\\,\\sigma,\\,\\rho"}</K> pour chaque actif à partir des données historiques. Pour un portefeuille énergie : <K>{"\\mu_{\\text{WTI}},\\,\\sigma_{\\text{WTI}},\\,\\mu_{\\text{Gaz}},\\,\\sigma_{\\text{Gaz}},\\,\\rho(\\text{WTI},\\text{Gaz})"}</K>. Utiliser éventuellement des modèles plus sophistiqués (GARCH pour la vol, mean-reversion pour les spreads).</DemoStep>
          <DemoStep num={2} rule="Simulation" ruleDetail="Cholesky : W = LZ" accent={ACCENT}><strong>Simuler N scénarios de prix à l'horizon T :</strong> Pour chaque simulation i, tirer des aléas corrélés via la décomposition de Cholesky. Pour 2 actifs : <K>{"W_1 = Z_1,\\; W_2 = \\rho Z_1 + \\sqrt{1-\\rho^2}\\,Z_2"}</K> avec <K>{"Z_1, Z_2 \\sim \\mathcal{N}(0,1)"}</K>. Pour n actifs, utiliser la décomposition complète de Cholesky de la matrice de corrélation.</DemoStep>
          <DemoStep num={3} rule="Simulation" ruleDetail="PnL = Σ wⱼ rⱼ V" accent={ACCENT}><strong>Valoriser le portefeuille dans chaque scénario :</strong> Calculer la valeur du portefeuille à t+H sous chaque scénario. Pour des positions simples (futures) : <K>{"\\text{PnL}_i = \\sum_j w_j \\cdot r_{j,i} \\cdot V"}</K>. Pour des options : recalculer le prix BS ou regreek dans chaque scénario.</DemoStep>
          <DemoStep num={4} rule="Quantile empirique" ruleDetail="VaR = −PnL₍ₖ₎" accent={ACCENT}><strong>Lire le quantile :</strong> Trier les N P&L simulés. <K>{"\\text{VaR}_{MC}(\\alpha) = -\\text{PnL}_{\\lfloor(1-\\alpha)N\\rfloor}"}</K>. <K>{"\\text{CVaR}_{MC} = -\\frac{1}{k}\\sum_{i=1}^{k} \\text{PnL}_{(i)}"}</K>. L'erreur d'estimation MC est de l'ordre de <K>{"\\frac{\\text{VaR}}{\\sqrt{N(1-\\alpha)}}"}</K>.</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Corrélations en Monte Carlo — l'outil Cholesky</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Simuler des actifs corrélés correctement est crucial. La <strong style={{ color: ACCENT }}>décomposition de Cholesky</strong> <K>{"L"}</K> de la matrice de corrélation <K>{"\\Sigma = LL^\\top"}</K> permet de générer des vecteurs aléatoires corrélés : <K>{"X = L \\times Z"}</K> où <K>{"Z \\sim \\mathcal{N}(0,I)"}</K>. Pour une matrice 3×3, Cholesky donne une matrice triangulaire inférieure <K>{"L"}</K> telle que <K>{"Z_{1,\\text{corr}} = L_{11}Z_1"}</K>, <K>{"Z_{2,\\text{corr}} = L_{21}Z_1 + L_{22}Z_2"}</K>, etc.
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Corrélations de crise :</strong> En période normale, <K>{"\\rho(\\text{WTI}, \\text{Gaz}) \\approx 0.3\\text{–}0.5"}</K>. En période de crise (krach pétrolier 2020), toutes les corrélations entre matières premières énergétiques peuvent monter vers 0.7-0.9. Pour le stress testing, on utilise des matrices de corrélation de crise historiques (période 2008-2009 ou 2020) pour calculer une "Stressed VaR" — mesure réglementaire imposée depuis Bâle II.5.
      </div>

      <IntuitionBlock emoji="🔥" title="Stressed VaR — la VaR sous stress réglementaire" accent={ACCENT}>
        Le Stressed VaR (sVaR) est une VaR Monte Carlo calculée en utilisant les paramètres calibrés sur une période historique de stress intense (ex: 2008-2009 pour les marchés financiers, 2020 pour l'énergie). Bâle II.5 (2009) l'a rendu obligatoire : <K>{"\\text{capital}_{MR} = \\max(\\text{VaR},\\,m \\times \\overline{\\text{VaR}}_{60j}) + \\max(\\text{sVaR},\\,m \\times \\overline{\\text{sVaR}}_{60j})"}</K>. L'idée est de forcer les banques à se capitaliser pour des scénarios de crise, pas seulement pour les conditions normales de marché.
      </IntuitionBlock>

      <Accordion title="Exercice — VaR MC pour un portefeuille 2 actifs énergétiques" accent={ACCENT} badge="Moyen">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Paramètres :</strong> WTI (<K>{"w_1=60\\%,\\,\\sigma_1=25\\%/\\text{an}"}</K>), Gaz Nat (<K>{"w_2=40\\%,\\,\\sigma_2=45\\%/\\text{an}"}</K>), <K>{"\\rho=0.4"}</K>. Valeur = 5M€. <K>{"H=1/252\\,\\text{an}"}</K>. <K>{"\\alpha=99\\%"}</K>.<br /><br />
          <strong>Simulation manuelle (1 scénario) :</strong><br />
          Tirer <K>{"Z_1=1.2,\\,Z_2=-0.8"}</K> (indépendants).<br />
          Cholesky : <K>{"W_1 = Z_1 = 1.2"}</K>, <K>{"W_2 = \\rho Z_1 + \\sqrt{1-\\rho^2}\\,Z_2 = 0.4 \\times 1.2 + 0.917 \\times (-0.8) = -0.254"}</K>.<br />
          Rendements : <K>{"r_1 = 25\\%/\\sqrt{252} \\times 1.2 = 1.895\\%"}</K><br />
          <K>{"r_2 = 45\\%/\\sqrt{252} \\times (-0.254) = -0.723\\%"}</K><br />
          <K>{"\\text{PnL} = (0.6 \\times 1.895\\% + 0.4 \\times (-0.723\\%)) \\times 5\\text{M€} = 0.848\\% \\times 5\\text{M€} = 42\\,400\\text{€}"}</K><br /><br />
          <strong>Résultat MC (<K>{"N=10\\,000"}</K> simulations) :</strong><br />
          <K>{"\\text{VaR}_{MC}(99\\%) \\approx \\sigma_p \\times z_{99\\%} \\times \\text{Valeur} = 1.57\\% \\times 2.326 \\times 5\\text{M€}"}</K> ≈ <strong style={{ color: ACCENT }}>183 000€</strong><br />
          La variance MC converge vers la formule analytique avec une erreur de l'ordre de <K>{"1/\\sqrt{N}"}</K>.
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
        Un <K>{"\\xi = 0.3"}</K> pour le pétrole WTI signifie que les pertes extrêmes sont bien plus fréquentes que la normale ne le prédit. Concrètement : la VaR à 99.9% calculée par EVT (GPD) peut être 2 à 3 fois plus grande que la VaR gaussienne au même niveau de confiance. Pour l'électricité spot (<K>{"\\xi \\approx 0.5\\text{–}1.0"}</K>), les spikes de prix peuvent être 10-20× la moyenne — phénomène impossible à capturer avec un modèle normal. C'est pourquoi les régulateurs imposent des calculs EVT pour les positions en énergie.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Distribution de Pareto Généralisée (GPD) — Théorème Pickands-Balkema-de Haan">
        <K display>{"F_u(y) = P(X - u \\leq y \\mid X > u) \\approx G_{\\xi,\\beta}(y)"}</K>
        <K display>{"G_{\\xi,\\beta}(y) = 1 - \\left(1 + \\frac{\\xi \\cdot y}{\\beta}\\right)^{-1/\\xi} \\quad \\text{si } \\xi \\neq 0"}</K>
        <K>{"\\xi > 0"}</K> : queues épaisses (Pareto)
        <K>{"\\xi = 0"}</K> : exponentielle (queues normales)
        <K>{"\\xi < 0"}</K> : queues bornées (Weibull)
      </FormulaBox>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Les 3 régimes du tail index ξ — visualisation des queues</div>
        <Step num={1} accent={ACCENT}><K>{"\\xi > 0"}</K> (Pareto — queues infiniment épaisses) : plus <K>{"\\xi"}</K> est grand, plus les extrêmes sont fréquents et sévères. Pour le pétrole brut WTI : <K>{"\\xi \\approx 0.2\\text{–}0.4"}</K> → VaR 99.9% est environ 2−3× la VaR normale. Pour l'électricité spot : <K>{"\\xi \\approx 0.5\\text{–}1.0"}</K> → spikes de 10−20× la moyenne.</Step>
        <Step num={2} accent={ACCENT}><K>{"\\xi = 0"}</K> (Gumbel/Normal — queues exponentielles) : décroissance exponentielle de la queue. Correspond à la loi normale, log-normale, exponentielle. Tous les moments existent. C'est l'hypothèse (incorrecte) de la VaR gaussienne standard.</Step>
        <Step num={3} accent={ACCENT}><K>{"\\xi < 0"}</K> (Weibull — queues bornées) : il existe un maximum absolu pour les pertes. Extrêmement rare pour les prix financiers. Plus pertinent pour des variables physiques bornées. En pratique, jamais utilisé pour la VaR énergie.</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          Intuition : <K>{"\\xi"}</K> mesure l'épaisseur des queues. Une compagnie pétrolière avec <K>{"\\xi=0.4"}</K> devrait avoir une VaR de stress 3× plus grande que ce que la normale prédit — et sous-capitaliser de ce facteur si elle utilise un modèle gaussien.
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
        <strong style={{ color: ACCENT }}>Pour l'énergie :</strong> <K>{"\\xi"}</K> typique pour gaz nat <K>{"\\approx 0.3\\text{–}0.5"}</K> (queues épaisses).
        WTI : <K>{"\\xi \\approx 0.2\\text{–}0.4"}</K>. Électricité (spot) : <K>{"\\xi \\approx 0.5\\text{–}1.0"}</K> (très heavy-tailed).
        La VaR normale avec <K>{"\\xi=0.3"}</K> peut sous-estimer la VaR réelle de 30-50% sur les grands quantiles.
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
          Seuil <K>{"u = 3\\%"}</K> (pertes journalières {'>'} 3%), <K>{"\\xi = 0.28"}</K>, <K>{"\\beta = 0.015"}</K> (1.5%).<br /><br />
          <strong>Interprétation de <K>{"\\xi = 0.28"}</K> :</strong><br />
          • Queue épaisse mais modérée. Les moments d'ordre <K>{"< 1/0.28 = 3.57"}</K> existent (moyenne, variance, skewness existent ; kurtosis ≈ à la limite).<br />
          • Les événements à <K>{"5\\sigma"}</K> (normalement une fois tous les 13 000 ans) arrivent en pratique beaucoup plus souvent.<br /><br />
          <strong>Calcul de VaR EVT à 99.9% :</strong><br />
          <K display>{"P(X > \\text{VaR} \\mid X > u) = \\frac{n_u}{n} \\times \\left(1 + \\xi \\cdot \\frac{\\text{VaR}-u}{\\beta}\\right)^{-1/\\xi} = 0.001"}</K>
          Si <K>{"u=3\\%"}</K>, <K>{"n_u/n \\approx 5\\%"}</K>, alors <K>{"P(X > \\text{VaR} \\mid X > u) = 0.001/0.05 = 0.02"}</K>.<br />
          <K>{"\\left(1 + 0.28 \\times \\frac{\\text{VaR}-0.03}{0.015}\\right)^{-1/0.28} = 0.02"}</K><br />
          → <K>{"\\text{VaR}_{EVT}(99.9\\%)"}</K> ≈ <strong style={{ color: ACCENT }}>8.4%</strong><br />
          Comparé à <K>{"\\text{VaR}_{\\text{normale}}(99.9\\%) = 3.09 \\times 2\\% \\approx 6.2\\%"}</K> → EVT prédit une VaR 35% plus élevée !
        </div>
      </Accordion>

      <Accordion title="Exercice — Choisir le seuil u en méthode POT" accent={ACCENT} badge="Difficile">
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: ACCENT }}>Le dilemme du seuil :</strong> Trop bas → les excès ne suivent pas la GPD (mélange de distribution corps + queue). Trop haut → peu d'observations, grande variance d'estimation.<br /><br />
          <strong>Outils diagnostiques :</strong><br />
          1. <strong>Mean Excess Plot (MEP) :</strong> Tracer <K>{"e(u) = E[X-u \\mid X > u]"}</K> en fonction de <K>{"u"}</K>. Si la GPD est appropriée, <K>{"e(u)"}</K> doit être linéaire en <K>{"u"}</K>. La linéarité commence au bon seuil <K>{"u^*"}</K>.<br />
          2. <strong>Stability plots :</strong> Estimer <K>{"\\xi(u)"}</K> et <K>{"\\beta(u)"}</K> pour différents seuils <K>{"u"}</K>. Choisir <K>{"u"}</K> tel que <K>{"\\xi(u)"}</K> et <K>{"\\beta(u) = \\beta - \\xi u"}</K> se stabilisent.<br />
          3. <strong>Règle empirique :</strong> Viser environ 10-15% des observations dans la queue → <K>{"n_u/n \\approx 10\\text{–}15\\%"}</K>.<br /><br />
          <strong>Exemple WTI :</strong> Sur 2520 jours (10 ans), on prend les 5% pires journées : <K>{"n_u = 126"}</K> observations au-dessus de <K>{"u=3\\%"}</K>. C'est suffisant pour une calibration GPD raisonnable. Si on prenait <K>{"u=5\\%"}</K>, <K>{"n_u \\approx 38"}</K> → trop peu pour calibration fiable.
        </div>
      </Accordion>
    </div>
  )
}

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
        <K>{"\\text{VaR}_{\\text{portefeuille}} \\neq \\sum \\text{VaR}_{\\text{individuelles}}"}</K> (car corrélation {'<'} 1 → diversification).
        La VaR marginale mesure l'impact d'augmenter légèrement la position dans l'actif <K>{"i"}</K>.
        VaR de composante <K>{"= \\text{MVaR}_i \\times w_i"}</K> = contribution de l'actif au risque total.
        <K>{"\\sum \\text{CVaR}_i = \\text{VaR}_{\\text{portefeuille}}"}</K> (décomposition exacte !)
        Utile pour décider où réduire le risque : l'actif avec la plus grande contribution est le plus "dangereux".
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="VaR Marginale & VaR de Composante">
        <K display>{"\\text{MVaR}_i = z_{\\alpha} \\times \\frac{\\text{Cov}(r_i,\\,r_p)}{\\sigma_p} = z_{\\alpha} \\times \\beta_i \\times \\sigma_p"}</K>
        <K display>{"\\text{CVaR}_i = w_i \\times \\text{MVaR}_i \\quad \\text{(VaR de composante)}"}</K>
        <K display>{"\\sum_i \\text{CVaR}_i = \\text{VaR}_p \\quad \\text{(décomposition exacte)}"}</K>
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
        <strong style={{ color: ACCENT }}>Théorème d'Euler (décomposition homogène) :</strong> Puisque la VaR est homogène de degré 1 en w (doubler tous les poids double la VaR), le théorème d'Euler garantit que <K>{"\\sum_i w_i \\times \\frac{\\partial \\text{VaR}}{\\partial w_i} = \\text{VaR}_p"}</K>. Autrement dit : <K>{"\\sum_i \\text{CVaR}_i = \\text{VaR}_{\\text{totale}}"}</K>. Cette propriété est cruciale — elle permet une décomposition <em>exacte</em> et additive du risque total entre tous les actifs.
      </div>

      <SectionTitle accent={ACCENT}>Application : réduction de risque et allocation optimale</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La VaR marginale guide directement les décisions de réduction de risque. Pour réduire la VaR totale de façon optimale, on doit agir en priorité sur les actifs à <strong style={{ color: ACCENT }}>MVaR élevée</strong> (forte contribution marginale). L'optimum est atteint quand toutes les <K>{"\\text{MVaR}_i"}</K> sont égales (optimum de portefeuille en termes de risque pur).
      </div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Si <K>{"\\text{MVaR}_{\\text{WTI}} > \\text{MVaR}_{\\text{Gaz}}"}</K> : on réduit d'abord la position WTI. Si <K>{"\\text{MVaR}_i < 0"}</K> pour un actif : cet actif réduit le risque total — augmenter sa position diminue la VaR (parfait couvreur). Cette logique est la base de l'optimisation de portefeuille par rapport au risque (Risk Budgeting).
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
          <strong style={{ color: ACCENT }}>Portefeuille :</strong> WTI (<K>{"w_1=50\\%,\\,\\sigma_1=25\\%"}</K>), Gaz Nat (<K>{"w_2=30\\%,\\,\\sigma_2=40\\%"}</K>), Électricité (<K>{"w_3=20\\%,\\,\\sigma_3=60\\%"}</K>). Corrélations : <K>{"\\rho_{12}=0.5,\\,\\rho_{13}=0.3,\\,\\rho_{23}=0.4"}</K>. Valeur = 10M€, <K>{"\\alpha=99\\%"}</K>.<br /><br />
          <strong>Étape 1 — Matrice de variance-covariance (daily, divisé par 252) :</strong><br />
          <K>{"\\sigma_{1,d} = 25\\%/\\sqrt{252} = 1.575\\%"}</K>, <K>{"\\sigma_{2,d} = 40\\%/\\sqrt{252} = 2.520\\%"}</K>, <K>{"\\sigma_{3,d} = 60\\%/\\sqrt{252} = 3.779\\%"}</K><br />
          <K>{"\\text{Cov}_{12} = 0.5 \\times 1.575\\% \\times 2.520\\% = 0.000198"}</K><br />
          <K>{"\\text{Cov}_{13} = 0.3 \\times 1.575\\% \\times 3.779\\% = 0.000178"}</K><br />
          <K>{"\\text{Cov}_{23} = 0.4 \\times 2.520\\% \\times 3.779\\% = 0.000381"}</K><br /><br />
          <strong>Étape 2 — Variance portefeuille :</strong><br />
          <K display>{"\\sigma_p^2 = w_1^2\\sigma_1^2 + w_2^2\\sigma_2^2 + w_3^2\\sigma_3^2 + 2w_1 w_2 \\text{Cov}_{12} + 2w_1 w_3 \\text{Cov}_{13} + 2w_2 w_3 \\text{Cov}_{23}"}</K>
          <K>{"= 0.25 \\times 0.000248 + 0.09 \\times 0.000635 + 0.04 \\times 0.001428 + 2 \\times 0.15 \\times 0.000198 + 2 \\times 0.10 \\times 0.000178 + 2 \\times 0.06 \\times 0.000381"}</K><br />
          <K>{"= 0.0000620 + 0.0000572 + 0.0000571 + 0.0000594 + 0.0000356 + 0.0000457 = 0.000317"}</K><br />
          <K>{"\\sigma_p = 1.781\\%"}</K> → <K>{"\\text{VaR}_p = 2.326 \\times 1.781\\% \\times 10\\text{M€}"}</K> = <strong style={{ color: ACCENT }}>414 400€</strong><br /><br />
          <strong>Étape 3 — Covariances avec le portefeuille :</strong><br />
          <K>{"\\text{Cov}(r_1, r_p) = w_1\\sigma_1^2 + w_2\\text{Cov}_{12} + w_3\\text{Cov}_{13} = 0.5 \\times 0.000248 + 0.3 \\times 0.000198 + 0.2 \\times 0.000178 = 0.0001953"}</K><br />
          <K>{"\\text{MVaR}_1 = 2.326 \\times 0.0001953/0.0001781 = 2.554\\%"}</K> → <K>{"\\text{CVaR}_1 = 0.5 \\times 2.554\\% = 1.277\\%"}</K> (50.7% du total)<br /><br />
          <strong>Interprétation :</strong> Malgré son poids modeste (50%), le WTI contribue à 50.7% du risque total car sa forte corrélation avec les autres actifs amplifie son impact marginal.
        </div>
      </Accordion>
    </div>
  )
}

export function EaRTab() {
  const [mu, setMu] = useState(50)       // moyenne cashflow (M$)
  const [sigma, setSigma] = useState(20) // vol cashflow (M$)
  const [conf, setConf] = useState(0.95)
  const [horizon, setHorizon] = useState(4) // trimestres

  const zAlpha = conf === 0.99 ? 2.326 : conf === 0.95 ? 1.645 : 1.282
  const ear = zAlpha * sigma
  const cfar = zAlpha * sigma * Math.sqrt(horizon)

  const cfDist = useMemo(() => {
    const pts = []
    for (let x = mu - 4 * sigma; x <= mu + 4 * sigma; x += (8 * sigma) / 150) {
      const z = (x - mu) / sigma
      const pdf = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) / sigma
      pts.push({ x: +x.toFixed(1), pdf: +pdf.toFixed(5), shade: x <= mu - ear ? +pdf.toFixed(5) : null })
    }
    return pts
  }, [mu, sigma, ear])

  // Simulated quarterly cash flows
  const simData = useMemo(() => {
    const quarters = Array.from({ length: horizon }, (_, i) => {
      const cf = mu + sigma * gaussRand()
      return { q: `Q${i + 1}`, cf: +cf.toFixed(1), min: +(mu - ear).toFixed(1), expected: mu }
    })
    return quarters
  }, [mu, sigma, horizon, ear])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La <strong style={{ color: ACCENT }}>VaR (Module 6)</strong> mesure le risque de marché d'un portefeuille de trading — c'est une perspective de <em>trader</em> sur des positions mark-to-market à court terme.
        L'<strong style={{ color: ACCENT }}>EaR (Earnings at Risk)</strong> et le <strong style={{ color: ACCENT }}>CFaR (Cash Flow at Risk)</strong> mesurent, eux, le risque sur les <em>revenus</em> et les <em>flux de trésorerie</em> d'une entreprise — une perspective <strong>"corporate"</strong> essentielle pour les producteurs d'énergie, les utilities, les industriels.
        Concrètement : un producteur de gaz naturel qui vend sa production n'est pas préoccupé par la valeur mark-to-market quotidienne de son portefeuille, mais par la question "Mes revenus de ce trimestre seront-ils suffisants pour couvrir mes coûts fixes et rembourser ma dette ?"
        C'est précisément à cette question que répondent l'EaR et le CFaR.
      </div>

      <IntuitionBlock emoji="💰" title="EaR : combien peut-on perdre sur nos revenus ?" accent={ACCENT}>
        Une société pétrolière budgète ses revenus trimestriels. Mais le prix du pétrole fluctue.
        L'<strong>Earnings at Risk (EaR)</strong> répond à : "À {(conf * 100).toFixed(0)}% de confiance,
        nos revenus ne tomberont pas en dessous de <K>{"E - EaR"}</K>."
        Le <strong>CFaR (Cash Flow at Risk)</strong> étend ce concept sur plusieurs périodes futures.
        C'est l'équivalent de la VaR, mais pour les flux de trésorerie plutôt que pour les P&L de trading.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Earnings at Risk (1 période)">
        <K display>{"EaR(\\alpha) = z_\\alpha \\times \\sigma_{CF}"}</K>
        <>où <K>{"z_\\alpha"}</K> = {zAlpha} pour <K>{"\\alpha"}</K> = {(conf * 100).toFixed(0)}%</>
        <K display>{"CF_{worst} = E[CF] - EaR = \\mu_{CF} - z_\\alpha \\times \\sigma_{CF}"}</K>
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="CFaR sur T périodes (cashflows iid)">
        <K display>{"CFaR(\\alpha, T) = z_\\alpha \\times \\sigma_{CF} \\times \\sqrt{T}"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['E[CF]', 'Cash flow espéré (budget)'],
        ['σ_CF', 'Écart-type du cash flow'],
        ['z_α', `Quantile normal pour α = ${(conf * 100).toFixed(0)}%`],
        ['EaR', 'Risque sur 1 période'],
        ['CFaR', `Risque cumulé sur ${horizon} périodes`],
      ]} />

      <SectionTitle accent={ACCENT}>EaR vs VaR — Différences fondamentales</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Critère', 'VaR', 'EaR / CFaR'].map(h => (
                <th key={h} style={{ color: T.muted, padding: '8px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Horizon', '1 jour à 10 jours', 'Trimestre, semestre, année'],
              ['Périmètre', 'Portefeuilles de trading', 'Revenus d\'exploitation, EBITDA'],
              ['Comptabilité', 'Mark-to-market (MtM)', 'Accrual (comptabilité d\'entreprise)'],
              ['Utilisateurs', 'Régulateur bancaire (Bâle III)', 'Management corporate, analystes actions'],
              ['Objectif', 'Capital réglementaire, limites de risque', 'Budget, planification, politique de couverture'],
              ['Inputs', 'Prix de marché, corrélations, VaR historique', 'Volatilité des revenus, vol des prix sous-jacents'],
            ].map(([c, var_, ear], i) => (
              <tr key={c} style={{ borderBottom: `1px solid ${T.border}33`, background: i % 2 === 0 ? `${ACCENT}05` : 'transparent' }}>
                <td style={{ padding: '9px 14px', color: ACCENT, fontWeight: 600 }}>{c}</td>
                <td style={{ padding: '9px 14px', color: T.muted }}>{var_}</td>
                <td style={{ padding: '9px 14px', color: T.text }}>{ear}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle accent={ACCENT}>Sources de risque sur les revenus d'une entreprise énergétique</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Les revenus d'un producteur d'énergie dépendent de plusieurs facteurs de risque simultanés. Comprendre ces sources permet de construire une politique de couverture adaptée.
      </div>
      <Grid cols={2} gap="10px" style={{ marginBottom: 14 }}>
        {[
          { title: 'Risque de prix', icon: '📉', color: T.error, text: 'P&L = Q × (Prix_marché - Coût_production). Si le prix du pétrole baisse de 80$ à 60$/bbl, les revenus chutent de 25% même si la production est identique. C\'est le risque principal pour les producteurs.' },
          { title: 'Risque de volume', icon: '⚙️', color: T.a5, text: 'La production peut varier : pannes d\'équipements, météo (éolien, hydraulique), grèves, problèmes techniques. Un vol de 20% sur les volumes amplifie directement le risque de revenus.' },
          { title: 'Risque de base', icon: '📍', color: T.a3, text: 'Différence entre le prix spot local (ex: gaz à Chicago) et le prix de référence utilisé pour la couverture (ex: Henry Hub). Un hedger qui utilise Henry Hub pour couvrir sa position Chicago reste exposé à ce "basis risk".' },
          { title: 'Risque de change', icon: '💱', color: ACCENT, text: 'Les commodités énergétiques sont cotées en USD. Une entreprise européenne qui vend en USD mais supporte des coûts en EUR est exposée au risque EUR/USD. Une appréciation de l\'EUR réduit ses revenus en EUR.' },
        ].map(s => (
          <div key={s.title} style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{s.icon} {s.title}</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>{s.text}</div>
          </div>
        ))}
      </Grid>

      <Grid cols={2} gap="10px">
        <Slider label="E[CF] (M$)" value={mu} min={10} max={200} step={5} onChange={setMu} accent={ACCENT} format={v => `${v}M$`} />
        <Slider label="σ_CF (M$)" value={sigma} min={2} max={80} step={1} onChange={setSigma} accent={T.a5} format={v => `${v}M$`} />
        <Slider label="Horizon (trimestres)" value={horizon} min={1} max={8} step={1} onChange={setHorizon} accent={T.muted} format={v => `${v}T`} />
        <div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 6 }}>Niveau de confiance</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0.90, 0.95, 0.99].map(c => (
              <button key={c} onClick={() => setConf(c)} style={{
                background: conf === c ? `${ACCENT}22` : T.panel2,
                border: `1px solid ${conf === c ? ACCENT : T.border}`,
                color: conf === c ? ACCENT : T.muted,
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: conf === c ? 700 : 400,
              }}>{(c * 100).toFixed(0)}%</button>
            ))}
          </div>
        </div>
      </Grid>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="EaR (1T)" value={`${ear.toFixed(1)}M$`} accent={ACCENT} />
        <InfoChip label="CF_worst (1T)" value={`${(mu - ear).toFixed(1)}M$`} accent={T.error} />
        <InfoChip label={`CFaR (${horizon}T)`} value={`${cfar.toFixed(1)}M$`} accent={T.a5} />
        <InfoChip label="CF_worst cumulé" value={`${(mu * horizon - cfar).toFixed(1)}M$`} accent={T.error} />
      </div>

      <Grid cols={2} gap="12px">
        <ChartWrapper title="Distribution des CF trimestriels — zone rouge = perte" accent={ACCENT} height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cfDist} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <ReferenceLine x={mu} stroke={ACCENT} strokeDasharray="4 3" label={{ value: 'E[CF]', fill: ACCENT, fontSize: 10 }} />
              <ReferenceLine x={mu - ear} stroke={T.error} strokeWidth={2} label={{ value: 'EaR', fill: T.error, fontSize: 10 }} />
              <Line type="monotone" dataKey="pdf" stroke={ACCENT} strokeWidth={2.5} dot={false} name="f(CF)" />
              <Line type="monotone" dataKey="shade" stroke={T.error} strokeWidth={0} dot={false} fill={`${T.error}44`} name="Zone risque" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title={`Cash flows simulés sur ${horizon} trimestres`} accent={T.a5} height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="q" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <ReferenceLine y={mu} stroke={ACCENT} strokeDasharray="4 3" label={{ value: 'Budget', fill: ACCENT, fontSize: 10 }} />
              <ReferenceLine y={mu - ear} stroke={T.error} strokeDasharray="4 3" label={{ value: 'EaR', fill: T.error, fontSize: 10 }} />
              <Bar dataKey="cf" fill={T.a5} fillOpacity={0.8} name="CF réalisé (M$)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>

      <ExampleBlock title="Producteur de gaz naturel — EaR annuel" accent={ACCENT}>
        <p>Production : 10 Bcf/an, prix spot moyen = 3$/MMBtu (<K>{"\\sigma = 0.8"}</K> $/MMBtu), vol = 30%</p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Revenus minimaux cumulés (95\\%)} = 93.7\\text{ M\\$}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="EaR énergie" ruleDetail="Volume × Prix" accent={ACCENT}>Revenus espérés = <K>{"10 \\times 3 = 30"}</K> M$ par trimestre (E[CF])</DemoStep>
          <DemoStep num={2} rule="Risque de prix" ruleDetail="σ_CF = Vol × σ_prix" accent={ACCENT}><K>{"\\sigma_{CF} = 10 \\times 0.8 = 8"}</K> M$/trimestre (risque de prix × volume)</DemoStep>
          <DemoStep num={3} rule="EaR" ruleDetail="z_α × σ_CF" accent={ACCENT}><K>{"EaR_{95\\%} = 1.645 \\times 8 = 13.2"}</K> M$/trimestre</DemoStep>
          <DemoStep num={4} rule="CFaR" ruleDetail="z_α × σ_CF × √T" accent={ACCENT}><K>{"CFaR_{95\\%} = 1.645 \\times 8 \\times \\sqrt{4} = 26.3"}</K> M$</DemoStep>
          <DemoStep num={5} rule="Perte attendue sur revenus" ruleDetail="E[CF] × T − CFaR" accent={ACCENT}>Revenus minimaux cumulés (95%) = <K>{"120 - 26.3 = 93.7"}</K> M$</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <IntuitionBlock emoji="🤔" title="Couvrir ou ne pas couvrir — le dilemme corporate" accent={ACCENT}>
        Modigliani-Miller (1958) affirme que dans des marchés parfaits, la couverture n'a pas de valeur : les actionnaires peuvent se couvrir eux-mêmes. Alors pourquoi les entreprises énergétiques dépensent-elles des milliards en programmes de couverture ?
        En pratique, les <strong>frictions de marché créent de la valeur à couvrir</strong> :<br />
        • <strong>Coûts de détresse financière</strong> : si les revenus baissent fortement, l'entreprise peut ne plus honorer sa dette → faillite coûteuse. Couvrir réduit cette probabilité.<br />
        • <strong>Sous-investissement</strong> : sans visibilité sur les flux, les managers hésitent à investir. La couverture garantit le financement des projets rentables.<br />
        • <strong>Impôts progressifs</strong> : une entreprise avec des revenus volatils paie plus d'impôts en moyenne (convexité du barème fiscal) qu'une entreprise aux revenus stables.<br />
        La règle pratique : une entreprise devrait couvrir si la <em>volatilité des revenus a un coût tangible</em> — ce qui est presque toujours le cas en énergie, où les prix peuvent bouger de ±50% en un an.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice 1 — Calcul EaR basique" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}><K>{"E[CF] = 100"}</K> M$, <K>{"\\sigma = 25"}</K> M$. Calculez EaR 95% et le CF plancher.</p>
        <FormulaBox accent={ACCENT}><K display>{"CF_{plancher} = 100 - 41.1 = 58.9\\text{ M\\$}"}</K> (avec 95% de confiance)</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="EaR" ruleDetail="z_α × σ_CF" accent={ACCENT}><K>{"EaR = 1.645 \\times 25 = 41.1"}</K> M$ → CF plancher = <K>{"100 - 41.1 = 58.9"}</K> M$</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 2 — CFaR multi-périodes" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Une raffinerie a <K>{"E[CF] = 50"}</K> M$/trim, <K>{"\\sigma = 15"}</K> M$/trim. CFaR 99% sur 8 trimestres ?</p>
        <FormulaBox accent={ACCENT}><K display>{"CF_{\\text{cumulé, plancher}} = 8 \\times 50 - 98.7 = 301.3\\text{ M\\$}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="CFaR" ruleDetail="z_α × σ × √T" accent={ACCENT}><K>{"CFaR = z_{99\\%} \\times \\sigma \\times \\sqrt{T} = 2.326 \\times 15 \\times \\sqrt{8}"}</K></DemoStep>
          <DemoStep num={2} rule="Application numérique" ruleDetail="calcul" accent={ACCENT}><K>{"= 2.326 \\times 15 \\times 2.828 = 98.7"}</K> M$ → CF cumulé plancher = <K>{"400 - 98.7 = 301.3"}</K> M$</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 3 — EaR d'un producteur de gaz naturel" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Producteur de gaz : 50 Bcf/an de production, prix Henry Hub = 3.5$/MMBtu, <K>{"\\sigma_{prix} = 1.0"}</K> $/MMBtu. Calculez l'EaR trimestriel à 95% et le CFaR annuel (4 trimestres).</p>
        <FormulaBox accent={ACCENT}><K display>{"CF_{\\text{annuel, plancher}} = 4 \\times 43.75 - 41.1 = 175 - 41.1 = 133.9\\text{ M\\$}"}</K> (vs budget 175M$)</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="EaR énergie" ruleDetail="Volume trimestriel" accent={ACCENT}>Volume trimestriel = <K>{"50 / 4 = 12.5"}</K> Bcf = 12 500 000 MMBtu</DemoStep>
          <DemoStep num={2} rule="Revenu espéré" ruleDetail="Vol × Prix" accent={ACCENT}><K>{"E[CF_{trim}] = 12\\,500\\,000 \\times 3.5 = 43.75"}</K> M$/trimestre</DemoStep>
          <DemoStep num={3} rule="Risque de prix" ruleDetail="σ_CF = Vol × σ_prix" accent={ACCENT}><K>{"\\sigma_{CF} = 12\\,500\\,000 \\times 1.0 = 12.5"}</K> M$</DemoStep>
          <DemoStep num={4} rule="EaR" ruleDetail="z_α × σ_CF" accent={ACCENT}><K>{"EaR_{95\\%} = 1.645 \\times 12.5 = 20.6"}</K> M$ → CF plancher = <K>{"43.75 - 20.6 = 23.15"}</K> M$/T</DemoStep>
          <DemoStep num={5} rule="CFaR" ruleDetail="z_α × σ × √T" accent={ACCENT}><K>{"CFaR_{95\\%} = 1.645 \\times 12.5 \\times \\sqrt{4} = 41.1"}</K> M$. L'EaR de 20.6M$ représente 47% du CF trimestriel espéré — cela justifie une couverture active. Avec couverture à 70%, σ_CF = 3.75M$ et EaR = 6.2M$.</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 4 — Stratégie de couverture 50% vs 100%" accent={ACCENT} badge="Avancé">
        <p style={{ color: T.text }}>Même producteur de gaz. Comparez l'impact d'une couverture à 50% vs 100% de la production sur l'EaR et sur les revenus upside perdus.</p>
        <FormulaBox accent={ACCENT}>Compromis optimal : 50-70% couvert = protection contre la baisse, participation à la hausse</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Hedge ratio" ruleDetail="0% couverture" accent={ACCENT}>Sans couverture : <K>{"\\sigma_{CF} = 12.5"}</K> M$/T, EaR 95% = 20.6M$, upside illimité</DemoStep>
          <DemoStep num={2} rule="Hedge ratio" ruleDetail="50% couverture" accent={ACCENT}>Couverture 50% : <K>{"\\sigma_{résid} = 12.5 \\times 0.50 = 6.25"}</K> M$, <K>{"EaR = 1.645 \\times 6.25 = 10.3"}</K> M$</DemoStep>
          <DemoStep num={3} rule="Hedge ratio" ruleDetail="100% couverture" accent={ACCENT}>Couverture 100% via swap : σ_CF = 0, EaR = 0 → revenus certains = 43.75M$/T</DemoStep>
          <DemoStep num={4} rule="Ratio de couverture" ruleDetail="Coût d'opportunité" accent={ACCENT}>Coût de la couverture 100% : si prix monte à 4.5$/MMBtu, on rate <K>{"1.0 \\times 12.5M = 12.5"}</K> M$ d'upside/T. La plupart des compagnies visent 50-80% de couverture pour les 12-18 prochains mois.</DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

export function RAROCTab() {
  const [niacc, setNiacc] = useState(15)   // Net Income After Cost of Capital (M$)
  const [ec, setEc] = useState(100)          // Economic Capital (M$)
  const [revenue, setRevenue] = useState(50)
  const [costs, setCosts] = useState(20)
  const [expectedLoss, setExpectedLoss] = useState(5)
  const [costOfCapital, setCostOfCapital] = useState(10)

  const niacc_calc = revenue - costs - expectedLoss - (costOfCapital / 100) * ec
  const raroc = ec > 0 ? (niacc_calc / ec) * 100 : 0
  const hurdle = costOfCapital  // hurdle rate = cost of capital

  const projects = [
    { name: 'Pétrole Offshore', rev: 80, cost: 35, el: 8, ec: 150, coc: 10 },
    { name: 'Gaz Pipeline', rev: 50, cost: 20, el: 3, ec: 80, coc: 10 },
    { name: 'Trading Dérivés', rev: 40, cost: 15, el: 12, ec: 120, coc: 12 },
    { name: 'Renouvelables', rev: 30, cost: 10, el: 1, ec: 60, coc: 8 },
  ].map(p => ({
    ...p,
    niacc: p.rev - p.cost - p.el - (p.coc / 100) * p.ec,
    raroc: +((((p.rev - p.cost - p.el - (p.coc / 100) * p.ec) / p.ec) * 100)).toFixed(1),
  }))

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>RAROC (Risk-Adjusted Return on Capital)</strong> est le pont entre la finance de marché et la stratégie d'entreprise.
        Il permet de comparer des activités de risque très différentes sur une base homogène : <em>"Quelle activité crée le plus de valeur par unité de risque prise ?"</em>
        Sans RAROC, un manager pourrait préférer un projet qui génère 30M$ de revenus bruts (mais mobilise 500M$ de capital risqué) à un projet qui génère 15M$ (mais sur seulement 50M$ de capital). Le RAROC corrige ce biais en normalisant par le risque réel pris.
        En pratique, le RAROC est utilisé pour : décider quels projets accepter ou refuser, allouer le capital rare entre activités concurrentes, rémunérer les traders et les divisions en fonction de la valeur créée ajustée du risque.
      </div>

      <IntuitionBlock emoji="⚖️" title="RAROC : rentabilité ajustée par le risque" accent={ACCENT}>
        La rentabilité brute ne suffit pas. Un projet qui rapporte 20% mais prend 10x plus de risque
        n'est pas meilleur qu'un projet à 15% avec peu de risque.
        Le <strong>RAROC (Risk-Adjusted Return on Capital)</strong> normalise le rendement par le capital
        économique mobilisé. Si <K>{"RAROC > \\text{Hurdle Rate}"}</K> (coût du capital), le projet crée de la valeur.
        C'est l'outil de décision standard dans les banques et les compagnies énergétiques intégrées.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="RAROC">
        <K display>{"RAROC = \\frac{NIACC}{EC}"}</K>
        <K display>{"NIACC = \\text{Revenus} - \\text{Coûts} - \\text{Pertes Attendues} - (\\text{Coût du Capital} \\times EC)"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['NIACC', 'Net Income After Cost of Capital'],
        ['EC', 'Capital Économique (capital réglementaire ajusté au risque)'],
        ['EL', 'Expected Loss (perte attendue annuelle)'],
        ['CoC', 'Cost of Capital (taux de rendement minimal exigé)'],
        ['Hurdle Rate', 'Seuil : RAROC > CoC → création de valeur'],
      ]} />

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie du RAROC — numérateur et dénominateur</div>
        <Step num={1} accent={ACCENT}><strong>Numérateur = NIACC</strong> = Revenus nets - Coûts opérationnels - Expected Loss (<K>{"EL = PD \\times LGD \\times EAD"}</K>). L'EL est la perte moyenne annuelle du portefeuille — c'est une charge d'exploitation normale, provisionnée chaque année.</Step>
        <Step num={2} accent={ACCENT}><strong>Dénominateur = Capital Économique</strong> = <K>{"VaR_{99.9\\%} - EL"}</K>. Seule la perte inattendue (UL = Unexpected Loss) consomme du capital. La perte attendue est déjà couverte par les provisions, donc le capital protège uniquement contre les queues de distribution.</Step>
        <Step num={3} accent={ACCENT}><strong>Hurdle rate h</strong> : si <K>{"RAROC > h"}</K> → le projet crée de la valeur pour les actionnaires (rémunère suffisamment le capital risqué) ; si <K>{"RAROC < h"}</K> → le projet détruit de la valeur et doit être refusé ou restructuré pour améliorer le ratio.</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : le RAROC permet de comparer des projets de tailles et de risques très différents sur une base homogène — un projet de 10M$ très risqué peut avoir un RAROC inférieur à un projet de 1M$ peu risqué. C'est l'outil d'allocation optimale du capital rare entre les desks et les lignes métiers.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Les trois composantes du RAROC</SectionTitle>
      <Grid cols={3} gap="10px" style={{ marginBottom: 14 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.success}33` }}>
          <div style={{ color: T.success, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>① Numérateur — Revenus ajustés</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            = Revenus bruts<br />
            − Coûts opérationnels<br />
            − <strong style={{ color: T.error }}>Expected Loss (EL)</strong><br /><br />
            <K>{"EL = PD \\times LGD \\times EAD"}</K><br />
            <em>PD = prob. de défaut, LGD = perte en cas de défaut, EAD = exposition au moment du défaut</em><br /><br />
            L'EL est le "coût moyen du risque" — une charge normale d'exploitation, comme une provision.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>② Dénominateur — Capital économique</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Le capital économique (EC) est le "coussin de sécurité" pour absorber les pertes <em>inattendues</em>.<br /><br />
            <K>{"EC \\approx VaR_{99.9\\%}"}</K> sur 1 an<br />
            = Perte que la banque/entreprise peut absorber avec 99.9% de probabilité<br /><br />
            C'est différent de l'EL (perte moyenne) — le EC couvre les queues de distribution.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a5}33` }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>③ Hurdle Rate — Le seuil minimal</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Le RAROC minimum acceptable = <strong>coût des fonds propres</strong><br /><br />
            Typiquement 10–15% selon le secteur<br /><br />
            Si <K>{"RAROC > \\text{Hurdle Rate}"}</K> : le projet <span style={{ color: T.success }}>crée de la valeur</span> (les actionnaires sont rémunérés au-delà de leur exigence)<br />
            Si <K>{"RAROC < \\text{Hurdle Rate}"}</K> : le projet <span style={{ color: T.error }}>détruit de la valeur</span> → à refuser ou restructurer
          </div>
        </div>
      </Grid>

      <SectionTitle accent={ACCENT}>Capital économique vs Capital réglementaire (Pilier 1 Bâle)</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Il existe deux approches pour mesurer le capital nécessaire, avec des philosophies très différentes :
      </div>
      <Grid cols={2} gap="10px" style={{ marginBottom: 14 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a4}33` }}>
          <div style={{ color: T.a4, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Capital réglementaire (Bâle III — Pilier 1)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            • Défini par le régulateur (Comité de Bâle)<br />
            • Formules standardisées identiques pour toutes les banques<br />
            • Approche Standard ou IRB (Internal Ratings-Based)<br />
            • Objectif : garantir la solvabilité minimale du système bancaire<br />
            • Peut surestimer le risque (conservateur) ou sous-estimer (approximation)<br />
            • Minimum légal : ne peut pas être en dessous
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Capital économique (Pilier 2 / Gestion interne)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            • Estimation interne par la banque/entreprise<br />
            • Modèles propriétaires, calibrés sur les données historiques internes<br />
            • Reflète le risque réel tel que perçu par le management<br />
            • Utilisé pour : RAROC, allocation de capital, rémunération<br />
            • Banques sophistiquées : capital éco peut être inférieur au capital réglementaire<br />
            • Piège : les modèles internes peuvent sous-estimer les risques extrêmes
          </div>
        </div>
      </Grid>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Point clé :</strong> Le capital réglementaire est le <em>plancher légal</em>. Le capital économique est la <em>mesure interne</em> pour les décisions de gestion. En pratique, les banques et les grandes compagnies énergétiques utilisent le capital économique pour le RAROC interne, et reportent le capital réglementaire aux superviseurs.
      </div>

      <SectionTitle accent={ACCENT}>RAROC et allocation de capital — Décider où investir</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Le RAROC est un outil d'allocation du capital rare : quand plusieurs activités se disputent le même capital, on priorise celles qui créent le plus de valeur par unité de risque. Le processus :
        (1) Calculer le RAROC de chaque activité/projet. (2) Comparer au hurdle rate. (3) Classer par RAROC décroissant. (4) Allouer le capital disponible en commençant par les RAROC les plus élevés, jusqu'à épuisement du budget de capital.
        Les activités dont <K>{"RAROC < \\text{hurdle rate}"}</K> doivent être restructurées, réduites, ou abandonnées — même si elles sont nominalement profitables.
      </div>

      <ExampleBlock title="Décision RAROC — Projet de trading en énergie" accent={ACCENT}>
        <p>Une banque d'énergie évalue un nouveau desk de trading de dérivés gaz. Budget capital = 50M$.</p>
        <FormulaBox accent={ACCENT}><K display>{"RAROC = 10.68\\% < \\text{Hurdle } 12\\%"}</K> → REFUSÉ. Levier : coûts à 4M$ → <K>{"RAROC = 14.7\\%"}</K> → acceptable</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="RAROC" ruleDetail="Revenus bruts" accent={ACCENT}>Revenus estimés : 18M$/an (spread bid-ask + positions directionnelles)</DemoStep>
          <DemoStep num={2} rule="RAROC" ruleDetail="Coûts opérationnels" accent={ACCENT}>Coûts opérationnels : 6M$/an (salaires traders, systèmes, back-office)</DemoStep>
          <DemoStep num={3} rule="RAROC" ruleDetail="EL = PD × LGD × EAD" accent={ACCENT}>Expected Loss : <K>{"EL = 0.015 \\times 0.55 \\times 80 = 0.66"}</K> M$/an</DemoStep>
          <DemoStep num={4} rule="RAROC" ruleDetail="EC = VaR 99.9%" accent={ACCENT}>Capital économique (VaR 99.9% 1 an) : 50M$</DemoStep>
          <DemoStep num={5} rule="RAROC" ruleDetail="CoC × EC" accent={ACCENT}>Coût du capital : <K>{"12\\% \\times 50 = 6"}</K> M$/an</DemoStep>
          <DemoStep num={6} rule="RAROC" ruleDetail="NIACC = Rev − Coûts − EL − CoC" accent={ACCENT}><K>{"NIACC = 18 - 6 - 0.66 - 6 = 5.34"}</K> M$</DemoStep>
          <DemoStep num={7} rule="Rendement ajusté au risque" ruleDetail="RAROC vs Hurdle" accent={ACCENT}><K>{"RAROC = 5.34 / 50 = 10.68\\%"}</K> vs Hurdle Rate = 12% → RAROC {'<'} Hurdle → à refuser ou renégocier</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Calculateur RAROC interactif</SectionTitle>
      <Grid cols={3} gap="10px">
        <Slider label="Revenus (M$)" value={revenue} min={10} max={150} step={1} onChange={setRevenue} accent={ACCENT} format={v => `${v}M$`} />
        <Slider label="Coûts opérationnels (M$)" value={costs} min={0} max={80} step={1} onChange={setCosts} accent={T.muted} format={v => `${v}M$`} />
        <Slider label="Expected Loss (M$)" value={expectedLoss} min={0} max={30} step={0.5} onChange={setExpectedLoss} accent={T.error} format={v => `${v}M$`} />
        <Slider label="Capital Économique (M$)" value={ec} min={10} max={300} step={5} onChange={setEc} accent={T.a5} format={v => `${v}M$`} />
        <Slider label="Coût du Capital (%)" value={costOfCapital} min={5} max={20} step={0.5} onChange={setCostOfCapital} accent={T.a3} format={v => `${v}%`} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
        <InfoChip label="NIACC" value={`${niacc_calc.toFixed(1)}M$`} accent={niacc_calc >= 0 ? T.success : T.error} />
        <InfoChip label="RAROC" value={`${raroc.toFixed(1)}%`} accent={raroc >= hurdle ? T.success : T.error} />
        <InfoChip label="Hurdle Rate" value={`${hurdle}%`} accent={ACCENT} />
        <InfoChip label="Décision" value={raroc >= hurdle ? '✓ ACCEPTER' : '✗ REFUSER'} accent={raroc >= hurdle ? T.success : T.error} />
      </div>

      <SectionTitle accent={ACCENT}>Comparaison de projets</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Projet', 'Revenus', 'Coûts', 'EL', 'EC', 'NIACC', 'RAROC', 'Décision'].map(h => (
                <th key={h} style={{ color: T.muted, padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.name} style={{ borderBottom: `1px solid ${T.border}33` }}>
                <td style={{ padding: '10px 12px', color: ACCENT, fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '10px 12px', color: T.text }}>{p.rev}M$</td>
                <td style={{ padding: '10px 12px', color: T.muted }}>{p.cost}M$</td>
                <td style={{ padding: '10px 12px', color: T.error }}>{p.el}M$</td>
                <td style={{ padding: '10px 12px', color: T.a5 }}>{p.ec}M$</td>
                <td style={{ padding: '10px 12px', color: p.niacc >= 0 ? T.success : T.error, fontWeight: 700 }}>{p.niacc.toFixed(1)}M$</td>
                <td style={{ padding: '10px 12px', color: p.raroc >= p.coc ? T.success : T.error, fontWeight: 800 }}>{p.raroc}%</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    background: p.raroc >= p.coc ? `${T.success}22` : `${T.error}22`,
                    color: p.raroc >= p.coc ? T.success : T.error,
                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  }}>{p.raroc >= p.coc ? 'Créateur' : 'Destructeur'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ExampleBlock title="Décision d'investissement — Pétrole vs Renouvelables" accent={ACCENT}>
        <p>Compagnie pétrolière avec <K>{"CoC = 10\\%"}</K>. Quel projet privilégier ?</p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Renouvelables}\\;(RAROC\\;23.7\\%) > \\text{Offshore}\\;(14.7\\%)"}</K> → privilégier les renouvelables malgré des revenus bruts inférieurs</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="RAROC" ruleDetail="NIACC / EC" accent={ACCENT}>Offshore : <K>{"RAROC = (80-35-8-15)/150 = 14.7\\%"}</K> {'>'} 10% → ✓</DemoStep>
          <DemoStep num={2} rule="RAROC" ruleDetail="NIACC / EC" accent={ACCENT}>Renouvelables : <K>{"RAROC = (30-10-1-4.8)/60 = 23.7\\%"}</K> {'>'} 10% → ✓✓</DemoStep>
          <DemoStep num={3} rule="Allocation de capital" ruleDetail="Comparer RAROC" accent={ACCENT}>Les renouvelables créent plus de valeur RAROC malgré des revenus bruts inférieurs</DemoStep>
          <DemoStep num={4} rule="Allocation de capital" ruleDetail="EC plus faible" accent={ACCENT}>Raison : EC plus faible (60 vs 150M$) = moins de capital mobilisé pour le risque</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <Accordion title="Exercice — Allocation de capital optimal" accent={ACCENT} badge="Avancé">
        <p style={{ color: T.text }}>Budget EC total = 250M$. Quelle allocation entre les 4 projets maximise la valeur ?</p>
        <FormulaBox accent={ACCENT}>Principe : allouer capital là où le RAROC marginal est le plus élevé</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Allocation de capital" ruleDetail="Trier par RAROC" accent={ACCENT}>Classer par RAROC décroissant : Renouvelables (23.7%) {'>'} Gaz Pipeline (21.25%) {'>'} Offshore (14.7%) {'>'} Trading (10.8%)</DemoStep>
          <DemoStep num={2} rule="Allocation de capital" ruleDetail="Priorité RAROC" accent={ACCENT}>Allouer en priorité aux projets à RAROC le plus élevé</DemoStep>
          <DemoStep num={3} rule="Allocation de capital" ruleDetail="Budget contraint" accent={ACCENT}>Renouvelables (60M$) + Gaz (80M$) + Offshore (110M$ partiel) = 250M$</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice — Calculer le RAROC et décider" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Un desk de trading pétrole génère 25M$ de revenus bruts, 10M$ de coûts. <K>{"PD = 2\\%"}</K>, <K>{"LGD = 60\\%"}</K>, <K>{"EAD = 100"}</K> M$. Capital éco = 80M$. Coût du capital = 11%. Faut-il accepter ce projet ?</p>
        <FormulaBox accent={ACCENT}><K display>{"RAROC = 6.25\\% < 11\\%"}</K> → Projet REFUSÉ — détruit de la valeur pour les actionnaires</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="RAROC" ruleDetail="EL = PD × LGD × EAD" accent={ACCENT}><K>{"EL = 0.02 \\times 0.60 \\times 100 = 1.2"}</K> M$</DemoStep>
          <DemoStep num={2} rule="RAROC" ruleDetail="CoC × EC" accent={ACCENT}>Coût du capital = <K>{"11\\% \\times 80 = 8.8"}</K> M$</DemoStep>
          <DemoStep num={3} rule="RAROC" ruleDetail="NIACC = Rev − Coûts − EL − CoC" accent={ACCENT}><K>{"NIACC = 25 - 10 - 1.2 - 8.8 = 5.0"}</K> M$</DemoStep>
          <DemoStep num={4} rule="Rendement ajusté au risque" ruleDetail="RAROC vs Hurdle" accent={ACCENT}><K>{"RAROC = 5.0 / 80 = 6.25\\%"}</K> vs Hurdle 11%. Pour améliorer : réduire EC à 40M$ → RAROC = 5.0/40 = 12.5% {'>'} 11% → acceptable.</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice — Optimisation RAROC multi-activité" accent={ACCENT} badge="Avancé">
        <p style={{ color: T.text }}>Une compagnie énergétique a un budget de capital économique de 200M$. Elle doit choisir entre 5 activités. Optimisez l'allocation.</p>
        <div style={{ overflowX: 'auto', margin: '10px 0' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Activité', 'EC requis (M$)', 'RAROC', 'Décision'].map(h => (
                  <th key={h} style={{ color: T.muted, padding: '6px 10px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Gas Trading', '60M$', '22%', '✓ Priorité 1'],
                ['Power Marketing', '40M$', '18%', '✓ Priorité 2'],
                ['Oil E&P', '80M$', '15%', '✓ Priorité 3 (partiel 20M$)'],
                ['Coal Trading', '50M$', '9%', '✗ Refus (sous hurdle 11%)'],
                ['LNG Structuring', '30M$', '13%', '✓ Priorité 4 (si budget restant)'],
              ].map(([act, ec, raroc, dec]) => (
                <tr key={act} style={{ borderBottom: `1px solid ${T.border}33` }}>
                  <td style={{ padding: '8px 10px', color: ACCENT, fontWeight: 600 }}>{act}</td>
                  <td style={{ padding: '8px 10px', color: T.text }}>{ec}</td>
                  <td style={{ padding: '8px 10px', color: parseFloat(raroc) >= 11 ? T.success : T.error, fontWeight: 700 }}>{raroc}</td>
                  <td style={{ padding: '8px 10px', color: T.muted }}>{dec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <FormulaBox accent={ACCENT}>Capital alloué optimal = 200M$ → Valeur NIACC maximisée en excluant les activités sous-performantes</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="RAROC multi-activité" ruleDetail="Trier par RAROC" accent={ACCENT}>Trier par RAROC : Gas (22%) {'>'} Power (18%) {'>'} LNG (13%) {'>'} E&P (15%) {'>'} Coal (9%)</DemoStep>
          <DemoStep num={2} rule="Allocation de capital" ruleDetail="Budget contraint" accent={ACCENT}>Allouer : Gas 60M$ + Power 40M$ + E&P 80M$ + LNG 20M$ = 200M$ (budget épuisé)</DemoStep>
          <DemoStep num={3} rule="RAROC multi-activité" ruleDetail="Refus si RAROC < hurdle" accent={ACCENT}>Coal est refusé (RAROC 9% {'<'} hurdle 11%) même si EC disponible</DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

export function PFETab() {
  const [sigma, setSigma] = useState(0.25)
  const [r, setR] = useState(0.05)
  const [notional, setNotional] = useState(100)
  const [conf, setConf] = useState(0.97)
  const [key, setKey] = useState(0)

  const nSteps = 20

  const paths = useMemo(() => {
    const n = 5
    const result = []
    for (let p = 0; p < n; p++) {
      let S = notional
      const pts = [{ t: 0, S: notional }]
      for (let i = 1; i <= nSteps; i++) {
        const dt = 1 / nSteps
        S *= Math.exp((r - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * gaussRand())
        pts.push({ t: +(i / nSteps).toFixed(2), S: +Math.max(S - notional, 0).toFixed(2) })
      }
      result.push(pts)
    }
    return result
  }, [sigma, r, notional, key])

  // PFE profile: at each time step, simulate many paths and take quantile
  const pfeData = useMemo(() => {
    const simN = 200
    const zAlpha = conf === 0.99 ? 2.326 : conf === 0.97 ? 1.88 : 1.645
    const pts = []
    for (let i = 0; i <= nSteps; i++) {
      const t = i / nSteps
      // Analytical approximation for forward ATM call exposure: E[max(S_T - S_0, 0)]
      const sqrtT = Math.sqrt(t + 0.001)
      const d1 = (r + 0.5 * sigma * sigma) * t / (sigma * sqrtT)
      const d2 = d1 - sigma * sqrtT
      const epe = notional * (normCDF(d1) * Math.exp(r * t) - normCDF(d2))
      const pfe = notional * normCDF(zAlpha * sigma * sqrtT + (r - 0.5 * sigma * sigma) * t)
        - notional
      pts.push({
        t: +t.toFixed(2),
        EPE: +Math.max(epe, 0).toFixed(2),
        PFE: +Math.max(pfe, 0).toFixed(2),
      })
    }
    return pts
  }, [sigma, r, notional, conf])

  const COLORS = [ACCENT, T.a4, T.a5, T.a3, T.a2]
  const maxPFE = Math.max(...pfeData.map(d => d.PFE))

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Quand vous signez un <strong style={{ color: ACCENT }}>swap de commodités de 5 ans</strong> avec une contrepartie, vous ne savez pas combien elle vous devra dans 3 ans — cela dépend entièrement de l'évolution des prix de marché futurs.
        Si le prix du pétrole monte fortement, votre contrepartie (qui vous paie le prix fixe et reçoit le prix flottant) vous devra beaucoup. Si elle fait faillite à ce moment-là, vous perdez cette valeur.
        La <strong style={{ color: ACCENT }}>PFE (Potential Future Exposure)</strong> quantifie ce risque de contrepartie futur avec une certaine probabilité de confiance : "À 97% de probabilité, l'exposition ne dépassera pas X M$ à l'instant t."
        C'est l'outil central de la gestion du risque de contrepartie (CCR — Counterparty Credit Risk), utilisé pour fixer des limites de crédit, calculer le CVA, et déterminer le capital réglementaire (Bâle III, SA-CCR).
      </div>

      <IntuitionBlock emoji="📡" title="PFE : combien pourrait me devoir ma contrepartie demain ?" accent={ACCENT}>
        Vous avez un swap de taux avec une banque. Aujourd'hui l'exposition est nulle (valeur zéro à l'initiation).
        Mais si les taux bougent, la valeur peut devenir positive (la banque vous doit de l'argent).
        Si elle fait faillite à ce moment, vous perdez cette valeur.
        Le <strong>Potential Future Exposure (PFE)</strong> quantifie le pire cas d'exposition future
        à un niveau de confiance donné — c'est le profil de risque de contrepartie dans le temps.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="PFE(t, α) — Exposition potentielle future">
        <K display>{"PFE(t, \\alpha) = Q_\\alpha[\\max(V(t), 0)]"}</K>
        <K display>{"EPE(t) = E[\\max(V(t), 0)]"}</K>
        <div style={{ color: T.muted, fontSize: 12 }}>(Expected Positive Exposure)</div>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['PFE(t)', 'Worst case exposure au temps t au niveau α'],
        ['EPE(t)', 'Exposition positive espérée au temps t'],
        ['V(t)', 'Valeur mark-to-market de la transaction au temps t'],
        ['EEPE', 'Effective Expected Positive Exposure (moyenne de EPE)'],
        ['CCR', 'Counterparty Credit Risk = risque lié à PFE'],
      ]} />

      <SectionTitle accent={ACCENT}>Les trois métriques d'exposition — De MtM à PFE</SectionTitle>
      <Grid cols={3} gap="10px" style={{ marginBottom: 14 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a4}33` }}>
          <div style={{ color: T.a4, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>MtM — Mark-to-Market actuel</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Valeur actuelle du dérivé = ce qu'on perdrait si la contrepartie faisait défaut <em>aujourd'hui</em>.<br /><br />
            <K>{"MtM = \\max(V(t_{now}), 0)"}</K><br /><br />
            Connue avec certitude, mais ne capture pas le risque futur. Un swap à valeur zéro aujourd'hui peut valoir +20M$ dans 2 ans.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>EPE — Expected Positive Exposure</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Moyenne de l'exposition positive future à chaque instant :<br />
            <K>{"EPE(t) = E[\\max(V(t), 0)]"}</K><br /><br />
            C'est la base du calcul CVA. L'EEPE (Effective EPE) = moyenne de l'EPE sur la durée de vie = ce qu'utilise Bâle pour le capital réglementaire CCR.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.error}33` }}>
          <div style={{ color: T.error, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>PFE — Potential Future Exposure</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Worst case d'exposition à un niveau de confiance α :<br />
            <K>{"PFE(t, \\alpha) = Q_\\alpha[\\max(V(t), 0)]"}</K><br /><br />
            Utilisé pour les limites de crédit de contrepartie. "Avec 97% de prob., je ne perdrai pas plus de PFE max si ma contrepartie fait défaut à n'importe quel moment."
          </div>
        </div>
      </Grid>

      <SectionTitle accent={ACCENT}>Profil d'exposition — Swap de taux vs Swap de commodités</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        La forme du profil PFE dépend de la nature du dérivé. Deux exemples importants :
      </div>
      <Grid cols={2} gap="10px" style={{ marginBottom: 14 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a4}33` }}>
          <div style={{ color: T.a4, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Swap de taux d'intérêt</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Profil "<strong>en bosse</strong>" caractéristique :<br />
            • t=0 : exposition nulle (swap ATM à l'initiation)<br />
            • Phase montante : la valeur peut diverger à mesure que les taux bougent<br />
            • Pic : typiquement à 30-40% de la maturité totale<br />
            • Phase descendante : les paiements réduisent le notionnel résiduel et l'exposition<br />
            • t=T : exposition → 0 (dernier échange de cash-flows)<br /><br />
            La volatilité des taux (<K>{"\\sigma \\approx 1\\text{-}2\\%"}</K>) étant faible, la PFE reste modérée (3-8% du notionnel).
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Swap de commodités (pétrole, gaz)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Profil similaire mais amplifié par la volatilité élevée :<br />
            • Même structure "en bosse" que les swaps de taux<br />
            • Mais <K>{"\\sigma_{\\text{pétrole}} \\approx 30\\text{-}40\\%"}</K>, <K>{"\\sigma_{\\text{gaz}} \\approx 50\\text{-}80\\%"}</K> → PFE beaucoup plus grande<br />
            • PFE max ≈ 20-40% du notionnel pour un swap pétrole<br />
            • Réglementation : même traitement CCR mais capital plus élevé<br /><br />
            C'est pourquoi les banques appliquent des limites de contrepartie strictes sur les dérivés énergie.
          </div>
        </div>
      </Grid>

      <SectionTitle accent={ACCENT}>Netting et Collatéral — Deux leviers pour réduire la PFE</SectionTitle>
      <Grid cols={2} gap="10px" style={{ marginBottom: 14 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a3}33` }}>
          <div style={{ color: T.a3, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Netting (ISDA Master Agreement)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Si deux transactions s'annulent partiellement avec la même contrepartie, l'exposition nette est inférieure à la somme des expositions brutes.<br /><br />
            <strong>Sans netting :</strong> Trade A = +10M$, Trade B = -7M$ → Exposition brute = 10M$<br />
            <strong>Avec netting :</strong> Exposition nette = <K>{"\\max(10-7, 0) = 3"}</K> M$ (-70%)<br /><br />
            La convention ISDA Master Agreement permet ce netting légal en cas de défaut. Sans ISDA, la faillite de la contrepartie traite chaque trade séparément.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a5}33` }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Collatéral — CSA (Credit Support Annex)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Accord de collatéralisation annexé à l'ISDA : la contrepartie dont la position est perdante poste du cash ou des titres pour couvrir l'exposition MtM positive de l'autre.<br /><br />
            • <strong>VM (Variation Margin)</strong> : margin quotidienne couvrant le MtM courant<br />
            • <strong>IM (Initial Margin)</strong> : buffer pour couvrir le risque de variation future (PFE)<br /><br />
            Avec CSA + VM quotidien : la PFE se réduit drastiquement au risque de variation sur 1-5 jours (le délai de "close-out") plutôt que sur toute la durée de vie.
          </div>
        </div>
      </Grid>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Point clé :</strong> Le netting et le collatéral sont les deux outils les plus puissants pour réduire la PFE et le CVA. Post-crise 2008, les réformes EMIR (Europe) et Dodd-Frank (US) ont rendu obligatoire la compensation centrale (CCP) pour de nombreux dérivés OTC standardisés, réduisant considérablement le risque de contrepartie systémique.
      </div>

      <Grid cols={3} gap="10px">
        <Slider label="Volatilité σ" value={sigma} min={0.05} max={0.6} step={0.01} onChange={setSigma} accent={ACCENT} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="Drift r" value={r} min={0} max={0.15} step={0.005} onChange={setR} accent={T.a4} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="Notionnel (M$)" value={notional} min={10} max={500} step={10} onChange={setNotional} accent={T.a5} format={v => `${v}M$`} />
        <div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 6 }}>Niveau de confiance PFE</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0.95, 0.97, 0.99].map(c => (
              <button key={c} onClick={() => setConf(c)} style={{
                background: conf === c ? `${ACCENT}22` : T.panel2,
                border: `1px solid ${conf === c ? ACCENT : T.border}`,
                color: conf === c ? ACCENT : T.muted,
                borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: conf === c ? 700 : 400,
              }}>{(c * 100).toFixed(0)}%</button>
            ))}
          </div>
        </div>
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelles trajectoires</button>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="PFE max" value={`${maxPFE.toFixed(1)}M$`} accent={ACCENT} />
        <InfoChip label="EPE max" value={`${Math.max(...pfeData.map(d => d.EPE)).toFixed(1)}M$`} accent={T.a4} />
        <InfoChip label="Notionnel" value={`${notional}M$`} accent={T.muted} />
      </div>

      <ChartWrapper title={`Profil PFE & EPE (α=${(conf * 100).toFixed(0)}%, σ=${(sigma * 100).toFixed(0)}%)`} accent={ACCENT} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={pfeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Temps (années)', fill: T.muted, fontSize: 10 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 12 }} />
            <Area type="monotone" dataKey="PFE" stroke={ACCENT} fill={`${ACCENT}22`} strokeWidth={2} name={`PFE ${(conf * 100).toFixed(0)}%`} />
            <Area type="monotone" dataKey="EPE" stroke={T.a4} fill={`${T.a4}15`} strokeWidth={2} name="EPE" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Structure du profil PFE</SectionTitle>
      <div style={{ background: T.panel2, borderRadius: 8, padding: 16, color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
        <div>• <strong style={{ color: ACCENT }}>Début (t≈0)</strong> : exposition nulle (transaction à valeur zéro)</div>
        <div>• <strong style={{ color: ACCENT }}>Phase croissante</strong> : la valeur peut diverger, PFE monte</div>
        <div>• <strong style={{ color: ACCENT }}>Pic</strong> : maximum d'exposition — typiquement au milieu de vie du swap</div>
        <div>• <strong style={{ color: ACCENT }}>Phase décroissante</strong> : les cashflows réduisent le notionnel résiduel, PFE redescend</div>
        <div>• <strong style={{ color: ACCENT }}>Maturité</strong> : exposition retombe à zéro (dernier échange de cashflows)</div>
      </div>

      <ExampleBlock title="Swap de taux 5 ans — Profil d'exposition" accent={ACCENT}>
        <p>Notionnel = 200M$, durée = 5 ans, <K>{"\\sigma_{taux} = 1\\%"}</K> (100bps), couverture 97%</p>
        <FormulaBox accent={ACCENT}><K display>{"PFE_{\\max,97\\%} \\approx 12\\text{ M\\$}"}</K> → transaction acceptée si limite contrepartie <K>{"\\geq 15"}</K> M$</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="PFE" ruleDetail="Profil en bosse" accent={ACCENT}>PFE pic ≈ à ~2-3 ans (milieu de vie du swap)</DemoStep>
          <DemoStep num={2} rule="PFE" ruleDetail="Quantile × Notionnel" accent={ACCENT}><K>{"PFE_{97\\%} \\approx 200 \\times N(1.88 \\times 0.01 \\times \\sqrt{2.5}) \\approx 12"}</K> M$</DemoStep>
          <DemoStep num={3} rule="Potential Future Exposure" ruleDetail="Limite de crédit" accent={ACCENT}>Cette exposition conduit à une limite de crédit de contrepartie</DemoStep>
          <DemoStep num={4} rule="PFE" ruleDetail="Décision" accent={ACCENT}>Si limite = 15M$ → la transaction est acceptée sans netting agreement</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice — PFE d'un forward sur pétrole" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Forward pétrole 1 an : notionnel = 100M$ (1M bbl à 100$/bbl), <K>{"\\sigma = 35\\%"}</K>, <K>{"r = 5\\%"}</K>, PFE à 95%.</p>
        <FormulaBox accent={ACCENT}><K display>{"PFE_{95\\%} \\approx 75.7\\text{ M\\$}"}</K> sur 100M$ de notionnel = 75.7% du notionnel (volatilité élevée !)</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="PFE" ruleDetail="Exposition forward" accent={ACCENT}>Pour un forward, l'exposition positive est <K>{"\\max(S_T - K, 0)"}</K> — similaire à un call européen</DemoStep>
          <DemoStep num={2} rule="Potential Future Exposure" ruleDetail="Quantile log-normal" accent={ACCENT}>PFE 95% : <K>{"S_T = 100 \\times e^{(0.05 - 0.5 \\times 0.35^2) + 1.645 \\times 0.35}"}</K></DemoStep>
          <DemoStep num={3} rule="Application numérique" ruleDetail="calcul" accent={ACCENT}><K>{"= 100 \\times e^{0.564} = 100 \\times 1.757 = 175.7"}</K> $/bbl</DemoStep>
          <DemoStep num={4} rule="PFE" ruleDetail="Exposition en $" accent={ACCENT}>Exposition = <K>{"\\max(175.7 - 100, 0) \\times 1M = 75.7"}</K> M$. La banque doit réserver cette capacité de crédit. Si limite = 50M$, trade non autorisé sans netting ou collatéral.</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice — Impact du netting sur l'exposition" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Même contrepartie, 3 trades : Trade A (<K>{"MtM = +15"}</K> M$), Trade B (<K>{"MtM = -8"}</K> M$), Trade C (<K>{"MtM = +4"}</K> M$). Comparez l'exposition brute vs nette.</p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Netting ratio} = \\frac{\\text{Exposition nette}}{\\text{Exposition brute}} = \\frac{11}{19} = 58\\%"}</K> (plus bas = meilleure efficacité)</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Netting" ruleDetail="Exposition brute" accent={ACCENT}>Exposition brute = <K>{"\\max(15,0) + \\max(-8,0) + \\max(4,0) = 19"}</K> M$</DemoStep>
          <DemoStep num={2} rule="Compensation bilatérale" ruleDetail="ISDA netting" accent={ACCENT}>Exposition nette = <K>{"\\max(15 - 8 + 4, 0) = 11"}</K> M$</DemoStep>
          <DemoStep num={3} rule="Netting" ruleDetail="Ratio de réduction" accent={ACCENT}>Réduction = <K>{"(19 - 11)/19 = 42\\%"}</K></DemoStep>
          <DemoStep num={4} rule="Netting" ruleDetail="Cas extrême" accent={ACCENT}>Si Trade B = -20M$ : exposition nette = <K>{"\\max(15-20+4,0) = 0"}</K> M$. L'ISDA Master Agreement est essentiel — sans lui, chaque trade est traité isolément en cas de défaut, multipliant l'exposition par 3-4×.</DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

export function CVATab() {
  const [pd_annual, setPD] = useState(0.02)  // Prob défaut annuelle
  const [lgd, setLgd] = useState(0.6)        // Loss Given Default
  const [r, setR] = useState(0.05)
  const [sigma, setSigma] = useState(0.25)
  const [notional, setNotional] = useState(100)

  const nSteps = 10
  const dt = 1 / nSteps

  const cvaData = useMemo(() => {
    const pts = []
    let cva = 0
    for (let i = 1; i <= nSteps; i++) {
      const t = i * dt
      const tPrev = (i - 1) * dt
      // EE(t) approximation
      const sqrtT = Math.sqrt(t)
      const d1 = (r + 0.5 * sigma * sigma) * t / (sigma * sqrtT)
      const d2 = d1 - sigma * sqrtT
      const ee = notional * (normCDF(d1) * Math.exp(r * t) - normCDF(d2))
      // DF(t)
      const df = Math.exp(-r * t)
      // Marginal PD for period [t-1, t]
      const pdMarg = pd_annual * dt
      const contribution = pd_annual * dt * lgd * Math.max(ee, 0) * df
      cva += contribution
      pts.push({
        t: +t.toFixed(1),
        EE: +Math.max(ee, 0).toFixed(2),
        DF: +df.toFixed(3),
        contribution: +contribution.toFixed(3),
        cvaCumul: +cva.toFixed(3),
      })
    }
    return pts
  }, [pd_annual, lgd, r, sigma, notional])

  const totalCVA = cvaData.length > 0 ? cvaData[cvaData.length - 1].cvaCumul : 0

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Le <strong style={{ color: ACCENT }}>CVA (Credit Valuation Adjustment)</strong> est l'ajustement du prix d'un dérivé pour tenir compte du risque de défaut de la contrepartie.
        Avant la crise de 2008, les dérivés OTC étaient généralement pricés sans tenir compte du risque de contrepartie (hypothèse implicite : "les contreparties ne font jamais défaut").
        La faillite de <strong>Lehman Brothers</strong> en septembre 2008 a brisé cette illusion : des centaines de milliards de pertes sur dérivés OTC ont résulté non pas du défaut lui-même, mais de la <em>variation du CVA</em> (mark-to-market des positions) lorsque les spreads de crédit des contreparties se sont envolés.
        Depuis Bâle III, le CVA est <strong>obligatoire dans les états financiers des banques</strong>. Il est aussi la source principale de pertes liées au risque de contrepartie (environ 2/3 des pertes CCR pendant la crise venaient du CVA, pas des défauts réels).
      </div>

      <IntuitionBlock emoji="🏦" title="CVA : le prix du risque de contrepartie" accent={ACCENT}>
        Vous achetez un call d'énergie à une banque. La banque vous promet de payer le payoff.
        Mais si la banque fait faillite avant maturité, vous ne recevez rien (ou peu).
        Le <strong>Credit Valuation Adjustment (CVA)</strong> est la <em>décote de valeur</em>
        appliquée à une transaction pour tenir compte du risque de défaut de la contrepartie.
        En pratique : <K>{"Prix_{\\text{réel}} = Prix_{\\text{risque neutre}} - CVA"}</K>.
        Le CVA est devenu une contrainte réglementaire majeure depuis la crise de 2008.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="CVA unilatéral — formule discrète">
        <K display>{"CVA = \\sum_i PD(t_{i-1}, t_i) \\times LGD \\times EE(t_i) \\times DF(t_i)"}</K>
        <K display>{"CVA \\approx LGD \\times \\int_0^T PD(0,t) \\times EE(t) \\times DF(t)\\,dt"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['PD(t)', 'Probabilité de défaut de la contrepartie sur [t-1, t]'],
        ['LGD', 'Loss Given Default = 1 - Recovery Rate (typiquement 40-60%)'],
        ['EE(t)', 'Expected Exposure au temps t = E[max(V(t), 0)]'],
        ['DF(t)', 'Facteur d\'actualisation = e^(-rt)'],
        ['DVA', 'Debt Valuation Adjustment : CVA vu du côté de la contrepartie'],
        ['BCVA', 'CVA bilatéral = CVA - DVA'],
      ]} />

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie de la formule CVA — terme par terme</div>
        <Step num={1} accent={ACCENT}><strong><K>{"B(0,t) = e^{-rt}"}</K></strong> — facteur d'actualisation : valeur actuelle de 1€ reçu au temps t. Une perte dans 5 ans vaut moins qu'une perte aujourd'hui. Ce terme pénalise les pertes lointaines et rend le CVA sensible au niveau des taux d'intérêt.</Step>
        <Step num={2} accent={ACCENT}><strong><K>{"EE(t) = E[\\max(V(t), 0)]"}</K></strong> — exposition espérée positive : on ne perd que si on est créancier net (<K>{"V > 0"}</K>). Si la contrepartie nous doit de l'argent et fait défaut, on perd <K>{"EE(t)"}</K>. Si on lui doit de l'argent (<K>{"V < 0"}</K>), la perte est nulle — d'où le <K>{"\\max(V, 0)"}</K>.</Step>
        <Step num={3} accent={ACCENT}><strong><K>{"PD(t-1, t)"}</K></strong> — probabilité de défaut marginale entre t-1 et t, extraite des spreads CDS ou des ratings. Pour une contrepartie Investment Grade (BBB) : <K>{"PD \\approx 0.15\\text{-}0.25\\%"}</K>/an. Pour un High Yield (BB) : <K>{"PD \\approx 1\\text{-}3\\%"}</K>/an.</Step>
        <Step num={4} accent={ACCENT}><strong><K>{"LGD = 1 - \\text{Recovery Rate}"}</K></strong> — Loss Given Default : fraction de l'exposition perdue en cas de défaut. Typiquement 60% pour les banques (Recovery = 40%). Pour les dérivés non collatéralisés, LGD peut atteindre 70-80%.</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : <K>{"CVA \\approx LGD \\times EPE \\times \\text{spread} / \\text{DiscountFactor}"}</K> (approximation courante). L'EPE (Expected Positive Exposure) est la moyenne temporelle des EE(t). Cette formule montre que le CVA est un produit de crédit sur la durée de vie du dérivé — plus le spread CDS est élevé, plus le CVA est important.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>La formule CVA décortiquée — Terme par terme</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        <K display>{"CVA = \\sum_t B(0,t) \\times EE(t) \\times PD(t-1, t) \\times LGD"}</K>
      </div>
      <Grid cols={2} gap="10px" style={{ marginBottom: 14 }}>
        {[
          { term: 'B(0,t) = e^(-rt)', label: 'Facteur d\'actualisation', color: T.a4, expl: 'Actualise les pertes futures vers aujourd\'hui. Une perte de 1M$ dans 5 ans vaut moins que 1M$ aujourd\'hui. Ce terme diminue avec t → les pertes lointaines contribuent moins au CVA.' },
          { term: 'EE(t) = E[max(V(t), 0)]', label: 'Expected Exposure', color: ACCENT, expl: 'L\'espérance de l\'exposition positive au temps t. C\'est la perte moyenne si la contrepartie fait défaut exactement en t. Dépend de la volatilité du sous-jacent et du type de produit (swap, option, forward).' },
          { term: 'PD(t-1, t)', label: 'Probabilité de défaut marginale', color: T.error, expl: 'La probabilité que la contrepartie fasse défaut pendant la période [t-1, t], sachant qu\'elle a survécu jusqu\'à t-1. Extraite des spreads CDS ou des ratings. Pour une contrepartie BBB : PD ≈ 0.15-0.25%/an.' },
          { term: 'LGD = 1 - Recovery Rate', label: 'Loss Given Default', color: T.a5, expl: 'La fraction de l\'exposition perdue en cas de défaut. Typiquement 40-60% pour les contreparties corporates (en moyenne, les créanciers récupèrent 40-60%). Pour les dérivés non collatéralisés : LGD ≈ 60%.' },
        ].map(t => (
          <div key={t.term} style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${t.color}33` }}>
            <div style={{ fontFamily: 'monospace', color: t.color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t.term}</div>
            <div style={{ color: T.text, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{t.label}</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>{t.expl}</div>
          </div>
        ))}
      </Grid>

      <SectionTitle accent={ACCENT}>Les xVA — Au-delà du CVA</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Le CVA est le premier d'une famille d'ajustements (les "xVA") qui cherchent à refléter toutes les frictions réelles associées à un dérivé OTC. Ces ajustements sont parfois controversés car ils semblent violer le no-arbitrage, mais ils reflètent des coûts réels pour les banques.
      </div>
      <Grid cols={2} gap="10px" style={{ marginBottom: 14 }}>
        {[
          {
            acronym: 'DVA', name: 'Debit Valuation Adjustment', color: T.a3,
            text: 'Miroir du CVA — ajustement pour le propre risque de crédit de la banque. Si la banque se dégrade, ses engagements valent moins → gain comptable. Très controversé : "faut-il profiter de sa propre dégradation ?" IFRS 13 l\'impose, mais les superviseurs le neutralisent pour le capital réglementaire.',
          },
          {
            acronym: 'FVA', name: 'Funding Valuation Adjustment', color: T.a5,
            text: 'Coût de financement du collatéral non-posté. Si une banque doit hedger une position mais ne reçoit pas de collatéral de la contrepartie, elle doit financer ce gap → FVA. Très débattu académiquement (Hull & White arguent qu\'il viole le no-arbitrage), mais très réel dans la pratique.',
          },
          {
            acronym: 'KVA', name: 'Capital Valuation Adjustment', color: T.a6,
            text: 'Coût du capital réglementaire immobilisé pour le dérivé pendant toute sa durée de vie. Si un swap monopolise 10M$ de capital réglementaire pendant 5 ans, le coût de ce capital (au hurdle rate) doit être refacturé dans le prix du trade.',
          },
          {
            acronym: 'MVA', name: 'Margin Valuation Adjustment', color: ACCENT,
            text: 'Coût lié au financement de l\'Initial Margin (IM) obligatoire pour les dérivés centralement compensés (post-EMIR). L\'IM est du collatéral "frozen" — son coût de financement s\'ajoute au prix du dérivé.',
          },
        ].map(xva => (
          <div key={xva.acronym} style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${xva.color}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ background: `${xva.color}22`, color: xva.color, padding: '2px 10px', borderRadius: 20, fontWeight: 800, fontSize: 13 }}>{xva.acronym}</span>
              <span style={{ color: xva.color, fontWeight: 600, fontSize: 12 }}>{xva.name}</span>
            </div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>{xva.text}</div>
          </div>
        ))}
      </Grid>

      <IntuitionBlock emoji="🛡️" title="Comment réduire le CVA en pratique ?" accent={ACCENT}>
        Le CVA se réduit en diminuant l'un de ses trois facteurs : EE, PD, ou LGD.
        <br />• <strong>Netting (ISDA)</strong> : réduit l'EE en permettant la compensation des positions — impact souvent de -40 à -70% sur l'EE
        <br />• <strong>Collatéral (CSA)</strong> : réduit l'EE au risque de variation sur quelques jours seulement — impact majeur
        <br />• <strong>CDS de protection</strong> : acheter un CDS sur la contrepartie "hedged" le risque PD — réduit le CVA net mais crée un coût de basis (CDS vs défaut réel)
        <br />• <strong>Choix de contreparties bien notées</strong> : PD plus faible → CVA plus faible → vendre à des contreparties AA vs BB divise le CVA par 5-10
        <br />• <strong>Clearing central (CCP)</strong> : <K>{"LGD \\approx 0"}</K> (la CCP garantit le paiement via le Default Fund) → CVA quasi nul pour les dérivés compensés
      </IntuitionBlock>

      <Grid cols={2} gap="10px">
        <Slider label="PD annuelle (%)" value={pd_annual} min={0.001} max={0.2} step={0.001} onChange={setPD} accent={T.error} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="LGD (%)" value={lgd} min={0.1} max={0.9} step={0.01} onChange={setLgd} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="Taux sans risque r" value={r} min={0.01} max={0.1} step={0.005} onChange={setR} accent={T.a4} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="Volatilité σ" value={sigma} min={0.05} max={0.6} step={0.01} onChange={setSigma} accent={ACCENT} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="Notionnel (M$)" value={notional} min={10} max={500} step={10} onChange={setNotional} accent={T.muted} format={v => `${v}M$`} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
        <InfoChip label="CVA Total" value={`${totalCVA.toFixed(2)}M$`} accent={T.error} />
        <InfoChip label="CVA / Notionnel" value={`${((totalCVA / notional) * 100).toFixed(2)}%`} accent={ACCENT} />
        <InfoChip label="Recovery Rate" value={`${((1 - lgd) * 100).toFixed(0)}%`} accent={T.a4} />
        <InfoChip label="PD 5 ans" value={`${((1 - Math.pow(1 - pd_annual, 5)) * 100).toFixed(1)}%`} accent={T.a5} />
      </div>

      <ChartWrapper title="CVA : profil EE et contributions par période" accent={ACCENT} height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cvaData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Temps (années)', fill: T.muted, fontSize: 10 }} />
            <YAxis yAxisId="left" stroke={ACCENT} tick={{ fill: ACCENT, fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" stroke={T.error} tick={{ fill: T.error, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="EE" stroke={ACCENT} strokeWidth={2.5} dot={false} name="EE(t) (M$)" />
            <Line yAxisId="right" type="monotone" dataKey="cvaCumul" stroke={T.error} strokeWidth={2} dot={false} strokeDasharray="5 3" name="CVA cumulatif (M$)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ExampleBlock title="CVA sur un swap énergie — Contrepartie BBB" accent={ACCENT}>
        <p>Swap pétrole 3 ans, <K>{"EE_{moy} = 8"}</K> M$, <K>{"PD_{ann} = 1.5\\%"}</K> (rating BBB), <K>{"LGD = 60\\%"}</K>, <K>{"r = 4\\%"}</K></p>
        <FormulaBox accent={ACCENT}><K display>{"CVA \\approx 0.200\\text{ M\\$}"}</K> soit 0.2% du notionnel. Si downgrade BB (<K>{"PD = 5\\%"}</K>) → <K>{"CVA \\approx 0.66\\text{ M\\$}"}</K> (+230%)</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="CVA" ruleDetail="LGD × EE × ∫PD×DF" accent={ACCENT}><K>{"CVA \\approx LGD \\times EE_{moy} \\times \\int_0^3 PD \\times e^{-rt}\\,dt"}</K></DemoStep>
          <DemoStep num={2} rule="Credit Valuation Adjustment" ruleDetail="Intégrale actualisée" accent={ACCENT}><K>{"\\approx 0.60 \\times 8 \\times 0.015 \\times \\frac{1-e^{-0.04 \\times 3}}{0.04}"}</K></DemoStep>
          <DemoStep num={3} rule="Application numérique" ruleDetail="calcul" accent={ACCENT}><K>{"= 0.60 \\times 8 \\times 0.015 \\times 2.78 = 0.200"}</K> M$</DemoStep>
          <DemoStep num={4} rule="CVA" ruleDetail="% du notionnel" accent={ACCENT}>Soit 0.2% du notionnel → ajustement de prix sur le trade</DemoStep>
          <DemoStep num={5} rule="Probabilité de défaut" ruleDetail="Sensibilité PD" accent={ACCENT}>Si PD monte à 5% (downgrade BB) → CVA ≈ 0.66M$ (+230%)</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice 1 — Calcul CVA simplifié" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Options énergie 1 an, <K>{"EE = 5"}</K> M$, <K>{"PD = 2\\%"}</K>, <K>{"LGD = 60\\%"}</K>, <K>{"r = 5\\%"}</K></p>
        <FormulaBox accent={ACCENT}><K display>{"CVA = 57{,}100\\$"}</K> soit 1.14% de l'EE</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="CVA" ruleDetail="PD × LGD × EE × DF" accent={ACCENT}><K>{"CVA = 0.02 \\times 0.60 \\times 5 \\times e^{-0.05}"}</K></DemoStep>
          <DemoStep num={2} rule="Application numérique" ruleDetail="calcul" accent={ACCENT}><K>{"= 0.02 \\times 0.60 \\times 5 \\times 0.951 = 0.0571"}</K> M$</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 2 — Impact du netting" accent={ACCENT} badge="Avancé">
        <p style={{ color: T.text }}>2 trades avec même contrepartie : Trade A valeur +10M$, Trade B valeur -7M$. CVA sans vs avec netting ?</p>
        <FormulaBox accent={ACCENT}>Le netting agreement réduit dramatiquement le CVA → intérêt de l'ISDA Master Agreement</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Netting" ruleDetail="Exposition brute" accent={ACCENT}>Sans netting : <K>{"EE = \\max(10,0) + \\max(-7,0) = 10"}</K> M$</DemoStep>
          <DemoStep num={2} rule="Compensation bilatérale" ruleDetail="ISDA netting" accent={ACCENT}>Avec netting : <K>{"EE = \\max(10-7, 0) = 3"}</K> M$</DemoStep>
          <DemoStep num={3} rule="Netting" ruleDetail="Réduction CVA" accent={ACCENT}>Réduction CVA = <K>{"(10-3)/10 = 70\\%"}</K></DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 3 — Calculer le CVA d'un swap simple" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Swap pétrole 2 ans, notionnel 50M$, <K>{"EE_{moy} = 6"}</K> M$, contrepartie rating BBB (<K>{"PD = 1.8\\%"}</K>/an), <K>{"LGD = 60\\%"}</K>, <K>{"r = 4\\%"}</K>. Calculez le CVA total.</p>
        <FormulaBox accent={ACCENT}><K display>{"CVA = 0.245\\%\\ \\text{du notionnel}"}</K> → ajustement du prix de vente du swap de 12.5 bps/an</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="CVA" ruleDetail="Σ PD × LGD × EE × DF" accent={ACCENT}>CVA discret sur 2 ans (annuel) : <K>{"CVA = \\sum PD \\times LGD \\times EE \\times DF"}</K></DemoStep>
          <DemoStep num={2} rule="Credit Valuation Adjustment" ruleDetail="Période 1" accent={ACCENT}>t=1 : <K>{"0.018 \\times 0.60 \\times 6 \\times e^{-0.04} = 0.0625"}</K> M$</DemoStep>
          <DemoStep num={3} rule="Credit Valuation Adjustment" ruleDetail="Période 2" accent={ACCENT}>t=2 : <K>{"0.018 \\times 0.60 \\times 6 \\times e^{-0.08} = 0.0600"}</K> M$</DemoStep>
          <DemoStep num={4} rule="CVA" ruleDetail="Total" accent={ACCENT}>CVA total = <K>{"0.0625 + 0.0600 = 0.1225"}</K> M$ = 122,500$</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 4 — Wrong-Way Risk" accent={ACCENT} badge="Avancé">
        <p style={{ color: T.text }}>Un producteur pétrolier achète un put WTI à une contrepartie dont la santé financière est corrélée positivement au prix du pétrole. Expliquez le "Wrong-Way Risk" et son impact sur le CVA.</p>
        <FormulaBox accent={ACCENT}><K display>{"WWR = \\frac{CVA_{\\text{réel}}}{CVA_{\\text{indépendant}}} > 1"}</K> → toujours vérifier si la contrepartie est exposée au même risque que vous !</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="CVA" ruleDetail="Cas indépendant" accent={ACCENT}>Dans un marché normal, EE(t) et PD(t) sont indépendants → <K>{"CVA = LGD \\times E[EE] \\times E[PD_{cumul}]"}</K></DemoStep>
          <DemoStep num={2} rule="Credit Valuation Adjustment" ruleDetail="Wrong-Way Risk" accent={ACCENT}>WWR : EE et PD sont positivement corrélés — quand le put est le plus précieux (prix pétrole bas), la contrepartie est aussi en détresse → PD élevée</DemoStep>
          <DemoStep num={3} rule="CVA" ruleDetail="Corrélation positive" accent={ACCENT}>Impact : <K>{"CVA_{WWR} = LGD \\times E[EE \\times PD] > LGD \\times E[EE] \\times E[PD]"}</K></DemoStep>
          <DemoStep num={4} rule="Probabilité de défaut" ruleDetail="Amplification WWR" accent={ACCENT}>Si corr(EE, PD) = 0.5, CVA peut doubler ou tripler. Les régulateurs imposent des majorations ("add-on") lorsque la contrepartie est dans le même secteur que le sous-jacent.</DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}
