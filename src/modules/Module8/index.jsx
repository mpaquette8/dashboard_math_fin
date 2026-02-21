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
} from '../../design/components'

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
function MarchesTab() {
  const [commodity, setCommodity] = useState('crude')

  const commodities = {
    crude: {
      label: 'Pétrole Brut (WTI / Brent)',
      color: ACCENT,
      unit: '$/bbl',
      spot: 82,
      sigma: '30–45%',
      exchanges: ['NYMEX (WTI)', 'ICE (Brent)'],
      drivers: ['OPEC+', 'Inventaires EIA', 'USD', 'Géopolitique'],
      contracts: ['Futures mensuels', 'Swaps OTC', 'Options sur futures'],
    },
    gas: {
      label: 'Gaz Naturel (Henry Hub / TTF)',
      color: T.a3,
      unit: '$/MMBtu',
      spot: 2.8,
      sigma: '50–80%',
      exchanges: ['NYMEX (HH)', 'ICE (TTF)', 'NCG'],
      drivers: ['Météo', 'LNG export', 'Production shale', 'Stockages'],
      contracts: ['Futures mensuels', 'Seasonal swaps', 'Options sur futures'],
    },
    power: {
      label: 'Électricité (ERCOT / EEX)',
      color: T.a5,
      unit: '$/MWh',
      spot: 45,
      sigma: '80–200%',
      exchanges: ['ERCOT', 'PJM', 'EEX', 'EPEX'],
      drivers: ['Load', 'Renewable generation', 'Fuel prices', 'Congestion'],
      contracts: ['Day-ahead', 'Forward peak/base', 'Spark spread options'],
    },
  }

  const com = commodities[commodity]

  const priceHistory = useMemo(() => {
    const pts = []
    let S = com.spot
    const sig = parseFloat(com.sigma.split('–')[0]) / 100 || 0.3
    for (let i = 0; i < 60; i++) {
      S *= Math.exp((0 - 0.5 * sig * sig) / 52 + sig / Math.sqrt(52) * gaussRand())
      pts.push({ week: i + 1, price: +S.toFixed(2) })
    }
    return pts
  }, [commodity])

  const seasonalData = [
    { month: 'Jan', crude: 83, gas: 4.2, power: 65 },
    { month: 'Fev', crude: 81, gas: 3.8, power: 58 },
    { month: 'Mar', crude: 80, gas: 2.9, power: 45 },
    { month: 'Avr', crude: 82, gas: 2.5, power: 38 },
    { month: 'Mai', crude: 83, gas: 2.3, power: 36 },
    { month: 'Jun', crude: 85, gas: 2.8, power: 55 },
    { month: 'Jul', crude: 87, gas: 3.1, power: 72 },
    { month: 'Aoû', crude: 86, gas: 3.0, power: 68 },
    { month: 'Sep', crude: 84, gas: 2.9, power: 48 },
    { month: 'Oct', crude: 82, gas: 3.5, power: 50 },
    { month: 'Nov', crude: 80, gas: 4.0, power: 60 },
    { month: 'Dec', crude: 79, gas: 4.8, power: 72 },
  ]

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Les marchés de l'énergie présentent des <strong style={{ color: ACCENT }}>caractéristiques fondamentalement différentes</strong> des marchés financiers traditionnels (actions, obligations, devises). Ces spécificités impactent directement la modélisation des prix, la valorisation des dérivés, et les stratégies de couverture.
      </div>
      <Grid cols={2} gap="10px" style={{ marginBottom: 14 }}>
        {[
          { icon: '🔋', title: 'Stockage limité ou impossible', color: T.error, text: 'L\'électricité ne peut pas être stockée à grande échelle (sauf via barrages ou batteries). Résultat : tout déséquilibre offre/demande en temps réel se reflète immédiatement dans les prix. Les spikes de prix (plusieurs centaines de $/MWh) peuvent survenir en quelques minutes lors de pics de demande ou de pénurie de capacité.' },
          { icon: '❄️', title: 'Saisonnalité forte et prévisible', color: T.a4, text: 'Le gaz naturel est très demandé en hiver (chauffage). L\'électricité a deux pics : été (climatisation) et hiver (chauffage électrique). Ces patterns saisonniers créent une structure par terme (forward curve) en "escalier" très différente de l\'hypothèse de martingale des marchés financiers.' },
          { icon: '🗺️', title: 'Infrastructure physique et marchés régionaux', color: T.a3, text: 'Les pipelines et les réseaux électriques créent des contraintes de transport physique. Le gaz à Chicago peut avoir un prix très différent du gaz à New York (basis risk). L\'électricité à Londres n\'est pas celle à Munich. Ces différences de prix géographiques génèrent des "basis" qui compliquent la couverture.' },
          { icon: '⚖️', title: 'Réglementation et marchés non libéralisés', color: T.a5, text: 'Contrairement aux marchés financiers, les marchés de l\'énergie restent partiellement réglementés (tarifs régulés, obligations de service universel, marchés de capacité). Les décisions politiques (taxes carbone, subventions renouvelables) peuvent changer les prix radicalement du jour au lendemain.' },
        ].map(s => (
          <div key={s.title} style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{s.icon} {s.title}</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>{s.text}</div>
          </div>
        ))}
      </Grid>

      <IntuitionBlock emoji="⚡" title="L'énergie : des marchés avec des spécificités uniques" accent={ACCENT}>
        Les marchés de l'énergie ont des caractéristiques radicalement différentes des marchés financiers.
        L'électricité ne se stocke pas (presque) → prix ultra-volatils avec des spikes.
        Le gaz est saisonnier (chaud en hiver → demande élevée).
        Le pétrole est global et dominé par l'OPEC+.
        Ces spécificités rendent les modèles financiers standards (GBM) insuffisants :
        on a besoin de <strong>mean-reversion, saisonnalité, et modèles de spikes</strong>.
      </IntuitionBlock>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {Object.entries(commodities).map(([k, v]) => (
          <button key={k} onClick={() => setCommodity(k)} style={{
            background: commodity === k ? `${v.color}22` : T.panel2,
            border: `1px solid ${commodity === k ? v.color : T.border}`,
            color: commodity === k ? v.color : T.muted,
            borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: commodity === k ? 700 : 400,
          }}>{v.label.split('(')[0].trim()}</button>
        ))}
      </div>

      <Grid cols={3} gap="12px">
        <div style={{ background: T.panel2, borderRadius: 8, padding: 16, border: `1px solid ${com.color}33` }}>
          <div style={{ color: com.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Caractéristiques</div>
          <div style={{ color: T.text, fontSize: 13, lineHeight: 1.8 }}>
            <div><span style={{ color: T.muted }}>Unité :</span> {com.unit}</div>
            <div><span style={{ color: T.muted }}>Spot indicatif :</span> <strong style={{ color: com.color }}>{com.spot} {com.unit}</strong></div>
            <div><span style={{ color: T.muted }}>Volatilité typique :</span> {com.sigma}/an</div>
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 16, border: `1px solid ${com.color}33` }}>
          <div style={{ color: com.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Places de marché</div>
          {com.exchanges.map(e => (
            <div key={e} style={{ color: T.text, fontSize: 13, padding: '2px 0' }}>• {e}</div>
          ))}
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 16, border: `1px solid ${com.color}33` }}>
          <div style={{ color: com.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Drivers de prix</div>
          {com.drivers.map(d => (
            <div key={d} style={{ color: T.muted, fontSize: 12, padding: '2px 0' }}>• {d}</div>
          ))}
        </div>
      </Grid>

      <Grid cols={2} gap="12px" style={{ marginTop: 16 }}>
        <ChartWrapper title={`Prix simulé — ${com.label} (60 semaines)`} accent={com.color} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="week" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Line type="monotone" dataKey="price" stroke={com.color} strokeWidth={2} dot={false} name={com.unit} />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="Saisonnalité comparative (prix indicatifs)" accent={ACCENT} height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seasonalData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 9 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Legend wrapperStyle={{ color: T.muted, fontSize: 10 }} />
              <Line type="monotone" dataKey="gas" stroke={T.a3} strokeWidth={2} dot={false} name="Gaz ($/MMBtu×10)" />
              <Line type="monotone" dataKey="power" stroke={T.a5} strokeWidth={2} dot={false} name="Electricité ($/MWh)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Grid>

      <SectionTitle accent={ACCENT}>Structure des marchés énergie</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Les marchés de l'énergie s'organisent en plusieurs segments qui correspondent à différents horizons temporels et niveaux de risque. Un acteur sophistiqué opère sur tous ces segments simultanément.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { title: 'Marché Spot', color: ACCENT, items: ['Livraison immédiate (J+1 ou J+2)', 'Prix fixé aujourd\'hui', 'Risque de prix élevé', 'Day-ahead market (électricité)', 'Balancing market (temps réel)', 'Utilisateurs : producteurs, utilities, traders'] },
          { title: 'Marché Forward / Futures', color: T.a5, items: ['Livraison différée', 'Prix fixé aujourd\'hui pour livraison future', 'Futures = standardisés, échangés en bourse', 'Forward = OTC, sur mesure', 'Liquidité maximale à 1-12 mois', 'Utilisateurs : hedgers, spéculateurs, arbitragistes'] },
          { title: 'Marché Dérivés', color: T.a3, items: ['Options sur futures (Black 76)', 'Swaps de prix (floating vs fixed)', 'Crack spreads (pétrole → produits)', 'Spark spreads (gaz → électricité)', 'Caps/Floors sur prix énergie', 'Utilisateurs : structureurs, risk managers'] },
        ].map(s => (
          <div key={s.title} style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${s.color}33` }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{s.title}</div>
            {s.items.map(item => <div key={item} style={{ color: T.muted, fontSize: 12, padding: '2px 0' }}>• {item}</div>)}
          </div>
        ))}
      </div>

      <SectionTitle accent={ACCENT}>Les 4 grandes commodités énergétiques et leurs spécificités</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Chaque commodité énergétique a ses propres caractéristiques de marché, de volatilité et de saisonnalité. Comprendre ces différences est essentiel pour choisir le bon modèle de pricing et la bonne stratégie de couverture.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
        {[
          {
            name: 'WTI / Brent (Pétrole brut)', color: ACCENT, sigma: 'σ ≈ 25–40%/an',
            items: [
              'Marché mondial, très liquide (millions de barils/jour tradés)',
              'Deux benchmarks : WTI (NYMEX, livraison Cushing OK) et Brent (ICE, mer du Nord)',
              'Drivers : OPEC+, inventaires EIA (hebdomadaires), USD, géopolitique',
              'Spread WTI/Brent (basis géographique) : variable selon logistique et pipeline constraints',
              'Options liquides jusqu\'à 2-3 ans d\'échéance',
            ],
          },
          {
            name: 'Henry Hub (Gaz naturel US)', color: T.a3, sigma: 'σ ≈ 40–80%/an',
            items: [
              'Référence nord-américaine (NYMEX), prix en $/MMBtu',
              'Très saisonnier : hiver (chauffage) crée des pics de demande',
              'Fortement influencé par LNG export, production shale (Marcellus, Permian)',
              'Stockages hebdomadaires EIA : données clés pour la formation des prix',
              'Basis très importants : prix à Chicago, Algonquin, SoCal Gas diffèrent de Henry Hub',
            ],
          },
          {
            name: 'TTF (Gaz naturel Europe)', color: T.a4, sigma: 'σ ≈ 60–150%/an (post-2021)',
            items: [
              'Référence européenne principale depuis ~2019 (remplace NBP UK)',
              'Tradé sur ICE, livraison au Title Transfer Facility (Pays-Bas)',
              'Crise Ukraine 2022 : prix multipliés par 10-15x (pic à 300 €/MWh en août 2022)',
              'Désormais influencé par LNG spot, demande industrielle, météo, stockages UE',
              'TTF futures liquides jusqu\'à 2-3 ans, options plus limitées',
            ],
          },
          {
            name: 'EEX/Phelix (Électricité Europe)', color: T.a5, sigma: 'σ {'>'} 100% spot, 30-60% forward',
            items: [
              'Marchés régionaux : Phelix (Allemagne), Powernext (France), EPEX (Europe)',
              'Non-stockable → spikes de prix extrêmes (pic négatif à -300 €/MWh en 2020 !)',
              'Produits : Day-Ahead (enchères quotidiennes), base vs peak load',
              'Spark spread = électricité - coût gaz pour la produire : indicateur de marge des centrales',
              'Corrélation forte avec prix du gaz (marginal cost pricing dans le merit order)',
            ],
          },
        ].map(c => (
          <div key={c.name} style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${c.color}33` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ color: c.color, fontWeight: 700, fontSize: 13 }}>{c.name}</div>
              <span style={{ background: `${c.color}22`, color: c.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{c.sigma}</span>
            </div>
            {c.items.map(item => <div key={item} style={{ color: T.muted, fontSize: 12, padding: '2px 0', lineHeight: 1.5 }}>• {item}</div>)}
          </div>
        ))}
      </div>

      <IntuitionBlock emoji="📅" title="Calendar spreads — L'ADN de la saisonnalité" accent={ACCENT}>
        Un <strong>calendar spread</strong> est la différence de prix entre deux maturités futures sur la même commodité. Exemple : F(décembre) - F(juillet) sur le gaz naturel.
        C'est un indicateur clé de l'état des stocks et de la structure du marché :<br />
        • <strong>Spread Dec-Jul gaz {'>'} 0</strong> : le marché anticipe une tension hivernale → les traders "long spread" profitent<br />
        • <strong>Spread négatif (backwardation inter-saisons)</strong> : surplus de gaz, stockages pleins → incitation à stocker maintenant et livrer plus tard<br />
        Les calendar spreads permettent de trader la saisonnalité sans prendre de risque de direction sur les prix. Ils sont utilisés par les gestionnaires de stockage de gaz pour optimiser le remplissage des cavernes.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice — Identifier la saisonnalité du gaz naturel" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}>Analysez la courbe forward du gaz Henry Hub : Jan=4.5$/MMBtu, Avr=2.8$, Jul=3.1$, Oct=3.4$, Jan+1=4.8$. Quels patterns observez-vous ?</p>
        <Step num={1} accent={ACCENT}>Pattern "dents de scie" saisonnier : hiver (Jan) {'>'} printemps (Avr) {'<'} été (Jul) {'<'} automne/hiver suivant</Step>
        <Step num={2} accent={ACCENT}>Calendar spread Jan-Avr = 4.5 - 2.8 = 1.7$/MMBtu → prime hivernale élevée</Step>
        <Step num={3} accent={ACCENT}>Cette structure traduit le coût de stockage du gaz de l'été vers l'hiver</Step>
        <Step num={4} accent={ACCENT}>Stratégie : achat futures Avr + vente futures Jan = achat de ce spread à -1.7$ → gagnant si la prime hivernale se réduit</Step>
        <FormulaBox accent={ACCENT}>Implied storage value ≈ Calendar spread Jan-Jul = 4.5 - 3.1 = 1.4$/MMBtu = rémunération du stockage sur 6 mois</FormulaBox>
      </Accordion>
      <Accordion title="Exercice — Calcul d'un basis risk" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Un producteur de gaz au Texas vend au prix Houston Ship Channel (HSC). Il couvre avec des futures Henry Hub (HH). HSC = 2.70$/MMBtu, HH = 2.80$/MMBtu. Il vend 1M MMBtu/mois. Calculez le basis et le P&L si le basis se dégrade.</p>
        <Step num={1} accent={ACCENT}>Basis actuel = HSC - HH = 2.70 - 2.80 = -0.10$/MMBtu (HSC trade à discount)</Step>
        <Step num={2} accent={ACCENT}>Couverture : vente de 1M MMBtu de futures HH à 2.80$ → revenus de couverture = 2.80M$</Step>
        <Step num={3} accent={ACCENT}>Revenus physiques réels = HSC_réalisé × volume = 2.70 × 1M = 2.70M$</Step>
        <Step num={4} accent={ACCENT}>Total = 2.70 (physique) + (2.80 - 2.80) (futures) = 2.70M$ → le basis absorbe 0.10$/MMBtu</Step>
        <Step num={5} accent={ACCENT}>Si le basis se dégrade à -0.30$ (HSC = 2.50$, HH = 2.80$) : revenus = 2.50 + 0 = 2.50M$ → perte de 0.20M$ non couverte</Step>
        <FormulaBox accent={ACCENT}>Basis risk = risque de variation du spread HSC-HH. Pour l'éliminer : couvrir avec des forwards OTC spécifiques à HSC</FormulaBox>
      </Accordion>
    </div>
  )
}

// ─── Tab: Forward Curves ──────────────────────────────────────────────────────
function ForwardCurvesTab() {
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
        En <strong>contango</strong> : F{'>'} S (stocker coûte, les stocks sont abondants).
        En <strong>backwardation</strong> : F{'<'}S (manque de stock, prime pour livraison immédiate).
        La courbe forward est la prévision implicite de marché et l'outil de base du trader énergie.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Théorie du coût de portage (Cost of Carry)">
        F(0,T) = S₀ × e^[(r + u - y) × T]

        F(0,T) = S₀ × e^(r×T) × e^(u×T) × e^(-y×T)
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['S₀', 'Prix spot actuel'],
        ['r', 'Taux d\'intérêt sans risque (coût de financement)'],
        ['u', 'Storage cost : coût de stockage annualisé'],
        ['y', 'Convenience yield : valeur de détention physique'],
        ['r+u-y', 'Si > 0 → Contango ; si < 0 → Backwardation'],
      ]} />

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie du Cost of Carry — F = S·e^((r+u-δ)T)</div>
        <Step num={1} accent={ACCENT}><strong>r</strong> — taux sans risque : coût de financement du stock physique. Détenir 1 000 barils de Brent immobilise du capital qui aurait pu être placé sans risque. Si r = 5%/an et S = 80$/bbl, le coût de financement pour 6 mois est 80 × (e^(0.025) - 1) ≈ 2.03$/bbl.</Step>
        <Step num={2} accent={ACCENT}><strong>u</strong> — coûts de stockage : location de tank, assurance, perte en ligne. Pour le gaz naturel : 2-5%/an de la valeur du contenu. Pour le pétrole brut en onshore : 0.3-0.6$/bbl/mois. Ces coûts poussent la courbe vers le contango.</Step>
        <Step num={3} accent={ACCENT}><strong>-δ</strong> — convenience yield négatif : bénéfice d'avoir le physique (flexibilité opérationnelle, éviter une rupture de stock). Si δ est élevé, le marché valorise fortement le stock physique → backwardation (F {'<'} S).</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : contango = r + u {'>'} δ (offre abondante, peu de valeur marginale du physique) ; backwardation = δ {'>'} r + u (pénurie spot, prime pour livraison immédiate). En 2022, le TTF gaz a affiché une backwardation extrême δ {'>'} 50%/an reflétant la panique sur les stocks européens.
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
            F(T) = S × e^((r + u - δ)T)<br /><br />
            u = coûts de stockage annualisés (location, assurance)<br />
            δ = convenience yield (valeur de détenir le physique)<br /><br />
            <strong style={{ color: T.a5 }}>Contango</strong> si u {'>'} δ (coût de stockage élevé, peu de valeur marginale)<br />
            <strong style={{ color: T.error }}>Backwardation</strong> si δ {'>'} u (pénurie, le physique est précieux)
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a4}33` }}>
          <div style={{ color: T.a4, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Théorie des hedgers (Keynes)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Les <strong>producteurs</strong> vendent massivement des forwards pour se couvrir contre la baisse des prix → pression vendeuse sur les forwards → F(T) {'<'} E[S(T)] (backwardation normale).<br /><br />
            Les <strong>spéculateurs</strong> achètent ces forwards en échange d'une prime de risque → ils gagnent si S(T) {'>'} F(T).<br /><br />
            La prime de risque = E[S(T)] - F(T) = rémunération du risque pris par les spéculateurs.
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a3}33` }}>
          <div style={{ color: T.a3, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Théorie des anticipations</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            F(T) = E^Q[S(T)] sous la mesure risque-neutre Q (no-arbitrage).<br /><br />
            Mais sous la mesure physique P : F(T) = E^P[S(T)] - Prime de risque<br /><br />
            La prime de risque peut être positive (backwardation) ou négative (contango) selon la position nette des hedgers vs spéculateurs.
            En pratique : F(T) ≠ E[S(T)] → les forwards ne sont pas de bons prédicteurs du spot futur.
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
            • δ élevé → F(T) {'<'} S (les futurs sont moins chers que le spot)<br />
            • Signal pour les traders : "le marché paie pour une livraison immédiate"
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.a5}33` }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Faible convenience yield → Contango</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Contexte : stocks abondants, demande faible, surplus de production<br /><br />
            Exemple : pétrole en avril 2020 (COVID, demande effondrée)<br />
            • Le pétrole physique encombrait les stockages → coût de stockage élevé, valeur marginale faible<br />
            • δ très faible, u élevé → F(T) {'>'} S (fort contango, jusqu'à -37$/bbl pour le WTI !)<br />
            • Signal pour les traders : "arbitrage cash-and-carry : acheter spot, stocker, vendre futures"
          </div>
        </div>
      </Grid>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        <strong style={{ color: ACCENT }}>Calcul implicite de la convenience yield :</strong> On l'extrait de la courbe forward observée :
        δ = r + u - (1/T) × ln(F(T)/S₀)
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
            F{'>'} S → Stocker est rentable<br />
            Signal : stocks abondants, demande faible<br />
            Stratégie : acheter spot + stocker + vendre forward = cash-and-carry arbitrage<br />
            Exemple WTI : avril 2020 (COVID)
          </div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.error}33` }}>
          <div style={{ color: T.error, fontWeight: 700, marginBottom: 8 }}>📉 Backwardation</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
            F{'<'} S → Prime pour livraison immédiate<br />
            Signal : stocks faibles, demande forte<br />
            Stratégie : rouler la position short futures génère un gain (roll yield positif)<br />
            Exemple Brent : 2021-2022 (post-COVID)
          </div>
        </div>
      </Grid>

      <ExampleBlock title="Trader pétrole — Arbitrage cash-and-carry" accent={ACCENT}>
        <p>S₀ = 80$/bbl, r = 5%, u = 3%/an, y = 2%/an, T = 6 mois</p>
        <Step num={1} accent={ACCENT}>F théorique = 80 × e^[(0.05 + 0.03 - 0.02) × 0.5] = 80 × e^0.03 = 80 × 1.0305 = 82.44$/bbl</Step>
        <Step num={2} accent={ACCENT}>Si F marché = 85$/bbl {'>'} 82.44 → Contango excessif → arbitrage possible</Step>
        <Step num={3} accent={ACCENT}>Acheter 100 barils à 80$ (emprunt 8000$ à 5%), stocker (coût 3%), vendre forward à 85$</Step>
        <Step num={4} accent={ACCENT}>Profit = 8500 - 8000 × e^(0.08×0.5) = 8500 - 8328 = 172$ = 1.72$/bbl</Step>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice — Calculer le convenience yield implicite" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Brent spot = 85$/bbl, futures 3 mois = 84$/bbl, r = 4.5%/an, coût de stockage u = 2%/an. Calculez la convenience yield implicite.</p>
        <Step num={1} accent={ACCENT}>Formule : δ = r + u - (1/T) × ln(F/S₀)</Step>
        <Step num={2} accent={ACCENT}>T = 3/12 = 0.25 an</Step>
        <Step num={3} accent={ACCENT}>ln(84/85) = ln(0.9882) = -0.01186</Step>
        <Step num={4} accent={ACCENT}>δ = 0.045 + 0.02 - (1/0.25) × (-0.01186) = 0.065 + 0.04744 = 0.1124 = 11.24%/an</Step>
        <FormulaBox accent={ACCENT}>Convenience yield = 11.24%/an {'>'} r + u = 6.5%/an → forte backwardation implicite (marché en tension)</FormulaBox>
        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
          <strong style={{ color: ACCENT }}>Interprétation :</strong> Une convenience yield de 11% signifie que le marché valorise énormément la détention du brut physique. Cela peut indiquer des tensions géopolitiques, une demande de pétrole physique élevée, ou des contraintes logistiques spécifiques. Un gestionnaire de stockage qui détient du Brent physique bénéficie de ce rendement implicite.
        </div>
      </Accordion>
      <Accordion title="Exercice — Stratégie contango vs backwardation" accent={ACCENT} badge="Avancé">
        <p style={{ color: T.text }}>Marché gaz naturel : F(Avr) = 2.5$/MMBtu, F(Oct) = 3.2$/MMBtu, r = 5%, coût stockage = 0.30$/MMBtu pour 6 mois. Analysez et proposez une stratégie.</p>
        <Step num={1} accent={ACCENT}>Calendar spread Oct-Avr = 3.2 - 2.5 = 0.70$/MMBtu sur 6 mois</Step>
        <Step num={2} accent={ACCENT}>Coût de financement sur 6 mois = 2.5 × 0.05 × 0.5 = 0.0625$/MMBtu</Step>
        <Step num={3} accent={ACCENT}>Coût total du stockage = 0.30 + 0.0625 = 0.3625$/MMBtu</Step>
        <Step num={4} accent={ACCENT}>Profit théorique du stockage = 3.2 - 2.5 - 0.3625 = 0.3375$/MMBtu = 33.75 cts/MMBtu</Step>
        <Step num={5} accent={ACCENT}>Stratégie cash-and-carry : acheter gaz au spot (ou F Avr) à 2.5$, stocker 6 mois (coût 0.36$), vendre futures Oct à 3.2$</Step>
        <FormulaBox accent={ACCENT}>Profit de stockage = 0.34$/MMBtu {'>'} 0 → arbitrage de stockage justifié. Mais capacité de stockage limitée → prime s'érodera si trop de traders font la même stratégie</FormulaBox>
      </Accordion>
    </div>
  )
}

// ─── Tab: Options Énergie (Black 76) ─────────────────────────────────────────
function OptionsTab() {
  const [F, setF] = useState(80)
  const [K, setK] = useState(82)
  const [T2, setT2] = useState(0.5)
  const [r, setR] = useState(0.05)
  const [sigma, setSigma] = useState(0.35)

  const callPrice = black76(F, K, T2, r, sigma, 'call')
  const putPrice = black76(F, K, T2, r, sigma, 'put')

  const sqrtT = Math.sqrt(T2)
  const d1 = (Math.log(F / K) + 0.5 * sigma * sigma * T2) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT
  const df = Math.exp(-r * T2)

  const delta_call = df * normCDF(d1)
  const delta_put = df * (normCDF(d1) - 1)
  const gamma = df * phi(d1) / (F * sigma * sqrtT)
  const vega = F * df * phi(d1) * sqrtT / 100
  const theta_call = -(F * df * phi(d1) * sigma / (2 * sqrtT) + r * F * df * normCDF(d1) - r * K * df * normCDF(d2)) / 365

  // Payoff profile at expiry
  const payoffData = useMemo(() => {
    const pts = []
    for (let f = F * 0.5; f <= F * 1.7; f += F * 0.02) {
      pts.push({
        F: +f.toFixed(1),
        callPayoff: +Math.max(f - K, 0).toFixed(2),
        putPayoff: +Math.max(K - f, 0).toFixed(2),
        callPnL: +(Math.max(f - K, 0) - callPrice).toFixed(2),
        putPnL: +(Math.max(K - f, 0) - putPrice).toFixed(2),
      })
    }
    return pts
  }, [F, K, callPrice, putPrice])

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

  const moneyness = K < F ? 'ITM (Call)' : K > F ? 'OTM (Call)' : 'ATM'
  const moneynessColor = K < F ? T.success : K > F ? T.error : T.a5

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
        on remplace S×e^(rT) par F directement — le forward est le sous-jacent.
        C'est le standard industriel pour les options sur pétrole, gaz, électricité.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Black-76 — Options sur futures">
        C = e^(-rT) × [F × N(d₁) - K × N(d₂)]
        P = e^(-rT) × [K × N(-d₂) - F × N(-d₁)]

        d₁ = [ln(F/K) + (σ²/2)×T] / (σ√T)
        d₂ = d₁ - σ√T
      </FormulaBox>

      <SectionTitle accent={ACCENT}>Stratégies de couverture typiques avec des options énergie</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Les options permettent de construire des profils de gain asymétriques — on peut se protéger à la baisse tout en conservant une participation à la hausse, ce que les forwards ne permettent pas.
      </div>
      <Grid cols={3} gap="10px" style={{ marginBottom: 14 }}>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 14, border: `1px solid ${T.error}33` }}>
          <div style={{ color: T.error, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Collar (Tunnel)</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Structure : Long Put K₁ + Short Call K₂ (K₁ {'<'} K₂)<br /><br />
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
            Structure : Long Put K₁ + Short Put K₀ + Short Call K₂ (K₀ {'<'} K₁ {'<'} K₂)<br /><br />
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
        Spark Spread = Prix_élec ($/MWh) - Prix_gaz ($/MMBtu) / Rendement thermique (MMBtu/MWh)

        Exemple : Élec = 45$/MWh, Gaz = 3$/MMBtu, Rendement = 7 MMBtu/MWh
        Spark Spread = 45 - 3/7×... = 45 - 3 × 7 = 45 - 21 = ... Non :
        Spark Spread = 45 - (3 × 7) = 45 - 21 = 24$/MWh (si rendement = MWh/MMBtu = 1/7)
        Spark Spread = Prix_élec - Heat_Rate × Prix_gaz
        = 45 - 7 × 3 = 45 - 21 = 24$/MWh → centrale profitable
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Une <strong>option spark spread</strong> donne à son détenteur le droit de produire de l'électricité si le spark spread dépasse un seuil. C'est l'outil de valorisation des actifs de production flexibles (centrales à gaz, turbines à vapeur).
        Si Spark Spread {'>'} 0 : la centrale produit (elle est "in the money"). Si Spark Spread {'<'} 0 : la centrale s'arrête (coûte moins cher d'acheter l'électricité sur le marché).
        La valorisation d'une centrale à gaz = somme des options spark spread sur toute sa durée de vie.
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie d'un spark spread option</div>
        <Step num={1} accent={ACCENT}><strong>Heat Rate × P_gaz</strong> = coût du combustible pour produire 1 MWh d'électricité. Si Heat Rate = 7 MMBtu/MWh et P_gaz = 3$/MMBtu, le coût variable de production est 7 × 3 = 21$/MWh. Ce terme est le "strike implicite" de l'option.</Step>
        <Step num={2} accent={ACCENT}><strong>P_élec - Heat Rate × P_gaz</strong> = marge brute de la centrale à gaz (spark spread). Si P_élec = 45$/MWh : spark spread = 45 - 21 = 24$/MWh. Ce spread est la "valeur intrinsèque" de la flexibilité de production.</Step>
        <Step num={3} accent={ACCENT}><strong>max(spread - K, 0)</strong> = payoff de l'option sur ce spread, où K est le coût fixe de démarrage. Valorise la flexibilité de démarrage : si K = 0, l'option vaut le spread positif. La volatilité conjointe de P_élec et P_gaz détermine la valeur temps.</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : la centrale à gaz est une option réelle sur le spark spread. Sa valeur totale = somme des options spark spread sur toute sa durée de vie (approche Margrabe). Si spread {'<'} 0 → ne pas démarrer (option out-of-the-money). Les centrales ont une optionalité qui disparaît dans un monde sans flexibilité.
        </div>
      </div>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Crack spread (pétrole) :</strong> Équivalent pour les raffineries = Prix_produits_raffinés - Prix_brut. Exemple : 3-2-1 crack spread = (2 × gasoil + 1 × essence) - 3 × brut. Indicateur de marge de raffinage. Les raffineries couvrent ce spread pour sécuriser leur marge de transformation.
      </div>

      <ExampleBlock title="Producteur pétrolier — Mise en place d'un collar" accent={ACCENT}>
        <p>Producteur WTI : production 1M bbl dans 6 mois, F = 80$/bbl, σ = 35%. Objectif : protéger les revenus en dessous de 70$/bbl, accepter de plafonner à 95$/bbl pour financer la protection.</p>
        <Step num={1} accent={ACCENT}>Besoin : Long Put K₁=70 + Short Call K₂=95 (collar zero-cost si possible)</Step>
        <Step num={2} accent={ACCENT}>Put K=70, F=80, T=0.5, σ=35%, r=5% : Put B76 = e^(-0.025)[70×N(0.58) - 80×N(0.33)] ≈ 2.8$/bbl</Step>
        <Step num={3} accent={ACCENT}>Call K=95, F=80, T=0.5, σ=35%, r=5% : Call B76 = e^(-0.025)[80×N(-0.64) - 95×N(-0.89)] ≈ 2.3$/bbl</Step>
        <Step num={4} accent={ACCENT}>Coût net du collar = Prix put - Prix call = 2.8 - 2.3 = 0.5$/bbl</Step>
        <Step num={5} accent={ACCENT}>Pour zero-cost : ajuster K₂ à 97$/bbl (call légèrement plus OTM → prime plus faible ≈ 2.8$)</Step>
        <Step num={6} accent={ACCENT}>Résultat : plancher de revenus = 70$/bbl × 1M = 70M$, plafond = 97M$, coût = zéro</Step>
        <FormulaBox accent={ACCENT}>Collar zero-cost [70$, 97$] : revenus garantis entre 70M$ et 97M$ quel que soit le prix du WTI</FormulaBox>
      </ExampleBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '12px 0', fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Différence clé vs Black-Scholes :</strong> pas de terme e^(rT) devant F.
        Le futures trade à son prix d'équilibre sans coût de financement dans la formule.
        F a déjà intégré le coût de portage (r + u - y). On actualise seulement le payoff.
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
        <Slider label="K — Strike ($/bbl)" value={K} min={30} max={150} step={0.5} onChange={setK} accent={T.a5} format={v => `${v}$`} />
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
              <ReferenceLine x={K} stroke={T.a5} strokeDasharray="4 3" label={{ value: `K=${K}`, fill: T.a5, fontSize: 10 }} />
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
        <Step num={1} accent={ACCENT}>Call OTM : K=85, F=80, T=0.5, σ=35%, r=5%</Step>
        <Step num={2} accent={ACCENT}>d₁ = [ln(80/85) + 0.5×0.35²×0.5]/(0.35×√0.5) = [-0.0606 + 0.0306]/0.2475 = -0.1212</Step>
        <Step num={3} accent={ACCENT}>d₂ = -0.1212 - 0.2475 = -0.3687</Step>
        <Step num={4} accent={ACCENT}>Call = e^(-0.025)[80×N(-0.12) - 85×N(-0.37)] = 0.9753×[80×0.452 - 85×0.356]</Step>
        <Step num={5} accent={ACCENT}>= 0.9753 × [36.16 - 30.26] = 0.9753 × 5.90 ≈ 5.75$/bbl</Step>
      </ExampleBlock>

      <Accordion title="Exercice — Call gaz naturel sur futures" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>F = 3$/MMBtu, K = 3.5$, T = 3 mois, σ = 60%, r = 5%. Calculez Call Black 76.</p>
        <Step num={1} accent={ACCENT}>d₁ = [ln(3/3.5) + 0.5×0.36×0.25]/(0.6×0.5) = [-0.1542 + 0.045]/0.3 = -0.364</Step>
        <Step num={2} accent={ACCENT}>d₂ = -0.364 - 0.3 = -0.664</Step>
        <Step num={3} accent={ACCENT}>N(d₁) = N(-0.364) ≈ 0.358 ; N(d₂) = N(-0.664) ≈ 0.253</Step>
        <Step num={4} accent={ACCENT}>Call = e^(-0.0125) × [3×0.358 - 3.5×0.253] = 0.9876 × [1.074 - 0.886]</Step>
        <FormulaBox accent={ACCENT}>Call ≈ 0.9876 × 0.188 ≈ 0.186$/MMBtu</FormulaBox>
      </Accordion>
      <Accordion title="Exercice — Calculer le coût d'un collar pétrole" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Producteur pétrole. F = 75$/bbl, T = 1 an, σ = 40%, r = 5%. Calculez le coût d'un collar [60$, 90$] et déterminez le strike K₂ pour un collar zero-cost.</p>
        <Step num={1} accent={ACCENT}>Put K=60 : d₁ = [ln(75/60) + 0.5×0.16×1]/(0.4×1) = [0.2231 + 0.08]/0.4 = 0.758 ; d₂ = 0.758 - 0.4 = 0.358</Step>
        <Step num={2} accent={ACCENT}>Put = e^(-0.05)[60×N(-0.358) - 75×N(-0.758)] = 0.9512×[60×0.360 - 75×0.224] = 0.9512×[21.6 - 16.8] = 4.56$/bbl</Step>
        <Step num={3} accent={ACCENT}>Call K=90 : d₁ = [ln(75/90) + 0.5×0.16×1]/0.4 = [-0.182 + 0.08]/0.4 = -0.255 ; d₂ = -0.655</Step>
        <Step num={4} accent={ACCENT}>Call = e^(-0.05)[75×N(-0.255) - 90×N(-0.655)] = 0.9512×[75×0.399 - 90×0.256] = 0.9512×[29.9 - 23.1] = 6.47$/bbl</Step>
        <Step num={5} accent={ACCENT}>Coût net = Put - Call = 4.56 - 6.47 = -1.91$/bbl (crédit ! Le call vaut plus que le put → K₂ trop bas)</Step>
        <FormulaBox accent={ACCENT}>Pour zero-cost : réduire K₂ vers ~83$ pour que Call ≈ Put ≈ 4.56$/bbl. Collar final : [60$, 83$] à coût nul</FormulaBox>
      </Accordion>
      <Accordion title="Exercice — Valoriser un swap de prix fixe avec Black-76" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Un industriel achète 100,000 MMBtu de gaz/mois pendant 12 mois. Il signe un swap : il paie prix fixe K = 3.2$/MMBtu, reçoit Henry Hub spot mensuel. F_mois = 3.0 à 3.5$/MMBtu selon la maturité. Calculez la valeur du swap.</p>
        <Step num={1} accent={ACCENT}>Le swap = somme de 12 forwards mensuels. Valeur de chaque forward = (F_m - K) × Volume × DF_m</Step>
        <Step num={2} accent={ACCENT}>Mois 1 : F₁=3.0$, (3.0-3.2) × 100,000 × e^(-0.05/12) = -0.2 × 100,000 × 0.996 = -19,920$</Step>
        <Step num={3} accent={ACCENT}>Mois 6 : F₆=3.25$, (3.25-3.2) × 100,000 × e^(-0.025) = +0.05 × 100,000 × 0.975 = +4,875$</Step>
        <Step num={4} accent={ACCENT}>Mois 12 : F₁₂=3.5$, (3.5-3.2) × 100,000 × e^(-0.05) = +0.3 × 100,000 × 0.951 = +28,530$</Step>
        <FormulaBox accent={ACCENT}>Valeur totale du swap = Σ (F_m - K) × Q × DF_m sur 12 mois = dépend de la courbe forward entière</FormulaBox>
        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
          <strong style={{ color: ACCENT }}>Point clé :</strong> La valeur d'un swap de commodités à prix fixe est simplement la somme actualisée des forwards implicites. Si la courbe est en backwardation (F décroissant), le swap à prix fixe aura une valeur positive pour l'acheteur sur les premières maturités et négative sur les dernières.
        </div>
      </Accordion>
    </div>
  )
}

// ─── Tab: Cas Intégrateur ─────────────────────────────────────────────────────
function CasIntegrateurTab() {
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
      content: `Les rendements log-quotidiens du WTI : rᵢ = ln(Sᵢ/Sᵢ₋₁) ~ N(µ, σ²).
        Delta de la couverture : ∂V/∂S — on dérive le P&L par rapport au prix du pétrole.
        Vega : ∂V/∂σ — sensibilité aux changements de volatilité.`,
      formula: 'r_log = ln(S_t / S_{t-1}) ; Delta = ∂V/∂S ; Vega = ∂V/∂σ',
    },
    {
      num: 2, module: 'M2', color: T.a2, title: 'Distribution des prix',
      content: `Le prix du WTI suit (en première approximation) une distribution log-normale.
        E[S_T] = S₀ × e^(µT) = 80 × e^(0.08×1) = 86.6$/bbl
        P(S_T < 60$) = N[(ln(60/80) - 0.055×1)/(0.35×1)] = N(-1.10) ≈ 13.6%`,
      formula: 'ln(S_T/S₀) ~ N((µ-σ²/2)T, σ²T) → P(S_T < K) = N(d₂)',
    },
    {
      num: 3, module: 'M3', color: T.a3, title: 'Processus stochastique',
      content: `Le WTI suit un GBM (avec correction possible pour mean-reversion à long terme).
        dS = µS dt + σS dW ; µ = 8%/an, σ = 35%/an.
        Simulation de 1000 trajectoires → distribution de prix à 1 an.`,
      formula: 'dS = µS dt + σS dW → S_T = 80 × exp[(0.08-0.35²/2)×T + 0.35×√T×Z]',
    },
    {
      num: 4, module: 'M4', color: T.a4, title: 'Pricing des options',
      content: `Put de protection sur futures WTI : K=75$/bbl, T=6 mois, σ=35%.
        Black 76 : F = S × e^[(r+u-y)T] ≈ 80.8$/bbl (légère contango).
        Put B76 = 0.9753 × [75×N(0.214) - 80.8×N(-0.034)] ≈ 4.2$/bbl`,
      formula: 'P₇₅ = e^(-rT)[K×N(-d₂) - F×N(-d₁)] ≈ 4.2$/bbl = 42,000$ pour 10,000 bbl',
    },
    {
      num: 5, module: 'M5', color: T.a5, title: 'Volatilité & smile',
      content: `Vol implicite du marché : σ_impl(K=70) = 42% > σ_impl(ATM) = 35%.
        Skew négatif : les options OTM puts coûtent plus cher (protection contre crash).
        Vol historique 30j : σ_hist = std(rlog) × √252 ≈ 32%
        Vol implicite > vol historique → prime de risque positive.`,
      formula: 'σ_impl(K) extraite : C_marché = B76(F,K,T,r,σ_impl) → σ_impl par Newton-Raphson',
    },
    {
      num: 6, module: 'M6', color: T.a6, title: 'VaR du portefeuille',
      content: `Portfolio : 10M barils, σ=35%. VaR 99% sur 1 jour :
        σ_daily = 80 × 0.35/√252 = 1.77$/bbl
        VaR_99 = 2.326 × 1.77 × 10M = 41.2M$
        Avec couverture put K=75 (Δ=-0.35) :
        σ_hedged = σ × |1-0.35| = 35% × 0.65 = 22.75%
        VaR_hedged = 2.326 × (80×0.2275/√252) × 10M = 26.8M$ (-35%)`,
      formula: 'VaR_99 = 2.326 × σ × S × N ; VaR_hedged = VaR × (1 - Δ_hedge)',
    },
    {
      num: 7, module: 'M7', color: T.a7, title: 'Risk management',
      content: `CFaR annuel : σ_CF = 10M bbl × 80$ × 35% = 280M$ de vol sur revenus.
        CFaR 95% = 1.645 × 280M$ = 460M$ → revenus plancher = 800M$ - 460M$ = 340M$.
        Après couverture (70% produit hedgé) : σ_hedged = 30% × 280M$ = 84M$.
        CFaR_hedged = 1.645 × 84M$ = 138M$ → plancher = 662M$ (vs 340M$ sans couverture).`,
      formula: 'CFaR = z_95% × σ_CF × (1 - hedge_ratio) = 1.645 × 280 × 0.3 = 138M$',
    },
    {
      num: 8, module: 'M8', color: T.a8, title: 'Stratégie de couverture intégrée',
      content: `Stratégie recommandée pour EnergyCo SA :
        1. Vendre 7M bbl de futures WTI à 12 mois → fixe le prix sur 70% de la production
        2. Acheter puts K=70$ sur le solde non couvert → protection catastrophe
        3. Vendre calls K=95$ → capez les gains sur partie couverte (collar), réduit coût
        Résultat : plancher = 71$/bbl, plafond = 95$/bbl sur 70% de la prod.
        Prime nette = Prix put - Prix call ≈ 3.5$ - 1.8$ = 1.7$/bbl → coût acceptable.`,
      formula: 'Collar : Long put K=70 + Short call K=95 + Short futures → corridor [70$, 95$]',
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
        <strong style={{ color: T.a3 }}>M1→M2 :</strong> Les fonctions differentiables (M1) permettent de calculer E[S_T] via les distributions (M2)<br />
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
          Coût de production = 1.8$/MMBtu. Volatilité implicite ATM = 55%/an. r = 5%.
          La direction veut couvrir 70% de la production pour les 12 prochains mois avec un budget de couverture limité.
        </p>
        <Step num={1} accent={ACCENT}>M2/M3 — Profil de risque sans couverture : P(Prix {'<'} 1.8$) = P(ruine) = N[(ln(1.8/3.0) + (0.05-0.5×0.55²)×1)/(0.55)] = N[-0.756] ≈ 22.5% → risque élevé !</Step>
        <Step num={2} accent={ACCENT}>M8 — Lecture de la courbe forward : F(3M)=3.1$, F(6M)=3.2$, F(9M)=3.0$, F(12M)=2.9$ (légère backwardation hivernale)</Step>
        <Step num={3} accent={ACCENT}>M7 — CFaR sans couverture : σ_CF = 70Bcf × 3.0$ × 55% = 115.5M$, CFaR 95% = 1.645 × 115.5 = 190M$ → revenus plancher = 210M$ - 190M$ = 20M$ !</Step>
        <Step num={4} accent={ACCENT}>M8 — Stratégie collar sur 70% prod (70 Bcf = 70,000 MMBtu × 1000) : Long put K=2.5$ + Short call K=3.8$</Step>
        <Step num={5} accent={ACCENT}>M4 — Pricing put K=2.5$, F=3.0$, T=6M, σ=55% : d₁=[ln(3/2.5)+0.5×0.3025×0.5]/(0.55×0.707) = [0.182+0.076]/0.389 = 0.663, d₂=-0.326, Put = e^(-0.025)[2.5×N(0.326)-3.0×N(-0.663)] = 0.9753×[2.5×0.628-3.0×0.254] = 0.9753×[1.57-0.762] = 0.788$/MMBtu</Step>
        <Step num={6} accent={ACCENT}>M4 — Pricing call K=3.8$ : OTM call, prix ≈ 0.72$/MMBtu (similaire au put pour zero-cost collar)</Step>
        <Step num={7} accent={ACCENT}>M7 — CFaR après couverture : σ_CF_résid = 30% × 115.5 = 34.65M$, CFaR_hedged = 1.645 × 34.65 = 57M$ vs 190M$ (-70% !)</Step>
        <Step num={8} accent={ACCENT}>M7 — RAROC de la couverture : Valeur créée (réduction risque) = 190-57=133M$. Capital économique libéré × CoC = valeur de la couverture. Coût net collar ≈ 0.07$/MMBtu × 70Bcf = 4.9M$/an</Step>
        <FormulaBox accent={ACCENT}>Résultat : Collar [2.5$, 3.8$] sur 70% de la production. Revenus garantis : 175M$ min (vs 20M$ sans couverture). Coût net ≈ 4.9M$/an = 2.3% des revenus. CFaR réduit de 190M$ à 57M$.</FormulaBox>
        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
          <strong style={{ color: ACCENT }}>Synthèse des modules mobilisés :</strong><br />
          M2 (probas) → calcul de P(ruine) | M3 (GBM) → simulation des scénarios | M4 (Black-76) → pricing des options | M5 (vol) → surface de volatilité implicite | M6 (VaR) → mesure du risque résiduel | M7 (CFaR/RAROC) → perspective corporate et justification économique | M8 (marchés) → lecture de la courbe forward, choix des strikes, exécution
        </div>
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
          Collar [70$, 95$] sur 70% production + 30% exposition non couverte
          → Revenus garantis : 700M$ (min) — 950M$ (max)
          → Coût net = 1.7$/bbl × 10Mbbl × 70% = 11.9M$ (1.5% des revenus)
          → RAROC de la couverture : 25% (valeur créée / capital mobilisé)
        </FormulaBox>
      </div>
    </div>
  )
}

// ─── Main Module 8 ────────────────────────────────────────────────────────────
const TABS = ['Marchés Énergie', 'Forward Curves', 'Options Énergie', 'Cas Intégrateur']

export default function Module8() {
  const [tab, setTab] = useState('Marchés Énergie')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      <ModuleHeader
        num={8}
        title="Applications Énergie"
        subtitle="Marchés spot/forward du pétrole, gaz et électricité — forward curves (contango vs backwardation) — options énergie avec Black 76 — cas intégrateur reliant les 8 modules."
        accent={ACCENT}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} accent={ACCENT} />
      {tab === 'Marchés Énergie' && <MarchesTab />}
      {tab === 'Forward Curves' && <ForwardCurvesTab />}
      {tab === 'Options Énergie' && <OptionsTab />}
      {tab === 'Cas Intégrateur' && <CasIntegrateurTab />}
    </div>
  )
}
