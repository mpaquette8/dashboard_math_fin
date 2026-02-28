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

export function MeanRevTab() {
  const [kappa, setKappa] = useState(2)
  const [theta, setTheta] = useState(80)
  const [sigma, setSigma] = useState(15)
  const [x0, setX0] = useState(100)
  const [key, setKey] = useState(0)

  const COLORS = [ACCENT, T.a4, T.a5]
  const paths = useMemo(() => {
    const n = 252
    const dt = 1 / n
    const result = []
    for (let p = 0; p < 3; p++) {
      let X = x0
      const pts = [{ t: 0, X: x0, theta: theta }]
      for (let i = 1; i <= n; i++) {
        X += kappa * (theta - X) * dt + sigma * Math.sqrt(dt) * gaussRand()
        if (i % 3 === 0) pts.push({ t: +(i * dt).toFixed(3), X: +X.toFixed(2), theta: theta })
      }
      result.push(pts)
    }
    return result
  }, [kappa, theta, sigma, x0, key])

  const halfLife = Math.log(2) / kappa

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Pourquoi la mean-reversion en énergie ?</strong> Contrairement aux actions, les prix de l'énergie sont
        ancrés à des fondamentaux économiques. Le <strong>coût marginal de production</strong> crée un plancher naturel :
        en dessous de ce niveau, les producteurs ferment des puits et l'offre baisse → le prix remonte.
        Symétriquement, quand le prix monte très haut, de nouveaux producteurs entrent sur le marché et l'offre augmente → le prix redescend.
        Ce mécanisme d'équilibre offre-demande crée un "ancrage fondamental" θ (le coût moyen de production à long terme).
        Pour le pétrole, θ ≈ 60-80$/bbl ; pour le gaz naturel, θ dépend de la région et de la saison.
        La vitesse de retour κ mesure à quelle vitesse ce rééquilibrage s'opère.
      </div>

      <IntuitionBlock emoji="🌀" title="Mean-Reversion : le retour à la moyenne" accent={ACCENT}>
        Les prix de l'énergie ne dérivent pas infiniment comme un GBM.
        Le gaz naturel revient vers un niveau "d'équilibre" (coût marginal de production).
        Le modèle Ornstein-Uhlenbeck (OU) capture cette <strong>force de rappel</strong> :
        plus le prix s'éloigne de <K>{"\\theta"}</K>, plus il est "tiré" vers <K>{"\\theta"}</K> avec force <K>{"\\kappa"}</K>.
        C'est le modèle de base pour les taux d'intérêt (Vasicek) et les commodités.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Processus Ornstein-Uhlenbeck (OU)">
        <K display>{"dX = \\kappa(\\theta - X)\\,dt + \\sigma\\, dW"}</K>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Solution analytique du processus OU</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Contrairement au GBM, le processus OU admet une solution analytique exacte obtenue par le lemme d'Itô
        appliqué à <K>{"f(X,t) = X \\times e^{\\kappa t}"}</K> :
      </div>
      <FormulaBox accent={ACCENT} label="Solution exacte du processus OU">
        <K display>{"X(t) = X_0\\, e^{-\\kappa t} + \\theta\\big(1 - e^{-\\kappa t}\\big) + \\sigma\\!\\int_0^t e^{-\\kappa(t-s)}\\,dW(s)"}</K>
        <K display>{"E[X(t)] = \\theta + (X_0 - \\theta)\\, e^{-\\kappa t}"}</K>
        <K display>{"\\mathrm{Var}[X(t)] = \\frac{\\sigma^2(1 - e^{-2\\kappa t})}{2\\kappa}"}</K>
        <K display>{"\\mathrm{Var}[X(\\infty)] = \\frac{\\sigma^2}{2\\kappa} \\quad\\text{[variance stationnaire]}"}</K>
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Lecture de la solution :</strong>
        <div style={{ marginTop: 6 }}>
          Le terme <strong><K>{"X_0 \\cdot e^{-\\kappa t}"}</K></strong> représente la mémoire du point de départ — qui s'efface exponentiellement.
          Le terme <strong><K>{"\\theta(1 - e^{-\\kappa t})"}</K></strong> représente l'attraction vers la moyenne — qui monte de 0 à <K>{"\\theta"}</K>.
          Le terme <strong><K>{"\\sigma\\!\\int e^{-\\kappa(t-s)}dW(s)"}</K></strong> est la composante aléatoire — bruits passés filtrés exponentiellement.
          À l'équilibre (<K>{"t \\to \\infty"}</K>) : <K>{"X(\\infty) \\sim \\mathcal{N}(\\theta,\\, \\sigma^2/2\\kappa)"}</K> — le processus est <strong>stationnaire</strong> (sa distribution ne change plus).
        </div>
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie de la solution OU — <K>{"E[X(t)] = \\theta + (X_0 - \\theta)\\cdot e^{-\\kappa t}"}</K></div>
        <Step num={1} accent={ACCENT}><K>{"\\theta"}</K> — le niveau d'équilibre à long terme : la "valeur fondamentale" du pétrole, le coût marginal de production. C'est l'attracteur du processus — là où il revient toujours.</Step>
        <Step num={2} accent={ACCENT}><K>{"(X_0 - \\theta)"}</K> — l'écart initial par rapport à l'équilibre : si <K>{"X_0 > \\theta"}</K> (prix trop élevé), cet écart est positif ; si <K>{"X_0 < \\theta"}</K> (prix trop bas), il est négatif. C'est la "déviation" actuelle par rapport au fondamental.</Step>
        <Step num={3} accent={ACCENT}><K>{"e^{-\\kappa t}"}</K> — le facteur de décroissance exponentielle : la fraction de l'écart qui reste après t. À <K>{"t=0"}</K> : <K>{"e^0=1"}</K> (tout l'écart est là). À <K>{"t=t_{1/2}=\\ln(2)/\\kappa"}</K> : <K>{"e^{-\\kappa t}=1/2"}</K> (la moitié a disparu). À <K>{"t \\to \\infty"}</K> : <K>{"e^{-\\kappa t} \\to 0"}</K> (tout l'écart a disparu).</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          Synthèse : <K>{"E[X(t)]"}</K> = [équilibre LT] + [déviation initiale] × [facteur de décroissance]. Cas limites : si <K>{"t \\to \\infty"}</K>, <K>{"E[X(\\infty)] = \\theta"}</K> (convergence vers l'équilibre). Si <K>{"\\kappa = 0"}</K> (GBM), <K>{"e^0 = 1"}</K> → X reste indéfiniment à <K>{"X_0"}</K> (pas d'ancrage).
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Comparaison OU vs GBM</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Stationnarité', ou: 'Oui — distribution limite N(θ, σ²/2κ)', gbm: 'Non — variance → ∞ quand t→∞', c: ACCENT },
          { label: 'Tendance LT', ou: 'Retour vers θ (ancrage)', gbm: 'Drift µ indéfini (peut partir à l\'infini)', c: ACCENT },
          { label: 'Volatilité', ou: 'σ constante, vol limitée', gbm: 'σS → la vol absolue croît avec S', c: T.a5 },
          { label: 'Signe du prix', ou: 'Peut devenir négatif !', gbm: 'Toujours positif (log-normal)', c: T.a5 },
          { label: 'Application', ou: 'Énergie, taux d\'intérêt', gbm: 'Actions, forex (en 1ère approx.)', c: T.a4 },
          { label: 'Mean-reversion', ou: 'Oui (force κ)', gbm: 'Non (drift pur)', c: T.a4 },
        ].map((r, i) => (
          <div key={i} style={{ background: T.panel2, borderRadius: 7, padding: '10px 12px', border: `1px solid ${r.c}22`, fontSize: 12 }}>
            <div style={{ color: r.c, fontWeight: 700, marginBottom: 4 }}>{r.label}</div>
            <div style={{ color: T.text, marginBottom: 2 }}><span style={{ color: ACCENT }}>OU :</span> {r.ou}</div>
            <div style={{ color: T.muted }}><span style={{ color: T.a5 }}>GBM :</span> {r.gbm}</div>
          </div>
        ))}
      </div>

      <SectionTitle accent={ACCENT}>Exemples d'application du processus OU</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Modèle de Vasicek (1977) — Taux d'intérêt :</strong> <K>{"dr = \\kappa(\\theta - r)\\,dt + \\sigma\\,dW"}</K>.
        Le taux court <K>{"r"}</K> revient vers sa moyenne à long terme <K>{"\\theta"}</K>. Avantage : solution analytique pour les prix d'obligations.
        Limite : <K>{"r"}</K> peut devenir négatif (ce qui s'est révélé... réel, avec les taux négatifs post-2008 !).
      </div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
        <strong style={{ color: ACCENT }}>Modèle de Schwartz (1997) — Commodités :</strong> <K>{"dS = \\kappa(\\theta - \\ln S)\\,S\\,dt + \\sigma S\\,dW"}</K>.
        C'est un GBM avec mean-reversion sur le logarithme du prix. Plus réaliste que l'OU pur car S reste positif.
        Calibré sur les données historiques de pétrole, gaz, électricité.
        Le modèle à 2 facteurs de Schwartz-Smith (2000) est le standard industriel pour les options sur commodités.
      </div>

      <SymbolLegend accent={ACCENT} symbols={[
        ['κ', 'Vitesse de retour à la moyenne (mean-reversion speed)'],
        ['θ', 'Niveau moyen à long terme (long-run mean)'],
        ['σ', 'Volatilité instantanée'],
        ['κ(θ-X)', 'Force de rappel : positive si X<θ, négative si X>θ'],
      ]} />

      <FormulaBox accent={ACCENT} label="Demi-vie (half-life)">
        <K display>{"t_{1/2} = \\frac{\\ln 2}{\\kappa} \\quad\\text{— temps pour réduire l'écart à la moyenne de moitié}"}</K>
      </FormulaBox>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="Demi-vie" value={`${(halfLife * 365).toFixed(0)}j`} accent={ACCENT} />
        <InfoChip label="E[X(∞)]" value={`${theta}$/bbl`} accent={T.a4} />
        <InfoChip label="σ(X(∞))" value={`${(sigma / Math.sqrt(2 * kappa)).toFixed(1)}`} accent={T.a5} />
      </div>

      <Grid cols={2} gap="10px">
        <Slider label="κ (vitesse de rappel)" value={kappa} min={0.1} max={10} step={0.1} onChange={setKappa} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="θ (niveau moyen)" value={theta} min={40} max={150} step={1} onChange={setTheta} accent={T.a4} format={v => `${v}$/bbl`} />
        <Slider label="σ (volatilité)" value={sigma} min={1} max={50} step={1} onChange={setSigma} accent={T.a5} format={v => `${v}$/bbl`} />
        <Slider label="X₀ (prix initial)" value={x0} min={40} max={150} step={1} onChange={setX0} accent={T.muted} format={v => `${v}$/bbl`} />
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Rejouer</button>

      <Accordion title="Exercice — Demi-vie d'un processus OU" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Un modèle OU calibré sur le gaz naturel donne κ = 3.5/an. X₀ = 6 $/MMBtu, θ = 4 $/MMBtu. Calculez la demi-vie et E[X(t)] à t = 0.5 an.</p>
        <FormulaBox accent={ACCENT}><K>{"t_{1/2} = 72\\text{ jours},\\; E[X(0.5)] = 4.35\\text{ \\$/MMBtu},\\; \\sigma_{\\infty} = 0.45\\text{ \\$/MMBtu}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Demi-vie" ruleDetail="t₁/₂ = ln(2)/κ" accent={ACCENT}><K>{"t_{1/2} = \\frac{\\ln 2}{\\kappa} = \\frac{0.693}{3.5} = 0.198\\text{ an} = 72\\text{ jours}"}</K></DemoStep>
          <DemoStep num={2} rule="Processus d'Ornstein-Uhlenbeck" ruleDetail="E[X(t)] = θ + (X₀−θ)e^{−κt}" accent={ACCENT}>En 72 jours, l'écart initial <K>{"(6 - 4 = 2\\text{ \\$/MMBtu})"}</K> sera réduit de moitié → <K>{"E[X(72j)] = 5\\text{ \\$/MMBtu}"}</K></DemoStep>
          <DemoStep num={3} rule="Processus d'Ornstein-Uhlenbeck" ruleDetail="E[X(t)] = θ + (X₀−θ)e^{−κt}" accent={ACCENT}><K>{"E[X(0.5)] = 4 + 2 \\times e^{-1.75} = 4 + 2 \\times 0.1738 = 4.35\\text{ \\$/MMBtu}"}</K></DemoStep>
          <DemoStep num={4} rule="Processus d'Ornstein-Uhlenbeck" ruleDetail="Var[X(∞)] = σ²/(2κ)" accent={ACCENT}><K>{"\\mathrm{Var}[X(\\infty)] = \\frac{\\sigma^2}{2\\kappa} = \\frac{1.44}{7} = 0.206"}</K> → <K>{"\\sigma_{\\infty} = 0.45\\text{ \\$/MMBtu}"}</K></DemoStep>
        </Demonstration>
      </Accordion>

      <ChartWrapper title={`Processus OU — Prix pétrole avec mean-reversion vers θ=${theta}$/bbl`} accent={ACCENT} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" domain={[0, 1]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Temps (années)', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <ReferenceLine y={theta} stroke={T.a4} strokeWidth={2} strokeDasharray="6 3" label={{ value: `θ=${theta}`, fill: T.a4, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            {paths.map((p, i) => (
              <Line key={i} data={p} type="monotone" dataKey="X" stroke={COLORS[i]} strokeWidth={1.5} dot={false} name={`X${i + 1}(t)`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  )
}

export function JumpTab() {
  const [lambda, setLambda] = useState(5)
  const [muJ, setMuJ] = useState(0.0)
  const [sigJ, setSigJ] = useState(0.2)
  const [sigma, setSigma] = useState(0.2)
  const [key, setKey] = useState(0)

  function poissonRand(lam) {
    if (lam <= 0) return 0
    const L = Math.exp(-lam)
    let k = 0, p = 1
    do { k++; p *= Math.random() } while (p > L && k < 50)
    return k - 1
  }

  const n = 252, dt = 1 / n
  const COLORS = [ACCENT, T.a4, T.a5]

  const paths = useMemo(() => {
    const result = []
    for (let p = 0; p < 3; p++) {
      let S = 100
      const pts = [{ t: 0, S: +S.toFixed(2) }]
      for (let i = 1; i <= n; i++) {
        const Z = gaussRand()
        const nJumps = poissonRand(lambda * dt)
        const kbar = Math.exp(muJ + 0.5 * sigJ * sigJ) - 1
        let jumpLogSum = 0
        for (let j = 0; j < nJumps; j++) jumpLogSum += muJ + sigJ * gaussRand()
        S *= Math.exp((0.05 - lambda * kbar - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * Z + jumpLogSum)
        S = Math.max(S, 0.01)
        if (i % 3 === 0) pts.push({ t: +(i * dt).toFixed(3), S: +S.toFixed(2) })
      }
      result.push(pts)
    }
    return result
  }, [lambda, muJ, sigJ, sigma, key])

  const poissonData = useMemo(() => {
    const pts = [{ t: 0, N: 0 }]
    let N = 0, t = 0
    while (t < 1 && N < 80) {
      const inter = -Math.log(Math.max(1e-10, Math.random())) / lambda
      t += inter
      if (t < 1) {
        pts.push({ t: +t.toFixed(5), N })
        N++
        pts.push({ t: +(t + 0.00001).toFixed(5), N })
      }
    }
    pts.push({ t: 1, N })
    return pts
  }, [lambda, key])

  const pAtLeastOnePerMonth = 1 - Math.exp(-lambda / 12)

  return (
    <div>
      <IntuitionBlock emoji="💥" title="Les sauts : quand les prix bondissent" accent={ACCENT}>
        Le mouvement brownien est continu — mais les marchés de l'énergie ne le sont pas.
        Un ouragan ferme des plateformes → le gaz triple en quelques heures.
        Une décision OPEP → le pétrole chute de 10% instantanément.
        Le processus de Poisson modélise l'<strong>arrivée aléatoire</strong> de ces chocs ;
        le modèle de Merton combine ce processus à sauts avec une diffusion brownienne continue.
        La combinaison avec le mean-reversion (MRJD) est traitée dans l'onglet suivant.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>1. Processus de Poisson — Modèle des arrivées de sauts</SectionTitle>
      <FormulaBox accent={ACCENT} label="Processus de Poisson N(t)">
        <K display>{"P(N(t) = k) = e^{-\\lambda t} \\cdot \\frac{(\\lambda t)^k}{k!}"}</K>
        <K display>{"E[N(t)] = \\lambda t \\qquad \\mathrm{Var}[N(t)] = \\lambda t"}</K>
        <K display>{"\\text{Temps inter-arrivées : } \\tau \\sim \\mathrm{Exp}(\\lambda),\\; E[\\tau] = \\frac{1}{\\lambda}"}</K>
      </FormulaBox>
      <SymbolLegend accent={ACCENT} symbols={[
        ['λ', "Intensité : nombre moyen de sauts par an (ex: λ=5 → 1 saut tous les 73j)"],
        ['N(t)', "Processus de comptage — ne peut qu'augmenter, trajectoires en escalier"],
        ['dN', 'Vaut 1 avec probabilité λdt, 0 sinon (quand dt petit)'],
        ['τ ~ Exp(λ)', 'Temps entre sauts : P(τ > t) = e^(-λt), sans mémoire'],
      ]} />

      <SectionTitle accent={ACCENT}>2. Merton Jump Diffusion (1976) — Actifs financiers</SectionTitle>
      <FormulaBox accent={ACCENT} label="EDS — Merton">
        <K display>{"\\frac{dS}{S} = (\\mu - \\lambda\\bar{k})\\,dt + \\sigma\\,dW + (e^Y - 1)\\,dN"}</K>
        <K display>{"Y \\sim \\mathcal{N}(\\mu_J,\\, \\sigma_J^2), \\quad \\bar{k} = e^{\\mu_J + \\sigma_J^2/2} - 1 \\;\\text{ (correction drift)}"}</K>
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>
        La correction <strong><K>{"-\\lambda\\bar{k}"}</K></strong> garantit <K>{"E[S(t)] = S_0 e^{\\mu t}"}</K> malgré les sauts.
        <K>{"\\mu_J < 0"}</K> : sauts baissiers dominants (choc négatif type crash).
        <K>{"\\mu_J = 0"}</K> : sauts symétriques (perturbations neutres en espérance).
      </div>

      <Grid cols={2} gap="10px">
        <Slider label="λ (sauts/an)" value={lambda} min={1} max={20} step={0.5} onChange={setLambda} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="µ_J (moyenne saut)" value={muJ} min={-0.4} max={0.4} step={0.02} onChange={setMuJ} accent={T.a4} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ_J (taille saut)" value={sigJ} min={0.05} max={0.6} step={0.01} onChange={setSigJ} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ (diffusion)" value={sigma} min={0.05} max={0.5} step={0.01} onChange={setSigma} accent={T.a7} format={v => `${(v * 100).toFixed(0)}%`} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="λ sauts/an" value={lambda.toFixed(1)} accent={ACCENT} />
        <InfoChip label="E[τ] entre sauts" value={`${(365 / lambda).toFixed(0)}j`} accent={T.a4} />
        <InfoChip label="P(≥1 saut/mois)" value={`${(pAtLeastOnePerMonth * 100).toFixed(0)}%`} accent={T.a5} />
        <InfoChip label="Vol sauts ≈" value={`${(Math.sqrt(lambda * (muJ * muJ + sigJ * sigJ)) * 100).toFixed(0)}%`} accent={T.a7} />
      </div>

      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelles trajectoires</button>

      <ChartWrapper title="Merton JD — 3 trajectoires (S₀=100)" accent={ACCENT} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" domain={[0, 1]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Temps (années)', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            {paths.map((p, i) => (
              <Line key={i} data={p} type="monotone" dataKey="S" stroke={COLORS[i]} strokeWidth={1.5} dot={false} name={`Traj. ${i + 1}`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ChartWrapper title={`Processus de Poisson N(t) — λ=${lambda} sauts/an (trajectoires en escalier)`} accent={T.a5} height={200}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={poissonData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" domain={[0, 1]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis allowDecimals={false} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Line type="stepAfter" dataKey="N" stroke={T.a5} strokeWidth={2.5} dot={false} name="N(t)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <Accordion title="Exercice — Probabilité de saut (Poisson)" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}>Le pétrole subit <K>{"\\lambda=4"}</K> sauts/an. Quelle est la probabilité d'avoir <K>{"\\geq 2"}</K> sauts en 6 mois ?</p>
        <FormulaBox accent={ACCENT}><K>{"P(N \\geq 2) = 59.4\\%"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Processus de Poisson" ruleDetail="λt = intensité × durée" accent={ACCENT}><K>{"t = 0.5\\text{ an} \\Rightarrow \\lambda t = 4 \\times 0.5 = 2"}</K></DemoStep>
          <DemoStep num={2} rule="Processus de Poisson" ruleDetail="P(N=k) = e^{−λt}(λt)^k/k!" accent={ACCENT}><K>{"P(N \\geq 2) = 1 - P(N=0) - P(N=1) = 1 - e^{-2} - 2e^{-2} = 1 - 3 \\times 0.1353 = 59.4\\%"}</K></DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}


// ─── Tab: MRJD — Combinaison ─────────────────────────────────────────────────

export function MRJDTab() {
  const [lambda, setLambda] = useState(6)
  const [muJ, setMuJ] = useState(0.0)
  const [sigJ, setSigJ] = useState(0.25)
  const [sigma, setSigma] = useState(0.35)
  const [kappa, setKappa] = useState(4)
  const [theta, setTheta] = useState(80)
  const [key, setKey] = useState(0)

  function poissonRand(lam) {
    if (lam <= 0) return 0
    const L = Math.exp(-lam)
    let k = 0, p = 1
    do { k++; p *= Math.random() } while (p > L && k < 50)
    return k - 1
  }

  const n = 252, dt = 1 / n
  const COLORS = [ACCENT, T.a4, T.a5]

  const paths = useMemo(() => {
    const result = []
    for (let p = 0; p < 3; p++) {
      let S = theta
      const pts = [{ t: 0, S: +S.toFixed(2) }]
      for (let i = 1; i <= n; i++) {
        const Z = gaussRand()
        const nJumps = poissonRand(lambda * dt)
        let jumpMult = 0
        for (let j = 0; j < nJumps; j++) jumpMult += Math.expm1(muJ + sigJ * gaussRand())
        S += kappa * (theta - S) * dt + sigma * S * Math.sqrt(dt) * Z + S * jumpMult
        S = Math.max(S, 0.01)
        if (i % 3 === 0) pts.push({ t: +(i * dt).toFixed(3), S: +S.toFixed(2) })
      }
      result.push(pts)
    }
    return result
  }, [lambda, muJ, sigJ, sigma, kappa, theta, key])

  const halfLife = Math.log(2) / kappa
  const volTotal = Math.sqrt(sigma * sigma + lambda * (muJ * muJ + sigJ * sigJ))
  const pAtLeastOnePerMonth = 1 - Math.exp(-lambda / 12)

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Synthèse des deux briques :</strong> le MRJD combine le processus OU
        (onglet <em>Mean-Reversion</em>) et le processus de Poisson (onglet <em>Processus à Saut</em>).
        C'est le <strong>modèle standard de l'industrie énergie</strong> — explicitement au programme DPH3V.
        Il capture à la fois l'ancrage fondamental vers θ et les chocs ponctuels discontinus (spikes).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <FormulaBox accent={T.a3} label="Brique 1 — OU (mean-reversion)">
          <K display>{"dX = \\kappa(\\theta - X)\\,dt + \\sigma\\,dW"}</K>
        </FormulaBox>
        <FormulaBox accent={T.a5} label="Brique 2 — Poisson (sauts)">
          <K display>{"dN \\sim \\text{Poisson}(\\lambda\\,dt)"}</K>
          <K display>{"Y \\sim \\mathcal{N}(\\mu_J,\\,\\sigma_J^2)"}</K>
        </FormulaBox>
      </div>

      <FormulaBox accent={ACCENT} label="MRJD — Mean-Reverting Jump Diffusion (DPH3V)">
        <K display>{"dX = \\underbrace{\\kappa(\\theta - X)\\,dt}_{\\text{mean-reversion}} + \\underbrace{\\sigma X\\,dW}_{\\text{diffusion}} + \\underbrace{X(e^Y - 1)\\,dN}_{\\text{saut}}"}</K>
        <K display>{"Y \\sim \\mathcal{N}(\\mu_J,\\, \\sigma_J^2)"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['κ(θ-X)dt', 'Force de rappel vers θ — le prix revient vers le fondamental'],
        ['σX dW', 'Diffusion continue proportionnelle au prix'],
        ['X(e^Y − 1) dN', 'Saut multiplicatif : Y = log-rendement du saut, e^Y−1 = rendement brut'],
        ['λ', "Fréquence des sauts (4–12/an typique pour l'énergie)"],
        ['σ_tot ≈', '√(σ² + λ(µ_J² + σ_J²)) — variance diffusion + variance sauts'],
      ]} />

      <Grid cols={3} gap="10px">
        <Slider label="κ (mean-rev.)" value={kappa} min={0.5} max={10} step={0.5} onChange={setKappa} accent={T.a3} format={v => v.toFixed(1)} />
        <Slider label="θ (niveau moyen)" value={theta} min={30} max={150} step={5} onChange={setTheta} accent={T.a4} format={v => `${v}$/bbl`} />
        <Slider label="σ (diffusion)" value={sigma} min={0.05} max={0.6} step={0.01} onChange={setSigma} accent={T.a7} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="λ (sauts/an)" value={lambda} min={1} max={20} step={0.5} onChange={setLambda} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="µ_J (moyenne saut)" value={muJ} min={-0.4} max={0.4} step={0.02} onChange={setMuJ} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ_J (taille saut)" value={sigJ} min={0.05} max={0.6} step={0.01} onChange={setSigJ} accent={T.a6} format={v => `${(v * 100).toFixed(0)}%`} />
      </Grid>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="Demi-vie OU" value={`${(halfLife * 365).toFixed(0)}j`} accent={T.a3} />
        <InfoChip label="E[X(∞)]" value={`${theta}$/bbl`} accent={T.a4} />
        <InfoChip label="λ sauts/an" value={lambda.toFixed(1)} accent={ACCENT} />
        <InfoChip label="E[τ] entre sauts" value={`${(365 / lambda).toFixed(0)}j`} accent={T.a5} />
        <InfoChip label="P(≥1 saut/mois)" value={`${(pAtLeastOnePerMonth * 100).toFixed(0)}%`} accent={T.a6} />
        <InfoChip label="σ totale ≈" value={`${(volTotal * 100).toFixed(0)}%`} accent={T.a7} />
      </div>

      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelles trajectoires</button>

      <ChartWrapper title={`MRJD — 3 trajectoires (θ=${theta}$/bbl)`} accent={ACCENT} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" domain={[0, 1]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Temps (années)', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <ReferenceLine y={theta} stroke={T.a4} strokeDasharray="6 3" label={{ value: `θ=${theta}`, fill: T.a4, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            {paths.map((p, i) => (
              <Line key={i} data={p} type="monotone" dataKey="S" stroke={COLORS[i]} strokeWidth={1.5} dot={false} name={`Traj. ${i + 1}`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ExampleBlock title="Spike de gaz naturel — Rupture d'approvisionnement" accent={ACCENT}>
        <p>Gaz naturel : <K>{"\\theta=3"}</K>$/MMBtu, <K>{"\\kappa=4"}</K>, <K>{"\\sigma=35\\%"}</K>, <K>{"\\lambda=6"}</K> sauts/an, <K>{"\\mu_J=0\\%"}</K>, <K>{"\\sigma_J=25\\%"}</K></p>
        <FormulaBox accent={ACCENT}><K>{"\\sigma_{\\text{totale}} \\approx 71\\%\\text{ (vs 35% sans sauts)}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Processus de Poisson" ruleDetail="P(N≥1) = 1−e^{−λt}" accent={ACCENT}><K>{"P(\\geq 1\\text{ saut/trimestre}) = 1 - e^{-6 \\times 0.25} = 1 - e^{-1.5} = 77.7\\%"}</K></DemoStep>
          <DemoStep num={2} rule="MRJD" ruleDetail="saut multiplicatif e^Y−1" accent={ACCENT}>Saut haussier typique (<K>{"+1\\sigma_J"}</K>) : <K>{"e^{0.25} - 1 = +28\\%"}</K> sur le prix courant</DemoStep>
          <DemoStep num={3} rule="Demi-vie" ruleDetail="t₁/₂ = ln(2)/κ" accent={ACCENT}><K>{"t_{1/2} = \\ln(2)/4 = 63\\text{ jours}"}</K> → retour vers <K>{"\\theta"}</K> après ~2 mois</DemoStep>
          <DemoStep num={4} rule="MRJD" ruleDetail="σ_total = √(σ²+λ(µ²_J+σ²_J))" accent={ACCENT}><K>{"\\sigma_{\\text{tot}} = \\sqrt{0.1225 + 6 \\times 0.0625} = \\sqrt{0.4975} \\approx 71\\%"}</K> (vs 35% sans sauts !)</DemoStep>
        </Demonstration>
      </ExampleBlock>

      <Accordion title="Exercice — Vol totale MRJD" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}><K>{"\\sigma=20\\%"}</K>, <K>{"\\lambda=8"}</K>, <K>{"\\mu_J=0"}</K>, <K>{"\\sigma_J=15\\%"}</K>. Calculez la volatilité totale effective.</p>
        <FormulaBox accent={ACCENT}><K>{"\\sigma_{\\text{totale}} \\approx 46.9\\%\\text{ (vs 20% sans sauts)}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="MRJD" ruleDetail="σ² diffusion" accent={ACCENT}>Variance diffusion : <K>{"\\sigma^2 = 0.04"}</K></DemoStep>
          <DemoStep num={2} rule="MRJD" ruleDetail="λ(µ²_J + σ²_J)" accent={ACCENT}>Variance sauts : <K>{"\\lambda(\\mu_J^2 + \\sigma_J^2) = 8 \\times 0.0225 = 0.18"}</K></DemoStep>
          <DemoStep num={3} rule="MRJD" ruleDetail="σ_total = √(σ²+var_sauts)" accent={ACCENT}>Variance totale = <K>{"0.04 + 0.18 = 0.22"}</K> → <K>{"\\sigma_{\\text{tot}} = \\sqrt{0.22} = 46.9\\%"}</K> — les sauts ×2.3 la vol !</DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}
