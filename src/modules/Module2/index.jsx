import React, { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, BarChart, Bar, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { T } from '../../design/tokens'
import {
  ModuleHeader, TabBar, Panel, FormulaBox, IntuitionBlock, ExampleBlock,
  Slider, Accordion, Step, SymbolLegend, SectionTitle, InfoChip, Grid, ChartWrapper,
  Demonstration, DemoStep, K,
} from '../../design/components'

const ACCENT = T.a2

// ─── Helpers ─────────────────────────────────────────────────────────────────
function phi(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) }
function normCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const p = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return x >= 0 ? 1 - phi(x) * p : phi(x) * p
}

// ─── Tab: Loi Normale ─────────────────────────────────────────────────────────
export function NormalTab() {
  const [mu, setMu] = useState(0)
  const [sigma, setSigma] = useState(1)
  const [d, setD] = useState(1.0)

  const data = useMemo(() => {
    const pts = []
    for (let x = mu - 4 * sigma; x <= mu + 4 * sigma; x += (8 * sigma) / 200) {
      const z = (x - mu) / sigma
      pts.push({
        x: +x.toFixed(3),
        pdf: +(phi(z) / sigma).toFixed(5),
        shade: x <= d ? +(phi(z) / sigma).toFixed(5) : null,
      })
    }
    return pts
  }, [mu, sigma, d])

  const Nd = normCDF((d - mu) / sigma)

  return (
    <div>
      <IntuitionBlock emoji="🔔" title="La courbe en cloche : la loi normale" accent={ACCENT}>
        La loi normale décrit des phénomènes où les petits écarts sont fréquents et les extrêmes sont rares.
        La taille humaine, les erreurs de mesure, et — en première approximation — les <strong>rendements financiers quotidiens</strong>
        suivent cette distribution. En pratique, les marchés ont des queues plus épaisses,
        mais la loi normale reste le point de départ incontournable pour Black-Scholes.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Les paramètres µ et σ : que représentent-ils concrètement ?</SectionTitle>
      <Grid cols={2} gap="12px">
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px 16px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>µ — L'espérance : centre de gravité</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            µ est la valeur autour de laquelle la distribution est centrée. C'est la moyenne de toutes les valeurs possibles, pondérées par leurs probabilités. Sur une cloche symétrique, µ = médiane = mode. En finance : µ est le rendement journalier moyen. Si µ = 0 (rendement moyen nul), la cloche est centrée en zéro. Si µ = 0.001 (+0.1%/jour), la cloche est décalée à droite. Modifier µ <em>déplace</em> horizontalement la courbe sans changer sa forme.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px 16px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>σ — L'écart-type : largeur de la cloche</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            σ mesure la <em>dispersion</em> autour de µ. Un grand σ = cloche large et aplatie (beaucoup d'incertitude). Un petit σ = cloche étroite et pointue (valeurs concentrées autour de µ). En finance : σ est la volatilité. Le Brent spot peut avoir σ ≈ 30%/an (très incertain), un bon du Trésor σ ≈ 2%/an (prévisible). Modifier σ <em>élargit ou rétrécit</em> la courbe sans déplacer son centre.
          </div>
        </div>
      </Grid>

      <IntuitionBlock emoji="🔢" title="Théorème Central Limite : pourquoi la normale est partout" accent={ACCENT}>
        Le TCL explique l'omniprésence de la loi normale : si X₁, X₂, ..., Xₙ sont des variables aléatoires <strong>indépendantes et identiquement distribuées</strong> (i.i.d.) de moyenne µ et variance σ², alors leur somme normalisée converge vers une loi normale quand n → ∞. Formellement : (X₁ + ... + Xₙ - nµ) / (σ√n) → N(0,1). En finance : un rendement mensuel est la somme de ~21 rendements journaliers indépendants → la loi normale s'impose naturellement. Un rendement annuel est la somme de ~252 rendements journaliers. Plus la période est longue, plus l'approximation normale est justifiée... sauf pour les queues de distribution où les événements extrêmes s'accumulent différemment.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Densité de probabilité — N(µ, σ²)">
        f(x) = (1 / (σ√2π)) × exp[-(x-µ)² / (2σ²)]
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['µ', 'Espérance (centre de la cloche)'],
        ['σ', 'Écart-type (largeur de la cloche)'],
        ['σ²', 'Variance'],
        ['φ(x)', 'Densité normale STANDARD N(0,1)'],
        ['N(d)', 'CDF normale standard : P(Z ≤ d)'],
      ]} />

      <FormulaBox accent={ACCENT} label="Standardisation">
        Si X ~ N(µ, σ²) alors Z = (X - µ) / σ ~ N(0, 1)
      </FormulaBox>

      <Grid cols={2} gap="10px">
        <Slider label="µ (espérance)" value={mu} min={-3} max={3} step={0.1} onChange={setMu} accent={ACCENT} />
        <Slider label="σ (écart-type)" value={sigma} min={0.2} max={3} step={0.1} onChange={setSigma} accent={T.a5} format={v => v.toFixed(1)} />
      </Grid>
      <Slider label="d — seuil pour N(d)" value={d} min={mu - 3 * sigma} max={mu + 3 * sigma} step={0.05} onChange={setD} accent={T.a4} format={v => v.toFixed(2)} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="N(d)" value={Nd.toFixed(4)} accent={ACCENT} />
        <InfoChip label="= P(X ≤ d)" value={`${(Nd * 100).toFixed(2)}%`} accent={T.a4} />
        <InfoChip label="Z = (d-µ)/σ" value={((d - mu) / sigma).toFixed(3)} accent={T.a5} />
      </div>

      <ChartWrapper title="Distribution N(µ, σ²) — zone colorée = N(d)" accent={ACCENT} height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="x" type="number" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <ReferenceLine x={d} stroke={T.a4} strokeWidth={2} label={{ value: `d=${d.toFixed(2)}`, fill: T.a4, fontSize: 11 }} />
            <ReferenceLine x={mu} stroke={ACCENT} strokeDasharray="4 3" label={{ value: 'µ', fill: ACCENT, fontSize: 11 }} />
            <Line type="monotone" dataKey="pdf" stroke={ACCENT} strokeWidth={2.5} dot={false} name="f(x)" />
            <Line type="monotone" dataKey="shade" stroke={T.a4} strokeWidth={0} dot={false} fill={`${T.a4}55`} name="N(d)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>La règle des 68-95-99.7% : l'outil de VaR en un coup d'oeil</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Pour toute loi normale X ~ N(µ, σ²), les probabilités de tomber dans les intervalles ±kσ autour de µ sont universelles et doivent être mémorisées :
      </div>
      <Grid cols={3} gap="10px">
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px', border: `1px solid ${ACCENT}33`, textAlign: 'center' }}>
          <div style={{ color: ACCENT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>68.3%</div>
          <code style={{ color: T.text, fontSize: 12 }}>P(µ-σ ≤ X ≤ µ+σ)</code>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>1 jour sur 3 sort de ±1σ. VaR 1σ = 15.9% de probabilité de perte.</div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px', border: `1px solid ${ACCENT}33`, textAlign: 'center' }}>
          <div style={{ color: ACCENT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>95.4%</div>
          <code style={{ color: T.text, fontSize: 12 }}>P(µ-2σ ≤ X ≤ µ+2σ)</code>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>Proche de la VaR 97.5% unilatérale (z=1.96). Base des stress tests.</div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px', border: `1px solid ${ACCENT}33`, textAlign: 'center' }}>
          <div style={{ color: ACCENT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>99.7%</div>
          <code style={{ color: T.text, fontSize: 12 }}>P(µ-3σ ≤ X ≤ µ+3σ)</code>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>Événement 3σ = 1 fois tous les ~333 jours. En réalité beaucoup plus fréquent (fat tails !).</div>
        </div>
      </Grid>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Application VaR :</strong> Si un portefeuille a un P&L quotidien ~ N(0, σ=100k€), alors : VaR 95% = 1.645 × 100k = 164.5k€ (perte dépassée 1 jour sur 20), VaR 99% = 2.326 × 100k = 232.6k€ (perte dépassée 1 jour sur 100). Pour une position longue sur le Brent avec vol σ = 30%/an ≈ 1.89%/jour : sur 100M€ de position, VaR 99% quotidienne ≈ 2.326 × 1.89% × 100M = 4.4M€.
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie de la VaR normale — VaR = -µ + z_α · σ</div>
        <Step num={1} accent={ACCENT}><strong>-µ</strong> — si le rendement espéré est positif, il réduit la perte : une position avec µ = +0.05%/jour perd en espérance 0.05% de moins. La VaR mesure la perte au-delà de ce gain espéré.</Step>
        <Step num={2} accent={ACCENT}><strong>z_α</strong> — quantile normal : z_95 = 1.645, z_99 = 2.326, z_99.9 = 3.090. C'est le nombre d'écarts-types au-delà duquel la perte n'est dépassée qu'avec probabilité (1-α). Mémoriser ces trois valeurs est indispensable.</Step>
        <Step num={3} accent={ACCENT}><strong>σ</strong> — dispersion des rendements : doubler σ double la VaR. La VaR normale est linéaire en σ, ce qui la rend simple à calculer mais fragile face aux queues épaisses des marchés énergie.</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : la VaR est linéaire en σ pour un actif seul, mais la VaR d'un portefeuille est sous-additive (σ_p ≤ σ₁ + σ₂ grâce à la diversification). Cette sous-additivité est une propriété fondamentale qui justifie la diversification des risques.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Queues épaisses (fat tails) : les limites de la loi normale</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        La loi normale <strong>sous-estime massivement</strong> la probabilité des événements extrêmes sur les marchés financiers, surtout en énergie.
      </div>
      <Grid cols={2} gap="10px">
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Sous la loi normale</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>
            • Un choc de 5σ : probabilité ~ 1 sur 3.5 millions de jours (~14 000 ans)<br />
            • Octobre 1987 (Black Monday) : chute de -22% du Dow Jones = choc de {'>'} 20σ selon la normale → probabilité astronomiquement faible
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>En réalité (marchés énergie)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>
            • Le prix du gaz naturel (Henry Hub) a connu des chocs de {'>'} 5σ plusieurs fois par décennie<br />
            • Les distributions réelles ont une queue gauche plus épaisse (kurtosis {'>'} 3)<br />
            • Solutions : modèles à sauts (Merton), distribution de Student, Extreme Value Theory (EVT)
          </div>
        </div>
      </Grid>

      <SectionTitle accent={ACCENT}>Valeurs clés de N(d)</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {[
          ['N(-2)', '2.28%'], ['N(-1)', '15.87%'], ['N(0)', '50%'], ['N(1)', '84.13%'], ['N(2)', '97.72%'],
          ['N(-1.645)', '5%'], ['N(-1.28)', '10%'], ['N(1.28)', '90%'], ['N(1.645)', '95%'], ['N(1.96)', '97.5%'],
        ].map(([d, v]) => (
          <div key={d} style={{ background: T.panel2, borderRadius: 6, padding: '8px 10px', textAlign: 'center', border: `1px solid ${T.border}` }}>
            <div style={{ color: ACCENT, fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{d}</div>
            <div style={{ color: T.text, fontSize: 13, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>

      <ExampleBlock title="N(d₁) dans Black-Scholes" accent={ACCENT}>
        <p>S=100, K=100, r=5%, σ=20%, T=1 an :</p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"C = 100 \\times 0.6368 - 100 e^{-0.05} \\times 0.5596 = 10.52\\euro"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Formule de d₁ (Black-Scholes)" ruleDetail="d₁ = [ln(S/K)+(r+σ²/2)T] / (σ√T)" accent={ACCENT}>
            <K>{"d_1 = \\frac{\\ln(100/100) + (0.05 + 0.02) \\times 1}{0.2 \\times \\sqrt{1}} = \\frac{0.07}{0.2} = 0.35"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Relation d₁ → d₂" ruleDetail="d₂ = d₁ − σ√T" accent={ACCENT}>
            <K>{"d_2 = 0.35 - 0.20 = 0.15"}</K>
          </DemoStep>
          <DemoStep num={3} rule="CDF normale standard" ruleDetail="N(z) = Φ(z)" accent={ACCENT}>
            <K>{"N(d_1) = N(0.35) \\approx 0.6368"}</K> (= Delta du call) et <K>{"N(d_2) = N(0.15) \\approx 0.5596"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Formule de Black-Scholes" ruleDetail="C = S·N(d₁) − K·e^(−rT)·N(d₂)" accent={ACCENT}>
            <K>{"C = 100 \\times 0.6368 - 100 \\times e^{-0.05} \\times 0.5596 = 63.68 - 53.16 = 10.52\\euro"}</K>
          </DemoStep>
        </Demonstration>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice 1 — Standardisation" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}>Si X ~ N(µ=5, σ²=4), calculez P(X ≤ 7)</p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"N(1) \\approx 84.13\\%"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Z-score (standardisation)" ruleDetail="Z = (X − µ) / σ" accent={ACCENT}>
            <K>{"Z = \\frac{7 - 5}{\\sqrt{4}} = \\frac{2}{2} = 1"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Transformation de la CDF" ruleDetail="P(X ≤ x) = P(Z ≤ z) = Φ(z)" accent={ACCENT}>
            <K>{"P(X \\le 7) = P(Z \\le 1) = \\Phi(1) \\approx 0.8413 = 84.13\\%"}</K>
          </DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 2 — Intervalle de confiance VaR" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Un P&L suit N(µ=0, σ=100k€). VaR 95% et VaR 99% ?</p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"\\text{VaR}_{95\\%} = 164.5k\\euro \\quad|\\quad \\text{VaR}_{99\\%} = 232.6k\\euro"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="VaR paramétrique" ruleDetail="VaRₐ = zₐ · σ (quand µ=0)" accent={ACCENT}>
            <K>{"\\text{VaR}_{95\\%} = z_{0.95} \\times \\sigma = 1.645 \\times 100k = 164.5k\\euro"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Quantile normal" ruleDetail="z₀.₉₉ = 2.326" accent={ACCENT}>
            <K>{"\\text{VaR}_{99\\%} = 2.326 \\times 100k = 232.6k\\euro"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Interprétation probabiliste" accent={ACCENT}>
            P(Perte {'>'} VaR₉₅) = 5% ; P(Perte {'>'} VaR₉₉) = 1%. Le ratio VaR99/VaR95 = 1.41 — passer de 95% à 99% augmente la VaR de 41%.
          </DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 3 — Z-score et VaR d'une position énergie" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Un trader est long 50 000 barils de Brent. Le rendement quotidien du Brent suit N(0, σ=1.8%/jour). Prix actuel : 80$/bbl. Calculez la VaR 99% quotidienne en dollars.
        </p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"\\text{VaR}_{99\\%} = 2.326 \\times 1.8\\% \\times 4M\\$ \\approx 167k\\$"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Valorisation de la position" ruleDetail="V = Q × P" accent={ACCENT}>
            <K>{"V = 50\\,000 \\times 80\\$ = 4\\,000\\,000\\$ \\;(4M\\$)"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Quantile normal" ruleDetail="z₀.₉₉ = 2.326" accent={ACCENT}>
            Pour la VaR 99% : <K>{"z = 2.326"}</K> (quantile à 1% dans la queue gauche)
          </DemoStep>
          <DemoStep num={3} rule="VaR en pourcentage" ruleDetail="VaR% = zₐ · σ" accent={ACCENT}>
            <K>{"\\text{VaR}_{99\\%}\\% = 2.326 \\times 1.8\\% = 4.19\\%"}</K>
          </DemoStep>
          <DemoStep num={4} rule="VaR en dollars" ruleDetail="VaR$ = VaR% × V" accent={ACCENT}>
            <K>{"\\text{VaR}\\$ = 4.19\\% \\times 4\\,000\\,000 = 167\\,400\\$"}</K>
            <br />Il y a 1% de probabilité de perdre plus de 167k$ en un seul jour (≈ 2.5 fois/an).
          </DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 4 — Règle des 3-sigma appliquée aux chocs gaziers" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Le rendement quotidien du gaz naturel Henry Hub suit approximativement N(0, σ=2.5%/jour). La règle des 3σ prédit qu'une variation supérieure à 7.5%/jour (=3σ) ne devrait survenir que 0.3% du temps (≈1 jour sur 333). Vérifiez le calcul, puis discutez pourquoi ce chiffre sous-estime la réalité.
        </p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"P_{\\text{théorique}}(|r| > 7.5\\%) = 0.3\\% \\ll P_{\\text{empirique}} \\approx 2\\text{-}5\\%"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Règle des 3σ (loi normale)" ruleDetail="P(|Z| > 3) = 1 − 0.997 = 0.3%" accent={ACCENT}>
            <K>{"3\\sigma = 3 \\times 2.5\\% = 7.5\\%"}</K>. Sous la normale : <K>{"P(|Z| > 3) = 0.3\\%"}</K> = 1 jour sur 333
          </DemoStep>
          <DemoStep num={2} rule="Fréquence attendue" ruleDetail="Nᵉᵛ = P × n jours" accent={ACCENT}>
            Sur 252 jours/an : <K>{"0.3\\% \\times 252 \\approx 0.76"}</K> jour par an prédit par le modèle
          </DemoStep>
          <DemoStep num={3} rule="Queues épaisses (leptokurtose)" ruleDetail="Kurtosis > 3 → fat tails" accent={ACCENT}>
            En réalité : le gaz naturel connaît des chocs {'>'} 3σ plusieurs fois par an (EIA, météo, incidents pipeline). La loi normale sous-estime les queues de 7 à 17×.
          </DemoStep>
          <DemoStep num={4} rule="Implication pour la modélisation" accent={ACCENT}>
            Conclusion : utiliser des modèles à sauts (Merton, Kou) ou des distributions à queues épaisses (Student-t, GEV) pour les marchés énergétiques.
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ─── Tab: Log-Normale ─────────────────────────────────────────────────────────
export function LogNormalTab() {
  const [mu, setMu] = useState(0)
  const [sigma, setSigma] = useState(0.3)

  const logData = useMemo(() => {
    const pts = []
    for (let x = 0.05; x <= 4; x += 0.05) {
      const lnx = Math.log(x)
      const pdf = phi((lnx - mu) / sigma) / (x * sigma)
      pts.push({ x: +x.toFixed(2), logNorm: +pdf.toFixed(4) })
    }
    return pts
  }, [mu, sigma])

  const normData = useMemo(() => {
    const pts = []
    for (let x = -3; x <= 3; x += 0.1) {
      pts.push({ x: +x.toFixed(2), norm: +phi((x - mu) / sigma).toFixed(4) })
    }
    return pts
  }, [mu, sigma])

  const median = Math.exp(mu)
  const mean = Math.exp(mu + sigma * sigma / 2)
  const mode = Math.exp(mu - sigma * sigma)
  const variance = (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma)

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: T.text }}>Le paradoxe de la normalité pour les prix :</strong> La loi normale permet des valeurs négatives (de -∞ à +∞). Or, un prix — que ce soit le Brent, le gaz naturel ou l'électricité (hors marchés spot avec prix négatifs) — ne peut pas être négatif. Un rendement simple peut être au minimum de -100% (l'actif vaut zéro), mais pas de -150%. En revanche, un <em>log-rendement</em> ln(S_t/S₀) peut aller de -∞ (si S_t → 0) à +∞ (si S_t → ∞) sans contrainte. C'est ce qui rend la loi log-normale naturelle pour les prix d'actifs : si ln(S_T/S₀) suit une loi normale, alors S_T {'>'} 0 toujours, et la distribution est asymétrique à droite (les hausses sont potentiellement illimitées, les baisses sont bornées à -100%).
      </div>
      <IntuitionBlock emoji="💹" title="Pourquoi les prix sont log-normaux ?" accent={ACCENT}>
        Un prix ne peut pas être négatif (contrairement à une variable normale).
        Si on suppose que le <strong>log-rendement</strong> est normal :
        ln(S_T/S₀) ~ N(µT, σ²T), alors S_T suit une distribution log-normale.
        Elle est asymétrique à droite : les très grandes hausses sont possibles (une action peut tripler),
        mais la perte maximale est 100% (le prix ne peut aller en dessous de zéro).
        C'est le fondement de Black-Scholes.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Si X ~ N(µ, σ²), alors S = eˣ est log-normale">
        f_lognorm(s) = (1 / (s·σ·√2π)) × exp[-(ln(s) - µ)² / (2σ²)]   pour s {'>'} 0
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Moments de la loi log-normale</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Si S ~ LogNormale(µ, σ²) (c'est-à-dire ln(S) ~ N(µ, σ²)), les moments se calculent en exploitant E[e^X] = e^(µ + σ²/2) pour X ~ N(µ, σ²) :
      </div>
      <Grid cols={2} gap="10px">
        <FormulaBox accent={ACCENT} label="Espérance de la log-normale">
          E[S] = e^(µ + σ²/2)
        </FormulaBox>
        <FormulaBox accent={ACCENT} label="Variance de la log-normale">
          Var[S] = e^(2µ + σ²) × (e^(σ²) - 1)
        </FormulaBox>
      </Grid>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La dérivation de E[S] = e^(µ+σ²/2) : si ln(S) = X ~ N(µ, σ²), alors S = e^X. E[e^X] pour X normal se calcule via la fonction génératrice des moments de la loi normale : E[e^(tX)] = e^(µt + σ²t²/2). En prenant t=1 : E[S] = E[e^X] = e^(µ + σ²/2). La variance découle de E[S²] = e^(2µ + 2σ²), d'où Var[S] = E[S²] - (E[S])² = e^(2µ+σ²)(e^(σ²)-1).
      </div>

      <IntuitionBlock emoji="🔗" title="Log-normale et GBM : le lien fondamental" accent={ACCENT}>
        Le mouvement brownien géométrique (GBM) produit naturellement une distribution log-normale. Si S_T = S₀ × exp[(µ - σ²/2)T + σ√T × Z] avec Z ~ N(0,1), alors ln(S_T/S₀) ~ N((µ-σ²/2)T, σ²T) → S_T/S₀ est log-normale. Paramètres : µ_ln = (µ-σ²/2)T et σ_ln = σ√T. La log-normalité est donc une <strong>conséquence directe</strong> du GBM — pas une hypothèse supplémentaire mais une propriété émergente du modèle de marché.
      </IntuitionBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie de ln(S_T/S₀) ~ N(µ_LN·T, σ²·T)</div>
        <Step num={1} accent={ACCENT}><strong>µ_LN = µ - σ²/2</strong> — drift du log-prix : le drift effectif du log-rendement est plus petit que µ, car la croissance géométrique pénalise la variance (effet Jensen). Sur un actif avec µ = 10% et σ = 30%, µ_LN = 10% - 4.5% = 5.5%.</Step>
        <Step num={2} accent={ACCENT}><strong>σ²/2</strong> — correction de Jensen : E[e^X] = e^(µ+σ²/2) {'>'} e^µ pour X normal. La fonction exp est convexe, donc l'espérance du prix dépasse toujours le prix exponentié de l'espérance du log. Cette correction est indispensable pour que E[S_T] = S₀·e^(µT) reste exact.</Step>
        <Step num={3} accent={ACCENT}><strong>σ√T</strong> — écart-type du log-prix : l'incertitude croît comme la racine carrée du temps (diffusion). Après 4 ans, l'incertitude est 2× celle d'1 an. Ce scaling en √T est une signature du mouvement brownien.</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : S_T log-normale implique E[S_T] = S₀·e^(µT) ≠ S₀·e^(µ_LN·T). Le prix espéré croît au taux µ (drift arithmétique), mais le log-rendement médian croît au taux µ_LN = µ - σ²/2 (drift géométrique). La différence σ²/2 grandit avec la volatilité — une action très volatile peut avoir un prix espéré élevé mais une médiane stagnante.
        </div>
      </div>

      <Grid cols={2} gap="10px">
        <div>
          <SectionTitle accent={ACCENT}>Propriétés</SectionTitle>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <InfoChip label="E[S]" value={mean.toFixed(3)} accent={ACCENT} />
            <InfoChip label="Médiane" value={median.toFixed(3)} accent={T.a4} />
            <InfoChip label="Mode" value={mode.toFixed(3)} accent={T.a5} />
          </div>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
            <div>• Médiane = e^µ</div>
            <div>• Moyenne = e^(µ+σ²/2) {'>'} Médiane (asymétrie droite)</div>
            <div>• Mode = e^(µ-σ²) {'<'} Médiane</div>
          </div>
        </div>
        <div>
          <Grid cols={1} gap="8px">
            <Slider label="µ (paramètre de localisation)" value={mu} min={-1} max={1} step={0.05} onChange={setMu} accent={ACCENT} />
            <Slider label="σ (paramètre d'échelle)" value={sigma} min={0.05} max={1} step={0.05} onChange={setSigma} accent={T.a5} format={v => v.toFixed(2)} />
          </Grid>
        </div>
      </Grid>

      <Grid cols={2} gap="12px">
        <ChartWrapper title="Distribution Log-Normale S_T" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={logData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <ReferenceLine x={mean} stroke={ACCENT} strokeDasharray="3 3" label={{ value: 'E[S]', fill: ACCENT, fontSize: 10 }} />
              <Line type="monotone" dataKey="logNorm" stroke={ACCENT} strokeWidth={2.5} dot={false} name="f_lognorm(s)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Distribution Normale du log-rendement ln(S)" accent={T.a4} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={normData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Line type="monotone" dataKey="norm" stroke={T.a4} strokeWidth={2.5} dot={false} name="f_norm(x)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>

      <ExampleBlock title="Prix du Brent à 6 mois — Calcul complet P(S_T {'>'} 90) et P(S_T {'<'} 70)" accent={ACCENT}>
        <p>S₀ = 80$/bbl, µ_GBM = 0% (risque-neutre), σ = 30%, T = 0.5 an</p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"P(70 \\le S_T \\le 90) \\approx 44.6\\%"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Drift log-normal (correction d'Itô)" ruleDetail="µ_ln = (r − σ²/2)·T" accent={ACCENT}>
            <K>{"\\mu_{\\ln} = (0 - 0.045) \\times 0.5 = -0.0225"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Écart-type du log-rendement" ruleDetail="σ_ln = σ√T" accent={ACCENT}>
            <K>{"\\sigma_{\\ln} = 0.30 \\times \\sqrt{0.5} = 0.2121"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Z-score + CDF complémentaire" ruleDetail="P(S_T > K) = 1 − N(z)" accent={ACCENT}>
            <K>{"z = \\frac{\\ln(90/80) - (-0.0225)}{0.2121} = \\frac{0.1178 + 0.0225}{0.2121} = 0.661"}</K> → P = 1−N(0.661) ≈ 25.4%
          </DemoStep>
          <DemoStep num={4} rule="Z-score + CDF" ruleDetail="P(S_T < K) = N(z)" accent={ACCENT}>
            <K>{"z = \\frac{\\ln(70/80) + 0.0225}{0.2121} = \\frac{-0.1335 + 0.0225}{0.2121} = -0.524"}</K> → P = N(−0.524) ≈ 30.0%
          </DemoStep>
          <DemoStep num={5} rule="Règle du complément" ruleDetail="P(a ≤ X ≤ b) = 1 − P(X>b) − P(X<a)" accent={ACCENT}>
            <K>{"P(70 \\le S_T \\le 90) = 100\\% - 25.4\\% - 30.0\\% = 44.6\\%"}</K>
            <br />Asymétrie visible : P(hausse {'>'}+12.5%) = 25.4% mais P(baisse {'>'}−12.5%) = 30.0%. La log-normale est asymétrique.
          </DemoStep>
        </Demonstration>
      </ExampleBlock>
    </div>
  )
}

// ─── Tab: Corrélation ─────────────────────────────────────────────────────────
export function CorrelTab() {
  const [rho, setRho] = useState(0.7)
  const [nPts, setNPts] = useState(150)

  function gaussRand() {
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  const scatter = useMemo(() => {
    const pts = []
    for (let i = 0; i < nPts; i++) {
      const z1 = gaussRand()
      const z2 = gaussRand()
      pts.push({ x: +z1.toFixed(3), y: +(rho * z1 + Math.sqrt(1 - rho * rho) * z2).toFixed(3) })
    }
    return pts
  }, [rho, nPts])

  // Empirical correlation
  const n = scatter.length
  const mx = scatter.reduce((s, p) => s + p.x, 0) / n
  const my = scatter.reduce((s, p) => s + p.y, 0) / n
  const cov = scatter.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / (n - 1)
  const sx = Math.sqrt(scatter.reduce((s, p) => s + (p.x - mx) ** 2, 0) / (n - 1))
  const sy = Math.sqrt(scatter.reduce((s, p) => s + (p.y - my) ** 2, 0) / (n - 1))
  const empRho = sx > 0 && sy > 0 ? cov / (sx * sy) : 0

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La corrélation de Pearson mesure la <strong style={{ color: T.text }}>force et la direction du lien linéaire</strong> entre deux variables. "Linéaire" est le mot-clé : ρ = 1 signifie que Y augmente proportionnellement à X (relation parfaitement linéaire positive), ρ = -1 signifie que Y diminue proportionnellement à X, ρ = 0 signifie <em>absence de relation linéaire</em> — mais pas nécessairement d'indépendance. Ses <strong>limites</strong> sont importantes : la corrélation ne capture pas les relations non-linéaires (ex: Y = X²), est sensible aux valeurs aberrantes, et peut varier fortement dans le temps (corrélations non-stationnaires sur les marchés de l'énergie).
      </div>
      <IntuitionBlock emoji="🔗" title="La corrélation = force du lien linéaire" accent={ACCENT}>
        Si le prix du gaz naturel augmente chaque fois que le prix du pétrole augmente,
        ils sont positivement corrélés (ρ {'>'} 0). Si ρ = 0 : indépendants. Si ρ = -1 : parfaitement opposés.
        En pratique, ρ_oil,gas ≈ 0.4 à 0.7 selon les périodes.
        La corrélation est cruciale pour le risk management de portefeuilles multi-énergie.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Coefficient de corrélation de Pearson">
        ρ(X,Y) = Cov(X,Y) / (σ_X × σ_Y) = E[(X-µ_X)(Y-µ_Y)] / (σ_X × σ_Y)
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Estimateur empirique">
        r̂ = Σ(xᵢ-x̄)(yᵢ-ȳ) / √[Σ(xᵢ-x̄)² × Σ(yᵢ-ȳ)²]
      </FormulaBox>

      <Grid cols={2} gap="10px">
        <Slider label="Corrélation théorique ρ" value={rho} min={-0.99} max={0.99} step={0.01} onChange={setRho} accent={ACCENT} />
        <Slider label="Nombre de points" value={nPts} min={50} max={400} step={10} onChange={setNPts} accent={T.muted} format={v => v.toFixed(0)} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        <InfoChip label="ρ théorique" value={rho.toFixed(2)} accent={ACCENT} />
        <InfoChip label="r̂ empirique" value={empRho.toFixed(3)} accent={T.a4} />
        <InfoChip label="Cov(X,Y)" value={cov.toFixed(4)} accent={T.a5} />
      </div>

      <ChartWrapper title={`Scatter plot — ρ = ${rho.toFixed(2)} (r̂ empirique = ${empRho.toFixed(3)})`} accent={ACCENT} height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="x" type="number" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'X', fill: T.muted, fontSize: 11 }} />
            <YAxis dataKey="y" type="number" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Y', fill: T.muted, fontSize: 11, angle: -90 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Scatter data={scatter} fill={ACCENT} fillOpacity={0.5} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Corrélation ≠ Indépendance, et corrélation en crise</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Deux actifs peuvent avoir ρ = 0 (non corrélés) tout en étant <strong>statistiquement dépendants</strong>. Exemple classique : si X ~ N(0,1) et Y = X², alors Cov(X, Y) = E[X³] = 0 (par symétrie de la normale), donc ρ = 0. Pourtant, Y est déterminé par X. En finance de l'énergie, l'électricité spot peut être non corrélée au pétrole en période normale, mais fortement dépendante lors de chocs extrêmes (blackouts, vagues de froid).
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Corrélation en crise — Le phénomène le plus dangereux en risk management :</strong> En période de stress (2008, COVID-2020, choc gazier 2022), les corrélations entre actifs tendent vers +1. Pétrole, gaz, électricité, equity — tout chute ensemble. La diversification, qui repose sur des corrélations {'<'} 1, <em>disparaît exactement quand on en a le plus besoin</em>. Ce phénomène est documenté comme la "correlation breakdown" et oblige les risk managers à utiliser des matrices de corrélation de stress distinct des corrélations historiques normales.
      </div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: T.text }}>Pour aller plus loin — les copules :</strong> Les copules permettent de séparer la <em>structure de dépendance</em> entre variables de leurs <em>distributions marginales</em>. Par exemple, une copule de Gumbel peut modéliser une forte dépendance dans les queues (co-occurrence de chocs extrêmes) même si les corrélations usuelles semblent faibles en régime normal. C'est l'outil standard pour modéliser le risque de queue conjoint en énergie et en crédit.
      </div>

      <SectionTitle accent={ACCENT}>Matrice de corrélation — Énergie</SectionTitle>
      <div style={{ background: T.panel2, borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 12, color: T.text, overflow: 'auto' }}>
        <div style={{ color: ACCENT, marginBottom: 8, fontSize: 11, textTransform: 'uppercase' }}>Corrélations annuelles typiques</div>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {['', 'WTI', 'Brent', 'Gaz Nat.', 'Elect.', 'Heating'].map(h => (
                <th key={h} style={{ color: T.muted, padding: '4px 12px', textAlign: 'center', fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['WTI', '1.00', '0.96', '0.42', '0.18', '0.38'],
              ['Brent', '0.96', '1.00', '0.40', '0.16', '0.36'],
              ['Gaz Nat.', '0.42', '0.40', '1.00', '0.35', '0.62'],
              ['Elect.', '0.18', '0.16', '0.35', '1.00', '0.28'],
              ['Heating', '0.38', '0.36', '0.62', '0.28', '1.00'],
            ].map(row => (
              <tr key={row[0]}>
                {row.map((v, i) => (
                  <td key={i} style={{
                    padding: '6px 12px', textAlign: 'center', fontSize: 12,
                    color: i === 0 ? T.muted : parseFloat(v) >= 0.9 ? ACCENT : parseFloat(v) >= 0.5 ? T.a4 : parseFloat(v) >= 0.3 ? T.a5 : T.text,
                    fontWeight: parseFloat(v) >= 0.9 ? 700 : 400,
                  }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Accordion title="Exercice 1 — Corrélation pétrole/gaz" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>σ_oil=25%, σ_gas=35%, ρ=0.45. Calculez Cov et σ_p (50/50).</p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"\\sigma_p = \\sqrt{0.065938} \\approx 25.68\\%"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Covariance à partir de la corrélation" ruleDetail="Cov = ρ·σ_X·σ_Y" accent={ACCENT}>
            <K>{"\\text{Cov}(\\text{oil,gas}) = 0.45 \\times 0.25 \\times 0.35 = 0.039375"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Variance de portefeuille (2 actifs)" ruleDetail="σ²_p = w¹²σ¹² + 2w¹w²Cov + w²²σ²²" accent={ACCENT}>
            <K>{"\\sigma_p^2 = 0.25 \\times 0.0625 + 2 \\times 0.25 \\times 0.039375 + 0.25 \\times 0.1225"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Addition des composantes" accent={ACCENT}>
            <K>{"= 0.015625 + 0.019688 + 0.030625 = 0.065938"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Effet de diversification" ruleDetail="σ_p < w₁σ₁ + w₂σ₂ si ρ < 1" accent={ACCENT}>
            <K>{"\\sigma_p \\approx 25.68\\%"}</K> vs sans diversification : 0.5×25% + 0.5×35% = 30% → économie de 4.32% de vol !
          </DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 2 — Calcul de corrélation à partir de données" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          On observe 4 rendements hebdomadaires pour le WTI (X) et le Henry Hub Gaz (Y) en % : X = [+3, -2, +5, -1] et Y = [+2, -1, +4, +1]. Calculez la corrélation empirique r̂.
        </p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"\\hat{r} = \\frac{6.5}{3.304 \\times 2.082} \\approx 0.945"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Moyenne échantillonnale" ruleDetail="x̄ = (1/n)Σxᵢ" accent={ACCENT}>
            <K>{"\\bar{x} = \\frac{3-2+5-1}{4} = 1.25\\%"}</K> ; <K>{"\\bar{y} = \\frac{2-1+4+1}{4} = 1.50\\%"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Écarts centrés" ruleDetail="xᵢ − x̄" accent={ACCENT}>
            (xᵢ−x̄) = [1.75, −3.25, 3.75, −2.25] ; (yᵢ−ȳ) = [0.50, −2.50, 2.50, −0.50]
          </DemoStep>
          <DemoStep num={3} rule="Covariance de Bessel" ruleDetail="Cov = Σ(xᵢ−x̄)(yᵢ−ȳ)/(n−1)" accent={ACCENT}>
            <K>{"\\text{Cov} = \\frac{0.875 + 8.125 + 9.375 + 1.125}{3} = \\frac{19.5}{3} = 6.5"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Écart-type (correction de Bessel)" ruleDetail="s = √[Σ(xᵢ−x̄)²/(n−1)]" accent={ACCENT}>
            <K>{"s_x = \\sqrt{\\frac{32.75}{3}} \\approx 3.304"}</K> ; <K>{"s_y = \\sqrt{\\frac{13}{3}} \\approx 2.082"}</K>
          </DemoStep>
          <DemoStep num={5} rule="Corrélation de Pearson" ruleDetail="r̂ = Cov/(s_x·s_y)" accent={ACCENT}>
            <K>{"\\hat{r} = \\frac{6.5}{3.304 \\times 2.082} \\approx 0.945"}</K>. Attention : 4 observations est très peu pour une estimation fiable.
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ─── Tab: Estimation ─────────────────────────────────────────────────────────
export function EstimationTab() {
  const [n, setN] = useState(50)

  function gaussRand(mu = 0, sigma = 1) {
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  const [seed, setSeed] = useState(0)
  const data = useMemo(() => {
    const pts = []
    const trueMu = 0.08 / 252, trueSig = 0.25 / Math.sqrt(252)
    for (let i = 0; i < n; i++) {
      pts.push({ i: i + 1, r: +gaussRand(trueMu, trueSig).toFixed(5) })
    }
    return pts
  }, [n, seed])

  const mean = data.reduce((s, p) => s + p.r, 0) / n
  const variance = data.reduce((s, p) => s + (p.r - mean) ** 2, 0) / (n - 1)
  const volAnnualized = Math.sqrt(variance * 252)
  const muAnnualized = mean * 252

  const histogram = useMemo(() => {
    const bins = {}
    const bw = 0.005
    data.forEach(p => {
      const bin = (Math.round(p.r / bw) * bw).toFixed(3)
      bins[bin] = (bins[bin] || 0) + 1
    })
    return Object.entries(bins).sort(([a], [b]) => parseFloat(a) - parseFloat(b))
      .map(([r, count]) => ({ r: parseFloat(r).toFixed(3), count }))
  }, [data])

  return (
    <div>
      <IntuitionBlock emoji="🎯" title="Paramètres vrais vs estimés : la distinction fondamentale" accent={ACCENT}>
        En statistiques, on distingue deux mondes. Le monde réel possède de "vrais" paramètres inconnus — par exemple, la vraie volatilité du Brent est σ = 28.3% (on ne le saura jamais exactement). On observe un échantillon de n rendements historiques, et on calcule un estimateur σ̂ qui approxime σ. <strong>L'estimateur est une variable aléatoire</strong> — si on refaisait l'expérience avec un autre échantillon de n jours, on obtiendrait un σ̂ différent. La qualité d'un estimateur se mesure par : son <em>biais</em> (E[σ̂] - σ : est-il systématiquement trop haut ou trop bas ?), sa <em>variance</em> (à quel point varie-t-il d'un échantillon à l'autre ?), et sa <em>convergence</em> (σ̂ → σ quand n → ∞ ?).
      </IntuitionBlock>

      <IntuitionBlock emoji="📊" title="L'estimation statistique : apprendre des données" accent={ACCENT}>
        En finance, on observe des rendements historiques et on en déduit les paramètres du modèle.
        Plus on a de données (grand n), plus les estimateurs sont précis — c'est la <strong>loi des grands nombres</strong>.
        Mais attention : avec 252 observations (1 an), l'incertitude sur µ reste élevée !
        L'estimation de σ converge bien plus vite que celle de µ.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Estimateurs empiriques">
        x̄ = (1/n) Σ xᵢ      (moyenne empirique)
        s² = (1/(n-1)) Σ (xᵢ - x̄)²    (variance de Bessel)
        σ_ann = s × √252      (volatilité annualisée)
      </FormulaBox>

      <Slider label="Nombre de jours d'observation (n)" value={n} min={10} max={500} step={10} onChange={setN} accent={ACCENT} format={v => v.toFixed(0)} />
      <button onClick={() => setSeed(s => s + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelle simulation</button>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="µ̂ annualisé" value={`${(muAnnualized * 100).toFixed(1)}%`} accent={ACCENT} />
        <InfoChip label="σ̂ annualisée" value={`${(volAnnualized * 100).toFixed(1)}%`} accent={T.a5} />
        <InfoChip label="Vrai µ" value="8%" accent={T.muted} />
        <InfoChip label="Vraie σ" value="25%" accent={T.muted} />
      </div>

      <Grid cols={2} gap="12px">
        <ChartWrapper title="Série temporelle des rendements quotidiens" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="i" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <ReferenceLine y={0} stroke={T.border} />
              <ReferenceLine y={mean} stroke={ACCENT} strokeDasharray="3 3" label={{ value: 'µ̂', fill: ACCENT, fontSize: 10 }} />
              <Line type="monotone" dataKey="r" stroke={ACCENT} strokeWidth={1} dot={false} name="rᵢ" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Histogramme des rendements" accent={T.a4} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="r" stroke={T.muted} tick={{ fill: T.muted, fontSize: 8 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Bar dataKey="count" fill={T.a4} fillOpacity={0.8} name="Fréquence" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>

      <SectionTitle accent={ACCENT}>Propriétés des estimateurs : biais, convergence, efficacité</SectionTitle>
      <Grid cols={3} gap="10px">
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Sans biais</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>E[estimateur] = vrai paramètre. La variance de Bessel s² = Σ(xᵢ-x̄)²/(n-1) divise par n-1 (pas n) précisément pour être sans biais : E[s²] = σ².</div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Convergent (consistant)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>estimateur → paramètre quand n → ∞. Par la loi des grands nombres : x̄ → µ. σ̂ → σ. Plus on a de données, plus on est précis.</div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Efficace</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>Variance minimale parmi tous les estimateurs sans biais (borne de Cramér-Rao). La moyenne empirique est l'estimateur le plus efficace de µ pour la loi normale.</div>
        </div>
      </Grid>

      <SectionTitle accent={ACCENT}>Estimation de la volatilité historique</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        En pratique, la volatilité historique d'un actif est estimée comme l'écart-type annualisé des log-rendements quotidiens :
      </div>
      <FormulaBox accent={ACCENT} label="Volatilité historique annualisée">
        σ̂ = std(rᵢ) × √252   où rᵢ = ln(Sᵢ/Sᵢ₋₁)
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Le facteur √252 annualise la volatilité quotidienne (252 jours de trading par an). La formule exacte : σ̂ = √[(1/(n-1)) Σᵢ (rᵢ - r̄)² × 252].
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Choix de la fenêtre d'estimation — un arbitrage biais/variance :</strong>
        <br />• <strong>Fenêtre courte (30 jours) :</strong> Réactive aux changements de régime, mais très bruitée. Idéale pour les marchés très volatils (électricité spot, gaz naturel en hiver). Mais σ̂ varie énormément d'une semaine à l'autre.
        <br />• <strong>Fenêtre moyenne (60 jours) :</strong> Bon compromis biais/variance. Standard dans de nombreux systèmes de risk management.
        <br />• <strong>Fenêtre longue (252 jours) :</strong> Stable et lisse, mais ne reflète pas les changements récents (ex: une crise récente poids peu dans 252 jours). Problème du "ghost effect" : un choc disparaît exactement 1 an après.
        <br />• <strong>EWMA (volatilité exponentiellement pondérée) :</strong> Solution alternative — pondère les observations récentes plus fortement. Paramètre λ typique = 0.94 (RiskMetrics de JP Morgan).
      </div>

      <SectionTitle accent={ACCENT}>Intervalle de confiance pour µ</SectionTitle>
      <FormulaBox accent={ACCENT} label="IC 95% pour la moyenne annualisée">
        µ̂ ± 1.96 × (σ / √n) × √252 = µ̂ ± 1.96 × σ_ann / √n
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>
        IC à 95% : [{((muAnnualized - 1.96 * volAnnualized / Math.sqrt(n)) * 100).toFixed(1)}%, {((muAnnualized + 1.96 * volAnnualized / Math.sqrt(n)) * 100).toFixed(1)}%]
        <br />
        → Avec seulement {n} observations, l'IC est très large. Il faut {Math.round(1.96 * 1.96 * 0.0625 / 0.0001)} années pour estimer µ à ±1% près !
      </div>

      <Accordion title="Exercice 1 — Calcul de volatilité historique step-by-step" accent={ACCENT} badge="Pratique">
        <p style={{ color: T.text }}>Rendements log-quotidiens du Brent sur 5 jours : [+1.2%, -0.8%, +2.1%, -1.5%, +0.3%]</p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"\\hat{\\sigma}_{\\text{ann}} = 1.457\\% \\times \\sqrt{252} \\approx 23.12\\%/\\text{an}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Log-rendements" ruleDetail="rᵢ = ln(Sᵢ/Sᵢ₋₁)" accent={ACCENT}>
            Vérifier qu'il s'agit de log-rendements. Si on avait les prix, il faudrait calculer <K>{"r_i = \\ln(S_i/S_{i-1})"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Moyenne échantillonnale" ruleDetail="r̄ = (1/n)Σrᵢ" accent={ACCENT}>
            <K>{"\\bar{r} = \\frac{1.2 - 0.8 + 2.1 - 1.5 + 0.3}{5} = \\frac{1.3}{5} = 0.26\\%"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Écarts centrés" ruleDetail="rᵢ − r̄" accent={ACCENT}>
            (rᵢ − r̄) = [+0.94, −1.06, +1.84, −1.76, +0.04]
          </DemoStep>
          <DemoStep num={4} rule="Variance de Bessel" ruleDetail="s² = Σ(rᵢ−r̄)²/(n−1)" accent={ACCENT}>
            Carrés : [0.8836, 1.1236, 3.3856, 3.0976, 0.0016]
            <br /><K>{"s^2 = \\frac{8.492}{4} = 2.123\\;(\\%^2)"}</K> ; <K>{"s = \\sqrt{2.123} = 1.457\\%/\\text{jour}"}</K>
          </DemoStep>
          <DemoStep num={5} rule="Annualisation (√252)" ruleDetail="σ_ann = σ_jour × √252" accent={ACCENT}>
            <K>{"\\hat{\\sigma}_{\\text{ann}} = 1.457\\% \\times \\sqrt{252} \\approx 23.12\\%"}</K>
            <br />Attention : avec 5 obs, l'erreur-type est <K>{"\\sigma/\\sqrt{2n} \\approx 7.3\\%"}</K> — IC 95% = [8%, 38%] !
          </DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 2 — Comparaison des fenêtres d'estimation" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Un risk manager calcule la vol historique du WTI sur différentes fenêtres. Il trouve σ̂_30j = 45%, σ̂_60j = 32%, σ̂_252j = 28%. Il existe une crise 15 jours auparavant qui a causé des rendements de ±5%. Discutez quelle fenêtre utiliser pour la VaR de demain.
        </p>
        <FormulaBox accent={ACCENT} label="Résultat">Recommandation : utiliser plusieurs fenêtres + worst-case pour la VaR réglementaire</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Fenêtre courte (30j)" ruleDetail="Haute variance, faible biais" accent={ACCENT}>
            <K>{"\\hat{\\sigma}_{30j} = 45\\%"}</K> : fortement impacté par la crise récente. Peut surestimer la vol future si la crise est passée.
          </DemoStep>
          <DemoStep num={2} rule="Fenêtre moyenne (60j)" ruleDetail="Compromis biais-variance" accent={ACCENT}>
            <K>{"\\hat{\\sigma}_{60j} = 32\\%"}</K> : la crise représente 25% de la fenêtre, dilution partielle.
          </DemoStep>
          <DemoStep num={3} rule="Fenêtre longue (252j)" ruleDetail="Faible variance, biais potentiel" accent={ACCENT}>
            <K>{"\\hat{\\sigma}_{252j} = 28\\%"}</K> : presque insensible à la crise (15j/252 = 6%). Peut sous-estimer en régime volatile.
          </DemoStep>
          <DemoStep num={4} rule="EWMA (décroissance exponentielle)" ruleDetail="σ²_t = λσ²_{t-1} + (1−λ)r²_{t-1}" accent={ACCENT}>
            Avec λ=0.94 (RiskMetrics), l'EWMA réagit vite à la crise puis décroît exponentiellement. Probablement ~38-40% juste après la crise.
            <br />Basel III/IV recommande σ sur 250j + une "stressed VaR" sur période de stress historique (2008, 2020).
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ─── Main Module 2 ────────────────────────────────────────────────────────────
const TABS = ['Loi Normale', 'Log-Normale', 'Corrélation', 'Estimation']

export default function Module2() {
  const [tab, setTab] = useState('Loi Normale')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      <ModuleHeader
        num={2}
        title="Probabilités & Statistiques"
        subtitle="Fondements probabilistes : loi normale et log-normale pour les prix, corrélation entre actifs, et estimation des paramètres depuis des données historiques."
        accent={ACCENT}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} accent={ACCENT} />
      {tab === 'Loi Normale' && <NormalTab />}
      {tab === 'Log-Normale' && <LogNormalTab />}
      {tab === 'Corrélation' && <CorrelTab />}
      {tab === 'Estimation' && <EstimationTab />}
    </div>
  )
}
