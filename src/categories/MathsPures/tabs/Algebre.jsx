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
        L'algèbre linéaire est le langage naturel de la finance multi-actifs. Un <strong style={{ color: T.text }}>portefeuille</strong> est un vecteur de positions <K>{"\\mathbf{w} = (w_1, w_2, \\ldots, w_n)"}</K> où <K>{"w_i"}</K> est le poids alloué à l'actif <K>{"i"}</K>. Les <strong style={{ color: T.text }}>rendements espérés</strong> forment un vecteur <K>{"\\boldsymbol{\\mu} = (\\mu_1, \\mu_2, \\ldots, \\mu_n)"}</K>. La <strong style={{ color: T.text }}>matrice de covariance</strong> <K>{"\\Sigma"}</K> (de taille <K>{"n \\times n"}</K>) capture toutes les relations entre actifs : <K>{"\\Sigma_{ii} = \\sigma_i^2"}</K> (variance de l'actif <K>{"i"}</K>), <K>{"\\Sigma_{ij} = \\text{Cov}(i,j)"}</K> (covariance entre <K>{"i"}</K> et <K>{"j"}</K>). La variance du portefeuille s'écrit élégamment <K>{"\\sigma_p^2 = \\mathbf{w}^\\top \\Sigma\\, \\mathbf{w}"}</K> — un simple produit de matrices. L'<strong style={{ color: T.text }}>optimisation de Markowitz</strong> (trouver le portefeuille de variance minimale pour un rendement cible) se résout avec des outils d'algèbre linéaire (multiplicateurs de Lagrange, inversion de matrices). Sur les marchés de l'énergie, <K>{"\\Sigma"}</K> regroupe pétrole, gaz, électricité, charbon — des actifs aux dynamiques saisonnières et géopolitiques complexes.
      </div>
      <IntuitionBlock emoji="🗺️" title="Les matrices = transformations dans l'espace" accent={ACCENT}>
        Une matrice est un tableau de chiffres qui décrit comment transformer l'espace.
        En finance, la matrice de covariance décrit "comment les actifs bougent ensemble".
        Si pétrole et gaz montent souvent ensemble : corrélation <K>{"\\rho > 0"}</K> → le risque d'un portefeuille
        pétrole+gaz n'est pas simplement la somme des risques individuels !
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Matrice de covariance (2 actifs)</SectionTitle>
      <FormulaBox accent={ACCENT} label="Σ = matrice de variance-covariance">
        <K display>{"\\Sigma = \\begin{bmatrix} \\sigma_1^2 & \\rho\\,\\sigma_1\\,\\sigma_2 \\\\ \\rho\\,\\sigma_1\\,\\sigma_2 & \\sigma_2^2 \\end{bmatrix}"}</K>
      </FormulaBox>

      <div style={{ background: T.panel2, borderRadius: 8, padding: 16, margin: '12px 0', fontFamily: 'monospace', color: T.text, fontSize: 13 }}>
        Σ = [ {(sigma1 * sigma1).toFixed(4)}  {covXY.toFixed(4)} ]
            [ {covXY.toFixed(4)}  {(sigma2 * sigma2).toFixed(4)} ]
      </div>

      <FormulaBox accent={ACCENT} label="Variance de portefeuille (w₁=60%, w₂=40%)">
        <K display>{"\\sigma_p^2 = w_1^2 \\sigma_1^2 + 2 w_1 w_2 \\rho\\,\\sigma_1\\,\\sigma_2 + w_2^2 \\sigma_2^2 = \\mathbf{w}^\\top \\Sigma\\, \\mathbf{w}"}</K>
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
        <K display>{"\\rho(X,Y) = \\frac{\\text{Cov}(X,Y)}{\\sigma_X \\times \\sigma_Y} \\quad \\text{avec } \\text{Cov}(X,Y) = E[(X - \\mu_X)(Y - \\mu_Y)]"}</K>
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
        La matrice de covariance <K>{"\\Sigma"}</K> peut être décomposée en valeurs propres <K>{"\\lambda_i"}</K> et vecteurs propres <K>{"\\mathbf{v}_i"}</K> : <K>{"\\Sigma = V \\Lambda V^\\top"}</K>. Cette décomposition a une interprétation géométrique et financière profonde.
      </div>
      <Grid cols={2} gap="10px">
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Vecteurs propres = directions de risque</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>Chaque vecteur propre <K>{"\\mathbf{v}_i"}</K> représente une "direction de risque principal" — une combinaison linéaire des actifs dont les rendements sont décorrélés des autres directions. C'est le principe de l'<strong>Analyse en Composantes Principales (ACP)</strong> appliquée aux marchés financiers.</div>
        </div>
        <div style={{ background: T.panel2, borderRadius: 8, padding: '14px', border: `1px solid ${ACCENT}22` }}>
          <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>Valeurs propres = variance expliquée</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>La valeur propre <K>{"\\lambda_i"}</K> est la variance du portefeuille aligné sur <K>{"\\mathbf{v}_i"}</K>. La part de variance expliquée par la i-ème composante est <K>{"\\lambda_i / (\\sum \\lambda_j)"}</K>. Sur les marchés de l'énergie, la première composante (niveau général des prix) explique souvent 60-70% de la variance totale.</div>
        </div>
      </Grid>

      <IntuitionBlock emoji="✅" title="Σ doit être semi-définie positive" accent={ACCENT}>
        Une matrice de covariance valide doit être <strong>semi-définie positive (SDP)</strong> : pour tout vecteur de poids <K>{"\\mathbf{w}"}</K>, la variance du portefeuille <K>{"\\mathbf{w}^\\top \\Sigma\\, \\mathbf{w} \\ge 0"}</K>. En termes de valeurs propres, toutes doivent être <K>{"\\ge 0"}</K>. En pratique, cette propriété peut être violée quand on estime <K>{"\\Sigma"}</K> sur peu de données (matrice dégénérée) ou quand on utilise des corrélations inconsistantes (ex: <K>{"\\rho(A,C)"}</K> {'>'} <K>{"\\rho(A,B) \\times \\rho(B,C)"}</K> dans certaines configurations). La décomposition de Cholesky échoue si <K>{"\\Sigma"}</K> n'est pas SDP — c'est une vérification utile en pratique.
      </IntuitionBlock>

      <SectionTitle accent={ACCENT}>Décomposition de Cholesky</SectionTitle>
      <IntuitionBlock emoji="🔧" title="Cholesky : générer des actifs corrélés" accent={ACCENT}>
        Pour simuler 2 actifs corrélés, on décompose <K>{"\\Sigma = L \\times L^\\top"}</K> (Cholesky).
        Puis : <K>{"[X, Y] = L \\times [Z_1, Z_2]^\\top"}</K> où <K>{"Z_1, Z_2 \\sim \\mathcal{N}(0,1)"}</K> indépendants.
        C'est exactement ce que fait le scatter plot ci-dessus !
      </IntuitionBlock>
      <FormulaBox accent={ACCENT} label="Cholesky pour 2 actifs">
        <K display>{"L = \\begin{bmatrix} \\sigma_1 & 0 \\\\ \\rho\\,\\sigma_2 & \\sigma_2\\sqrt{1 - \\rho^2} \\end{bmatrix}"}</K>
        <K display>{"X = \\sigma_1 Z_1 \\qquad Y = \\rho\\,\\sigma_2\\,Z_1 + \\sigma_2\\sqrt{1 - \\rho^2}\\, Z_2"}</K>
      </FormulaBox>

      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16, margin: '16px 0' }}>
        <div style={{ color: ACCENT, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Anatomie de la décomposition de Cholesky</div>
        <Step num={1} accent={ACCENT}><strong>L est la matrice triangulaire inférieure</strong> telle que <K>{"\\Sigma = L \\cdot L^\\top"}</K>. Elle transforme des bruits indépendants <K>{"\\varepsilon \\sim \\mathcal{N}(0, I)"}</K> en un vecteur corrélé <K>{"Z = L \\cdot \\varepsilon"}</K> ayant exactement la structure de covariance cible <K>{"\\Sigma"}</K>.</Step>
        <Step num={2} accent={ACCENT}><strong>Chaque <K>{"Z_i = \\sum_j L_{ij} \\cdot \\varepsilon_j"}</K></strong> où <K>{"\\varepsilon \\sim \\mathcal{N}(0, I)"}</K> indépendant. Pour 2 actifs : <K>{"Z_1 = \\sigma_1 \\varepsilon_1"}</K> (indépendant du second) ; <K>{"Z_2 = \\rho\\,\\sigma_2\\,\\varepsilon_1 + \\sigma_2\\sqrt{1-\\rho^2}\\, \\varepsilon_2"}</K> (mélange des deux bruits).</Step>
        <Step num={3} accent={ACCENT}><strong>Preuve de la correction :</strong> <K>{"\\text{Cov}(L\\varepsilon) = L \\cdot \\text{Cov}(\\varepsilon) \\cdot L^\\top = L \\cdot I \\cdot L^\\top = \\Sigma"}</K> ✓. La matrice identité <K>{"\\text{Cov}(\\varepsilon) = I"}</K> traduit l'indépendance des bruits ; <K>{"L"}</K> encode toute la structure de dépendance.</Step>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          Synthèse : Cholesky est l'algorithme clé des simulations Monte Carlo multi-actifs. Si <K>{"\\Sigma"}</K> n'est pas semi-définie positive (valeur propre négative), la décomposition échoue — c'est une vérification automatique de la cohérence de la matrice de corrélation.
        </div>
      </div>

      <ExampleBlock title="Pétrole & Gaz Naturel — Corrélation historique" accent={ACCENT}>
        <p><K>{"\\sigma_{\\text{oil}} = 30\\%"}</K>, <K>{"\\sigma_{\\text{gas}} = 40\\%"}</K>, <K>{"\\rho = 0.5"}</K>, portefeuille 50%/50%</p>
        <FormulaBox accent={ACCENT} label="Résultat"><K display>{"\\sigma_p = 30.4\\%"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Covariance" ruleDetail="Cov(X,Y) = ρ·σ_X·σ_Y" accent={ACCENT}>
            <K>{"\\text{Cov} = 0.5 \\times 0.30 \\times 0.40 = 0.060"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Variance de portefeuille" ruleDetail="σ²_p = w¹²σ¹² + 2w¹w²ρσ¹σ² + w²²σ²²" accent={ACCENT}>
            <K>{"\\sigma_p^2 = 0.25 \\times 0.09 + 2 \\times 0.25 \\times 0.06 + 0.25 \\times 0.16 = 0.0925"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Racine carrée" ruleDetail="σ_p = √(σ²_p)" accent={ACCENT}>
            <K>{"\\sigma_p = \\sqrt{0.0925} = 30.4\\%"}</K>
          </DemoStep>
          <DemoStep num={4} rule="Comparaison (diversification)" accent={ACCENT}>
            Si ρ = 0 → <K>{"\\sigma_p = \\sqrt{0.0625} = 25.0\\%"}</K>. La corrélation positive augmente le risque de 25% à 30.4% — la diversification fonctionne moins bien !
          </DemoStep>
        </Demonstration>
      </ExampleBlock>

      <SectionTitle accent={ACCENT}>Exercices</SectionTitle>
      <Accordion title="Exercice 0 — Décomposition de Cholesky à la main (2×2)" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, marginBottom: 12 }}>
          Soit Σ = [[0.04, 0.018], [0.018, 0.09]] (<K>{"\\sigma_1 = 20\\%"}</K>, <K>{"\\sigma_2 = 30\\%"}</K>, <K>{"\\rho = 0.3"}</K>). Calculez la matrice triangulaire inférieure <K>{"L"}</K> telle que <K>{"L \\times L^\\top = \\Sigma"}</K>.
        </p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"L = \\begin{bmatrix} 0.20 & 0 \\\\ 0.090 & 0.2862 \\end{bmatrix}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Structure de Cholesky" ruleDetail="L triangulaire inférieure : Σ = L·Lᵀ" accent={ACCENT}>
            L est de la forme <K>{"\\begin{bmatrix} l_{11} & 0 \\\\ l_{21} & l_{22} \\end{bmatrix}"}</K>. La condition <K>{"LL^T = \\Sigma"}</K> donne 3 équations.
          </DemoStep>
          <DemoStep num={2} rule="Équation diagonale (1,1)" ruleDetail="l₁₁² = Σ₁₁" accent={ACCENT}>
            <K>{"l_{11}^2 = \\Sigma_{11} = 0.04 \\Rightarrow l_{11} = 0.20"}</K> (= σ₁, comme attendu)
          </DemoStep>
          <DemoStep num={3} rule="Équation hors-diagonale" ruleDetail="l₂₁·l₁₁ = Σ₂₁" accent={ACCENT}>
            <K>{"l_{21} = \\frac{\\Sigma_{21}}{l_{11}} = \\frac{0.018}{0.20} = 0.090"}</K> (= ρ·σ₂ = 0.3×0.30 ✓)
          </DemoStep>
          <DemoStep num={4} rule="Équation diagonale (2,2)" ruleDetail="l₂₁² + l₂₂² = Σ₂₂" accent={ACCENT}>
            <K>{"l_{22} = \\sqrt{\\Sigma_{22} - l_{21}^2} = \\sqrt{0.09 - 0.0081} = \\sqrt{0.0819} \\approx 0.2862"}</K>
            <br />(= <K>{"\\sigma_2 \\sqrt{1-\\rho^2}"}</K> ✓). Vérification : <K>{"L \\times L^\\top = [[0.04, 0.018], [0.018, 0.09]]"}</K> ✓
          </DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 1 — Multiplication de matrices" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text }}>Calculez <K>{"A \\times B"}</K> avec <K>{"A = \\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}"}</K> et <K>{"B = \\begin{bmatrix} 5 \\\\ 6 \\end{bmatrix}"}</K></p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"A \\times B = \\begin{bmatrix} 17 \\\\ 39 \\end{bmatrix}"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Produit matriciel" ruleDetail="(AB)ᵢⱼ = Σₖ Aᵢₖ·Bₖⱼ" accent={ACCENT}>
            Ligne 1 : <K>{"1 \\times 5 + 2 \\times 6 = 5 + 12 = 17"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Produit matriciel" ruleDetail="(AB)ᵢⱼ = Σₖ Aᵢₖ·Bₖⱼ" accent={ACCENT}>
            Ligne 2 : <K>{"3 \\times 5 + 4 \\times 6 = 15 + 24 = 39"}</K>
          </DemoStep>
        </Demonstration>
      </Accordion>
      <Accordion title="Exercice 2 — Variance de portefeuille" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text }}>3 actifs : <K>{"\\mathbf{w} = [50\\%, 30\\%, 20\\%]"}</K>, <K>{"\\boldsymbol{\\sigma} = [20\\%, 25\\%, 35\\%]"}</K>, <K>{"\\rho_{ij} = 0.3 \\; \\forall \\; i \\neq j"}</K>. Calculez <K>{"\\sigma_p"}</K>.</p>
        <FormulaBox accent={ACCENT} label="Résultat"><K>{"\\sigma_p \\approx 18\\%"}</K></FormulaBox>
        <Demonstration accent={ACCENT}>
          <DemoStep num={1} rule="Formule de variance de portefeuille" ruleDetail="σ²_p = Σᵢ wᵢ²σᵢ² + 2Σᵢ<j wᵢwⱼρσᵢσⱼ" accent={ACCENT}>
            <K>{"\\sigma_p^2 = \\sum_i w_i^2 \\sigma_i^2 + 2\\sum_{i<j} w_i w_j \\rho \\sigma_i \\sigma_j"}</K>
          </DemoStep>
          <DemoStep num={2} rule="Termes diagonaux (variances individuelles)" accent={ACCENT}>
            <K>{"0.5^2 \\times 0.20^2 + 0.3^2 \\times 0.25^2 + 0.2^2 \\times 0.35^2 = 0.01 + 0.005625 + 0.0049 = 0.020525"}</K>
          </DemoStep>
          <DemoStep num={3} rule="Termes croisés (covariances)" ruleDetail="Cov(i,j) = ρ·σᵢ·σⱼ" accent={ACCENT}>
            <K>{"2[0.5{\\times}0.3{\\times}0.3{\\times}0.20{\\times}0.25 + 0.5{\\times}0.2{\\times}0.3{\\times}0.20{\\times}0.35 + 0.3{\\times}0.2{\\times}0.3{\\times}0.25{\\times}0.35]"}</K>
            = 2 × 0.005925 = 0.01185
          </DemoStep>
          <DemoStep num={4} rule="Racine carrée" ruleDetail="σ_p = √(σ²_p)" accent={ACCENT}>
            <K>{"\\sigma_p^2 = 0.020525 + 0.01185 = 0.032375 \\Rightarrow \\sigma_p = \\sqrt{0.032375} \\approx 18\\%"}</K>
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}
