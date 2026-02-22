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
