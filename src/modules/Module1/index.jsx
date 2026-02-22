import React, { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { T } from '../../design/tokens'
import {
  ModuleHeader, TabBar, Panel, FormulaBox, IntuitionBlock, ExampleBlock,
  Slider, Accordion, Step, SymbolLegend, SectionTitle, InfoChip, Grid, ChartWrapper,
} from '../../design/components'

const ACCENT = T.a1

// ─── Tab: Dérivées ────────────────────────────────────────────────────────────
export function DerivTab() {
  const [fx, setFx] = useState('x2') // x2, sinx, expx
  const [showDeriv, setShowDeriv] = useState(true)
  const [xPoint, setXPoint] = useState(1.0)

  const fns = {
    x2: { label: 'f(x) = x²', f: x => x * x, df: x => 2 * x, dfLabel: "f'(x) = 2x" },
    x3: { label: 'f(x) = x³', f: x => x * x * x, df: x => 3 * x * x, dfLabel: "f'(x) = 3x²" },
    expx: { label: 'f(x) = eˣ', f: x => Math.exp(x), df: x => Math.exp(x), dfLabel: "f'(x) = eˣ" },
  }

  const fn = fns[fx]
  const data = useMemo(() => {
    const pts = []
    for (let x = -2.5; x <= 2.5; x += 0.1) {
      pts.push({ x: +x.toFixed(2), f: +fn.f(x).toFixed(3), df: +fn.df(x).toFixed(3) })
    }
    return pts
  }, [fx])

  const slope = fn.df(xPoint)
  // Tangent line: y = f(x0) + f'(x0)(x - x0)
  const tangentData = useMemo(() => {
    const pts = []
    for (let x = xPoint - 1.5; x <= xPoint + 1.5; x += 0.1) {
      pts.push({ x: +x.toFixed(2), t: +(fn.f(xPoint) + slope * (x - xPoint)).toFixed(3) })
    }
    return pts
  }, [xPoint, fx])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La dérivée est l'outil fondamental pour mesurer <strong style={{ color: T.text }}>comment une quantité change en réponse à une autre</strong>. Elle apparaît dans tous les domaines : en physique (vitesse, accélération, flux thermique), en biologie (taux de croissance d'une population), en chimie (cinétique de réaction), en économie (coût marginal, élasticité). Partout où l'on pose la question <em>"à quelle vitesse évolue cette grandeur ?"</em>, la dérivée est la réponse.
      </div>
      <IntuitionBlock emoji="🚗" title="La dérivée = vitesse instantanée" accent={ACCENT}>
        Imaginez que vous conduisez. La position est <strong>f(t)</strong>, la vitesse est <strong>f'(t)</strong>.
        Si f(t) = t², votre position est le carré du temps. À t=3s, votre vitesse est f'(3) = 6 m/s.
        La dérivée mesure <em>à quelle vitesse la fonction change</em> en un point précis.
        En finance : si C est le prix d'un call et S le prix du sous-jacent, alors Delta = dC/dS
        est "la vitesse" à laquelle le call réagit aux mouvements du sous-jacent.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Définition formelle">
        f'(x) = lim[h→0] (f(x+h) - f(x)) / h
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ["f'(x)", "Dérivée de f en x = pente de la tangente"],
        ["h", "Incrément infinitésimal → 0"],
        ["lim", "Limite : h tend vers 0 mais n'est jamais nul"],
      ]} />

      <IntuitionBlock emoji="⚡" title="Pourquoi h → 0 et pas h = 0 ?" accent={ACCENT}>
        Si on posait h = 0 directement, on diviserait par zéro — ce qui est indéfini. La limite est une opération de <strong>passage à la limite</strong> : on étudie le comportement quand h devient arbitrairement petit, sans jamais l'atteindre. C'est exactement la distinction entre <strong>vitesse moyenne</strong> et <strong>vitesse instantanée</strong> : la vitesse moyenne sur [t, t+h] vaut (distance parcourue)/h. Quand h→0, on obtient la vitesse à l'instant t. De même, (f(x+h)-f(x))/h est le taux de variation moyen de f sur [x, x+h] ; sa limite en h→0 est le taux de variation instantané, c'est-à-dire la dérivée.
      </IntuitionBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Dérivée partielle vs dérivée totale :</strong> Quand une fonction dépend de plusieurs variables — par exemple la température T(x, y, t) d'une plaque chauffante dépend des coordonnées x, y et du temps t — on distingue deux notions. La <strong>dérivée partielle ∂T/∂x</strong> mesure le gradient thermique horizontal en maintenant y et t constants. La <strong>dérivée totale dT</strong> capture la variation complète quand toutes les variables évoluent simultanément : dT = (∂T/∂x)dx + (∂T/∂y)dy + (∂T/∂t)dt. Cette décomposition est universelle : en mécanique, en thermodynamique, en toute discipline multi-variable.
      </div>

      <SectionTitle accent={ACCENT}>Dérivées partielles — Technique pas à pas</SectionTitle>
      <IntuitionBlock emoji="🔒" title='Principe fondamental : "geler" les autres variables' accent={ACCENT}>
        Pour calculer <strong>∂f/∂x</strong>, on traite toutes les variables autres que x comme des <strong>constantes</strong> et on applique les règles habituelles. C'est tout !
        <br /><br />
        <strong>Analogie :</strong> imaginez une carte topographique f(x, y). La dérivée ∂f/∂x est la pente quand vous marchez vers l'Est (x croît, y fixe). La dérivée ∂f/∂y est la pente vers le Nord (y croît, x fixe). Deux sensibilités différentes pour la même surface.
        <br /><br />
        En physique : ∂P/∂T (pression par rapport à la température, volume fixé) répond à "comment varie la pression si je chauffe à volume constant ?" — c'est la loi de Gay-Lussac.
      </IntuitionBlock>

      <div style={{ background: T.panel2, borderRadius: 10, padding: 16, margin: '14px 0', border: `1px solid ${ACCENT}33` }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Exemple 1 — Polynôme à 2 variables : f(x, y) = 3x²y + 2xy³</div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>Calcul de <strong style={{ color: T.text }}>∂f/∂x</strong> (on gèle y) :</div>
        <Step num={1} accent={ACCENT}>Terme <strong>3x²y</strong> : y est une constante multiplicative → dériver x² → 2x → contribution : 3·(2x)·y = <strong>6xy</strong></Step>
        <Step num={2} accent={ACCENT}>Terme <strong>2xy³</strong> : y³ est une constante multiplicative → dériver x → 1 → contribution : 2·1·y³ = <strong>2y³</strong></Step>
        <FormulaBox accent={ACCENT}>∂f/∂x = 6xy + 2y³</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, margin: '10px 0 8px' }}>Calcul de <strong style={{ color: T.text }}>∂f/∂y</strong> (on gèle x) :</div>
        <Step num={3} accent={ACCENT}>Terme <strong>3x²y</strong> : x² est une constante multiplicative → dériver y → 1 → contribution : 3x²·1 = <strong>3x²</strong></Step>
        <Step num={4} accent={ACCENT}>Terme <strong>2xy³</strong> : x est une constante multiplicative → dériver y³ → 3y² → contribution : 2x·(3y²) = <strong>6xy²</strong></Step>
        <FormulaBox accent={ACCENT}>∂f/∂y = 3x² + 6xy²</FormulaBox>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Vérification en (x=1, y=2) : ∂f/∂x = 6×1×2 + 2×8 = 12 + 16 = <strong>28</strong>. Si x monte de 1 (x: 1→2), f varie d'environ 28.
          <br />∂f/∂y = 3×1 + 6×1×4 = 3 + 24 = <strong>27</strong>. Si y monte de 1 (y: 2→3), f varie d'environ 27.
        </div>
      </div>

      <div style={{ background: T.panel2, borderRadius: 10, padding: 16, margin: '14px 0', border: `1px solid ${ACCENT}33` }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Exemple 2 — Énergie cinétique : E(m, v) = ½ · m · v²</div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>E = énergie cinétique d'un objet de masse m se déplaçant à vitesse v. Deux dérivées partielles, deux sensibilités physiques :</div>
        <Step num={1} accent={ACCENT}><strong>∂E/∂m</strong> (v constant) : v² est un facteur constant → <strong>∂E/∂m = v²/2</strong>. Interprétation : 1 kg de masse supplémentaire ajoute v²/2 joules d'énergie cinétique.</Step>
        <Step num={2} accent={ACCENT}><strong>∂E/∂v</strong> (m constant) : règle de puissance sur v² → <strong>∂E/∂v = m·v</strong>. C'est la quantité de mouvement ! Doubler la vitesse quadruple l'énergie, mais la sensibilité marginale (dérivée) est proportionnelle à v.</Step>
        <FormulaBox accent={ACCENT}>∂E/∂m = v²/2   |   ∂E/∂v = m·v</FormulaBox>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Exemple numérique : m = 1 000 kg (voiture), v = 30 m/s. ∂E/∂v = 1000 × 30 = 30 000 N (newtons).
          Si la vitesse augmente de 1 m/s (de 30 à 31 m/s), l'énergie cinétique augmente d'environ 30 000 J.
        </div>
      </div>

      <div style={{ background: T.panel2, borderRadius: 10, padding: 16, margin: '14px 0', border: `1px solid ${ACCENT}33` }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Exemple 3 — Loi des gaz parfaits : P(n, T, V) = nRT / V</div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 12 }}>
          P = pression, n = quantité (moles), T = température (K), V = volume (L), R = 8.314 J/(mol·K) constante.
          <br />Quatre variables, quatre dérivées partielles — chacune correspond à une loi physique classique.
        </div>
        <Step num={1} accent={ACCENT}>
          <strong>∂P/∂n</strong> (T, V constants) : RT/V est un facteur constant.
          → <strong>∂P/∂n = RT/V</strong>. Ajouter une mole de gaz augmente la pression de RT/V.
        </Step>
        <Step num={2} accent={ACCENT}>
          <strong>∂P/∂T</strong> (n, V constants) : nR/V est constant.
          → <strong>∂P/∂T = nR/V</strong>. Loi de Gay-Lussac : à volume fixé, P est proportionnelle à T.
        </Step>
        <Step num={3} accent={ACCENT}>
          <strong>∂P/∂V</strong> (n, T constants) : règle de puissance sur 1/V = V⁻¹.
          → <strong>∂P/∂V = −nRT/V²</strong>. Loi de Boyle-Mariotte : comprimer le gaz augmente la pression (signe négatif : P décroît quand V croît).
        </Step>
        <FormulaBox accent={ACCENT}>∂P/∂n = RT/V   |   ∂P/∂T = nR/V   |   ∂P/∂V = −nRT/V²</FormulaBox>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Exemple : n=1 mol, T=300 K, V=10 L. P = 1×8.314×300/10 = 249.4 kPa.
          ∂P/∂T = 8.314/10 = 0.83 kPa/K → chauffer de 1 K augmente la pression d'environ 0.83 kPa.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Règles essentielles</SectionTitle>
      <Grid cols={2} gap="10px">
        {[
          ["Puissance", "d/dx(xⁿ) = n·xⁿ⁻¹", "d/dx(x³) = 3x²"],
          ["Produit", "(u·v)' = u'v + uv'"],
          ["Quotient", "(u/v)' = (u'v - uv') / v²"],
          ["Chaîne", "(f∘g)'(x) = f'(g(x))·g'(x)"],
          ["Exponentielle", "d/dx(eˣ) = eˣ", "d/dx(eᵃˣ) = a·eᵃˣ"],
          ["Logarithme", "d/dx(ln x) = 1/x"],
        ].map(([name, rule, ex]) => (
          <div key={name} style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.border}` }}>
            <div style={{ color: ACCENT, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{name}</div>
            <code style={{ color: T.text, fontFamily: 'monospace', fontSize: 13 }}>{rule}</code>
            {ex && <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>{ex}</div>}
          </div>
        ))}
      </Grid>

      <SectionTitle accent={ACCENT}>Applications des dérivées — Développement de Taylor</SectionTitle>
      <IntuitionBlock emoji="💡" title="Approximation locale : le développement de Taylor" accent={ACCENT}>
        La dérivée permet d'<strong>approximer localement</strong> toute fonction différentiable. Autour d'un point x₀, on peut écrire :
        <br /><br />
        <strong>f(x₀ + Δx) ≈ f(x₀) + f′(x₀)·Δx + ½·f″(x₀)·Δx²</strong>
        <br /><br />
        — Le premier terme <strong>f′(x₀)·Δx</strong> est la contribution linéaire (pente tangente).<br />
        — Le deuxième terme <strong>½·f″(x₀)·Δx²</strong> est la correction de courbure (dérivée seconde).<br />
        <br />
        Cette décomposition est universelle : en optique (aberrations), en mécanique (oscillateurs), en numérique (méthodes de Newton).
      </IntuitionBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Exemple — Approximation de sin(x) autour de x₀ = 0</div>
        <Step num={1} accent={ACCENT}><strong>f(x) = sin(x)</strong>. En x₀ = 0 : f(0) = 0, f′(x) = cos(x) → f′(0) = 1, f″(x) = −sin(x) → f″(0) = 0.</Step>
        <Step num={2} accent={ACCENT}>Taylor ordre 1 : sin(x) ≈ x. Précision : sin(0.1) ≈ 0.100 vs exact 0.0998. Erreur {'<'} 0.2%.</Step>
        <Step num={3} accent={ACCENT}>Taylor ordre 3 : sin(x) ≈ x − x³/6. Précision : sin(0.5) ≈ 0.479 vs exact 0.479. Erreur {'<'} 0.01%.</Step>
        <FormulaBox accent={ACCENT}>sin(x) ≈ x − x³/6 + x⁵/120 − …   (série entière autour de 0)</FormulaBox>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Cette approximation est utilisée en ingénierie (petits angles en mécanique), en traitement du signal (analyse spectrale) et en physique quantique.
        </div>
      </div>

      <div style={{ background: T.panel2, borderRadius: 8, padding: 14, margin: '10px 0', border: `1px solid ${T.a4}33` }}>
        <div style={{ color: T.a4, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
          → Application en finance &amp; énergie
        </div>
        <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
          Les dérivées partielles appliquées au pricing d'options (Greeks : Delta, Gamma, Vega, Theta, Rho) et la décomposition de sensibilité de portefeuilles sont traitées dans <strong>Mathématiques Financières › Greeks &amp; Sensibilités</strong>.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Visualisation interactive</SectionTitle>
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        {Object.entries(fns).map(([k, v]) => (
          <button key={k} onClick={() => setFx(k)} style={{
            background: fx === k ? `${ACCENT}22` : T.panel2,
            border: `1px solid ${fx === k ? ACCENT : T.border}`,
            color: fx === k ? ACCENT : T.muted,
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: fx === k ? 700 : 400,
          }}>{v.label}</button>
        ))}
      </div>
      <Slider label="Point x₀ (tangente)" value={xPoint} min={-2} max={2} step={0.1} onChange={setXPoint} accent={ACCENT} format={v => v.toFixed(1)} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <InfoChip label="f(x₀)" value={fn.f(xPoint).toFixed(3)} accent={ACCENT} />
        <InfoChip label="f'(x₀) = pente" value={slope.toFixed(3)} accent={T.a4} />
      </div>
      <ChartWrapper title={`${fn.label} et sa dérivée ${fn.dfLabel}`} accent={ACCENT} height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="x" type="number" domain={[-2.5, 2.5]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 11 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 11 }} domain={[-5, 10]} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} labelStyle={{ color: T.muted }} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 12 }} />
            <Line data={data} type="monotone" dataKey="f" stroke={ACCENT} strokeWidth={2.5} dot={false} name={fn.label} />
            <Line data={data} type="monotone" dataKey="df" stroke={T.a4} strokeWidth={2} dot={false} strokeDasharray="6 3" name={fn.dfLabel} />
            <Line data={tangentData} type="monotone" dataKey="t" stroke={T.a5} strokeWidth={1.5} dot={false} strokeDasharray="4 4" name={`Tangente en x=${xPoint.toFixed(1)}`} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice 1 — Dérivée de base" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text, marginBottom: 12 }}>Calculez f'(x) pour f(x) = 3x⁴ - 2x² + 5x - 7</p>
        <div style={{ color: T.muted, fontSize: 13, marginBottom: 10 }}>Corrigé :</div>
        <Step num={1} accent={ACCENT}>Règle de puissance terme par terme</Step>
        <Step num={2} accent={ACCENT}>d/dx(3x⁴) = 12x³</Step>
        <Step num={3} accent={ACCENT}>d/dx(-2x²) = -4x</Step>
        <Step num={4} accent={ACCENT}>d/dx(5x) = 5 ; d/dx(-7) = 0</Step>
        <FormulaBox accent={ACCENT}>f'(x) = 12x³ - 4x + 5</FormulaBox>
      </Accordion>
      <Accordion title="Exercice 2 — Règle de chaîne : vitesse d'une fusée" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          La distance d'une fusée est d(t) = 3t² + 2t. Calculez la vitesse v(t) = d′(t) et l'accélération a(t) = v′(t).
        </p>
        <Step num={1} accent={ACCENT}>v(t) = d′(t) = d/dt(3t² + 2t) = 6t + 2</Step>
        <Step num={2} accent={ACCENT}>a(t) = v′(t) = d/dt(6t + 2) = 6</Step>
        <FormulaBox accent={ACCENT}>v(t) = 6t + 2   |   a(t) = 6 (accélération constante)</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>À t = 3s : vitesse = 6×3 + 2 = 20 m/s. L'accélération est constante : la fusée gagne 6 m/s chaque seconde.</div>
      </Accordion>
      <Accordion title="Exercice 3 — Règle de chaîne : composition de fonctions" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Soit h(x) = sin(x²). Calculez h′(x) par la règle de chaîne.
        </p>
        <Step num={1} accent={ACCENT}>Identifier : h = f∘g avec g(x) = x² et f(u) = sin(u)</Step>
        <Step num={2} accent={ACCENT}>g′(x) = 2x   et   f′(u) = cos(u)</Step>
        <Step num={3} accent={ACCENT}>Règle de chaîne : h′(x) = f′(g(x)) × g′(x) = cos(x²) × 2x</Step>
        <FormulaBox accent={ACCENT}>h′(x) = 2x · cos(x²)</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>En x = √(π/2) : h′ = 2√(π/2) × cos(π/2) = 0 — point stationnaire (extremum local).</div>
      </Accordion>
      <Accordion title="Exercice 4 — Dérivées partielles : surface d'un cylindre" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          La surface latérale d'un cylindre est S(r, h) = 2π·r·h. Calculez ∂S/∂r et ∂S/∂h, puis évaluez-les en r=3, h=10.
        </p>
        <Step num={1} accent={ACCENT}>∂S/∂r : h est constant → ∂S/∂r = 2π·h</Step>
        <Step num={2} accent={ACCENT}>∂S/∂h : r est constant → ∂S/∂h = 2π·r</Step>
        <Step num={3} accent={ACCENT}>En r=3, h=10 : ∂S/∂r = 2π×10 ≈ 62.8 cm²/cm</Step>
        <Step num={4} accent={ACCENT}>En r=3, h=10 : ∂S/∂h = 2π×3 ≈ 18.8 cm²/cm</Step>
        <FormulaBox accent={ACCENT}>∂S/∂r|_(3,10) ≈ 62.8   |   ∂S/∂h|_(3,10) ≈ 18.8</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>Interprétation : augmenter le rayon de 1 cm ajoute plus de surface (~63 cm²) qu'augmenter la hauteur de 1 cm (~19 cm²), car le rayon intervient dans toute la circonférence.</div>
      </Accordion>
      <Accordion title="Exercice 5 — Taylor : approximation de e^x" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Approximez e^(0.3) avec un développement de Taylor d'ordre 3 autour de x₀ = 0. Comparez à la valeur exacte.
        </p>
        <Step num={1} accent={ACCENT}>f(x) = eˣ → toutes les dérivées valent eˣ. En x₀=0 : f(0) = f′(0) = f″(0) = f‴(0) = 1.</Step>
        <Step num={2} accent={ACCENT}>Taylor ordre 3 : eˣ ≈ 1 + x + x²/2 + x³/6</Step>
        <Step num={3} accent={ACCENT}>En x = 0.3 : 1 + 0.3 + 0.09/2 + 0.027/6 = 1 + 0.3 + 0.045 + 0.0045 = 1.3495</Step>
        <FormulaBox accent={ACCENT}>Approximation : e^(0.3) ≈ 1.3495   |   Valeur exacte : 1.34986…</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>Erreur relative : (1.34986 − 1.3495) / 1.34986 ≈ 0.027%. Trois termes suffisent pour une précision de l'ordre du millième.</div>
      </Accordion>
    </div>
  )
}

// ─── Tab: Intégrales ──────────────────────────────────────────────────────────
export function IntegTab() {
  const [a, setA] = useState(-1)
  const [b, setB] = useState(1)
  const [fnType, setFnType] = useState('gauss')

  const fns = {
    gauss: { label: 'φ(x) = (1/√2π)e^(-x²/2)', f: x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) },
    x2: { label: 'f(x) = x²', f: x => x * x },
    abs: { label: 'f(x) = |x|', f: x => Math.abs(x) },
  }
  const fn = fns[fnType]

  const dx = 0.05
  const data = useMemo(() => {
    const pts = []
    for (let x = -3.5; x <= 3.5; x += dx) {
      pts.push({ x: +x.toFixed(2), f: +fn.f(x).toFixed(4), fill: (x >= a && x <= b) ? +fn.f(x).toFixed(4) : null })
    }
    return pts
  }, [fnType, a, b])

  // Numerical integral by Riemann sum
  const integral = useMemo(() => {
    let s = 0
    for (let x = a; x < b; x += dx) s += fn.f(x + dx / 2) * dx
    return s
  }, [fnType, a, b])

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        L'intégrale mesure l'<strong style={{ color: T.text }}>accumulation d'une grandeur variable</strong>. Elle apparaît dans tous les domaines : en physique <em>(distance = intégrale de la vitesse, travail = intégrale de la force)</em>, en probabilités <em>(probabilité = aire sous la densité)</em>, en biologie <em>(biomasse totale = intégrale de la densité de population)</em>, en thermodynamique <em>(chaleur échangée = intégrale du flux)</em>. Partout où l'on additionne infiniment de petites contributions, l'intégrale est l'outil.
      </div>
      <IntuitionBlock emoji="📐" title="L'intégrale = superficie sous la courbe" accent={ACCENT}>
        Imaginez une route avec une vitesse variable v(t). La <strong>distance parcourue</strong> entre t=a et t=b est l'intégrale ∫[a,b] v(t) dt — la somme de toutes les petites distances v(t)×dt.
        En probabilités : l'intégrale de la densité φ(x) sur [a,b] donne P(a ≤ X ≤ b) — la probabilité d'être dans l'intervalle.
        L'aire sous la courbe est à la fois une surface géométrique et une somme physique.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Intégrale de Riemann">
        ∫[a,b] f(x) dx = lim[n→∞] Σᵢ f(xᵢ) × Δx
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Théorème fondamental du calcul">
        ∫[a,b] f(x) dx = F(b) - F(a)   où F' = f (primitive de f)
      </FormulaBox>

      <SectionTitle accent={ACCENT}>L'espérance comme intégrale</SectionTitle>
      <FormulaBox accent={ACCENT} label="Espérance d'une variable continue">
        E[X] = ∫[-∞, +∞] x · f(x) dx
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        C'est la généralisation continue de la moyenne : au lieu de sommer x_i × P(X=x_i), on intègre x × f(x) sur tous les x possibles. Par exemple, si X est la taille d'un individu adulte (densité f gaussienne centrée sur 175 cm), l'espérance E[X] = ∫ x·f(x)dx donne la taille moyenne de la population — une intégrale pondérée par les probabilités.
      </div>

      <SectionTitle accent={ACCENT}>Lien avec la probabilité normale</SectionTitle>
      <FormulaBox accent={ACCENT} label="CDF normale standard">
        Φ(d) = P(Z ≤ d) = ∫[-∞, d] φ(x) dx   où φ(x) = (1/√2π) e^(-x²/2)
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>
        La fonction de répartition Φ(d) est une intégrale de la densité gaussienne. Elle ne possède pas de forme fermée analytique — c'est pourquoi les <strong>tables de la loi normale</strong> ont été si précieuses avant l'informatique. Quand vous lisez "Φ(1.96) = 0.975", vous lisez la valeur d'une intégrale : ∫[-∞, 1.96] φ(x) dx = 0.975.
      </div>

      <IntuitionBlock emoji="∫" title="Φ(d) : une intégrale de la gaussienne" accent={ACCENT}>
        La densité gaussienne φ(x) = (1/√2π)·e^(-x²/2) est une courbe en cloche symétrique. Son intégrale sur tout ℝ vaut 1 (c'est une densité de probabilité). Sur [-1.96, 1.96] elle vaut 0.95 — c'est l'intervalle de confiance à 95% utilisé en statistiques et en physique (mesures expérimentales, intervalles de tolérance industrielle, tests d'hypothèse).
        <br /><br />
        Les approximations numériques de Φ (polynomiales, rationnelles) sont des algorithmes fondamentaux en analyse numérique, indépendamment de toute application sectorielle.
      </IntuitionBlock>

      <div style={{ background: T.panel2, borderRadius: 8, padding: 14, margin: '10px 0', border: `1px solid ${T.a4}33` }}>
        <div style={{ color: T.a4, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
          → Application en finance &amp; énergie
        </div>
        <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
          L'intégrale de l'espérance du payoff d'un dérivé sous mesure risque-neutre (pricing par espérance actualisée, lien avec Black-Scholes) est traitée dans <strong>Mathématiques Financières › Pricing Options</strong>.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Visualisation interactive</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {Object.entries(fns).map(([k, v]) => (
          <button key={k} onClick={() => setFnType(k)} style={{
            background: fnType === k ? `${ACCENT}22` : T.panel2,
            border: `1px solid ${fnType === k ? ACCENT : T.border}`,
            color: fnType === k ? ACCENT : T.muted,
            borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: fnType === k ? 700 : 400,
          }}>{v.label}</button>
        ))}
      </div>
      <Grid cols={2} gap="12px">
        <Slider label="Borne inférieure a" value={a} min={-3} max={b - 0.1} step={0.1} onChange={setA} accent={ACCENT} format={v => v.toFixed(1)} />
        <Slider label="Borne supérieure b" value={b} min={a + 0.1} max={3} step={0.1} onChange={setB} accent={T.a4} format={v => v.toFixed(1)} />
      </Grid>
      <InfoChip label="∫[a,b] f(x)dx ≈" value={integral.toFixed(4)} accent={ACCENT} />
      {fnType === 'gauss' && (
        <InfoChip label="= P(a ≤ Z ≤ b) =" value={`${(integral * 100).toFixed(1)}%`} accent={T.a4} />
      )}

      <ChartWrapper title="Aire sous la courbe (zone colorée = intégrale)" accent={ACCENT} height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="x" type="number" domain={[-3.5, 3.5]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            <ReferenceLine x={a} stroke={ACCENT} strokeDasharray="4 3" label={{ value: 'a', fill: ACCENT, fontSize: 11 }} />
            <ReferenceLine x={b} stroke={T.a4} strokeDasharray="4 3" label={{ value: 'b', fill: T.a4, fontSize: 11 }} />
            <Line type="monotone" dataKey="f" stroke={ACCENT} strokeWidth={2.5} dot={false} name="f(x)" />
            <Line type="monotone" dataKey="fill" stroke={T.a4} strokeWidth={0} dot={false} fill={`${T.a4}44`} name="∫ f(x)dx" />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice 1 — Intégrale simple" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}>Calculez ∫[0,3] 2x dx</p>
        <Step num={1} accent={ACCENT}>Primitive de 2x : F(x) = x²</Step>
        <Step num={2} accent={ACCENT}>F(3) - F(0) = 9 - 0 = 9</Step>
        <FormulaBox accent={ACCENT}>∫[0,3] 2x dx = 9</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12 }}>Interprétation géométrique : triangle de base 3, hauteur 6 → aire = (3×6)/2 = 9 ✓</div>
      </Accordion>
      <Accordion title="Exercice 2 — Probabilité et intégrale gaussienne" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 8 }}>La taille des adultes suit une loi N(175, 7²) cm. Quelle est la probabilité d'avoir entre 168 et 182 cm ?</p>
        <Step num={1} accent={ACCENT}>Standardiser : Z = (X − 175) / 7. L'intervalle [168, 182] devient [(168−175)/7, (182−175)/7] = [−1, +1].</Step>
        <Step num={2} accent={ACCENT}>P(168 ≤ X ≤ 182) = P(−1 ≤ Z ≤ 1) = Φ(1) − Φ(−1)</Step>
        <Step num={3} accent={ACCENT}>Par symétrie : Φ(−1) = 1 − Φ(1). Φ(1) ≈ 0.8413</Step>
        <FormulaBox accent={ACCENT}>P(168 ≤ X ≤ 182) = 2 × 0.8413 − 1 ≈ 68.3%</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12 }}>Règle empirique : ±1σ couvre ~68% de la population, ±2σ couvre ~95%, ±3σ couvre ~99.7%.</div>
      </Accordion>
      <Accordion title="Exercice 3 — Espérance d'une variable tronquée" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text, marginBottom: 12 }}>
          X suit une loi uniforme sur [0, 4]. Calculez E[X], E[X²], puis E[max(X − 2, 0)] = ∫[2, 4] (x−2) · (1/4) dx.
        </p>
        <Step num={1} accent={ACCENT}>Densité f(x) = 1/4 sur [0,4]. E[X] = ∫[0,4] x × (1/4) dx = (1/4) × [x²/2]₀⁴ = (1/4) × 8 = 2</Step>
        <Step num={2} accent={ACCENT}>E[X²] = ∫[0,4] x² × (1/4) dx = (1/4) × [x³/3]₀⁴ = (1/4) × 64/3 = 16/3 ≈ 5.33</Step>
        <Step num={3} accent={ACCENT}>E[max(X−2, 0)] = ∫[2,4] (x−2)/4 dx = (1/4) × [(x−2)²/2]₂⁴ = (1/4) × 2 = 0.5</Step>
        <FormulaBox accent={ACCENT}>E[X] = 2   |   E[X²] = 16/3   |   E[max(X−2, 0)] = 0.5</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
          La variable tronquée max(X−2, 0) est nulle pour X ≤ 2, puis croît linéairement. L'espérance de cette fonction tronquée est un concept fondamental en théorie des probabilités (espérance conditionnelle, loi des valeurs extrêmes).
        </div>
      </Accordion>
    </div>
  )
}

// ─── Tab: Exp & Log ───────────────────────────────────────────────────────────
export function ExpLogTab() {
  const [mu, setMu] = useState(0.08)
  const [sigma, setSigma] = useState(0.2)
  const [T2, setT2] = useState(1)

  const paths = useMemo(() => {
    const n = 252
    const dt = T2 / n
    const paths = []
    for (let p = 0; p < 5; p++) {
      let S = 100
      const pts = [{ t: 0, S: 100 }]
      for (let i = 1; i <= n; i++) {
        const Z = gaussRand()
        S *= Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * Z)
        if (i % 5 === 0) pts.push({ t: +(i * dt).toFixed(3), S: +S.toFixed(2) })
      }
      paths.push(pts)
    }
    return paths
  }, [mu, sigma, T2])

  function gaussRand() {
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  const E_ST = 100 * Math.exp(mu * T2)
  const logReturn = (mu - 0.5 * sigma * sigma) * T2

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        La distinction entre <strong style={{ color: T.text }}>croissance discrète</strong> et <strong style={{ color: T.text }}>croissance continue</strong> est fondamentale en finance. En croissance discrète, un capital C₀ placé à un taux annuel r pendant n périodes devient C₀ × (1 + r/m)^(m×n), où m est le nombre de capitalisations par an. Quand m → ∞ (capitalisation continue), la formule converge vers C₀ × e^(r×n) — c'est la capitalisation continue. Par exemple, 100€ à 5% continu pendant 2 ans donnent 100 × e^(0.10) = 110.52€, contre 100 × (1.05)² = 110.25€ en annuel discret. La capitalisation continue est préférée en finance quantitative car elle simplifie les formules (la somme de log-rendements correspond à la multiplication des facteurs de croissance).
      </div>
      <IntuitionBlock emoji="💰" title="Pourquoi log-rendement ?" accent={ACCENT}>
        Si vous avez 100€ et gagnez 10% deux années de suite :
        Rendement simple : 100 × 1.1 × 1.1 = 121€.
        Log-rendement : ln(121/100) = ln(1.1) + ln(1.1) — ils s'additionnent !
        Les log-rendements sont <strong>additifs dans le temps</strong>, ce qui est mathématiquement
        très pratique pour modéliser les prix financiers.
      </IntuitionBlock>

      <Grid cols={2} gap="12px">
        <FormulaBox accent={ACCENT} label="Rendement simple">
          r_simple = (S_t - S₀) / S₀
        </FormulaBox>
        <FormulaBox accent={ACCENT} label="Log-rendement (rendement continu)">
          r_log = ln(S_t / S₀) = ln(S_t) - ln(S₀)
        </FormulaBox>
      </Grid>

      <SectionTitle accent={ACCENT}>Propriétés fondamentales de ln et exp</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Ces propriétés sont utilisées constamment pour simplifier les calculs financiers.
      </div>
      <Grid cols={2} gap="10px">
        {[
          { rule: 'ln(a × b) = ln(a) + ln(b)', usage: 'Rendement total = somme des log-rendements : ln(S_T/S₀) = Σ ln(Sᵢ/Sᵢ₋₁)' },
          { rule: 'ln(a / b) = ln(a) - ln(b)', usage: 'Log-rendement relatif : ln(S_t/S₀) = ln(S_t) - ln(S₀)' },
          { rule: 'e^(a+b) = e^a × e^b', usage: 'Prix futur : S_T = S₀ × e^(µT) × e^(σ√T×Z)' },
          { rule: 'ln(e^x) = x  et  e^(ln x) = x', usage: 'Passage log↔exp : si ln(S_T/S₀)=0.1, alors S_T/S₀ = e^0.1 ≈ 1.105 (+10.5%)' },
          { rule: 'ln(xⁿ) = n × ln(x)', usage: 'Actualisation : ln(e^(-rT)) = -rT → facteur d\'actualisation = e^(-rT)' },
          { rule: "d/dx(e^x) = e^x", usage: 'Exp est sa propre dérivée → les EDOs financières ont des solutions exponentielles' },
        ].map(({ rule, usage }) => (
          <div key={rule} style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}22` }}>
            <code style={{ color: ACCENT, fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 700 }}>{rule}</code>
            <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.5 }}>{usage}</div>
          </div>
        ))}
      </Grid>

      <FormulaBox accent={ACCENT} label="GBM — Solution exacte (par lemme d'Itô)">
        S_T = S₀ × exp[(µ - σ²/2)×T + σ×√T×Z]   où Z ~ N(0,1)
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['S₀', 'Prix initial'],
        ['S_T', 'Prix à maturité T'],
        ['µ', 'Drift (rendement espéré annuel)'],
        ['σ', 'Volatilité annuelle'],
        ['T', 'Horizon temps (en années)'],
        ['Z', 'Variable aléatoire normale standard'],
        ['σ²/2', "Correction d'Itô : ajustement pour la log-normalité"],
      ]} />

      <IntuitionBlock emoji="🔧" title="La correction d'Itô : pourquoi soustraire σ²/2 ?" accent={ACCENT}>
        Voici l'une des subtilités les plus importantes du modèle GBM. Intuitivement, si S_T = S₀ × e^(µT), on s'attendrait à ce que E[S_T] = S₀ × e^(µT). C'est vrai ! Mais si on demande "quel est le log-rendement moyen ?", la réponse est E[ln(S_T/S₀)] = (µ - σ²/2) × T, <em>pas</em> µ × T. Pourquoi cette différence ?
        <br /><br />
        C'est l'<strong>inégalité de Jensen</strong> : pour une fonction convexe f, E[f(X)] ≥ f(E[X]). Ici, exp est convexe, donc E[e^X] ≥ e^(E[X]). En conséquence, E[S_T] = e^(µT + σ²T/2) {'>'} e^(µT). La "correction" -σ²/2 ajuste le drift log pour que E[S_T] = S₀ × e^(µT) reste cohérent.
        <br /><br />
        <strong>Exemple chiffré :</strong> imaginez deux scénarios équiprobables : +50% et -50%. La moyenne arithmétique est 0%, mais la moyenne géométrique est √(1.5 × 0.5) - 1 = √0.75 - 1 ≈ -13.4% ! La volatilité détruit de la valeur — c'est l'effet de la correction d'Itô dans le GBM.
      </IntuitionBlock>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="E[S_T]" value={`${E_ST.toFixed(1)}€`} accent={ACCENT} />
        <InfoChip label="E[ln(S_T/S₀)]" value={logReturn.toFixed(4)} accent={T.a4} />
        <InfoChip label="µ - σ²/2" value={(mu - 0.5 * sigma * sigma).toFixed(4)} accent={T.a5} />
      </div>

      <Grid cols={3} gap="10px">
        <Slider label="µ (drift)" value={mu} min={-0.3} max={0.5} step={0.01} onChange={setMu} accent={ACCENT} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ (volatilité)" value={sigma} min={0.05} max={0.8} step={0.01} onChange={setSigma} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="T (horizon)" value={T2} min={0.1} max={3} step={0.1} onChange={setT2} accent={T.a4} format={v => `${v.toFixed(1)}a`} />
      </Grid>

      <ChartWrapper title="5 trajectoires GBM (S₀=100€)" accent={ACCENT} height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="t" type="number" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Temps (années)', fill: T.muted, fontSize: 10, position: 'insideBottom', dy: 15 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            {paths.map((p, i) => (
              <Line key={i} data={p} type="monotone" dataKey="S" stroke={[ACCENT, T.a4, T.a5, T.a3, T.a6][i]} strokeWidth={1.5} dot={false} name={`Trajectoire ${i + 1}`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Loi log-normale de S_T : propriétés complètes</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Puisque ln(S_T/S₀) ~ N((µ-σ²/2)T, σ²T), S_T suit une loi log-normale dont on peut calculer tous les moments et probabilités.
      </div>
      <Grid cols={3} gap="10px">
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Espérance</div>
          <code style={{ color: T.text, fontSize: 12 }}>E[S_T] = S₀ × e^(µ×T)</code>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>Le drift µ pilote la croissance moyenne</div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Variance</div>
          <code style={{ color: T.text, fontSize: 12 }}>Var[S_T] = S₀² × e^(2µT) × (e^(σ²T) - 1)</code>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>Croît exponentiellement avec T et σ</div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Probabilité de dépasser K</div>
          <code style={{ color: T.text, fontSize: 12 }}>P(S_T {'>'} K) = N(d₂)</code>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>d₂ = [ln(S₀/K) + (µ-σ²/2)T] / (σ√T)</div>
        </div>
      </Grid>

      <Accordion title="Exercice — Probabilité de franchir un seuil" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Action avec S₀=100€, µ=8%, σ=25%, T=1 an. Calculez P(S_T {'>'} 120€).
        </p>
        <Step num={1} accent={ACCENT}>Calcul de d₂ : d₂ = [ln(100/120) + (0.08 - 0.25²/2)×1] / (0.25×√1)</Step>
        <Step num={2} accent={ACCENT}>ln(100/120) = ln(0.8333) = -0.1823. Drift corrigé : 0.08 - 0.03125 = 0.04875</Step>
        <Step num={3} accent={ACCENT}>d₂ = (-0.1823 + 0.04875) / 0.25 = -0.1336 / 0.25 = -0.5342</Step>
        <Step num={4} accent={ACCENT}>P(S_T {'>'} 120) = P(Z {'>'} -0.5342) = 1 - N(-0.5342) = N(0.5342) ≈ 0.7034</Step>
        <FormulaBox accent={ACCENT}>P(S_T {'>'} 120€) ≈ 70.3%</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
          Interprétation : avec un drift de 8% et une vol de 25%, il y a environ 70% de chances que l'action dépasse 120€ en 1 an. En pétrole : P(Brent {'>'} 96$/bbl) dans 1 an si on part de 80$/bbl avec µ=8%, σ=25%.
        </div>
      </Accordion>

      <ExampleBlock title="Propriété clé : ln(S_T/S₀) ~ N(µ̃T, σ²T)" accent={ACCENT}>
        <p>Pour S₀ = 80$/bbl (pétrole brut), µ = 10%, σ = 30%, T = 0.5 an :</p>
        <Step num={1} accent={ACCENT}>µ̃ = µ - σ²/2 = 0.10 - 0.09/2 = 0.055</Step>
        <Step num={2} accent={ACCENT}>E[ln(S_T/S₀)] = 0.055 × 0.5 = 0.0275</Step>
        <Step num={3} accent={ACCENT}>E[S_T] = 80 × e^(0.10 × 0.5) = 80 × 1.0513 = 84.1$/bbl</Step>
        <Step num={4} accent={ACCENT}>σ(ln S_T/S₀) = 0.30 × √0.5 = 0.212 → incertitude importante !</Step>
      </ExampleBlock>
    </div>
  )
}

// ─── Tab: Algèbre Linéaire ────────────────────────────────────────────────────
export function AlgebraTab() {
  const [rho, setRho] = useState(0.6)
  const [sigma1, setSigma1] = useState(0.2)
  const [sigma2, setSigma2] = useState(0.3)
  const [nPts, setNPts] = useState(200)

  function gaussRand() {
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  const scatterData = useMemo(() => {
    const pts = []
    for (let i = 0; i < nPts; i++) {
      const z1 = gaussRand()
      const z2 = gaussRand()
      const x = sigma1 * z1
      const y = sigma2 * (rho * z1 + Math.sqrt(1 - rho * rho) * z2)
      pts.push({ x: +x.toFixed(4), y: +y.toFixed(4) })
    }
    return pts
  }, [rho, sigma1, sigma2, nPts])

  const covXY = rho * sigma1 * sigma2
  const w1 = 0.6, w2 = 0.4
  const portVar = w1 * w1 * sigma1 * sigma1 + 2 * w1 * w2 * covXY + w2 * w2 * sigma2 * sigma2
  const portVol = Math.sqrt(portVar)

  return (
    <div>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        L'algèbre linéaire est le langage naturel de la finance multi-actifs. Un <strong style={{ color: T.text }}>portefeuille</strong> est un vecteur de positions w = (w₁, w₂, ..., wₙ) où wᵢ est le poids alloué à l'actif i. Les <strong style={{ color: T.text }}>rendements espérés</strong> forment un vecteur µ = (µ₁, µ₂, ..., µₙ). La <strong style={{ color: T.text }}>matrice de covariance</strong> Σ (de taille n×n) capture toutes les relations entre actifs : Σᵢᵢ = σᵢ² (variance de l'actif i), Σᵢⱼ = Cov(i,j) (covariance entre i et j). La variance du portefeuille s'écrit élégamment σ²_p = wᵀΣw — un simple produit de matrices. L'<strong style={{ color: T.text }}>optimisation de Markowitz</strong> (trouver le portefeuille de variance minimale pour un rendement cible) se résout avec des outils d'algèbre linéaire (multiplicateurs de Lagrange, inversion de matrices). Sur les marchés de l'énergie, Σ regroupe pétrole, gaz, électricité, charbon — des actifs aux dynamiques saisonnières et géopolitiques complexes.
      </div>
      <IntuitionBlock emoji="🗺️" title="Les matrices = transformations dans l'espace" accent={ACCENT}>
        Une matrice est un tableau de chiffres qui décrit comment transformer l'espace.
        En finance, la matrice de covariance décrit "comment les actifs bougent ensemble".
        Si pétrole et gaz montent souvent ensemble : corrélation ρ {'>'} 0 → le risque d'un portefeuille
        pétrole+gaz n'est pas simplement la somme des risques individuels !
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Matrice de covariance (2 actifs)</SectionTitle>
      <FormulaBox accent={ACCENT} label="Σ = matrice de variance-covariance">
        Σ = [ σ₁²      ρ·σ₁·σ₂ ]
            [ ρ·σ₁·σ₂  σ₂²     ]
      </FormulaBox>

      <div style={{ background: T.panel2, borderRadius: 8, padding: 16, margin: '12px 0', fontFamily: 'monospace', color: T.text, fontSize: 13 }}>
        Σ = [ {(sigma1 * sigma1).toFixed(4)}  {covXY.toFixed(4)} ]
            [ {covXY.toFixed(4)}  {(sigma2 * sigma2).toFixed(4)} ]
      </div>

      <FormulaBox accent={ACCENT} label="Variance de portefeuille (w₁=60%, w₂=40%)">
        σ²_p = w₁²σ₁² + 2w₁w₂ρσ₁σ₂ + w₂²σ₂² = wᵀΣw
      </FormulaBox>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <InfoChip label="Cov(X,Y)" value={covXY.toFixed(4)} accent={ACCENT} />
        <InfoChip label="σ_p" value={`${(portVol * 100).toFixed(1)}%`} accent={T.a4} />
        <InfoChip label="ρ" value={rho.toFixed(2)} accent={T.a3} />
      </div>

      <SectionTitle accent={ACCENT}>Corrélation vs Covariance</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        Covariance et corrélation mesurent toutes deux la co-variation de deux actifs, mais à des échelles différentes. La corrélation est la covariance "normalisée" : elle est sans unité et toujours comprise entre -1 et +1, ce qui facilite les comparaisons.
      </div>
      <FormulaBox accent={ACCENT} label="Corrélation de Pearson">
        ρ(X,Y) = Cov(X,Y) / (σ_X × σ_Y)   avec Cov(X,Y) = E[(X-µ_X)(Y-µ_Y)]
      </FormulaBox>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Mise en garde : corrélation ≠ causalité.</strong> WTI et Brent ont une corrélation de 0.96 car ils sont économiquement liés (mêmes acheteurs, arbitrage physique). Mais deux séries temporelles peuvent être corrélées sans lien causal (ex: corrélation spurieuse entre prix du gaz et ventes de crème glacée en été). En finance de l'énergie, identifier les vraies relations économiques derrière les corrélations statistiques est essentiel pour le hedging.
      </div>

      <Grid cols={2} gap="10px">
        <Slider label="Corrélation ρ" value={rho} min={-0.99} max={0.99} step={0.01} onChange={setRho} accent={T.a3} />
        <Slider label="σ₁ (Actif 1)" value={sigma1} min={0.05} max={0.6} step={0.01} onChange={setSigma1} accent={ACCENT} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="σ₂ (Actif 2)" value={sigma2} min={0.05} max={0.6} step={0.01} onChange={setSigma2} accent={T.a5} format={v => `${(v * 100).toFixed(0)}%`} />
        <Slider label="Nbre de points" value={nPts} min={50} max={500} step={50} onChange={setNPts} accent={T.muted} format={v => v.toFixed(0)} />
      </Grid>

      <ChartWrapper title={`Scatter plot : 2 actifs corrélés (ρ = ${rho.toFixed(2)})`} accent={ACCENT} height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="x" type="number" name="Rendement Actif 1" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Actif 1', fill: T.muted, fontSize: 11 }} />
            <YAxis dataKey="y" type="number" name="Rendement Actif 2" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'Actif 2', fill: T.muted, fontSize: 11, angle: -90 }} />
            <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8 }} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={scatterData} fill={ACCENT} fillOpacity={0.5} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <SectionTitle accent={ACCENT}>Valeurs propres, vecteurs propres et ACP</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 10 }}>
        La matrice de covariance Σ peut être décomposée en valeurs propres λᵢ et vecteurs propres vᵢ : Σ = V × Λ × Vᵀ. Cette décomposition a une interprétation géométrique et financière profonde.
      </div>
      <Grid cols={2} gap="10px">
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Vecteurs propres = directions de risque</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>Chaque vecteur propre vᵢ représente une "direction de risque principal" — une combinaison linéaire des actifs dont les rendements sont décorrélés des autres directions. C'est le principe de l'<strong>Analyse en Composantes Principales (ACP)</strong> appliquée aux marchés financiers.</div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Valeurs propres = variance expliquée</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>La valeur propre λᵢ est la variance du portefeuille aligné sur vᵢ. La part de variance expliquée par la i-ème composante est λᵢ / (Σλⱼ). Sur les marchés de l'énergie, la première composante (niveau général des prix) explique souvent 60-70% de la variance totale.</div>
        </div>
      </Grid>

      <IntuitionBlock emoji="✅" title="Σ doit être semi-définie positive" accent={ACCENT}>
        Une matrice de covariance valide doit être <strong>semi-définie positive (SDP)</strong> : pour tout vecteur de poids w, la variance du portefeuille wᵀΣw ≥ 0. En termes de valeurs propres, toutes doivent être ≥ 0. En pratique, cette propriété peut être violée quand on estime Σ sur peu de données (matrice dégénérée) ou quand on utilise des corrélations inconsistantes (ex: ρ(A,C) {'>'} ρ(A,B) × ρ(B,C) dans certaines configurations). La décomposition de Cholesky échoue si Σ n'est pas SDP — c'est une vérification utile en pratique.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Décomposition de Cholesky</SectionTitle>
      <IntuitionBlock emoji="🔧" title="Cholesky : générer des actifs corrélés" accent={ACCENT}>
        Pour simuler 2 actifs corrélés, on décompose Σ = L × Lᵀ (Cholesky).
        Puis : [X, Y] = L × [Z₁, Z₂]ᵀ où Z₁, Z₂ ~ N(0,1) indépendants.
        C'est exactement ce que fait le scatter plot ci-dessus !
      </IntuitionBlock>
      <FormulaBox accent={ACCENT} label="Cholesky pour 2 actifs">
        L = [ σ₁           0          ]
            [ ρ·σ₂    σ₂·√(1-ρ²)     ]

        X = σ₁·Z₁
        Y = ρ·σ₂·Z₁ + σ₂·√(1-ρ²)·Z₂
      </FormulaBox>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie de la décomposition de Cholesky</div>
        <Step num={1} accent={ACCENT}><strong>L est la matrice triangulaire inférieure</strong> telle que Σ = L·Lᵀ. Elle transforme des bruits indépendants ε ~ N(0,I) en un vecteur corrélé Z = L·ε ayant exactement la structure de covariance cible Σ.</Step>
        <Step num={2} accent={ACCENT}><strong>Chaque Z_i = Σⱼ L_ij · ε_j</strong> où ε ~ N(0,I) indépendant. Pour 2 actifs : Z₁ = σ₁·ε₁ (indépendant du second) ; Z₂ = ρ·σ₂·ε₁ + σ₂·√(1-ρ²)·ε₂ (mélange des deux bruits).</Step>
        <Step num={3} accent={ACCENT}><strong>Preuve de la correction :</strong> Cov(L·ε) = L·Cov(ε)·Lᵀ = L·I·Lᵀ = Σ ✓. La matrice identité Cov(ε) = I traduit l'indépendance des bruits ; L encode toute la structure de dépendance.</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : Cholesky est l'algorithme clé des simulations Monte Carlo multi-actifs. Si Σ n'est pas semi-définie positive (valeur propre négative), la décomposition échoue — c'est une vérification automatique de la cohérence de la matrice de corrélation.
        </div>
      </div>

      <ExampleBlock title="Pétrole & Gaz Naturel — Corrélation historique" accent={ACCENT}>
        <p>σ_oil = 30%, σ_gas = 40%, ρ = 0.5, portefeuille 50%/50%</p>
        <Step num={1} accent={ACCENT}>Cov = 0.5 × 0.30 × 0.40 = 0.060</Step>
        <Step num={2} accent={ACCENT}>σ²_p = 0.25×0.09 + 2×0.25×0.06 + 0.25×0.16 = 0.0225 + 0.03 + 0.04 = 0.0925</Step>
        <Step num={3} accent={ACCENT}>σ_p = √0.0925 = 30.4%</Step>
        <Step num={4} accent={ACCENT}>Si ρ = 0 → σ_p = √(0.25×0.09 + 0.25×0.16) = √0.0625 = 25.0%</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
          → La corrélation positive augmente le risque de 25% à 30.4%. La diversification fonctionne moins bien !
        </div>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice 0 — Décomposition de Cholesky à la main (2×2)" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Soit Σ = [[0.04, 0.018], [0.018, 0.09]] (σ₁=20%, σ₂=30%, ρ=0.3). Calculez la matrice triangulaire inférieure L telle que L×Lᵀ = Σ.
        </p>
        <Step num={1} accent={ACCENT}>L est de la forme [[l₁₁, 0], [l₂₁, l₂₂]]. Condition L×Lᵀ = Σ donne 3 équations.</Step>
        <Step num={2} accent={ACCENT}>l₁₁² = Σ₁₁ = 0.04 → l₁₁ = 0.20 (= σ₁, comme attendu)</Step>
        <Step num={3} accent={ACCENT}>l₂₁ × l₁₁ = Σ₂₁ = 0.018 → l₂₁ = 0.018 / 0.20 = 0.090 (= ρ × σ₂ = 0.3 × 0.30 ✓)</Step>
        <Step num={4} accent={ACCENT}>l₂₁² + l₂₂² = Σ₂₂ = 0.09 → l₂₂ = √(0.09 - 0.0081) = √0.0819 ≈ 0.2862 (= σ₂ × √(1-ρ²) ✓)</Step>
        <FormulaBox accent={ACCENT}>L = [[0.20, 0], [0.090, 0.2862]]</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
          Vérification : L×Lᵀ = [[0.04, 0.018], [0.018, 0.0081+0.0819]] = [[0.04, 0.018], [0.018, 0.09]] ✓. Pour simuler (X,Y) corrélés : X = 0.20×Z₁ ; Y = 0.090×Z₁ + 0.2862×Z₂ où Z₁, Z₂ ~ N(0,1) indépendants.
        </div>
      </Accordion>
      <Accordion title="Exercice 1 — Multiplication de matrices" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}>Calculez A × B avec A = [[1,2],[3,4]] et B = [[5],[6]]</p>
        <Step num={1} accent={ACCENT}>A × B = [[1×5 + 2×6], [3×5 + 4×6]]</Step>
        <FormulaBox accent={ACCENT}>= [[17], [39]]</FormulaBox>
      </Accordion>
      <Accordion title="Exercice 2 — Variance de portefeuille" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>3 actifs : w = [50%, 30%, 20%], σ = [20%, 25%, 35%], ρᵢⱼ = 0.3 ∀ i≠j. Calculez σ_p.</p>
        <Step num={1} accent={ACCENT}>σ²_p = Σᵢ wᵢ² σᵢ² + 2Σᵢ{'<'}ⱼ wᵢwⱼρσᵢσⱼ</Step>
        <Step num={2} accent={ACCENT}>Termes diagonaux : 0.25×0.04 + 0.09×0.0625 + 0.04×0.1225 = 0.01 + 0.005625 + 0.0049 = 0.020525</Step>
        <Step num={3} accent={ACCENT}>Termes croisés (×2) : 2[0.5×0.3×0.3×0.2×0.25 + 0.5×0.2×0.3×0.2×0.35 + 0.3×0.2×0.3×0.25×0.35]</Step>
        <Step num={4} accent={ACCENT}>= 2[0.00225 + 0.0021 + 0.001575] = 2×0.005925 = 0.01185</Step>
        <FormulaBox accent={ACCENT}>σ²_p = 0.020525 + 0.01185 = 0.032375 → σ_p ≈ 17.99% ≈ 18%</FormulaBox>
      </Accordion>
    </div>
  )
}

// ─── Main Module 1 ───────────────────────────────────────────────────────────
const TABS = ['Dérivées', 'Intégrales', 'Exp & Log', 'Algèbre Linéaire']

export default function Module1() {
  const [tab, setTab] = useState('Dérivées')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      <ModuleHeader
        num={1}
        title="Fondations Mathématiques"
        subtitle="Outils mathématiques fondamentaux pour la finance quantitative : dérivées (Greeks), intégrales (pricing), exp/log (GBM), algèbre linéaire (corrélations)."
        accent={ACCENT}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} accent={ACCENT} />
      {tab === 'Dérivées' && <DerivTab />}
      {tab === 'Intégrales' && <IntegTab />}
      {tab === 'Exp & Log' && <ExpLogTab />}
      {tab === 'Algèbre Linéaire' && <AlgebraTab />}
    </div>
  )
}
