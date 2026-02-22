import React, { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { T } from '../../design/tokens'
import {
  ModuleHeader, TabBar, FormulaBox, IntuitionBlock, ExampleBlock,
  Slider, Accordion, Step, SymbolLegend, SectionTitle, InfoChip, Grid, ChartWrapper,
  Demonstration, DemoStep, K,
} from '../../design/components'

const ACCENT = T.a7

function normCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const p = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  const phi = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
  return x >= 0 ? 1 - phi * p : phi * p
}
function gaussRand() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ─── Tab: EaR & CFaR ─────────────────────────────────────────────────────────
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
        nos revenus ne tomberont pas en dessous de [E - EaR]."
        Le <strong>CFaR (Cash Flow at Risk)</strong> étend ce concept sur plusieurs périodes futures.
        C'est l'équivalent de la VaR, mais pour les flux de trésorerie plutôt que pour les P&L de trading.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Earnings at Risk (1 période)">
        EaR(α) = z_α × σ_CF     où z_α = {zAlpha} pour α = {(conf * 100).toFixed(0)}%

        CF_worst = E[CF] - EaR = µ_CF - z_α × σ_CF
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="CFaR sur T périodes (cashflows iid)">
        CFaR(α, T) = z_α × σ_CF × √T
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
        <p>Production : 10 Bcf/an, prix spot moyen = 3$/MMBtu (σ=0.8$/MMBtu), vol = 30%</p>
        <FormulaBox accent={ACCENT}>Revenus minimaux cumulés (95%) = 93.7M$</FormulaBox>
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
        <p style={{ color: T.text }}>E[CF] = 100M$, σ = 25M$. Calculez EaR 95% et le CF plancher.</p>
        <FormulaBox accent={ACCENT}>CF_plancher = 100 - 41.1 = 58.9M$ (avec 95% de confiance)</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="EaR" ruleDetail="z_α × σ_CF" accent={ACCENT}><K>{"EaR = 1.645 \\times 25 = 41.1"}</K> M$ → CF plancher = <K>{"100 - 41.1 = 58.9"}</K> M$</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 2 — CFaR multi-périodes" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Une raffinerie a E[CF] = 50M$/trim, σ = 15M$/trim. CFaR 99% sur 8 trimestres ?</p>
        <FormulaBox accent={ACCENT}>CF cumulé plancher = 8×50M$ - 98.7M$ = 301.3M$</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="CFaR" ruleDetail="z_α × σ × √T" accent={ACCENT}><K>{"CFaR = z_{99\\%} \\times \\sigma \\times \\sqrt{T} = 2.326 \\times 15 \\times \\sqrt{8}"}</K></DemoStep>
          <DemoStep num={2} rule="Application numérique" ruleDetail="calcul" accent={ACCENT}><K>{"= 2.326 \\times 15 \\times 2.828 = 98.7"}</K> M$ → CF cumulé plancher = <K>{"400 - 98.7 = 301.3"}</K> M$</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 3 — EaR d'un producteur de gaz naturel" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Producteur de gaz : 50 Bcf/an de production, prix Henry Hub = 3.5$/MMBtu, σ_prix = 1.0$/MMBtu. Calculez l'EaR trimestriel à 95% et le CFaR annuel (4 trimestres).</p>
        <FormulaBox accent={ACCENT}>CF annuel plancher = 4×43.75 - 41.1 = 175 - 41.1 = 133.9M$ (vs budget 175M$)</FormulaBox>
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

// ─── Tab: RAROC ───────────────────────────────────────────────────────────────
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
        économique mobilisé. Si RAROC {'>'} Hurdle Rate (coût du capital), le projet crée de la valeur.
        C'est l'outil de décision standard dans les banques et les compagnies énergétiques intégrées.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="RAROC">
        RAROC = NIACC / EC

        NIACC = Revenus - Coûts - Pertes Attendues - (Coût du Capital × EC)
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
        <Step num={1} accent={ACCENT}><strong>Numérateur = NIACC</strong> = Revenus nets - Coûts opérationnels - Expected Loss (EL = PD × LGD × EAD). L'EL est la perte moyenne annuelle du portefeuille — c'est une charge d'exploitation normale, provisionnée chaque année.</Step>
        <Step num={2} accent={ACCENT}><strong>Dénominateur = Capital Économique</strong> = VaR à 99.9% - EL. Seule la perte inattendue (UL = Unexpected Loss) consomme du capital. La perte attendue est déjà couverte par les provisions, donc le capital protège uniquement contre les queues de distribution.</Step>
        <Step num={3} accent={ACCENT}><strong>Hurdle rate h</strong> : si RAROC {'>'} h → le projet crée de la valeur pour les actionnaires (rémunère suffisamment le capital risqué) ; si RAROC {'<'} h → le projet détruit de la valeur et doit être refusé ou restructuré pour améliorer le ratio.</Step>
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
            EL = PD × LGD × EAD<br />
            <em>PD = prob. de défaut, LGD = perte en cas de défaut, EAD = exposition au moment du défaut</em><br /><br />
            L'EL est le "coût moyen du risque" — une charge normale d'exploitation, comme une provision.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>② Dénominateur — Capital économique</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Le capital économique (EC) est le "coussin de sécurité" pour absorber les pertes <em>inattendues</em>.<br /><br />
            EC ≈ VaR 99.9% sur 1 an<br />
            = Perte que la banque/entreprise peut absorber avec 99.9% de probabilité<br /><br />
            C'est différent de l'EL (perte moyenne) — le EC couvre les queues de distribution.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a5}33` }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>③ Hurdle Rate — Le seuil minimal</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Le RAROC minimum acceptable = <strong>coût des fonds propres</strong><br /><br />
            Typiquement 10–15% selon le secteur<br /><br />
            Si RAROC {'>'} Hurdle Rate : le projet <span style={{ color: T.success }}>crée de la valeur</span> (les actionnaires sont rémunérés au-delà de leur exigence)<br />
            Si RAROC {'<'} Hurdle Rate : le projet <span style={{ color: T.error }}>détruit de la valeur</span> → à refuser ou restructurer
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
        Les activités dont RAROC {'<'} hurdle rate doivent être restructurées, réduites, ou abandonnées — même si elles sont nominalement profitables.
      </div>

      <ExampleBlock title="Décision RAROC — Projet de trading en énergie" accent={ACCENT}>
        <p>Une banque d'énergie évalue un nouveau desk de trading de dérivés gaz. Budget capital = 50M$.</p>
        <FormulaBox accent={ACCENT}>RAROC = 10.68% {'<'} Hurdle 12% → REFUSÉ. Levier : coûts à 4M$ → RAROC = 14.7% → acceptable</FormulaBox>
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
        <p>Compagnie pétrolière avec CoC = 10%. Quel projet privilégier ?</p>
        <FormulaBox accent={ACCENT}>Renouvelables (RAROC 23.7%) {'>'} Offshore (14.7%) → privilégier les renouvelables malgré des revenus bruts inférieurs</FormulaBox>
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
        <p style={{ color: T.text }}>Un desk de trading pétrole génère 25M$ de revenus bruts, 10M$ de coûts. PD = 2%, LGD = 60%, EAD = 100M$. Capital éco = 80M$. Coût du capital = 11%. Faut-il accepter ce projet ?</p>
        <FormulaBox accent={ACCENT}>RAROC = 6.25% {'<'} 11% → Projet REFUSÉ — détruit de la valeur pour les actionnaires</FormulaBox>
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

// ─── Tab: PFE ─────────────────────────────────────────────────────────────────
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
        PFE(t, α) = Quantile_α[max(V(t), 0)]

        EPE(t) = E[max(V(t), 0)]   (Expected Positive Exposure)
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
            MtM = max(V(t=maintenant), 0)<br /><br />
            Connue avec certitude, mais ne capture pas le risque futur. Un swap à valeur zéro aujourd'hui peut valoir +20M$ dans 2 ans.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>EPE — Expected Positive Exposure</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Moyenne de l'exposition positive future à chaque instant :<br />
            EPE(t) = E[max(V(t), 0)]<br /><br />
            C'est la base du calcul CVA. L'EEPE (Effective EPE) = moyenne de l'EPE sur la durée de vie = ce qu'utilise Bâle pour le capital réglementaire CCR.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.error}33` }}>
          <div style={{ color: T.error, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>PFE — Potential Future Exposure</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Worst case d'exposition à un niveau de confiance α :<br />
            PFE(t, α) = Quantile_α[max(V(t), 0)]<br /><br />
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
            La volatilité des taux (σ ≈ 1-2%) étant faible, la PFE reste modérée (3-8% du notionnel).
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Swap de commodités (pétrole, gaz)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Profil similaire mais amplifié par la volatilité élevée :<br />
            • Même structure "en bosse" que les swaps de taux<br />
            • Mais σ_pétrole ≈ 30-40%, σ_gaz ≈ 50-80% → PFE beaucoup plus grande<br />
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
            <strong>Avec netting :</strong> Exposition nette = max(10-7, 0) = 3M$ (-70%)<br /><br />
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
        <p>Notionnel = 200M$, durée = 5 ans, σ_taux = 1% (100bps), couverture 97%</p>
        <FormulaBox accent={ACCENT}>PFE max 97% ≈ 12M$ → transaction acceptée si limite contrepartie ≥ 15M$</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="PFE" ruleDetail="Profil en bosse" accent={ACCENT}>PFE pic ≈ à ~2-3 ans (milieu de vie du swap)</DemoStep>
          <DemoStep num={2} rule="PFE" ruleDetail="Quantile × Notionnel" accent={ACCENT}><K>{"PFE_{97\\%} \\approx 200 \\times N(1.88 \\times 0.01 \\times \\sqrt{2.5}) \\approx 12"}</K> M$</DemoStep>
          <DemoStep num={3} rule="Potential Future Exposure" ruleDetail="Limite de crédit" accent={ACCENT}>Cette exposition conduit à une limite de crédit de contrepartie</DemoStep>
          <DemoStep num={4} rule="PFE" ruleDetail="Décision" accent={ACCENT}>Si limite = 15M$ → la transaction est acceptée sans netting agreement</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice — PFE d'un forward sur pétrole" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Forward pétrole 1 an : notionnel = 100M$ (1M bbl à 100$/bbl), σ = 35%, r = 5%, PFE à 95%.</p>
        <FormulaBox accent={ACCENT}>PFE 95% ≈ 75.7M$ sur 100M$ de notionnel = 75.7% du notionnel (volatilité élevée !)</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="PFE" ruleDetail="Exposition forward" accent={ACCENT}>Pour un forward, l'exposition positive est max(S_T - K, 0) — similaire à un call européen</DemoStep>
          <DemoStep num={2} rule="Potential Future Exposure" ruleDetail="Quantile log-normal" accent={ACCENT}>PFE 95% : <K>{"S_T = 100 \\times e^{(0.05 - 0.5 \\times 0.35^2) + 1.645 \\times 0.35}"}</K></DemoStep>
          <DemoStep num={3} rule="Application numérique" ruleDetail="calcul" accent={ACCENT}><K>{"= 100 \\times e^{0.564} = 100 \\times 1.757 = 175.7"}</K> $/bbl</DemoStep>
          <DemoStep num={4} rule="PFE" ruleDetail="Exposition en $" accent={ACCENT}>Exposition = <K>{"\\max(175.7 - 100, 0) \\times 1M = 75.7"}</K> M$. La banque doit réserver cette capacité de crédit. Si limite = 50M$, trade non autorisé sans netting ou collatéral.</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice — Impact du netting sur l'exposition" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Même contrepartie, 3 trades : Trade A (MtM = +15M$), Trade B (MtM = -8M$), Trade C (MtM = +4M$). Comparez l'exposition brute vs nette.</p>
        <FormulaBox accent={ACCENT}>Netting ratio = Exposition nette / Exposition brute = 11/19 = 58% (plus bas = meilleure efficacité)</FormulaBox>
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

// ─── Tab: CVA ─────────────────────────────────────────────────────────────────
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
        En pratique : Prix_réel = Prix_risque_neutre - CVA.
        Le CVA est devenu une contrainte réglementaire majeure depuis la crise de 2008.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="CVA unilatéral — formule discrète">
        CVA = Σᵢ PD(tᵢ₋₁, tᵢ) × LGD × EE(tᵢ) × DF(tᵢ)

        CVA ≈ LGD × ∫₀ᵀ PD(0,t) × EE(t) × DF(t) dt
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
        <Step num={1} accent={ACCENT}><strong>B(0,t) = e^(-rt)</strong> — facteur d'actualisation : valeur actuelle de 1€ reçu au temps t. Une perte dans 5 ans vaut moins qu'une perte aujourd'hui. Ce terme pénalise les pertes lointaines et rend le CVA sensible au niveau des taux d'intérêt.</Step>
        <Step num={2} accent={ACCENT}><strong>EE(t) = E[max(V(t), 0)]</strong> — exposition espérée positive : on ne perd que si on est créancier net (V {'>'} 0). Si la contrepartie nous doit de l'argent et fait défaut, on perd EE(t). Si on lui doit de l'argent (V {'<'} 0), la perte est nulle — d'où le max(V, 0).</Step>
        <Step num={3} accent={ACCENT}><strong>PD(t-1, t)</strong> — probabilité de défaut marginale entre t-1 et t, extraite des spreads CDS ou des ratings. Pour une contrepartie Investment Grade (BBB) : PD ≈ 0.15-0.25%/an. Pour un High Yield (BB) : PD ≈ 1-3%/an.</Step>
        <Step num={4} accent={ACCENT}><strong>LGD = 1 - Recovery Rate</strong> — Loss Given Default : fraction de l'exposition perdue en cas de défaut. Typiquement 60% pour les banques (Recovery = 40%). Pour les dérivés non collatéralisés, LGD peut atteindre 70-80%.</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : CVA ≈ LGD × EPE × spread / DiscountFactor (approximation courante). L'EPE (Expected Positive Exposure) est la moyenne temporelle des EE(t). Cette formule montre que le CVA est un produit de crédit sur la durée de vie du dérivé — plus le spread CDS est élevé, plus le CVA est important.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>La formule CVA décortiquée — Terme par terme</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        CVA = Σₜ B(0,t) × EE(t) × PD(t-1, t) × LGD
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
        <br />• <strong>Clearing central (CCP)</strong> : LGD ≈ 0 (la CCP garantit le paiement via le Default Fund) → CVA quasi nul pour les dérivés compensés
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
        <p>Swap pétrole 3 ans, EE_moy = 8M$, PD_ann = 1.5% (rating BBB), LGD = 60%, r = 4%</p>
        <FormulaBox accent={ACCENT}>CVA ≈ 0.200M$ soit 0.2% du notionnel. Si downgrade BB (PD=5%) → CVA ≈ 0.66M$ (+230%)</FormulaBox>
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
        <p style={{ color: T.text }}>Options énergie 1 an, EE=5M$, PD=2%, LGD=60%, r=5%</p>
        <FormulaBox accent={ACCENT}>CVA = 57,100$ soit 1.14% de l'EE</FormulaBox>
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
        <p style={{ color: T.text }}>Swap pétrole 2 ans, notionnel 50M$, EE moyen = 6M$, contrepartie rating BBB (PD = 1.8%/an), LGD = 60%, r = 4%. Calculez le CVA total.</p>
        <FormulaBox accent={ACCENT}>CVA = 0.245% du notionnel → ajustement du prix de vente du swap de 12.5 bps/an</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="CVA" ruleDetail="Σ PD × LGD × EE × DF" accent={ACCENT}>CVA discret sur 2 ans (annuel) : <K>{"CVA = \\sum PD \\times LGD \\times EE \\times DF"}</K></DemoStep>
          <DemoStep num={2} rule="Credit Valuation Adjustment" ruleDetail="Période 1" accent={ACCENT}>t=1 : <K>{"0.018 \\times 0.60 \\times 6 \\times e^{-0.04} = 0.0625"}</K> M$</DemoStep>
          <DemoStep num={3} rule="Credit Valuation Adjustment" ruleDetail="Période 2" accent={ACCENT}>t=2 : <K>{"0.018 \\times 0.60 \\times 6 \\times e^{-0.08} = 0.0600"}</K> M$</DemoStep>
          <DemoStep num={4} rule="CVA" ruleDetail="Total" accent={ACCENT}>CVA total = <K>{"0.0625 + 0.0600 = 0.1225"}</K> M$ = 122,500$</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 4 — Wrong-Way Risk" accent={ACCENT} badge="Avancé">
        <p style={{ color: T.text }}>Un producteur pétrolier achète un put WTI à une contrepartie dont la santé financière est corrélée positivement au prix du pétrole. Expliquez le "Wrong-Way Risk" et son impact sur le CVA.</p>
        <FormulaBox accent={ACCENT}>WWR = CVA_réel / CVA_indépendant {'>'} 1 → toujours vérifier si la contrepartie est exposée au même risque que vous !</FormulaBox>
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

// ─── Main Module 7 ────────────────────────────────────────────────────────────
const TABS = ['EaR & CFaR', 'RAROC', 'PFE', 'CVA']

export default function Module7() {
  const [tab, setTab] = useState('EaR & CFaR')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      <ModuleHeader
        num={7}
        title="Risk Management & Contrepartie"
        subtitle="Gestion du risque financier des entreprises énergétiques : Earnings at Risk (EaR), rentabilité ajustée RAROC, exposition de contrepartie (PFE) et ajustement de valorisation (CVA)."
        accent={ACCENT}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} accent={ACCENT} />
      {tab === 'EaR & CFaR' && <EaRTab />}
      {tab === 'RAROC' && <RAROCTab />}
      {tab === 'PFE' && <PFETab />}
      {tab === 'CVA' && <CVATab />}
    </div>
  )
}
