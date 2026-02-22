import React, { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
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

const ACCENT = T.a8


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


// Black-76 pricer for forward/futures options

function black76(F, K, T, r, sigma, type = 'call') {
  if (T <= 0) return Math.max(type === 'call' ? F - K : K - F, 0)
  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(F / K) + 0.5 * sigma * sigma * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT
  const df = Math.exp(-r * T)
  if (type === 'call') return df * (F * normCDF(d1) - K * normCDF(d2))
  return df * (K * normCDF(-d2) - F * normCDF(-d1))
}


// ─── Tab: Marchés Énergie ─────────────────────────────────────────────────────

export function ForwardCurvesTab() {
  const [spot, setSpot] = useState(80)
  const [r, setR] = useState(0.05)
  const [u, setU] = useState(0.03)   // storage cost
  const [y, setY] = useState(0.04)   // convenience yield
  const [type, setType] = useState('normal') // normal, contango, backwardation

  const maturities = [1, 2, 3, 6, 9, 12, 18, 24]

  const forwardData = useMemo(() => {
    return maturities.map(m => {
      const T = m / 12
      let F
      if (type === 'normal') {
        // Cost of carry: F = S × e^(r+u-y)T
        F = spot * Math.exp((r + u - y) * T)
      } else if (type === 'contango') {
        // Contango: F > S, upward sloping
        F = spot * Math.exp((r + 0.06 - 0.01) * T)
      } else {
        // Backwardation: F < S, downward sloping
        F = spot * Math.exp((r + 0.01 - 0.08) * T)
      }
      return { m, T: T.toFixed(2), F: +F.toFixed(2) }
    })
  }, [spot, r, u, y, type])

  const curveColor = type === 'contango' ? T.a5 : type === 'backwardation' ? T.error : ACCENT
  const lastF = forwardData[forwardData.length - 1]?.F || spot
  const shape = lastF > spot ? 'Contango ↑' : lastF < spot ? 'Backwardation ↓' : 'Flat'
  const shapeColor = lastF > spot ? T.a5 : lastF < spot ? T.error : T.muted

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La <strong style={{ color: ACCENT }}>courbe forward (term structure)</strong> est l'ADN du marché des commodités. Elle encode simultanément les anticipations de prix du marché, les coûts de stockage physique, la convenience yield (valeur de détenir la commodité en physique), et la structure de la demande saisonnière.
        Contrairement aux courbes de taux (où les prix futurs sont fondamentalement liés aux taux courts via les arbitrages), les courbes forward de commodités peuvent avoir des formes très diverses — en "dents de scie" (gaz), en déport prononcé (électricité en heures creuses), ou en report fort (pétrole en période de surstockage).
        Un trader ou un structureur en énergie lit la courbe forward comme un médecin lit une radiographie : chaque kink, chaque discontinuité, chaque spread inter-saisons raconte une histoire sur l'état du marché physique.
      </div>

      <IntuitionBlock emoji="📊" title="La courbe forward : la structure par terme des prix" accent={ACCENT}>
        Le prix d'un forward pétrole à 6 mois est différent du spot.
        Pourquoi ? Coût de stockage, coût de financement, mais aussi le <strong>convenience yield</strong>
        (valeur de détenir physiquement la matière première : flexibilité, éviter les ruptures).
        En <strong>contango</strong> : <K>{"F > S"}</K> (stocker coûte, les stocks sont abondants).
        En <strong>backwardation</strong> : <K>{"F < S"}</K> (manque de stock, prime pour livraison immédiate).
        La courbe forward est la prévision implicite de marché et l'outil de base du trader énergie.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Théorie du coût de portage (Cost of Carry)">
        <K display>{"F(0,T) = S_0 \\times e^{(r + u - y) \\times T}"}</K>
        <K display>{"F(0,T) = S_0 \\times e^{rT} \\times e^{uT} \\times e^{-yT}"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['S₀', 'Prix spot actuel'],
        ['r', 'Taux d\'intérêt sans risque (coût de financement)'],
        ['u', 'Storage cost : coût de stockage annualisé'],
        ['y', 'Convenience yield : valeur de détention physique'],
        ['r+u-y', 'Si > 0 → Contango ; si < 0 → Backwardation'],
      ]} />

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie du Cost of Carry — <K>{"F = S \\cdot e^{(r+u-\\delta)T}"}</K></div>
        <Step num={1} accent={ACCENT}><strong>r</strong> — taux sans risque : coût de financement du stock physique. Détenir 1 000 barils de Brent immobilise du capital qui aurait pu être placé sans risque. Si r = 5%/an et S = 80$/bbl, le coût de financement pour 6 mois est <K>{"80 \\times (e^{0.025} - 1) \\approx 2.03\\$/\\text{bbl}"}</K>.</Step>
        <Step num={2} accent={ACCENT}><strong>u</strong> — coûts de stockage : location de tank, assurance, perte en ligne. Pour le gaz naturel : 2-5%/an de la valeur du contenu. Pour le pétrole brut en onshore : 0.3-0.6$/bbl/mois. Ces coûts poussent la courbe vers le contango.</Step>
        <Step num={3} accent={ACCENT}><strong>-δ</strong> — convenience yield négatif : bénéfice d'avoir le physique (flexibilité opérationnelle, éviter une rupture de stock). Si δ est élevé, le marché valorise fortement le stock physique → backwardation (<K>{"F < S"}</K>).</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : contango = <K>{"r + u > \\delta"}</K> (offre abondante, peu de valeur marginale du physique) ; backwardation = <K>{"\\delta > r + u"}</K> (pénurie spot, prime pour livraison immédiate). En 2022, le TTF gaz a affiché une backwardation extrême <K>{"\\delta > 50\\%/\\text{an}"}</K> reflétant la panique sur les stocks européens.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Théories de la structure par terme des prix forward</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Pourquoi le prix forward d'une commodité à 6 mois est-il différent du spot ? Plusieurs théories s'affrontent, chacune capturant un aspect de la réalité :
      </div>
      <Grid cols={3} gap="10px" style={{ marginBottom: 14 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Théorie du stockage (Kaldor-Working)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            <K>{"F(T) = S \\times e^{(r + u - \\delta)T}"}</K><br /><br />
            u = coûts de stockage annualisés (location, assurance)<br />
            δ = convenience yield (valeur de détenir le physique)<br /><br />
            <strong style={{ color: T.a5 }}>Contango</strong> si <K>{"u > \\delta"}</K> (coût de stockage élevé, peu de valeur marginale)<br />
            <strong style={{ color: T.error }}>Backwardation</strong> si <K>{"\\delta > u"}</K> (pénurie, le physique est précieux)
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a4}33` }}>
          <div style={{ color: T.a4, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Théorie des hedgers (Keynes)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Les <strong>producteurs</strong> vendent massivement des forwards pour se couvrir contre la baisse des prix → pression vendeuse sur les forwards → <K>{"F(T) < E[S(T)]"}</K> (backwardation normale).<br /><br />
            Les <strong>spéculateurs</strong> achètent ces forwards en échange d'une prime de risque → ils gagnent si <K>{"S(T) > F(T)"}</K>.<br /><br />
            La prime de risque = <K>{"E[S(T)] - F(T)"}</K> = rémunération du risque pris par les spéculateurs.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a3}33` }}>
          <div style={{ color: T.a3, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Théorie des anticipations</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            <K>{"F(T) = E^{\\mathbb{Q}}[S(T)]"}</K> sous la mesure risque-neutre Q (no-arbitrage).<br /><br />
            Mais sous la mesure physique P : <K>{"F(T) = E^{\\mathbb{P}}[S(T)] - \\text{Prime de risque}"}</K><br /><br />
            La prime de risque peut être positive (backwardation) ou négative (contango) selon la position nette des hedgers vs spéculateurs.
            En pratique : <K>{"F(T) \\neq E[S(T)]"}</K> → les forwards ne sont pas de bons prédicteurs du spot futur.
          </div>
        </div>
      </Grid>

      <SectionTitle accent={ACCENT}>Convenience Yield — Le bénéfice de détenir la physique</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        La <strong style={{ color: ACCENT }}>convenience yield (δ)</strong> est le rendement implicite associé à la détention physique d'une commodité plutôt qu'une position en futures. C'est la valeur de la "flexibilité opérationnelle" que procure le stock physique.
      </div>
      <Grid cols={2} gap="10px" style={{ marginBottom: 14 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.error}33` }}>
          <div style={{ color: T.error, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Forte convenience yield → Backwardation</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Contexte : stocks faibles, demande élevée, risque de pénurie<br /><br />
            Exemple : gaz en hiver après un vague de froid inattendue<br />
            • Détenir du gaz en physique a une valeur immense (évite les ruptures d'approvisionnement)<br />
            • δ élevé → <K>{"F(T) < S"}</K> (les futurs sont moins chers que le spot)<br />
            • Signal pour les traders : "le marché paie pour une livraison immédiate"
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a5}33` }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Faible convenience yield → Contango</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Contexte : stocks abondants, demande faible, surplus de production<br /><br />
            Exemple : pétrole en avril 2020 (COVID, demande effondrée)<br />
            • Le pétrole physique encombrait les stockages → coût de stockage élevé, valeur marginale faible<br />
            • δ très faible, u élevé → <K>{"F(T) > S"}</K> (fort contango, jusqu'à -37$/bbl pour le WTI !)<br />
            • Signal pour les traders : "arbitrage cash-and-carry : acheter spot, stocker, vendre futures"
          </div>
        </div>
      </Grid>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        <strong style={{ color: ACCENT }}>Calcul implicite de la convenience yield :</strong> On l'extrait de la courbe forward observée :
        <K display>{"\\delta = r + u - \\frac{1}{T} \\ln\\!\\left(\\frac{F(T)}{S_0}\\right)"}</K>
        Si F(T) est observé sur le marché, on peut calculer δ implicitement — c'est l'approche "mark-to-market" de la convenience yield.
      </div>

      <IntuitionBlock emoji="📍" title="Basis Risk — Quand votre couverture ne couvre pas exactement" accent={ACCENT}>
        Le <strong>basis</strong> est la différence entre le prix local (ex: gaz à Chicago) et le prix de référence utilisé pour la couverture (ex: Henry Hub). Un producteur de gaz à Chicago qui se couvre avec des futures Henry Hub s'expose au basis risk.
        Si le basis Chicago-HH est stable à -0.10$/MMBtu, la couverture est efficace. Mais si le basis passe à -0.50$/MMBtu (pipeline congestion, problème logistique), le producteur perd 0.40$/MMBtu sur son volume entier — sans couverture possible sur ce basis.<br />
        Les bases énergie peuvent être très volatiles : un gel des pipelines peut faire passer le basis de -0.20$ à -5.00$ en 48h.
        Solutions : (1) Utiliser des forwards OTC locaux au lieu de futures de référence. (2) Acheter des swaps de basis spécifiques. (3) Accepter le basis risk résiduel comme coût de la couverture imparfaite.
      </IntuitionBlock>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['normal', 'Coût de portage'], ['contango', 'Contango fort'], ['backwardation', 'Backwardation']].map(([k, label]) => (
          <button key={k} onClick={() => setType(k)} style={{
            background: type === k ? `${curveColor}22` : T.panel2,
            border: `1px solid ${type === k ? curveColor : T.border}`,
            color: type === k ? curveColor : T.muted,
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: type === k ? 700 : 400,
          }}>{label}</button>
        ))}
      </div>

      {type === 'normal' && (
        <Grid cols={2} gap="10px">
          <Slider label="Taux r (%)" value={r} min={0} max={0.15} step={0.005} onChange={setR} accent={T.a4} format={v => `${(v * 100).toFixed(1)}%`} />
          <Slider label="Coût stockage u (%)" value={u} min={0} max={0.15} step={0.005} onChange={setU} accent={T.a5} format={v => `${(v * 100).toFixed(1)}%`} />
          <Slider label="Convenience yield y (%)" value={y} min={0} max={0.2} step={0.005} onChange={setY} accent={ACCENT} format={v => `${(v * 100).toFixed(1)}%`} />
          <Slider label="Spot S₀ ($/bbl)" value={spot} min={30} max={150} step={1} onChange={setSpot} accent={T.muted} format={v => `${v}$/bbl`} />
        </Grid>
      )}
      {type !== 'normal' && (
        <Slider label="Spot S₀ ($/bbl)" value={spot} min={30} max={150} step={1} onChange={setSpot} accent={T.muted} format={v => `${v}$/bbl`} />
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="Spot S₀" value={`${spot}$/bbl`} accent={T.muted} />
        <InfoChip label="F(0, 2ans)" value={`${lastF}$/bbl`} accent={curveColor} />
        <InfoChip label="Structure" value={shape} accent={shapeColor} />
        <InfoChip label="r+u-y" value={`${((r + u - y) * 100).toFixed(1)}%`} accent={type === 'normal' ? curveColor : T.muted} />
      </div>

      <ChartWrapper title="Courbe Forward — Prix par maturité" accent={ACCENT} height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forwardData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="m" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Maturité (mois)', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} formatter={(v) => [`${v}$/bbl`, 'F(0,T)']} />
            <ReferenceLine y={spot} stroke={T.muted} strokeDasharray="4 3" label={{ value: `Spot=${spot}`, fill: T.muted, fontSize: 10 }} />
            <Line type="monotone" dataKey="F" stroke={curveColor} strokeWidth={3} dot={{ fill: curveColor, r: 4 }} name="F(0,T)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Implications pratiques</SectionTitle>
      <Grid cols={2} gap="10px">
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a5}33` }}>
          <div style={{ color: T.a5, fontWeight: 700, marginBottom: 8 }}>📈 Contango</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
            <K>{"F > S"}</K> → Stocker est rentable<br />
            Signal : stocks abondants, demande faible<br />
            Stratégie : acheter spot + stocker + vendre forward = cash-and-carry arbitrage<br />
            Exemple WTI : avril 2020 (COVID)
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.error}33` }}>
          <div style={{ color: T.error, fontWeight: 700, marginBottom: 8 }}>📉 Backwardation</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
            <K>{"F < S"}</K> → Prime pour livraison immédiate<br />
            Signal : stocks faibles, demande forte<br />
            Stratégie : rouler la position short futures génère un gain (roll yield positif)<br />
            Exemple Brent : 2021-2022 (post-COVID)
          </div>
        </div>
      </Grid>

      <ExampleBlock title="Trader pétrole — Arbitrage cash-and-carry" accent={ACCENT}>
        <p><K>{"S_0 = 80"}</K>$/bbl, <K>{"r = 5\\%"}</K>, <K>{"u = 3\\%"}</K>/an, <K>{"y = 2\\%"}</K>/an, <K>{"T = 6"}</K> mois</p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Profit} = 8500 - 8328 = 172\\$ = 1.72\\$/\\text{bbl}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Cost of carry" ruleDetail="F = S₀ × e^{(r+u−y)T}" accent={ACCENT}>F théorique = <K>{"80 \\times e^{(0.05 + 0.03 - 0.02) \\times 0.5} = 80 \\times e^{0.03} = 82.44"}</K> $/bbl</DemoStep>
          <DemoStep num={2} rule="Contango" ruleDetail="F_marché > F_théorique" accent={ACCENT}>Si F marché = <K>{"85\\$/\\text{bbl} > 82.44"}</K> → Contango excessif → arbitrage possible</DemoStep>
          <DemoStep num={3} rule="Cost of carry" ruleDetail="Stratégie cash-and-carry" accent={ACCENT}>Acheter 100 barils à 80$ (emprunt 8000$ à 5%), stocker (coût 3%), vendre forward à 85$</DemoStep>
          <DemoStep num={4} rule="Cost of carry" ruleDetail="Profit = F − S₀·e^{(r+u)T}" accent={ACCENT}>Profit = <K>{"8500 - 8000 \\times e^{0.08 \\times 0.5} = 8500 - 8328 = 172\\$ = 1.72\\$/\\text{bbl}"}</K></DemoStep>
        </Demonstration>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice — Calculer le convenience yield implicite" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Brent spot = 85$/bbl, futures 3 mois = 84$/bbl, <K>{"r = 4.5\\%"}</K>/an, coût de stockage <K>{"u = 2\\%"}</K>/an. Calculez la convenience yield implicite.</p>
        <FormulaBox accent={ACCENT}><K display>{"\\delta = 11.24\\%/\\text{an} > r + u = 6.5\\%/\\text{an}"}</K> → forte backwardation implicite (marché en tension)</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Convenience yield" ruleDetail="δ = r + u − (1/T)·ln(F/S₀)" accent={ACCENT}>Formule : <K>{"\\delta = r + u - \\frac{1}{T} \\ln\\!\\left(\\frac{F}{S_0}\\right)"}</K></DemoStep>
          <DemoStep num={2} rule="Rendement de détention" ruleDetail="Conversion maturité" accent={ACCENT}><K>{"T = 3/12 = 0.25"}</K> an</DemoStep>
          <DemoStep num={3} rule="Rendement de détention" ruleDetail="ln(F/S₀)" accent={ACCENT}><K>{"\\ln(84/85) = \\ln(0.9882) = -0.01186"}</K></DemoStep>
          <DemoStep num={4} rule="Convenience yield" ruleDetail="δ = r + u − (1/T)·ln(F/S)" accent={ACCENT}><K>{"\\delta = 0.045 + 0.02 - \\frac{1}{0.25} \\times (-0.01186) = 0.065 + 0.04744 = 0.1124 = 11.24\\%"}</K>/an. Interprétation : une convenience yield de 11% signifie que le marché valorise énormément la détention du brut physique — tensions géopolitiques, demande élevée, ou contraintes logistiques.</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice — Stratégie contango vs backwardation" accent={ACCENT} badge="Avancé">
        <p style={{ color: T.text }}>Marché gaz naturel : F(Avr) = 2.5$/MMBtu, F(Oct) = 3.2$/MMBtu, r = 5%, coût stockage = 0.30$/MMBtu pour 6 mois. Analysez et proposez une stratégie.</p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Profit de stockage} = 0.34\\$/\\text{MMBtu} > 0"}</K>Arbitrage de stockage justifié. Capacité de stockage limitée → prime s'érodera si trop de traders font la même stratégie</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Contango" ruleDetail="Spread = F(Oct) − F(Avr)" accent={ACCENT}>Calendar spread Oct-Avr = <K>{"3.2 - 2.5 = 0.70"}</K> $/MMBtu sur 6 mois</DemoStep>
          <DemoStep num={2} rule="Cost of carry" ruleDetail="Coût financement = S·r·T" accent={ACCENT}>Coût de financement sur 6 mois = <K>{"2.5 \\times 0.05 \\times 0.5 = 0.0625"}</K> $/MMBtu</DemoStep>
          <DemoStep num={3} rule="Cost of carry" ruleDetail="Coût total = stockage + financement" accent={ACCENT}>Coût total du stockage = <K>{"0.30 + 0.0625 = 0.3625"}</K> $/MMBtu</DemoStep>
          <DemoStep num={4} rule="Contango" ruleDetail="Profit = Spread − Coût" accent={ACCENT}>Profit théorique du stockage = <K>{"3.2 - 2.5 - 0.3625 = 0.3375"}</K> $/MMBtu = 33.75 cts/MMBtu</DemoStep>
          <DemoStep num={5} rule="Cost of carry" ruleDetail="Stratégie cash-and-carry" accent={ACCENT}>Stratégie cash-and-carry : acheter gaz au spot (ou F Avr) à 2.5$, stocker 6 mois (coût 0.36$), vendre futures Oct à 3.2$</DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}
