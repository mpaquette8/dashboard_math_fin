import React, { useState, useMemo, Component } from 'react'

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
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { T } from '../../design/tokens'
import {
  ModuleHeader, TabBar, FormulaBox, IntuitionBlock, ExampleBlock,
  Slider, Accordion, Step, SymbolLegend, SectionTitle, InfoChip, Grid, ChartWrapper,
} from '../../design/components'

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
export function NoArbTab() {
  const [S, setS] = useState(100)
  const [K, setK] = useState(100)
  const [r, setR] = useState(0.05)
  const [T2, setT2] = useState(1)

  const PV_K = K * Math.exp(-r * T2)
  const lowerBound = Math.max(S - PV_K, 0)
  const putCallParity = `C - P = S - K·e^(-rT) = ${(S - PV_K).toFixed(2)}`

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Le no-arbitrage : principe fondateur de la finance quantitative.</strong> Avant d'écrire une seule formule de pricing,
        il faut comprendre pourquoi ce principe est si puissant. Un <strong>arbitrage</strong> est une stratégie qui génère
        un profit certain sans investissement initial et sans risque — une machine à sous parfaite.
        Le principe dit : dans un marché efficient, de telles opportunités ne peuvent pas exister durablement
        (elles seraient immédiatement exploitées et s'auto-détruiraient par la pression des prix).
        Ce simple axiome permet de <em>déduire</em> le prix de tout dérivé sans faire aucune hypothèse sur les préférences
        des investisseurs, leur aversion au risque, ou leurs anticipations. C'est d'une puissance remarquable.
      </div>

      <IntuitionBlock emoji="⚖️" title="No-Arbitrage : il n'existe pas de repas gratuit" accent={ACCENT}>
        Si deux actifs ont le même payoff dans tous les scénarios futurs,
        ils doivent avoir le même prix aujourd'hui. Sinon, un arbitrageur achèterait le moins cher
        et vendrait le plus cher pour un profit certain. En pratique :
        les marchés efficients éliminent ces opportunités quasi-instantanément.
        Ce principe est le fondement de TOUT le pricing de dérivés.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>La mesure risque-neutre Q : changer de probabilité pour pricer</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Le théorème fondamental de la finance (Harrison-Pliska, 1979) établit : un marché est sans arbitrage
        si et seulement si il existe une <strong>mesure de probabilité risque-neutre Q</strong> sous laquelle
        tous les actifs actualisés sont des martingales.
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Intuition de Q — la "probabilité du banquier" :</strong>
        <div style={{ marginTop: 8 }}>
          Dans le monde réel (mesure P), les actions ont un rendement µ {'>'} r (prime de risque).
          Sous Q, on "triche" sur les probabilités de façon à ce que TOUS les actifs aient le même rendement r.
          Ce n'est pas ce qui se passe dans le monde réel — c'est juste une <strong>astuce mathématique de changement de probabilité</strong>
          (théorème de Girsanov) qui rend le pricing trivial : le prix d'un dérivé est l'espérance sous Q de son payoff actualisé.
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Formule fondamentale :</strong> Prix(t) = e^(-r(T-t)) × E^Q[Payoff(T) | F_t]
        </div>
        <div style={{ marginTop: 8 }}>
          Conséquence pratique : on n'a pas besoin de connaître µ (le vrai rendement attendu de l'actif) pour pricer un dérivé.
          Le prix du dérivé dépend de S, K, T, r, σ — mais <strong>pas</strong> de µ. Remarquable !
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Parité Put-Call : démonstration par l'arbitrage</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Construisons deux portefeuilles et montrons qu'ils ont le même payoff à maturité :
      </div>
      <Step num={1} accent={ACCENT}>Portefeuille A : acheter 1 call (prix C) + investir K·e^(-rT) au taux sans risque</Step>
      <Step num={2} accent={ACCENT}>Portefeuille B : acheter 1 put (prix P) + acheter 1 action (prix S)</Step>
      <Step num={3} accent={ACCENT}>À maturité T, si S_T {'>'} K : A = (S_T - K) + K = S_T ; B = 0 + S_T = S_T ✓</Step>
      <Step num={4} accent={ACCENT}>À maturité T, si S_T {'<'} K : A = 0 + K = K ; B = (K - S_T) + S_T = K ✓</Step>
      <Step num={5} accent={ACCENT}>Mêmes payoffs dans tous les cas → même prix → C + K·e^(-rT) = P + S</Step>

      <FormulaBox accent={ACCENT} label="Parité Put-Call (portefeuille de réplication)">
        C - P = S - K·e^(-rT)
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Bornes no-arbitrage sur le prix d'un call</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Sans hypothèse sur la distribution de S, on peut établir des bornes universelles :
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <div style={{ marginBottom: 8 }}><strong style={{ color: ACCENT }}>C ≥ max(S - K·e^(-rT), 0) :</strong> Si C {'<'} S - K·e^(-rT), acheter le call, vendre l'action et emprunter K·e^(-rT) → profit immédiat garanti. Absurde.</div>
        <div style={{ marginBottom: 8 }}><strong style={{ color: ACCENT }}>C ≤ S :</strong> Le call ne peut valoir plus que l'actif lui-même (le call donne le <em>droit</em> d'acheter S, pas S directement).</div>
        <div><strong style={{ color: ACCENT }}>0 ≤ C :</strong> Le call ne peut pas avoir une valeur négative — on ne peut jamais être <em>obligé</em> d'exercer.</div>
      </div>

      <FormulaBox accent={ACCENT} label="Bornes no-arbitrage pour un call européen">
        max(S - K·e^(-rT), 0) ≤ C ≤ S
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['C', 'Prix du call européen'],
        ['P', 'Prix du put européen'],
        ['S', 'Prix spot du sous-jacent'],
        ['K', 'Strike (prix d\'exercice)'],
        ['e^(-rT)', 'Facteur d\'actualisation (valeur présente de K)'],
      ]} />

      <Grid cols={2} gap="10px">
        <Slider label="S (prix spot)" value={S} min={50} max={200} step={1} onChange={setS} accent={ACCENT} format={v => `${v}€`} />
        <Slider label="K (strike)" value={K} min={50} max={200} step={1} onChange={setK} accent={T.a5} format={v => `${v}€`} />
        <Slider label="r (taux)" value={r} min={0} max={0.15} step={0.005} onChange={setR} accent={T.muted} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="T (maturité)" value={T2} min={0.1} max={3} step={0.1} onChange={setT2} accent={T.muted} format={v => `${v.toFixed(1)}a`} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="K·e^(-rT)" value={PV_K.toFixed(2)} unit="€" accent={ACCENT} />
        <InfoChip label="Borne inf." value={lowerBound.toFixed(2)} unit="€" accent={T.a5} />
        <InfoChip label="C - P" value={(S - PV_K).toFixed(2)} unit="€" accent={T.a4} />
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 8 }}>Parité Put-Call :</div>
        <code style={{ color: T.text, fontFamily: 'monospace', fontSize: 14 }}>{putCallParity}</code>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
          → Si vous connaissez le prix du call, vous pouvez déduire le prix du put sans autre hypothèse.
        </div>
      </div>

      <Accordion title="Exercice — Détecter et exploiter l'arbitrage" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Situation : Call ATM = 8€, Put ATM = 6€, S = 100€, K = 100€, r = 4%, T = 0.5 an. Y a-t-il arbitrage ?</p>
        <Step num={1} accent={ACCENT}>Calculer K·e^(-rT) = 100 × e^(-0.04 × 0.5) = 100 × e^(-0.02) = 100 × 0.9802 = 98.02€</Step>
        <Step num={2} accent={ACCENT}>Parité théorique : C - P = S - K·e^(-rT) = 100 - 98.02 = 1.98€</Step>
        <Step num={3} accent={ACCENT}>Observé : C - P = 8 - 6 = 2€ ≠ 1.98€ → écart de 0.02€ → ARBITRAGE !</Step>
        <Step num={4} accent={ACCENT}>Stratégie : vendre le call (recevoir 8€), acheter le put (payer 6€), acheter l'action (payer 100€), emprunter 98.02€</Step>
        <Step num={5} accent={ACCENT}>Cash initial : -8 + 6 - 100 + 98.02 + 0 = -3.98€. À maturité, le portefeuille vaut exactement 0 dans tous les cas.</Step>
        <FormulaBox accent={ACCENT}>Profit = 0.02€ pour 100€ de notionnel → 2 points de base de profit sans risque (à exploiter en taille !)</FormulaBox>
      </Accordion>

      <ExampleBlock title="Arbitrage détecté !" accent={ACCENT}>
        <p>Call ATM C=12€, Put ATM P=8€, S=100€, K=100€, r=5%, T=1an</p>
        <Step num={1} accent={ACCENT}>Parité : C - P = S - K×e^(-rT) = 100 - 100×e^(-0.05) = 100 - 95.12 = 4.88€</Step>
        <Step num={2} accent={ACCENT}>Observé : C - P = 12 - 8 = 4€ ≠ 4.88€ → ARBITRAGE !</Step>
        <Step num={3} accent={ACCENT}>Stratégie : Acheter call (payer 12€), Vendre put (recevoir 8€), Vendre S (recevoir 100€), Investir 95.12€ à r=5%</Step>
        <Step num={4} accent={ACCENT}>Profit initial = -12 + 8 + 100 - 95.12 = +0.88€ sans risque !</Step>
      </ExampleBlock>
    </div>
  )
}

// ─── Tab: Black-Scholes ───────────────────────────────────────────────────────
export function BSTab() {
  const [S, setS] = useState(100)
  const [K, setK] = useState(100)
  const [T2, setT2] = useState(1)
  const [r, setR] = useState(0.05)
  const [sigma, setSigma] = useState(0.2)

  const call = bs(S, K, T2, r, sigma, 'call')
  const put = bs(S, K, T2, r, sigma, 'put')
  const g = bsGreeks(S, K, T2, r, sigma)

  const profileData = useMemo(() => {
    const pts = []
    for (let s = Math.max(50, K * 0.5); s <= K * 1.8; s += K * 0.02) {
      pts.push({
        S: +s.toFixed(1),
        call: +bs(s, K, T2, r, sigma, 'call').toFixed(3),
        put: +bs(s, K, T2, r, sigma, 'put').toFixed(3),
        intrinsicCall: +Math.max(s - K, 0).toFixed(3),
        intrinsicPut: +Math.max(K - s, 0).toFixed(3),
      })
    }
    return pts
  }, [K, T2, r, sigma])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>La formule de Black-Scholes (1973, Prix Nobel d'Économie 1997)</strong> est le résultat le plus célèbre
        de la finance mathématique moderne. Fischer Black, Myron Scholes et Robert Merton ont montré comment
        pricer rigoureusement une option européenne en supposant un monde idéal : marchés continus, sans friction,
        actif sous-jacent suivant un GBM, volatilité et taux constants.
        Cette formule a révolutionné les marchés dérivés en permettant un pricing objectif et cohérent — avant elle,
        les options étaient pricées "au pifomètre" selon l'intuition des traders. Elle suppose un monde idéal mais
        reste la <strong>référence universelle</strong> : même quand les hypothèses ne tiennent pas, on calibre σ implicite via B-S.
      </div>

      <IntuitionBlock emoji="🧮" title="Black-Scholes : le prix risque-neutre de l'option" accent={ACCENT}>
        Black-Scholes répond à la question : "Quel est le juste prix d'une option, si on peut
        se hedger parfaitement en rebalançant en continu ?"
        N(d₁) et N(d₂) sont des probabilités sous la mesure risque-neutre.
        Le call = valeur espérée actualisée du payoff max(S_T - K, 0) sous Q.
      </IntuitionBlock>

      <Grid cols={2} gap="12px">
        <FormulaBox accent={ACCENT} label="Call Européen — Black-Scholes (1973)">
          C = S·N(d₁) - K·e^(-rT)·N(d₂)
        </FormulaBox>
        <FormulaBox accent={ACCENT} label="Put Européen">
          P = K·e^(-rT)·N(-d₂) - S·N(-d₁)
        </FormulaBox>
      </Grid>

      <SectionTitle accent={ACCENT}>Anatomie de la formule : ce qu'on reçoit vs ce qu'on paie</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 12 }}>
        La formule <code style={{ color: ACCENT }}>C = S·N(d₁) − K·e^(−rT)·N(d₂)</code> a une structure profondément intuitive :
        c'est la différence entre <strong>ce que vous recevez</strong> (l'actif) et <strong>ce que vous payez</strong> (le strike),
        le tout pondéré par les probabilités d'exercice respectives.
      </div>

      <Grid cols={2} gap="12px">
        <div style={{ background: `${ACCENT}11`, border: `1px solid ${ACCENT}44`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: ACCENT, fontWeight: 800, fontSize: 15, marginBottom: 8 }}>S · N(d₁) — "La jambe actif"</div>
          <div style={{ color: T.text, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
            C'est la valeur espérée actualisée de <strong>recevoir l'actif S_T</strong>, conditionnellement à l'exercice.
            Mathématiquement : <code>S·N(d₁) = e^(−rT) × E^Q[S_T × 1(S_T {'>'} K)]</code>
          </div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            N(d₁) est la probabilité d'exercice sous la <strong>mesure "actif" Q^S</strong> (où l'actif lui-même sert de numéraire).
            Sous Q^S, l'actif a tendance à être plus élevé en cas d'exercice → N(d₁) {'>'} N(d₂).
            En pratique, N(d₁) ≈ Delta du call — la fraction de l'actif à détenir pour se hedger.
          </div>
        </div>
        <div style={{ background: `${T.a5}11`, border: `1px solid ${T.a5}44`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: T.a5, fontWeight: 800, fontSize: 15, marginBottom: 8 }}>K·e^(−rT) · N(d₂) — "La jambe strike"</div>
          <div style={{ color: T.text, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
            C'est la valeur actuelle du <strong>paiement du strike K</strong>, pondéré par la probabilité de l'exercer.
            Mathématiquement : <code>K·e^(−rT)·N(d₂) = e^(−rT) × K × P^Q(S_T {'>'} K)</code>
          </div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            N(d₂) est la probabilité d'exercice sous la <strong>mesure risque-neutre Q standard</strong>.
            K·e^(−rT) est simplement la valeur actuelle du strike (actualisé au taux r).
            C'est le montant que vous vous engagez à payer si vous exercez.
          </div>
        </div>
      </Grid>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>La preuve par la définition : C = e^(−rT) × E^Q[max(S_T − K, 0)]</div>
        <Step num={1} accent={ACCENT}>Le payoff du call vaut (S_T − K) si S_T {'>'} K, et 0 sinon → max(S_T − K, 0) = (S_T − K) × 1(S_T {'>'} K)</Step>
        <Step num={2} accent={ACCENT}>E^Q[max(S_T−K, 0)] = E^Q[S_T × 1(S_T {'>'} K)] − K × P^Q(S_T {'>'} K)</Step>
        <Step num={3} accent={ACCENT}>On peut montrer : e^(−rT) × E^Q[S_T × 1(S_T {'>'} K)] = S × N(d₁) [changement de numéraire vers Q^S]</Step>
        <Step num={4} accent={ACCENT}>Et : e^(−rT) × K × P^Q(S_T {'>'} K) = K·e^(−rT) × N(d₂) [sous Q standard, P^Q(S_T {'>'} K) = N(d₂)]</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, padding: '8px 12px', background: `${ACCENT}0a`, borderRadius: 6 }}>
          <strong style={{ color: ACCENT }}>C = [Valeur espérée de recevoir S_T si exercé] − [Valeur espérée de payer K si exercé]</strong>
          <br />C'est exactement la logique économique : l'option est la différence entre ce qu'on gagne (l'actif) et ce qu'on paie (le strike), en espérance actualisée.
        </div>
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}22`, borderRadius: 8, padding: 14, margin: '0 0 16px 0', fontSize: 13, color: T.text, lineHeight: 1.8 }}>
        <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 8 }}>Pourquoi N(d₁) ≠ N(d₂) ? Les deux probabilités</div>
        <div style={{ marginBottom: 6 }}>• <strong>N(d₂)</strong> = probabilité sous <strong>Q</strong> (monde risque-neutre, numéraire = argent) que S_T {'>'} K. C'est la probabilité "pure" d'exercice.</div>
        <div style={{ marginBottom: 6 }}>• <strong>N(d₁)</strong> = probabilité sous <strong>Q^S</strong> (monde "actif", numéraire = l'actif S) que S_T {'>'} K. Sous Q^S, l'actif a un drift plus élevé de σ² par an → plus de chances d'être ITM vu du point de vue de l'actif.</div>
        <div style={{ marginBottom: 6 }}>• L'écart : d₁ = d₂ + σ√T → N(d₁) {'>'} N(d₂). Plus σ et T sont grands, plus les deux probabilités divergent.</div>
        <div style={{ color: T.muted, fontSize: 12 }}>Exemple ATM (S=K) : N(d₂) = prob que S_T {'>'} K sous Q ≈ 50% − σ√T/2 × φ(0). N(d₁) ≈ 50% + σ√T/2 × φ(0). Avec σ=20%, T=1 : N(d₂)≈0.46, N(d₁)≈0.54 — écart de 8 points !</div>
      </div>

      <FormulaBox accent={ACCENT} label="d₁ et d₂ — formules">
        d₁ = [ln(S/K) + (r + σ²/2)·T] / (σ·√T)
        d₂ = d₁ - σ·√T

        N(d₂) = P^Q(S_T {'>'} K)   [prob. d'exercice sous Q]
        N(d₁) = P^{'Q^S'}(S_T {'>'} K)  [prob. d'exercice sous Q^S, le Delta]
      </FormulaBox>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>La PDE Black-Scholes — le sens économique de chaque terme</div>
        <div style={{ color: T.muted, fontSize: 13, marginBottom: 10 }}>PDE : ∂C/∂t + rS·∂C/∂S + ½σ²S²·∂²C/∂S² = rC</div>
        <Step num={1} accent={ACCENT}>∂C/∂t = Theta (négatif) : érosion temporelle — l'option perd de la valeur chaque instant qui passe. Pour un acheteur, c'est un coût quotidien inévitable même si S ne bouge pas.</Step>
        <Step num={2} accent={ACCENT}>rS · ∂C/∂S = r × Delta × S : le drift risque-neutre de S. Sous la mesure Q, S croît à r (et non µ). Ce terme représente le drift attendu du call dû au mouvement risque-neutre de S, pondéré par Delta.</Step>
        <Step num={3} accent={ACCENT}>½σ²S² · ∂²C/∂S² = ½σ²S² × Gamma : le gain de convexité — Gamma mesure la courbure de C en S, et σ²S² est la "récolte" stochastique sur cette courbure. C'est le terme d'Itô qui génère un gain positif pour tout long Gamma.</Step>
        <Step num={4} accent={ACCENT}>rC à droite : le coût de financement du portefeuille de réplication. Pour construire le hedge, on emprunte/prête au taux r — ce terme représente le rendement requis du portefeuille sans risque.</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          Lecture : Theta + Gain_Gamma = rV − r × Delta × S. Un portefeuille delta-hedgé (Π = C − ΔS) évolue à exactement dΠ = rΠ dt. La dégradation temporelle (Theta négatif) est exactement compensée par le gain de convexité (Gamma positif × σ²S²/2).
        </div>
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}22`, borderRadius: 8, padding: 14, margin: '0 0 16px 0', fontSize: 13, color: T.text, lineHeight: 1.8 }}>
        <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 6 }}>Theta-Gamma tradeoff fondamental</div>
        Θ = −½Γσ²S² + rV − rS·Δ. Pour un call ATM delta-neutre : Theta ≈ −½Γσ²S². Être long Gamma = être short Theta. Chaque jour, vous payez le Theta pour avoir la convexité. La vol implicite σ est exactement le "prix" de ce tradeoff fixé par le marché.
      </div>

      <SectionTitle accent={ACCENT}>Les 6 hypothèses de Black-Scholes</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { hyp: 'S suit un GBM (dS = µS dt + σS dW)', limite: 'Sauts de prix (crises), mean-reversion énergie → MRJD', c: ACCENT },
          { hyp: 'Volatilité σ constante', limite: 'Smile/skew de vol implicite observé sur le marché → modèles stoch. vol', c: T.a5 },
          { hyp: 'Taux d\'intérêt r constant', limite: 'Structure par terme des taux → modèles HJM, Hull-White', c: T.a4 },
          { hyp: 'Pas de dividendes', limite: 'Dividendes discrets (actions) ou convenience yield (commodités)', c: T.a3 },
          { hyp: 'Marchés continus, sans friction', limite: 'Microstructure, gaps overnight, illiquidité', c: T.a6 },
          { hyp: 'Pas de coûts de transaction', limite: 'Bid-ask spread, coûts de rebalancement du hedge', c: T.a7 },
        ].map((r, i) => (
          <div key={i} style={{ background: T.panel2, borderRadius: 7, padding: '10px 12px', border: `1px solid ${r.c}22`, fontSize: 12 }}>
            <div style={{ color: r.c, fontWeight: 700, marginBottom: 4 }}>Hypothèse {i + 1}</div>
            <div style={{ color: T.text, marginBottom: 4 }}>{r.hyp}</div>
            <div style={{ color: T.muted, fontSize: 11 }}>Limite : {r.limite}</div>
          </div>
        ))}
      </div>

      <SymbolLegend accent={ACCENT} symbols={[
        ['S', 'Prix spot du sous-jacent'],
        ['K', 'Strike'],
        ['T', 'Temps jusqu\'à maturité (en années)'],
        ['r', 'Taux sans risque continu'],
        ['σ', 'Volatilité du sous-jacent'],
        ['N(·)', 'CDF de la loi normale standard'],
        ['d₁', 'Mesure de l\'in-the-moneyness corrigée du temps'],
        ['d₂', 'd₁ - σ√T = log-prob. risque-neutre que S_T > K'],
      ]} />

      <SectionTitle accent={ACCENT}>Interprétation de d₁ et d₂</SectionTitle>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 16px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: ACCENT }}>N(d₂) — Probabilité risque-neutre d'exercice :</strong> C'est P^Q(S_T {'>'} K), la probabilité sous la mesure risque-neutre
          que le call finisse dans la monnaie à maturité. Si d₂ est grand et positif, l'option est très probablement exercée.
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: ACCENT }}>N(d₁) — Delta du call :</strong> C'est la sensibilité du prix du call au prix spot. Delta = ∂C/∂S = N(d₁).
          Il représente aussi (approximativement) la probabilité d'exercice sous la mesure physique P (corrigée de la prime de risque).
          En pratique : Delta ≈ 0.5 pour une option ATM, ≈ 1 pour une option ITM profonde, ≈ 0 pour une option OTM profonde.
        </div>
        <div>
          <strong style={{ color: ACCENT }}>d₂ = d₁ - σ√T — la différence :</strong> Vient du changement de numéraire entre mesure Q (pour actualiser)
          et mesure forward Q^T (pour calculer P(S_T {'>'} K)). σ√T est la "distance" entre les deux probabilités.
          Plus σ et T sont grands, plus l'écart entre N(d₁) et N(d₂) est important.
        </div>
      </div>

      <Grid cols={3} gap="8px">
        <Slider label="S (spot)" value={S} min={50} max={200} step={1} onChange={setS} accent={ACCENT} format={v => `${v}€`} />
        <Slider label="K (strike)" value={K} min={50} max={200} step={1} onChange={setK} accent={T.a5} format={v => `${v}€`} />
        <Slider label="T (maturité)" value={T2} min={0.05} max={3} step={0.05} onChange={setT2} accent={T.muted} format={v => `${v.toFixed(2)}a`} />
        <Slider label="r (taux)" value={r} min={0} max={0.15} step={0.005} onChange={setR} accent={T.muted} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="σ (volatilité)" value={sigma} min={0.05} max={0.8} step={0.01} onChange={setSigma} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
        <InfoChip label="Call" value={call.toFixed(4)} unit="€" accent={ACCENT} />
        <InfoChip label="Put" value={put.toFixed(4)} unit="€" accent={T.a2} />
        <InfoChip label="d₁" value={g.d1 !== undefined ? g.d1.toFixed(4) : '—'} accent={T.muted} />
        <InfoChip label="d₂" value={g.d2 !== undefined ? g.d2.toFixed(4) : '—'} accent={T.muted} />
        <InfoChip label="N(d₁)" value={g.Nd1 !== undefined ? g.Nd1.toFixed(4) : '—'} accent={T.a4} />
        <InfoChip label="N(d₂)" value={g.Nd2 !== undefined ? g.Nd2.toFixed(4) : '—'} accent={T.a5} />
      </div>

      <ChartWrapper title="Prix Call & Put en fonction de S (valeur intrinsèque en pointillé)" accent={ACCENT} height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={profileData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="S" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Prix spot S', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <ReferenceLine x={K} stroke={T.border} strokeWidth={1.5} label={{ value: `K=${K}`, fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 12 }} />
            <Line type="monotone" dataKey="call" stroke={ACCENT} strokeWidth={2.5} dot={false} name="Call BS" />
            <Line type="monotone" dataKey="put" stroke={T.a2} strokeWidth={2.5} dot={false} name="Put BS" />
            <Line type="monotone" dataKey="intrinsicCall" stroke={ACCENT} strokeWidth={1} dot={false} strokeDasharray="4 3" name="Valeur intrinsèque Call" />
            <Line type="monotone" dataKey="intrinsicPut" stroke={T.a2} strokeWidth={1} dot={false} strokeDasharray="4 3" name="Valeur intrinsèque Put" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <Accordion title="Exercice — Sensibilité au temps (dégradation temporelle)" accent={ACCENT} badge="Entraînement">
        <p style={{ color: T.text }}>S = 100€, K = 100€, r = 5%, σ = 25%. Calculez le prix du call pour T = 3, 2, 1, 0.5, 0 mois.</p>
        <Step num={1} accent={ACCENT}>T = 3 mois = 0.25 an : d₁ = [0 + (0.05 + 0.03125)×0.25]/(0.25×0.5) = 0.025/0.125 = 0.2 → C ≈ 5.00€</Step>
        <Step num={2} accent={ACCENT}>T = 2 mois ≈ 0.167 an : d₁ ≈ 0.163 → C ≈ 4.06€</Step>
        <Step num={3} accent={ACCENT}>T = 1 mois ≈ 0.083 an : d₁ ≈ 0.115 → C ≈ 2.87€</Step>
        <Step num={4} accent={ACCENT}>T = 0.5 mois ≈ 0.042 an : d₁ ≈ 0.082 → C ≈ 2.03€</Step>
        <Step num={5} accent={ACCENT}>T = 0 : C = max(100-100, 0) = 0€ (l'option expire sans valeur si ATM)</Step>
        <FormulaBox accent={ACCENT}>La valeur temps disparaît non-linéairement — elle s'accélère près de la maturité (Theta plus négatif)</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>C'est le "time decay" (Theta) : un vendeur d'option profite de cette érosion, un acheteur la subit.</div>
      </Accordion>

      <ExampleBlock title="Calcul step-by-step — Call sur Brent" accent={ACCENT}>
        <p>F=80$/bbl, K=85, T=0.25a, r=4%, σ=32%</p>
        <Step num={1} accent={ACCENT}>d₁ = [ln(80/85) + (0.04+0.0512)×0.25] / (0.32×√0.25) = (-0.0606+0.023)/0.16 = -0.237</Step>
        <Step num={2} accent={ACCENT}>d₂ = -0.237 - 0.16 = -0.397</Step>
        <Step num={3} accent={ACCENT}>N(d₁) = N(-0.237) ≈ 0.4063 ; N(d₂) = N(-0.397) ≈ 0.3457</Step>
        <Step num={4} accent={ACCENT}>C = 80×0.4063 - 85×e^(-0.04×0.25)×0.3457 = 32.50 - 85×0.9900×0.3457 = 32.50 - 29.07 = 3.43$/bbl</Step>
      </ExampleBlock>
    </div>
  )
}

// ─── Tab: Black-76 ────────────────────────────────────────────────────────────
export function Black76Tab() {
  const [F, setF] = useState(80)
  const [K, setK] = useState(80)
  const [T2, setT2] = useState(0.5)
  const [r, setR] = useState(0.04)
  const [sigma, setSigma] = useState(0.3)

  const call76 = black76(F, K, T2, r, sigma, 'call')
  const put76 = black76(F, K, T2, r, sigma, 'put')

  const d1 = (Math.log(F / K) + 0.5 * sigma * sigma * T2) / (sigma * Math.sqrt(T2))
  const d2 = d1 - sigma * Math.sqrt(T2)

  const profileData = useMemo(() => {
    const pts = []
    for (let f = F * 0.5; f <= F * 1.8; f += F * 0.02) {
      pts.push({
        F: +f.toFixed(1),
        call: +black76(f, K, T2, r, sigma, 'call').toFixed(3),
        put: +black76(f, K, T2, r, sigma, 'put').toFixed(3),
      })
    }
    return pts
  }, [K, T2, r, sigma, F])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Pourquoi Black-76 et pas Black-Scholes directement pour l'énergie ?</strong>
        Les marchés physiques de l'énergie (pétrole, gaz, électricité) ne se traitent quasi jamais sur le prix spot immédiat.
        Les acteurs — producteurs, raffineurs, utilities — opèrent sur des <strong>contrats forward et futures</strong> :
        livraison du brut dans 3 mois, fourniture de gaz le mois prochain, électricité pour le trimestre suivant.
        Ces contrats forward/futures sont le <em>marché principal</em> et les options sont systématiquement des options sur ces futures
        (et non sur le spot). Fischer Black (1976) a adapté sa propre formule (B-S) pour ce contexte :
        en traitant F comme le sous-jacent directement (sans coût de portage), on obtient Black-76.
      </div>

      <IntuitionBlock emoji="⚡" title="Black-76 : options sur futures énergie" accent={ACCENT}>
        En énergie, les options ne portent pas sur le prix spot (difficile à observer/livrer)
        mais sur les <strong>contrats futures</strong>. Fischer Black (1976) a adapté Black-Scholes :
        il suffit de remplacer S par F (prix forward) et le coût de portage disparaît.
        Black-76 est LA formule standard pour options pétrole, gaz, électricité.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Black-76 — Option sur Future">
        C = e^(-rT) × [F·N(d₁) - K·N(d₂)]
        P = e^(-rT) × [K·N(-d₂) - F·N(-d₁)]

        d₁ = [ln(F/K) + (σ²/2)·T] / (σ·√T)
        d₂ = d₁ - σ·√T
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Lien B-S ↔ Black-76 : la substitution fondamentale</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        La relation entre un futures F et le spot S est donnée par le <strong>cost of carry</strong> (théorème de parité forward-spot) :
      </div>
      <FormulaBox accent={ACCENT} label="Cost of carry — Relation Futures/Spot">
        F = S × e^((r + u - δ)T)

        r = taux d'intérêt sans risque (coût de financement)
        u = coûts de stockage (storage costs, % du prix/an)
        δ = convenience yield (bénéfice de détenir le physique)
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Interprétation de chaque terme en énergie :</strong>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}><strong>r (taux sans risque) :</strong> Coût de financement du stock physique. Si j'achète du pétrole comptant et que je le garde en stock 3 mois, j'ai immobilisé du capital → coût r.</div>
          <div style={{ marginBottom: 6 }}><strong>u (coûts de stockage) :</strong> Location du tank, assurance, pertes en ligne. Pour le gaz naturel : ≈ 2-5%/an du prix. Pour le pétrole brut : ≈ 0.5-1.5%/an. Pour l'électricité : stockage quasi impossible → u très élevé → structures de terme très volatiles.</div>
          <div style={{ marginBottom: 6 }}><strong>δ (convenience yield) :</strong> Bénéfice implicite de détenir le physique vs un future. Élevé quand les marchés sont en backwardation (pénurie spot) : avoir du pétrole en stock permet de livrer à vos clients même en cas de rupture. Faible en contango (offre abondante).</div>
          <div><strong>Substitution :</strong> Si on remplace S par F·e^(-rT) dans B-S (car F = S·e^(rT) quand u=δ=0), on retrouve exactement Black-76. Les futures "incorporent déjà" le coût de portage → pas de terme e^(rT) dans d₁ de B76.</div>
        </div>
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '12px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 6 }}>Différences Black-Scholes vs Black-76</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: T.text }}>
          <div><span style={{ color: T.muted }}>Black-Scholes :</span> S×N(d₁) - K×e^(-rT)×N(d₂)</div>
          <div><span style={{ color: ACCENT }}>Black-76 :</span> e^(-rT)×[F×N(d₁) - K×N(d₂)]</div>
          <div><span style={{ color: T.muted }}>d₁ BS :</span> [ln(S/K)+(r+σ²/2)T]/(σ√T)</div>
          <div><span style={{ color: ACCENT }}>d₁ B76 :</span> [ln(F/K)+σ²T/2]/(σ√T)</div>
          <div><span style={{ color: T.muted }}>Contexte :</span> Equity (dividendes nuls)</div>
          <div><span style={{ color: ACCENT }}>Contexte :</span> Commodités, taux, énergie</div>
        </div>
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Interprétation des termes F·N(d₁) et K·N(d₂) en Black-76</div>
        <Step num={1} accent={ACCENT}>F · N(d₁) — "la jambe forward" : valeur espérée de recevoir le futures F_T si exercé (sous Q^F, la mesure futures). Même logique que S·N(d₁) en B-S, mais avec le forward F à la place du spot S. N(d₁) est la probabilité sous Q^F que l'option finisse ITM.</Step>
        <Step num={2} accent={ACCENT}>K · N(d₂) — "la jambe strike" : valeur actuelle du strike × probabilité d'exercice sous Q standard. N(d₂) = P^Q(F_T {'>'} K), la probabilité risque-neutre que le futures dépasse K à maturité.</Step>
        <Step num={3} accent={ACCENT}>e^(−rT) devant le tout : le futures F lui-même n'a pas de valeur initiale (contrat à coût nul) → pas de terme d'actualisation de S. Mais la prime de l'option doit être actualisée de T à 0, d'où e^(−rT) × [F·N(d₁) − K·N(d₂)].</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          Toujours la même structure : ce qu'on reçoit (le futures F_T) moins ce qu'on paie (le strike K), pondéré par les probabilités sous leurs mesures respectives. Black-76 = Black-Scholes avec S remplacé par F et le coût de portage supprimé (déjà incorporé dans F).
        </div>
      </div>

      <Grid cols={3} gap="8px">
        <Slider label="F (prix forward)" value={F} min={40} max={200} step={1} onChange={setF} accent={ACCENT} format={v => `${v}$/bbl`} />
        <Slider label="K (strike)" value={K} min={40} max={200} step={1} onChange={setK} accent={T.a5} format={v => `${v}$/bbl`} />
        <Slider label="T (maturité)" value={T2} min={0.05} max={2} step={0.05} onChange={setT2} accent={T.muted} format={v => `${v.toFixed(2)}a`} />
        <Slider label="r (taux)" value={r} min={0} max={0.12} step={0.005} onChange={setR} accent={T.muted} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="σ (volatilité)" value={sigma} min={0.05} max={0.8} step={0.01} onChange={setSigma} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="Call (B76)" value={call76.toFixed(4)} unit="$/bbl" accent={ACCENT} />
        <InfoChip label="Put (B76)" value={put76.toFixed(4)} unit="$/bbl" accent={T.a2} />
        <InfoChip label="d₁" value={d1.toFixed(4)} accent={T.muted} />
        <InfoChip label="d₂" value={d2.toFixed(4)} accent={T.muted} />
        <InfoChip label="F/K" value={(F / K).toFixed(3)} accent={T.a5} />
      </div>

      <Accordion title="Exercice — Pricer un cap sur gaz naturel avec Black-76" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>
          Un producteur de gaz veut acheter un cap (call) sur le prix du gaz naturel.
          F = 3.50 $/MMBtu (futures à 6 mois), K = 4.00 $/MMBtu, T = 0.5 an, r = 3%, σ = 45%.
        </p>
        <Step num={1} accent={ACCENT}>d₁ = [ln(3.50/4.00) + (0.45²/2) × 0.5] / (0.45 × √0.5)</Step>
        <Step num={2} accent={ACCENT}>= [ln(0.875) + 0.05063] / (0.45 × 0.7071) = [-0.13353 + 0.05063] / 0.31820</Step>
        <Step num={3} accent={ACCENT}>= -0.08290 / 0.31820 = -0.2604</Step>
        <Step num={4} accent={ACCENT}>d₂ = -0.2604 - 0.31820 = -0.5786</Step>
        <Step num={5} accent={ACCENT}>N(d₁) = N(-0.2604) ≈ 0.3973 ; N(d₂) = N(-0.5786) ≈ 0.2814</Step>
        <Step num={6} accent={ACCENT}>Call B76 = e^(-0.03×0.5) × [3.50 × 0.3973 - 4.00 × 0.2814]</Step>
        <Step num={7} accent={ACCENT}>= 0.9851 × [1.3906 - 1.1256] = 0.9851 × 0.2650 = 0.261 $/MMBtu</Step>
        <FormulaBox accent={ACCENT}>Prime du cap = 0.261 $/MMBtu. Pour 10 000 MMBtu/mois × 6 mois = 60 000 MMBtu → coût total = 15 660$</FormulaBox>
      </Accordion>

      <ChartWrapper title="Black-76 : prix Call & Put en fonction de F (forward price)" accent={ACCENT} height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={profileData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="F" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <ReferenceLine x={K} stroke={T.border} label={{ value: `K=${K}`, fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 12 }} />
            <Line type="monotone" dataKey="call" stroke={ACCENT} strokeWidth={2.5} dot={false} name="Call Black-76" />
            <Line type="monotone" dataKey="put" stroke={T.a2} strokeWidth={2.5} dot={false} name="Put Black-76" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  )
}

// ─── Tab: Greeks ──────────────────────────────────────────────────────────────
export function GreeksTab() {
  const [S, setS] = useState(100)
  const [K, setK] = useState(100)
  const [T2, setT2] = useState(1)
  const [r, setR] = useState(0.05)
  const [sigma, setSigma] = useState(0.2)

  const g = bsGreeks(S, K, T2, r, sigma)
  const call = bs(S, K, T2, r, sigma, 'call')

  const greekVsS = useMemo(() => {
    const pts = []
    for (let s = 60; s <= 160; s += 2) {
      const gr = bsGreeks(s, K, T2, r, sigma)
      pts.push({ S: s, delta: +gr.delta.toFixed(4), gamma: +(gr.gamma * 100).toFixed(5), vega: +gr.vega.toFixed(4) })
    }
    return pts
  }, [K, T2, r, sigma])

  const greekVsT = useMemo(() => {
    const pts = []
    for (let t = 0.02; t <= 2; t += 0.04) {
      const gr = bsGreeks(S, K, t, r, sigma)
      pts.push({ T: +t.toFixed(2), vega: +gr.vega.toFixed(4), gamma: +(gr.gamma * 100).toFixed(5) })
    }
    return pts
  }, [S, K, r, sigma])

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
            content: 'Ratio de couverture (hedge ratio) : pour couvrir 1 call, vendre Δ actions. Call ATM : Δ ≈ 0.5. Call ITM profond : Δ → 1. Call OTM profond : Δ → 0. Propriété : Δ_call + |Δ_put| = 1 pour même strike/maturité (parité put-call différentiée). Le Delta est dynamique → il faut rééquilibrer le hedge en continu.',
          },
          {
            name: 'Gamma (Γ)',
            color: T.a3,
            content: 'Convexité de l\'option : Γ = ∂Δ/∂S = ∂²C/∂S². Toujours positif (long gamma = long convexité). Maximum pour les options ATM proches de l\'échéance. Coût de couverture dynamique : si Γ > 0, le hedge Delta génère un profit quadratique en (ΔS)². "Être long Gamma" signifie profiter des grands mouvements du marché.',
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
            content: 'Sensibilité au taux sans risque. Peu important pour options court terme (< 1 an). Crucial pour options longues et obligations. Rho_call > 0 : si r augmente, le coût de portage K·e^(-rT) baisse → call plus cher. Rho_put < 0 : symétrie inverse. En énergie : Rho souvent négligé car la vol domine.',
          },
          {
            name: 'Theta-Gamma tradeoff',
            color: ACCENT,
            content: 'La relation fondamentale de la PDE B-S : Θ + ½Γσ²S² = rV. Dans un portefeuille Delta-neutre (Δ=0) : Θ et Γ se compensent exactement ! Être long Gamma (profiter des mouvements) coûte du Theta (perte de valeur temps quotidienne). Le marché fixe ce prix implicitement via la vol implicite.',
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
        Θ + ½Γσ²S² = rV
        Dans un portefeuille Delta-neutre (V = call, Δ = 0 couvert) :
        -(valeur temps perdue/j) = ½Γσ²S²  [gain de convexité espéré]
        Le marché fixe ce "prix du Gamma" via la vol implicite σ.
      </FormulaBox>

      <Accordion title="Exercice — Attribution complète du P&L (Taylor expansion)" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text }}>
          Call sur WTI : S = 80$/bbl, K = 80$, T = 0.5 an, σ = 30%, r = 4%.
          Δ = 0.58, Γ = 0.021, ν = 0.22 (par 1% vol), Θ = -0.08 (par jour).
          Le lendemain : S → 82$, σ implicite → 31%. Calculez le P&L du call.
        </p>
        <Step num={1} accent={ACCENT}>Contribution Delta : Δ × ΔS = 0.58 × (+2) = +1.16 $/bbl</Step>
        <Step num={2} accent={ACCENT}>Contribution Gamma : ½Γ(ΔS)² = ½ × 0.021 × 4 = +0.042 $/bbl</Step>
        <Step num={3} accent={ACCENT}>Contribution Vega : ν × Δσ = 0.22 × (+1%) = +0.22 $/bbl</Step>
        <Step num={4} accent={ACCENT}>Contribution Theta : Θ × Δt = -0.08 × 1 = -0.08 $/bbl</Step>
        <Step num={5} accent={ACCENT}>P&L total ≈ 1.16 + 0.042 + 0.22 - 0.08 = +1.342 $/bbl</Step>
        <FormulaBox accent={ACCENT}>P&L = Δ·ΔS + ½Γ(ΔS)² + ν·Δσ + Θ·Δt ≈ +1.342 $/bbl par bbl de notionnel</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>Pour 1 000 barils de notionnel : P&L total ≈ +1 342$</div>
      </Accordion>

      <Grid cols={5} gap="8px">
        <Slider label="S" value={S} min={60} max={160} step={1} onChange={setS} accent={ACCENT} format={v => `${v}€`} />
        <Slider label="K" value={K} min={60} max={160} step={1} onChange={setK} accent={T.a5} format={v => `${v}€`} />
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
          { name: 'Call BS', val: call.toFixed(4), desc: `S=${S}€, K=${K}€`, interp: `${S >= K ? 'ITM' : 'OTM'} (moneyness ${(S / K).toFixed(2)})`, c: ACCENT },
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
              <ReferenceLine x={K} stroke={T.border} strokeDasharray="3 3" />
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
              <ReferenceLine x={K} stroke={T.border} strokeDasharray="3 3" />
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
export function MonteCarloTab() {
  const [S, setS] = useState(100)
  const [K, setK] = useState(105)
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
      payoffsCall.push(Math.max(ST - K, 0))
      payoffsPut.push(Math.max(K - ST, 0))
    }
    const df = Math.exp(-r * T2)
    const mcCall = df * payoffsCall.reduce((a, b) => a + b, 0) / nSim
    const mcPut = df * payoffsPut.reduce((a, b) => a + b, 0) / nSim

    // Histogram of call payoffs
    const bins = {}
    const bw = Math.max(5, Math.round(K * 0.05))
    payoffsCall.forEach(p => {
      const bin = Math.round(p / bw) * bw
      bins[bin] = (bins[bin] || 0) + 1
    })
    const histData = Object.entries(bins)
      .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
      .map(([payoff, count]) => ({ payoff: parseFloat(payoff).toFixed(0), count, pct: (count / nSim * 100).toFixed(1) }))

    return { mcCall, mcPut, histData }
  }, [S, K, T2, r, sigma, nSim, key])

  const bsCall = bs(S, K, T2, r, sigma, 'call')
  const bsPut = bs(S, K, T2, r, sigma, 'put')
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
        C_MC = e^(-rT) × (1/N) × Σᵢ max(S_T^(i) - K, 0)

        où S_T^(i) = S₀ × exp[(r - σ²/2)T + σ√T × Zᵢ],  Zᵢ ~ N(0,1)
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Discrétisation de l'EDS : schéma d'Euler-Maruyama</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Pour les modèles sans solution analytique (MRJD, Heston, etc.), on discrétise l'EDS en N pas de temps.
      </div>
      <FormulaBox accent={ACCENT} label="Schéma d'Euler-Maruyama vs Solution exacte">
        Euler-Maruyama : S(t+Δt) ≈ S(t) + µ·S(t)·Δt + σ·S(t)·√Δt·Z
        Solution exacte (GBM) : S(t+Δt) = S(t) × exp[(µ-σ²/2)Δt + σ√Δt·Z]

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
        <Slider label="K" value={K} min={60} max={160} step={1} onChange={setK} accent={T.a5} format={v => `${v}€`} />
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
        <Step num={1} accent={ACCENT}>Payoff straddle = max(S_T - 100, 0) + max(100 - S_T, 0) = |S_T - 100|</Step>
        <Step num={2} accent={ACCENT}>Simulation : S_T = 100 × exp[(0.03 - 0.03125) × 0.5 + 0.25 × √0.5 × Z]</Step>
        <Step num={3} accent={ACCENT}>= 100 × exp[-0.00063 + 0.17678 × Z]</Step>
        <Step num={4} accent={ACCENT}>Par B-S : C_BS = bs(100, 100, 0.5, 0.03, 0.25, 'call') ≈ 6.88€</Step>
        <Step num={5} accent={ACCENT}>P_BS = bs(100, 100, 0.5, 0.03, 0.25, 'put') ≈ 5.42€ (parité put-call)</Step>
        <Step num={6} accent={ACCENT}>Prix straddle B-S = C + P ≈ 6.88 + 5.42 = 12.30€</Step>
        <FormulaBox accent={ACCENT}>Straddle ≈ 12.30€ = 12.3% de S₀ — "le marché anticipe un mouvement de ±12.3% sur 6 mois"</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>Le prix du straddle est une mesure directe de la volatilité attendue par le marché.</div>
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

// ─── Tab: Arbres Binomiaux ────────────────────────────────────────────────────
export function ArbreTab() {
  const [S0, setS0] = useState(100)
  const [K, setK] = useState(100)
  const [r, setR] = useState(0.05)
  const [sigma, setSigma] = useState(0.2)
  const [Tmat, setTmat] = useState(1)
  const [N, setN] = useState(3)
  const [optType, setOptType] = useState('call')
  const [optStyle, setOptStyle] = useState('european')

  const dt = Tmat / N
  const u = Math.exp(sigma * Math.sqrt(dt))
  const d = 1 / u
  const p = (Math.exp(r * dt) - d) / (u - d)
  const disc = Math.exp(-r * dt)

  const tree = useMemo(() => {
    const S = []
    for (let i = 0; i <= N; i++) {
      S.push([])
      for (let j = 0; j <= i; j++) S[i].push(S0 * Math.pow(u, j) * Math.pow(d, i - j))
    }
    const V = []
    for (let i = 0; i <= N; i++) V.push(new Array(i + 1).fill(0))
    for (let j = 0; j <= N; j++) {
      V[N][j] = optType === 'call' ? Math.max(S[N][j] - K, 0) : Math.max(K - S[N][j], 0)
    }
    for (let i = N - 1; i >= 0; i--) {
      for (let j = 0; j <= i; j++) {
        const cont = disc * (p * V[i + 1][j + 1] + (1 - p) * V[i + 1][j])
        const intr = optType === 'call' ? Math.max(S[i][j] - K, 0) : Math.max(K - S[i][j], 0)
        V[i][j] = optStyle === 'american' ? Math.max(intr, cont) : cont
      }
    }
    return { S, V }
  }, [S0, K, r, sigma, Tmat, N, optType, optStyle])

  const { S, V } = tree
  const price = V[0][0]
  const treeH = Math.max(300, (N + 1) * 60)

  return (
    <div>
      <IntuitionBlock emoji="🌳" title="L'arbre binomial : le temps en tranches" accent={ACCENT}>
        Idée : diviser T en N petites périodes. À chaque période, le prix monte (×u) ou descend (×d).
        On calcule les payoffs aux nœuds terminaux, puis on remonte en actualisant au taux risque-neutre.
        C'est de la <strong>programmation dynamique</strong>. Avantage clé : les <strong>options américaines</strong>
        (exercice anticipé) se traitent naturellement — comparer à chaque nœud l'exercice immédiat
        vs la continuation. B-S n'a pas de formule fermée pour le put américain !
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Paramétrage CRR (Cox-Ross-Rubinstein, 1979)</SectionTitle>
      <FormulaBox accent={ACCENT} label="Calibration sur σ">
        u = e^(σ√Δt)    d = 1/u    Δt = T/N
        p* = (e^(rΔt) - d) / (u - d)    [probabilité risque-neutre]
        V(nœud) = e^(-rΔt) × [p* × V_up + (1-p*) × V_down]
      </FormulaBox>
      <SymbolLegend accent={ACCENT} symbols={[
        ['u / d', 'Facteurs montée/descente — calibrés pour que σ_tree = σ_BS'],
        ['p*', "Probabilité risque-neutre (≠ prob. réelle) — drift = taux sans risque"],
        ['e^(-rΔt)', 'Actualisation par période'],
        ['Exercice américain', 'À chaque nœud i : V = max(exercice immédiat, continuation)'],
        ['N → ∞', 'L\'arbre converge vers la formule B-S (pour options européennes)'],
      ]} />

      <Grid cols={3} gap="10px">
        <Slider label="S₀" value={S0} min={50} max={200} step={5} onChange={setS0} accent={ACCENT} format={v => `${v}€`} />
        <Slider label="K (strike)" value={K} min={50} max={200} step={5} onChange={setK} accent={T.a5} format={v => `${v}€`} />
        <Slider label="r (taux)" value={r} min={0} max={0.15} step={0.005} onChange={setR} accent={T.a3} format={v => `${(v * 100).toFixed(1)}%`} />
        <Slider label="σ (vol)" value={sigma} min={0.05} max={0.6} step={0.01} onChange={setSigma} accent={T.a6} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="T (maturité)" value={Tmat} min={0.25} max={3} step={0.25} onChange={setTmat} accent={T.a7} format={v => `${v.toFixed(2)}a`} />
        <Slider label="N (étapes)" value={N} min={1} max={6} step={1} onChange={setN} accent={T.muted} format={v => v.toFixed(0)} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['call', 'put'].map(t => (
          <button key={t} onClick={() => setOptType(t)} style={{
            background: optType === t ? `${ACCENT}22` : T.panel2,
            border: `1px solid ${optType === t ? ACCENT : T.border}`,
            color: optType === t ? ACCENT : T.muted,
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: optType === t ? 700 : 400,
          }}>{t === 'call' ? 'Call' : 'Put'}</button>
        ))}
        {['european', 'american'].map(s => (
          <button key={s} onClick={() => setOptStyle(s)} style={{
            background: optStyle === s ? `${T.a6}22` : T.panel2,
            border: `1px solid ${optStyle === s ? T.a6 : T.border}`,
            color: optStyle === s ? T.a6 : T.muted,
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: optStyle === s ? 700 : 400,
          }}>{s === 'european' ? 'Européen' : 'Américain'}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="u" value={u.toFixed(4)} accent={ACCENT} />
        <InfoChip label="d" value={d.toFixed(4)} accent={T.a5} />
        <InfoChip label="p* (RN)" value={p.toFixed(4)} accent={T.a3} />
        <InfoChip label="Δt" value={`${(dt * 365).toFixed(0)}j`} accent={T.a6} />
        <InfoChip label={`Prix ${optType} ${optStyle}`} value={`${price.toFixed(2)}€`} accent={T.a7} />
      </div>

      <SectionTitle accent={ACCENT}>Arbre interactif (N={N} étapes) — S en gris, V en couleur</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, minWidth: `${(N + 1) * 110}px`, height: `${treeH}px`, position: 'relative' }}>
          {Array.from({ length: N + 1 }, (_, step) => (
            <div key={step} style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 2, left: 0, right: 0, textAlign: 'center', color: T.muted, fontSize: 9 }}>
                {step === 0 ? 't=0' : step === N ? 't=T' : `t=${step}Δt`}
              </div>
              {Array.from({ length: step + 1 }, (_, j) => {
                const frac = N > 0 ? j / N : 0.5
                const topPx = (1 - frac) * (treeH - 54)
                const sVal = S[step][j]
                const vVal = V[step][j]
                const intr = optType === 'call' ? Math.max(sVal - K, 0) : Math.max(K - sVal, 0)
                const earlyEx = optStyle === 'american' && step > 0 && step < N && intr > 0 && Math.abs(vVal - intr) < 0.01
                const isTerminal = step === N
                return (
                  <div key={j} style={{
                    position: 'absolute', top: topPx, left: 4, right: 4,
                    background: isTerminal ? `${ACCENT}22` : earlyEx ? `${T.a6}22` : T.panel2,
                    border: `1px solid ${isTerminal ? ACCENT : earlyEx ? T.a6 : T.border}`,
                    borderRadius: 7, padding: '4px 6px', textAlign: 'center',
                  }}>
                    <div style={{ color: T.muted, fontSize: 9 }}>{sVal.toFixed(1)}</div>
                    <div style={{ color: isTerminal ? ACCENT : T.text, fontWeight: 700, fontSize: 12 }}>{vVal.toFixed(2)}</div>
                    {earlyEx && <div style={{ color: T.a6, fontSize: 8 }}>★ ex.</div>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div style={{ color: T.muted, fontSize: 10, textAlign: 'center', marginTop: 4 }}>
          Chaque nœud : haut = S (prix sous-jacent) · bas = V (valeur option) · ★ = exercice américain optimal
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Convergence de l'arbre vers Black-Scholes quand N → ∞</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        C'est un résultat fondamental : le prix binomial CRR converge vers le prix Black-Scholes quand N → ∞.
        Intuition : avec N grand, la distribution des prix terminaux dans l'arbre converge vers une loi log-normale
        (par le TCL appliqué aux N pas iid), et la probabilité risque-neutre p* → N(d₁).
      </div>
      <FormulaBox accent={ACCENT} label="Convergence binomial → Black-Scholes">
        Somme pondérée des payoffs terminaux → e^(-rT) E^Q[max(S_T - K, 0)]
        p* → N(d₁) quand N → ∞ (par TCL sur la distribution binomiale)
        Prix binomial(N=50) ≈ Prix BS à 0.01% près (convergence oscillatoire)
        Prix américain : pas de formule B-S fermée → l'arbre est irremplaçable !
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Intérêt pédagogique et pratique de l'arbre :</strong>
        <div style={{ marginTop: 6 }}>
          <strong>1. Vérification de B-S :</strong> Pour N = 50 pas, le prix binomial coïncide avec B-S à moins de 0.1%. C'est une validation numérique de la formule analytique.
          <br /><strong>2. Options américaines :</strong> La formule B-S ne s'applique pas aux puts américains (exercice anticipé optimal possible). L'arbre reste la méthode de référence.
          <br /><strong>3. Options à dividendes discrets :</strong> L'arbre s'adapte naturellement aux dividendes ponctuels.
          <br /><strong>4. Arbre trinomial :</strong> 3 états (up, mid, down) → convergence 2× plus rapide, idéal pour options à barrière et modèles OU en énergie.
        </div>
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '12px 0', fontSize: 13, color: T.text, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Trinomial tree (mention) :</strong> Au lieu de 2, on a 3 états possibles (up, mid, down).
        Avantage : convergence plus rapide pour les options à barrière et les processus mean-reverting.
        L'arbre trinomial est l'extension naturelle pour les modèles OU utilisés en énergie.
      </div>

      <ExampleBlock title="Put américain vs européen — Exercice anticipé optimal" accent={ACCENT}>
        <p>S₀=100€, K=110€, r=5%, σ=20%, T=1an — put profondément dans la monnaie</p>
        <Step num={1} accent={ACCENT}>Put européen : on ne peut pas exercer tôt même si intrinsic = 10€</Step>
        <Step num={2} accent={ACCENT}>Put américain : si la valeur de continuation {'<'} intrinsic = max(K-S,0), on exerce immédiatement</Step>
        <Step num={3} accent={ACCENT}>Le put américain vaut toujours ≥ put européen (early exercise premium ≥ 0)</Step>
        <Step num={4} accent={ACCENT}>Pour un call américain sur actif sans dividende : jamais optimal d'exercer tôt → même prix que call européen</Step>
      </ExampleBlock>

      <Accordion title="Exercice — Arbre à 2 étapes (call européen)" accent={ACCENT} badge="Entraînement">
        <p style={{ color: T.text }}>S₀=100, K=100, r=5%, σ=20%, T=0.5an, N=2. Calculez le prix du call.</p>
        <Step num={1} accent={ACCENT}>Δt=0.25 ; u=e^(0.2×√0.25)=e^(0.10)=1.1052 ; d=0.9048 ; p=(e^(0.0125)-0.9048)/0.2004=0.5359</Step>
        <Step num={2} accent={ACCENT}>Terminaux : S_uu=122.1→C=22.1 ; S_ud=100→C=0 ; S_dd=81.9→C=0</Step>
        <Step num={3} accent={ACCENT}>Nœud u : C_u = e^(-0.0125)×(0.5359×22.1+0.4641×0) = 11.69</Step>
        <Step num={4} accent={ACCENT}>Nœud d : C_d = 0</Step>
        <FormulaBox accent={ACCENT}>C₀ = e^(-0.0125)×(0.5359×11.69+0) = 6.18€</FormulaBox>
      </Accordion>
    </div>
  )
}

// ─── Tab: Options Exotiques (Path-Dependent) ──────────────────────────────────
export function ExotiquesTab() {
  const [S0, setS0] = useState(100)
  const [K, setK] = useState(100)
  const [r, setR] = useState(0.05)
  const [sigma, setSigma] = useState(0.25)
  const [Tmat, setTmat] = useState(1)
  const [barrier, setBarrier] = useState(85)
  const [nSim, setNSim] = useState(2000)
  const [key, setKey] = useState(0)

  const results = useMemo(() => {
    const n = 252
    const dt = Tmat / n
    let asianCall = 0, vanillaCall = 0, koCall = 0, kiCall = 0
    let asianCount = 0, vanillaCount = 0, koCount = 0, kiCount = 0

    for (let sim = 0; sim < nSim; sim++) {
      let S = S0
      let sumS = S0
      let minS = S0
      for (let i = 1; i <= n; i++) {
        S *= Math.exp((r - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * gaussRandM4())
        sumS += S
        if (S < minS) minS = S
      }
      const avg = sumS / (n + 1)
      const disc = Math.exp(-r * Tmat)
      // Vanilla call
      vanillaCall += disc * Math.max(S - K, 0)
      // Asian call (average price)
      asianCall += disc * Math.max(avg - K, 0)
      // Knock-out call (barrier H, if min < H → knocked out)
      koCall += disc * (minS > barrier ? Math.max(S - K, 0) : 0)
      // Knock-in call (pays only if min < H at some point)
      kiCall += disc * (minS <= barrier ? Math.max(S - K, 0) : 0)
    }
    return {
      vanilla: (vanillaCall / nSim).toFixed(2),
      asian: (asianCall / nSim).toFixed(2),
      ko: (koCall / nSim).toFixed(2),
      ki: (kiCall / nSim).toFixed(2),
    }
  }, [S0, K, r, sigma, Tmat, barrier, nSim, key])

  // Sample paths for visualization
  const samplePaths = useMemo(() => {
    const paths = []
    const n = 52
    const dt = Tmat / n
    for (let p = 0; p < 4; p++) {
      let S = S0
      const pts = [{ t: 0, S: S0 }]
      for (let i = 1; i <= n; i++) {
        S *= Math.exp((r - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * gaussRandM4())
        pts.push({ t: +(i * dt).toFixed(3), S: +S.toFixed(2) })
      }
      paths.push(pts)
    }
    return paths
  }, [S0, sigma, r, Tmat, key])

  const COLORS = [ACCENT, T.a5, T.a6, T.a3]
  const chartData = [
    { name: 'Vanilla', value: parseFloat(results.vanilla), fill: ACCENT },
    { name: 'Asian', value: parseFloat(results.asian), fill: T.a5 },
    { name: 'K-O (down)', value: parseFloat(results.ko), fill: T.a3 },
    { name: 'K-I (down)', value: parseFloat(results.ki), fill: T.a6 },
  ]

  return (
    <div>
      <IntuitionBlock emoji="🌀" title="Options exotiques : path-dependent" accent={ACCENT}>
        Contrairement aux vanilles (payoff dépend uniquement de S_T), les <strong>options exotiques
        path-dependent</strong> ont des payoffs qui dépendent de toute la trajectoire de S.
        En énergie c'est crucial : un producteur de pétrole se couvre sur le <em>prix moyen mensuel</em>
        (Asian), pas sur le prix spot d'un jour. Course DPH3V Module 302 : "path-dependent option valuation."
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>1. Options Asiatiques (Average Price)</SectionTitle>
      <FormulaBox accent={ACCENT} label="Payoff — Asian call (fixed strike)">
        Payoff = max(Ā - K, 0)   où Ā = (1/n) Σᵢ S(tᵢ)  [moyenne arithmétique]
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>
        Ā est moins volatile que S_T (effet de lissage) → <strong>Asian option moins chère</strong> qu'une vanilla.
        Très utilisée en énergie : règlements mensuels sur le prix moyen du gaz naturel ou du brut.
        Pas de formule fermée exacte pour la moyenne arithmétique → <strong>Monte Carlo ou approximation de Turnbull-Wakeman.</strong>
      </div>

      <SectionTitle accent={ACCENT}>2. Options à Barrière (Barrier Options)</SectionTitle>
      <Grid cols={2} gap="12px">
        <FormulaBox accent={ACCENT} label="Knock-Out (KO) — Call down-and-out">
          Payoff = max(S_T - K, 0) × 1[min(S) {'>'} H]
          Si le prix touche H → l'option s'annule (knocked out)
        </FormulaBox>
        <FormulaBox accent={T.a5} label="Knock-In (KI) — Call down-and-in">
          Payoff = max(S_T - K, 0) × 1[min(S) ≤ H]
          L'option ne vit que si le prix a touché H
        </FormulaBox>
      </Grid>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>
        Relation clé : <strong>KO + KI = Vanilla</strong> (parité barrière).
        Le KO est moins cher que la vanilla (risque annulation). Le KI en est le complément.
        En énergie : un producteur achète un KO-put avec H bien en dessous du marché — moins cher,
        annulé seulement si le prix s'effondre au-delà de la barrière.
      </div>

      <Grid cols={3} gap="10px">
        <Slider label="S₀" value={S0} min={50} max={200} step={5} onChange={setS0} accent={ACCENT} format={v => `${v}€`} />
        <Slider label="K (strike)" value={K} min={50} max={200} step={5} onChange={setK} accent={T.a5} format={v => `${v}€`} />
        <Slider label="H (barrière KO/KI)" value={barrier} min={30} max={K - 5} step={5} onChange={setBarrier} accent={T.a3} format={v => `${v}€`} />
        <Slider label="σ (vol)" value={sigma} min={0.05} max={0.6} step={0.01} onChange={setSigma} accent={T.a6} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="T (maturité)" value={Tmat} min={0.25} max={2} step={0.25} onChange={setTmat} accent={T.a7} format={v => `${v.toFixed(2)}a`} />
        <Slider label="Simulations" value={nSim} min={500} max={5000} step={500} onChange={setNSim} accent={T.muted} format={v => v.toLocaleString()} />
      </Grid>

      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, margin: '12px 0',
      }}>🔄 Relancer Monte Carlo</button>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <InfoChip label="Vanilla call" value={`${results.vanilla}€`} accent={ACCENT} />
        <InfoChip label="Asian call" value={`${results.asian}€`} accent={T.a5} />
        <InfoChip label="KO call (H={barrier})" value={`${results.ko}€`} accent={T.a3} />
        <InfoChip label="KI call (H={barrier})" value={`${results.ki}€`} accent={T.a6} />
        <InfoChip label="KO + KI" value={`${(parseFloat(results.ko) + parseFloat(results.ki)).toFixed(2)}€`} accent={T.muted} />
      </div>

      <Grid cols={2} gap="16px">
        <ChartWrapper title="Comparaison des prix (Monte Carlo)" accent={ACCENT} height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" stroke={T.muted} tick={{ fill: T.muted, fontSize: 11 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Bar dataKey="value" name="Prix (€)" fill={ACCENT} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title={`4 trajectoires — Barrière KO H=${barrier}€`} accent={T.a3} height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="t" type="number" domain={[0, Tmat]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <ReferenceLine y={barrier} stroke={T.a3} strokeWidth={2} strokeDasharray="5 3" label={{ value: `H=${barrier}`, fill: T.a3, fontSize: 10 }} />
              <ReferenceLine y={K} stroke={ACCENT} strokeDasharray="3 3" label={{ value: `K=${K}`, fill: ACCENT, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              {samplePaths.map((p, i) => (
                <Line key={i} data={p} type="monotone" dataKey="S" stroke={COLORS[i]} strokeWidth={1.5} dot={false} name={`Path ${i + 1}`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>

      <ExampleBlock title="Couverture carburant — Compagnie aérienne (option asiatique)" accent={ACCENT}>
        <p>Une compagnie achète du kérosène au <em>prix moyen mensuel</em>. Elle veut se couvrir contre une hausse.</p>
        <Step num={1} accent={ACCENT}>Option vanilla : payoff sur le prix spot à une date → inadaptée (elle achète tout le mois)</Step>
        <Step num={2} accent={ACCENT}>Option asiatique : payoff = max(Ā_mois - K, 0) → parfaitement alignée avec son exposition</Step>
        <Step num={3} accent={ACCENT}>Asian moins chère que vanilla (σ_Ā {'<'} σ_S_T car lissage) → réduction de coût de 20-40% typique</Step>
        <Step num={4} accent={ACCENT}>Prix MC Asian ≈ {results.asian}€ vs Vanilla ≈ {results.vanilla}€ (avec les paramètres actuels)</Step>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>3. Swing Options — Le contrat le plus courant en énergie gaz</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Les <strong>swing options</strong> (ou options à volume variable) sont quasi-universelles dans les contrats de gaz naturel
        à long terme. Elles donnent à l'acheteur le <em>droit de moduler ses volumes</em> de prélèvement
        dans une fourchette prédéfinie, à un prix fixé (strike) ou indexé, sur une période donnée (1 mois, 1 trimestre, 1 an).
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Structure d'un contrat swing typique :</strong>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Volumes :</strong> Volume minimum journalier (q_min) et maximum (q_max). Le distributeur peut prendre entre q_min et q_max chaque jour.
            Sur l'année : volume total entre Q_min et Q_max (contraintes cumulatives).
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Droits d'exercice ("swings") :</strong> Nombre limité de fois où l'acheteur peut passer de q_min à q_max ou inversement.
            Ex : maximum 50 changements de volume par an. Chaque exercice = 1 "swing".
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Prix :</strong> Strike K fixé à l'avance (ou formule d'indexation sur TTF, NBP, Henry Hub).
            Payoff journalier = (K_marché - K_contrat) × q_j si K_marché {'>'} K_contrat, sinon prendre q_min.
          </div>
          <div>
            <strong>Valeur de la swing option :</strong> C'est la valeur des droits de flexibilité. Elle dépend de la corrélation temporelle des prix,
            de la vol, de la mean-reversion, et des contraintes de volume. Pas de formule fermée →
            <strong> Monte Carlo avec programmation dynamique</strong> ou arbres trinomiaux.
          </div>
        </div>
      </div>
      <FormulaBox accent={ACCENT} label="Payoff d'une swing option (1 période)">
        Payoff = Σₜ max[(F(t) - K), 0] × qₜ  soumis à q_min ≤ qₜ ≤ q_max
        et Q_min ≤ ΣqDt ≤ Q_max  [contraintes de volume cumulatif]
        Droit = choisir qₜ de manière optimale à chaque date t
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Intuition économique :</strong> Le producteur de gaz vend une swing option à un distributeur.
        Quand les prix de marché sont élevés (vague de froid), le distributeur achète q_max et revend au marché → profit.
        Quand les prix sont bas, il prend q_min et achète au marché → économie.
        La valeur de ce contrat = valeur de la flexibilité = "real option value".
        En pratique, les contrats long terme GNL (gaz naturel liquéfié) contiennent souvent des clauses "take-or-pay"
        qui sont économiquement équivalentes à des swing options.
      </div>

      <Accordion title="Exercice — Parité KO + KI = Vanilla" accent={ACCENT} badge="Conceptuel">
        <p style={{ color: T.text }}>Expliquez pourquoi un KO call + un KI call (mêmes paramètres) = vanilla call.</p>
        <Step num={1} accent={ACCENT}>KO call paie si S_T {'>'} K ET le prix n'a jamais touché H</Step>
        <Step num={2} accent={ACCENT}>KI call paie si S_T {'>'} K ET le prix a touché H à un moment</Step>
        <Step num={3} accent={ACCENT}>Ces deux cas sont mutuellement exclusifs et exhaustifs (soit H touché, soit non)</Step>
        <FormulaBox accent={ACCENT}>KO + KI = P(S_T {'>'} K | jamais H) + P(S_T {'>'} K | au moins H) = P(S_T {'>'} K) = Vanilla ✓</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12 }}>Vérification : KO={results.ko}€ + KI={results.ki}€ = {(parseFloat(results.ko) + parseFloat(results.ki)).toFixed(2)}€ ≈ Vanilla={results.vanilla}€</div>
      </Accordion>
    </div>
  )
}

// ─── Main Module 4 ────────────────────────────────────────────────────────────
const TABS = ['No-Arbitrage', 'Black-Scholes', 'Black-76', 'Greeks', 'Monte Carlo', 'Arbres Binomiaux', 'Exotiques']

export default function Module4() {
  const [tab, setTab] = useState('Black-Scholes')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      <ModuleHeader
        num={4}
        title="Pricing des Options"
        subtitle="De la parité put-call à Black-Scholes et Black-76, en passant par les Greeks et Monte Carlo — le cœur du pricing de dérivés en énergie."
        accent={ACCENT}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} accent={ACCENT} />
      <ErrorBoundary name="NoArbTab">{tab === 'No-Arbitrage' && <NoArbTab />}</ErrorBoundary>
      <ErrorBoundary name="BSTab">{tab === 'Black-Scholes' && <BSTab />}</ErrorBoundary>
      <ErrorBoundary name="Black76Tab">{tab === 'Black-76' && <Black76Tab />}</ErrorBoundary>
      <ErrorBoundary name="GreeksTab">{tab === 'Greeks' && <GreeksTab />}</ErrorBoundary>
      <ErrorBoundary name="MonteCarloTab">{tab === 'Monte Carlo' && <MonteCarloTab />}</ErrorBoundary>
      <ErrorBoundary name="ArbreTab">{tab === 'Arbres Binomiaux' && <ArbreTab />}</ErrorBoundary>
      <ErrorBoundary name="ExotiquesTab">{tab === 'Exotiques' && <ExotiquesTab />}</ErrorBoundary>
    </div>
  )
}
