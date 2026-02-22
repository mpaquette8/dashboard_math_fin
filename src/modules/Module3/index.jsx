import React, { useState, useMemo, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { T } from '../../design/tokens'
import {
  ModuleHeader, TabBar, FormulaBox, IntuitionBlock, ExampleBlock,
  Slider, Accordion, Step, SymbolLegend, SectionTitle, InfoChip, Grid, ChartWrapper,
  Demonstration, DemoStep, K,
} from '../../design/components'

const ACCENT = T.a3

function gaussRand() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ─── Tab: Marche Aléatoire ────────────────────────────────────────────────────
export function RandomWalkTab() {
  const [steps, setSteps] = useState(100)
  const [nPaths, setNPaths] = useState(3)
  const [key, setKey] = useState(0)

  const paths = useMemo(() => {
    const result = []
    for (let p = 0; p < nPaths; p++) {
      let W = 0
      const pts = [{ t: 0, W: 0 }]
      for (let i = 1; i <= steps; i++) {
        W += gaussRand() * Math.sqrt(1 / steps)
        pts.push({ t: +(i / steps).toFixed(3), W: +W.toFixed(4) })
      }
      result.push(pts)
    }
    return result
  }, [steps, nPaths, key])

  const COLORS = [ACCENT, T.a4, T.a5, T.a6, T.a2]

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Pourquoi les processus stochastiques ?</strong> Les prix financiers ne sont pas déterministes.
        On ne peut pas prévoir avec certitude le cours du pétrole demain, ni le prix du gaz le mois prochain.
        Ce module construit les <strong>fondations mathématiques</strong> pour modéliser l'incertitude dans le temps :
        comment représenter rigoureusement un prix qui évolue de façon aléatoire, comment calculer des espérances
        et des variances de ces trajectoires, et surtout comment faire du calcul différentiel avec ces objets erratiques.
        Toute la finance des dérivés — Black-Scholes, Black-76, les modèles d'énergie — repose entièrement sur ces fondations.
      </div>

      <IntuitionBlock emoji="🎲" title="La marche aléatoire : un ivrogne dans la rue" accent={ACCENT}>
        Imaginez un ivrogne qui à chaque seconde fait un pas au hasard : +1 ou -1.
        Sa position après n pas = somme de n variables aléatoires.
        Par le Théorème Central Limite, cette somme converge vers une distribution normale.
        En finance : le prix d'un actif = cumul de petits chocs aléatoires quotidiens.
        Le <strong>mouvement brownien</strong> <K>{"W(t)"}</K> est la limite continue de cette marche aléatoire.
      </IntuitionBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Les 4 axiomes du Brownien standard — à connaître par cœur :</strong>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}><strong>1. <K>{"W(0) = 0"}</K></strong> — Le processus démarre à zéro. C'est une convention de normalisation : on part d'un état connu à <K>{"t=0"}</K>.</div>
          <div style={{ marginBottom: 6 }}><strong>2. Accroissements indépendants</strong> — <K>{"W(t) - W(s)"}</K> est indépendant de <K>{"W(s) - W(u)"}</K> pour <K>{"u < s < t"}</K>. Ce qui se passe dans le futur ne dépend pas du passé : c'est la propriété markovienne. Le marché ne "se souvient" pas de son chemin.</div>
          <div style={{ marginBottom: 6 }}><strong>3. Accroissements stationnaires gaussiens</strong> — <K>{"W(t) - W(s) \\sim \\mathcal{N}(0,\\, t-s)"}</K>. La loi de l'incrément ne dépend que de la durée <K>{"t-s"}</K>, pas du moment absolu. Et sa variance est exactement <K>{"t-s"}</K> : plus l'horizon est long, plus l'incertitude grandit.</div>
          <div><strong>4. Trajectoires continues</strong> — Pas de saut. Mais (paradoxe !) nulle part dérivable : la trajectoire est infiniment irrégulière, elle zigzague à toutes les échelles de temps.</div>
        </div>
      </div>

      <FormulaBox accent={ACCENT} label="Propriétés du Mouvement Brownien W(t)">
        <K display>{"1.\\; W(0) = 0"}</K>
        <K display>{"2.\\; \\text{Accroissements indépendants : } W(t) - W(s) \\perp W(s) - W(u) \\text{ pour } u < s < t"}</K>
        <K display>{"3.\\; \\text{Accroissements stationnaires : } W(t) - W(s) \\sim \\mathcal{N}(0,\\, t-s)"}</K>
        <K display>{"4.\\; \\text{Trajectoires continues (mais nulle part dérivables !)}"}</K>
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Propriété clé">
        <K display>{"dW(t) \\sim \\mathcal{N}(0,\\, dt) \\quad\\text{i.e.}\\quad E[dW] = 0,\\; E[dW^2] = dt"}</K>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Construction rigoureuse : convergence vers le brownien</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Comment passe-t-on d'une marche discrète (±1 à chaque pas) à un processus continu ? On subdivise [0,1] en n intervalles de taille <K>{"\\Delta t = 1/n"}</K>.
        À chaque pas, on ajoute un incrément <K>{"\\xi_i = \\pm\\sqrt{\\Delta t}"}</K> (pour que la variance soit <K>{"\\Delta t"}</K>).
        Après k pas : <K>{"W_k = \\xi_1 + \\cdots + \\xi_k"}</K>, somme de k variables iid de variance <K>{"\\Delta t"}</K>.
      </div>
      <Step num={1} accent={ACCENT}><K>{"E[W_k] = 0"}</K> (symétrie), <K>{"\\mathrm{Var}[W_k] = k \\times \\Delta t = k/n"}</K></Step>
      <Step num={2} accent={ACCENT}>Quand <K>{"n \\to \\infty"}</K> : <K>{"\\mathrm{Var}[W(t)] \\to t"}</K> car <K>{"k/n \\to t"}</K> (les k pas couvrent le temps t)</Step>
      <Step num={3} accent={ACCENT}>Théorème Central Limite : la somme de n variables iid (<K>{"\\mathrm{Var}=\\Delta t"}</K>) <K>{"\\to \\mathcal{N}(0, t)"}</K> quand <K>{"n \\to \\infty"}</K></Step>
      <Step num={4} accent={ACCENT}>Résultat : <K>{"W(t) \\sim \\mathcal{N}(0, t)"}</K> — le brownien est la limite du discret quand <K>{"\\Delta t \\to 0"}</K></Step>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Ce résultat justifie pourquoi on simule toujours le brownien avec <K>{"\\sqrt{\\Delta t} \\times Z"}</K> où <K>{"Z \\sim \\mathcal{N}(0,1)"}</K> :
        c'est exactement la limite du schéma discret, valide pour tout <K>{"\\Delta t"}</K> petit.
      </div>

      <SectionTitle accent={ACCENT}>Variation quadratique : la signature de l'irrégularité</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Pour une fonction dérivable ordinaire <K>{"f(t)"}</K>, la variation quadratique est nulle :
        <K>{"\\sum [f(t_{i+1}) - f(t_i)]^2 \\to 0"}</K> quand <K>{"\\Delta t \\to 0"}</K> (les carrés de petits incréments s'écrasent).
        Pour le brownien, c'est fondamentalement différent :
      </div>
      <FormulaBox accent={ACCENT} label="Variation quadratique du brownien [W,W]_t = t">
        <K display>{"\\sum_i \\big[W(t_{i+1}) - W(t_i)\\big]^2 \\;\\xrightarrow{\\;P\\;}\\; t \\quad (\\text{quand } \\max \\Delta t_i \\to 0)"}</K>
        <K display>{"\\text{En notation différentielle : } dW^2 = dt \\;\\text{ (et non 0 comme en calcul classique)}"}</K>
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Intuition :</strong> Le brownien est tellement irrégulier que ses petits incréments, même au carré, s'accumulent.
        Dans le calcul classique : <K>{"(dx)^2 \\sim (dt)^2 \\to 0"}</K>. Dans le calcul stochastique : <K>{"(dW)^2 \\sim dt \\to \\text{fini}"}</K>.
        C'est précisément cette propriété qui fait apparaître le terme supplémentaire <K>{"\\sigma^2/2"}</K> dans le lemme d'Itô (onglet suivant).
        Sans <K>{"[W,W]_t = t"}</K>, Black-Scholes n'existerait pas.
      </div>

      <Grid cols={2} gap="10px">
        <Slider label="Nombre de pas" value={steps} min={20} max={500} step={10} onChange={setSteps} accent={ACCENT} format={v => v.toFixed(0)} />
        <Slider label="Nombre de trajectoires" value={nPaths} min={1} max={5} step={1} onChange={setNPaths} accent={T.a5} format={v => v.toFixed(0)} />
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Rejouer</button>

      <ChartWrapper title="Trajectoires du mouvement brownien W(t)" accent={ACCENT} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" domain={[0, 1]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Temps t', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <ReferenceLine y={0} stroke={T.border} strokeWidth={1.5} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            {paths.map((p, i) => (
              <Line key={i} data={p} type="monotone" dataKey="W" stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} dot={false} name={`W${i + 1}(t)`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <div style={{ color: T.muted, fontSize: 13, marginTop: 8, lineHeight: 1.7 }}>
        Observations : les trajectoires sont continues mais très irrégulières — elles zigzaguent à toutes les échelles.
        <K>{"E[W(t)] = 0"}</K> et <K>{"\\mathrm{Var}[W(t)] = t"}</K> → la dispersion croît comme <K>{"\\sqrt{t}"}</K>.
      </div>

      <Accordion title="Exercice — Propriétés du brownien" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}>Soit W(t) un brownien standard. Calculez E[W(3)], Var[W(3)-W(1)], et P(W(1) {'>'} 1).</p>
        <FormulaBox accent={ACCENT}><K>{"E[W(t)] = 0,\\; \\mathrm{Var}[W(t)] = t,\\; \\mathrm{Cov}[W(s),W(t)] = \\min(s,t)"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Propriétés du brownien" ruleDetail="E[W(t)] = 0, Var[W(t)] = t" accent={ACCENT}><K>{"E[W(3)] = 0"}</K> (propriété fondamentale : espérance nulle à tout instant)</DemoStep>
          <DemoStep num={2} rule="Propriétés du brownien" ruleDetail="W(t)-W(s) ~ N(0, t-s)" accent={ACCENT}><K>{"W(3) - W(1) \\sim N(0,\\, 3-1) = N(0,2)"}</K> → <K>{"\\mathrm{Var}[W(3)-W(1)] = 2"}</K></DemoStep>
          <DemoStep num={3} rule="Propriétés du brownien" ruleDetail="W(1) ~ N(0,1)" accent={ACCENT}><K>{"W(1) \\sim N(0,1)"}</K> → <K>{"P(W(1)>1) = 1 - \\Phi(1) \\approx 15.87\\%"}</K></DemoStep>
          <DemoStep num={4} rule="Propriétés du brownien" ruleDetail="Cov[W(s),W(t)] = min(s,t)" accent={ACCENT}>Bonus : <K>{"\\mathrm{Cov}[W(2), W(5)] = \\min(2,5) = 2"}</K></DemoStep>
        </Demonstration>
      </Accordion>

      <Accordion title="Exercice — Simulation discrète du brownien" accent={ACCENT} badge="Entraînement">
        <p style={{ color: T.text }}>Simulez à la main 4 pas de brownien sur [0,1] (Δt = 0.25). Utilisez les réalisations Z = +0.8, -1.2, +0.3, -0.5.</p>
        <FormulaBox accent={ACCENT}><K>{"W(1.00) = -0.30"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Propriétés du brownien" ruleDetail="ΔW = √Δt × Z" accent={ACCENT}>Incrément par pas : <K>{"\\sqrt{\\Delta t} \\times Z = \\sqrt{0.25} \\times Z = 0.5 \\times Z"}</K></DemoStep>
          <DemoStep num={2} rule="Propriétés du brownien" ruleDetail="W(tᵢ) = W(tᵢ₋₁) + ΔW" accent={ACCENT}><K>{"W(0.25) = 0 + 0.5 \\times 0.8 = 0.40"}</K></DemoStep>
          <DemoStep num={3} rule="Propriétés du brownien" ruleDetail="W(tᵢ) = W(tᵢ₋₁) + ΔW" accent={ACCENT}><K>{"W(0.50) = 0.40 + 0.5 \\times (-1.2) = -0.20"}</K></DemoStep>
          <DemoStep num={4} rule="Propriétés du brownien" ruleDetail="W(tᵢ) = W(tᵢ₋₁) + ΔW" accent={ACCENT}><K>{"W(0.75) = -0.20 + 0.5 \\times 0.3 = -0.05"}</K></DemoStep>
          <DemoStep num={5} rule="Propriétés du brownien" ruleDetail="W(tᵢ) = W(tᵢ₋₁) + ΔW" accent={ACCENT}><K>{"W(1.00) = -0.05 + 0.5 \\times (-0.5) = -0.30"}</K>. Vérification : E[W(1)] théoriquement 0, Var[W(1)] théoriquement 1. Sur cet échantillon unique, W(1) = −0.30 (variabilité normale pour 4 pas).</DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ─── Tab: GBM ─────────────────────────────────────────────────────────────────
export function GBMTab() {
  const [mu, setMu] = useState(0.1)
  const [sigma, setSigma] = useState(0.25)
  const [T2, setT2] = useState(1)
  const [nPaths, setNPaths] = useState(5)
  const [S0, setS0] = useState(100)
  const [key, setKey] = useState(0)

  const paths = useMemo(() => {
    const n = 252
    const dt = T2 / n
    const result = []
    for (let p = 0; p < nPaths; p++) {
      let S = S0
      const pts = [{ t: 0, S: S0 }]
      for (let i = 1; i <= n; i++) {
        S *= Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * gaussRand())
        if (i % 3 === 0) pts.push({ t: +(i * dt).toFixed(3), S: +S.toFixed(2) })
      }
      result.push(pts)
    }
    return result
  }, [mu, sigma, T2, nPaths, S0, key])

  const COLORS = [ACCENT, T.a4, T.a5, T.a6, T.a2, T.a7, T.a8]
  const E_ST = S0 * Math.exp(mu * T2)
  const Vol_ST = S0 * Math.exp(mu * T2) * Math.sqrt(Math.exp(sigma * sigma * T2) - 1)

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>La logique du GBM :</strong> Plutôt que de modéliser directement le prix S (qui peut être très grand ou très petit),
        on modélise les <strong>rendements</strong> log <K>{"dS/S"}</K>. L'idée fondamentale est que chaque petit rendement relatif
        <K>{"dR = dS/S"}</K> est gaussien : <K>{"dR = \\mu\\,dt + \\sigma\\,dW"}</K>. Si on cumule ces petits rendements sur <K>{"[0,T]"}</K>, le prix final est :
        <K>{"S(T) = S_0 \\times \\exp\\!\\big(\\int_0^T dR\\big)"}</K> = <K>{"S_0 \\times \\exp(\\text{log-normal})"}</K>. C'est pourquoi les <em>prix</em> GBM suivent une loi log-normale
        (toujours positifs, asymétriques à droite) — une propriété essentielle pour les actifs financiers.
      </div>

      <IntuitionBlock emoji="📈" title="GBM : le modèle standard des prix financiers" accent={ACCENT}>
        Le Geometric Brownian Motion (GBM) est la brique de base de Black-Scholes.
        L'idée : le <strong>rendement</strong> instantané suit une loi normale avec une composante drift (<K>{"\\mu"}</K>)
        et une composante aléatoire (<K>{"\\sigma \\times \\text{bruit}"}</K>). Cela implique que les <em>prix</em> suivent une
        distribution log-normale : ils ne peuvent jamais être négatifs.
        En énergie : le pétrole, le gaz, les forward d'électricité sont souvent modélisés par GBM en première approximation.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Équation différentielle stochastique (EDS)">
        <K display>{"dS = \\mu\\, S\\, dt + \\sigma\\, S\\, dW"}</K>
      </FormulaBox>

      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        <strong style={{ color: ACCENT }}>Décomposition terme à terme de <K>{"dS = \\mu S\\,dt + \\sigma S\\,dW"}</K> :</strong>
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: ACCENT }}><K>{"\\mu S\\,dt"}</K> — composante déterministe (drift) :</strong> Le prix "tend" à croître à taux <K>{"\\mu"}</K> par an.
          Si <K>{"\\sigma=0"}</K>, on aurait <K>{"dS = \\mu S\\,dt"}</K>, c'est-à-dire <K>{"S(t) = S_0 \\times e^{\\mu t}"}</K> — une croissance exponentielle pure.
          <K>{"\\mu"}</K> représente le rendement espéré annuel : pour les actions <K>{"\\mu \\approx 8\\text{-}12\\%"}</K>, pour les commodités <K>{"\\mu"}</K> dépend du modèle de pricing.
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: ACCENT }}><K>{"\\sigma S\\,dW"}</K> — composante aléatoire (diffusion) :</strong> L'amplitude du choc est <em>proportionnelle au prix</em>.
          Si S double, la volatilité absolue double aussi. C'est ce qui garantit que la <em>volatilité relative</em> (<K>{"\\sigma = \\sigma S / S"}</K>) reste constante.
          Un prix de 100€ avec <K>{"\\sigma=30\\%"}</K> fluctue de <K>{"\\pm 30"}</K>€/an, un prix de 200€ fluctue de <K>{"\\pm 60"}</K>€/an — même 30% relatif.
        </div>
        <div>
          <strong style={{ color: ACCENT }}>Conséquence :</strong> <K>{"dS/S = \\mu\\,dt + \\sigma\\,dW"}</K> → les rendements relatifs sont normaux, les prix sont log-normaux.
          C'est cohérent avec l'observation empirique : on ne modélise pas les prix en absolu, on modélise les rendements.
        </div>
      </div>

      <FormulaBox accent={ACCENT} label="Solution exacte (par lemme d'Itô)">
        <K display>{"S(t) = S_0 \\times \\exp\\!\\Big[\\Big(\\mu - \\frac{\\sigma^2}{2}\\Big)t + \\sigma\\, W(t)\\Big]"}</K>
      </FormulaBox>

      <IntuitionBlock emoji="📊" title="Loi log-normale de S_T : quantiles et probabilités" accent={ACCENT}>
        <K>{"S_T"}</K> suit une loi log-normale : <K>{"\\ln(S_T/S_0) \\sim \\mathcal{N}\\!\\big((\\mu - \\sigma^2/2)T,\\; \\sigma^2 T\\big)"}</K>.
        La médiane de <K>{"S_T"}</K> est <K>{"S_0 \\times \\exp\\!\\big((\\mu - \\sigma^2/2)T\\big)"}</K> — inférieure à l'espérance <K>{"S_0 \\times e^{\\mu T}"}</K>.
        <K>{"P(S_T > K) = N(d_2)"}</K> sous la mesure risque-neutre (avec <K>{"\\mu"}</K> remplacé par <K>{"r"}</K>) — c'est le <K>{"d_2"}</K> de Black-Scholes !
        Les queues sont asymétriques : les grandes hausses (right tail) sont plus probables que dans une loi normale.
      </IntuitionBlock>

      <SymbolLegend accent={ACCENT} symbols={[
        ['dS', 'Variation infinitésimale du prix'],
        ['µ', 'Drift : rendement espéré annuel (ex: 10%)'],
        ['σ', 'Volatilité : amplitude des fluctuations annuelles'],
        ['dW', 'Incrément brownien ~ N(0,dt)'],
        ['σ²/2', "Correction d'Itô (Jensen's inequality)"],
      ]} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="E[S(T)]" value={`${E_ST.toFixed(1)}`} unit={S0 === 100 ? '€' : ''} accent={ACCENT} />
        <InfoChip label="σ(S_T)" value={`${Vol_ST.toFixed(1)}`} accent={T.a5} />
        <InfoChip label="µ - σ²/2" value={(mu - 0.5 * sigma * sigma).toFixed(4)} accent={T.a4} />
      </div>

      <Grid cols={3} gap="10px">
        <Slider label="µ (drift)" value={mu} min={-0.3} max={0.5} step={0.01} onChange={setMu} accent={ACCENT} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ (volatilité)" value={sigma} min={0.05} max={0.8} step={0.01} onChange={setSigma} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="T (horizon)" value={T2} min={0.1} max={3} step={0.1} onChange={setT2} accent={T.a4} format={v => `${v.toFixed(1)}a`} />
        <Slider label="S₀" value={S0} min={50} max={200} step={5} onChange={setS0} accent={T.muted} format={v => `${v}€`} />
        <Slider label="Nb trajectoires" value={nPaths} min={1} max={7} step={1} onChange={setNPaths} accent={T.muted} format={v => v.toFixed(0)} />
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelles trajectoires</button>

      <SectionTitle accent={ACCENT}>Limites du GBM en marchés de l'énergie</SectionTitle>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 16px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Le GBM est une approximation — ses limites motivent les modèles avancés :</strong>
        <div style={{ marginTop: 10 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Pas de mean-reversion :</strong> Dans le GBM, si le prix monte à 150$/bbl, il peut continuer à monter indéfiniment.
            Or les prix pétroliers <em>reviennent</em> vers un coût marginal de production à long terme (~60-80$/bbl).
            → Ceci motive le modèle <strong>Ornstein-Uhlenbeck</strong> (onglet Mean-Reversion).
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Pas de sauts :</strong> Le GBM génère des trajectoires continues. Mais le gaz naturel peut tripler en une nuit
            lors d'une vague de froid extrême, et le pétrole peut chuter de 30% sur une décision OPEP.
            → Ceci motive le modèle <strong>MRJD</strong> (Mean-Reverting Jump Diffusion, onglet Processus à Saut).
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Volatilité constante :</strong> Dans le GBM, σ est fixe. En réalité, la volatilité implicite varie avec le strike
            (smile de volatilité) et le temps (structure par terme). Le prix du call dépend de quel σ on utilise.
            → Ceci motive les modèles à volatilité stochastique comme <strong>Heston</strong>.
          </div>
          <div>
            <strong>Loi log-normale pure :</strong> Les queues de distribution empiriques sont plus épaisses ("fat tails") que
            la log-normale. Les événements extrêmes arrivent plus souvent qu'ils ne devraient.
          </div>
        </div>
      </div>

      <Accordion title="Exercice — Simulation GBM à la main (1 an, 4 trimestres)" accent={ACCENT} badge="Entraînement">
        <p style={{ color: T.text }}>S₀ = 100€, µ = 10%, σ = 20%, T = 1 an, N = 4 pas (Δt = 0.25). Réalisations Z = +0.6, -0.4, +1.1, -0.2.</p>
        <FormulaBox accent={ACCENT}><K>{"S(1) = 127.51\\text{€},\\; \\ln(127.51/100) = +24.6\\%"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Solution exacte du GBM" ruleDetail="S(tᵢ) = S(tᵢ₋₁)·exp[(µ−σ²/2)Δt + σ√Δt·Z]" accent={ACCENT}>Formule : <K>{"S(t_i) = S(t_{i-1}) \\times \\exp\\!\\big[(\\mu - \\tfrac{\\sigma^2}{2})\\Delta t + \\sigma\\sqrt{\\Delta t}\\,Z\\big]"}</K></DemoStep>
          <DemoStep num={2} rule="Solution exacte du GBM" ruleDetail="drift ajusté (µ−σ²/2)Δt" accent={ACCENT}>Drift ajusté : <K>{"(\\mu - \\sigma^2/2)\\Delta t = (0.10 - 0.02)\\times 0.25 = 0.02"}</K></DemoStep>
          <DemoStep num={3} rule="Euler-Maruyama" ruleDetail="σ√Δt" accent={ACCENT}><K>{"\\sigma\\sqrt{\\Delta t} = 0.20 \\times 0.5 = 0.10"}</K></DemoStep>
          <DemoStep num={4} rule="Solution exacte du GBM" ruleDetail="S(0.25)" accent={ACCENT}><K>{"S(0.25) = 100 \\times e^{0.08} = 108.33\\text{€}"}</K></DemoStep>
          <DemoStep num={5} rule="Solution exacte du GBM" ruleDetail="S(0.50)" accent={ACCENT}><K>{"S(0.50) = 108.33 \\times e^{0.016} = 109.98\\text{€}"}</K></DemoStep>
          <DemoStep num={6} rule="Solution exacte du GBM" ruleDetail="S(0.75)" accent={ACCENT}><K>{"S(0.75) = 109.98 \\times e^{0.13} = 125.24\\text{€}"}</K></DemoStep>
          <DemoStep num={7} rule="Solution exacte du GBM" ruleDetail="S(1.00)" accent={ACCENT}><K>{"S(1.00) = 125.24 \\times e^{0.018} = 127.51\\text{€}"}</K>. <K>{"E[S_1] = 100 \\times e^{0.10} = 110.5\\text{€}"}</K> (1 trajectoire ≠ espérance).</DemoStep>
        </Demonstration>
      </Accordion>

      <ChartWrapper title={`GBM : S₀=${S0}€, µ=${(mu * 100).toFixed(0)}%, σ=${(sigma * 100).toFixed(0)}%, T=${T2.toFixed(1)}a`} accent={ACCENT} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" domain={[0, T2]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Temps (années)', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <ReferenceLine y={S0} stroke={T.border} strokeDasharray="3 3" />
            <ReferenceLine y={E_ST} stroke={ACCENT} strokeDasharray="6 3" label={{ value: `E[S_T]=${E_ST.toFixed(0)}`, fill: ACCENT, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            {paths.map((p, i) => (
              <Line key={i} data={p} type="monotone" dataKey="S" stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} dot={false} name={`S${i + 1}(t)`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  )
}

// ─── Tab: Mean-Reversion ──────────────────────────────────────────────────────
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

// ─── Tab: Lemme d'Itô ─────────────────────────────────────────────────────────
export function ItoTab() {
  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Pourquoi le lemme d'Itô est-il fondamental ?</strong> En physique et ingénierie classique, si on connaît
        l'équation d'évolution de x, on peut déduire celle de f(x) par la règle de la chaîne ordinaire.
        En finance, on a le même besoin : on connaît l'EDS de S (GBM), et on veut l'EDS de ln(S), ou de C(S,t) (le prix d'un call).
        Le calcul stochastique d'Itô est <strong>l'outil mathématique fondamental</strong> pour faire cela rigoureusement.
        Sans lui, on ne peut pas dériver la formule de Black-Scholes, ni résoudre la quasi-totalité des EDSs utiles en finance.
        Le lemme d'Itô, c'est la règle de la chaîne du calcul stochastique — avec une correction qui change tout.
      </div>

      <IntuitionBlock emoji="🔬" title="Le lemme d'Itô : la règle de la chaîne stochastique" accent={ACCENT}>
        En calcul ordinaire : si <K>{"y = f(x)"}</K> et x change, alors <K>{"dy = f'(x)\\,dx"}</K>.
        En calcul stochastique, une correction apparaît à cause de la non-dérivabilité du brownien.
        <K>{"dW^2 = dt"}</K> (et non 0 comme dans le calcul classique). Le lemme d'Itô corrige cette subtilité
        avec un terme supplémentaire en <K>{"\\sigma^2"}</K> — c'est la <strong>correction d'Itô</strong>.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Calcul classique vs Calcul d'Itô : tableau comparatif</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Règle de la chaîne', classic: <K>{"df = f'(x)\\,dx"}</K>, ito: <K>{"df = f'(X)\\,dX + \\tfrac{1}{2}f''(X)(dX)^2"}</K>, c: ACCENT },
          { label: 'dx²', classic: <><K>{"(dx)^2 \\approx 0"}</K> (ordre <K>{"dt^2"}</K>)</>, ito: <><K>{"(dW)^2 = dt"}</K> (ordre <K>{"dt"}</K> !)</>, c: T.a5 },
          { label: 'dx × dt', classic: '= 0', ito: <><K>{"dW \\times dt = 0"}</K></>, c: T.a4 },
          { label: 'Terme Itô', classic: 'Absent', ito: <><K>{"+ \\tfrac{1}{2}\\sigma^2 \\frac{\\partial^2 f}{\\partial X^2}\\,dt"}</K></>, c: ACCENT },
          { label: 'Exemple : f = X²', classic: <K>{"df = 2X\\,dX"}</K>, ito: <><K>{"df = 2X\\,dX + (dX)^2 = 2X\\,dX + \\sigma^2 dt"}</K></>, c: T.a5 },
          { label: 'Application BS', classic: 'Règle chaîne classique → fausse !', ito: 'Lemme d\'Itô → formule BS ✓', c: ACCENT },
        ].map((r, i) => (
          <div key={i} style={{ background: T.panel2, borderRadius: 7, padding: '10px 12px', border: `1px solid ${r.c}22`, fontSize: 12 }}>
            <div style={{ color: r.c, fontWeight: 700, marginBottom: 4 }}>{r.label}</div>
            <div style={{ color: T.muted, marginBottom: 2 }}>Classique : <span style={{ color: T.text }}>{r.classic}</span></div>
            <div style={{ color: T.muted }}>Itô : <span style={{ color: ACCENT, fontWeight: 600 }}>{r.ito}</span></div>
          </div>
        ))}
      </div>

      <FormulaBox accent={ACCENT} label="Lemme d'Itô — Forme générale">
        <K display>{"\\text{Si } dX = \\mu(X,t)\\,dt + \\sigma(X,t)\\,dW \\text{ et } f = f(X,t) \\text{, alors :}"}</K>
        <K display>{"df = \\Big[\\frac{\\partial f}{\\partial t} + \\mu\\,\\frac{\\partial f}{\\partial X} + \\frac{1}{2}\\sigma^2\\,\\frac{\\partial^2 f}{\\partial X^2}\\Big]dt + \\sigma\\,\\frac{\\partial f}{\\partial X}\\,dW"}</K>
      </FormulaBox>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie du Lemme d'Itô — chaque terme expliqué</div>
        <Step num={1} accent={ACCENT}><K>{"\\frac{\\partial f}{\\partial t} \\cdot dt"}</K> — dérive pure du temps : même si X ne bouge pas (<K>{"dW=0"}</K>), f change avec le temps. Exemple : le Theta d'une option — la valeur temps s'érode chaque instant même si S est immobile.</Step>
        <Step num={2} accent={ACCENT}><K>{"\\mu \\cdot \\frac{\\partial f}{\\partial X} \\cdot dt"}</K> — effet du drift déterministe : comment le drift de X se propage à f via la pente <K>{"\\partial f/\\partial X"}</K>. Si f est une option call et S tend à monter (<K>{"\\mu > 0"}</K>), f monte aussi, à vitesse <K>{"\\mu \\times \\Delta"}</K>.</Step>
        <Step num={3} accent={ACCENT}><K>{"\\tfrac{1}{2}\\sigma^2 \\cdot \\frac{\\partial^2 f}{\\partial X^2} \\cdot dt"}</K> — LE TERME CLÉ D'ITÔ — la correction de convexité. Si f est convexe (<K>{"f'' > 0"}</K>), le bruit crée un gain net positif (inégalité de Jensen). C'est exactement le terme Gamma dans la PDE de Black-Scholes. Sans ce terme, l'arbitrage serait possible.</Step>
        <Step num={4} accent={ACCENT}><K>{"\\sigma \\cdot \\frac{\\partial f}{\\partial X} \\cdot dW"}</K> — la partie aléatoire : le bruit de X (amplitude <K>{"\\sigma"}</K>) amplifié par la pente de f (le Delta). C'est la source de risque résiduelle — le seul terme stochastique.</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10 }}>
          Structure : <K>{"df = [\\text{dérive temporelle + dérive de X + correction de convexité}]\\,dt + [\\text{bruit amplifié par la pente}]\\,dW"}</K>
        </div>
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 16px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Point clé — Jensen dans le temps continu :</strong> La correction <K>{"\\tfrac{1}{2}\\sigma^2 f''"}</K> est la manifestation mathématique de l'inégalité de Jensen dans le temps continu. <K>{"E[f(X)] > f(E[X])"}</K> si f est convexe → le bruit génère un gain net quand on est convexe (long Gamma). C'est pourquoi un acheteur d'option est long Gamma : il profite de la convexité, mais en paie le prix via Theta.
      </div>

      <SectionTitle accent={ACCENT}>Application 1 : GBM → solution explicite</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 8 }}>
        On pose <K>{"f(S) = \\ln(S)"}</K>. On veut trouver <K>{"df"}</K> si <K>{"dS = \\mu S\\,dt + \\sigma S\\,dW"}</K>.
      </div>

      <Step num={1} accent={ACCENT}><K>{"\\partial f/\\partial S = 1/S,\\; \\partial^2 f/\\partial S^2 = -1/S^2,\\; \\partial f/\\partial t = 0"}</K></Step>
      <Step num={2} accent={ACCENT}><K>{"df = [0 + \\mu S \\times (1/S) + (1/2)\\sigma^2 S^2 \\times (-1/S^2)]\\,dt + \\sigma S \\times (1/S)\\,dW"}</K></Step>
      <Step num={3} accent={ACCENT}><K>{"df = [\\mu - \\sigma^2/2]\\,dt + \\sigma\\,dW"}</K></Step>
      <Step num={4} accent={ACCENT}>Intégration : <K>{"\\ln(S_T/S_0) = (\\mu - \\sigma^2/2)T + \\sigma W(T)"}</K></Step>

      <FormulaBox accent={ACCENT} label="Solution exacte du GBM">
        <K display>{"S_T = S_0 \\times \\exp\\!\\Big[\\Big(\\mu - \\frac{\\sigma^2}{2}\\Big)T + \\sigma\\sqrt{T}\\, Z\\Big] \\quad Z \\sim \\mathcal{N}(0,1)"}</K>
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Pourquoi le terme σ²/2 apparaît-il ? — Développement de Taylor stochastique</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        En calcul classique, le développement de Taylor de <K>{"df"}</K> s'arrête à l'ordre 1 car <K>{"dx^2 \\approx (dt)^2 \\to 0"}</K>.
        En calcul stochastique, le terme <K>{"dx^2 = \\sigma^2 dW^2 = \\sigma^2 dt"}</K> ne peut pas être négligé — c'est un terme d'ordre <K>{"dt"}</K>.
      </div>
      <Step num={1} accent={ACCENT}>Taylor stochastique : <K>{"df \\approx \\frac{\\partial f}{\\partial t}\\,dt + \\frac{\\partial f}{\\partial X}\\,dX + \\frac{1}{2}\\frac{\\partial^2 f}{\\partial X^2}(dX)^2 + \\cdots"}</K></Step>
      <Step num={2} accent={ACCENT}><K>{"(dX)^2 = (\\mu\\,dt + \\sigma\\,dW)^2 = \\mu^2(dt)^2 + 2\\mu\\sigma\\,dt{\\cdot}dW + \\sigma^2(dW)^2 \\approx \\sigma^2 dt"}</K></Step>
      <Step num={3} accent={ACCENT}>Car : <K>{"(dt)^2 \\to 0"}</K>, <K>{"dt{\\cdot}dW \\to 0"}</K>, et <K>{"(dW)^2 = dt"}</K> (variation quadratique !)</Step>
      <Step num={4} accent={ACCENT}>Résultat : <K>{"df = \\Big[\\frac{\\partial f}{\\partial t} + \\mu\\frac{\\partial f}{\\partial X} + \\frac{1}{2}\\sigma^2\\frac{\\partial^2 f}{\\partial X^2}\\Big]dt + \\sigma\\frac{\\partial f}{\\partial X}\\,dW"}</K></Step>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Point clé :</strong> Le terme <K>{"\\sigma^2/2"}</K> vient du terme quadratique de Taylor (<K>{"\\tfrac{1}{2} \\cdot \\frac{\\partial^2 f}{\\partial X^2} \\cdot \\sigma^2 dt"}</K>)
        qui normalement disparaît en calcul classique mais <em>survit</em> en calcul stochastique car <K>{"dW^2 = dt"}</K>.
        C'est la convexité de f qui crée ce terme — c'est l'inégalité de Jensen rendue explicite.
        Pour <K>{"f(S) = \\ln(S)"}</K> : <K>{"f''(S) = -1/S^2 < 0"}</K> → la correction est négative → <K>{"-\\sigma^2/2"}</K>.
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 8 }}>Pourquoi <K>{"(\\mu - \\sigma^2/2)"}</K> et pas <K>{"\\mu"}</K> ?</div>
        <div style={{ color: T.text, fontSize: 13, lineHeight: 1.7 }}>
          <K>{"E[S_T] = S_0 \\times e^{\\mu T}"}</K> → le drift espéré est <K>{"\\mu"}</K>. ✓<br />
          Mais la moyenne géométrique ≠ moyenne arithmétique.<br />
          La correction <K>{"-\\sigma^2/2"}</K> vient de la convexité de l'exponentielle (inégalité de Jensen).<br />
          Sans correction : <K>{"E[\\ln(S_T/S_0)] = \\mu T"}</K> → FAUX.<br />
          Avec correction : <K>{"E[\\ln(S_T/S_0)] = (\\mu - \\sigma^2/2)T"}</K> → VRAI. ✓
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Application 2 : Équation de Black-Scholes et l'argument de réplication</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 8, lineHeight: 1.8 }}>
        En appliquant le lemme d'Itô à <K>{"C(S,t)"}</K> où S suit un GBM, on obtient l'EDS de C. L'astuce de Black-Scholes
        est de construire un <strong>portefeuille Δ-neutre</strong> qui élimine toute source de risque.
      </div>
      <Step num={1} accent={ACCENT}>Portefeuille : <K>{"\\Pi = C - \\Delta \\times S"}</K> (acheter le call, vendre <K>{"\\Delta"}</K> actions)</Step>
      <Step num={2} accent={ACCENT}>Appliquer Itô à <K>{"C(S,t)"}</K> : <K>{"dC = \\Big[\\frac{\\partial C}{\\partial t} + \\mu S\\frac{\\partial C}{\\partial S} + \\tfrac{1}{2}\\sigma^2 S^2\\frac{\\partial^2 C}{\\partial S^2}\\Big]dt + \\sigma S\\frac{\\partial C}{\\partial S}\\,dW"}</K></Step>
      <Step num={3} accent={ACCENT}><K>{"d\\Pi = dC - \\Delta\\,dS = \\Big[\\frac{\\partial C}{\\partial t} + \\mu S\\frac{\\partial C}{\\partial S} + \\tfrac{1}{2}\\sigma^2 S^2\\frac{\\partial^2 C}{\\partial S^2} - \\Delta\\mu S\\Big]dt + \\Big[\\sigma S\\frac{\\partial C}{\\partial S} - \\Delta\\sigma S\\Big]dW"}</K></Step>
      <Step num={4} accent={ACCENT}>Choisir <K>{"\\Delta = \\frac{\\partial C}{\\partial S}"}</K> → le terme en <K>{"dW"}</K> s'annule exactement ! Le portefeuille devient sans risque.</Step>
      <Step num={5} accent={ACCENT}>Sans risque → <K>{"d\\Pi = r\\Pi\\,dt"}</K> (taux sans risque) → <K>{"r(C - \\Delta S)\\,dt = \\Big[\\frac{\\partial C}{\\partial t} + \\tfrac{1}{2}\\sigma^2 S^2\\frac{\\partial^2 C}{\\partial S^2}\\Big]dt"}</K></Step>
      <FormulaBox accent={ACCENT} label="PDE de Black-Scholes">
        <K display>{"\\frac{\\partial C}{\\partial t} + rS\\,\\frac{\\partial C}{\\partial S} + \\frac{1}{2}\\sigma^2 S^2\\,\\frac{\\partial^2 C}{\\partial S^2} - rC = 0"}</K>
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>L'argument de réplication :</strong> En choisissant <K>{"\\Delta = \\partial C/\\partial S"}</K> (le Delta de l'option), on élimine le terme stochastique <K>{"dW"}</K>.
        Le portefeuille résultant est <em>instantanément sans risque</em> → il doit rapporter exactement <K>{"r"}</K> (sinon arbitrage).
        Cette contrainte donne la PDE de B-S. Les termes ont une interprétation directe :<br />
        • <K>{"\\partial C/\\partial t"}</K> = Theta (dégradation temporelle)<br />
        • <K>{"rS\\,\\partial C/\\partial S"}</K> = drift risque-neutre (Delta × taux)<br />
        • <K>{"\\tfrac{1}{2}\\sigma^2 S^2\\,\\partial^2 C/\\partial S^2"}</K> = terme de convexité (Gamma)<br />
        • <K>{"-rC"}</K> = actualisation de la valeur du call
      </div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
        Cette EDP a pour solution la formule de Black-Scholes que nous verrons au Module 4.
        Le prix B-S est la <strong>seule fonction</strong> <K>{"C(S,t)"}</K> qui satisfait cette PDE avec la condition terminale <K>{"C(S,T) = \\max(S-K,\\, 0)"}</K>.
      </div>

      <Accordion title="Exercice — Lemme d'Itô appliqué à f(S) = S²" accent={ACCENT} badge="Entraînement">
        <p style={{ color: T.text }}>Si <K>{"dS = \\mu S\\,dt + \\sigma S\\,dW"}</K>, trouvez <K>{"df"}</K> où <K>{"f(S) = S^2"}</K></p>
        <FormulaBox accent={ACCENT}><K>{"df = S^2(2\\mu + \\sigma^2)\\,dt + 2\\sigma S^2\\,dW"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Lemme d'Itô" ruleDetail="f(S) expansion" accent={ACCENT}>Dérivées : <K>{"\\partial f/\\partial S = 2S,\\; \\partial^2 f/\\partial S^2 = 2,\\; \\partial f/\\partial t = 0"}</K></DemoStep>
          <DemoStep num={2} rule="Lemme d'Itô" ruleDetail="df = f'dX + ½f''(dX)²" accent={ACCENT}><K>{"df = [0 + \\mu S \\cdot 2S + \\tfrac{1}{2}\\sigma^2 S^2 \\cdot 2]\\,dt + \\sigma S \\cdot 2S\\,dW"}</K></DemoStep>
          <DemoStep num={3} rule="Lemme d'Itô" ruleDetail="dW² = dt" accent={ACCENT}><K>{"df = [2\\mu S^2 + \\sigma^2 S^2]\\,dt + 2\\sigma S^2\\,dW"}</K>. Le terme <K>{"\\sigma^2"}</K> supplémentaire vient de la correction d'Itô (<K>{"dW^2 = dt"}</K>).</DemoStep>
        </Demonstration>
      </Accordion>

      <Accordion title="Exercice — Lemme d'Itô appliqué à f(S) = √S" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Si <K>{"dS = \\mu S\\,dt + \\sigma S\\,dW"}</K> (GBM), trouvez l'EDS de <K>{"Y = \\sqrt{S} = S^{1/2}"}</K>.</p>
        <FormulaBox accent={ACCENT}><K>{"dY = Y\\Big(\\frac{\\mu}{2} - \\frac{\\sigma^2}{8}\\Big)dt + \\frac{\\sigma}{2}Y\\,dW"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Lemme d'Itô" ruleDetail="f(S) expansion" accent={ACCENT}>Dérivées : <K>{"f(S)=S^{1/2},\\; f'(S)=\\tfrac{1}{2}S^{-1/2},\\; f''(S)=-\\tfrac{1}{4}S^{-3/2}"}</K></DemoStep>
          <DemoStep num={2} rule="Lemme d'Itô" ruleDetail="df = f'dX + ½f''(dX)²" accent={ACCENT}><K>{"dY = \\big[\\tfrac{1}{2}S^{-1/2}\\cdot\\mu S + \\tfrac{1}{2}\\sigma^2 S^2\\cdot(-\\tfrac{1}{4}S^{-3/2})\\big]dt + \\tfrac{1}{2}S^{-1/2}\\cdot\\sigma S\\,dW"}</K></DemoStep>
          <DemoStep num={3} rule="Lemme d'Itô" ruleDetail="simplification" accent={ACCENT}><K>{"= \\big[\\tfrac{\\mu}{2}S^{1/2} - \\tfrac{\\sigma^2}{8}S^{1/2}\\big]dt + \\tfrac{\\sigma}{2}S^{1/2}\\,dW"}</K></DemoStep>
          <DemoStep num={4} rule="Lemme d'Itô" ruleDetail="Y = √S" accent={ACCENT}>En substituant <K>{"Y = S^{1/2}"}</K> : <K>{"dY = Y(\\mu/2 - \\sigma^2/8)\\,dt + (\\sigma/2)Y\\,dW"}</K>. Y suit aussi un GBM avec drift <K>{"\\mu/2 - \\sigma^2/8"}</K> et vol <K>{"\\sigma/2"}</K>.</DemoStep>
        </Demonstration>
      </Accordion>

      <Accordion title="Exercice — Processus OU via le lemme d'Itô" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text }}>Montrez que la solution du processus OU <K>{"dX = \\kappa(\\theta - X)\\,dt + \\sigma\\,dW"}</K> est <K>{"X(t) = X_0 e^{-\\kappa t} + \\theta(1-e^{-\\kappa t}) + \\sigma\\!\\int_0^t e^{-\\kappa(t-s)}dW(s)"}</K>.</p>
        <FormulaBox accent={ACCENT}><K>{"X(t) = X_0 e^{-\\kappa t} + \\theta(1-e^{-\\kappa t}) + \\sigma\\!\\int_0^t e^{-\\kappa(t-s)}dW(s)"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Lemme d'Itô" ruleDetail="changement de variable" accent={ACCENT}>Posons <K>{"Z(t) = X(t)\\,e^{\\kappa t}"}</K> (changement de variable). Cherchons dZ.</DemoStep>
          <DemoStep num={2} rule="Lemme d'Itô" ruleDetail="f(X,t) = X·e^{κt}" accent={ACCENT}>Dérivées : <K>{"\\partial f/\\partial t = \\kappa X e^{\\kappa t},\\; \\partial f/\\partial X = e^{\\kappa t},\\; \\partial^2 f/\\partial X^2 = 0"}</K></DemoStep>
          <DemoStep num={3} rule="Lemme d'Itô" ruleDetail="dZ = ∂f/∂t dt + ∂f/∂X dX" accent={ACCENT}><K>{"dZ = \\kappa X e^{\\kappa t}dt + e^{\\kappa t}[\\kappa(\\theta - X)dt + \\sigma\\,dW]"}</K></DemoStep>
          <DemoStep num={4} rule="Lemme d'Itô" ruleDetail="simplification" accent={ACCENT}><K>{"= e^{\\kappa t}[\\kappa X + \\kappa\\theta - \\kappa X]dt + \\sigma e^{\\kappa t}dW = \\kappa\\theta e^{\\kappa t}dt + \\sigma e^{\\kappa t}dW"}</K></DemoStep>
          <DemoStep num={5} rule="Processus d'Ornstein-Uhlenbeck" ruleDetail="intégration" accent={ACCENT}><K>{"Z(t) - Z(0) = \\kappa\\theta\\!\\int_0^t e^{\\kappa s}ds + \\sigma\\!\\int_0^t e^{\\kappa s}dW(s)"}</K></DemoStep>
          <DemoStep num={6} rule="Processus d'Ornstein-Uhlenbeck" ruleDetail="X = Ze^{−κt}" accent={ACCENT}><K>{"= \\theta(e^{\\kappa t}-1) + \\sigma\\!\\int_0^t e^{\\kappa s}dW(s)"}</K>. Donc <K>{"X(t) = X_0 e^{-\\kappa t} + \\theta(1-e^{-\\kappa t}) + \\sigma\\!\\int_0^t e^{-\\kappa(t-s)}dW(s)"}</K> ✓</DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ─── Tab: Simulation (2 actifs corrélés) ────────────────────────────────────
export function SimulTab() {
  const [rho, setRho] = useState(0.6)
  const [mu1, setMu1] = useState(0.08)
  const [mu2, setMu2] = useState(0.05)
  const [sig1, setSig1] = useState(0.3)
  const [sig2, setSig2] = useState(0.25)
  const [key, setKey] = useState(0)

  const data = useMemo(() => {
    const n = 252; const dt = 1 / n
    let S1 = 100, S2 = 50
    const pts = [{ t: 0, S1: 100, S2: 50 }]
    for (let i = 1; i <= n; i++) {
      const Z1 = gaussRand()
      const Z2 = gaussRand()
      const W1 = Z1
      const W2 = rho * Z1 + Math.sqrt(1 - rho * rho) * Z2
      S1 *= Math.exp((mu1 - 0.5 * sig1 * sig1) * dt + sig1 * Math.sqrt(dt) * W1)
      S2 *= Math.exp((mu2 - 0.5 * sig2 * sig2) * dt + sig2 * Math.sqrt(dt) * W2)
      if (i % 3 === 0) pts.push({ t: +(i * dt).toFixed(3), S1: +S1.toFixed(2), S2: +S2.toFixed(2) })
    }
    return pts
  }, [rho, mu1, mu2, sig1, sig2, key])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: ACCENT }}>Méthodes de simulation numérique :</strong> Quand un modèle n'a pas de formule fermée
        (options asiatiques, modèles à volatilité stochastique, payoffs path-dependent), la <strong>simulation de Monte Carlo</strong>
        est la méthode universelle. On simule N trajectoires du processus sous-jacent, on calcule le payoff pour chaque,
        et on moyenne. La loi des grands nombres garantit la convergence. Cette section illustre la simulation de
        <strong>2 actifs corrélés</strong> — essentielle pour les options sur spread (pétrole vs gaz, crack spread),
        les portefeuilles multi-commodités, et la gestion du risque de corrélation.
      </div>

      <IntuitionBlock emoji="🔗" title="Simulation de 2 actifs corrélés par Cholesky" accent={ACCENT}>
        Pour simuler un portefeuille pétrole + gaz avec corrélation <K>{"\\rho"}</K> :
        On génère <K>{"Z_1, Z_2 \\sim \\mathcal{N}(0,1)"}</K> indépendants, puis on "corèle" avec Cholesky :
        <K>{"W_1 = Z_1"}</K> et <K>{"W_2 = \\rho\\, Z_1 + \\sqrt{1-\\rho^2}\\, Z_2"}</K>.
        Cela garantit <K>{"\\mathrm{Cor}(W_1, W_2) = \\rho"}</K> tout en préservant la marginalité normale de chaque actif.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Cholesky — 2 actifs corrélés">
        <K display>{"W_1 = Z_1"}</K>
        <K display>{"W_2 = \\rho\\, Z_1 + \\sqrt{1-\\rho^2}\\, Z_2 \\quad\\text{où } Z_1, Z_2 \\sim \\mathcal{N}(0,1) \\text{ iid}"}</K>
        <K display>{"\\mathrm{Cov}(W_1, W_2) = E[W_1 \\cdot W_2] = \\rho \\times \\mathrm{Var}(Z_1) = \\rho \\;\\checkmark"}</K>
      </FormulaBox>

      <Grid cols={3} gap="8px">
        <Slider label="ρ (corrélation)" value={rho} min={-0.99} max={0.99} step={0.01} onChange={setRho} accent={ACCENT} />
        <Slider label="µ₁ (WTI drift)" value={mu1} min={-0.2} max={0.4} step={0.01} onChange={setMu1} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="µ₂ (Gaz drift)" value={mu2} min={-0.2} max={0.4} step={0.01} onChange={setMu2} accent={T.a7} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ₁ (WTI vol)" value={sig1} min={0.05} max={0.6} step={0.01} onChange={setSig1} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ₂ (Gaz vol)" value={sig2} min={0.05} max={0.6} step={0.01} onChange={setSig2} accent={T.a7} format={v => `${(v * 100).toFixed(0)}%`} />
      </Grid>
      <button onClick={() => setKey(k => k + 1)} style={{
        background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: ACCENT,
        borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, marginBottom: 12,
      }}>🔄 Nouvelles trajectoires</button>

      <ChartWrapper title={`WTI (S₁) & Gaz Nat (S₂) corrélés — ρ = ${rho.toFixed(2)}`} accent={ACCENT} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis yAxisId="left" stroke={ACCENT} tick={{ fill: ACCENT, fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" stroke={T.a5} tick={{ fill: T.a5, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="S1" stroke={ACCENT} strokeWidth={2} dot={false} name="WTI ($/bbl)" />
            <Line yAxisId="right" type="monotone" dataKey="S2" stroke={T.a5} strokeWidth={2} dot={false} name="Gaz Nat ($/MMBtu)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Précision de Monte Carlo et réduction de variance</SectionTitle>
      <FormulaBox accent={ACCENT} label="Erreur standard de Monte Carlo">
        <K display>{"\\text{Erreur standard} = \\frac{\\sigma_{\\text{payoff}}}{\\sqrt{N}}"}</K>
        <K display>{"\\text{IC}_{95\\%} :\\; \\text{Prix}_{\\text{MC}} \\pm 1.96 \\times \\frac{\\sigma_{\\text{payoff}}}{\\sqrt{N}}"}</K>
        <K display>{"\\text{Doubler la précision} \\Rightarrow \\text{multiplier } N \\text{ par 4 (coût quadratique !)}"}</K>
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Techniques de réduction de variance — indispensables en pratique :</strong>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>1. Variables antithétiques :</strong> Pour chaque Z ~ N(0,1) utilisé, ajouter aussi -Z.
            On simule <K>{"N/2"}</K> paires <K>{"(Z, -Z)"}</K> au lieu de N variables indépendantes.
            Cela exploite la symétrie de la loi normale. Réduction typique de variance : 30-70%.
            Formule : <K>{"C_{\\text{MC}} = \\tfrac{1}{2}[\\text{payoff}(Z) + \\text{payoff}(-Z)]"}</K> pour chaque paire.
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>2. Variables de contrôle :</strong> On utilise un actif dont on connaît le vrai prix (ex: le call B-S)
            pour corriger l'estimateur MC. Si payoff_BS_MC ≠ prix_BS_vrai, on ajuste proportionnellement.
            <K>{"C_{\\text{ajusté}} = C_{\\text{MC}} + b \\times (\\text{prix}_{\\text{BS,vrai}} - \\text{payoff}_{\\text{BS,MC}})"}</K>. Réduction typique : 80-95% de variance.
          </div>
          <div>
            <strong>3. Stratification :</strong> Diviser l'espace [0,1] en N tranches égales et tirer exactement
            un point dans chaque tranche (au lieu de tirer N points iid). Garantit une meilleure couverture
            de l'espace des scénarios.
          </div>
        </div>
      </div>

      <Accordion title="Exercice — Nombre de simulations nécessaires" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Un call vaut 5€ avec <K>{"\\sigma_{\\text{payoff}} \\approx 20"}</K>€. Combien de simulations pour une précision de <K>{"\\pm 0.10"}</K>€ (95%) ? De <K>{"\\pm 0.01"}</K>€ ?</p>
        <FormulaBox accent={ACCENT}><K>{"N = \\Big(\\frac{1.96\\,\\sigma}{\\varepsilon}\\Big)^{\\!2}"}</K> — précision ×10 → N ×100</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Erreur standard" ruleDetail="N = (1.96·σ/ε)²" accent={ACCENT}>Formule : <K>{"N = \\Big(\\frac{1.96 \\times \\sigma_{\\text{payoff}}}{\\varepsilon}\\Big)^{\\!2}"}</K> où ε est la demi-largeur souhaitée</DemoStep>
          <DemoStep num={2} rule="Loi des grands nombres" ruleDetail="convergence en 1/√N" accent={ACCENT}>Pour ε = 0.10€ : <K>{"N = (1.96 \\times 20 / 0.10)^2 = 392^2 = 153\\,664"}</K> simulations</DemoStep>
          <DemoStep num={3} rule="Loi des grands nombres" ruleDetail="convergence en 1/√N" accent={ACCENT}>Pour ε = 0.01€ : <K>{"N = (3920)^2 = 15\\,366\\,400"}</K> simulations (~15M !)</DemoStep>
          <DemoStep num={4} rule="Erreur standard" ruleDetail="réduction de variance" accent={ACCENT}>Avec variables antithétiques (variance réduite de 50%) : N divisé par 2 → gain de CPU ×2. En pratique : 10 000 sims pour estimation rapide, 1M pour publication, 10M pour pricing de salle de marchés.</DemoStep>
        </Demonstration>
      </Accordion>

      <ExampleBlock title="Cas concret : portefeuille énergie à 1 an" accent={ACCENT}>
        <p>100M$ en WTI (<K>{"\\sigma=30\\%"}</K>) + 50M$ en Gaz Nat (<K>{"\\sigma=25\\%"}</K>), <K>{"\\rho=0.5"}</K></p>
        <FormulaBox accent={ACCENT}><K>{"\\sigma_p = 25.2\\%,\\; \\text{VaR}_{95\\%} = 62.1\\text{M\\$}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Loi des grands nombres" ruleDetail="poids du portefeuille" accent={ACCENT}><K>{"w_1 = 2/3,\\; w_2 = 1/3"}</K> (portefeuille total 150M$)</DemoStep>
          <DemoStep num={2} rule="Loi des grands nombres" ruleDetail="Cov = ρ·σ₁·σ₂" accent={ACCENT}><K>{"\\mathrm{Cov} = 0.5 \\times 0.30 \\times 0.25 = 0.0375"}</K></DemoStep>
          <DemoStep num={3} rule="Erreur standard" ruleDetail="σ²_p = Σ wᵢwⱼ Covᵢⱼ" accent={ACCENT}><K>{"\\sigma_p^2 = (2/3)^2 \\times 0.09 + 2 \\times \\tfrac{2}{3} \\times \\tfrac{1}{3} \\times 0.0375 + (1/3)^2 \\times 0.0625"}</K></DemoStep>
          <DemoStep num={4} rule="Erreur standard" ruleDetail="calcul numérique" accent={ACCENT}><K>{"= 0.04 + 0.01667 + 0.006944 = 0.063611"}</K></DemoStep>
          <DemoStep num={5} rule="Erreur standard" ruleDetail="VaR = z·σ·V" accent={ACCENT}><K>{"\\sigma_p = 25.2\\%"}</K> → VaR 95% (1 an) = <K>{"1.645 \\times 0.252 \\times 150\\text{M\\$} = 62.1\\text{M\\$}"}</K></DemoStep>
        </Demonstration>
      </ExampleBlock>
    </div>
  )
}

// ─── Tab: Processus à Saut ────────────────────────────────────────────────────
export function JumpTab() {
  const [lambda, setLambda] = useState(5)
  const [muJ, setMuJ] = useState(0.0)
  const [sigJ, setSigJ] = useState(0.2)
  const [sigma, setSigma] = useState(0.2)
  const [mode, setMode] = useState('mrjd')
  const [kappa, setKappa] = useState(3)
  const [theta, setTheta] = useState(80)
  const [key, setKey] = useState(0)

  function poissonRand(lam) {
    if (lam <= 0) return 0
    const L = Math.exp(-lam)
    let k = 0, p = 1
    do { k++; p *= Math.random() } while (p > L && k < 50)
    return k - 1
  }

  const Tstep = 1, n = 252, dt = 1 / n
  const COLORS = [ACCENT, T.a4, T.a5]

  const paths = useMemo(() => {
    const result = []
    for (let p = 0; p < 3; p++) {
      let S = mode === 'merton' ? 100 : theta
      const pts = [{ t: 0, S: +S.toFixed(2) }]
      for (let i = 1; i <= n; i++) {
        const Z = gaussRand()
        const nJumps = poissonRand(lambda * dt)
        if (mode === 'merton') {
          const kbar = Math.exp(muJ + 0.5 * sigJ * sigJ) - 1
          let jumpLogSum = 0
          for (let j = 0; j < nJumps; j++) jumpLogSum += muJ + sigJ * gaussRand()
          S *= Math.exp((0.05 - lambda * kbar - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * Z + jumpLogSum)
        } else {
          // MRJD : dX = κ(θ-X)dt + σX dW + X(e^Y-1) dN
          let jumpMult = 0
          for (let j = 0; j < nJumps; j++) jumpMult += Math.expm1(muJ + sigJ * gaussRand())
          S += kappa * (theta - S) * dt + sigma * S * Math.sqrt(dt) * Z + S * jumpMult
        }
        S = Math.max(S, 0.01)
        if (i % 3 === 0) pts.push({ t: +(i * dt).toFixed(3), S: +S.toFixed(2) })
      }
      result.push(pts)
    }
    return result
  }, [lambda, muJ, sigJ, sigma, mode, kappa, theta, key])

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
        Le cours DPH3V utilise explicitement le <strong>MRJD (Mean-Reverting Jump Diffusion)</strong> pour capturer
        à la fois le retour à la moyenne et ces chocs ponctuels discontinus.
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
        ['τ ~ Exp(λ)', 'Temps entre sauts : P(τ > t) = e^(-λt), mémoryfree'],
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

      <SectionTitle accent={ACCENT}>3. MRJD — Mean-Reverting Jump Diffusion (cours DPH3V)</SectionTitle>
      <FormulaBox accent={ACCENT} label="MRJD — Modèle énergie explicitement au programme">
        <K display>{"dX = \\kappa(\\theta - X)\\,dt + \\sigma X\\,dW + X(e^Y - 1)\\,dN"}</K>
        <K display>{"Y \\sim \\mathcal{N}(\\mu_J,\\, \\sigma_J^2)"}</K>
      </FormulaBox>
      <SymbolLegend accent={ACCENT} symbols={[
        ['κ(θ-X)dt', 'Force de rappel vers θ (mean-reversion OU)'],
        ['σX dW', 'Diffusion continue, proportionnelle au prix'],
        ['X(e^Y - 1) dN', 'Saut multiplicatif : Y = log-rendement du saut'],
        ['λ', "Fréquence des sauts (4–12/an typique pour l'énergie)"],
        ['Vol totale ≈', '√(σ² + λ(µ_J² + σ_J²)) — diffusion + composante saut'],
      ]} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['merton', 'mrjd'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            background: mode === m ? `${ACCENT}22` : T.panel2,
            border: `1px solid ${mode === m ? ACCENT : T.border}`,
            color: mode === m ? ACCENT : T.muted,
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: mode === m ? 700 : 400,
          }}>{m === 'merton' ? 'Merton JD (S₀=100)' : 'MRJD Énergie'}</button>
        ))}
      </div>

      <Grid cols={3} gap="10px">
        <Slider label="λ (sauts/an)" value={lambda} min={1} max={20} step={0.5} onChange={setLambda} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="µ_J (moyenne saut)" value={muJ} min={-0.4} max={0.4} step={0.02} onChange={setMuJ} accent={T.a4} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ_J (taille saut)" value={sigJ} min={0.05} max={0.6} step={0.01} onChange={setSigJ} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ (diffusion)" value={sigma} min={0.05} max={0.5} step={0.01} onChange={setSigma} accent={T.a7} format={v => `${(v * 100).toFixed(0)}%`} />
        {mode === 'mrjd' && <>
          <Slider label="κ (mean-rev.)" value={kappa} min={0.5} max={10} step={0.5} onChange={setKappa} accent={T.a3} format={v => v.toFixed(1)} />
          <Slider label="θ (niveau moyen)" value={theta} min={30} max={150} step={5} onChange={setTheta} accent={T.a6} format={v => `${v}$/bbl`} />
        </>}
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

      <ChartWrapper title={mode === 'merton' ? 'Merton JD — 3 trajectoires (S₀=100)' : `MRJD — 3 trajectoires (θ=${theta}$/bbl)`} accent={ACCENT} height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" domain={[0, 1]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Temps (années)', fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            {mode === 'mrjd' && <ReferenceLine y={theta} stroke={T.a4} strokeDasharray="6 3" label={{ value: `θ=${theta}`, fill: T.a4, fontSize: 10 }} />}
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

      <Accordion title="Exercice — Probabilité de saut (Poisson)" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}>Le pétrole subit <K>{"\\lambda=4"}</K> sauts/an. Quelle est la probabilité d'avoir <K>{"\\geq 2"}</K> sauts en 6 mois ?</p>
        <FormulaBox accent={ACCENT}><K>{"P(N \\geq 2) = 59.4\\%"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Processus de Poisson" ruleDetail="λt = intensité × durée" accent={ACCENT}><K>{"t = 0.5\\text{ an} \\Rightarrow \\lambda t = 4 \\times 0.5 = 2"}</K></DemoStep>
          <DemoStep num={2} rule="Processus de Poisson" ruleDetail="P(N=k) = e^{−λt}(λt)^k/k!" accent={ACCENT}><K>{"P(N \\geq 2) = 1 - P(N=0) - P(N=1) = 1 - e^{-2} - 2e^{-2} = 1 - 3 \\times 0.1353 = 59.4\\%"}</K></DemoStep>
        </Demonstration>
      </Accordion>
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

// ─── Main Module 3 ────────────────────────────────────────────────────────────
const TABS = ['Marche Aléatoire', 'GBM', 'Mean-Reversion', 'Processus à Saut', "Lemme d'Itô", 'Simulation']

export default function Module3() {
  const [tab, setTab] = useState('GBM')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      <ModuleHeader
        num={3}
        title="Processus Stochastiques"
        subtitle="Du mouvement brownien au GBM, en passant par la mean-reversion et le lemme d'Itô — les fondations du pricing par Black-Scholes et des modèles d'énergie."
        accent={ACCENT}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} accent={ACCENT} />
      {tab === 'Marche Aléatoire' && <RandomWalkTab />}
      {tab === 'GBM' && <GBMTab />}
      {tab === 'Mean-Reversion' && <MeanRevTab />}
      {tab === 'Processus à Saut' && <JumpTab />}
      {tab === "Lemme d'Itô" && <ItoTab />}
      {tab === 'Simulation' && <SimulTab />}
    </div>
  )
}
