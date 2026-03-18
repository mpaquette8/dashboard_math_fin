import React, { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { T } from '../../../design/tokens'
import {
  TabBar,
  Panel,
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
        Imaginez que vous conduisez. La position est <K>{"f(t)"}</K>, la vitesse est <K>{"f'(t)"}</K>.
        Si <K>{"f(t) = t^2"}</K>, votre position est le carré du temps. À <K>{"t = 3"}</K>s, votre vitesse est <K>{"f'(3) = 6"}</K> m/s.
        La dérivée mesure <em>à quelle vitesse la fonction change</em> en un point précis.
        En finance : si <K>{"C"}</K> est le prix d'un call et <K>{"S"}</K> le prix du sous-jacent, alors <K>{"\\Delta = \\frac{dC}{dS}"}</K>{" "}
        est "la vitesse" à laquelle le call réagit aux mouvements du sous-jacent.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Définition formelle">
        <K display>{"f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ["f'(x)", "Dérivée de f en x = pente de la tangente"],
        ["h", "Incrément infinitésimal → 0"],
        ["lim", "Limite : h tend vers 0 mais n'est jamais nul"],
      ]} />

      <IntuitionBlock emoji="⚡" title="Pourquoi h → 0 et pas h = 0 ?" accent={ACCENT}>
        Si on posait <K>{"h = 0"}</K> directement, on diviserait par zéro — ce qui est indéfini. La limite est une opération de <strong>passage à la limite</strong> : on étudie le comportement quand <K>{"h"}</K> devient arbitrairement petit, sans jamais l'atteindre. C'est exactement la distinction entre <strong>vitesse moyenne</strong> et <strong>vitesse instantanée</strong> : la vitesse moyenne sur <K>{"[t,\\, t+h]"}</K> vaut (distance parcourue)/<K>{"h"}</K>. Quand <K>{"h \\to 0"}</K>, on obtient la vitesse à l'instant <K>{"t"}</K>. De même, <K>{"\\frac{f(x+h)-f(x)}{h}"}</K> est le taux de variation moyen de <K>{"f"}</K> sur <K>{"[x,\\, x+h]"}</K> ; sa limite en <K>{"h \\to 0"}</K> est le taux de variation instantané, c'est-à-dire la dérivée.
      </IntuitionBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.text, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Dérivée partielle vs dérivée totale :</strong> Quand une fonction dépend de plusieurs variables — par exemple la température <K>{"T(x, y, t)"}</K> d'une plaque chauffante dépend des coordonnées <K>{"x"}</K>, <K>{"y"}</K> et du temps <K>{"t"}</K> — on distingue deux notions. La <strong>dérivée partielle <K>{"\\frac{\\partial T}{\\partial x}"}</K></strong> mesure le gradient thermique horizontal en maintenant <K>{"y"}</K> et <K>{"t"}</K> constants. La <strong>dérivée totale <K>{"dT"}</K></strong> capture la variation complète quand toutes les variables évoluent simultanément : <K>{"dT = \\frac{\\partial T}{\\partial x}dx + \\frac{\\partial T}{\\partial y}dy + \\frac{\\partial T}{\\partial t}dt"}</K>. Cette décomposition est universelle : en mécanique, en thermodynamique, en toute discipline multi-variable.
      </div>

      <SectionTitle accent={ACCENT}>Dérivées partielles — Technique pas à pas</SectionTitle>
      <IntuitionBlock emoji="🔒" title='Principe fondamental : "geler" les autres variables' accent={ACCENT}>
        Pour calculer <K>{"\\frac{\\partial f}{\\partial x}"}</K>, on traite toutes les variables autres que <K>{"x"}</K> comme des <strong>constantes</strong> et on applique les règles habituelles. C'est tout !
        <br /><br />
        <strong>Analogie :</strong> imaginez une carte topographique <K>{"f(x, y)"}</K>. La dérivée <K>{"\\frac{\\partial f}{\\partial x}"}</K> est la pente quand vous marchez vers l'Est (<K>{"x"}</K> croît, <K>{"y"}</K> fixe). La dérivée <K>{"\\frac{\\partial f}{\\partial y}"}</K> est la pente vers le Nord (<K>{"y"}</K> croît, <K>{"x"}</K> fixe). Deux sensibilités différentes pour la même surface.
        <br /><br />
        En physique : <K>{"\\frac{\\partial P}{\\partial T}"}</K> (pression par rapport à la température, volume fixé) répond à "comment varie la pression si je chauffe à volume constant ?" — c'est la loi de Gay-Lussac.
      </IntuitionBlock>

      <div style={{ background: T.panel2, borderRadius: 10, padding: 16, margin: '14px 0', border: `1px solid ${ACCENT}33` }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Exemple 1 — Polynôme à 2 variables : <K>{"f(x,y) = 3x^2y + 2xy^3"}</K></div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>Calcul de <strong style={{ color: T.text }}><K>{"\\frac{\\partial f}{\\partial x}"}</K></strong> (on gèle <K>{"y"}</K>) :</div>
        <Step num={1} accent={ACCENT}>Terme <K>{"3x^2y"}</K> : <K>{"y"}</K> est une constante multiplicative → dériver <K>{"x^2 \\to 2x"}</K> → contribution : <K>{"3 \\cdot (2x) \\cdot y = 6xy"}</K></Step>
        <Step num={2} accent={ACCENT}>Terme <K>{"2xy^3"}</K> : <K>{"y^3"}</K> est une constante multiplicative → dériver <K>{"x \\to 1"}</K> → contribution : <K>{"2 \\cdot 1 \\cdot y^3 = 2y^3"}</K></Step>
        <FormulaBox accent={ACCENT}><K display>{"\\frac{\\partial f}{\\partial x} = 6xy + 2y^3"}</K></FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, margin: '10px 0 8px' }}>Calcul de <strong style={{ color: T.text }}><K>{"\\frac{\\partial f}{\\partial y}"}</K></strong> (on gèle <K>{"x"}</K>) :</div>
        <Step num={3} accent={ACCENT}>Terme <K>{"3x^2y"}</K> : <K>{"x^2"}</K> est une constante multiplicative → dériver <K>{"y \\to 1"}</K> → contribution : <K>{"3x^2 \\cdot 1 = 3x^2"}</K></Step>
        <Step num={4} accent={ACCENT}>Terme <K>{"2xy^3"}</K> : <K>{"x"}</K> est une constante multiplicative → dériver <K>{"y^3 \\to 3y^2"}</K> → contribution : <K>{"2x \\cdot (3y^2) = 6xy^2"}</K></Step>
        <FormulaBox accent={ACCENT}><K display>{"\\frac{\\partial f}{\\partial y} = 3x^2 + 6xy^2"}</K></FormulaBox>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Vérification en <K>{"(x=1, y=2)"}</K> : <K>{"\\frac{\\partial f}{\\partial x} = 6 \\times 1 \\times 2 + 2 \\times 8 = 12 + 16 = 28"}</K>. Si <K>{"x"}</K> monte de 1 (<K>{"x: 1 \\to 2"}</K>), <K>{"f"}</K> varie d'environ 28.
          <br /><K>{"\\frac{\\partial f}{\\partial y} = 3 \\times 1 + 6 \\times 1 \\times 4 = 3 + 24 = 27"}</K>. Si <K>{"y"}</K> monte de 1 (<K>{"y: 2 \\to 3"}</K>), <K>{"f"}</K> varie d'environ 27.
        </div>
      </div>

      <div style={{ background: T.panel2, borderRadius: 10, padding: 16, margin: '14px 0', border: `1px solid ${ACCENT}33` }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Exemple 2 — Énergie cinétique : <K>{"E(m, v) = \\frac{1}{2} m v^2"}</K></div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}><K>{"E"}</K> = énergie cinétique d'un objet de masse <K>{"m"}</K> se déplaçant à vitesse <K>{"v"}</K>. Deux dérivées partielles, deux sensibilités physiques :</div>
        <Step num={1} accent={ACCENT}><K>{"\\frac{\\partial E}{\\partial m}"}</K> (<K>{"v"}</K> constant) : <K>{"v^2"}</K> est un facteur constant → <K>{"\\frac{\\partial E}{\\partial m} = \\frac{v^2}{2}"}</K>. Interprétation : 1 kg de masse supplémentaire ajoute <K>{"\\frac{v^2}{2}"}</K> joules d'énergie cinétique.</Step>
        <Step num={2} accent={ACCENT}><K>{"\\frac{\\partial E}{\\partial v}"}</K> (<K>{"m"}</K> constant) : règle de puissance sur <K>{"v^2"}</K> → <K>{"\\frac{\\partial E}{\\partial v} = mv"}</K>. C'est la quantité de mouvement ! Doubler la vitesse quadruple l'énergie, mais la sensibilité marginale (dérivée) est proportionnelle à <K>{"v"}</K>.</Step>
        <FormulaBox accent={ACCENT}><K display>{"\\frac{\\partial E}{\\partial m} = \\frac{v^2}{2} \\quad|\\quad \\frac{\\partial E}{\\partial v} = mv"}</K></FormulaBox>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Exemple numérique : <K>{"m = 1\\,000"}</K> kg (voiture), <K>{"v = 30"}</K> m/s. <K>{"\\frac{\\partial E}{\\partial v} = 1000 \\times 30 = 30\\,000"}</K> N (newtons).
          Si la vitesse augmente de 1 m/s (de 30 à 31 m/s), l'énergie cinétique augmente d'environ 30 000 J.
        </div>
      </div>

      <div style={{ background: T.panel2, borderRadius: 10, padding: 16, margin: '14px 0', border: `1px solid ${ACCENT}33` }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Exemple 3 — Loi des gaz parfaits : <K>{"P(n, T, V) = \\frac{nRT}{V}"}</K></div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 12 }}>
          <K>{"P"}</K> = pression, <K>{"n"}</K> = quantité (moles), <K>{"T"}</K> = température (K), <K>{"V"}</K> = volume (L), <K>{"R = 8.314"}</K> J/(mol·K) constante.
          <br />Quatre variables, quatre dérivées partielles — chacune correspond à une loi physique classique.
        </div>
        <Step num={1} accent={ACCENT}>
          <K>{"\\frac{\\partial P}{\\partial n}"}</K> (<K>{"T"}</K>, <K>{"V"}</K> constants) : <K>{"\\frac{RT}{V}"}</K> est un facteur constant.
          → <K>{"\\frac{\\partial P}{\\partial n} = \\frac{RT}{V}"}</K>. Ajouter une mole de gaz augmente la pression de <K>{"\\frac{RT}{V}"}</K>.
        </Step>
        <Step num={2} accent={ACCENT}>
          <K>{"\\frac{\\partial P}{\\partial T}"}</K> (<K>{"n"}</K>, <K>{"V"}</K> constants) : <K>{"\\frac{nR}{V}"}</K> est constant.
          → <K>{"\\frac{\\partial P}{\\partial T} = \\frac{nR}{V}"}</K>. Loi de Gay-Lussac : à volume fixé, <K>{"P"}</K> est proportionnelle à <K>{"T"}</K>.
        </Step>
        <Step num={3} accent={ACCENT}>
          <K>{"\\frac{\\partial P}{\\partial V}"}</K> (<K>{"n"}</K>, <K>{"T"}</K> constants) : règle de puissance sur <K>{"\\frac{1}{V} = V^{-1}"}</K>.
          → <K>{"\\frac{\\partial P}{\\partial V} = -\\frac{nRT}{V^2}"}</K>. Loi de Boyle-Mariotte : comprimer le gaz augmente la pression (signe négatif : <K>{"P"}</K> décroît quand <K>{"V"}</K> croît).
        </Step>
        <FormulaBox accent={ACCENT}><K display>{"\\frac{\\partial P}{\\partial n} = \\frac{RT}{V} \\quad|\\quad \\frac{\\partial P}{\\partial T} = \\frac{nR}{V} \\quad|\\quad \\frac{\\partial P}{\\partial V} = -\\frac{nRT}{V^2}"}</K></FormulaBox>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Exemple : <K>{"n=1"}</K> mol, <K>{"T=300"}</K> K, <K>{"V=10"}</K> L. <K>{"P = \\frac{1 \\times 8.314 \\times 300}{10} = 249.4"}</K> kPa.
          <K>{"\\frac{\\partial P}{\\partial T} = \\frac{8.314}{10} = 0.83"}</K> kPa/K → chauffer de 1 K augmente la pression d'environ 0.83 kPa.
        </div>
      </div>

      <SectionTitle accent={ACCENT}>Règles essentielles</SectionTitle>

      <IntuitionBlock emoji="🔗" title="Le symbole ∘ : composition de fonctions" accent={ACCENT}>
        <strong>f∘g</strong> se lit <em>« f rond g »</em> et signifie : appliquer <K>{"g"}</K> d'abord, puis <K>{"f"}</K> sur le résultat.
        <br /><br />
        <K display>{"(f \\circ g)(x) = f(g(x))"}</K>
        Exemple : avec <K>{"f(u) = \\sin(u)"}</K> et <K>{"g(x) = x^2"}</K>, on a <K>{"(f \\circ g)(x) = \\sin(x^2)"}</K> — on calcule d'abord <K>{"x^2"}</K>, puis on prend le sinus de ce résultat.
        <br /><br />
        La <strong>règle de chaîne</strong> donne la dérivée d'une telle composition : la dérivée de l'extérieur multipliée par la dérivée de l'intérieur.
      </IntuitionBlock>

      <Grid cols={2} gap="10px">

        {/* Puissance */}
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.border}` }}>
          <div style={{ color: ACCENT, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Puissance</div>
          <K display>{"\\frac{d}{dx}(x^n) = n \\cdot x^{n-1}"}</K>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>Ex. : <K>{"\\frac{d}{dx}(x^3) = 3x^2"}</K></div>
        </div>

        {/* Produit */}
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.border}` }}>
          <div style={{ color: ACCENT, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Produit</div>
          <K display>{"(u \\cdot v)' = u'v + uv'"}</K>
        </div>

        {/* Quotient */}
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.border}` }}>
          <div style={{ color: ACCENT, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Quotient</div>
          <K display>{"\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}"}</K>
        </div>

        {/* Chaîne */}
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.border}` }}>
          <div style={{ color: ACCENT, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Chaîne (composition)</div>
          <K display>{"(f \\circ g)'(x) = f'(g(x)) \\cdot g'(x)"}</K>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>
            <strong style={{ color: T.text }}>∘ = composition</strong> : appliquer <K>{"g"}</K> en premier, <K>{"f"}</K> ensuite.<br />
            Ex. : <K>{"h(x) = \\sin(x^2)"}</K> → <K>{"h'(x) = \\cos(x^2) \\cdot 2x"}</K>
          </div>
        </div>

        {/* Exponentielle */}
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.border}` }}>
          <div style={{ color: ACCENT, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Exponentielle</div>
          <K display>{"\\frac{d}{dx}(e^x) = e^x"}</K>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>Variante : <K>{"\\frac{d}{dx}(e^{ax}) = a \\cdot e^{ax}"}</K></div>
        </div>

        {/* Logarithme */}
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.border}` }}>
          <div style={{ color: ACCENT, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Logarithme</div>
          <K display>{"\\frac{d}{dx}(\\ln x) = \\frac{1}{x}"}</K>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 4, lineHeight: 1.7 }}>
            <strong style={{ color: T.text }}>Et aussi</strong> : <K>{"\\frac{d}{dx}(\\ln(ax)) = \\frac{1}{x}"}</K> — le <K>{"a"}</K> se simplifie.<br />
            <em>Par règle de chaîne :</em> <K>{"\\frac{1}{ax} \\cdot a = \\frac{1}{x}"}</K><br />
            <em>Par propriété log :</em> <K>{"\\ln(ax) = \\ln a + \\ln x"}</K>, et <K>{"\\ln a"}</K> est une constante → dérivée nulle.
          </div>
        </div>

        {/* Sinus & Cosinus */}
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.border}` }}>
          <div style={{ color: ACCENT, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Sinus & Cosinus</div>
          <K display>{"\\frac{d}{dx}(\\sin x) = \\cos x"}</K>
          <K display>{"\\frac{d}{dx}(\\cos x) = -\\sin x"}</K>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 4, lineHeight: 1.7 }}>
            <strong style={{ color: T.text }}>Avec règle de chaîne</strong> (u = u(x)) :<br />
            <K>{"\\frac{d}{dx}(\\sin(u)) = u' \\cdot \\cos(u)"}</K><br />
            <K>{"\\frac{d}{dx}(\\cos(u)) = -u' \\cdot \\sin(u)"}</K><br />
            Ex. : <K>{"(\\sin(3x))' = 3\\cos(3x)"}</K>, <K>{"(\\cos(x^2))' = -2x\\sin(x^2)"}</K><br />
            <em>Cycle mnémotechnique :</em> sin → cos → −sin → −cos → sin (période 4)
          </div>
        </div>

        {/* Tangente & trigo inverse */}
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.border}` }}>
          <div style={{ color: ACCENT, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Tangente & trigo inverse</div>
          <K display>{"\\frac{d}{dx}(\\tan x) = \\frac{1}{\\cos^2 x} = 1 + \\tan^2 x"}</K>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 2, lineHeight: 1.7 }}>
            <K>{"\\frac{d}{dx}(\\arcsin x) = \\dfrac{1}{\\sqrt{1-x^2}}"}</K><br />
            <K>{"\\frac{d}{dx}(\\arccos x) = -\\dfrac{1}{\\sqrt{1-x^2}}"}</K><br />
            <K>{"\\frac{d}{dx}(\\arctan x) = \\dfrac{1}{1+x^2}"}</K>
          </div>
        </div>

      </Grid>

      <SectionTitle accent={ACCENT}>Applications des dérivées — Développement de Taylor</SectionTitle>
      <IntuitionBlock emoji="💡" title="Approximation locale : le développement de Taylor" accent={ACCENT}>
        La dérivée permet d'<strong>approximer localement</strong> toute fonction différentiable. Autour d'un point <K>{"x_0"}</K>, on peut écrire :
        <br /><br />
        <K display>{"f(x_0 + \\Delta x) \\approx f(x_0) + f'(x_0) \\cdot \\Delta x + \\frac{1}{2} f''(x_0) \\cdot \\Delta x^2"}</K>
        <br /><br />
        — Le premier terme <K>{"f'(x_0) \\cdot \\Delta x"}</K> est la contribution linéaire (pente tangente).<br />
        — Le deuxième terme <K>{"\\frac{1}{2} f''(x_0) \\cdot \\Delta x^2"}</K> est la correction de courbure (dérivée seconde).<br />
        <br />
        Cette décomposition est universelle : en optique (aberrations), en mécanique (oscillateurs), en numérique (méthodes de Newton).
      </IntuitionBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Exemple — Approximation de <K>{"\\sin(x)"}</K> autour de <K>{"x_0 = 0"}</K></div>
        <Step num={1} accent={ACCENT}><K>{"f(x) = \\sin(x)"}</K>. En <K>{"x_0 = 0"}</K> : <K>{"f(0) = 0"}</K>, <K>{"f'(x) = \\cos(x) \\Rightarrow f'(0) = 1"}</K>, <K>{"f''(x) = -\\sin(x) \\Rightarrow f''(0) = 0"}</K>.</Step>
        <Step num={2} accent={ACCENT}>Taylor ordre 1 : <K>{"\\sin(x) \\approx x"}</K>. Précision : <K>{"\\sin(0.1) \\approx 0.100"}</K> vs exact 0.0998. Erreur {'<'} 0.2%.</Step>
        <Step num={3} accent={ACCENT}>Taylor ordre 3 : <K>{"\\sin(x) \\approx x - \\frac{x^3}{6}"}</K>. Précision : <K>{"\\sin(0.5) \\approx 0.479"}</K> vs exact 0.479. Erreur {'<'} 0.01%.</Step>
        <FormulaBox accent={ACCENT}><K display>{"\\sin(x) \\approx x - \\frac{x^3}{6} + \\frac{x^5}{120} - \\cdots"}</K>{" "}(série entière autour de 0)</FormulaBox>
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
        <p style={{ color: T.text, marginBottom: 12 }}>Calculez <K>{"f'(x)"}</K> pour <K>{"f(x) = 3x^4 - 2x^2 + 5x - 7"}</K></p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"f'(x) = 12x^3 - 4x + 5"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Linéarité de la dérivée" ruleDetail="(af + bg)' = af' + bg'" accent={ACCENT}>
            On dérive chaque terme séparément : <K>{"f'(x) = \\frac{d}{dx}(3x^4) - \\frac{d}{dx}(2x^2) + \\frac{d}{dx}(5x) - \\frac{d}{dx}(7)"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Règle de puissance" ruleDetail="d/dx(xⁿ) = n·xⁿ⁻¹" accent={ACCENT}>
            <K>{"\\frac{d}{dx}(3x^4) = 3 \\times 4x^{4-1} = 12x^3"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Règle de puissance" ruleDetail="d/dx(xⁿ) = n·xⁿ⁻¹" accent={ACCENT}>
            <K>{"\\frac{d}{dx}(-2x^2) = -2 \\times 2x^{2-1} = -4x"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Dérivée d'un monôme et constante" ruleDetail="d/dx(cx) = c, d/dx(c) = 0" accent={ACCENT}>
            <K>{"\\frac{d}{dx}(5x) = 5"}</K> et <K>{"\\frac{d}{dx}(-7) = 0"}</K> (la dérivée d'une constante est toujours 0)
          </DemoStep>
          <FormulaBox accent={ACCENT} label="Résultat final"><K>{"f'(x) = 12x^3 - 4x + 5"}</K></FormulaBox>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 2 — Règle de chaîne : vitesse d'une fusée" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          La distance d'une fusée est <K>{"d(t) = 3t^2 + 2t"}</K>. Calculez la vitesse <K>{"v(t) = d'(t)"}</K> et l'accélération <K>{"a(t) = v'(t)"}</K>.
        </p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"v(t) = 6t + 2 \\quad|\\quad a(t) = 6"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Règle de puissance" ruleDetail="d/dt(tⁿ) = n·tⁿ⁻¹" accent={ACCENT}>
            <K>{"v(t) = d'(t) = \\frac{d}{dt}(3t^2 + 2t)"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Linéarité de la dérivée" ruleDetail="(af + bg)' = af' + bg'" accent={ACCENT}>
            <K>{"v(t) = 3 \\cdot 2t + 2 \\cdot 1 = 6t + 2"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Règle de puissance (ordre 2)" ruleDetail="Accélération = dérivée de la vitesse" accent={ACCENT}>
            <K>{"a(t) = v'(t) = \\frac{d}{dt}(6t + 2) = 6"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Évaluation numérique" accent={ACCENT}>
            À <K>{"t = 3"}</K>s : <K>{"v(3) = 6 \\times 3 + 2 = 20"}</K> m/s. L'accélération est constante (<K>{"6"}</K> m/s²) : la fusée gagne 6 m/s chaque seconde.
          </DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 3 — Règle de chaîne : composition de fonctions" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Soit <K>{"h(x) = \\sin(x^2)"}</K>. Calculez <K>{"h'(x)"}</K> par la règle de chaîne.
        </p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"h'(x) = 2x \\cdot \\cos(x^2)"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Identification de la composition" ruleDetail="h = f ∘ g → appliquer la règle de chaîne" accent={ACCENT}>
            Poser <K>{"g(x) = x^2"}</K> (fonction intérieure) et <K>{"f(u) = \\sin(u)"}</K> (fonction extérieure), donc <K>{"h(x) = f(g(x))"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Dérivation des fonctions élémentaires" ruleDetail="(xⁿ)' = nxⁿ⁻¹, (sin u)' = cos u" accent={ACCENT}>
            <K>{"g'(x) = 2x"}</K> et <K>{"f'(u) = \\cos(u)"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Règle de la chaîne" ruleDetail="(f∘g)'(x) = f'(g(x)) · g'(x)" accent={ACCENT}>
            <K>{"h'(x) = f'(g(x)) \\cdot g'(x) = \\cos(x^2) \\cdot 2x = 2x\\cos(x^2)"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Vérification numérique" accent={ACCENT}>
            En <K>{"x = \\sqrt{\\pi/2}"}</K> : <K>{"h' = 2\\sqrt{\\pi/2} \\cdot \\cos(\\pi/2) = 0"}</K> — point stationnaire (extremum local).
          </DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 4 — Dérivées partielles : surface d'un cylindre" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          La surface latérale d'un cylindre est <K>{"S(r, h) = 2\\pi r h"}</K>. Calculez <K>{"\\frac{\\partial S}{\\partial r}"}</K> et <K>{"\\frac{\\partial S}{\\partial h}"}</K>, puis évaluez-les en <K>{"r=3, h=10"}</K>.
        </p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"\\left.\\frac{\\partial S}{\\partial r}\\right|_{(3,10)} \\approx 62.8 \\quad|\\quad \\left.\\frac{\\partial S}{\\partial h}\\right|_{(3,10)} \\approx 18.8"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Dérivée partielle" ruleDetail="∂/∂r : traiter h comme constante" accent={ACCENT}>
            <K>{"\\frac{\\partial S}{\\partial r} = \\frac{\\partial}{\\partial r}(2\\pi r h) = 2\\pi h"}</K> (h est une constante, on dérive r → facteur 1)
          </DemoStep>
          <DemoStep num={2} rule="Dérivée partielle" ruleDetail="∂/∂h : traiter r comme constante" accent={ACCENT}>
            <K>{"\\frac{\\partial S}{\\partial h} = \\frac{\\partial}{\\partial h}(2\\pi r h) = 2\\pi r"}</K> (r est une constante, on dérive h → facteur 1)
          </DemoStep>
          <DemoStep num={3} rule="Évaluation numérique" accent={ACCENT}>
            En r=3, h=10 : <K>{"\\frac{\\partial S}{\\partial r} = 2\\pi \\times 10 \\approx 62.8"}</K> cm²/cm
          </DemoStep>
          <DemoStep num={4} rule="Évaluation numérique" accent={ACCENT}>
            En r=3, h=10 : <K>{"\\frac{\\partial S}{\\partial h} = 2\\pi \\times 3 \\approx 18.8"}</K> cm²/cm.
            Interprétation : augmenter le rayon de 1 cm ajoute ~63 cm² (car le rayon intervient dans toute la circonférence) vs ~19 cm² pour la hauteur.
          </DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 5 — Taylor : approximation de e^x" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Approximez <K>{"e^{0.3}"}</K> avec un développement de Taylor d'ordre 3 autour de <K>{"x_0 = 0"}</K>. Comparez à la valeur exacte.
        </p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"e^{0.3} \\approx 1.3495 \\quad (\\text{exact : } 1.34986\\ldots)"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Dérivées de l'exponentielle" ruleDetail="d/dx(eˣ) = eˣ, toutes les dérivées sont identiques" accent={ACCENT}>
            <K>{"f(x) = e^x"}</K> → toutes les dérivées valent <K>{"e^x"}</K>. En <K>{"x_0 = 0"}</K> : <K>{"f(0) = f'(0) = f''(0) = f'''(0) = 1"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Formule de Taylor" ruleDetail="f(x) ≈ Σ f⁽ⁿ⁾(x₀)/n! · (x−x₀)ⁿ" accent={ACCENT}>
            Taylor ordre 3 : <K>{"e^x \\approx 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} = 1 + x + \\frac{x^2}{2} + \\frac{x^3}{6}"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Substitution numérique" accent={ACCENT}>
            En x = 0.3 : <K>{"1 + 0.3 + \\frac{0.09}{2} + \\frac{0.027}{6} = 1 + 0.3 + 0.045 + 0.0045 = 1.3495"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Calcul d'erreur relative" accent={ACCENT}>
            Erreur = <K>{"\\frac{|1.34986 - 1.3495|}{1.34986} \\approx 0.027\\%"}</K>. Trois termes suffisent pour une précision au millième.
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

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

  const integral = useMemo(() => {
    let s = 0
    for (let x = a; x < b; x += dx) s += fn.f(x + dx / 2) * dx
    return s
  }, [fnType, a, b])

  return (
    <div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — PRIMITIVES
          ══════════════════════════════════════════════════════════════════ */}

      <IntuitionBlock emoji="🔄" title="Remonter le temps : retrouver la position à partir de la vitesse" accent={ACCENT}>
        <p style={{ margin: '0 0 10px' }}>
          Imaginons un GPS en panne. Vous connaissez votre <strong>vitesse à chaque instant</strong> (le compteur fonctionne),
          mais l'écran de position est éteint. La <strong>primitive</strong> (ou intégrale indéfinie) est exactement
          l'opération qui <em>remonte</em> de la vitesse vers la position : si <K>{"f(t)"}</K> est votre
          vitesse à l'instant <K>{"t"}</K>, alors sa primitive <K>{"F(t)"}</K> est votre position.
          La dérivée et la primitive sont des opérations <strong>inverses l'une de l'autre</strong>.
        </p>
        <p style={{ margin: '0 0 10px' }}>
          <strong>Analogie 2 — la caisse enregistreuse :</strong> un commerçant enregistre le
          <em> flux de ventes par heure</em> <K>{"f(t)"}</K> (en €/h). Sa primitive <K>{"F(t)"}</K>
          est le <em>chiffre d'affaires cumulé</em> depuis l'ouverture. Calculer la dérivée de <K>{"F"}</K>
          redonne le flux instantané <K>{"f"}</K> ; calculer la primitive de <K>{"f"}</K> redonne le
          chiffre d'affaires <K>{"F"}</K>. Le <strong>+C</strong> traduit le fait qu'on ne sait pas
          si la caisse était déjà pleine à l'ouverture.
        </p>
        <p style={{ margin: 0 }}>
          En pratique, trouver une primitive c'est <em>lire la table de dérivation à l'envers</em> :
          si vous savez que la dérivée de <K>{"x^2"}</K> est <K>{"2x"}</K>, alors une primitive
          de <K>{"2x"}</K> est <K>{"x^2"}</K>.
        </p>
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>📐 Définition — qu'est-ce qu'une primitive ?</SectionTitle>

      <FormulaBox accent={ACCENT} label="Définition : primitive de f">
        <K display>{"\\underbrace{F(x)}_{\\text{primitive cherchée}} \\text{ est une primitive de } \\underbrace{f(x)}_{\\text{fonction donnée}} \;\\Longleftrightarrow\; \\underbrace{F'(x) = f(x)}_{\\text{condition de vérification}} \\quad \\forall x \\in I"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['F(x)', 'Primitive — fonction dont la dérivée vaut f'],
        ['f(x)', 'Fonction de départ (celle dont on cherche la primitive)'],
        ['C', 'Constante arbitraire réelle — valeur inconnue sans condition initiale'],
        ['I', 'Intervalle sur lequel f est définie et continue'],
      ]} />

      <SectionTitle accent={ACCENT}>➕ Pourquoi toujours écrire « + C » ?</SectionTitle>

      <Panel accent={ACCENT} style={{ marginBottom: 16 }}>
        <p style={{ color: 'inherit', margin: '0 0 10px' }}>
          Si <K>{"F(x)"}</K> est une primitive de <K>{"f(x)"}</K>, alors <K>{"F(x) + C"}</K>
          l'est aussi pour <em>n'importe quelle constante</em> <K>{"C \\in \\mathbb{R}"}</K>,
          car la dérivée d'une constante est toujours zéro :
        </p>
        <K display>{"\\bigl(F(x) + C\\bigr)' = F'(x) + 0 = f(x) \\checkmark"}</K>
        <p style={{ color: 'inherit', margin: '10px 0 0' }}>
          <strong>Image géométrique :</strong> les courbes <K>{"y = x^2 + 1"}</K>, <K>{"y = x^2 - 3"}</K>,
          <K>{"y = x^2 + 7"}</K> ont toutes la même dérivée <K>{"2x"}</K> — ce sont des <em>paraboles
          parallèles décalées verticalement</em>. Le <K>{"+ C"}</K> choisit laquelle de ces courbes
          passe par un point donné (condition initiale).
        </p>
      </Panel>

      <SectionTitle accent={ACCENT}>📋 Primitives usuelles — la table de référence</SectionTitle>

      <Panel accent={ACCENT} style={{ marginBottom: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${ACCENT}44` }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: ACCENT }}>Fonction <K>{"f(x)"}</K></th>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: ACCENT }}>Primitive <K>{"F(x) + C"}</K></th>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: ACCENT }}>Vérification</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: ACCENT }}>Exemple</th>
            </tr>
          </thead>
          <tbody>
            {[
              { f: 'k \\text{ (cste)}', F: 'kx + C', v: 'k', ex: '5 → 5x+C' },
              { f: 'x^n \;(n\\neq -1)', F: '\\dfrac{x^{n+1}}{n+1} + C', v: 'x^n', ex: 'x³ → x⁴/4+C' },
              { f: '\\dfrac{1}{x}', F: '\\ln|x| + C', v: '1/x', ex: '1/x → ln|x|+C' },
              { f: 'e^x', F: 'e^x + C', v: 'e^x', ex: 'eˣ → eˣ+C' },
              { f: 'e^{ax}\;(a\\neq 0)', F: '\\dfrac{e^{ax}}{a} + C', v: 'e^{ax}', ex: 'e^{3x} → e^{3x}/3+C' },
              { f: '\\sin x', F: '-\\cos x + C', v: '\\sin x', ex: 'sin x → −cos x+C' },
              { f: '\\cos x', F: '\\sin x + C', v: '\\cos x', ex: 'cos x → sin x+C' },
              { f: '\\dfrac{1}{\\sqrt{1-x^2}}', F: '\\arcsin x + C', v: '1/\\sqrt{1-x^2}', ex: '→ arcsin x+C' },
              { f: '\\dfrac{1}{1+x^2}', F: '\\arctan x + C', v: '1/(1+x^2)', ex: '→ arctan x+C' },
            ].map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? `${ACCENT}0a` : 'transparent', borderBottom: `1px solid ${ACCENT}22` }}>
                <td style={{ padding: '7px 12px' }}><K>{row.f}</K></td>
                <td style={{ padding: '7px 12px' }}><K>{row.F}</K></td>
                <td style={{ padding: '7px 12px', color: ACCENT, fontSize: 12 }}><K>{row.v}</K> ✓</td>
                <td style={{ padding: '7px 12px', fontSize: 12, color: T.muted }}>{row.ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel accent={ACCENT} style={{ fontStyle: 'italic', textAlign: 'center', marginBottom: 20 }}>
        Trouver une primitive = lire la table de dérivation à l'envers.
        La vérification est <strong>toujours possible</strong> : dériver le résultat doit redonner <K>{"f(x)"}</K>.
      </Panel>

      <SectionTitle accent={ACCENT}>⚖️ Dérivation vs Primitivation — comparaison côte à côte</SectionTitle>

      <Grid cols={2} gap="14px">
        <Panel accent={ACCENT}>
          <div style={{ fontWeight: 700, color: ACCENT, marginBottom: 10 }}>⬇️ Dérivation : <K>{"f \\longrightarrow f'"}</K></div>
          <p style={{ fontSize: 13, margin: '0 0 8px', color: T.muted }}>On <em>descend</em> d'un degré, on multiplie par l'exposant.</p>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: `1px solid ${ACCENT}44` }}>
              <th style={{ padding: '4px 8px', color: ACCENT, textAlign: 'left' }}>f(x)</th>
              <th style={{ padding: '4px 8px', color: ACCENT, textAlign: 'left' }}>f'(x)</th>
            </tr></thead>
            <tbody>
              {[['x^4','4x^3'],['e^{2x}','2e^{2x}'],['\\sin x','\\cos x']].map(([f,fp],i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${ACCENT}11` }}>
                  <td style={{ padding: '5px 8px', color: T.text }}><K>{f}</K></td>
                  <td style={{ padding: '5px 8px', color: ACCENT }}><K>{fp}</K></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel accent={ACCENT}>
          <div style={{ fontWeight: 700, color: ACCENT, marginBottom: 10 }}>⬆️ Primitivation : <K>{"f \\longrightarrow F + C"}</K></div>
          <p style={{ fontSize: 13, margin: '0 0 8px', color: T.muted }}>On <em>monte</em> d'un degré, on divise par le nouvel exposant.</p>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: `1px solid ${ACCENT}44` }}>
              <th style={{ padding: '4px 8px', color: ACCENT, textAlign: 'left' }}>f(x)</th>
              <th style={{ padding: '4px 8px', color: ACCENT, textAlign: 'left' }}>F(x) + C</th>
            </tr></thead>
            <tbody>
              {[['4x^3','x^4 + C'],['2e^{2x}','e^{2x} + C'],['\\cos x','\\sin x + C']].map(([f,F],i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${ACCENT}11` }}>
                  <td style={{ padding: '5px 8px', color: T.text }}><K>{f}</K></td>
                  <td style={{ padding: '5px 8px', color: ACCENT }}><K>{F}</K></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </Grid>

      <Accordion title="Exercice — Primitive de 4x³ − 3x² + 2" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text, fontSize: 14, marginBottom: 12 }}>
          Trouver la primitive générale <K>{"F(x)"}</K> de <K>{"f(x) = 4x^3 - 3x^2 + 2"}</K>, puis vérifier en dérivant.
        </p>
        <Demonstration accent={ACCENT} title="Solution détaillée">
          <DemoStep num={1} rule="Linéarité" ruleDetail="la primitive d'une somme = somme des primitives" accent={ACCENT}>
            <K display>{"F(x) = \\int 4x^3\\,dx - \\int 3x^2\\,dx + \\int 2\\,dx"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Règle de puissance" ruleDetail="∫xⁿ dx = xⁿ⁺¹/(n+1) + C" accent={ACCENT}>
            <K display>{"F(x) = 4 \\cdot \\frac{x^4}{4} - 3 \\cdot \\frac{x^3}{3} + 2x + C = x^4 - x^3 + 2x + C"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Vérification par dérivation" ruleDetail="F'(x) doit redonner f(x)" accent={ACCENT}>
            <K display>{"F'(x) = 4x^3 - 3x^2 + 2 = f(x) \;\\checkmark"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Condition initiale" ruleDetail="déterminer C si F(1) = 0" accent={ACCENT}>
            <K display>{"0 = 1 - 1 + 2 + C \\implies C = -2 \\implies F(x) = x^4 - x^3 + 2x - 2"}</K>
          </DemoStep>
        </Demonstration>
      </Accordion>

      <Panel accent={ACCENT} style={{ marginBottom: 24 }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🎯 À retenir — Primitives</div>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2, color: T.muted, fontSize: 13 }}>
          <li><strong style={{ color: T.text }}>Définition :</strong> <K>{"F"}</K> est primitive de <K>{"f"}</K> si et seulement si <K>{"F'(x) = f(x)"}</K>.</li>
          <li><strong style={{ color: T.text }}>Famille infinie :</strong> si <K>{"F"}</K> est une primitive, <K>{"F + C"}</K> l'est aussi — il faut une condition initiale pour déterminer <K>{"C"}</K>.</li>
          <li><strong style={{ color: T.text }}>Règle de puissance :</strong> <K>{"\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C"}</K> (valable pour <K>{"n \\neq -1"}</K>).</li>
          <li><strong style={{ color: T.text }}>Cas spécial :</strong> <K>{"\\int \\frac{1}{x}\\,dx = \\ln|x| + C"}</K>.</li>
          <li><strong style={{ color: T.text }}>Vérification systématique :</strong> toujours dériver le résultat pour confirmer.</li>
        </ul>
      </Panel>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — INTÉGRALE DÉFINIE
          ══════════════════════════════════════════════════════════════════ */}

      <SectionTitle accent={ACCENT}>∫ Intégrale définie — définition et propriétés</SectionTitle>

      <IntuitionBlock emoji="🚰" title="L'intégrale = accumuler des petites contributions" accent={ACCENT}>
        <p>
          Imaginez un tuyau dont le <strong>débit varie dans le temps</strong> : parfois 2 litres/minute, parfois 5, parfois 0.3.
          Comment calculer le volume total d'eau écoulé entre <K>{"t = a"}</K> et <K>{"t = b"}</K> ?
        </p>
        <p>
          Stratégie naturelle : on découpe le temps en petits intervalles de durée <K>{"\\Delta t"}</K>.
          Sur chaque intervalle, le volume partiel est <K>{"\\text{débit} \\times \\Delta t"}</K>. On somme toutes ces
          petites contributions. Plus les intervalles sont fins, plus l'approximation est précise.
          À la limite — quand <K>{"\\Delta t \\to 0"}</K> — on obtient le volume exact.
          <strong> C'est exactement ça, l'intégrale définie.</strong>
        </p>
        <p>
          En mathématiques : la fonction <K>{"f(x)"}</K> joue le rôle du débit, et l'intégrale <K>{"\\int_a^b f(x)\\,dx"}</K>
          accumule toutes les contributions infinitésimales. Géométriquement, c'est l'<strong>aire sous la courbe</strong> (avec signe).
        </p>
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>📐 De la somme de Riemann à l'intégrale</SectionTitle>

      <FormulaBox accent={ACCENT} label="Somme de Riemann → Intégrale de Riemann">
        <K display>{"\\int_a^b f(x)\\,dx = \\lim_{n \\to \\infty} \\underbrace{\\sum_{i=1}^{n}}_{\\text{sommer les rectangles}} \\underbrace{f(x_i)}_{\\text{hauteur du rectangle}} \\cdot \\underbrace{\\Delta x}_{\\text{largeur} = \\frac{b-a}{n}}"}</K>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['a', "Borne inférieure d'intégration — début de l'intervalle"],
        ['b', "Borne supérieure d'intégration — fin de l'intervalle"],
        ['f(x_i)', 'Valeur de f au point xᵢ (hauteur du i-ème rectangle)'],
        ['\\Delta x = \\tfrac{b-a}{n}', "Largeur de chaque subdivision — tend vers 0 quand n → ∞"],
        ['n', "Nombre de subdivisions — plus n est grand, plus l'approximation est précise"],
      ]} />

      <div style={{ background: `${ACCENT}11`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14, margin: '14px 0', color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
        <strong style={{ color: ACCENT }}>Analogie — Escalier vers la rampe :</strong>{' '}
        La somme de Riemann ressemble à un <strong>escalier à n marches</strong> qui approxime une rampe courbe.
        Avec 4 marches, l'escalier est grossier. Avec 100 marches, on ne distingue presque plus les dents.
        Avec une infinité de marches infiniment fines, l'escalier devient la rampe — c'est l'intégrale exacte.
      </div>

      <SectionTitle accent={ACCENT}>🔑 Théorème Fondamental du Calcul (TFC)</SectionTitle>

      <IntuitionBlock emoji="✨" title="La primitive : clé de voûte du calcul intégral" accent={ACCENT}>
        <p>
          Calculer une intégrale par somme de Riemann est conceptuellement simple mais pratiquement fastidieux.
          Le <strong>Théorème Fondamental du Calcul (TFC)</strong> révèle un raccourci prodigieux :
          pour calculer l'aire sous une courbe, il suffit de trouver la primitive de <K>{"f"}</K>
          et d'évaluer la différence aux bornes — <strong>pas besoin de sommer quoi que ce soit !</strong>
        </p>
        <p>
          Intuition : si <K>{"F(x)"}</K> représente l'aire accumulée depuis <K>{"a"}</K> jusqu'à <K>{"x"}</K>,
          ajouter une tranche infiniment fine de hauteur <K>{"f(x)"}</K> augmente <K>{"F"}</K> de <K>{"f(x)\\,dx"}</K>,
          soit <K>{"F'(x) = f(x)"}</K>. Autrement dit : <strong>la primitive de f est exactement la fonction « aire cumulée »</strong>.
        </p>
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Théorème Fondamental du Calcul">
        <K display>{"\\int_a^b f(x)\\,dx = \\underbrace{F(b)}_{\\text{primitive évaluée en } b} - \\underbrace{F(a)}_{\\text{primitive évaluée en } a}"}</K>
        <div style={{ color: T.muted, fontSize: 12, textAlign: 'center', marginTop: 6 }}>
          où <K>{"F"}</K> est une primitive de <K>{"f"}</K>, i.e. <K>{"F'(x) = f(x)"}</K>
        </div>
      </FormulaBox>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: T.text, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
          Décomposition terme à terme — exemple <K>{"\\int_1^3 2x\\,dx"}</K>
        </div>
        <Grid cols={2} gap="10px">
          <Panel accent={ACCENT} style={{ padding: 14 }}>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>🎯 Trouver la primitive <K>{"F(x)"}</K></div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
              On cherche <K>{"F"}</K> telle que <K>{"F'(x) = 2x"}</K>.<br />
              Règle de puissance : <K>{"\\int 2x\\,dx = x^2 + C"}</K>.<br />
              Donc <K>{"F(x) = x^2"}</K>.
            </div>
            <div style={{ background: `${ACCENT}22`, borderRadius: 6, padding: '6px 10px', marginTop: 8, textAlign: 'center' }}>
              <K>{"F(x) = x^2"}</K>
            </div>
          </Panel>
          <Panel accent={ACCENT} style={{ padding: 14 }}>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>📏 Évaluer aux bornes</div>
            <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
              <K>{"F(3) = 3^2 = 9"}</K><br />
              <K>{"F(1) = 1^2 = 1"}</K><br />
              Résultat : <K>{"F(3) - F(1) = 9 - 1 = 8"}</K>
            </div>
            <div style={{ background: `${ACCENT}22`, borderRadius: 6, padding: '6px 10px', marginTop: 8, textAlign: 'center' }}>
              <K>{"\\int_1^3 2x\\,dx = 8"}</K>
            </div>
          </Panel>
        </Grid>
      </div>

      <SectionTitle accent={ACCENT}>📋 Propriétés de l'intégrale définie</SectionTitle>

      <Grid cols={2} gap="10px">
        <Panel accent={ACCENT} style={{ padding: 14 }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>➕ Linéarité</div>
          <K display>{"\\int_a^b (\\alpha f + \\beta g)\\,dx = \\alpha\\int_a^b f\\,dx + \\beta\\int_a^b g\\,dx"}</K>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
            On peut factoriser les constantes et séparer les sommes.<br />
            <strong>Ex :</strong> <K>{"\\int_0^1 (3x^2 + 2x)\\,dx = 3 \\cdot \\tfrac{1}{3} + 2 \\cdot \\tfrac{1}{2} = 2"}</K>
          </div>
        </Panel>
        <Panel accent={ACCENT} style={{ padding: 14 }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>✂️ Relation de Chasles</div>
          <K display>{"\\int_a^c f\\,dx = \\int_a^b f\\,dx + \\int_b^c f\\,dx"}</K>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
            On peut découper l'intervalle en deux parties.<br />
            <strong>Analogie :</strong> trajet Paris→Lyon = Paris→Dijon + Dijon→Lyon.
          </div>
        </Panel>
        <Panel accent={ACCENT} style={{ padding: 14 }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>🎯 Intégrale nulle</div>
          <K display>{"\\int_a^a f(x)\\,dx = 0"}</K>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
            Si les bornes sont identiques, l'intervalle est réduit à un point — aire = 0.
          </div>
        </Panel>
        <Panel accent={ACCENT} style={{ padding: 14 }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>🔄 Inversion des bornes</div>
          <K display>{"\\int_b^a f\\,dx = -\\int_a^b f\\,dx"}</K>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>
            Inverser les bornes change le signe.<br />
            <strong>Ex :</strong> <K>{"\\int_3^1 2x\\,dx = -8"}</K>.
          </div>
        </Panel>
      </Grid>

      <SectionTitle accent={ACCENT}>⚖️ Somme de Riemann vs TFC — comparaison</SectionTitle>

      <Grid cols={2} gap="12px">
        <div style={{ background: T.panel2, borderRadius: 10, padding: 16, border: `1px solid ${ACCENT}33` }}>
          <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>(A) Somme de Riemann — n = 4 rectangles</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.8 }}>
            Pour <K>{"\\int_0^2 x^2\\,dx"}</K>, <K>{"\\Delta x = 0.5"}</K>. Points <K>{"x_i = 0,\\,0.5,\\,1,\\,1.5"}</K> :
          </div>
          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ background: `${ACCENT}22` }}>
                <th style={{ padding: '4px 8px', color: ACCENT }}>i</th>
                <th style={{ padding: '4px 8px', color: ACCENT }}><K>{"x_i"}</K></th>
                <th style={{ padding: '4px 8px', color: ACCENT }}><K>{"x_i^2"}</K></th>
                <th style={{ padding: '4px 8px', color: ACCENT }}>Contrib.</th>
              </tr></thead>
              <tbody>
                {[[1,'0.0','0.00','0.000'],[2,'0.5','0.25','0.125'],[3,'1.0','1.00','0.500'],[4,'1.5','2.25','1.125']].map(([i,xi,fxi,c]) => (
                  <tr key={i} style={{ borderTop: `1px solid ${ACCENT}22` }}>
                    <td style={{ padding: '4px 8px', color: T.text }}>{i}</td>
                    <td style={{ padding: '4px 8px', color: T.muted }}>{xi}</td>
                    <td style={{ padding: '4px 8px', color: T.muted }}>{fxi}</td>
                    <td style={{ padding: '4px 8px', color: T.muted }}>{c}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: `2px solid ${ACCENT}66`, background: `${ACCENT}11` }}>
                  <td colSpan={3} style={{ padding: '6px 8px', color: ACCENT, fontWeight: 700, textAlign: 'right' }}>Somme ≈</td>
                  <td style={{ padding: '6px 8px', color: ACCENT, fontWeight: 800 }}>1.750</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 8 }}>Erreur : 34% avec n=4. Avec n=100 → 1.5%. Avec n→∞ → 0%.</div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 10, padding: 16, border: `1px solid ${ACCENT}55` }}>
          <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>(B) TFC — résultat exact en 2 lignes</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.8 }}>
            <strong style={{ color: T.text }}>Étape 1 — Trouver la primitive :</strong><br />
            <K>{"f(x) = x^2 \\Rightarrow F(x) = \\dfrac{x^3}{3}"}</K><br /><br />
            <strong style={{ color: T.text }}>Étape 2 — Évaluer aux bornes :</strong>
          </div>
          <div style={{ background: `${ACCENT}22`, borderRadius: 6, padding: '10px 14px', margin: '8px 0', textAlign: 'center' }}>
            <K display>{"\\int_0^2 x^2\\,dx = \\left[\\frac{x^3}{3}\\right]_0^2 = \\frac{8}{3} - 0 = \\frac{8}{3} \\approx 2.667"}</K>
          </div>
          <div style={{ color: T.muted, fontSize: 11 }}>Résultat <strong>exact</strong>, sans aucune approximation.</div>
        </div>
      </Grid>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}44`, borderRadius: 8, padding: '12px 18px', margin: '18px 0', textAlign: 'center' }}>
        <em style={{ color: T.text, fontSize: 14 }}>
          Le TFC transforme un problème de limite de somme infinie en simple évaluation d'une primitive aux bornes —
          c'est le résultat le plus puissant du calcul différentiel et intégral.
        </em>
      </div>

      <Accordion title="Exercice — ∫₀^π sin(x) dx par le TFC" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text, fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>
          Calculer <K>{"\\int_0^{\\pi} \\sin(x)\\,dx"}</K> et interpréter le résultat géométriquement.
        </p>
        <Demonstration accent={ACCENT} title="Solution détaillée">
          <DemoStep num={1} rule="Identifier la primitive" ruleDetail="F'(x) = f(x)" accent={ACCENT}>
            On cherche <K>{"F"}</K> telle que <K>{"F'(x) = \\sin(x)"}</K>.<br />
            Puisque <K>{"(\\cos x)' = -\\sin x"}</K>, donc <K>{"(-\\cos x)' = \\sin x"}</K>.<br />
            La primitive est <K>{"F(x) = -\\cos(x)"}</K>.
          </DemoStep>
          <DemoStep num={2} rule="Appliquer le TFC" ruleDetail="∫[a,b] f = F(b) - F(a)" accent={ACCENT}>
            <K display>{"\\int_0^{\\pi} \\sin(x)\\,dx = \\Big[-\\cos(x)\\Big]_0^{\\pi}"}</K>
            En <K>{"b = \\pi"}</K> : <K>{"-\\cos(\\pi) = +1"}</K><br />
            En <K>{"a = 0"}</K> : <K>{"-\\cos(0) = -1"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Calculer F(b) − F(a)" accent={ACCENT}>
            <K display>{"\\int_0^{\\pi} \\sin(x)\\,dx = 1 - (-1) = 2"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Interprétation géométrique" accent={ACCENT}>
            Sur <K>{"[0, \\pi]"}</K>, le sinus est positif — l'intégrale est l'aire de l'arche de sinus = 2 u.a.<br />
            Vérification par Chasles : <K>{"\\int_0^{\\pi/2} \\sin x\\,dx = 1"}</K> et <K>{"\\int_{\\pi/2}^{\\pi} \\sin x\\,dx = 1"}</K>, donc <K>{"\\int_0^{\\pi} = 2"}</K> ✓.
          </DemoStep>
        </Demonstration>
      </Accordion>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — CALCUL D'AIRES + SIMULATION INTERACTIVE
          ══════════════════════════════════════════════════════════════════ */}

      <SectionTitle accent={ACCENT}>📐 Calcul d'aires — géométrie de l'intégrale</SectionTitle>

      <IntuitionBlock emoji="🏦" title="L'intégrale comme solde bancaire algébrique" accent={ACCENT}>
        <p>
          Imagine un compte bancaire où chaque valeur <K>{"f(x)"}</K> représente un flux instantané d'argent :
          quand <K>{"f(x) > 0"}</K>, de l'argent entre (revenu) ; quand <K>{"f(x) < 0"}</K>, de l'argent sort (dépense).
          L'intégrale <K>{"\\int_a^b f(x)\\,dx"}</K> est le <strong>solde net</strong>.
        </p>
        <p>
          Conséquence surprenante : une intégrale peut valoir <strong>zéro même si la fonction n'est jamais nulle</strong>.
          <K>{"\\int_0^{2\\pi} \\sin(x)\\,dx = 0"}</K> bien que le sinus oscille en permanence — les aires positives et négatives s'annulent.
        </p>
      </IntuitionBlock>

      <Grid cols={2} gap="12px">
        <Panel accent={ACCENT} style={{ padding: 16 }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>📈</div>
          <strong style={{ color: ACCENT }}>f(x) &gt; 0 — aire positive</strong>
          <p style={{ color: T.text, fontSize: 13, marginTop: 8 }}>
            La courbe est <em>au-dessus</em> de l'axe. Les bandes rectangulaires ont une hauteur positive →
            l'intégrale s'additionne.
          </p>
          <div style={{ background: `${ACCENT}22`, borderRadius: 6, padding: '8px 12px', marginTop: 8, fontSize: 13, color: T.text }}>
            <strong>Ex :</strong> <K>{"\\int_0^1 x^2\\,dx = \\tfrac{1}{3} > 0"}</K>
          </div>
        </Panel>
        <Panel accent={ACCENT} style={{ padding: 16 }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>📉</div>
          <strong style={{ color: ACCENT }}>f(x) &lt; 0 — aire négative</strong>
          <p style={{ color: T.text, fontSize: 13, marginTop: 8 }}>
            La courbe est <em>en dessous</em> de l'axe. Les bandes ont une hauteur négative →
            l'intégrale soustrait.
          </p>
          <div style={{ background: `${ACCENT}22`, borderRadius: 6, padding: '8px 12px', marginTop: 8, fontSize: 13, color: T.text }}>
            <strong>Ex :</strong> <K>{"\\int_\\pi^{2\\pi} \\sin(x)\\,dx = -2"}</K>
          </div>
        </Panel>
      </Grid>

      <div style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 12, margin: '16px 0', color: T.muted, fontSize: 13, fontStyle: 'italic' }}>
        <strong style={{ color: ACCENT }}>À retenir :</strong> L'intégrale mesure un <em>solde algébrique</em>, pas une superficie brute.
        Pour l'aire géométrique totale (toujours positive), intégrer <K>{"\\int_a^b |f(x)|\\,dx"}</K>.
      </div>

      <SectionTitle accent={ACCENT}>📏 Aire entre deux courbes</SectionTitle>

      <IntuitionBlock emoji="🏗️" title="La distance verticale comme largeur de bande" accent={ACCENT}>
        <p>
          Imaginez deux toits de maisons superposés, vus de profil. L'aire entre les deux toits correspond
          à la <strong>distance verticale</strong> entre les deux courbes, intégrée sur l'intervalle horizontal.
        </p>
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Aire entre f et g">
        <K display>{"\\text{Aire} = \\int_a^b \\underbrace{|f(x) - g(x)|}_{\\text{distance verticale entre les courbes}}\\,dx"}</K>
      </FormulaBox>

      <Step num={1} accent={ACCENT}>
        <strong>Trouver les intersections.</strong> Résoudre <K>{"f(x) = g(x)"}</K> pour trouver les bornes <K>{"x_1, x_2"}</K>.
        <div style={{ background: `${ACCENT}22`, borderRadius: 6, padding: '8px 12px', marginTop: 8, fontSize: 13, color: T.text }}>
          <strong>Ex :</strong> <K>{"f(x) = x^2"}</K>, <K>{"g(x) = x"}</K> : <K>{"x^2 = x \\Rightarrow x=0 \\text{ et } x=1"}</K>
        </div>
      </Step>

      <Step num={2} accent={ACCENT}>
        <strong>Identifier quelle courbe est au-dessus.</strong> Tester un point intermédiaire.
        <div style={{ background: `${ACCENT}22`, borderRadius: 6, padding: '8px 12px', marginTop: 8, fontSize: 13, color: T.text }}>
          <strong>Ex :</strong> En <K>{"x=0.5"}</K> : <K>{"g(0.5)=0.5 > f(0.5)=0.25"}</K> → <K>{"g > f"}</K> sur <K>{"(0,1)"}</K>
        </div>
      </Step>

      <Step num={3} accent={ACCENT}>
        <strong>Intégrer avec le bon signe.</strong> <K>{"\\int_{x_1}^{x_2} (g(x) - f(x))\\,dx"}</K> (toujours positif).
        <div style={{ background: `${ACCENT}22`, borderRadius: 6, padding: '8px 12px', marginTop: 8, fontSize: 13, color: T.text }}>
          <strong>Ex :</strong> <K>{"\\int_0^1 (x - x^2)\\,dx = \\left[\\tfrac{x^2}{2} - \\tfrac{x^3}{3}\\right]_0^1 = \\tfrac{1}{2} - \\tfrac{1}{3} = \\tfrac{1}{6}"}</K>
        </div>
      </Step>

      <Grid cols={2} gap="12px" style={{ marginBottom: 16 }}>
        <Panel accent={ACCENT} style={{ padding: 16 }}>
          <strong style={{ color: ACCENT }}>Aire algébrique (signée)</strong>
          <K display>{"\\int_0^1 (x^2 - x)\\,dx = \\tfrac{1}{3} - \\tfrac{1}{2} = -\\tfrac{1}{6}"}</K>
          <p style={{ color: T.muted, fontSize: 13 }}>Négatif car <K>{"x > x^2"}</K> sur <K>{"(0,1)"}</K>.</p>
        </Panel>
        <Panel accent={ACCENT} style={{ padding: 16 }}>
          <strong style={{ color: ACCENT }}>Aire géométrique (entre courbes)</strong>
          <K display>{"\\int_0^1 |x - x^2|\\,dx = \\int_0^1 (x - x^2)\\,dx = \\tfrac{1}{6}"}</K>
          <p style={{ color: T.muted, fontSize: 13 }}>Positif — c'est bien une surface.</p>
        </Panel>
      </Grid>

      <SectionTitle accent={ACCENT}>🎛️ Simulation interactive — visualisation de l'intégrale</SectionTitle>

      <Panel accent={ACCENT} style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <strong style={{ color: ACCENT, fontSize: 14 }}>Choisir la fonction à intégrer :</strong>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {[
              { key: 'gauss', latexLabel: '\\varphi(x)', desc: 'Gaussienne' },
              { key: 'x2', latexLabel: 'x^2', desc: 'Parabole' },
              { key: 'abs', latexLabel: '|x|', desc: 'Valeur absolue' },
            ].map(({ key, latexLabel, desc }) => (
              <button key={key} onClick={() => setFnType(key)} style={{
                padding: '6px 16px', borderRadius: 6,
                border: `1.5px solid ${fnType === key ? ACCENT : T.border}`,
                background: fnType === key ? `${ACCENT}22` : T.panel,
                color: fnType === key ? ACCENT : T.muted,
                fontWeight: fnType === key ? 700 : 400, cursor: 'pointer', fontSize: 13,
              }}>
                <K>{latexLabel}</K>
                <span style={{ marginLeft: 6, color: T.muted, fontSize: 11 }}>{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Grid cols={2} gap="12px">
          <Slider label="a — borne inférieure d'intégration" value={a} min={-3} max={b - 0.1} step={0.1} onChange={setA} accent={ACCENT} format={v => v.toFixed(1)} />
          <Slider label="b — borne supérieure d'intégration" value={b} min={a + 0.1} max={3} step={0.1} onChange={setB} accent={ACCENT} format={v => v.toFixed(1)} />
        </Grid>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
          <InfoChip label="∫[a,b] f(x)dx" value={integral >= 0 ? `+${integral.toFixed(4)}` : integral.toFixed(4)} unit="u.a." accent={ACCENT} />
          <InfoChip label="Largeur [a,b]" value={(b - a).toFixed(1)} unit="unités" accent={ACCENT} />
          {fnType === 'gauss' && (
            <InfoChip label="P(a ≤ Z ≤ b)" value={(integral * 100).toFixed(2)} unit="%" accent={ACCENT} />
          )}
          <InfoChip label="Valeur moy. de f" value={(b - a) > 0 ? (integral / (b - a)).toFixed(4) : '—'} accent={ACCENT} />
        </div>

        {fnType === 'gauss' && (
          <div style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, borderRadius: 6, padding: '8px 12px', fontSize: 12, color: T.text, marginBottom: 12 }}>
            <strong style={{ color: ACCENT }}>Interprétation probabiliste :</strong>{' '}
            La gaussienne standard <K>{"\\varphi(x) = \\frac{1}{\\sqrt{2\\pi}} e^{-x^2/2}"}</K> est une densité de probabilité.
            L'intégrale sur <K>{"[a, b]"}</K> représente <K>{"P(a \\leq Z \\leq b)"}</K>.
            Sur <K>{"[-1.96, 1.96]"}</K>, cette probabilité vaut 95%.
          </div>
        )}

        <ChartWrapper title={`Aire sous la courbe (zone colorée = intégrale) — [${a.toFixed(1)}, ${b.toFixed(1)}]`} accent={ACCENT} height={290}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" type="number" domain={[-3.5, 3.5]} stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} label={{ value: 'x', position: 'insideBottomRight', fill: T.muted, fontSize: 12 }} />
              <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine y={0} stroke={T.muted} strokeDasharray="4 4" />
              <ReferenceLine x={a} stroke={ACCENT} strokeDasharray="4 3" label={{ value: 'a', fill: ACCENT, fontSize: 11 }} />
              <ReferenceLine x={b} stroke={ACCENT} strokeDasharray="4 3" label={{ value: 'b', fill: ACCENT, fontSize: 11 }} />
              <Line type="monotone" dataKey="fill" stroke="transparent" fill={`${ACCENT}44`} dot={false} activeDot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="f" stroke={ACCENT} strokeWidth={2.5} dot={false} name="f(x)" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ul style={{ color: T.muted, fontSize: 13, lineHeight: 2, marginTop: 12, paddingLeft: 20 }}>
          <li>📈 <strong>La courbe cyan</strong> trace <K>{"f(x)"}</K> — observer si elle passe au-dessus ou en dessous de l'axe horizontal.</li>
          <li>🟦 <strong>La zone colorée</strong> représente l'intégrale — quand la courbe est négative, elle soustrait.</li>
          <li>🎛️ <strong>Déplacer les bornes a et b</strong> modifie la zone d'intégration et la valeur en temps réel.</li>
          <li>🔄 <strong>Changer la fonction</strong> : la gaussienne permet une interprétation probabiliste, <K>{"x^2"}</K> illustre une parabole positive, <K>{"|x|"}</K> un V symétrique.</li>
          <li>📊 <strong>La valeur moyenne de f</strong> est <K>{"\\frac{1}{b-a}\\int_a^b f(x)\\,dx"}</K> — visible dans l'InfoChip.</li>
        </ul>
      </Panel>

      <Accordion title="Exercice — Aire entre y = x et y = x² sur [0,1]" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, fontSize: 14 }}>
          Calculer l'aire de la région délimitée par <K>{"f(x) = x"}</K> et <K>{"g(x) = x^2"}</K>.
        </p>
        <Demonstration accent={ACCENT} title="Solution pas à pas">
          <DemoStep num={1} rule="Intersection" ruleDetail="f(x) = g(x) pour trouver les bornes" accent={ACCENT}>
            <K display>{"x = x^2 \\Rightarrow x(x-1) = 0 \\Rightarrow x_1 = 0,\; x_2 = 1"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Domination" ruleDetail="Identifier quelle courbe est au-dessus" accent={ACCENT}>
            En <K>{"x=0.5"}</K> : <K>{"f(0.5)=0.5 > g(0.5)=0.25"}</K> → <K>{"f(x) = x > g(x) = x^2"}</K> sur <K>{"(0,1)"}</K>.
          </DemoStep>
          <DemoStep num={3} rule="Intégration" ruleDetail="∫(f − g) dx sur [0,1]" accent={ACCENT}>
            <K display>{"\\int_0^1 (x - x^2)\\,dx = \\left[\\frac{x^2}{2} - \\frac{x^3}{3}\\right]_0^1 = \\frac{1}{2} - \\frac{1}{3} = \\frac{1}{6}"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Conclusion" accent={ACCENT}>
            L'aire entre les deux courbes sur <K>{"[0,1]"}</K> est exactement <K>{"\\frac{1}{6} \\approx 0.167"}</K> u.a.²
          </DemoStep>
        </Demonstration>
      </Accordion>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — INTÉGRATION PAR PARTIES (IPP)
          ══════════════════════════════════════════════════════════════════ */}

      <SectionTitle accent={ACCENT}>🔁 Intégration par parties (IPP)</SectionTitle>

      <IntuitionBlock emoji="🤝" title="IPP : retourner la règle du produit" accent={ACCENT}>
        <p style={{ margin: '0 0 10px 0' }}>
          Vous connaissez la <strong>règle du produit</strong> pour dériver : <K>{"(uv)' = u'v + uv'"}</K>.
          L'intégration par parties, c'est exactement cette règle lue <em>à l'envers</em> : on intègre les deux membres
          pour transformer un produit difficile à intégrer en quelque chose de plus simple.
        </p>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>Analogie 1 — Partage de tâche :</strong> imaginez deux collègues qui se partagent un dossier complexe.
          Si l'un simplifie sa partie (en dérivant <K>{"u"}</K>), l'autre hérite d'une tâche plus lourde
          (intégrer <K>{"dv"}</K>). Mais l'échange est gagnant : le problème global devient calculable.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Analogie 2 — Désintégration progressive :</strong> à chaque application de l'IPP, le polynôme
          perd un degré (en étant dérivé). Un polynôme de degré <K>{"n"}</K> disparaît en <K>{"n"}</K> applications
          successives — comme un matériau radioactif qui se désintègre par demi-vies successives.
        </p>
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>📐 Dérivation de la formule IPP</SectionTitle>

      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.9, marginBottom: 12 }}>
        Tout part de la règle du produit. En dérivant <K>{"u(x) \\cdot v(x)"}</K> :
      </div>

      <FormulaBox accent={ACCENT} label="Étape 1 — Règle du produit">
        <K display>{"(u \\cdot v)' = u' \\cdot v + u \\cdot v'"}</K>
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Étape 2 — Intégration des deux membres">
        <K display>{"\\int (u \\cdot v)'\\,dx = \\int u'v\\,dx + \\int uv'\\,dx"}</K>
        <div style={{ color: T.muted, fontSize: 12, textAlign: 'center', marginTop: 6 }}>
          Or le membre gauche vaut simplement <K>{"uv"}</K> (primitive de sa propre dérivée).
        </div>
      </FormulaBox>

      <FormulaBox accent={ACCENT} label="Étape 3 — Réarrangement → formule IPP">
        <K display>{"\\int \\underbrace{u}_{\\text{à dériver}} \\underbrace{v'\\,dx}_{dv} = \\underbrace{u \\cdot v}_{\\text{terme de bord}} - \\int \\underbrace{v}_{\\text{acquis}} \\underbrace{u'\\,dx}_{du}"}</K>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
          Notation compacte : <K>{"\\displaystyle\\int u\\,dv = uv - \\int v\\,du"}</K>
        </div>
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['u', 'Facteur choisi pour être dérivé — doit se simplifier en dérivant'],
        ['v', "Antidérivée de dv — facteur que l'on intègre"],
        ['du', "Différentielle de u : du = u'\\,dx"],
        ['dv', "Différentielle choisie : dv = v'\\,dx — la partie que l'on intègre"],
        ['uv', 'Terme de bord — évalué aux limites pour les intégrales définies'],
      ]} />

      <SectionTitle accent={ACCENT}>🔡 Règle LIATE — Choisir u et dv</SectionTitle>

      <Panel accent={ACCENT} style={{ marginBottom: 16 }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
          LIATE : l'ordre de priorité pour choisir <K>{"u"}</K>
        </div>
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.9, marginBottom: 10 }}>
          Quand l'intégrande est un produit, choisir <K>{"u"}</K> = type le plus à gauche dans la liste LIATE :
        </div>
        <Grid cols={5} gap="8px">
          {[
            { letter: 'L', name: 'Logarithmique', ex: 'ln x', why: 'Simple à dériver, impossible à intégrer directement' },
            { letter: 'I', name: 'Inverse trig.', ex: 'arctan x', why: "Même raison : dérivée simple" },
            { letter: 'A', name: 'Algébrique', ex: 'xⁿ, √x', why: 'Perd un degré à chaque dérivation' },
            { letter: 'T', name: 'Trigo.', ex: 'sin x', why: 'Utile pour les cas cycliques' },
            { letter: 'E', name: 'Exponentielle', ex: 'eˣ', why: 'Invariante → toujours en dv' },
          ].map(({ letter, name, ex, why }) => (
            <div key={letter} style={{ background: T.panel2, borderRadius: 8, padding: 10, border: `1px solid ${ACCENT}33`, textAlign: 'center' }}>
              <div style={{ color: ACCENT, fontWeight: 800, fontSize: 22 }}>{letter}</div>
              <div style={{ color: T.text, fontWeight: 600, fontSize: 12, margin: '4px 0 2px' }}>{name}</div>
              <div style={{ color: ACCENT, fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>{ex}</div>
              <div style={{ color: T.muted, fontSize: 11 }}>{why}</div>
            </div>
          ))}
        </Grid>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>
          Règle : <K>{"u"}</K> = type le plus à gauche présent, <K>{"dv"}</K> = tout le reste.
          Si l'intégrande ne contient qu'un type (ex: <K>{"\\ln x"}</K> seul), poser <K>{"dv = dx"}</K>.
        </div>
      </Panel>

      <SectionTitle accent={ACCENT}>📋 Exemples progressifs</SectionTitle>

      <Step num={1} accent={ACCENT}>
        <strong>Exemple simple : <K>{"\\int x\\,e^x\\,dx"}</K></strong>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 6 }}>
          LIATE : <K>{"x"}</K> est Algébrique (A), <K>{"e^x"}</K> est Exponentielle (E) → <K>{"u = x"}</K>, <K>{"dv = e^x dx"}</K>.
        </div>
        <Grid cols={2} gap="10px" style={{ marginTop: 8 }}>
          <div style={{ background: T.panel2, borderRadius: 8, padding: 10, border: `1px solid ${ACCENT}33` }}>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Calcul de du et v</div>
            <K display>{"u = x \\implies du = dx"}</K>
            <K display>{"dv = e^x\\,dx \\implies v = e^x"}</K>
          </div>
          <div style={{ background: T.panel2, borderRadius: 8, padding: 10, border: `1px solid ${ACCENT}33` }}>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Application IPP</div>
            <K display>{"\\int x\\,e^x\\,dx = x e^x - \\int e^x\\,dx = x e^x - e^x + C"}</K>
          </div>
        </Grid>
        <div style={{ background: `${ACCENT}11`, borderRadius: 6, padding: 8, marginTop: 8, color: T.text, fontSize: 13, textAlign: 'center' }}>
          <strong>Résultat : </strong><K>{"\\int x\\,e^x\\,dx = (x - 1)e^x + C"}</K>
        </div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
          Vérification : dériver <K>{"(x-1)e^x"}</K> donne <K>{"e^x + (x-1)e^x = xe^x"}</K> ✓
        </div>
      </Step>

      <Step num={2} accent={ACCENT}>
        <strong>Exemple avec logarithme : <K>{"\\int x\\ln(x)\\,dx"}</K></strong>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 6 }}>
          LIATE : <K>{"\\ln x"}</K> est Logarithmique (L), <K>{"x"}</K> est Algébrique (A) → L avant A, donc <K>{"u = \\ln x"}</K>, <K>{"dv = x\\,dx"}</K>.
        </div>
        <Grid cols={2} gap="10px" style={{ marginTop: 8 }}>
          <div style={{ background: T.panel2, borderRadius: 8, padding: 10, border: `1px solid ${ACCENT}33` }}>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Calcul de du et v</div>
            <K display>{"u = \\ln x \\implies du = \\frac{1}{x}\\,dx"}</K>
            <K display>{"dv = x\\,dx \\implies v = \\frac{x^2}{2}"}</K>
          </div>
          <div style={{ background: T.panel2, borderRadius: 8, padding: 10, border: `1px solid ${ACCENT}33` }}>
            <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Application IPP</div>
            <K display>{"\\int x\\ln x\\,dx = \\frac{x^2}{2}\\ln x - \\int \\frac{x}{2}\\,dx = \\frac{x^2}{2}\\ln x - \\frac{x^2}{4} + C"}</K>
          </div>
        </Grid>
        <div style={{ background: `${ACCENT}11`, borderRadius: 6, padding: 8, marginTop: 8, color: T.text, fontSize: 13, textAlign: 'center' }}>
          <strong>Résultat : </strong><K>{"\\int x\\ln x\\,dx = \\frac{x^2}{2}\\ln x - \\frac{x^2}{4} + C"}</K>
        </div>
      </Step>

      <Step num={3} accent={ACCENT}>
        <strong>IPP cyclique : <K>{"\\int e^x \\cos(x)\\,dx"}</K></strong>
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.9, marginTop: 6 }}>
          Appliquer l'IPP deux fois ramène l'intégrale initiale. La clé : garder la même convention entre les deux applications.
        </div>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, margin: '10px 0 4px' }}>Première application :</div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 10, marginBottom: 8, border: `1px solid ${ACCENT}33` }}>
          <K display>{"u = e^x,\; dv = \\cos x\\,dx \\implies v = \\sin x"}</K>
          <K display>{"\\int e^x \\cos x\\,dx = e^x \\sin x - \\int e^x \\sin x\\,dx \\quad (I)"}</K>
        </div>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, margin: '6px 0 4px' }}>Deuxième application sur <K>{"\\int e^x \\sin x\\,dx"}</K> :</div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 10, marginBottom: 8, border: `1px solid ${ACCENT}33` }}>
          <K display>{"u = e^x,\; dv = \\sin x\\,dx \\implies v = -\\cos x"}</K>
          <K display>{"\\int e^x \\sin x\\,dx = -e^x \\cos x + \\int e^x \\cos x\\,dx"}</K>
        </div>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, margin: '6px 0 4px' }}>Substitution → résoudre comme une équation :</div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: 10, border: `1px solid ${ACCENT}44` }}>
          <K display>{"I = e^x \\sin x + e^x \\cos x - I \\implies 2I = e^x(\\sin x + \\cos x)"}</K>
        </div>
        <div style={{ background: `${ACCENT}11`, borderRadius: 6, padding: 8, marginTop: 8, color: T.text, fontSize: 13, textAlign: 'center' }}>
          <strong>Résultat : </strong><K>{"\\int e^x \\cos x\\,dx = \\frac{e^x(\\cos x + \\sin x)}{2} + C"}</K>
        </div>
      </Step>

      <SectionTitle accent={ACCENT}>📊 Tableau de référence — Types d'intégrales et choix de u/dv</SectionTitle>

      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: `${ACCENT}22` }}>
              {["Type d'intégrale", "u", "dv", "Méthode"].map(h => (
                <th key={h} style={{ padding: '8px 10px', color: ACCENT, fontWeight: 700, textAlign: 'left', borderBottom: `2px solid ${ACCENT}44` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { type: 'Polynôme × Exponentielle', u: 'xⁿ (Algébrique)', dv: 'eᵃˣ dx', m: 'n applications — le polynôme s\'annule' },
              { type: 'Polynôme × Logarithme', u: 'ln x (Logarithmique)', dv: 'xⁿ dx', m: '1 seule application suffit' },
              { type: 'Polynôme × Trigonométrique', u: 'xⁿ (Algébrique)', dv: 'sin(x) ou cos(x) dx', m: 'n applications — le polynôme s\'annule' },
              { type: 'Trig × Exponentielle (cyclique)', u: 'eᵃˣ (conserver)', dv: 'sin(bx) ou cos(bx) dx', m: '2 applications + résolution en I' },
              { type: 'Logarithme seul', u: 'ln x', dv: 'dx', m: 'Astuce : poser dv = dx' },
            ].map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.panel2 : 'transparent' }}>
                <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{row.type}</td>
                <td style={{ padding: '7px 10px', color: ACCENT, borderBottom: `1px solid ${T.border}` }}>{row.u}</td>
                <td style={{ padding: '7px 10px', color: T.muted, borderBottom: `1px solid ${T.border}` }}>{row.dv}</td>
                <td style={{ padding: '7px 10px', color: T.muted, fontSize: 12, borderBottom: `1px solid ${T.border}` }}>{row.m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Accordion title="Exercice — ∫₀^π x sin(x) dx" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, fontSize: 14, lineHeight: 1.8, marginBottom: 10 }}>
          Calculer l'intégrale définie <K>{"\\int_0^{\\pi} x \\sin(x)\\,dx"}</K>.
          Ce type d'intégrale apparaît en physique (position moyenne d'une onde) et en traitement du signal (transformée de Fourier).
        </p>
        <Demonstration accent={ACCENT} title="Solution détaillée">
          <DemoStep num={1} rule="Choix LIATE" ruleDetail="A avant T → u = x, dv = sin(x)dx" accent={ACCENT}>
            <K>{"x"}</K> est Algébrique (A), <K>{"\\sin x"}</K> est Trigonométrique (T). LIATE → <K>{"u = x"}</K>, <K>{"dv = \\sin x\\,dx"}</K>.
          </DemoStep>
          <DemoStep num={2} rule="Calcul de du et v" ruleDetail="Dériver u, intégrer dv" accent={ACCENT}>
            <K display>{"u = x \\implies du = dx"}</K>
            <K display>{"dv = \\sin x\\,dx \\implies v = -\\cos x"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Application de la formule IPP" ruleDetail="∫u dv = [uv]₀^π − ∫v du" accent={ACCENT}>
            <K display>{"\\int_0^{\\pi} x \\sin x\\,dx = \\Big[-x\\cos x\\Big]_0^{\\pi} + \\int_0^{\\pi} \\cos x\\,dx"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Évaluation aux bornes" ruleDetail="Substituer x = π et x = 0" accent={ACCENT}>
            <strong>Terme de bord :</strong>
            <K display>{"\\Big[-x\\cos x\\Big]_0^{\\pi} = (-\\pi)(- 1) - 0 = \\pi"}</K>
            <strong>Intégrale restante :</strong>
            <K display>{"\\int_0^{\\pi} \\cos x\\,dx = \\Big[\\sin x\\Big]_0^{\\pi} = 0 - 0 = 0"}</K>
            <div style={{ background: `${ACCENT}11`, borderRadius: 6, padding: 8, marginTop: 6, textAlign: 'center', fontWeight: 600, color: T.text, fontSize: 13 }}>
              <K>{"\\displaystyle\\int_0^{\\pi} x \\sin(x)\\,dx = \\pi + 0 = \\pi \\approx 3.14159"}</K>
            </div>
          </DemoStep>
        </Demonstration>
      </Accordion>

      <Panel accent={ACCENT} style={{ marginTop: 20 }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📌 À retenir — Intégration par parties</div>
        <ul style={{ color: T.muted, fontSize: 13, lineHeight: 2.1, margin: 0, paddingLeft: 18 }}>
          <li><strong style={{ color: T.text }}>L'IPP retourne la règle du produit :</strong> <K>{"\\int u\\,dv = uv - \\int v\\,du"}</K>. Partir toujours de <K>{"(uv)' = u'v + uv'"}</K> pour la retrouver.</li>
          <li><strong style={{ color: T.text }}>Règle LIATE :</strong> Logarithmique → Inverse trig. → Algébrique → Trigonométrique → Exponentielle. L'exponentielle va toujours en <K>{"dv"}</K>.</li>
          <li><strong style={{ color: T.text }}>Polynôme × fonction :</strong> appliquer l'IPP autant de fois que le degré du polynôme — il finit par s'annuler.</li>
          <li><strong style={{ color: T.text }}>Cas cyclique :</strong> appliquer l'IPP deux fois <em>en gardant la même convention</em>, puis résoudre <K>{"2I = \\ldots"}</K>.</li>
        </ul>
      </Panel>

    </div>
  )
}


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
        La distinction entre <strong style={{ color: T.text }}>croissance discrète</strong> et <strong style={{ color: T.text }}>croissance continue</strong> est fondamentale en finance. En croissance discrète, un capital <K>{"C_0"}</K> placé à un taux annuel <K>{"r"}</K> pendant <K>{"n"}</K> périodes devient <K>{"C_0 \\times \\left(1 + \\frac{r}{m}\\right)^{m \\times n}"}</K>, où <K>{"m"}</K> est le nombre de capitalisations par an. Quand <K>{"m \\to \\infty"}</K> (capitalisation continue), la formule converge vers <K>{"C_0 \\times e^{r \\times n}"}</K> — c'est la capitalisation continue. Par exemple, 100€ à 5% continu pendant 2 ans donnent <K>{"100 \\times e^{0.10} = 110.52"}</K>€, contre <K>{"100 \\times (1.05)^2 = 110.25"}</K>€ en annuel discret. La capitalisation continue est préférée en finance quantitative car elle simplifie les formules (la somme de log-rendements correspond à la multiplication des facteurs de croissance).
      </div>
      <IntuitionBlock emoji="💰" title="Pourquoi log-rendement ?" accent={ACCENT}>
        Si vous avez 100€ et gagnez 10% deux années de suite :
        Rendement simple : <K>{"100 \\times 1.1 \\times 1.1 = 121"}</K>€.
        Log-rendement : <K>{"\\ln(121/100) = \\ln(1.1) + \\ln(1.1)"}</K> — ils s'additionnent !
        Les log-rendements sont <strong>additifs dans le temps</strong>, ce qui est mathématiquement
        très pratique pour modéliser les prix financiers.
      </IntuitionBlock>

      <Grid cols={2} gap="12px">
        <FormulaBox accent={ACCENT} label="Rendement simple">
          <K display>{"r_{\\text{simple}} = \\frac{S_t - S_0}{S_0}"}</K>
        </FormulaBox>
        <FormulaBox accent={ACCENT} label="Log-rendement (rendement continu)">
          <K display>{"r_{\\text{log}} = \\ln\\!\\left(\\frac{S_t}{S_0}\\right) = \\ln(S_t) - \\ln(S_0)"}</K>
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
        <K display>{"S_T = S_0 \\times \\exp\\!\\left[\\left(\\mu - \\frac{\\sigma^2}{2}\\right)T + \\sigma\\sqrt{T}\\,Z\\right] \\quad \\text{où } Z \\sim \\mathcal{N}(0,1)"}</K>
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
        Voici l'une des subtilités les plus importantes du modèle GBM. Intuitivement, si <K>{"S_T = S_0 \\times e^{\\mu T}"}</K>, on s'attendrait à ce que <K>{"E[S_T] = S_0 \\times e^{\\mu T}"}</K>. C'est vrai ! Mais si on demande "quel est le log-rendement moyen ?", la réponse est <K>{"E[\\ln(S_T/S_0)] = (\\mu - \\sigma^2/2) \\times T"}</K>, <em>pas</em> <K>{"\\mu \\times T"}</K>. Pourquoi cette différence ?
        <br /><br />
        C'est l'<strong>inégalité de Jensen</strong> : pour une fonction convexe <K>{"f"}</K>, <K>{"E[f(X)] \\ge f(E[X])"}</K>. Ici, exp est convexe, donc <K>{"E[e^X] \\ge e^{E[X]}"}</K>. En conséquence, <K>{"E[S_T] = e^{\\mu T + \\sigma^2 T/2}"}</K> {'>'} <K>{"e^{\\mu T}"}</K>. La "correction" <K>{"-\\sigma^2/2"}</K> ajuste le drift log pour que <K>{"E[S_T] = S_0 \\times e^{\\mu T}"}</K> reste cohérent.
        <br /><br />
        <strong>Exemple chiffré :</strong> imaginez deux scénarios équiprobables : +50% et -50%. La moyenne arithmétique est 0%, mais la moyenne géométrique est <K>{"\\sqrt{1.5 \\times 0.5} - 1 = \\sqrt{0.75} - 1 \\approx -13.4\\%"}</K> ! La volatilité détruit de la valeur — c'est l'effet de la correction d'Itô dans le GBM.
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
        Puisque <K>{"\\ln(S_T/S_0) \\sim \\mathcal{N}((\\mu - \\sigma^2/2)T,\\; \\sigma^2 T)"}</K>, <K>{"S_T"}</K> suit une loi log-normale dont on peut calculer tous les moments et probabilités.
      </div>
      <Grid cols={3} gap="10px">
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Espérance</div>
          <K>{"E[S_T] = S_0 \\times e^{\\mu T}"}</K>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>Le drift <K>{"\\mu"}</K> pilote la croissance moyenne</div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Variance</div>
          <K>{"\\text{Var}[S_T] = S_0^2 \\times e^{2\\mu T} \\times (e^{\\sigma^2 T} - 1)"}</K>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>Croît exponentiellement avec <K>{"T"}</K> et <K>{"\\sigma"}</K></div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Probabilité de dépasser K</div>
          <K>{"P(S_T > K) = N(d_2)"}</K>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}><K>{"d_2 = \\frac{\\ln(S_0/K) + (\\mu - \\sigma^2/2)T}{\\sigma\\sqrt{T}}"}</K></div>
        </div>
      </Grid>

      <Accordion title="Exercice — Probabilité de franchir un seuil" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Action avec <K>{"S_0 = 100"}</K>€, <K>{"\\mu = 8\\%"}</K>, <K>{"\\sigma = 25\\%"}</K>, <K>{"T = 1"}</K> an. Calculez <K>{"P(S_T > 120\\text{€})"}</K>.
        </p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"P(S_T > 120\\euro) \\approx 70.3\\%"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Loi log-normale du GBM" ruleDetail="ln(S_T/S₀) ~ N((µ−σ²/2)T, σ²T)" accent={ACCENT}>
            Calcul de d₂ : <K>{"d_2 = \\frac{\\ln(S_0/K) + (\\mu - \\sigma^2/2)T}{\\sigma\\sqrt{T}}"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Logarithme népérien" ruleDetail="ln(a/b) = ln(a) − ln(b)" accent={ACCENT}>
            <K>{"\\ln(100/120) = \\ln(0.8333) = -0.1823"}</K>. Drift corrigé : <K>{"\\mu - \\sigma^2/2 = 0.08 - 0.03125 = 0.04875"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Substitution et calcul" accent={ACCENT}>
            <K>{"d_2 = \\frac{-0.1823 + 0.04875}{0.25} = \\frac{-0.1336}{0.25} = -0.5342"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Symétrie de la loi normale" ruleDetail="P(Z > −z) = Φ(z)" accent={ACCENT}>
            <K>{"P(S_T > 120) = P(Z > -0.5342) = \\Phi(0.5342) \\approx 0.7034"}</K>
          </DemoStep>
        </Demonstration>
      </Accordion>

      <ExampleBlock title="Propriété clé : ln(S_T/S₀) ~ N(µ̃T, σ²T)" accent={ACCENT}>
        <p>Pour <K>{"S_0 = 80"}</K>$/bbl (pétrole brut), <K>{"\\mu = 10\\%"}</K>, <K>{"\\sigma = 30\\%"}</K>, <K>{"T = 0.5"}</K> an :</p>
        <FormulaBox accent={ACCENT} label="Résultats">
          <K display>{"E[\\ln(S_T/S_0)] = 0.0275 \\quad|\\quad E[S_T] = 84.1\\text{\\$/bbl} \\quad|\\quad \\sigma_{\\ln} = 0.212"}</K>
        </FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Correction d'Itô" ruleDetail="µ̃ = µ − σ²/2" accent={ACCENT}>
            <K>{"\\tilde{\\mu} = \\mu - \\frac{\\sigma^2}{2} = 0.10 - \\frac{0.09}{2} = 0.055"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Espérance du log-rendement" ruleDetail="E[ln(S_T/S₀)] = µ̃·T" accent={ACCENT}>
            <K>{"E[\\ln(S_T/S_0)] = 0.055 \\times 0.5 = 0.0275"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Espérance du prix (loi log-normale)" ruleDetail="E[S_T] = S₀·e^(µT)" accent={ACCENT}>
            <K>{"E[S_T] = 80 \\times e^{0.10 \\times 0.5} = 80 \\times 1.0513 = 84.1"}</K> $/bbl
          </DemoStep>
          <DemoStep num={4} rule="Écart-type du log-rendement" ruleDetail="σ_{log} = σ·√T" accent={ACCENT}>
            <K>{"\\sigma_{\\ln} = 0.30 \\times \\sqrt{0.5} = 0.212"}</K> → incertitude importante !
          </DemoStep>
        </Demonstration>
      </ExampleBlock>
    </div>
  )
}
