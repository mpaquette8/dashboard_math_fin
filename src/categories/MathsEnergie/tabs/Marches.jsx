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

export function MarchesTab() {
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
        • <strong>Spread Dec-Jul gaz <K>{"\\gt 0"}</K></strong> : le marché anticipe une tension hivernale → les traders "long spread" profitent<br />
        • <strong>Spread négatif (backwardation inter-saisons)</strong> : surplus de gaz, stockages pleins → incitation à stocker maintenant et livrer plus tard<br />
        Les calendar spreads permettent de trader la saisonnalité sans prendre de risque de direction sur les prix. Ils sont utilisés par les gestionnaires de stockage de gaz pour optimiser le remplissage des cavernes.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice — Identifier la saisonnalité du gaz naturel" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}>Analysez la courbe forward du gaz Henry Hub : Jan=4.5$/MMBtu, Avr=2.8$, Jul=3.1$, Oct=3.4$, Jan+1=4.8$. Quels patterns observez-vous ?</p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Implied storage value} \\approx \\text{Calendar spread Jan-Jul} = 4.5 - 3.1 = 1.4\\$/\\text{MMBtu}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Saisonnalité" ruleDetail="Pattern saisonnier forward curve" accent={ACCENT}>Pattern "dents de scie" saisonnier : hiver (Jan) <K>{"\\gt"}</K> printemps (Avr) <K>{"\\lt"}</K> été (Jul) <K>{"\\lt"}</K> automne/hiver suivant</DemoStep>
          <DemoStep num={2} rule="Décomposition saisonnière" ruleDetail="Spread = F(hiver) − F(printemps)" accent={ACCENT}>Calendar spread Jan-Avr = <K>{"4.5 - 2.8 = 1.7"}</K> $/MMBtu → prime hivernale élevée</DemoStep>
          <DemoStep num={3} rule="Saisonnalité" ruleDetail="Coût de stockage inter-saison" accent={ACCENT}>Cette structure traduit le coût de stockage du gaz de l'été vers l'hiver</DemoStep>
          <DemoStep num={4} rule="Saisonnalité" ruleDetail="Trading de spread saisonnier" accent={ACCENT}>Stratégie : achat futures Avr + vente futures Jan = achat de ce spread à −1.7$ → gagnant si la prime hivernale se réduit</DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice — Calcul d'un basis risk" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>Un producteur de gaz au Texas vend au prix Houston Ship Channel (HSC). Il couvre avec des futures Henry Hub (HH). HSC = 2.70$/MMBtu, HH = 2.80$/MMBtu. Il vend 1M MMBtu/mois. Calculez le basis et le P&L si le basis se dégrade.</p>
        <FormulaBox accent={ACCENT}><K display>{"\\text{Basis} = S_{\\text{local}} - F_{\\text{référence}}"}</K>Pour l'éliminer : couvrir avec des forwards OTC spécifiques à HSC</FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Risque de base" ruleDetail="Basis = Spot − Futures" accent={ACCENT}>Basis actuel = <K>{"\\text{HSC} - \\text{HH} = 2.70 - 2.80 = -0.10"}</K> $/MMBtu (HSC trade à discount)</DemoStep>
          <DemoStep num={2} rule="Risque de base" ruleDetail="Couverture via futures" accent={ACCENT}>Couverture : vente de 1M MMBtu de futures HH à 2.80$ → revenus de couverture = 2.80M$</DemoStep>
          <DemoStep num={3} rule="Risque de base" ruleDetail="Revenu physique réel" accent={ACCENT}>Revenus physiques réels = <K>{"\\text{HSC} \\times Q = 2.70 \\times 1\\text{M} = 2.70\\text{M\\$}"}</K></DemoStep>
          <DemoStep num={4} rule="Risque de base" ruleDetail="P&L total avec basis" accent={ACCENT}>Total = <K>{"2.70 + (2.80 - 2.80) = 2.70\\text{M\\$}"}</K> → le basis absorbe 0.10$/MMBtu</DemoStep>
          <DemoStep num={5} rule="Risque de base" ruleDetail="Dégradation du basis" accent={ACCENT}>Si le basis se dégrade à −0.30$ (HSC = 2.50$, HH = 2.80$) : revenus = <K>{"2.50 + 0 = 2.50\\text{M\\$}"}</K> → perte de 0.20M$ non couverte</DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}
