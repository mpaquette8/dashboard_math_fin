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

export function OptionsTab() {
  const [F, setF] = useState(80)
  const [strike, setStrike] = useState(82)
  const [T2, setT2] = useState(0.5)
  const [r, setR] = useState(0.05)
  const [sigma, setSigma] = useState(0.35)

  const callPrice = black76(F, strike, T2, r, sigma, 'call')
  const putPrice = black76(F, strike, T2, r, sigma, 'put')

  const sqrtT = Math.sqrt(T2)
  const d1 = (Math.log(F / strike) + 0.5 * sigma * sigma * T2) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT
  const df = Math.exp(-r * T2)

  const delta_call = df * normCDF(d1)
  const delta_put = df * (normCDF(d1) - 1)
  const gamma = df * phi(d1) / (F * sigma * sqrtT)
  const vega = F * df * phi(d1) * sqrtT / 100
  const theta_call = -(F * df * phi(d1) * sigma / (2 * sqrtT) + r * F * df * normCDF(d1) - r * strike * df * normCDF(d2)) / 365

  // Payoff profile at expiry
  const payoffData = useMemo(() => {
    const pts = []
    for (let f = F * 0.5; f <= F * 1.7; f += F * 0.02) {
      pts.push({
        F: +f.toFixed(1),
        callPayoff: +Math.max(f - strike, 0).toFixed(2),
        putPayoff: +Math.max(strike - f, 0).toFixed(2),
        callPnL: +(Math.max(f - strike, 0) - callPrice).toFixed(2),
        putPnL: +(Math.max(strike - f, 0) - putPrice).toFixed(2),
      })
    }
    return pts
  }, [F, strike, callPrice, putPrice])

  // Price vs strike
  const strikeData = useMemo(() => {
    const pts = []
    for (let k = F * 0.7; k <= F * 1.4; k += F * 0.02) {
      pts.push({
        K: +k.toFixed(1),
        call: +black76(F, k, T2, r, sigma, 'call').toFixed(2),
        put: +black76(F, k, T2, r, sigma, 'put').toFixed(2),
      })
    }
    return pts
  }, [F, T2, r, sigma])

  const moneyness = strike < F ? 'ITM (Call)' : strike > F ? 'OTM (Call)' : 'ATM'
  const moneynessColor = strike < F ? T.success : strike > F ? T.error : T.a5

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Les options sur commodités énergétiques ne sont pas utilisées par les mêmes acteurs avec les mêmes objectifs que les options financières. Comprendre qui achète quoi et pourquoi est essentiel pour structurer les bons instruments.
      </div>
      <Grid cols={3} gap="10px" style={{ marginBottom: 14 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.error}33` }}>
          <div style={{ color: T.error, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Producteurs (pétrole, gaz)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            <strong>Exposition :</strong> long physique → craignent la baisse des prix<br /><br />
            <strong>Stratégies :</strong><br />
            • Achat de puts (protection floor sur les revenus)<br />
            • Vente de calls (capez l'upside pour financer le put)<br />
            • Collar = Long put K₁ + Short call K₂ (stratégie la plus répandue)<br />
            • Vente de forwards (couverture linéaire simple)<br /><br />
            <strong>Exemple :</strong> ExxonMobil, Shell couvrent typiquement 30-70% de leur production via collars.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.success}33` }}>
          <div style={{ color: T.success, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Consommateurs industriels</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            <strong>Exposition :</strong> short physique → craignent la hausse des prix<br /><br />
            <strong>Acteurs :</strong> raffineries, chimie, transports aériens (kérosène), utilities<br /><br />
            <strong>Stratégies :</strong><br />
            • Achat de calls (cap sur le prix d'achat du carburant)<br />
            • Achat de swaps (prix fixe vs flottant)<br />
            • Collars inversés (Long call + Short put)<br /><br />
            <strong>Exemple :</strong> Air France-KLM couvre 50-80% de sa consommation de kérosène 12 mois à l'avance.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Utilities (production d'électricité)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            <strong>Exposition complexe :</strong> achètent gaz (coût), vendent électricité (revenu) → exposition au spark spread<br /><br />
            <strong>Stratégies spécifiques :</strong><br />
            • Spark spread options (option sur la marge de production)<br />
            • Cross-commodity hedges (gaz + électricité simultanément)<br />
            • Load-following swaps (volume variable selon la demande)<br /><br />
            <strong>Complexité :</strong> Ces structures nécessitent une modélisation de la corrélation gaz-électricité.
          </div>
        </div>
      </Grid>

      <IntuitionBlock emoji="🛢️" title="Black 76 : pricer les options sur futures d'énergie" accent={ACCENT}>
        Dans les marchés d'énergie, on trade des options sur <strong>futures</strong> (et non sur le spot).
        Le modèle de Black-Scholes classique suppose un sous-jacent spot.
        Le modèle <strong>Black 76</strong> (Fischer Black, 1976) adapte B-S pour les futures :
        on remplace <K>{"S \\times e^{rT}"}</K> par <K>{"F"}</K> directement — le forward est le sous-jacent.
        C'est le standard industriel pour les options sur pétrole, gaz, électricité.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Black-76 — Options sur futures">
        <K display>{"C = e^{-rT}[F \\cdot N(d_1) - K \\cdot N(d_2)]"}</K>
        <K display>{"P = e^{-rT}[K \\cdot N(-d_2) - F \\cdot N(-d_1)]"}</K>
        <K display>{"d_1 = \\frac{\\ln(F/K) + (\\sigma^2/2)T}{\\sigma\\sqrt{T}}"}</K>
        <K display>{"d_2 = d_1 - \\sigma\\sqrt{T}"}</K>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Stratégies de couverture typiques avec des options énergie</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Les options permettent de construire des profils de gain asymétriques — on peut se protéger à la baisse tout en conservant une participation à la hausse, ce que les forwards ne permettent pas.
      </div>
      <Grid cols={3} gap="10px" style={{ marginBottom: 14 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.error}33` }}>
          <div style={{ color: T.error, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Collar (Tunnel)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Structure : Long Put <K>{"K_1"}</K> + Short Call <K>{"K_2"}</K> (<K>{"K_1 < K_2"}</K>)<br /><br />
            <strong>Profil :</strong> protection en dessous de K₁, participation entre K₁ et K₂, capped au-delà de K₂<br /><br />
            <strong>Coût :</strong> faible ou nul si K₁ et K₂ sont choisis pour que primes s'annulent (zero-cost collar)<br /><br />
            <strong>Usage :</strong> très répandu chez les producteurs pétroliers. Garantit un corridor de prix [K₁, K₂].
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a5}33` }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Swap synthétique</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Structure : Long Put K + Short Call K (même strike)<br /><br />
            <strong>Équivalent à un forward</strong> (parité put-call) : transforme le prix variable en prix fixe K<br /><br />
            <strong>Avantage vs forward :</strong> peut être structuré OTC avec des termes flexibles (volume, maturité)<br /><br />
            <strong>Usage :</strong> producteurs qui veulent un prix de vente fixe, équivalent à vendre un forward.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a3}33` }}>
          <div style={{ color: T.a3, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Participation (3-way collar)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Structure : Long Put <K>{"K_1"}</K> + Short Put <K>{"K_0"}</K> + Short Call <K>{"K_2"}</K> (<K>{"K_0 < K_1 < K_2"}</K>)<br /><br />
            <strong>Profil :</strong> protection partielle entre K₀ et K₁, pleine protection entre K₁ et K₂, participation aux hausses<br /><br />
            <strong>Coût :</strong> moins cher que le collar simple (vente du put K₀ réduit le coût)<br /><br />
            <strong>Usage :</strong> producteurs qui acceptent un risque partiel à la baisse pour réduire le coût de couverture.
          </div>
        </div>
      </Grid>

      <SectionTitle accent={ACCENT}>Spark Spread — L'option de production des centrales électriques</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Le <strong style={{ color: ACCENT }}>spark spread</strong> est la différence entre le prix de l'électricité produite et le coût du gaz naturel nécessaire pour la produire. C'est la marge brute d'une centrale à cycle combiné (CCGT).
      </div>
      <FormulaBox accent={ACCENT} label="Spark Spread">
        <K display>{"\\text{Spark Spread} = P_{\\text{élec}} - \\text{Heat Rate} \\times P_{\\text{gaz}}"}</K>
        <K display>{"= 45 - 7 \\times 3 = 45 - 21 = 24\\$/\\text{MWh} \\;\\Rightarrow\\; \\text{centrale profitable}"}</K>
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Une <strong>option spark spread</strong> donne à son détenteur le droit de produire de l'électricité si le spark spread dépasse un seuil. C'est l'outil de valorisation des actifs de production flexibles (centrales à gaz, turbines à vapeur).
        Si <K>{"\\text{Spark Spread} > 0"}</K> : la centrale produit (elle est "in the money"). Si <K>{"\\text{Spark Spread} < 0"}</K> : la centrale s'arrête (coûte moins cher d'acheter l'électricité sur le marché).
        La valorisation d'une centrale à gaz = somme des options spark spread sur toute sa durée de vie.
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie d'un spark spread option</div>
        <Step num={1} accent={ACCENT}><strong><K>{"\\text{Heat Rate} \\times P_{\\text{gaz}}"}</K></strong> = coût du combustible pour produire 1 MWh d'électricité. Si Heat Rate = 7 MMBtu/MWh et P_gaz = 3$/MMBtu, le coût variable de production est <K>{"7 \\times 3 = 21\\$/\\text{MWh}"}</K>. Ce terme est le "strike implicite" de l'option.</Step>
        <Step num={2} accent={ACCENT}><strong><K>{"P_{\\text{élec}} - \\text{Heat Rate} \\times P_{\\text{gaz}}"}</K></strong> = marge brute de la centrale à gaz (spark spread). Si P_élec = 45$/MWh : <K>{"\\text{spark spread} = 45 - 21 = 24\\$/\\text{MWh}"}</K>. Ce spread est la "valeur intrinsèque" de la flexibilité de production.</Step>
        <Step num={3} accent={ACCENT}><strong><K>{"\\max(\\text{spread} - K,\\, 0)"}</K></strong> = payoff de l'option sur ce spread, où K est le coût fixe de démarrage. Valorise la flexibilité de démarrage : si K = 0, l'option vaut le spread positif. La volatilité conjointe de <K>{"P_{\\text{élec}}"}</K> et <K>{"P_{\\text{gaz}}"}</K> détermine la valeur temps.</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : la centrale à gaz est une option réelle sur le spark spread. Sa valeur totale = somme des options spark spread sur toute sa durée de vie (approche Margrabe). Si <K>{"\\text{spread} < 0"}</K> → ne pas démarrer (option out-of-the-money). Les centrales ont une optionalité qui disparaît dans un monde sans flexibilité.
        </div>
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Crack spread (pétrole) :</strong> Équivalent pour les raffineries = <K>{"P_{\\text{raffinés}} - P_{\\text{brut}}"}</K>. Exemple : <K>{"\\text{3-2-1 crack} = (2 \\times \\text{gasoil} + 1 \\times \\text{essence}) - 3 \\times \\text{brut}"}</K>. Indicateur de marge de raffinage. Les raffineries couvrent ce spread pour sécuriser leur marge de transformation.
      </div>

      <ExampleBlock title="Producteur pétrolier — Mise en place d'un collar" accent={ACCENT}>
        <p>Producteur WTI : production 1M bbl dans 6 mois, <K>{"F = 80"}</K>$/bbl, <K>{"\\sigma = 35\\%"}</K>. Objectif : protéger les revenus en dessous de 70$/bbl, accepter de plafonner à 95$/bbl pour financer la protection.</p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Collar zero-cost } [70\\$,\\; 97\\$]"}</K>Revenus garantis entre 70M$ et 97M$ quel que soit le prix du WTI</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Collar" ruleDetail="Long Put K₁ + Short Call K₂" accent={ACCENT}>Besoin : Long Put K₁=70 + Short Call K₂=95 (collar zero-cost si possible)</DemoStep>
          <DemoStep num={2} rule="Black-76" ruleDetail="Put = e^{−rT}[K·N(−d₂) − F·N(−d₁)]" accent={ACCENT}>Put K=70, F=80, T=0.5, σ=35%, r=5% : <K>{"\\text{Put B76} = e^{-0.025}[70 N(0.58) - 80 N(0.33)] \\approx 2.8\\$/\\text{bbl}"}</K></DemoStep>
          <DemoStep num={3} rule="Black-76" ruleDetail="Call = e^{−rT}[F·N(d₁) − K·N(d₂)]" accent={ACCENT}>Call K=95, F=80, T=0.5, σ=35%, r=5% : <K>{"\\text{Call B76} = e^{-0.025}[80 N(-0.64) - 95 N(-0.89)] \\approx 2.3\\$/\\text{bbl}"}</K></DemoStep>
          <DemoStep num={4} rule="Collar" ruleDetail="Coût net = Put − Call" accent={ACCENT}>Coût net du collar = <K>{"\\text{Put} - \\text{Call} = 2.8 - 2.3 = 0.5\\$/\\text{bbl}"}</K></DemoStep>
          <DemoStep num={5} rule="Cap + Floor" ruleDetail="Ajustement zero-cost" accent={ACCENT}>Pour zero-cost : ajuster K₂ à 97$/bbl (call légèrement plus OTM → prime plus faible ≈ 2.8$)</DemoStep>
          <DemoStep num={6} rule="Collar" ruleDetail="Corridor de prix garanti" accent={ACCENT}>Résultat : plancher de revenus = <K>{"70\\$/\\text{bbl} \\times 1\\text{M} = 70\\text{M\\$}"}</K>, plafond = 97M$, coût = zéro</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '12px 0', fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Différence clé vs Black-Scholes :</strong> pas de terme <K>{"e^{rT}"}</K> devant F.
        Le futures trade à son prix d'équilibre sans coût de financement dans la formule.
        F a déjà intégré le coût de portage (<K>{"r + u - y"}</K>). On actualise seulement le payoff.
      </div>

      <SymbolLegend accent={ACCENT} symbols={[
        ['F', 'Prix du futures (forward) sur la commodité'],
        ['K', 'Strike (prix d\'exercice)'],
        ['T', 'Temps à maturité en années'],
        ['r', 'Taux sans risque (actualisation du payoff)'],
        ['σ', 'Volatilité implicite du futures'],
        ['d₁, d₂', 'Probabilités risque-neutres ajustées'],
      ]} />

      <SectionTitle accent={ACCENT}>Pricer Black 76 interactif</SectionTitle>
      <Grid cols={3} gap="10px">
        <Slider label="F — Prix futures ($/bbl)" value={F} min={30} max={150} step={0.5} onChange={setF} accent={ACCENT} format={v => `${v}$`} />
        <Slider label="K — Strike ($/bbl)" value={strike} min={30} max={150} step={0.5} onChange={setStrike} accent={T.a5} format={v => `${v}$`} />
        <Slider label="T — Maturité (années)" value={T2} min={0.05} max={2} step={0.05} onChange={setT2} accent={T.a4} format={v => `${v.toFixed(2)}a`} />
        <Slider label="r — Taux sans risque" value={r} min={0.01} max={0.1} step={0.005} onChange={setR} accent={T.muted} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="σ — Volatilité implicite" value={sigma} min={0.05} max={1.2} step={0.01} onChange={setSigma} accent={T.a3} format={v => `${(v * 100).toFixed(0)}%`} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
        <InfoChip label="Call Price" value={`${callPrice.toFixed(2)}$`} accent={T.success} />
        <InfoChip label="Put Price" value={`${putPrice.toFixed(2)}$`} accent={T.error} />
        <InfoChip label="d₁" value={d1.toFixed(3)} accent={ACCENT} />
        <InfoChip label="d₂" value={d2.toFixed(3)} accent={T.a5} />
        <InfoChip label="N(d₁)" value={normCDF(d1).toFixed(4)} accent={T.a4} />
        <InfoChip label="Moneyness" value={moneyness} accent={moneynessColor} />
      </div>

      <SectionTitle accent={ACCENT}>Greeks (Black 76)</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { name: 'Δ Call', value: delta_call.toFixed(4), color: T.success },
          { name: 'Δ Put', value: delta_put.toFixed(4), color: T.error },
          { name: 'Γ', value: gamma.toFixed(5), color: ACCENT },
          { name: 'ν (per 1%)', value: vega.toFixed(3), color: T.a3 },
          { name: 'Θ Call/j', value: theta_call.toFixed(3), color: T.a5 },
        ].map(g => (
          <div key={g.name} style={{ background: T.panel2, borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: `1px solid ${T.border}` }}>
            <div style={{ color: T.muted, fontSize: 11, fontWeight: 600 }}>{g.name}</div>
            <div style={{ color: g.color, fontFamily: 'monospace', fontSize: 14, fontWeight: 700, marginTop: 4 }}>{g.value}</div>
          </div>
        ))}
      </div>

      <Grid cols={2} gap="12px">
        <ChartWrapper title="Profil de payoff et P&L à maturité" accent={ACCENT} height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={payoffData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="F" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} label={{ value: 'F_T', fill: T.muted, fontSize: 10 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <ReferenceLine y={0} stroke={T.border} />
              <ReferenceLine x={strike} stroke={T.a5} strokeDasharray="4 3" label={{ value: `K=${strike}`, fill: T.a5, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
              <Line type="monotone" dataKey="callPnL" stroke={T.success} strokeWidth={2} dot={false} name="P&L Call" />
              <Line type="monotone" dataKey="putPnL" stroke={T.error} strokeWidth={2} dot={false} name="P&L Put" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Prix Call/Put vs Strike" accent={T.a5} height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={strikeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="K" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <ReferenceLine x={F} stroke={T.muted} strokeDasharray="4 3" label={{ value: 'F', fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
              <Line type="monotone" dataKey="call" stroke={T.success} strokeWidth={2} dot={false} name="Call" />
              <Line type="monotone" dataKey="put" stroke={T.error} strokeWidth={2} dot={false} name="Put" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>

      <ExampleBlock title="Option call sur WTI Futures — Couverture producteur" accent={ACCENT}>
        <p>Producteur pétrole vend sa production à terme. F = 80$/bbl, veut se protéger contre hausse K=85$.</p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Call} \\approx 5.75\\$/\\text{bbl}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Black-76" ruleDetail="Paramètres de l'option" accent={ACCENT}>Call OTM : K=85, F=80, T=0.5, σ=35%, r=5%</DemoStep>
          <DemoStep num={2} rule="Black-76" ruleDetail="d₁ = [ln(F/K) + σ²T/2] / (σ√T)" accent={ACCENT}><K>{"d_1 = \\frac{\\ln(80/85) + 0.5 \\times 0.35^2 \\times 0.5}{0.35 \\times \\sqrt{0.5}} = \\frac{-0.0606 + 0.0306}{0.2475} = -0.1212"}</K></DemoStep>
          <DemoStep num={3} rule="Black-76" ruleDetail="d₂ = d₁ − σ√T" accent={ACCENT}><K>{"d_2 = -0.1212 - 0.2475 = -0.3687"}</K></DemoStep>
          <DemoStep num={4} rule="Pricing futures options" ruleDetail="C = e^{−rT}[F·N(d₁) − K·N(d₂)]" accent={ACCENT}><K>{"\\text{Call} = e^{-0.025}[80 N(-0.12) - 85 N(-0.37)] = 0.9753 \\times [80 \\times 0.452 - 85 \\times 0.356]"}</K></DemoStep>
          <DemoStep num={5} rule="Pricing futures options" ruleDetail="Résultat final" accent={ACCENT}><K>{"= 0.9753 \\times [36.16 - 30.26] = 0.9753 \\times 5.90 \\approx 5.75\\$/\\text{bbl}"}</K></DemoStep>
        </Demonstration>
      </ExampleBlock>

      <Accordion title="Exercice — Call gaz naturel sur futures" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}><K>{"F = 3"}</K>$/MMBtu, <K>{"K = 3.5"}</K>$, <K>{"T = 3"}</K> mois, <K>{"\\sigma = 60\\%"}</K>, <K>{"r = 5\\%"}</K>. Calculez Call Black 76.</p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Call} \\approx 0.9876 \\times 0.188 \\approx 0.186\\$/\\text{MMBtu}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Black-76" ruleDetail="d₁ = [ln(F/K) + σ²T/2] / (σ√T)" accent={ACCENT}><K>{"d_1 = \\frac{\\ln(3/3.5) + 0.5 \\times 0.36 \\times 0.25}{0.6 \\times 0.5} = \\frac{-0.1542 + 0.045}{0.3} = -0.364"}</K></DemoStep>
          <DemoStep num={2} rule="Black-76" ruleDetail="d₂ = d₁ − σ√T" accent={ACCENT}><K>{"d_2 = -0.364 - 0.3 = -0.664"}</K></DemoStep>
          <DemoStep num={3} rule="Pricing futures options" ruleDetail="Lecture table N(·)" accent={ACCENT}><K>{"N(d_1) = N(-0.364) \\approx 0.358"}</K> ; <K>{"N(d_2) = N(-0.664) \\approx 0.253"}</K></DemoStep>
          <DemoStep num={4} rule="Pricing futures options" ruleDetail="C = e^{−rT}[F·N(d₁) − K·N(d₂)]" accent={ACCENT}><K>{"\\text{Call} = e^{-0.0125} \\times [3 \\times 0.358 - 3.5 \\times 0.253] = 0.9876 \\times [1.074 - 0.886] \\approx 0.186\\$/\\text{MMBtu}"}</K></DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice — Calculer le coût d'un collar pétrole" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Producteur pétrole. <K>{"F = 75"}</K>$/bbl, <K>{"T = 1"}</K> an, <K>{"\\sigma = 40\\%"}</K>, <K>{"r = 5\\%"}</K>. Calculez le coût d'un collar <K>{"[60\\$,\\; 90\\$]"}</K> et déterminez le strike <K>{"K_2"}</K> pour un collar zero-cost.</p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Zero-cost : } \\text{Call} \\approx \\text{Put} \\approx 4.56\\$/\\text{bbl}"}</K>Collar final : [60$, 83$] à coût nul</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Black-76" ruleDetail="d₁, d₂ pour Put K=60" accent={ACCENT}>Put K=60 : <K>{"d_1 = \\frac{\\ln(75/60) + 0.5 \\times 0.16}{0.4} = \\frac{0.2231 + 0.08}{0.4} = 0.758"}</K> ; <K>{"d_2 = 0.758 - 0.4 = 0.358"}</K></DemoStep>
          <DemoStep num={2} rule="Black-76" ruleDetail="P = e^{−rT}[K·N(−d₂) − F·N(−d₁)]" accent={ACCENT}><K>{"\\text{Put} = e^{-0.05}[60 N(-0.358) - 75 N(-0.758)] = 0.9512 \\times [21.6 - 16.8] = 4.56\\$/\\text{bbl}"}</K></DemoStep>
          <DemoStep num={3} rule="Black-76" ruleDetail="d₁, d₂ pour Call K=90" accent={ACCENT}>Call K=90 : <K>{"d_1 = \\frac{\\ln(75/90) + 0.08}{0.4} = \\frac{-0.182 + 0.08}{0.4} = -0.255"}</K> ; <K>{"d_2 = -0.655"}</K></DemoStep>
          <DemoStep num={4} rule="Black-76" ruleDetail="C = e^{−rT}[F·N(d₁) − K·N(d₂)]" accent={ACCENT}><K>{"\\text{Call} = e^{-0.05}[75 N(-0.255) - 90 N(-0.655)] = 0.9512 \\times [29.9 - 23.1] = 6.47\\$/\\text{bbl}"}</K></DemoStep>
          <DemoStep num={5} rule="Collar" ruleDetail="Coût net = Put − Call" accent={ACCENT}>Coût net = <K>{"\\text{Put} - \\text{Call} = 4.56 - 6.47 = -1.91\\$/\\text{bbl}"}</K> (crédit ! Le call vaut plus que le put → K₂ trop bas)</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice — Valoriser un swap de prix fixe avec Black-76" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Un industriel achète 100,000 MMBtu de gaz/mois pendant 12 mois. Il signe un swap : il paie prix fixe <K>{"K = 3.2"}</K>$/MMBtu, reçoit Henry Hub spot mensuel. <K>{"F_{\\text{mois}} = 3.0"}</K> à <K>{"3.5"}</K>$/MMBtu selon la maturité. Calculez la valeur du swap.</p>
        <FormulaBox accent={ACCENT}><K display>{"V_{\\text{swap}} = \\sum_{m=1}^{12} (F_m - K) \\times Q \\times DF_m"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Swap valuation" ruleDetail="V = Σ (Fₘ − K) × Q × DFₘ" accent={ACCENT}>Le swap = somme de 12 forwards mensuels. Valeur de chaque forward = <K>{"(F_m - K) \\times \\text{Volume} \\times DF_m"}</K></DemoStep>
          <DemoStep num={2} rule="Valeur mark-to-market" ruleDetail="Forward mois 1" accent={ACCENT}>Mois 1 : F₁=3.0$, <K>{"(3.0 - 3.2) \\times 100{,}000 \\times e^{-0.05/12} = -0.2 \\times 100{,}000 \\times 0.996 = -19{,}920\\$"}</K></DemoStep>
          <DemoStep num={3} rule="Valeur mark-to-market" ruleDetail="Forward mois 6" accent={ACCENT}>Mois 6 : F₆=3.25$, <K>{"(3.25 - 3.2) \\times 100{,}000 \\times e^{-0.025} = +0.05 \\times 100{,}000 \\times 0.975 = +4{,}875\\$"}</K></DemoStep>
          <DemoStep num={4} rule="Valeur mark-to-market" ruleDetail="Forward mois 12" accent={ACCENT}>Mois 12 : F₁₂=3.5$, <K>{"(3.5 - 3.2) \\times 100{,}000 \\times e^{-0.05} = +0.3 \\times 100{,}000 \\times 0.951 = +28{,}530\\$"}</K>. Point clé : la valeur d'un swap de commodités à prix fixe est simplement la somme actualisée des forwards implicites. Si la courbe est en backwardation, le swap aura une valeur positive pour l'acheteur sur les premières maturités et négative sur les dernières.</DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

export function CasIntegrateurTab() {
  const [step, setStep] = useState(1)
  const steps = [1, 2, 3, 4, 5, 6, 7, 8]

  const caseData = {
    company: 'EnergyCo SA',
    production: '10 Mbbl/an',
    spotPrice: 80,
    sigma: 0.35,
    r: 0.05,
    hedgeRatio: 0.7,
  }

  const stepContent = [
    {
      num: 1, module: 'M1', color: T.a1, title: 'Modélisation mathématique',
      content: <>{"Les rendements log-quotidiens du WTI : "}<K>{"r_i = \\ln(S_i/S_{i-1}) \\sim \\mathcal{N}(\\mu, \\sigma^2)"}</K>{".\n        Delta de la couverture : "}<K>{"\\partial V / \\partial S"}</K>{" \u2014 on d\u00e9rive le P&L par rapport au prix du p\u00e9trole.\n        Vega : "}<K>{"\\partial V / \\partial \\sigma"}</K>{" \u2014 sensibilit\u00e9 aux changements de volatilit\u00e9."}</>,
      formula: <K display>{"r_{\\log} = \\ln\\!\\left(\\frac{S_t}{S_{t-1}}\\right) ; \\quad \\Delta = \\frac{\\partial V}{\\partial S} ; \\quad \\nu = \\frac{\\partial V}{\\partial \\sigma}"}</K>,
    },
    {
      num: 2, module: 'M2', color: T.a2, title: 'Distribution des prix',
      content: <>{"Le prix du WTI suit (en premi\u00e8re approximation) une distribution log-normale.\n        "}<K>{"E[S_T] = S_0 \\times e^{\\mu T} = 80 \\times e^{0.08} = 86.6\\$/\\text{bbl}"}</K>{"\n        "}<K>{"P(S_T < 60\\$) = N\\!\\left[\\frac{\\ln(60/80) - 0.055}{0.35}\\right] = N(-1.10) \\approx 13.6\\%"}</K></>,
      formula: <K display>{"\\ln(S_T/S_0) \\sim \\mathcal{N}\\!\\left((\\mu - \\sigma^2/2)T,\\; \\sigma^2 T\\right) \\;\\Rightarrow\\; P(S_T < K) = N(d_2)"}</K>,
    },
    {
      num: 3, module: 'M3', color: T.a3, title: 'Processus stochastique',
      content: <>{"Le WTI suit un GBM (avec correction possible pour mean-reversion \u00e0 long terme).\n        "}<K>{"dS = \\mu S\\, dt + \\sigma S\\, dW"}</K>{"; \u00b5 = 8%/an, \u03c3 = 35%/an.\n        Simulation de 1000 trajectoires \u2192 distribution de prix \u00e0 1 an."}</>,
      formula: <K display>{"dS = \\mu S\\, dt + \\sigma S\\, dW \\;\\Rightarrow\\; S_T = 80 \\times \\exp\\!\\left[(0.08 - 0.35^2/2)T + 0.35\\sqrt{T}\\,Z\\right]"}</K>,
    },
    {
      num: 4, module: 'M4', color: T.a4, title: 'Pricing des options',
      content: <>{"Put de protection sur futures WTI : K=75$/bbl, T=6 mois, \u03c3=35%.\n        Black 76 : "}<K>{"F = S \\times e^{(r+u-y)T} \\approx 80.8\\$/\\text{bbl}"}</K>{" (l\u00e9g\u00e8re contango).\n        "}<K>{"\\text{Put B76} = 0.9753 \\times [75 N(0.214) - 80.8 N(-0.034)] \\approx 4.2\\$/\\text{bbl}"}</K></>,
      formula: <K display>{"P_{75} = e^{-rT}[K \\cdot N(-d_2) - F \\cdot N(-d_1)] \\approx 4.2\\$/\\text{bbl} = 42{,}000\\$"}</K>,
    },
    {
      num: 5, module: 'M5', color: T.a5, title: 'Volatilité & smile',
      content: <>{"Vol implicite du march\u00e9 : "}<K>{"\\sigma_{\\text{impl}}(K{=}70) = 42\\% > \\sigma_{\\text{impl}}(\\text{ATM}) = 35\\%"}</K>{".\n        Skew n\u00e9gatif : les options OTM puts co\u00fbtent plus cher (protection contre crash).\n        Vol historique 30j : "}<K>{"\\sigma_{\\text{hist}} = \\text{std}(r_{\\log}) \\times \\sqrt{252} \\approx 32\\%"}</K>{"\n        Vol implicite > vol historique \u2192 prime de risque positive."}</>,
      formula: <K display>{"\\sigma_{\\text{impl}}(K) \\text{ extraite : } C_{\\text{march\u00e9}} = B76(F,K,T,r,\\sigma_{\\text{impl}}) \\;\\Rightarrow\\; \\sigma_{\\text{impl}} \\text{ par Newton-Raphson}"}</K>,
    },
    {
      num: 6, module: 'M6', color: T.a6, title: 'VaR du portefeuille',
      content: <>{"Portfolio : 10M barils, \u03c3=35%. VaR 99% sur 1 jour :\n        "}<K>{"\\sigma_{\\text{daily}} = 80 \\times 0.35 / \\sqrt{252} = 1.77\\$/\\text{bbl}"}</K>{"\n        "}<K>{"\\text{VaR}_{99} = 2.326 \\times 1.77 \\times 10\\text{M} = 41.2\\text{M\\$}"}</K>{"\n        Avec couverture put K=75 (\u0394=-0.35) :\n        "}<K>{"\\sigma_{\\text{hedged}} = \\sigma \\times |1-0.35| = 35\\% \\times 0.65 = 22.75\\%"}</K>{"\n        "}<K>{"\\text{VaR}_{\\text{hedged}} = 2.326 \\times (80 \\times 0.2275/\\sqrt{252}) \\times 10\\text{M} = 26.8\\text{M\\$}\\;(-35\\%)"}</K></>,
      formula: <K display>{"\\text{VaR}_{99} = 2.326 \\times \\sigma \\times S \\times N \\;; \\quad \\text{VaR}_{\\text{hedged}} = \\text{VaR} \\times (1 - \\Delta_{\\text{hedge}})"}</K>,
    },
    {
      num: 7, module: 'M7', color: T.a7, title: 'Risk management',
      content: <>{"CFaR annuel : "}<K>{"\\sigma_{CF} = 10\\text{M bbl} \\times 80\\$ \\times 35\\% = 280\\text{M\\$}"}</K>{" de vol sur revenus.\n        "}<K>{"\\text{CFaR}_{95\\%} = 1.645 \\times 280\\text{M\\$} = 460\\text{M\\$}"}</K>{" \u2192 revenus plancher = "}<K>{"800 - 460 = 340\\text{M\\$}"}</K>{".\n        Apr\u00e8s couverture (70% produit hedg\u00e9) : "}<K>{"\\sigma_{\\text{hedged}} = 30\\% \\times 280\\text{M\\$} = 84\\text{M\\$}"}</K>{".\n        "}<K>{"\\text{CFaR}_{\\text{hedged}} = 1.645 \\times 84\\text{M\\$} = 138\\text{M\\$}"}</K>{" \u2192 plancher = 662M$ (vs 340M$ sans couverture)."}</>,
      formula: <K display>{"\\text{CFaR} = z_{95\\%} \\times \\sigma_{CF} \\times (1 - h) = 1.645 \\times 280 \\times 0.3 = 138\\text{M\\$}"}</K>,
    },
    {
      num: 8, module: 'M8', color: T.a8, title: 'Stratégie de couverture intégrée',
      content: <>{"Strat\u00e9gie recommand\u00e9e pour EnergyCo SA :\n        1. Vendre 7M bbl de futures WTI \u00e0 12 mois \u2192 fixe le prix sur 70% de la production\n        2. Acheter puts K=70$ sur le solde non couvert \u2192 protection catastrophe\n        3. Vendre calls K=95$ \u2192 capez les gains sur partie couverte (collar), r\u00e9duit co\u00fbt\n        R\u00e9sultat : plancher = 71$/bbl, plafond = 95$/bbl sur 70% de la prod.\n        Prime nette = "}<K>{"\\text{Put} - \\text{Call} \\approx 3.5 - 1.8 = 1.7\\$/\\text{bbl}"}</K>{" \u2192 co\u00fbt acceptable."}</>,
      formula: <K display>{"\\text{Collar : Long put } K{=}70 + \\text{Short call } K{=}95 + \\text{Short futures} \\;\\Rightarrow\\; [70\\$,\\; 95\\$]"}</K>,
    },
  ]

  const activeStep = stepContent[step - 1]

  // Summary table data
  const summaryData = [
    { module: 'M1', metric: 'Dérivées', value: 'Delta = 0.35' },
    { module: 'M2', metric: 'Distribution', value: 'P(S<60) = 13.6%' },
    { module: 'M3', metric: 'GBM', value: 'E[S₁] = 86.6$/bbl' },
    { module: 'M4', metric: 'Black 76 Put', value: '4.2$/bbl' },
    { module: 'M5', metric: 'Vol implicite', value: 'σ_impl = 35%' },
    { module: 'M6', metric: 'VaR 99%', value: '41.2M$ → 26.8M$' },
    { module: 'M7', metric: 'CFaR 95%', value: '460M$ → 138M$' },
    { module: 'M8', metric: 'Collar', value: '[70$, 95$] @ 1.7$/bbl' },
  ]

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Les 8 modules du cours DPH3V forment un <strong style={{ color: ACCENT }}>écosystème intégré</strong> : chaque outil est un maillon d'une chaîne qui va des mathématiques fondamentales jusqu'à la décision de trading ou de couverture en temps réel.
        Ce cas intégrateur illustre comment un trader ou un risk manager en énergie mobilise simultanément ces 8 couches d'expertise pour résoudre un problème réel : structurer et gérer la couverture de production d'une compagnie pétrolière indépendante.
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Comment les modules s'articulent :</strong><br />
        <strong style={{ color: T.a3 }}>M1 (Maths)</strong> → dérivées partielles, sensibilités (Greeks)<br />
        <strong style={{ color: T.a3 }}>M1→M2 :</strong> Les fonctions differentiables (M1) permettent de calculer <K>{"E[S_T]"}</K> via les distributions (M2)<br />
        <strong style={{ color: T.a3 }}>M2→M3 :</strong> La loi log-normale (M2) découle du GBM (M3) via le lemme d'Itô<br />
        <strong style={{ color: T.a4 }}>M3→M4 :</strong> Le lemme d'Itô (M3) est l'outil qui permet de dériver Black-Scholes (M4)<br />
        <strong style={{ color: T.a5 }}>M4→M5 :</strong> Black-76 (M4) pricer → volatilité implicite extraite des prix de marché (M5)<br />
        <strong style={{ color: T.a6 }}>M4+M5→M6 :</strong> Greeks (M4) + vol (M5) → VaR paramétrique du portefeuille d'options (M6)<br />
        <strong style={{ color: T.a7 }}>M6→M7 :</strong> VaR (M6) → capital économique → RAROC (M7) + CFaR pour la perspective corporate<br />
        <strong style={{ color: ACCENT }}>M4+M7→M8 :</strong> Options Black-76 (M4) + stratégie de couverture (M7) → collar énergie concret (M8)
      </div>

      <div style={{
        background: `${ACCENT}0d`, border: `1px solid ${ACCENT}44`,
        borderRadius: 12, padding: '20px 24px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 24 }}>🛢️</span>
          <span style={{ color: ACCENT, fontWeight: 800, fontSize: 18 }}>Cas Intégrateur — {caseData.company}</span>
        </div>
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
          Ce cas fil rouge connecte les 8 modules sur un problème réel de gestion des risques énergétiques.
          Une compagnie pétrolière indépendante doit couvrir sa production de pétrole brut.
          Chaque étape illustre comment les concepts du cours se combinent en pratique.
        </div>
        <Grid cols={3} gap="10px" style={{ marginTop: 12 }}>
          {[
            { label: 'Production annuelle', value: caseData.production },
            { label: 'Prix spot WTI', value: `${caseData.spotPrice}$/bbl` },
            { label: 'Volatilité annuelle', value: `${(caseData.sigma * 100).toFixed(0)}%` },
          ].map(item => (
            <div key={item.label} style={{ background: T.panel2, borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ color: T.muted, fontSize: 11 }}>{item.label}</div>
              <div style={{ color: ACCENT, fontWeight: 700, fontSize: 16, marginTop: 2 }}>{item.value}</div>
            </div>
          ))}
        </Grid>
      </div>

      {/* Step Navigation */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 }}>
        {steps.map(s => {
          const sc = stepContent[s - 1]
          return (
            <button key={s} onClick={() => setStep(s)} style={{
              background: step === s ? `${sc.color}22` : T.panel2,
              border: `1px solid ${step === s ? sc.color : T.border}`,
              color: step === s ? sc.color : T.muted,
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
              fontSize: 12, fontWeight: step === s ? 700 : 400,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{ fontSize: 10, fontWeight: 800 }}>{sc.module}</span>
              <span style={{ fontSize: 10 }}>{sc.title.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* Active Step */}
      <div style={{
        background: `${activeStep.color}0d`, border: `1px solid ${activeStep.color}44`,
        borderRadius: 12, padding: '20px 24px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${activeStep.color}33`, border: `1px solid ${activeStep.color}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: activeStep.color, fontWeight: 900, fontSize: 14,
          }}>{activeStep.module}</div>
          <div>
            <div style={{ color: T.muted, fontSize: 11 }}>Étape {activeStep.num}/8</div>
            <div style={{ color: activeStep.color, fontWeight: 700, fontSize: 16 }}>{activeStep.title}</div>
          </div>
        </div>
        <div style={{ color: T.text, fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 12 }}>
          {activeStep.content}
        </div>
        <div style={{
          background: T.panel2, borderLeft: `4px solid ${activeStep.color}`,
          borderRadius: 6, padding: '12px 16px', fontFamily: 'monospace',
          color: T.text, fontSize: 13, lineHeight: 1.6,
        }}>
          {activeStep.formula}
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Synthèse — Résultats clés par module</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Module', 'Outil utilisé', 'Résultat'].map(h => (
                <th key={h} style={{ color: T.muted, padding: '8px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaryData.map((row, i) => {
              const col = stepContent[i].color
              return (
                <tr key={row.module}
                  onClick={() => setStep(i + 1)}
                  style={{ borderBottom: `1px solid ${T.border}33`, cursor: 'pointer', background: step === i + 1 ? `${col}0d` : 'transparent' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ background: `${col}22`, color: col, padding: '2px 10px', borderRadius: 20, fontWeight: 700, fontSize: 12 }}>{row.module}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: T.muted }}>{row.metric}</td>
                  <td style={{ padding: '10px 16px', color: T.text, fontFamily: 'monospace', fontWeight: 600 }}>{row.value}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <SectionTitle accent={ACCENT}>Checklist du trader d'options énergie</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Pour chaque tâche quotidienne d'un trader d'options énergie, voici les concepts DPH3V mobilisés :
      </div>
      <Grid cols={2} gap="10px" style={{ marginBottom: 14 }}>
        {[
          {
            task: 'Pricing d\'une nouvelle option', color: T.a4,
            items: [
              'Lire la courbe forward (M8) : F(T) pour le bon tenor',
              'Extraire la vol implicite ATM du marché (M5)',
              'Appliquer Black-76 (M4) : call ou put selon le client',
              'Ajuster pour le skew (M5) : K ≠ ATM → interpoler la surface de vol',
              'Ajouter le CVA si contrepartie non collatéralisée (M7)',
            ],
          },
          {
            task: 'Hedging (gestion de la couverture)', color: T.a3,
            items: [
              'Calculer Delta de chaque position (M4)',
              'Delta-hedge avec des futures (M4) : acheter/vendre la quantité Delta × Volume',
              'Surveiller le Gamma : ajuster le hedge quand le prix bouge (M4)',
              'Gérer le Vega : si la vol implicite change, le P&L change même sans mouvement de prix (M5)',
              'Recalculer les Greeks après chaque deal et à l\'EOD',
            ],
          },
          {
            task: 'Risk Reporting quotidien', color: T.a6,
            items: [
              'Calculer la VaR du portefeuille d\'options (M6) : paramétrique ou Monte Carlo',
              'Vérifier les limites de VaR par desk, par commodité',
              'Calculer les Greeks agrégés : Delta_total, Vega_total par tenor (M4)',
              'Reporter l\'EaR ou CFaR si le desk a des positions long terme (M7)',
              'Stress test : choc de prix ±20%, choc de vol ±30% (M6)',
            ],
          },
          {
            task: 'Gestion du risque de contrepartie', color: T.a7,
            items: [
              'Calculer la PFE de chaque nouveau swap OTC (M7)',
              'Vérifier que PFE {'<'} limite de crédit de la contrepartie',
              'Mettre à jour le CVA du portefeuille (M7) : impact sur le P&L comptable',
              'Si proche de la limite : proposer un netting agreement (ISDA) ou du collatéral (CSA)',
              'Alerter le desk CVA si la contrepartie se dégrade (downgrade de rating)',
            ],
          },
        ].map(c => (
          <div key={c.task} style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${c.color}33` }}>
            <div style={{ color: c.color, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{c.task}</div>
            {c.items.map(item => <div key={item} style={{ color: T.muted, fontSize: 12, padding: '2px 0', lineHeight: 1.5 }}>✓ {item}</div>)}
          </div>
        ))}
      </Grid>

      <IntuitionBlock emoji="🔄" title="Le cycle complet d'une transaction — De l'origination au reporting" accent={ACCENT}>
        Voici comment une transaction en énergie traverse l'organisation, mobilisant chaque module :<br />
        <strong>1. Origination</strong> : un client veut acheter un collar pétrole. Le commercial structure l'instrument (M8 : marchés, produits).<br />
        <strong>2. Pricing</strong> : le trader calcule le prix → lecture courbe forward (M8) + Black-76 (M4) + surface de vol (M5).<br />
        <strong>3. CVA/xVA</strong> : le desk CVA ajoute un ajustement pour le risque de contrepartie (M7 : CVA) si pas de CSA.<br />
        <strong>4. Exécution</strong> : la vente est conclue. Le trade est enregistré dans le système.<br />
        <strong>5. Hedging</strong> : le trader delta-hedge immédiatement avec des futures (M4 : Delta, Gamma). Rehedging quotidien.<br />
        <strong>6. Suivi des Greeks</strong> : chaque jour, recalcul Delta/Vega/Theta (M4). Le Vega est hedgé si la position est trop grande.<br />
        <strong>7. Reporting VaR</strong> : la position est agrégée dans le rapport VaR quotidien (M6). Vérification des limites réglementaires.<br />
        <strong>8. Gestion CVA continue</strong> : si la contrepartie se dégrade, le CVA augmente → perte comptable (M7). Hedged avec CDS.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Exercice de cas intégrale</SectionTitle>
      <Accordion title="Étude de cas — Producteur de gaz naturel qui couvre sa production annuelle" accent={ACCENT} badge="Avancé">
        <p style={{ color: T.text }}>
          GasCo SA produit 100 Bcf de gaz naturel par an (≈ 8.33 Bcf/mois). Prix Henry Hub spot = 3.0$/MMBtu.
          Coût de production = 1.8$/MMBtu. Volatilité implicite ATM = <K>{"\\sigma = 55\\%"}</K>/an. <K>{"r = 5\\%"}</K>.
          La direction veut couvrir 70% de la production pour les 12 prochains mois avec un budget de couverture limité.
        </p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Collar } [2.5\\$,\\; 3.8\\$] \\text{ sur 70\\% de la production}"}</K>Revenus garantis : 175M$ min (vs 20M$ sans couverture). Coût net ≈ 4.9M$/an = 2.3% des revenus. CFaR réduit de 190M$ à 57M$.</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Black-76" ruleDetail="P(S < coût prod) via N(d₂)" accent={ACCENT}>M2/M3 — Profil de risque sans couverture : <K>{"P(\\text{Prix} < 1.8) = N\\!\\left[\\frac{\\ln(1.8/3.0)+(0.05-0.5 \\times 0.55^2)}{0.55}\\right] = N[-0.756] \\approx 22.5\\%"}</K> → risque élevé !</DemoStep>
          <DemoStep num={2} rule="Backwardation" ruleDetail="Lecture courbe forward" accent={ACCENT}>M8 — Lecture de la courbe forward : F(3M)=3.1$, F(6M)=3.2$, F(9M)=3.0$, F(12M)=2.9$ (légère backwardation hivernale)</DemoStep>
          <DemoStep num={3} rule="Collar" ruleDetail="CFaR = z × σ_CF" accent={ACCENT}>M7 — CFaR sans couverture : <K>{"\\sigma_{CF} = 70 \\times 3.0 \\times 0.55 = 115.5\\text{M\\$}"}</K>, <K>{"\\text{CFaR}_{95\\%} = 1.645 \\times 115.5 = 190\\text{M\\$}"}</K> → revenus plancher = <K>{"210 - 190 = 20\\text{M\\$}"}</K> !</DemoStep>
          <DemoStep num={4} rule="Collar" ruleDetail="Long Put K₁ + Short Call K₂" accent={ACCENT}>M8 — Stratégie collar sur 70% prod (70 Bcf) : Long put K=2.5$ + Short call K=3.8$</DemoStep>
          <DemoStep num={5} rule="Black-76" ruleDetail="Put = e^{−rT}[K·N(−d₂) − F·N(−d₁)]" accent={ACCENT}>M4 — Pricing put K=2.5$, F=3.0$, T=6M, σ=55% : <K>{"d_1 = 0.663,\\; d_2 = -0.326"}</K>, <K>{"\\text{Put} = e^{-0.025}[2.5 N(0.326) - 3.0 N(-0.663)] = 0.9753 \\times [1.57 - 0.762] = 0.788\\$/\\text{MMBtu}"}</K></DemoStep>
          <DemoStep num={6} rule="Black-76" ruleDetail="Call OTM pricing" accent={ACCENT}>M4 — Pricing call K=3.8$ : OTM call, prix ≈ 0.72$/MMBtu (similaire au put pour zero-cost collar)</DemoStep>
          <DemoStep num={7} rule="Cap + Floor" ruleDetail="CFaR hedged = CFaR × (1−h)" accent={ACCENT}>M7 — CFaR après couverture : <K>{"\\sigma_{CF,\\text{résid}} = 0.30 \\times 115.5 = 34.65\\text{M\\$}"}</K>, <K>{"\\text{CFaR}_{\\text{hedged}} = 1.645 \\times 34.65 = 57\\text{M\\$}"}</K> vs 190M$ (−70% !)</DemoStep>
          <DemoStep num={8} rule="Collar" ruleDetail="RAROC = valeur créée / capital" accent={ACCENT}>M7 — RAROC de la couverture : Valeur créée (réduction risque) = <K>{"190 - 57 = 133\\text{M\\$}"}</K>. Coût net collar ≈ <K>{"0.07\\$/\\text{MMBtu} \\times 70\\text{Bcf} = 4.9\\text{M\\$/an}"}</K>. Synthèse des modules mobilisés : M2 (probas) → P(ruine) | M3 (GBM) → scénarios | M4 (Black-76) → pricing | M5 (vol) → surface de vol | M6 (VaR) → risque résiduel | M7 (CFaR/RAROC) → perspective corporate | M8 → courbe forward et exécution.</DemoStep>
        </Demonstration>
      </Accordion>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 20, marginTop: 20 }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Conclusion : La stratégie de couverture optimale</div>
        <div style={{ color: T.text, fontSize: 13, lineHeight: 1.8 }}>
          En combinant les 8 modules du cours DPH3V, EnergyCo SA peut mettre en place une stratégie de couverture complète :
          <br /><br />
          • <strong style={{ color: T.a4 }}>Maths (M1)</strong> : calculer les Greeks de sensibilité de la couverture<br />
          • <strong style={{ color: T.a2 }}>Probas (M2)</strong> : quantifier les scénarios de prix extrêmes<br />
          • <strong style={{ color: T.a3 }}>Processus (M3)</strong> : simuler des trajectoires réalistes de prix<br />
          • <strong style={{ color: T.a4 }}>Pricing (M4)</strong> : valoriser les puts de protection avec Black 76<br />
          • <strong style={{ color: T.a5 }}>Vol (M5)</strong> : calibrer la volatilité implicite sur le marché<br />
          • <strong style={{ color: T.a6 }}>VaR (M6)</strong> : mesurer le risque résiduel après couverture<br />
          • <strong style={{ color: T.a7 }}>Risk Mgmt (M7)</strong> : garantir le cash flow minimum avec CFaR<br />
          • <strong style={{ color: T.a8 }}>Énergie (M8)</strong> : structurer le collar sur la forward curve réelle
        </div>
        <FormulaBox accent={ACCENT} label="Résultat final">
          <K display>{"\\text{Collar } [70\\$,\\; 95\\$] \\text{ sur 70\\% production} + 30\\% \\text{ exposition non couverte}"}</K>
          <K display>{"\\text{Revenus garantis : } 700\\text{M\\$ (min)} \\text{ \u2014 } 950\\text{M\\$ (max)}"}</K>
          <K display>{"\\text{Co\u00fbt net} = 1.7\\$/\\text{bbl} \\times 10\\text{Mbbl} \\times 70\\% = 11.9\\text{M\\$}\\;(1.5\\%\\text{ des revenus})"}</K>
          <K display>{"\\text{RAROC de la couverture : } 25\\%"}</K>
        </FormulaBox>
      </div>
    </div>
  )
}
