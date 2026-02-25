import React, { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { T } from '../../../design/tokens'
import {
  FormulaBox, IntuitionBlock,
  Slider, Accordion, Step, SectionTitle, InfoChip, Grid, ChartWrapper,
  Demonstration, DemoStep, K, SymbolLegend,
} from '../../../design/components'

const ACCENT = T.a8

function gaussRand() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const STRATEGIES = [
  {
    num: 1, title: 'Fenêtrage horaire ciblé',
    design: 'Active uniquement sur 07–10h et 17–20h (jours ouvrés, hors fériés).',
    avantages: 'Valeur concentrée là où charge↑ et prix↑ → meilleur €/MWh de risque réduit. Réduit la prime totale en excluant les heures creuses.',
    attention: 'Calibrer sur l\'indice réel subi (DA vs ID vs imbalance) pour limiter le basis-risk.',
  },
  {
    num: 2, title: 'Gating par déviation de charge',
    design: 'Exercer uniquement si |Δ_t| ≥ Δ_min (ex. 10 MWh/h) ET du bon signe (call si Δ>0, put si Δ<0).',
    avantages: 'Évite de consommer V_tot pendant les séquences midi/week-end à faible charge et prix bas (voire négatifs).',
    attention: 'Calibrer Δ_min via backtest sur historique (quantile 70–80 % des écarts horaires en fenêtre).',
  },
  {
    num: 3, title: 'Floating strike — Collar (K±δ)',
    design: 'Payoff basé sur (S_t − K). Achat à K+δ, vente à K−δ. Ex. collar : K±3 €/MWh.',
    avantages: 'Supprime le mismatch quand K est une moyenne mensuelle vs coût intraday réel. Colle à (K − S_t)·Δ_t.',
    attention: 'Définir δ = ±2–5 €/MWh pour réduire la prime sans trop réduire les activations.',
  },
  {
    num: 4, title: 'Asymétrie volumes (V_buy ≠ V_sell)',
    design: 'V_buy_max ≠ V_sell_max selon la queue dominante du portefeuille (ex. surpondérer le call si profil froid).',
    avantages: 'La prime reflète la distribution réelle des écarts → efficience accrue. Évite de payer pour une symétrie inutile.',
    attention: 'Vérifier que l\'asymétrie ne crée pas de take-or-pay handicapant hors saison.',
  },
  {
    num: 5, title: 'Réserve de volume & stop-loss',
    design: 'Réserver x% de V_tot pour jours extrêmes. Plafond d\'utilisation par jour pour éviter d\'épuiser l\'option prématurément.',
    avantages: 'Disponibilité maximale quand ES/CVaR est le pire (pointe froide). Protège contre le sur-exercice en période ordinaire.',
    attention: 'Règles claires d\'allocation et d\'escalade (desk / risk). Documenter les seuils de déclenchement.',
  },
  {
    num: 6, title: 'Indexation sur l\'indice réel (ID/Imbalance)',
    design: 'Régler le swing sur Intraday ou Imbalance horaire plutôt que sur le Day-Ahead.',
    avantages: 'Réduit le basis (DA vs coût réel). Pertinent avec forte RES où le DA diverge de l\'ID/imbalance.',
    attention: 'Prime souvent plus élevée (vol ID > vol DA). Compenser par fenêtrage & gating stricts.',
  },
  {
    num: 7, title: 'Layering : swing + cap(s) de pointe',
    design: 'Swing couvre les écarts fréquents dans la bande. Caps DA/ID couvrent au-delà de V_max sur les mêmes fenêtres.',
    avantages: 'Tail risk maîtrisé quand |Δ| et S spikent simultanément. Structure complète sans surcoût de prime.',
    attention: 'Séparer clairement les fenêtres d\'activation pour éviter les doublons de couverture.',
  },
  {
    num: 8, title: 'Fenêtres dynamiques météo',
    design: 'Activer des fenêtres étendues si HDD (ou température < seuil thermique), sinon rester sur le cœur de pointe.',
    avantages: 'Met la capacité là où la thermosensibilité est avérée. Optimise l\'utilisation de V_tot selon les conditions réelles.',
    attention: 'Gouvernance + déclaration nécessaires pour éviter la complexité opérationnelle excessive.',
  },
  {
    num: 9, title: 'Swing supply physique (bandes min/max)',
    design: 'Approvisionnement physique avec bandes d\'offtake → limiter le sur-achat lors de baisse de charge, fournir en hausse.',
    avantages: 'Évite le déclencheur prix pur → réduit les zones mortes midi/week-end. Pertinent avec abondance bas-carbone.',
    attention: 'Négociation commerciale complexe. Index de règlement & pénalités à définir précisément.',
  },
  {
    num: 10, title: 'Compléments non-optionnels',
    design: 'Shape swaps (baseload ↔ peak). Options météo (HDD/CDD). CfD sur spread (S−K) pour couverture structurelle.',
    avantages: 'Shape swaps alignent le profil. Options météo hedgent le volume pur quand corrélation charge–prix se dégrade (forte RES).',
    attention: 'Chaque instrument a sa propre courbe de prime. Surveiller les risques de base et les interdépendances.',
  },
]

function runSwingMC({ vMax, vTot, deltaMin, collar, reservePct, kappa, theta, sigma }) {
  const N = 200
  const HOURS = 720
  const dt = 1 / 8760
  const vTotActive = vTot * (1 - reservePct / 100)

  const allPayoffs = []
  const paths = [[], [], []]

  for (let sim = 0; sim < N; sim++) {
    let S = theta + (Math.random() - 0.5) * 5
    let usedVolume = 0
    let totalPayoff = 0

    for (let h = 0; h < HOURS; h++) {
      S = S + kappa * (theta - S) * dt + sigma * S * Math.sqrt(dt) * gaussRand()
      S = Math.max(S, 0.1)

      if (sim < 3) paths[sim].push(S)

      const hourOfDay = h % 24
      const dayOfWeek = Math.floor(h / 24) % 7
      const inWin = ((hourOfDay >= 7 && hourOfDay < 10) || (hourOfDay >= 17 && hourOfDay < 20)) && dayOfWeek < 5
      const deviation = Math.abs(S - theta) / theta * 60

      if (inWin && deviation >= deltaMin && usedVolume < vTotActive) {
        const vol = Math.min(vMax, vTotActive - usedVolume)
        totalPayoff += Math.max(S - (theta + collar), 0) * vol
        usedVolume += vol
      }
    }
    allPayoffs.push(totalPayoff)
  }

  const priceChartData = []
  for (let h = 0; h < HOURS; h += 4) {
    priceChartData.push({
      h,
      s0: +paths[0][h].toFixed(1),
      s1: +paths[1][h].toFixed(1),
      s2: +paths[2][h].toFixed(1),
    })
  }

  const meanPayoff = allPayoffs.reduce((a, b) => a + b, 0) / N
  const activationRate = allPayoffs.filter(p => p > 0).length / N * 100

  const sorted = [...allPayoffs].sort((a, b) => a - b)
  const cutN = Math.max(Math.floor(N * 0.05), 1)
  const cvar95 = sorted.slice(0, cutN).reduce((a, b) => a + b, 0) / cutN

  const minP = sorted[0], maxP = sorted[sorted.length - 1]
  const binW = Math.max((maxP - minP) / 20, 1)
  const bins = Array.from({ length: 20 }, (_, i) => ({
    range: Math.round(minP + i * binW),
    count: 0,
  }))
  allPayoffs.forEach(p => {
    const idx = Math.min(Math.floor((p - minP) / binW), 19)
    bins[idx].count++
  })

  return {
    priceChartData,
    histogram: bins,
    metrics: {
      premium: +meanPayoff.toFixed(0),
      activationRate: +activationRate.toFixed(1),
      cvar95: +Math.abs(cvar95).toFixed(0),
      usefulVolume: +(vTot * (1 - reservePct / 100)).toFixed(0),
    },
  }
}

export function SwingOptionsTab() {
  const [vMax,       setVMax]       = useState(30)
  const [vTot,       setVTot]       = useState(900)
  const [deltaMin,   setDeltaMin]   = useState(10)
  const [collar,     setCollar]     = useState(3)
  const [reservePct, setReservePct] = useState(20)
  const [kappa,      setKappa]      = useState(3)
  const [theta,      setTheta]      = useState(80)
  const [sigma,      setSigma]      = useState(0.4)
  const [simKey,     setSimKey]     = useState(0)

  const { priceChartData, histogram, metrics } = useMemo(() => {
    void simKey
    return runSwingMC({ vMax, vTot, deltaMin, collar, reservePct, kappa, theta, sigma })
  }, [vMax, vTot, deltaMin, collar, reservePct, kappa, theta, sigma, simKey])

  const StratCard = ({ num, title, design, avantages, attention }) => (
    <div style={{
      marginBottom: 12, background: T.panel, border: `1px solid ${ACCENT}22`,
      borderRadius: 8, padding: '12px 14px',
    }}>
      <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
        Stratégie {num} — {title}
      </div>
      <Grid cols={3} gap="8px">
        {[
          { label: '🎯 Design', text: design },
          { label: '✅ Avantages', text: avantages },
          { label: '⚠️ Attention', text: attention },
        ].map(({ label, text }) => (
          <div key={label} style={{ background: T.panel2, borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ color: T.muted, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{label}</div>
            <p style={{ color: T.text, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{text}</p>
          </div>
        ))}
      </Grid>
    </div>
  )

  return (
    <div>

      {/* ── Intuition ─────────────────────────────────────────────────── */}
      <IntuitionBlock emoji="🔄" title="Qu'est-ce qu'un Swing Option Énergie ?" accent={ACCENT}>
        Un <strong style={{ color: ACCENT }}>swing option</strong> donne à son détenteur le
        droit (mais pas l'obligation) d'acheter ou vendre de l'électricité à un prix de
        référence K, avec une <strong style={{ color: ACCENT }}>flexibilité sur les volumes</strong>{' '}
        (0 ≤ V_t ≤ V_max) et les dates d'exercice. Le règlement est indexé sur les prix de
        marché (EPEX Spot, Intraday, ou Imbalance).
        <br /><br />
        Contrairement à une option vanille, le swing s'exerce sur <em>plusieurs heures ou jours</em>,
        sous contrainte de volume cumulé V_tot. C'est l'outil clé pour gérer les écarts de
        consommation d'un fournisseur ou d'un industriel exposé à la volatilité du prix spot.
      </IntuitionBlock>

      {/* ── Section 1: Définition et Payoff ───────────────────────────── */}
      <SectionTitle accent={ACCENT}>1. Définition et Payoff</SectionTitle>

      <FormulaBox accent={ACCENT} label="Payoff d'un Swing Call avec Gating">
        <K display>{"\\text{Payoff} = \\sum_{t \\in W} \\max(S_t - K_t,\\; 0) \\cdot V_t \\cdot \\mathbf{1}_{|\\Delta_t| \\geq \\Delta_{\\min}}"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 1.7 }}>
          <K>{"W"}</K> : heures actives (fenêtres horaires, jours ouvrés){' · '}
          <K>{"K_t = K + \\delta"}</K> : strike flottant à l'achat (collar){' · '}
          <K>{"\\Delta_t"}</K> : écart de charge à l'heure t
        </div>
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Contraintes de volume">
        <K display>{"0 \\leq V_t \\leq V_{\\max} \\quad \\forall t, \\qquad \\sum_{t} V_t \\leq V_{\\text{tot}} - V_{\\text{réserve}}"}</K>
      </FormulaBox>

      <Grid cols={2} gap="12px">
        {[
          {
            icon: '📦', title: 'Flexibilité volumes',
            text: 'Volume exerçable par heure : 0 ≤ V_t ≤ V_max. Volume total mensuel V_tot : contrainte globale contre le sur-exercice. V_réserve est gardé pour les jours extrêmes.',
          },
          {
            icon: '🕐', title: 'Fenêtres d\'activation',
            text: 'Actif uniquement sur 07–10h et 17–20h (jours ouvrés). Ces heures thermo-sensibles concentrent la charge et les prix élevés → meilleur €/MWh de risque réduit.',
          },
          {
            icon: '📊', title: 'Strike flottant (collar)',
            text: 'Payoff basé sur (S_t − K). Buy à K+δ, Sell à K−δ. Supprime le mismatch quand K est une moyenne mensuelle vs le prix intraday réel.',
          },
          {
            icon: '⚖️', title: 'Contraintes contractuelles',
            text: 'Nombre de swings (activations max), take-or-pay (volume minimum obligatoire), réserve pour extrêmes. Ces clauses définissent la structure et la prime du produit.',
          },
        ].map(({ icon, title, text }) => (
          <div key={title} style={{
            background: T.panel2, border: `1px solid ${ACCENT}33`,
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ color: ACCENT, fontWeight: 700, fontSize: 14 }}>{title}</span>
            </div>
            <p style={{ color: T.text, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{text}</p>
          </div>
        ))}
      </Grid>

      <SymbolLegend accent={ACCENT} symbols={[
        ['S_t',   'Prix spot horaire (€/MWh) — indice ID FR ou imbalance'],
        ['K',     'Strike de référence (prix long terme, ex. moyenne mensuelle)'],
        ['δ',     'Spread collar (±2–5 €/MWh) — buy à K+δ, sell à K−δ'],
        ['V_max', 'Volume max exercé par heure (MWh/h)'],
        ['V_tot', 'Volume total mensuel disponible (MWh)'],
        ['Δ_t',   'Écart de charge horaire (MWh/h) — déclencheur gating'],
        ['Δ_min', 'Seuil minimum d\'écart pour activer le swing'],
        ['W',     'Ensemble des heures en fenêtre active (07-10h & 17-20h, ouvrés)'],
        ['κ',     'Vitesse de mean-reversion du prix spot (an⁻¹)'],
        ['θ',     'Prix moyen long terme (€/MWh)'],
      ]} />

      {/* ── Section 2: 10 Stratégies ──────────────────────────────────── */}
      <SectionTitle accent={ACCENT}>2. Les 10 Stratégies de Design</SectionTitle>

      <Accordion title="Fenêtrage & Déclenchement (Stratégies 1–3)" accent={ACCENT} badge="Facile">
        {STRATEGIES.slice(0, 3).map(s => <StratCard key={s.num} {...s} />)}
      </Accordion>

      <Accordion title="Gestion de Volume & Structure (Stratégies 4–7)" accent={ACCENT} badge="Moyen">
        {STRATEGIES.slice(3, 7).map(s => <StratCard key={s.num} {...s} />)}
      </Accordion>

      <Accordion title="Optimisation Avancée (Stratégies 8–10)" accent={ACCENT} badge="Difficile">
        {STRATEGIES.slice(7).map(s => <StratCard key={s.num} {...s} />)}
      </Accordion>

      {/* ── Section 3: Valorisation ───────────────────────────────────── */}
      <SectionTitle accent={ACCENT}>3. Valorisation par Monte Carlo</SectionTitle>

      <IntuitionBlock emoji="🎲" title="Pourquoi Monte Carlo ?" accent={ACCENT}>
        Le payoff d'un swing option est <strong style={{ color: ACCENT }}>path-dependent</strong> :
        il dépend de toute la trajectoire des prix S_t, des décisions d'exercice heure par heure,
        et des contraintes cumulées sur V_tot. Ces propriétés rendent les formules analytiques
        inapplicables — la simulation Monte Carlo est la méthode standard en pratique.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Processus de prix — Ornstein-Uhlenbeck (Schwartz 1997)">
        <K display>{"dS_t = \\kappa(\\theta - S_t)\\,dt + \\sigma S_t\\,dW_t"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 1.7 }}>
          <K>{"\\kappa"}</K> : vitesse de retour à la moyenne (2–5 an⁻¹ pour l'électricité){' · '}
          <K>{"\\theta"}</K> : prix d'équilibre long terme{' · '}
          <K>{"\\sigma"}</K> : volatilité (40–80 % pour le spot électricité)
        </div>
      </FormulaBox>

      <div style={{
        background: T.panel2, border: `1px solid ${T.border}`,
        borderRadius: 8, padding: '14px 18px', marginBottom: 24,
      }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
          Algorithme de valorisation (6 étapes)
        </div>
        <Step num={1} accent={ACCENT}>Générer N chemins de prix horaires (processus OU) sur la période (720 h = 1 mois).</Step>
        <Step num={2} accent={ACCENT}>Pour chaque heure t : vérifier la fenêtre horaire (07-10h & 17-20h, jours ouvrés).</Step>
        <Step num={3} accent={ACCENT}>Appliquer le gating : exercer uniquement si |Δ_t| ≥ Δ_min ET volume restant disponible.</Step>
        <Step num={4} accent={ACCENT}>Calculer le payoff horaire : max(S_t − K_t, 0) × V_t. Déduire V_t du budget V_tot_actif.</Step>
        <Step num={5} accent={ACCENT}>Respecter la réserve : V_tot_actif = V_tot × (1 − réserve%). Stopper si épuisé.</Step>
        <Step num={6} accent={ACCENT}>Agréger : prime = moyenne des payoffs ; taux d'activation = % trajets actifs ; CVaR-95% = moyenne des 5 % pires.</Step>
      </div>

      {/* ── Section 4: Simulateur interactif ─────────────────────────── */}
      <SectionTitle accent={ACCENT}>4. Simulateur Interactif</SectionTitle>
      <div style={{
        background: T.panel2, border: `1px solid ${ACCENT}33`,
        borderRadius: 12, padding: '20px 24px', marginBottom: 20,
      }}>
        <p style={{ color: T.muted, fontSize: 12, margin: '0 0 16px 0' }}>
          200 chemins Ornstein-Uhlenbeck · 720 heures (30 jours) · exercice heuristique
          avec gating et collar · θ fixé par le slider « Prix moyen LT »
        </p>
        <Grid cols={2} gap="12px">
          <div>
            <Slider label="V_max — Volume max/heure" value={vMax} min={10} max={50} step={5}
                    onChange={setVMax} accent={ACCENT} format={v => `${v} MWh/h`} />
            <Slider label="V_tot — Volume mensuel total" value={vTot} min={300} max={1500} step={100}
                    onChange={setVTot} accent={ACCENT} format={v => `${v} MWh`} />
            <Slider label="Δ_min — Seuil gating" value={deltaMin} min={5} max={20} step={1}
                    onChange={setDeltaMin} accent={ACCENT} format={v => `${v} MWh/h`} />
            <Slider label="κ — Vitesse mean-reversion" value={kappa} min={0.5} max={8} step={0.5}
                    onChange={setKappa} accent={ACCENT} format={v => `${v} an⁻¹`} />
          </div>
          <div>
            <Slider label="δ — Spread collar (±)" value={collar} min={1} max={8} step={0.5}
                    onChange={setCollar} accent={ACCENT} format={v => `±${v} €/MWh`} />
            <Slider label="Réserve extrêmes" value={reservePct} min={0} max={40} step={5}
                    onChange={setReservePct} accent={ACCENT} format={v => `${v} %`} />
            <Slider label="σ — Volatilité spot" value={sigma} min={0.2} max={0.8} step={0.05}
                    onChange={setSigma} accent={ACCENT} format={v => `${(v * 100).toFixed(0)} %`} />
            <Slider label="θ — Prix moyen LT" value={theta} min={40} max={200} step={5}
                    onChange={setTheta} accent={ACCENT} format={v => `${v} €/MWh`} />
          </div>
        </Grid>

        <Grid cols={4} gap="10px" style={{ marginTop: 16 }}>
          <InfoChip label="Prime estimée" value={`${(metrics.premium / 1000).toFixed(1)} k€`} accent={ACCENT} />
          <InfoChip label="Taux activation" value={`${metrics.activationRate} %`} accent={ACCENT} />
          <InfoChip label="CVaR-95%" value={`${(metrics.cvar95 / 1000).toFixed(1)} k€`} accent={ACCENT} />
          <InfoChip label="Volume utile" value={`${metrics.usefulVolume} MWh`} accent={ACCENT} />
        </Grid>

        <button
          onClick={() => setSimKey(k => k + 1)}
          style={{
            marginTop: 14, background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`,
            color: ACCENT, borderRadius: 6, padding: '8px 18px',
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          ↺ Rejouer la simulation
        </button>
      </div>

      <Grid cols={2} gap="16px">
        <ChartWrapper title={`Prix simulés — 3 scénarios avec collar K±${collar} €/MWh`} height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceChartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="h" tick={{ fill: T.muted, fontSize: 9 }}
                     label={{ value: 'Heure du mois', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -10 }} />
              <YAxis tick={{ fill: T.muted, fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, fontSize: 11 }}
                       formatter={v => [`${v} €/MWh`]} />
              <ReferenceLine y={theta + collar} stroke={T.a4} strokeDasharray="5 3"
                             label={{ value: `K+δ=${theta + collar}`, fill: T.a4, fontSize: 9 }} />
              <ReferenceLine y={theta - collar} stroke={T.a7} strokeDasharray="5 3"
                             label={{ value: `K−δ=${theta - collar}`, fill: T.a7, fontSize: 9 }} />
              <ReferenceLine y={theta} stroke={T.muted} strokeDasharray="3 3"
                             label={{ value: `θ=${theta}`, fill: T.muted, fontSize: 9 }} />
              <Line type="monotone" dataKey="s0" stroke={ACCENT} dot={false} strokeWidth={1.5} name="Scénario 1" />
              <Line type="monotone" dataKey="s1" stroke={T.a5} dot={false} strokeWidth={1.5} name="Scénario 2" />
              <Line type="monotone" dataKey="s2" stroke={T.a7} dot={false} strokeWidth={1.5} name="Scénario 3" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="Distribution des payoffs mensuels (N=200)" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="range" tick={{ fill: T.muted, fontSize: 9 }}
                     label={{ value: 'Payoff (€)', fill: T.muted, fontSize: 10, position: 'insideBottom', offset: -10 }} />
              <YAxis tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Bar dataKey="count" fill={ACCENT} fillOpacity={0.75} name="Nb chemins" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>

      {/* ── Mini-design chiffré ────────────────────────────────────────── */}
      <Accordion title="Mini-design chiffré — Exemple complet" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 14 }}>
          Design d'un swing option pour un fournisseur exposé aux écarts de consommation
          industrielle, indexé sur l'ID FR horaire.
        </p>
        <Grid cols={2} gap="12px">
          <div style={{ background: T.panel, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📋 Paramètres du contrat</div>
            {[
              ['Indice',   'ID FR horaire (où tu paies tes écarts)'],
              ['Fenêtres', '07–10h & 17–20h (jours ouvrés)'],
              ['Strikes',  'Buy = K+3 €/MWh · Sell = K−3 €/MWh'],
              ['V_max',    '30 MWh/h'],
              ['V_tot',    '900 MWh/mois'],
              ['Réserve',  '20% → 180 MWh réservés pour extrêmes'],
              ['Gating',   '|Δ_t| ≥ 10 MWh/h + dans fenêtres actives'],
              ['Layering', 'Cap ID 150 €/MWh au-delà de V_max (mêmes fenêtres)'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 12 }}>
                <span style={{ color: T.muted, minWidth: 80 }}>{k}</span>
                <span style={{ color: T.text }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: T.panel, border: `1px solid ${T.a4}33`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ color: T.a4, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📈 Effets attendus</div>
            {[
              ['Utilisation V_tot',     'Déplacée vers la pointe, peu consommée à midi/week-end'],
              ['CVaR pointe hivernale', 'Réduction > réduction sur moyenne (asymétrie utile)'],
              ['Prime',                 'Contenue via collar ±3 et fenêtrage strict'],
              ['Tail risk',             'Maîtrisé par réserve 20% + cap ID 150 €/MWh'],
              ['Basis risk',            'Minimisé par indexation ID plutôt que DA'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 12 }}>
                <span style={{ color: T.muted, minWidth: 140 }}>{k}</span>
                <span style={{ color: T.text }}>{v}</span>
              </div>
            ))}
          </div>
        </Grid>

        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Volume utile" ruleDetail="V_tot × (1 − réserve)" accent={ACCENT}>
            <K>{"V_{\\text{utile}} = 900 \\times (1 - 0{,}20) = 720 \\text{ MWh/mois}"}</K>
            <p style={{ color: T.muted, fontSize: 12, margin: '6px 0 0' }}>
              180 MWh réservés pour les jours de pointe extrême (vague de froid, vent nul, etc.).
            </p>
          </DemoStep>
          <DemoStep num={2} rule="Heures actives" ruleDetail="fenêtres × jours ouvrés" accent={ACCENT}>
            <K>{"\\text{Heures actives} = (3 + 3) \\times 22 = 132 \\text{ h/mois}"}</K>
            <p style={{ color: T.muted, fontSize: 12, margin: '6px 0 0' }}>
              6 h/jour (07-09h + 17-19h) × 22 jours ouvrés. Avec gating ≥ 10 MWh/h
              (≈ quantile 75 %), activation effective ≈ 30–35 heures.
            </p>
          </DemoStep>
          <DemoStep num={3} rule="Payoff estimé" ruleDetail="exercice dans fenêtres actives" accent={ACCENT}>
            <K>{"\\text{Payoff} \\approx \\overline{\\max(S_t - K - 3,\\,0)} \\times 30 \\times 33 \\approx 5{-}15 \\text{ k€/mois}"}</K>
            <p style={{ color: T.muted, fontSize: 12, margin: '6px 0 0' }}>
              Fourchette indicative selon σ_ID réalisée (40–80 %). Utiliser le simulateur
              ci-dessus pour calibrer les paramètres sur l'historique de prix.
            </p>
          </DemoStep>
        </Demonstration>
      </Accordion>

      {/* ── Exercices ─────────────────────────────────────────────────── */}
      <Accordion title="Exercice — Payoff d'une heure de swing avec collar" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text, fontSize: 13, marginBottom: 12 }}>
          S_t = 95 €/MWh, K = 80 €/MWh, δ = 3 €/MWh, |Δ_t| = 15 MWh/h (Δ_min = 10),
          V_max = 30 MWh/h, V_tot restant = 25 MWh. Calculez le payoff de cette heure.
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Strike flottant" ruleDetail="K_achat = K + δ" accent={ACCENT}>
            <K>{"K_{\\text{achat}} = 80 + 3 = 83 \\text{ €/MWh}"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Gating" ruleDetail="|Δ_t| ≥ Δ_min ?" accent={ACCENT}>
            <K>{"|15| \\geq 10"}</K> → gating validé. Heure supposée en fenêtre active.
          </DemoStep>
          <DemoStep num={3} rule="Volume exercé" ruleDetail="min(V_max, V_restant)" accent={ACCENT}>
            <K>{"V = \\min(30,\\, 25) = 25 \\text{ MWh/h}"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Payoff" ruleDetail="max(S_t − K_t, 0) × V_t" accent={ACCENT}>
            <K>{"\\text{Payoff} = \\max(95 - 83,\\; 0) \\times 25 = 12 \\times 25 = 300 \\text{ €}"}</K>
          </DemoStep>
        </Demonstration>
      </Accordion>

      <Accordion title="Exercice — Calibration du seuil Δ_min par backtest" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, fontSize: 13, marginBottom: 12 }}>
          Vous disposez de 12 mois d'historique des écarts de consommation horaires (8 760 points).
          Comment calibrer Δ_min pour optimiser le ratio payoff / prime du swing option ?
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Filtrer" ruleDetail="Heures en fenêtre" accent={ACCENT}>
            Extraire les |Δ_t| sur les heures en fenêtre (07–10h, 17–20h, jours ouvrés) →
            environ 1 584 points sur 12 mois.
          </DemoStep>
          <DemoStep num={2} rule="Quantile cible" ruleDetail="Q₇₅% des |Δ_t|" accent={ACCENT}>
            <K>{"\\Delta_{\\min} = Q_{75\\%}(|\\Delta_t|_{t \\in W})"}</K>
            <p style={{ color: T.muted, fontSize: 12, margin: '6px 0 0' }}>
              Le quantile 70–80 % assure ≈ 25 % d'heures déclenchantes. Trop bas → V_tot
              épuisé trop vite. Trop haut → peu d'activation, prime gaspillée.
            </p>
          </DemoStep>
          <DemoStep num={3} rule="Backtester" ruleDetail="Δ_min ∈ {5, 8, 10, 12, 15} MWh/h" accent={ACCENT}>
            Simuler l'exercice sur l'historique pour chaque valeur candidate. Maximiser
            le ratio payoff réalisé / prime estimée. Retenir le Δ_min qui améliore le
            CVaR annuel sans réduire le taux d'activation sous 20 %.
          </DemoStep>
        </Demonstration>
      </Accordion>

      <Accordion title="Exercice — Impact de la réserve sur la valeur globale" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text, fontSize: 13, marginBottom: 12 }}>
          V_tot = 900 MWh. Comparer réserve 0 % vs réserve 20 %. Sans réserve :
          prime estimée = 4 200 €. La réserve réduit les activations normales de 15 %,
          mais couvre 3 pics extrêmes à 500 € chacun. Quelle stratégie est optimale ?
        </p>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Sans réserve" ruleDetail="Utilisation totale dès le début" accent={ACCENT}>
            Prime = 4 200 € mais risque d'épuiser V_tot avant les jours extrêmes.
          </DemoStep>
          <DemoStep num={2} rule="Avec réserve 20 %" ruleDetail="V_actif = 720 MWh" accent={ACCENT}>
            <K>{"\\text{Prime activations normales} = 4200 \\times 0{,}85 = 3570 \\text{ €}"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Valeur réserve" ruleDetail="3 pics extrêmes couverts" accent={ACCENT}>
            <K>{"\\text{Gain pics} = 3 \\times 500 = 1500 \\text{ €}"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Comparaison" ruleDetail="Total avec vs sans réserve" accent={ACCENT}>
            <K>{"\\text{Avec réserve} = 3570 + 1500 = 5070 \\text{ €} > 4200 \\text{ €}"}</K>
            <p style={{ color: T.muted, fontSize: 12, margin: '6px 0 0' }}>
              La réserve crée une optionnalité positive (+870 €). Sa valeur optimale dépend
              de la queue de distribution des déviations extrêmes (CVaR). Tester via le simulateur.
            </p>
          </DemoStep>
        </Demonstration>
      </Accordion>

    </div>
  )
}
