import React, { useState, useMemo, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { T } from '../../design/tokens'
import {
  ModuleHeader, TabBar, FormulaBox, IntuitionBlock, ExampleBlock,
  Slider, Accordion, Step, SymbolLegend, SectionTitle, InfoChip, Grid, ChartWrapper,
} from '../../design/components'

const ACCENT = T.a3

function gaussRand() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ─── Tab: Marche Aléatoire ────────────────────────────────────────────────────
function RandomWalkTab() {
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
        Le <strong>mouvement brownien</strong> W(t) est la limite continue de cette marche aléatoire.
      </IntuitionBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Les 4 axiomes du Brownien standard — à connaître par cœur :</strong>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}><strong>1. W(0) = 0</strong> — Le processus démarre à zéro. C'est une convention de normalisation : on part d'un état connu à t=0.</div>
          <div style={{ marginBottom: 6 }}><strong>2. Accroissements indépendants</strong> — W(t) - W(s) est indépendant de W(s) - W(u) pour u {'<'} s {'<'} t. Ce qui se passe dans le futur ne dépend pas du passé : c'est la propriété markovienne. Le marché ne "se souvient" pas de son chemin.</div>
          <div style={{ marginBottom: 6 }}><strong>3. Accroissements stationnaires gaussiens</strong> — W(t) - W(s) ~ N(0, t-s). La loi de l'incrément ne dépend que de la durée t-s, pas du moment absolu. Et sa variance est exactement t-s : plus l'horizon est long, plus l'incertitude grandit.</div>
          <div><strong>4. Trajectoires continues</strong> — Pas de saut. Mais (paradoxe !) nulle part dérivable : la trajectoire est infiniment irrégulière, elle zigzague à toutes les échelles de temps.</div>
        </div>
      </div>

      <FormulaBox accent={ACCENT} label="Propriétés du Mouvement Brownien W(t)">
        1. W(0) = 0
        2. Accroissements indépendants : W(t) - W(s) ⊥ W(s) - W(u) pour u{'<'}s{'<'}t
        3. Accroissements stationnaires : W(t) - W(s) ~ N(0, t-s)
        4. Trajectoires continues (mais nulle part dérivables !)
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Propriété clé">
        dW(t) ~ N(0, dt)   i.e.   E[dW] = 0,  E[dW²] = dt
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Construction rigoureuse : convergence vers le brownien</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Comment passe-t-on d'une marche discrète (±1 à chaque pas) à un processus continu ? On subdivise [0,1] en n intervalles de taille Δt = 1/n.
        À chaque pas, on ajoute un incrément ξᵢ = ±√Δt (pour que la variance soit Δt).
        Après k pas : W_k = ξ₁ + ... + ξₖ, somme de k variables iid de variance Δt.
      </div>
      <Step num={1} accent={ACCENT}>E[W_k] = 0  (symétrie),  Var[W_k] = k × Δt = k/n</Step>
      <Step num={2} accent={ACCENT}>Quand n → ∞ : Var[W(t)] → t car k/n → t (les k pas couvrent le temps t)</Step>
      <Step num={3} accent={ACCENT}>Théorème Central Limite : la somme de n variables iid (Var=Δt) → N(0, t) quand n→∞</Step>
      <Step num={4} accent={ACCENT}>Résultat : W(t) ~ N(0, t) — le brownien est la limite du discrète quand Δt → 0</Step>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Ce résultat justifie pourquoi on simule toujours le brownien avec √Δt × Z où Z ~ N(0,1) :
        c'est exactement la limite du schéma discret, valide pour tout Δt petit.
      </div>

      <SectionTitle accent={ACCENT}>Variation quadratique : la signature de l'irrégularité</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Pour une fonction dérivable ordinaire f(t), la variation quadratique est nulle :
        Σ [f(tᵢ₊₁) - f(tᵢ)]² → 0 quand Δt → 0 (les carrés de petits incréments s'écrasent).
        Pour le brownien, c'est fondamentalement différent :
      </div>
      <FormulaBox accent={ACCENT} label="Variation quadratique du brownien [W,W]_t = t">
        Σᵢ [W(tᵢ₊₁) - W(tᵢ)]² → t  (en probabilité, quand max Δtᵢ → 0)

        En notation différentielle : dW² = dt  (et non 0 comme en calcul classique)
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Intuition :</strong> Le brownien est tellement irrégulier que ses petits incréments, même au carré, s'accumulent.
        Dans le calcul classique : (dx)² ~ (dt)² → 0. Dans le calcul stochastique : (dW)² ~ dt → fini.
        C'est précisément cette propriété qui fait apparaître le terme supplémentaire σ²/2 dans le lemme d'Itô (onglet suivant).
        Sans [W,W]_t = t, Black-Scholes n'existerait pas.
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
        E[W(t)] = 0 et Var[W(t)] = t → la dispersion croît comme √t.
      </div>

      <Accordion title="Exercice — Propriétés du brownien" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}>Soit W(t) un brownien standard. Calculez E[W(3)], Var[W(3)-W(1)], et P(W(1) {'>'} 1).</p>
        <Step num={1} accent={ACCENT}>E[W(3)] = 0 (propriété fondamentale : espérance nulle à tout instant)</Step>
        <Step num={2} accent={ACCENT}>W(3) - W(1) ~ N(0, 3-1) = N(0, 2) → Var[W(3)-W(1)] = 2</Step>
        <Step num={3} accent={ACCENT}>W(1) ~ N(0,1) → P(W(1) {'>'} 1) = P(Z {'>'} 1) = 1 - N(1) ≈ 1 - 0.8413 = 15.87%</Step>
        <Step num={4} accent={ACCENT}>Bonus : Cov[W(2), W(5)] = min(2,5) = 2 (propriété du brownien : Cov[W(s),W(t)] = min(s,t))</Step>
        <FormulaBox accent={ACCENT}>E[W(t)] = 0, Var[W(t)] = t, Cov[W(s),W(t)] = min(s,t)</FormulaBox>
      </Accordion>

      <Accordion title="Exercice — Simulation discrète du brownien" accent={ACCENT} badge="Entraînement">
        <p style={{ color: T.text }}>Simulez à la main 4 pas de brownien sur [0,1] (Δt = 0.25). Utilisez les réalisations Z = +0.8, -1.2, +0.3, -0.5.</p>
        <Step num={1} accent={ACCENT}>Incrément par pas : √Δt × Z = √0.25 × Z = 0.5 × Z</Step>
        <Step num={2} accent={ACCENT}>W(0.25) = 0 + 0.5 × 0.8 = 0.40</Step>
        <Step num={3} accent={ACCENT}>W(0.50) = 0.40 + 0.5 × (-1.2) = 0.40 - 0.60 = -0.20</Step>
        <Step num={4} accent={ACCENT}>W(0.75) = -0.20 + 0.5 × 0.3 = -0.20 + 0.15 = -0.05</Step>
        <Step num={5} accent={ACCENT}>W(1.00) = -0.05 + 0.5 × (-0.5) = -0.05 - 0.25 = -0.30</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
          Vérification : E[W(1)] théoriquement 0, Var[W(1)] théoriquement 1. Sur cet échantillon unique, W(1) = -0.30 (variabilité normale pour 4 pas).
        </div>
      </Accordion>
    </div>
  )
}

// ─── Tab: GBM ─────────────────────────────────────────────────────────────────
function GBMTab() {
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
        on modélise les <strong>rendements</strong> log dS/S. L'idée fondamentale est que chaque petit rendement relatif
        dR = dS/S est gaussien : dR = µdt + σdW. Si on cumule ces petits rendements sur [0,T], le prix final est :
        S(T) = S₀ × exp(∫₀ᵀ dR) = S₀ × exp(log-normal). C'est pourquoi les <em>prix</em> GBM suivent une loi log-normale
        (toujours positifs, asymétriques à droite) — une propriété essentielle pour les actifs financiers.
      </div>

      <IntuitionBlock emoji="📈" title="GBM : le modèle standard des prix financiers" accent={ACCENT}>
        Le Geometric Brownian Motion (GBM) est la brique de base de Black-Scholes.
        L'idée : le <strong>rendement</strong> instantané suit une loi normale avec une composante drift (µ)
        et une composante aléatoire (σ × bruit). Cela implique que les <em>prix</em> suivent une
        distribution log-normale : ils ne peuvent jamais être négatifs.
        En énergie : le pétrole, le gaz, les forward d'électricité sont souvent modélisés par GBM en première approximation.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Équation différentielle stochastique (EDS)">
        dS = µ·S·dt + σ·S·dW
      </FormulaBox>

      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        <strong style={{ color: ACCENT }}>Décomposition terme à terme de dS = µS dt + σS dW :</strong>
      </div>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: ACCENT }}>µS dt — composante déterministe (drift) :</strong> Le prix "tend" à croître à taux µ par an.
          Si σ=0, on aurait dS = µS dt, c'est-à-dire S(t) = S₀ × e^(µt) — une croissance exponentielle pure.
          µ représente le rendement espéré annuel : pour les actions µ ≈ 8-12%, pour les commodités µ dépend du modèle de pricing.
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: ACCENT }}>σS dW — composante aléatoire (diffusion) :</strong> L'amplitude du choc est <em>proportionnelle au prix</em>.
          Si S double, la volatilité absolue double aussi. C'est ce qui garantit que la <em>volatilité relative</em> (σ = σS/S) reste constante.
          Un prix de 100€ avec σ=30% fluctue de ±30€/an, un prix de 200€ fluctue de ±60€/an — même 30% relatif.
        </div>
        <div>
          <strong style={{ color: ACCENT }}>Conséquence :</strong> dS/S = µ dt + σ dW → les rendements relatifs sont normaux, les prix sont log-normaux.
          C'est cohérent avec l'observation empirique : on ne modélise pas les prix en absolu, on modélise les rendements.
        </div>
      </div>

      <FormulaBox accent={ACCENT} label="Solution exacte (par lemme d'Itô)">
        S(t) = S₀ × exp[(µ - σ²/2)·t + σ·W(t)]
      </FormulaBox>

      <IntuitionBlock emoji="📊" title="Loi log-normale de S_T : quantiles et probabilités" accent={ACCENT}>
        S_T suit une loi log-normale : ln(S_T/S₀) ~ N((µ - σ²/2)T, σ²T).
        La médiane de S_T est S₀ × exp((µ - σ²/2)T) — inférieure à l'espérance S₀ × exp(µT).
        P(S_T {'>'} K) = N(d₂) sous la mesure risque-neutre (avec µ remplacé par r) — c'est le d₂ de Black-Scholes !
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
        <Step num={1} accent={ACCENT}>Formule : S(tᵢ) = S(tᵢ₋₁) × exp[(µ - σ²/2)Δt + σ√Δt × Z]</Step>
        <Step num={2} accent={ACCENT}>Drift ajusté : (µ - σ²/2)Δt = (0.10 - 0.02) × 0.25 = 0.08 × 0.25 = 0.02</Step>
        <Step num={3} accent={ACCENT}>σ√Δt = 0.20 × √0.25 = 0.20 × 0.5 = 0.10</Step>
        <Step num={4} accent={ACCENT}>S(0.25) = 100 × exp(0.02 + 0.10 × 0.6) = 100 × exp(0.08) = 100 × 1.0833 = 108.33€</Step>
        <Step num={5} accent={ACCENT}>S(0.50) = 108.33 × exp(0.02 + 0.10 × (-0.4)) = 108.33 × exp(0.016) = 108.33 × 1.0161 = 109.98€</Step>
        <Step num={6} accent={ACCENT}>S(0.75) = 109.98 × exp(0.02 + 0.10 × 1.1) = 109.98 × exp(0.13) = 109.98 × 1.1388 = 125.24€</Step>
        <Step num={7} accent={ACCENT}>S(1.00) = 125.24 × exp(0.02 + 0.10 × (-0.2)) = 125.24 × exp(0.018) = 125.24 × 1.0181 = 127.51€</Step>
        <FormulaBox accent={ACCENT}>Rendement total = ln(127.51/100) = +24.6%  |  E[S₁] = 100×e^0.10 = 110.5€ (1 trajectoire ≠ espérance)</FormulaBox>
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
function MeanRevTab() {
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
        plus le prix s'éloigne de θ, plus il est "tiré" vers θ avec force κ.
        C'est le modèle de base pour les taux d'intérêt (Vasicek) et les commodités.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Processus Ornstein-Uhlenbeck (OU)">
        dX = κ(θ - X)dt + σ dW
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Solution analytique du processus OU</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Contrairement au GBM, le processus OU admet une solution analytique exacte obtenue par le lemme d'Itô
        appliqué à f(X,t) = X × e^(κt) :
      </div>
      <FormulaBox accent={ACCENT} label="Solution exacte du processus OU">
        X(t) = X₀·e^(-κt) + θ(1 - e^(-κt)) + σ∫₀ᵗ e^(-κ(t-s)) dW(s)

        E[X(t)] = θ + (X₀ - θ)·e^(-κt)
        Var[X(t)] = σ²(1 - e^(-2κt)) / (2κ)
        Var[X(∞)] = σ²/(2κ)  [variance stationnaire]
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Lecture de la solution :</strong>
        <div style={{ marginTop: 6 }}>
          Le terme <strong>X₀·e^(-κt)</strong> représente la mémoire du point de départ — qui s'efface exponentiellement.
          Le terme <strong>θ(1 - e^(-κt))</strong> représente l'attraction vers la moyenne — qui monte de 0 à θ.
          Le terme <strong>σ∫e^(-κ(t-s))dW(s)</strong> est la composante aléatoire — bruits passés filtrés exponentiellement.
          À l'équilibre (t→∞) : X(∞) ~ N(θ, σ²/2κ) — le processus est <strong>stationnaire</strong> (sa distribution ne change plus).
        </div>
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie de la solution OU — E[X(t)] = θ + (X₀ − θ)·e^(−κt)</div>
        <Step num={1} accent={ACCENT}>θ — le niveau d'équilibre à long terme : la "valeur fondamentale" du pétrole, le coût marginal de production. C'est l'attracteur du processus — là où il revient toujours.</Step>
        <Step num={2} accent={ACCENT}>(X₀ − θ) — l'écart initial par rapport à l'équilibre : si X₀ {'>'} θ (prix trop élevé), cet écart est positif ; si X₀ {'<'} θ (prix trop bas), il est négatif. C'est la "déviation" actuelle par rapport au fondamental.</Step>
        <Step num={3} accent={ACCENT}>e^(−κt) — le facteur de décroissance exponentielle : la fraction de l'écart qui reste après t. À t=0 : e⁰=1 (tout l'écart est là). À t=t₁/₂=ln(2)/κ : e^(-κt)=½ (la moitié a disparu). À t→∞ : e^(-κt)→0 (tout l'écart a disparu).</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.8 }}>
          Synthèse : E[X(t)] = [équilibre LT] + [déviation initiale] × [facteur de décroissance]. Cas limites : si t→∞, E[X(∞)]=θ (convergence vers l'équilibre). Si κ=0 (GBM), e^0=1 → X reste indéfiniment à X₀ (pas d'ancrage).
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
        <strong style={{ color: ACCENT }}>Modèle de Vasicek (1977) — Taux d'intérêt :</strong> dr = κ(θ - r)dt + σ dW.
        Le taux court r revient vers sa moyenne à long terme θ. Avantage : solution analytique pour les prix d'obligations.
        Limite : r peut devenir négatif (ce qui s'est révélé... réel, avec les taux négatifs post-2008 !).
      </div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
        <strong style={{ color: ACCENT }}>Modèle de Schwartz (1997) — Commodités :</strong> dS = κ(θ - ln S)S dt + σS dW.
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
        t₁/₂ = ln(2) / κ — temps pour réduire l'écart à la moyenne de moitié
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
        <Step num={1} accent={ACCENT}>Demi-vie : t₁/₂ = ln(2)/κ = ln(2)/3.5 = 0.693/3.5 = 0.198 an = 72 jours</Step>
        <Step num={2} accent={ACCENT}>Interprétation : en 72 jours, l'écart initial (6 - 4 = 2$/MMBtu) sera réduit de moitié → E[X(72j)] = 5 $/MMBtu</Step>
        <Step num={3} accent={ACCENT}>E[X(0.5)] = 4 + (6 - 4) × e^(-3.5 × 0.5) = 4 + 2 × e^(-1.75) = 4 + 2 × 0.1738 = 4.35 $/MMBtu</Step>
        <Step num={4} accent={ACCENT}>Var[X(∞)] = σ²/(2κ). Si σ = 1.2 $/MMBtu/an^(1/2) : Var[X(∞)] = 1.44/(2×3.5) = 0.206 → σ(X∞) = 0.45 $/MMBtu</Step>
        <FormulaBox accent={ACCENT}>Demi-vie = 72 jours, E[X(6 mois)] = 4.35 $/MMBtu, σ_stationnaire = 0.45 $/MMBtu</FormulaBox>
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
function ItoTab() {
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
        En calcul ordinaire : si y = f(x) et x change, alors dy = f'(x) dx.
        En calcul stochastique, une correction apparaît à cause de la non-dérivabilité du brownien.
        dW² = dt (et non 0 comme dans le calcul classique). Le lemme d'Itô corrige cette subtilité
        avec un terme supplémentaire en σ² — c'est la <strong>correction d'Itô</strong>.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Calcul classique vs Calcul d'Itô : tableau comparatif</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Règle de la chaîne', classic: 'df = f\'(x) dx', ito: 'df = f\'(X)dX + ½f\'\'(X)dX²', c: ACCENT },
          { label: 'dx²', classic: '(dx)² ≈ 0 (ordre dt²)', ito: '(dW)² = dt (ordre dt !)', c: T.a5 },
          { label: 'dx × dt', classic: '= 0', ito: 'dW × dt = 0', c: T.a4 },
          { label: 'Terme Itô', classic: 'Absent', ito: '+ ½σ²∂²f/∂X² dt', c: ACCENT },
          { label: 'Exemple : f = X²', classic: 'df = 2X dX', ito: 'df = 2X dX + dX² = 2X dX + σ²dt', c: T.a5 },
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
        Si dX = µ(X,t)dt + σ(X,t)dW et f = f(X,t), alors :

        df = [∂f/∂t + µ·∂f/∂X + (1/2)σ²·∂²f/∂X²]dt + σ·∂f/∂X·dW
      </FormulaBox>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie du Lemme d'Itô — chaque terme expliqué</div>
        <Step num={1} accent={ACCENT}>∂f/∂t · dt — dérive pure du temps : même si X ne bouge pas (dW=0), f change avec le temps. Exemple : le Theta d'une option — la valeur temps s'érode chaque instant même si S est immobile.</Step>
        <Step num={2} accent={ACCENT}>µ · ∂f/∂X · dt — effet du drift déterministe : comment le drift de X se propage à f via la pente ∂f/∂X. Si f est une option call et S tend à monter (µ{'>'} 0), f monte aussi, à vitesse µ × Delta.</Step>
        <Step num={3} accent={ACCENT}>½σ² · ∂²f/∂X² · dt — LE TERME CLÉ D'ITÔ — la correction de convexité. Si f est convexe (f''{'>'} 0), le bruit crée un gain net positif (inégalité de Jensen). C'est exactement le terme Gamma dans la PDE de Black-Scholes. Sans ce terme, l'arbitrage serait possible.</Step>
        <Step num={4} accent={ACCENT}>σ · ∂f/∂X · dW — la partie aléatoire : le bruit de X (amplitude σ) amplifié par la pente de f (le Delta). C'est la source de risque résiduelle — le seul terme stochastique.</Step>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 10 }}>
          Structure : df = [dérive temporelle + dérive de X + correction de convexité] dt + [bruit amplifié par la pente] dW
        </div>
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '0 0 16px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Point clé — Jensen dans le temps continu :</strong> La correction ½σ²f'' est la manifestation mathématique de l'inégalité de Jensen dans le temps continu. E[f(X)] {'>'} f(E[X]) si f est convexe → le bruit génère un gain net quand on est convexe (long Gamma). C'est pourquoi un acheteur d'option est long Gamma : il profite de la convexité, mais en paie le prix via Theta.
      </div>

      <SectionTitle accent={ACCENT}>Application 1 : GBM → solution explicite</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 8 }}>
        On pose f(S) = ln(S). On veut trouver df si dS = µS dt + σS dW.
      </div>

      <Step num={1} accent={ACCENT}>∂f/∂S = 1/S, ∂²f/∂S² = -1/S², ∂f/∂t = 0</Step>
      <Step num={2} accent={ACCENT}>df = [0 + µS × (1/S) + (1/2)σ²S² × (-1/S²)]dt + σS × (1/S) dW</Step>
      <Step num={3} accent={ACCENT}>df = [µ - σ²/2]dt + σ dW</Step>
      <Step num={4} accent={ACCENT}>Intégration : ln(S_T/S₀) = (µ - σ²/2)T + σW(T)</Step>

      <FormulaBox accent={ACCENT} label="Solution exacte du GBM">
        S_T = S₀ × exp[(µ - σ²/2)T + σ√T × Z]   Z ~ N(0,1)
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Pourquoi le terme σ²/2 apparaît-il ? — Développement de Taylor stochastique</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        En calcul classique, le développement de Taylor de df s'arrête à l'ordre 1 car dx² ≈ (dt)² → 0.
        En calcul stochastique, le terme dx² = σ²dW² = σ²dt ne peut pas être négligé — c'est un terme d'ordre dt.
      </div>
      <Step num={1} accent={ACCENT}>Taylor stochastique : df ≈ ∂f/∂t dt + ∂f/∂X dX + ½ ∂²f/∂X² (dX)² + ...</Step>
      <Step num={2} accent={ACCENT}>(dX)² = (µdt + σdW)² = µ²(dt)² + 2µσ dt·dW + σ²(dW)² ≈ σ²dt</Step>
      <Step num={3} accent={ACCENT}>Car : (dt)² → 0, dt·dW → 0, et (dW)² = dt (variation quadratique !)</Step>
      <Step num={4} accent={ACCENT}>Résultat : df = [∂f/∂t + µ∂f/∂X + ½σ²∂²f/∂X²]dt + σ∂f/∂X dW</Step>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Point clé :</strong> Le terme σ²/2 vient du terme quadratique de Taylor (½ × ∂²f/∂X² × σ²dt)
        qui normalement disparaît en calcul classique mais <em>survit</em> en calcul stochastique car dW² = dt.
        C'est la convexité de f qui crée ce terme — c'est l'inégalité de Jensen rendue explicite.
        Pour f(S) = ln(S) : f''(S) = -1/S² {'<'} 0 → la correction est négative → -σ²/2.
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 8 }}>Pourquoi (µ - σ²/2) et pas µ ?</div>
        <div style={{ color: T.text, fontSize: 13, lineHeight: 1.7 }}>
          E[S_T] = S₀ × e^(µT) → le drift espéré est µ. ✓<br />
          Mais la moyenne géométrique ≠ moyenne arithmétique.<br />
          La correction -σ²/2 vient de la convexité de l'exponentielle (inégalité de Jensen).<br />
          Sans correction : E[ln(S_T/S₀)] = µT → FAUX.<br />
          Avec correction : E[ln(S_T/S₀)] = (µ - σ²/2)T → VRAI. ✓
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Application 2 : Équation de Black-Scholes et l'argument de réplication</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 8, lineHeight: 1.8 }}>
        En appliquant le lemme d'Itô à C(S,t) où S suit un GBM, on obtient l'EDS de C. L'astuce de Black-Scholes
        est de construire un <strong>portefeuille Δ-neutre</strong> qui élimine toute source de risque.
      </div>
      <Step num={1} accent={ACCENT}>Portefeuille : Π = C - Δ × S (acheter le call, vendre Δ actions)</Step>
      <Step num={2} accent={ACCENT}>Appliquer Itô à C(S,t) : dC = [∂C/∂t + µS∂C/∂S + ½σ²S²∂²C/∂S²]dt + σS∂C/∂S dW</Step>
      <Step num={3} accent={ACCENT}>dΠ = dC - Δ dS = [∂C/∂t + µS∂C/∂S + ½σ²S²∂²C/∂S² - Δ µS]dt + [σS∂C/∂S - Δ σS]dW</Step>
      <Step num={4} accent={ACCENT}>Choisir Δ = ∂C/∂S → le terme en dW s'annule exactement ! Le portefeuille devient sans risque.</Step>
      <Step num={5} accent={ACCENT}>Sans risque → dΠ = rΠ dt (taux sans risque) → r(C - Δ S)dt = [∂C/∂t + ½σ²S²∂²C/∂S²]dt</Step>
      <FormulaBox accent={ACCENT} label="PDE de Black-Scholes">
        ∂C/∂t + rS·∂C/∂S + (1/2)σ²S²·∂²C/∂S² - rC = 0
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>L'argument de réplication :</strong> En choisissant Δ = ∂C/∂S (le Delta de l'option), on élimine le terme stochastique dW.
        Le portefeuille résultant est <em>instantanément sans risque</em> → il doit rapporter exactement r (sinon arbitrage).
        Cette contrainte donne la PDE de B-S. Les termes ont une interprétation directe :<br />
        • ∂C/∂t = Theta (dégradation temporelle)<br />
        • rS∂C/∂S = drift risque-neutre (Delta × taux)<br />
        • ½σ²S²∂²C/∂S² = terme de convexité (Gamma)<br />
        • -rC = actualisation de la valeur du call
      </div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
        Cette EDP a pour solution la formule de Black-Scholes que nous verrons au Module 4.
        Le prix B-S est la <strong>seule fonction</strong> C(S,t) qui satisfait cette PDE avec la condition terminale C(S,T) = max(S-K, 0).
      </div>

      <Accordion title="Exercice — Lemme d'Itô appliqué à f(S) = S²" accent={ACCENT} badge="Entraînement">
        <p style={{ color: T.text }}>Si dS = µS dt + σS dW, trouvez df où f(S) = S²</p>
        <Step num={1} accent={ACCENT}>∂f/∂S = 2S, ∂²f/∂S² = 2, ∂f/∂t = 0</Step>
        <Step num={2} accent={ACCENT}>df = [0 + µS × 2S + (1/2)σ²S² × 2]dt + σS × 2S dW</Step>
        <Step num={3} accent={ACCENT}>df = [2µS² + σ²S²]dt + 2σS² dW</Step>
        <FormulaBox accent={ACCENT}>df = S²(2µ + σ²)dt + 2σS² dW</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12 }}>Le terme σ² supplémentaire vient de la correction d'Itô (dW² = dt).</div>
      </Accordion>

      <Accordion title="Exercice — Lemme d'Itô appliqué à f(S) = √S" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Si dS = µS dt + σS dW (GBM), trouvez l'EDS de Y = √S = S^(1/2).</p>
        <Step num={1} accent={ACCENT}>f(S) = S^(1/2) → f'(S) = (1/2)S^(-1/2), f''(S) = -(1/4)S^(-3/2)</Step>
        <Step num={2} accent={ACCENT}>Lemme d'Itô : dY = [(1/2)S^(-1/2) × µS + (1/2)σ²S² × (-1/4)S^(-3/2)]dt + (1/2)S^(-1/2) × σS dW</Step>
        <Step num={3} accent={ACCENT}>= [(µ/2)S^(1/2) - (σ²/8)S^(1/2)]dt + (σ/2)S^(1/2) dW</Step>
        <Step num={4} accent={ACCENT}>= Y[(µ - σ²/8)/2 × 2]dt + (σ/2)Y dW   (en substituant Y = S^(1/2))</Step>
        <FormulaBox accent={ACCENT}>dY = Y(µ/2 - σ²/8)dt + (σ/2)Y dW — Y suit aussi un GBM, avec drift µ/2 - σ²/8 et vol σ/2</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12 }}>Application : si S est un prix d'action, Y = √S suit aussi un GBM (réduction de drift et vol par 2).</div>
      </Accordion>

      <Accordion title="Exercice — Processus OU via le lemme d'Itô" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text }}>Montrez que la solution du processus OU dX = κ(θ - X)dt + σdW est X(t) = X₀e^(-κt) + θ(1-e^(-κt)) + σ∫₀ᵗ e^(-κ(t-s))dW(s).</p>
        <Step num={1} accent={ACCENT}>Posons Z(t) = X(t)e^(κt) (changement de variable). Cherchons dZ.</Step>
        <Step num={2} accent={ACCENT}>Lemme d'Itô sur f(X,t) = X × e^(κt) : ∂f/∂t = κXe^(κt), ∂f/∂X = e^(κt), ∂²f/∂X² = 0</Step>
        <Step num={3} accent={ACCENT}>dZ = κXe^(κt)dt + e^(κt)dX = κXe^(κt)dt + e^(κt)[κ(θ-X)dt + σdW]</Step>
        <Step num={4} accent={ACCENT}>= e^(κt)[κXdt + κθdt - κXdt + σdW] = κθe^(κt)dt + σe^(κt)dW</Step>
        <Step num={5} accent={ACCENT}>Intégration : Z(t) - Z(0) = κθ∫₀ᵗ e^(κs)ds + σ∫₀ᵗ e^(κs)dW(s)</Step>
        <Step num={6} accent={ACCENT}>= θ(e^(κt) - 1) + σ∫₀ᵗ e^(κs)dW(s)</Step>
        <FormulaBox accent={ACCENT}>X(t) = Z(t)e^(-κt) = X₀e^(-κt) + θ(1-e^(-κt)) + σ∫₀ᵗ e^(-κ(t-s))dW(s) ✓</FormulaBox>
      </Accordion>
    </div>
  )
}

// ─── Tab: Simulation (2 actifs corrélés) ────────────────────────────────────
function SimulTab() {
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
        Pour simuler un portefeuille pétrole + gaz avec corrélation ρ :
        On génère Z₁, Z₂ ~ N(0,1) indépendants, puis on "corèle" avec Cholesky :
        W₁ = Z₁ et W₂ = ρ·Z₁ + √(1-ρ²)·Z₂.
        Cela garantit Cor(W₁, W₂) = ρ tout en préservant la marginalité normale de chaque actif.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Cholesky — 2 actifs corrélés">
        W₁ = Z₁
        W₂ = ρ·Z₁ + √(1-ρ²)·Z₂   où Z₁, Z₂ ~ N(0,1) iid

        Alors : Cov(W₁, W₂) = E[W₁·W₂] = ρ × Var(Z₁) = ρ ✓
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
        Erreur standard = σ_payoff / √N
        Intervalle de confiance 95% : Prix_MC ± 1.96 × σ_payoff / √N
        Doubler la précision → multiplier N par 4 (coût quadratique !)
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Techniques de réduction de variance — indispensables en pratique :</strong>
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>1. Variables antithétiques :</strong> Pour chaque Z ~ N(0,1) utilisé, ajouter aussi -Z.
            On simule N/2 paires (Z, -Z) au lieu de N variables indépendantes.
            Cela exploite la symétrie de la loi normale. Réduction typique de variance : 30-70%.
            Formule : C_MC = ½[payoff(Z) + payoff(-Z)] pour chaque paire.
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>2. Variables de contrôle :</strong> On utilise un actif dont on connaît le vrai prix (ex: le call B-S)
            pour corriger l'estimateur MC. Si payoff_BS_MC ≠ prix_BS_vrai, on ajuste proportionnellement.
            C_ajusté = C_MC + b × (prix_BS_vrai - payoff_BS_MC). Réduction typique : 80-95% de variance.
          </div>
          <div>
            <strong>3. Stratification :</strong> Diviser l'espace [0,1] en N tranches égales et tirer exactement
            un point dans chaque tranche (au lieu de tirer N points iid). Garantit une meilleure couverture
            de l'espace des scénarios.
          </div>
        </div>
      </div>

      <Accordion title="Exercice — Nombre de simulations nécessaires" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Un call vaut 5€ avec σ_payoff ≈ 20€. Combien de simulations pour une précision de ±0.10€ (95%) ? De ±0.01€ ?</p>
        <Step num={1} accent={ACCENT}>Formule : N = (1.96 × σ_payoff / ε)² où ε est la demi-largeur souhaitée</Step>
        <Step num={2} accent={ACCENT}>Pour ε = 0.10€ : N = (1.96 × 20 / 0.10)² = (392)² = 153 664 simulations</Step>
        <Step num={3} accent={ACCENT}>Pour ε = 0.01€ : N = (1.96 × 20 / 0.01)² = (3920)² = 15 366 400 simulations (~15M !)</Step>
        <Step num={4} accent={ACCENT}>Avec variables antithétiques (variance réduite de 50%) : N divisé par 2 → gain de CPU ×2</Step>
        <FormulaBox accent={ACCENT}>N_nécessaire = (1.96 × σ / ε)² — multiplier précision par 10 → multiplier N par 100</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>En pratique : 10 000 sims pour une estimation rapide, 1M pour publication, 10M pour pricing de salle de marchés.</div>
      </Accordion>

      <ExampleBlock title="Cas concret : portefeuille énergie à 1 an" accent={ACCENT}>
        <p>100M$ en WTI (σ=30%) + 50M$ en Gaz Nat (σ=25%), ρ=0.5</p>
        <Step num={1} accent={ACCENT}>w₁=2/3, w₂=1/3 (en poids du portefeuille total 150M$)</Step>
        <Step num={2} accent={ACCENT}>Cov = 0.5 × 0.30 × 0.25 = 0.0375</Step>
        <Step num={3} accent={ACCENT}>σ²_p = (2/3)² × 0.09 + 2×(2/3)×(1/3)×0.0375 + (1/3)² × 0.0625</Step>
        <Step num={4} accent={ACCENT}>= 0.04 + 0.01667 + 0.006944 = 0.063611</Step>
        <Step num={5} accent={ACCENT}>σ_p = 25.2% → VaR 95% (1 an) = 1.645 × 0.252 × 150M$ = 62.1M$</Step>
      </ExampleBlock>
    </div>
  )
}

// ─── Tab: Processus à Saut ────────────────────────────────────────────────────
function JumpTab() {
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
        P(N(t) = k) = e^(-λt) × (λt)^k / k!
        E[N(t)] = λt     Var[N(t)] = λt
        Temps inter-arrivées : τ ~ Exp(λ),  E[τ] = 1/λ
      </FormulaBox>
      <SymbolLegend accent={ACCENT} symbols={[
        ['λ', "Intensité : nombre moyen de sauts par an (ex: λ=5 → 1 saut tous les 73j)"],
        ['N(t)', "Processus de comptage — ne peut qu'augmenter, trajectoires en escalier"],
        ['dN', 'Vaut 1 avec probabilité λdt, 0 sinon (quand dt petit)'],
        ['τ ~ Exp(λ)', 'Temps entre sauts : P(τ > t) = e^(-λt), mémoryfree'],
      ]} />

      <SectionTitle accent={ACCENT}>2. Merton Jump Diffusion (1976) — Actifs financiers</SectionTitle>
      <FormulaBox accent={ACCENT} label="EDS — Merton">
        dS/S = (µ - λk̄) dt + σ dW + (e^Y - 1) dN
        Y ~ N(µ_J, σ_J²),    k̄ = e^(µ_J + σ_J²/2) - 1  (correction drift)
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>
        La correction <strong>-λk̄</strong> garantit E[S(t)] = S₀e^(µt) malgré les sauts.
        µ_J {'<'} 0 : sauts baissiers dominants (choc négatif type crash).
        µ_J = 0 : sauts symétriques (perturbations neutres en espérance).
      </div>

      <SectionTitle accent={ACCENT}>3. MRJD — Mean-Reverting Jump Diffusion (cours DPH3V)</SectionTitle>
      <FormulaBox accent={ACCENT} label="MRJD — Modèle énergie explicitement au programme">
        dX = κ(θ - X)dt + σX dW + X(e^Y - 1) dN
        Y ~ N(µ_J, σ_J²)
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
        <p>Gaz naturel : θ=3$/MMBtu, κ=4, σ=35%, λ=6 sauts/an, µ_J=0%, σ_J=25%</p>
        <Step num={1} accent={ACCENT}>P(≥1 saut par trimestre) = 1 - e^(-6×0.25) = 1 - e^(-1.5) = 77.7%</Step>
        <Step num={2} accent={ACCENT}>Saut haussier typique (+1σ_J) : e^(0.25) - 1 = +28% sur le prix courant</Step>
        <Step num={3} accent={ACCENT}>Demi-vie mean-reversion : ln(2)/4 = 63 jours → retour vers θ après ~2 mois</Step>
        <Step num={4} accent={ACCENT}>Vol totale ≈ √(σ² + λ(µ_J² + σ_J²)) = √(0.1225 + 6×0.0625) = √0.4975 ≈ 71% (vs 35% sans sauts !)</Step>
      </ExampleBlock>

      <Accordion title="Exercice — Probabilité de saut (Poisson)" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}>Le pétrole subit λ=4 sauts/an. Quelle est la probabilité d'avoir ≥2 sauts en 6 mois ?</p>
        <Step num={1} accent={ACCENT}>t = 0.5 an → λt = 4 × 0.5 = 2</Step>
        <Step num={2} accent={ACCENT}>P(N≥2) = 1 - P(N=0) - P(N=1) = 1 - e^(-2) - 2e^(-2) = 1 - 3e^(-2)</Step>
        <FormulaBox accent={ACCENT}>= 1 - 3 × 0.1353 = 59.4%</FormulaBox>
      </Accordion>
      <Accordion title="Exercice — Vol totale MRJD" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>σ=20%, λ=8, µ_J=0, σ_J=15%. Calculez la volatilité totale effective.</p>
        <Step num={1} accent={ACCENT}>Variance diffusion : σ² = 0.04</Step>
        <Step num={2} accent={ACCENT}>Variance sauts : λ×(µ_J² + σ_J²) = 8×(0 + 0.0225) = 0.18</Step>
        <Step num={3} accent={ACCENT}>Variance totale = 0.04 + 0.18 = 0.22</Step>
        <FormulaBox accent={ACCENT}>σ_totale ≈ √0.22 = 46.9%  (vs 20% sans sauts — les sauts ×2.3 la vol !)</FormulaBox>
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
