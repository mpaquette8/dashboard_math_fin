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
function DerivTab() {
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
        Les dérivées sont <strong style={{ color: T.text }}>l'outil central de la finance quantitative</strong>. Chaque fois qu'un trader veut savoir "comment mon portefeuille va-t-il réagir si le marché bouge ?", il calcule une dérivée. Les <em>Greeks</em> des options (Delta, Gamma, Vega, Theta, Rho) sont tous des dérivées du prix de l'option par rapport à différents paramètres de marché. La <em>couverture dynamique</em> (delta-hedging) consiste à ajuster continuellement une position en fonction de la dérivée du prix. En <em>analyse de sensibilité</em>, on utilise les dérivées pour mesurer l'impact d'un choc de 1% de volatilité ou de 10$/bbl sur le prix du pétrole. Sans dérivées, pas de pricing, pas de hedging, pas de risk management.
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
        <strong style={{ color: ACCENT }}>Dérivée partielle vs dérivée totale :</strong> Quand une fonction dépend de plusieurs variables — par exemple le prix d'une option C(S, σ, r, T) dépend du sous-jacent S, de la volatilité σ, du taux r et de la maturité T — on distingue deux notions. La <strong>dérivée partielle ∂C/∂S</strong> mesure la sensibilité de C à S en maintenant σ, r, T constants : c'est le Delta. La <strong>dérivée totale dC</strong> capture la variation de C quand tous les paramètres bougent simultanément : dC = (∂C/∂S)dS + (∂C/∂σ)dσ + (∂C/∂r)dr + (∂C/∂T)dT. C'est la base de la décomposition P&L (profit and loss) d'un portefeuille d'options.
      </div>

      <SectionTitle accent={ACCENT}>Dérivées partielles — Technique pas à pas</SectionTitle>
      <IntuitionBlock emoji="🔒" title='Principe fondamental : "geler" les autres variables' accent={ACCENT}>
        Pour calculer <strong>∂f/∂x</strong>, on traite toutes les variables autres que x comme des <strong>constantes</strong> et on applique les règles habituelles. C'est tout !
        <br /><br />
        <strong>Analogie :</strong> imaginez une carte topographique f(x, y). La dérivée ∂f/∂x est la pente quand vous marchez vers l'Est (x croît, y fixe). La dérivée ∂f/∂y est la pente vers le Nord (y croît, x fixe). Deux sensibilités différentes pour la même surface.
        <br /><br />
        En finance : ∂C/∂S répond à "comment varie mon option si S monte de 1€ et que <em>rien d'autre ne bouge</em> ?" — c'est exactement le Delta.
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
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Exemple 2 — Capitalisation continue : V(C, r, T) = C · e^(rT)</div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>V = valeur future d'un capital C placé à taux continu r pendant T années. Trois dérivées partielles, trois sensibilités :</div>
        <Step num={1} accent={ACCENT}><strong>∂V/∂C</strong> (r et T constants) : e^(rT) est un facteur constant → <strong>∂V/∂C = e^(rT)</strong>. Interprétation : 1€ de capital supplémentaire crée e^(rT)€ de valeur future.</Step>
        <Step num={2} accent={ACCENT}><strong>∂V/∂r</strong> (C et T constants) : règle de chaîne sur e^(rT) → dérivée par rapport à r = T·e^(rT) → <strong>∂V/∂r = C·T·e^(rT)</strong>. Interprétation : si r monte de 1%, la valeur future augmente de C·T·e^(rT).</Step>
        <Step num={3} accent={ACCENT}><strong>∂V/∂T</strong> (C et r constants) : même logique → <strong>∂V/∂T = C·r·e^(rT)</strong>. C'est le taux de croissance instantanée de la valeur.</Step>
        <FormulaBox accent={ACCENT}>∂V/∂C = e^(rT)   |   ∂V/∂r = C·T·e^(rT)   |   ∂V/∂T = C·r·e^(rT)</FormulaBox>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Exemple numérique : C = 1 000€, r = 5%, T = 2 ans → e^(0.10) ≈ 1.105.
          ∂V/∂r = 1000 × 2 × 1.105 = 2 210€/unité de taux. Si r monte de 1% (+0.01), V augmente d'environ +22.10€.
        </div>
      </div>

      <div style={{ background: T.panel2, borderRadius: 10, padding: 16, margin: '14px 0', border: `1px solid ${ACCENT}33` }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Exemple 3 — Le paramètre d₁ de Black-Scholes</div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 12 }}>
          d₁(S, σ, r, T) = [ln(S/K) + (r + σ²/2)·T] / (σ·√T), K = strike (constante).
          <br />Ce sont les briques de base de tous les Greeks — calculons les 4 dérivées partielles.
        </div>
        <Step num={1} accent={ACCENT}>
          <strong>∂d₁/∂S</strong> : seul ln(S/K) = ln(S) − ln(K) dépend de S.
          Règle de chaîne : ∂ln(S)/∂S = 1/S. Le dénominateur σ√T est constant.
          → <strong>∂d₁/∂S = 1 / (S·σ·√T)</strong>
        </Step>
        <Step num={2} accent={ACCENT}>
          <strong>∂d₁/∂σ</strong> : réécrivons d₁ = ln(S/K)/(σ√T) + r√T/σ + σ√T/2.
          Trois termes : ∂/∂σ[ln(S/K)/(σ√T)] = −ln(S/K)/(σ²√T), ∂/∂σ[r√T/σ] = −r√T/σ², ∂/∂σ[σ√T/2] = √T/2.
          → <strong>∂d₁/∂σ = −[ln(S/K) + rT] / (σ²√T) + √T/2</strong>
        </Step>
        <Step num={3} accent={ACCENT}>
          <strong>∂d₁/∂r</strong> : seul le terme rT/(σ√T) = r·√T/σ dépend de r.
          → <strong>∂d₁/∂r = √T / σ</strong>
        </Step>
        <Step num={4} accent={ACCENT}>
          <strong>∂d₁/∂T</strong> : posons d₁ = (A + B·T)/(σ√T) où A = ln(S/K), B = r + σ²/2.
          Règle du quotient : ∂/∂T[(A+BT)·(σ√T)⁻¹] = B/(σ√T) − (A+BT)·σ/(2σ²T√T) = [BT − A] / (2T·σ√T).
          → <strong>∂d₁/∂T = [(r + σ²/2)T − ln(S/K)] / (2T·σ√T)</strong>
        </Step>
        <FormulaBox accent={ACCENT}>∂d₁/∂S = 1/(Sσ√T)     ∂d₁/∂σ = −(ln(S/K)+rT)/(σ²√T) + √T/2{'\n'}∂d₁/∂r = √T/σ           ∂d₁/∂T = [(r+σ²/2)T − ln(S/K)] / (2Tσ√T)</FormulaBox>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
          Note : d₂ = d₁ − σ√T, donc ∂d₂/∂S = ∂d₁/∂S et ∂d₂/∂r = ∂d₁/∂r (σ√T ne dépend pas de S ni r).
          En revanche : ∂d₂/∂σ = ∂d₁/∂σ − √T et ∂d₂/∂T = ∂d₁/∂T − σ/(2√T).
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

      <SectionTitle accent={ACCENT}>Les Greeks de Black-Scholes — Dérivation complète</SectionTitle>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Chaque Greek est une <strong style={{ color: T.text }}>dérivée partielle</strong> du prix C par rapport à un paramètre de marché. On part de la formule de Black-Scholes et on dérive pas à pas. Toutes les dérivations exploitent une même identité remarquable qui élimine les termes complexes.
      </div>

      <FormulaBox accent={ACCENT} label="Formule de Black-Scholes (call européen) — point de départ de tous les Greeks">
        C = S·N(d₁) − K·e^(−rT)·N(d₂){'\n'}d₁ = [ln(S/K) + (r + σ²/2)·T] / (σ·√T)   ,   d₂ = d₁ − σ·√T
      </FormulaBox>

      <SymbolLegend accent={ACCENT} symbols={[
        ['N(·)', 'CDF de la loi normale standard — P(Z ≤ x)'],
        ['φ(·)', 'PDF de la loi normale standard — N′(·) = (1/√2π)·e^(−x²/2)'],
        ['d₁, d₂', 'Arguments de la loi normale (dépendent de S, σ, r, T)'],
      ]} />

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}44`, borderRadius: 10, padding: 16, margin: '14px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>🔑 Identité clé utilisée dans toutes les dérivations : S·φ(d₁) = K·e^(−rT)·φ(d₂)</div>
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 10, lineHeight: 1.6 }}>
          Cette identité permet d'annuler des termes croisés dans toutes les dérivées partielles. Voici sa preuve :
        </div>
        <Step num={1} accent={ACCENT}>φ(d₁)/φ(d₂) = e^[−(d₁²−d₂²)/2]. Factorisons : d₁²−d₂² = (d₁+d₂)·(d₁−d₂) = (d₁+d₂)·σ√T.</Step>
        <Step num={2} accent={ACCENT}>d₁+d₂ = 2·[ln(S/K) + rT]/(σ√T), donc (d₁²−d₂²)/2 = ln(S/K) + rT = ln(S·e^(rT)/K).</Step>
        <Step num={3} accent={ACCENT}>φ(d₁)/φ(d₂) = e^[−ln(S·e^(rT)/K)] = K·e^(−rT)/S → <strong>S·φ(d₁) = K·e^(−rT)·φ(d₂) ✓</strong></Step>
      </div>

      <Accordion title="Δ Delta = ∂C/∂S — Dérivation complète" accent={ACCENT} badge="Greek 1">
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>
          Question : si S monte de 1€ et que rien d'autre ne bouge, de combien varie C ?
          <br />On dérive C = S·N(d₁) − K·e^(−rT)·N(d₂) par rapport à S. Attention : d₁ et d₂ dépendent aussi de S via ln(S/K).
        </div>
        <Step num={1} accent={ACCENT}>Règle du produit sur S·N(d₁) : ∂/∂S[S·N(d₁)] = 1·N(d₁) + S·N′(d₁)·∂d₁/∂S = N(d₁) + S·φ(d₁)·<strong>1/(S·σ√T)</strong></Step>
        <Step num={2} accent={ACCENT}>Dériver −K·e^(−rT)·N(d₂) : −K·e^(−rT)·φ(d₂)·∂d₂/∂S. Or ∂d₂/∂S = ∂d₁/∂S = 1/(S·σ√T) (car d₂ = d₁ − σ√T, constante en S). → −K·e^(−rT)·φ(d₂)·<strong>1/(S·σ√T)</strong></Step>
        <Step num={3} accent={ACCENT}>Assembler les deux termes : Δ = N(d₁) + <strong>[S·φ(d₁) − K·e^(−rT)·φ(d₂)]</strong> / (S·σ√T)</Step>
        <Step num={4} accent={ACCENT}>Identité clé : S·φ(d₁) = K·e^(−rT)·φ(d₂) → le crochet est exactement <strong>zéro !</strong></Step>
        <FormulaBox accent={ACCENT}>Δ_call = N(d₁) ∈ [0, 1]   |   Δ_put = N(d₁) − 1 = −N(−d₁) ∈ [−1, 0]</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
          <strong>Interprétation géométrique :</strong> N(d₁) est la valeur de la CDF normale en d₁. Pour une option ATM (S≈K, T moyen), d₁ ≈ 0 → Δ ≈ N(0) = 0.5. Pour une option deep-ITM, d₁ → +∞ → Δ → 1. Pour deep-OTM, d₁ → −∞ → Δ → 0.
          <br /><br />
          <strong>Exemple Brent :</strong> S=80$, K=85$, σ=35%, r=3%, T=0.5. d₁ ≈ −0.06, N(−0.06) ≈ 0.476 → Δ ≈ 0.48. Si le Brent monte de 1$, le call gagne ~0.48$.
        </div>
      </Accordion>

      <Accordion title="Γ Gamma = ∂²C/∂S² — Dérivation complète" accent={ACCENT} badge="Greek 2">
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>
          Gamma est la dérivée de Delta par rapport à S — la "courbure" du prix. Il mesure à quelle vitesse Delta change quand S bouge.
        </div>
        <Step num={1} accent={ACCENT}>Γ = ∂Δ/∂S = ∂N(d₁)/∂S (puisqu'on vient de montrer que Δ = N(d₁))</Step>
        <Step num={2} accent={ACCENT}>Règle de chaîne : ∂N(d₁)/∂S = N′(d₁)·∂d₁/∂S = φ(d₁)·<strong>1/(S·σ·√T)</strong> (on utilise ∂d₁/∂S calculé dans l'Exemple 3 ci-dessus)</Step>
        <FormulaBox accent={ACCENT}>Γ = φ(d₁) / (S·σ·√T) ≥ 0   (identique pour call et put)</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
          <strong>Gamma est le même pour le call et le put</strong> (par parité call-put, Δ_call − Δ_put = 1, donc leurs Gamma sont égaux).
          <br /><br />
          Gamma est maximal pour les options ATM proches de l'expiration : σ√T → 0 fait exploser Γ.
          <br /><br />
          <strong>Exemple :</strong> S=100, K=100 (ATM), σ=20%, T=0.25. d₁ ≈ 0.05 → φ(d₁) ≈ 0.399. Γ = 0.399 / (100 × 0.20 × 0.5) = 0.399/10 ≈ <strong>0.040</strong>. Si S monte de 1€, le Delta augmente d'environ 0.040 — la couverture doit être rebalancée.
        </div>
      </Accordion>

      <Accordion title="ν Vega = ∂C/∂σ — Dérivation complète" accent={ACCENT} badge="Greek 3">
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>
          Question : si la volatilité implicite monte de 1%, de combien varie C ?
          <br />On dérive C par rapport à σ. Attention : d₁ et d₂ dépendent tous deux de σ de façon différente.
        </div>
        <Step num={1} accent={ACCENT}>∂C/∂σ = S·φ(d₁)·∂d₁/∂σ − K·e^(−rT)·φ(d₂)·∂d₂/∂σ</Step>
        <Step num={2} accent={ACCENT}>Factoriser avec l'identité clé S·φ(d₁) = K·e^(−rT)·φ(d₂) :
          <br />∂C/∂σ = S·φ(d₁)·<strong>(∂d₁/∂σ − ∂d₂/∂σ)</strong></Step>
        <Step num={3} accent={ACCENT}>Or d₁ − d₂ = σ√T (par définition), donc ∂(d₁−d₂)/∂σ = ∂(σ√T)/∂σ = <strong>√T</strong>. Le terme ∂d₁/∂σ − ∂d₂/∂σ = √T.</Step>
        <FormulaBox accent={ACCENT}>ν = S·φ(d₁)·√T ≥ 0   (identique pour call et put)</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
          <strong>L'astuce de l'étape 2</strong> est la même identité que pour Delta : elle transforme deux termes complexes en une soustraction simple. C'est pourquoi apprendre cette identité une fois suffit pour tous les Greeks.
          <br /><br />
          Vega est toujours positif : plus de vol → option plus précieuse (call et put). Sur les marchés de l'énergie, la vol peut doubler lors d'une crise géopolitique (ex: WTI : 30% → 80% en 2022) — Vega permet de chiffrer l'impact.
          <br /><br />
          <strong>Exemple :</strong> S=100, σ=25%, T=1. φ(d₁) ≈ 0.38. ν = 100 × 0.38 × 1 = <strong>38€ par unité de vol</strong>. Si σ passe de 25% à 26% (+0.01), le call gagne 38 × 0.01 = 0.38€.
        </div>
      </Accordion>

      <Accordion title="Θ Theta = ∂C/∂t — Étapes principales" accent={ACCENT} badge="Greek 4">
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>
          Theta mesure l'érosion temporelle. Convention : t = temps écoulé (T = maturité − t). Quand t augmente d'un jour, T diminue d'un jour. Theta = ∂C/∂t = −∂C/∂T.
        </div>
        <Step num={1} accent={ACCENT}>∂C/∂T = ∂/∂T[S·N(d₁)] − ∂/∂T[K·e^(−rT)·N(d₂)]
          <br />= S·φ(d₁)·∂d₁/∂T + r·K·e^(−rT)·N(d₂) − K·e^(−rT)·φ(d₂)·∂d₂/∂T</Step>
        <Step num={2} accent={ACCENT}>Regrouper les termes en d₁ et d₂ avec l'identité clé :
          <br />S·φ(d₁)·∂d₁/∂T − K·e^(−rT)·φ(d₂)·∂d₂/∂T = S·φ(d₁)·<strong>(∂d₁/∂T − ∂d₂/∂T)</strong></Step>
        <Step num={3} accent={ACCENT}>∂d₁/∂T − ∂d₂/∂T = ∂(d₁−d₂)/∂T = ∂(σ√T)/∂T = <strong>σ/(2√T)</strong></Step>
        <Step num={4} accent={ACCENT}>∂C/∂T = S·φ(d₁)·σ/(2√T) + r·K·e^(−rT)·N(d₂). Theta = −∂C/∂T :</Step>
        <FormulaBox accent={ACCENT}>Θ_call = −S·φ(d₁)·σ/(2√T) − r·K·e^(−rT)·N(d₂) {'<'} 0</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
          Les deux termes sont négatifs (φ {'>'} 0, N(d₂) {'>'} 0, r {'>'} 0) → Theta est toujours négatif pour l'acheteur d'option.
          En pratique, Theta s'exprime <em>par jour</em> : Θ_jour = Θ_annuel / 365 (ou /252 pour jours ouvrés).
          <br /><br />
          <strong>Exemple :</strong> S=100, K=100, σ=20%, r=3%, T=0.25. Θ ≈ −7€/an ≈ −<strong>0.019€/jour</strong>. L'option perd environ 2 centimes chaque jour qui passe, même si le marché ne bouge pas.
        </div>
      </Accordion>

      <Accordion title="ρ Rho = ∂C/∂r — Dérivation complète" accent={ACCENT} badge="Greek 5">
        <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>
          Question : si le taux sans risque monte de 1%, de combien varie C ?
          <br />On dérive C par rapport à r. d₁ et d₂ dépendent de r via le terme r·T.
        </div>
        <Step num={1} accent={ACCENT}>∂C/∂r = S·φ(d₁)·∂d₁/∂r + K·T·e^(−rT)·N(d₂) − K·e^(−rT)·φ(d₂)·∂d₂/∂r</Step>
        <Step num={2} accent={ACCENT}>Or ∂d₁/∂r = ∂d₂/∂r = √T/σ (d₁ et d₂ diffèrent d'une constante σ√T indépendante de r)</Step>
        <Step num={3} accent={ACCENT}>Regrouper le 1er et le 3e terme : [S·φ(d₁) − K·e^(−rT)·φ(d₂)]·(√T/σ) = <strong>0</strong> par l'identité clé !</Step>
        <Step num={4} accent={ACCENT}>Il ne reste que le terme du milieu :</Step>
        <FormulaBox accent={ACCENT}>ρ_call = K·T·e^(−rT)·N(d₂) {'>'} 0   |   ρ_put = −K·T·e^(−rT)·N(−d₂) {'<'} 0</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
          <strong>Interprétation :</strong> quand les taux montent, la valeur actualisée du strike K·e^(−rT) diminue → acheter l'actif coûte moins cher en termes actualisés → le call s'apprécie. Pour le put, c'est l'inverse.
          <br /><br />
          Rho est secondaire sur les options courtes (T petit) mais crucial pour les options long terme {'>'} 1 an (contrats énergétiques pluriannuels).
          <br /><br />
          <strong>Exemple :</strong> K=100, T=1, r=3%, N(d₂)=0.50. ρ = 100×1×e^(−0.03)×0.50 ≈ <strong>48.5€ par unité de r</strong>. Si r passe de 3% à 4% (+0.01), le call gagne 48.5 × 0.01 ≈ 0.49€.
        </div>
      </Accordion>

      <div style={{ background: T.panel2, borderRadius: 10, padding: 14, margin: '16px 0', border: `1px solid ${ACCENT}22` }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 13, marginBottom: 10 }}>Récapitulatif — Les 5 Greeks en un coup d'œil</div>
        <Grid cols={2} gap="8px">
          {[
            { g: 'Δ Delta', f: 'N(d₁)', d: '∂C/∂S', i: 'Sensibilité au prix ∈ [0,1]' },
            { g: 'Γ Gamma', f: 'φ(d₁)/(Sσ√T)', d: '∂²C/∂S²', i: 'Convexité, variation du Delta' },
            { g: 'ν Vega', f: 'S·φ(d₁)·√T', d: '∂C/∂σ', i: 'Sensibilité à la vol. ≥ 0' },
            { g: 'Θ Theta', f: '−S·φ(d₁)·σ/(2√T) − rKe^(−rT)N(d₂)', d: '∂C/∂t', i: 'Érosion temporelle ≤ 0' },
            { g: 'ρ Rho', f: 'K·T·e^(−rT)·N(d₂)', d: '∂C/∂r', i: 'Sensibilité aux taux ≥ 0' },
          ].map(({ g, f, d, i }) => (
            <div key={g} style={{ background: T.bg, borderRadius: 8, padding: '10px 12px', border: `1px solid ${ACCENT}22` }}>
              <div style={{ color: ACCENT, fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{g} = {d}</div>
              <code style={{ color: T.text, fontSize: 10, display: 'block', marginBottom: 4 }}>{f}</code>
              <div style={{ color: T.muted, fontSize: 11 }}>{i}</div>
            </div>
          ))}
        </Grid>
      </div>

      <IntuitionBlock emoji="💡" title="Décomposition P&L : comprendre chaque source de profit/perte" accent={ACCENT}>
        Un portefeuille d'options voit sa valeur changer chaque jour. La <strong>décomposition P&L</strong> permet d'attribuer chaque centime de gain ou de perte à une cause précise. Par la formule de Taylor au second ordre appliquée au prix de l'option C(S, σ, t) :
        <br /><br />
        <strong>ΔC ≈ Δ × ΔS + ½ × Γ × ΔS² + Θ × Δt + ν × Δσ</strong>
        <br /><br />
        — <strong>Δ × ΔS</strong> : profit/perte lié au mouvement du sous-jacent (exposition directionnelle). Si Delta = 0.6 et le pétrole monte de 2$, contribution = +1.20$.<br />
        — <strong>½ × Γ × ΔS²</strong> : profit lié à la convexité (le Gamma est toujours positif pour un acheteur d'option : on gagne toujours sur les grands mouvements dans les deux sens).<br />
        — <strong>Θ × Δt</strong> : coût du temps qui passe (négatif chaque nuit pour l'acheteur).<br />
        — <strong>ν × Δσ</strong> : gain/perte lié à un mouvement de la volatilité implicite (sur les marchés de l'énergie, ce terme peut dominer lors de publications d'inventaires EIA).<br />
        <br />
        En pratique, un delta-hedge annule le premier terme, laissant un P&L dominé par Gamma et Theta — d'où le célèbre arbitrage Gamma/Theta.
      </IntuitionBlock>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie du P&L Taylor — chaque terme</div>
        <Step num={1} accent={ACCENT}><strong>Δ·ΔS</strong> — contribution directionnelle : si Delta = 0.6 et le sous-jacent monte de 2$, ce terme vaut +1.20$. Le delta-hedge vise à annuler ce terme en détenant -Δ unités du sous-jacent.</Step>
        <Step num={2} accent={ACCENT}><strong>½Γ·(ΔS)²</strong> — gain de convexité : toujours positif pour l'acheteur d'option (long Gamma). Si Γ = 0.012 et ΔS = 2$, contribution = ½ × 0.012 × 4 = +0.024$. Ce terme est quadratique : doubler le choc quadruple le gain Gamma.</Step>
        <Step num={3} accent={ACCENT}><strong>Θ·Δt</strong> — érosion temporelle : toujours négatif pour l'acheteur. Si Θ = -0.08€/jour, on perd 0.08€ chaque nuit même si le marché ne bouge pas. L'érosion s'accélère à l'approche de la maturité.</Step>
        <Step num={4} accent={ACCENT}><strong>ν·Δσ</strong> — gain/perte sur variation de vol implicite : si Vega = 0.25€/vol% et la vol baisse de 0.5%, contribution = -0.125€. Sur les marchés de l'énergie, ce terme peut dominer lors de publications EIA.</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : la relation Θ + ½Γσ²S² = rV (EDP de Black-Scholes) montre que le coût du temps (Θ) est exactement compensé par le gain Gamma espéré sous volatilité σ. Un portefeuille delta-hedgé génère un P&L nul en espérance — le vrai risque est la réalisation effective de la vol vs la vol implicite payée.
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
      <Accordion title="Exercice 2 — Delta d'un call" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Un call European a C(S) = S × N(d₁) - K×e^(-rT) × N(d₂). Quelle est la formule de Delta ?
        </p>
        <Step num={1} accent={ACCENT}>Delta = ∂C/∂S — on dérive par rapport à S</Step>
        <Step num={2} accent={ACCENT}>Par le théorème de différenciation : Delta = N(d₁) + S × N'(d₁) × ∂d₁/∂S - K×e^(-rT) × N'(d₂) × ∂d₂/∂S</Step>
        <Step num={3} accent={ACCENT}>On peut montrer que S × N'(d₁) × ∂d₁/∂S = K×e^(-rT) × N'(d₂) × ∂d₂/∂S (ces deux termes se compensent)</Step>
        <FormulaBox accent={ACCENT}>Delta_call = N(d₁) ∈ [0, 1]</FormulaBox>
      </Accordion>
      <Accordion title="Exercice 3 — Règle de chaîne (Vega)" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Si C dépend de d₁(σ) et d₂(σ), calculez ∂C/∂σ sachant d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T)
        </p>
        <Step num={1} accent={ACCENT}>∂d₁/∂σ = √T - [ln(S/K) + rT]/(σ²√T) = ... après simplification = √T - d₂/σ</Step>
        <Step num={2} accent={ACCENT}>∂d₂/∂σ = ∂d₁/∂σ - √T</Step>
        <Step num={3} accent={ACCENT}>Vega = S × N'(d₁) × √T (après simplification des termes)</Step>
        <FormulaBox accent={ACCENT}>Vega = S × N'(d₁) × √T = S × φ(d₁) × √T ≥ 0</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>φ(d₁) est la densité normale standard (toujours positive) → Vega est toujours positive</div>
      </Accordion>
      <Accordion title="Exercice 4 — Dérivées partielles d'une fonction à 2 variables" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Soit f(S, σ) = S² × σ + 3S × ln(σ). Calculez ∂f/∂S et ∂f/∂σ, puis évaluez-les en S=100, σ=0.2.
        </p>
        <Step num={1} accent={ACCENT}>∂f/∂S : on dérive par rapport à S en traitant σ comme une constante → ∂f/∂S = 2S × σ + 3 × ln(σ)</Step>
        <Step num={2} accent={ACCENT}>∂f/∂σ : on dérive par rapport à σ en traitant S comme une constante → ∂f/∂σ = S² + 3S × (1/σ) = S² + 3S/σ</Step>
        <Step num={3} accent={ACCENT}>En S=100, σ=0.2 : ∂f/∂S = 2×100×0.2 + 3×ln(0.2) = 40 + 3×(-1.609) = 40 - 4.83 = 35.17</Step>
        <Step num={4} accent={ACCENT}>En S=100, σ=0.2 : ∂f/∂σ = 100² + 3×100/0.2 = 10000 + 1500 = 11500</Step>
        <FormulaBox accent={ACCENT}>∂f/∂S|_(100,0.2) ≈ 35.17   |   ∂f/∂σ|_(100,0.2) = 11500</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>Interprétation : si S monte de 1 unité (prix du pétrole +1$), f augmente d'environ 35.17. Si σ monte de 0.01 (1% de vol supplémentaire), f augmente d'environ 115.</div>
      </Accordion>
      <Accordion title="Exercice 5 — Attribution P&L d'un portefeuille d'options" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Un trader détient un call sur le Brent avec Delta=0.55, Gamma=0.012, Theta=-0.08€/jour, Vega=0.25€/vol%. Pendant la nuit : le Brent monte de 2$, la vol implicite baisse de 0.5%. Calculez la décomposition P&L.
        </p>
        <Step num={1} accent={ACCENT}>Contribution Delta : Δ × ΔS = 0.55 × 2 = +1.10€</Step>
        <Step num={2} accent={ACCENT}>Contribution Gamma : ½ × Γ × ΔS² = 0.5 × 0.012 × 4 = +0.024€</Step>
        <Step num={3} accent={ACCENT}>Contribution Theta : Θ × Δt = -0.08 × 1 = -0.08€ (une nuit passée)</Step>
        <Step num={4} accent={ACCENT}>Contribution Vega : ν × Δσ = 0.25 × (-0.5) = -0.125€</Step>
        <FormulaBox accent={ACCENT}>P&L total ≈ 1.10 + 0.024 - 0.08 - 0.125 = +0.919€</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
          Analyse : le mouvement favorable du prix du pétrole (+1.10€) est partiellement annulé par la compression de volatilité (-0.125€) et le passage du temps (-0.08€). La convexité (Gamma) apporte un faible gain supplémentaire.
        </div>
      </Accordion>
    </div>
  )
}

// ─── Tab: Intégrales ──────────────────────────────────────────────────────────
function IntegTab() {
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
        L'intégrale est omniprésente en finance quantitative à travers trois usages fondamentaux. <strong style={{ color: T.text }}>(a) Probabilité comme aire</strong> : la probabilité qu'une variable aléatoire tombe dans un intervalle [a, b] est exactement l'intégrale de sa densité de probabilité sur cet intervalle — P(a ≤ X ≤ b) = ∫[a,b] f(x)dx. <strong style={{ color: T.text }}>(b) Espérance comme intégrale pondérée</strong> : l'espérance E[X] = ∫ x · f(x) dx est une moyenne "continue" où chaque valeur possible x est pondérée par sa probabilité d'occurrence f(x)dx. <strong style={{ color: T.text }}>(c) Pricing par espérance actualisée</strong> : le prix d'un dérivé est l'espérance actualisée de son payoff futur sous la mesure risque-neutre — C = e^(-rT) × E_Q[payoff(S_T)] = e^(-rT) × ∫ max(S-K, 0) × f_Q(S) dS. C'est la philosophie profonde derrière la formule de Black-Scholes.
      </div>
      <IntuitionBlock emoji="📐" title="L'intégrale = superficie sous la courbe" accent={ACCENT}>
        Imaginez une route avec une vitesse variable. L'intégrale de la vitesse sur [a,b] donne
        la distance parcourue. En probabilités : l'intégrale de la densité normale sur [a,b]
        donne P(a ≤ X ≤ b). En finance : ∫ payoff × densité donne l'espérance du payoff → c'est
        le cœur du pricing par risque-neutre.
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
        C'est la généralisation continue de la moyenne : au lieu de sommer x_i × P(X=x_i), on intègre x × f(x) sur tous les x possibles. En finance, l'espérance du payoff d'un call européen avant actualisation vaut :
      </div>
      <FormulaBox accent={ACCENT} label="Espérance du payoff d'un call">
        E[max(S_T - K, 0)] = ∫[K, +∞] (s - K) · f(s) ds
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        L'intégrale part de K (car le payoff est nul pour S_T {'<'} K) jusqu'à +∞. La résolution de cette intégrale sous hypothèse log-normale de f(s) donne exactement la formule de Black-Scholes : C = S₀N(d₁) - Ke^(-rT)N(d₂).
      </div>

      <SectionTitle accent={ACCENT}>Lien avec la probabilité normale</SectionTitle>
      <FormulaBox accent={ACCENT} label="CDF normale standard">
        N(d) = P(Z ≤ d) = ∫[-∞, d] φ(x) dx   où φ(x) = (1/√2π) e^(-x²/2)
      </FormulaBox>
      <div style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>
        N(d₁) dans Black-Scholes est exactement cette intégrale évaluée en d₁ — c'est la probabilité
        risque-neutre que S_T ≥ K à maturité.
      </div>

      <IntuitionBlock emoji="∫" title="N(d₁) et N(d₂) : des intégrales de la gaussienne" accent={ACCENT}>
        Quand vous lisez dans une table de loi normale "N(1.96) = 0.975", vous lisez en réalité la valeur d'une intégrale : ∫[-∞, 1.96] (1/√2π) × e^(-x²/2) dx = 0.975. Cette intégrale n'a pas de forme fermée analytique simple — c'est pourquoi les <strong>tables de la loi normale standard</strong> ont été si précieuses avant l'informatique, et pourquoi les fonctions d'approximation numérique (comme la formule de Zelen & Severo à 5 termes) sont essentielles dans le code de pricing. N(d₂) représente la probabilité risque-neutre que l'option finisse dans la monnaie (S_T {'>'} K) ; N(d₁) est une probabilité ajustée pondérant aussi le gain conditionnel.
      </IntuitionBlock>

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
      <Accordion title="Exercice 2 — Lien probabilité / intégrale" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 8 }}>Un actif suit une loi N(0,1). Quelle est la probabilité P(-1.96 ≤ Z ≤ 1.96) ?</p>
        <Step num={1} accent={ACCENT}>P(-1.96 ≤ Z ≤ 1.96) = N(1.96) - N(-1.96)</Step>
        <Step num={2} accent={ACCENT}>Par symétrie : N(-1.96) = 1 - N(1.96)</Step>
        <Step num={3} accent={ACCENT}>N(1.96) ≈ 0.9750</Step>
        <FormulaBox accent={ACCENT}>P(-1.96 ≤ Z ≤ 1.96) = 2 × 0.9750 - 1 = 95%</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12 }}>→ Base de la VaR 95% : 5% de probabilité que Z {'<'} -1.645</div>
      </Accordion>
      <Accordion title="Exercice 3 — Espérance d'un payoff log-normal" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Un call sur le Brent : S₀ = 80$/bbl, K = 85$, r = 3%, σ = 35%, T = 0.5 an (mesure risque-neutre). Calculez E_Q[max(S_T - 85, 0)] = ∫[85, +∞] (s - 85) · f_Q(s) ds par la formule Black-Scholes, puis actualisez.
        </p>
        <Step num={1} accent={ACCENT}>Sous Q (mesure risque-neutre), le drift est r=3%. Paramètre log-normal : µ̃ = r - σ²/2 = 0.03 - 0.0612 = -0.0312. σ_ln = 0.35 × √0.5 = 0.2475</Step>
        <Step num={2} accent={ACCENT}>d₁ = [ln(80/85) + (0.03 + 0.35²/2)×0.5] / (0.35×√0.5) = [-0.0606 + 0.0456] / 0.2475 = -0.0150/0.2475 = -0.0606</Step>
        <Step num={3} accent={ACCENT}>d₂ = d₁ - σ√T = -0.0606 - 0.2475 = -0.3081</Step>
        <Step num={4} accent={ACCENT}>C = 80 × N(-0.0606) - 85 × e^(-0.015) × N(-0.3081) = 80 × 0.4758 - 83.73 × 0.3791</Step>
        <FormulaBox accent={ACCENT}>C = 38.07 - 31.74 = 6.33$/bbl</FormulaBox>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
          Interprétation : l'espérance actualisée du payoff max(S_T-85,0) est 6.33$/bbl. C'est le prix "juste" de cette option Brent à 6 mois selon Black-Scholes, soit environ 7.9% du prix spot.
        </div>
      </Accordion>
    </div>
  )
}

// ─── Tab: Exp & Log ───────────────────────────────────────────────────────────
function ExpLogTab() {
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
function AlgebraTab() {
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
