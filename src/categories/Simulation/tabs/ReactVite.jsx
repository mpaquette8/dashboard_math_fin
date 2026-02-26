import React, { useState } from 'react'
import { T } from '../../../design/tokens'
import {
  FormulaBox, IntuitionBlock, ExampleBlock,
  Accordion, Step, SectionTitle, InfoChip, Grid,
  Demonstration, DemoStep, TabBar, Panel,
} from '../../../design/components'

const ACCENT = T.a3  // violet — catégorie Informatique & Simulation

// ─── Composant local : bloc de code ──────────────────────────────────────────
function CodeBlock({ children }) {
  return (
    <pre style={{
      background: T.panel2, border: `1px solid ${T.border}`,
      borderRadius: T.r, padding: '12px 16px', overflowX: 'auto',
      fontSize: 13, color: T.text, fontFamily: 'monospace',
      lineHeight: 1.7, margin: '8px 0',
    }}>{children}</pre>
  )
}

// ─── Composant local : comparaison deux colonnes ──────────────────────────────
function Compare({ left, right, labelLeft = 'Avant', labelRight = 'Après' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '10px 0' }}>
      <div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
          {labelLeft}
        </div>
        <CodeBlock>{left}</CodeBlock>
      </div>
      <div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
          {labelRight}
        </div>
        <CodeBlock>{right}</CodeBlock>
      </div>
    </div>
  )
}

// ─── Composant local : boîte concept imbriquée (pour arbre de composants) ────
function TreeBox({ label, accent = ACCENT, children, depth = 0 }) {
  return (
    <div style={{
      border: `1px solid ${accent}44`, borderRadius: 8,
      padding: '8px 12px', marginLeft: depth * 20,
      background: `${accent}${depth === 0 ? '11' : '08'}`,
    }}>
      <div style={{ color: accent, fontWeight: 700, fontSize: 12, marginBottom: children ? 8 : 0 }}>
        {'<'}{label}{'>'}
      </div>
      {children}
    </div>
  )
}

// ─── Composant local : badge de concept ──────────────────────────────────────
function Badge({ children, color = ACCENT }) {
  return (
    <span style={{
      background: `${color}22`, border: `1px solid ${color}55`,
      borderRadius: 4, padding: '1px 8px', fontSize: 12,
      color: color, fontFamily: 'monospace', display: 'inline-block',
    }}>{children}</span>
  )
}

// ─── Composant local : puce de décision IA ───────────────────────────────────
function IADecision({ who, label, description }) {
  const isIA = who === 'ia'
  const color = isIA ? T.a4 : ACCENT
  const icon = isIA ? '🤖' : '🧠'
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      background: `${color}0d`, border: `1px solid ${color}33`,
      borderRadius: 8, padding: '10px 14px', marginBottom: 8,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ color: color, fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{label}</div>
        <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6 }}>{description}</div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SOUS-ONGLET 1 — COMPOSANTS
// ══════════════════════════════════════════════════════════════════════════════
function ComposantsTab() {
  return (
    <div>
      <IntuitionBlock emoji="🧩" title="Un composant = une fonction" accent={ACCENT}>
        Un composant React est une <strong style={{ color: ACCENT }}>fonction pure</strong> qui
        prend des données en entrée (les props) et retourne une description de l'interface.
        Ce n'est pas plus compliqué que ça — le reste est juste du sucre syntaxique.
      </IntuitionBlock>

      <FormulaBox accent={ACCENT} label="Le principe fondamental">
        <div style={{ fontSize: 18, color: ACCENT, fontWeight: 700, textAlign: 'center', padding: '8px 0' }}>
          UI = f( état )
        </div>
        <div style={{ color: T.muted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
          L'interface est une <em>projection déterministe</em> de l'état courant.
          Mêmes données → même rendu, toujours.
        </div>
      </FormulaBox>

      {/* JSX */}
      <SectionTitle accent={ACCENT}>JSX — du sucre syntaxique</SectionTitle>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
        JSX n'est pas du HTML. C'est une notation compacte qui se transforme à la compilation
        en appels <Badge>React.createElement()</Badge>. Comprendre cela aide à lire les
        erreurs et à prévoir comment React construit l'arbre.
      </p>
      <Compare
        labelLeft="Vous écrivez (JSX)"
        labelRight="Le compilateur produit"
        left={`function Bouton({ label }) {
  return (
    <button className="btn">
      {label}
    </button>
  )
}`}
        right={`function Bouton({ label }) {
  return React.createElement(
    'button',
    { className: 'btn' },
    label
  )
}`}
      />
      <p style={{ color: T.muted, fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>
        JSX est une abstraction pratique, pas une technologie magique. Elle ne fait que rendre
        le code plus lisible — le navigateur ne voit jamais de JSX.
      </p>

      {/* Props vs State */}
      <SectionTitle accent={ACCENT}>Props vs State</SectionTitle>
      <Grid cols={2} gap="12px">
        <div style={{ background: `${T.a3}11`, border: `1px solid ${T.a3}33`, borderRadius: 8, padding: 16 }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Props</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            • Viennent du parent<br/>
            • Immuables dans le composant<br/>
            • Définissent le "contrat" externe<br/>
            • Similaires aux arguments d'une fonction<br/>
          </div>
          <CodeBlock>{`function Carte({ titre, valeur }) {
  // titre et valeur ne changent pas ici
  return <div>{titre}: {valeur}</div>
}`}</CodeBlock>
        </div>
        <div style={{ background: `${T.a5}11`, border: `1px solid ${T.a5}33`, borderRadius: 8, padding: 16 }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>State</div>
          <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
            • Appartient au composant<br/>
            • Peut changer au fil du temps<br/>
            • Déclenche un re-rendu à chaque mutation<br/>
            • Similaires à une variable locale persistante<br/>
          </div>
          <CodeBlock>{`function Compteur() {
  const [n, setN] = useState(0)
  // n persiste entre les renders
  return <button onClick={() => setN(n+1)}>{n}</button>
}`}</CodeBlock>
        </div>
      </Grid>

      {/* Flux unidirectionnel */}
      <SectionTitle accent={ACCENT}>Flux de données unidirectionnel</SectionTitle>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
        Les données ne circulent que dans un sens : <strong style={{ color: ACCENT }}>parent → enfant</strong> via les props.
        Les enfants ne peuvent pas modifier les props reçues. Pour qu'un enfant remonte une information,
        le parent lui passe une <strong style={{ color: ACCENT }}>fonction callback</strong>.
      </p>
      <div style={{ margin: '16px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TreeBox label="App (owns: données, setDonnées)" depth={0}>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <div style={{ flex: 1 }}>
                <TreeBox label="Liste (props: données)" depth={0} accent={T.a5}>
                  <TreeBox label="Item (props: item)" depth={0} accent={T.a7} />
                </TreeBox>
              </div>
              <div style={{ flex: 1 }}>
                <TreeBox label="Formulaire (props: onAjout)" depth={0} accent={T.a4}>
                  <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>
                    appelle onAjout(valeur) ↑
                  </div>
                </TreeBox>
              </div>
            </div>
          </TreeBox>
        </div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          Les props descendent ↓ · Les callbacks remontent ↑
        </div>
      </div>

      {/* Exercices */}
      <Accordion title="Exercice — Props ou state ?" accent={ACCENT} badge="Facile">
        <p style={{ color: T.text, fontSize: 13, marginBottom: 12 }}>
          Pour chaque besoin ci-dessous, identifiez s'il s'agit d'une prop ou d'un state.
        </p>
        {[
          { q: 'Le nom d\'un utilisateur à afficher dans un badge', r: 'Props', why: 'L\'info vient de l\'extérieur (parent ou API), le composant ne la génère pas.' },
          { q: 'Si un menu déroulant est ouvert ou fermé', r: 'State', why: 'C\'est un état d\'interface local — personne d\'autre n\'a besoin de le connaître.' },
          { q: 'La liste de produits d\'un panier partagé entre plusieurs pages', r: 'State (levé haut)', why: 'Partagé entre composants → le state doit être dans l\'ancêtre commun.' },
          { q: 'La couleur d\'accent passée à un composant Bouton', r: 'Props', why: 'Le Bouton ne choisit pas sa couleur — elle lui est dictée par le parent.' },
        ].map(({ q, r, why }, i) => (
          <Demonstration key={i} accent={ACCENT} title={q}>
            <DemoStep num={1} rule={r} ruleDetail={why} accent={ACCENT}>
              {why}
            </DemoStep>
          </Demonstration>
        ))}
      </Accordion>

      <Accordion title="Exercice — Décomposition en composants" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.text, fontSize: 13, marginBottom: 12 }}>
          Imaginez une page de tableau de bord avec : un header (logo + nom user),
          une barre de filtres (date, catégorie), et une grille de cartes de KPIs.
          Proposez un arbre de composants.
        </p>
        <Demonstration accent={ACCENT} title="Voir une décomposition possible">
          <DemoStep num={1} rule="Principe" ruleDetail="une responsabilité par composant" accent={ACCENT}>
            Identifier les zones visuellement distinctes et répétées.
          </DemoStep>
          <DemoStep num={2} rule="Arbre" ruleDetail="du plus général au plus spécifique" accent={ACCENT}>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: T.text, lineHeight: 2 }}>
              {'<App>'}<br/>
              {'  <Header logo={...} user={...} />'}<br/>
              {'  <FiltreBar onFiltreChange={...} />'}<br/>
              {'  <GrilleKPI>'}<br/>
              {'    <CarteKPI label="CA" valeur={...} />'}<br/>
              {'    <CarteKPI label="Marge" valeur={...} />'}<br/>
              {'  </GrilleKPI>'}<br/>
              {'</App>'}
            </div>
          </DemoStep>
          <DemoStep num={3} rule="State" ruleDetail="où le placer ?" accent={ACCENT}>
            Les filtres sélectionnés vivent dans <Badge>App</Badge> (car GrilleKPI en a besoin).
            L'état interne du composant FiltreBar (hover, focus) peut rester local à ce composant.
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SOUS-ONGLET 2 — HOOKS
// ══════════════════════════════════════════════════════════════════════════════
function HooksTab() {
  const [counter, setCounter] = useState(0)

  return (
    <div>
      <IntuitionBlock emoji="🪝" title="Les hooks : mémoire et synchronisation" accent={ACCENT}>
        Les hooks ne sont <strong style={{ color: ACCENT }}>pas</strong> des méthodes de cycle de vie.
        <Badge>useState</Badge> donne de la <em>mémoire</em> à un composant.
        <Badge>useEffect</Badge> permet de le <em>synchroniser</em> avec le monde extérieur.
        Tout le reste en découle.
      </IntuitionBlock>

      {/* useState */}
      <SectionTitle accent={ACCENT}>useState — le modèle snapshot</SectionTitle>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
        Quand un composant se rend, il prend une <strong style={{ color: ACCENT }}>photo (snapshot)</strong> de
        l'état à cet instant. Cette valeur est <em>figée</em> pendant tout le rendu — elle ne change pas
        même si vous appelez <Badge>setState</Badge> plusieurs fois.
      </p>

      <FormulaBox accent={ACCENT} label="Transition d'état comme fonction">
        <div style={{ fontSize: 16, color: ACCENT, fontWeight: 700, textAlign: 'center', padding: '6px 0' }}>
          état<sub>n+1</sub> = f( état<sub>n</sub> )
        </div>
        <div style={{ color: T.muted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
          Préférer la forme fonctionnelle <Badge>setN(n {'⇒'} n + 1)</Badge> pour les mises à jour dépendant de l'état précédent.
        </div>
      </FormulaBox>

      {/* Demo interactive useState */}
      <div style={{
        background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`,
        borderRadius: 10, padding: 16, margin: '12px 0',
      }}>
        <div style={{ color: ACCENT, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
          Démonstration live — le snapshot
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setCounter(c => c + 1)}
            style={{
              background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`,
              borderRadius: 6, padding: '6px 16px', color: ACCENT,
              fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}
          >
            +1
          </button>
          <div style={{ color: T.text, fontSize: 24, fontWeight: 800 }}>{counter}</div>
          <button
            onClick={() => setCounter(0)}
            style={{
              background: `${T.border}`, border: `1px solid ${T.border}`,
              borderRadius: 6, padding: '6px 12px', color: T.muted,
              cursor: 'pointer', fontSize: 12,
            }}
          >
            reset
          </button>
        </div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>
          Chaque clic déclenche un nouveau rendu. La valeur <Badge>{counter}</Badge> est figée
          dans le rendu courant — c'est une constante, pas une variable live.
        </div>
      </div>

      <Accordion title="Piège classique — closure stale" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 8 }}>
          Si vous capturez une valeur d'état dans une closure (ex: setTimeout), vous capturez
          le snapshot du moment, pas la valeur future.
        </p>
        <Compare
          labelLeft="Piège"
          labelRight="Solution"
          left={`// n est figé à la valeur du rendu
// où setTimeout a été créé
setTimeout(() => {
  console.log(n)  // toujours l'ancienne valeur
}, 3000)`}
          right={`// La forme fonctionnelle lit
// TOUJOURS la dernière valeur
setN(courant => courant + 1)
// ou utiliser useRef pour
// accéder à la valeur live`}
        />
      </Accordion>

      {/* useEffect */}
      <SectionTitle accent={ACCENT}>useEffect — synchronisation, pas lifecycle</SectionTitle>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
        La question à se poser : <em>"Avec quoi mon composant doit-il rester synchronisé ?"</em>
        Pas : "Que faire quand il monte/démonte ?"
        Le tableau de dépendances exprime <strong style={{ color: ACCENT }}>un abonnement</strong> :
        "ré-exécute cet effet chaque fois que ces valeurs changent."
      </p>

      <Grid cols={3} gap="10px">
        {[
          { deps: '[]', label: 'Une seule fois', desc: 'Au montage. Connexion initiale, fetch de config.' },
          { deps: '[valeur]', label: 'À chaque changement de valeur', desc: 'Synchronise un système externe avec une prop ou state.' },
          { deps: '(rien)', label: 'À chaque rendu', desc: 'Rarement utile. Souvent un signe de problème de design.' },
        ].map(({ deps, label, desc }) => (
          <div key={deps} style={{
            background: T.panel, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: 12,
          }}>
            <div style={{ fontFamily: 'monospace', color: ACCENT, fontSize: 13, marginBottom: 6 }}>{deps}</div>
            <div style={{ color: T.text, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</div>
            <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
      </Grid>

      <CodeBlock>{`useEffect(() => {
  // Connexion à une ressource externe
  const subscription = api.subscribe(id, handleData)

  // Cleanup : déconnexion quand l'effet se ré-exécute ou que le composant démonte
  return () => subscription.unsubscribe()
}, [id])  // se ré-exécute si id change`}</CodeBlock>

      {/* useMemo / useCallback */}
      <SectionTitle accent={ACCENT}>useMemo & useCallback — mémoïsation</SectionTitle>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
        Ces hooks mémoïsent un résultat : si les dépendances n'ont pas changé, React réutilise
        le résultat précédent au lieu de recalculer. C'est un <strong style={{ color: ACCENT }}>trade-off</strong> :
        on échange de la mémoire contre du temps de calcul.
      </p>
      <Grid cols={2} gap="10px">
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>useMemo</div>
          <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>Mémoïse une valeur calculée.</div>
          <CodeBlock>{`const résultat = useMemo(
  () => calcul_couteux(données),
  [données]
)`}</CodeBlock>
        </div>
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>useCallback</div>
          <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>Mémoïse une fonction (identité stable).</div>
          <CodeBlock>{`const handleClick = useCallback(
  () => action(param),
  [param]
)`}</CodeBlock>
        </div>
      </Grid>
      <ExampleBlock title="Règle pratique">
        <span style={{ color: T.text, fontSize: 13 }}>
          N'utilisez pas ces hooks par défaut. Utilisez-les <strong>seulement</strong> si vous
          mesurez un problème de performance concret, ou si la stabilité de l'identité d'une
          fonction est nécessaire (ex: prop d'un composant mémoïsé).
        </span>
      </ExampleBlock>

      {/* Règles des hooks */}
      <SectionTitle accent={ACCENT}>Les règles des hooks — et pourquoi elles existent</SectionTitle>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
        React identifie chaque hook par son <strong style={{ color: ACCENT }}>ordre d'appel</strong>,
        pas par un nom ou un identifiant. L'ordre doit donc être identique à chaque rendu.
      </p>
      <Step num={1} accent={ACCENT}>
        <strong style={{ color: T.text }}>Jamais dans une condition</strong>
        <span style={{ color: T.muted, fontSize: 13 }}> — l'ordre des appels deviendrait imprévisible selon la condition.</span>
      </Step>
      <Step num={2} accent={ACCENT}>
        <strong style={{ color: T.text }}>Jamais dans une boucle</strong>
        <span style={{ color: T.muted, fontSize: 13 }}> — le nombre d'appels varierait selon la longueur du tableau.</span>
      </Step>
      <Step num={3} accent={ACCENT}>
        <strong style={{ color: T.text }}>Uniquement dans des composants ou des hooks custom</strong>
        <span style={{ color: T.muted, fontSize: 13 }}> — React ne les traque que dans ces contextes.</span>
      </Step>
      <CodeBlock>{`// ✗ FAUX : order d'appel conditionnel
if (condition) {
  const [valeur, setValeur] = useState(0)
}

// ✓ CORRECT : toujours au niveau racine du composant
const [valeur, setValeur] = useState(0)
if (condition) { /* utilise valeur */ }`}</CodeBlock>

      <Accordion title="Exercice — Quel hook pour quel besoin ?" accent={ACCENT} badge="Difficile">
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 12 }}>
          Pour chaque scénario, identifiez le hook le plus adapté et justifiez.
        </p>
        {[
          { q: 'Stocker la valeur tapée dans un champ de recherche', r: 'useState', why: 'État local d\'interface, mutatif, déclenche un re-rendu pour mettre à jour l\'affichage.' },
          { q: 'Ouvrir une connexion WebSocket quand un userId change', r: 'useEffect + cleanup', why: 'Synchronisation avec un système externe. Le cleanup ferme la connexion précédente.' },
          { q: 'Filtrer une liste de 50 000 éléments selon un critère', r: 'useMemo', why: 'Calcul coûteux à ne pas répéter à chaque rendu si les dépendances n\'ont pas changé.' },
          { q: 'Passer un handler stable à un composant enfant mémoïsé', r: 'useCallback', why: 'Sans useCallback, le handler recrée une nouvelle référence à chaque rendu, annulant la mémoïsation de l\'enfant.' },
          { q: 'Accéder au DOM pour mesurer la hauteur d\'un élément', r: 'useRef + useEffect', why: 'useRef stocke la référence DOM sans déclencher de rendu. useEffect lit la mesure après le rendu.' },
        ].map(({ q, r, why }, i) => (
          <Demonstration key={i} accent={ACCENT} title={q}>
            <DemoStep num={1} rule={r} ruleDetail={why} accent={ACCENT}>
              {why}
            </DemoStep>
          </Demonstration>
        ))}
      </Accordion>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SOUS-ONGLET 3 — ÉCOSYSTÈME
// ══════════════════════════════════════════════════════════════════════════════
function EcosystemeTab() {
  return (
    <div>
      <IntuitionBlock emoji="🔧" title="Des outils qui résolvent des problèmes précis" accent={ACCENT}>
        <strong style={{ color: ACCENT }}>npm</strong> résout le problème des dépendances.
        {' '}<strong style={{ color: ACCENT }}>ESM</strong> résout le problème du scope global.
        {' '}<strong style={{ color: ACCENT }}>Vite</strong> résout le problème de vitesse de développement.
        Chaque outil a une raison d'être claire.
      </IntuitionBlock>

      {/* Modules JS */}
      <SectionTitle accent={ACCENT}>Modules JavaScript (ESM)</SectionTitle>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
        Avant les modules, tout le JavaScript d'une page partageait le <em>même espace global</em>.
        Une variable dans un script pouvait écraser celle d'un autre. ESM (ECMAScript Modules)
        donne à chaque fichier son propre scope.
      </p>

      <Grid cols={2} gap="10px">
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: T.a5, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>CJS — CommonJS (Node.js historique)</div>
          <CodeBlock>{`// Export
module.exports = { maFonction }

// Import
const { maFonction } = require('./utils')`}</CodeBlock>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>Synchrone · résolution au runtime · pas de tree-shaking natif</div>
        </div>
        <div style={{ background: T.panel, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>ESM — ES Modules (standard moderne)</div>
          <CodeBlock>{`// Export
export function maFonction() { ... }
export default Composant

// Import
import { maFonction } from './utils'
import Composant from './Composant'`}</CodeBlock>
          <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>Statique · analysable à la compilation · tree-shaking · natif navigateur</div>
        </div>
      </Grid>

      <ExampleBlock title="Tree-shaking">
        <span style={{ color: T.text, fontSize: 13 }}>
          Parce qu'ESM est <em>statique</em> (les imports sont déclarés au toplevel, pas dans des conditions),
          les bundlers peuvent analyser le graphe de dépendances et <strong>éliminer le code non utilisé</strong>.
          Un <Badge>import {'{ BarChart }'} from 'recharts'</Badge> n'embarque pas toute la lib.
        </span>
      </ExampleBlock>

      {/* npm */}
      <SectionTitle accent={ACCENT}>npm — résolveur de dépendances</SectionTitle>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
        npm est avant tout un <strong style={{ color: ACCENT }}>résolveur de graphe de dépendances</strong>.
        Il télécharge les packages depuis le registry, calcule les versions compatibles,
        et les stocke dans <Badge>node_modules/</Badge>.
      </p>
      <Grid cols={2} gap="10px">
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>package.json</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            Le <strong>contrat</strong> de votre projet.
            Déclare les dépendances avec des plages de versions (<Badge>^18.0.0</Badge> = compatible 18.x).
            À committer dans git.
          </div>
        </div>
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>package-lock.json</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            L'<strong>état exact</strong> de toutes les dépendances (y compris transitives) avec les hash de vérification.
            Garantit la reproductibilité. À committer dans git.
          </div>
        </div>
      </Grid>
      <Grid cols={3} gap="8px" style={{ marginTop: 10 }}>
        <InfoChip label="Commande dev" value="npm install" accent={ACCENT} />
        <InfoChip label="Ajouter un package" value="npm install recharts" accent={ACCENT} />
        <InfoChip label="Build prod" value="npm run build" accent={ACCENT} />
      </Grid>

      {/* Vite */}
      <SectionTitle accent={ACCENT}>Vite — vitesse de développement</SectionTitle>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
        Webpack bundlait <em>tout</em> à chaque changement. Sur de grands projets, le démarrage
        pouvait prendre 30–60 secondes. Vite résout ce problème en deux temps.
      </p>

      <Grid cols={2} gap="10px">
        <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: 14 }}>
          <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 8 }}>🚀 Mode développement</div>
          <Step num={1} accent={ACCENT}>
            <span style={{ color: T.muted, fontSize: 12 }}>esbuild transforme JSX/TS → JS en quelques ms (écrit en Go, ~100× plus rapide que Babel)</span>
          </Step>
          <Step num={2} accent={ACCENT}>
            <span style={{ color: T.muted, fontSize: 12 }}>Pas de bundle : le navigateur charge les fichiers via <Badge>ESM natif</Badge> directement</span>
          </Step>
          <Step num={3} accent={ACCENT}>
            <span style={{ color: T.muted, fontSize: 12 }}>HMR (Hot Module Replacement) : seul le module modifié est rechargé, en {'<'}50ms</span>
          </Step>
        </div>
        <div style={{ background: `${T.a4}0d`, border: `1px solid ${T.a4}33`, borderRadius: 8, padding: 14 }}>
          <div style={{ color: T.a4, fontWeight: 700, marginBottom: 8 }}>📦 Build production</div>
          <Step num={1} accent={T.a4}>
            <span style={{ color: T.muted, fontSize: 12 }}>Rollup bundle et optimise : minification, tree-shaking, code splitting</span>
          </Step>
          <Step num={2} accent={T.a4}>
            <span style={{ color: T.muted, fontSize: 12 }}>Chunks séparés pour le code vendor (libs) et le code applicatif</span>
          </Step>
          <Step num={3} accent={T.a4}>
            <span style={{ color: T.muted, fontSize: 12 }}>Hash dans les noms de fichier pour le cache-busting navigateur</span>
          </Step>
        </div>
      </Grid>

      {/* Pipeline de transformation */}
      <SectionTitle accent={ACCENT}>La chaîne de transformation complète</SectionTitle>
      <div style={{ margin: '12px 0' }}>
        {[
          { num: 1, label: 'Source', detail: 'Composant.jsx / style.css / data.ts', color: ACCENT },
          { num: 2, label: 'Transform JSX', detail: 'esbuild : JSX → React.createElement(), TS → JS', color: T.a5 },
          { num: 3, label: 'Résolution des imports', detail: 'Vite résout les chemins : ./Component → /src/Component.jsx, recharts → node_modules/recharts/...', color: T.a7 },
          { num: 4, label: 'Dev: ESM natif', detail: 'Le navigateur télécharge chaque module à la demande via HTTP/2', color: T.a4 },
          { num: 5, label: 'Prod: bundle Rollup', detail: 'Tout est regroupé, optimisé, hashé → dist/', color: T.a8 },
        ].map(({ num, label, detail, color }) => (
          <div key={num} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'flex-start' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: `${color}22`, border: `1px solid ${color}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color, fontWeight: 700,
            }}>{num}</div>
            <div style={{ flex: 1, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12 }}>{label}</div>
              <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>{detail}</div>
            </div>
          </div>
        ))}
      </div>

      <Accordion title="Exercice — Tracer une chaîne d'import" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 10 }}>
          Suivez mentalement ce qui se passe quand Vite reçoit la requête pour <Badge>App.jsx</Badge> :
        </p>
        <CodeBlock>{`// App.jsx
import React from 'react'              // → node_modules/react/index.js
import { BrowserRouter } from 'react-router-dom'  // → node_modules/react-router-dom/...
import Simulation from './categories/Simulation/index.jsx'  // → src/categories/...
import { T } from './design/tokens'    // → src/design/tokens.js`}</CodeBlock>
        <Demonstration accent={ACCENT} title="Ce que Vite fait avec ces imports">
          <DemoStep num={1} rule="Analyse statique" ruleDetail="Vite lit le fichier sans l'exécuter" accent={ACCENT}>
            Il détecte tous les imports déclarés au toplevel.
          </DemoStep>
          <DemoStep num={2} rule="Résolution" ruleDetail="Chemin → fichier réel" accent={ACCENT}>
            <Badge>react</Badge> → <Badge>node_modules/react/index.js</Badge><br/>
            <Badge>./design/tokens</Badge> → <Badge>/src/design/tokens.js</Badge> (extension ajoutée automatiquement)
          </DemoStep>
          <DemoStep num={3} rule="Transformation" ruleDetail="JSX → JS" accent={ACCENT}>
            esbuild transforme chaque fichier .jsx en JS pur que le navigateur comprend.
          </DemoStep>
          <DemoStep num={4} rule="Serve" ruleDetail="Un module par requête HTTP" accent={ACCENT}>
            Le navigateur demande App.jsx → Vite répond. App.jsx importe Simulation → le navigateur fait une nouvelle requête. Etc.
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SOUS-ONGLET 4 — AVEC L'IA
// ══════════════════════════════════════════════════════════════════════════════
function AvecIATab() {
  return (
    <div>
      <IntuitionBlock emoji="🤝" title="Déléguer l'écriture, garder la conception" accent={ACCENT}>
        L'IA génère du code correct syntaxiquement et fonctionnellement dans la plupart des cas courants.
        Ce qui reste <strong style={{ color: ACCENT }}>irremplaçablement humain</strong> : choisir
        l'architecture, localiser l'état, détecter les anti-patterns, et savoir quand le code
        généré est <em>techniquement correct mais conceptuellement faux</em>.
      </IntuitionBlock>

      {/* Ce que l'IA fait bien */}
      <SectionTitle accent={ACCENT}>Ce que l'IA gère très bien</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <IADecision who="ia" label="Boilerplate & scaffolding"
          description="Générer la structure initiale d'un composant, d'un hook custom, ou d'un fichier de configuration Vite." />
        <IADecision who="ia" label="Patterns courants"
          description="Formulaires contrôlés, fetch de données avec loading/error, routing React Router, pagination — des patterns bien documentés et bien représentés dans les données d'entraînement." />
        <IADecision who="ia" label="Refactoring de surface"
          description="Renommer des variables, extraire un sous-composant, convertir une class component en fonction, ajouter des types TypeScript." />
        <IADecision who="ia" label="Tests unitaires"
          description="Générer des tests Vitest/Jest pour un composant à partir de sa signature et de son comportement décrit." />
        <IADecision who="ia" label="Documentation & commentaires"
          description="JSDoc, README, explication de la logique d'un algorithme existant." />
      </div>

      {/* Ce que vous devez comprendre */}
      <SectionTitle accent={ACCENT}>Ce que vous devez comprendre vous-même</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <IADecision who="human" label="Architecture : où vit l'état ?"
          description="L'IA tend à placer l'état trop localement ou trop globalement. C'est vous qui connaissez les besoins futurs et les contraintes de partage." />
        <IADecision who="human" label="Flux de données : qui peut modifier quoi ?"
          description="Des composants qui s'appellent mutuellement, des effets qui se déclenchent en boucle — l'IA crée ces anti-patterns sans s'en rendre compte si le prompt n'est pas précis." />
        <IADecision who="human" label="Debugging d'état"
          description="Un re-render inattendu, une closure stale, un effet qui boucle — l'IA peut suggérer des pistes, mais diagnostiquer nécessite de comprendre le modèle de React." />
        <IADecision who="human" label="Évaluation de la qualité"
          description="'Ça marche' n'est pas suffisant. Sur-engineering, couplages inutiles, abstractions prématurées — seule une compréhension de l'architecture permet de les détecter." />
        <IADecision who="human" label="Sécurité & performance"
          description="dangerouslySetInnerHTML sans sanitisation, des re-renders en cascade, des données sensibles exposées côté client — l'IA peut introduire ces problèmes silencieusement." />
      </div>

      {/* Patterns de prompt */}
      <SectionTitle accent={ACCENT}>Patterns de prompt efficaces</SectionTitle>
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 12, lineHeight: 1.7 }}>
        La qualité du code généré dépend directement de la précision du prompt.
        Spécifier les <em>contraintes</em> est aussi important que décrire le <em>comportement</em>.
      </p>

      <Accordion title="Générer un composant" accent={ACCENT} badge="Facile">
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 8 }}>
          Template : décrivez le comportement, les props, et ce que vous ne voulez PAS.
        </p>
        <CodeBlock>{`Génère un composant React fonctionnel "SearchBar" qui :
- Accepte en props : onSearch(query: string), placeholder: string
- Contient un input contrôlé et un bouton "Rechercher"
- Appelle onSearch uniquement si query est non vide et au moins 2 caractères
- Pas de dépendances externes (pas de lib de formulaire)
- Pas de CSS-in-JS : utilise un className simple
- TypeScript si possible`}</CodeBlock>
      </Accordion>

      <Accordion title="Review de code" accent={ACCENT} badge="Moyen">
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 8 }}>
          Demander une revue ciblée plutôt qu'une revue générale donne de meilleurs résultats.
        </p>
        <CodeBlock>{`Review ce composant React pour :
1. Anti-patterns (mutation de state, effets sans cleanup, deps manquantes)
2. Problèmes de performance (re-renders inutiles, calculs dans le render)
3. Problèmes de sécurité (XSS potentiel, données exposées)

[coller le code ici]`}</CodeBlock>
      </Accordion>

      <Accordion title="Déboguer un comportement" accent={ACCENT} badge="Moyen">
        <CodeBlock>{`Mon composant [Nom] se re-rend en boucle.
Contexte : [décrire le comportement observé]
Voici le code : [coller le code]

Explique pourquoi ce re-render a lieu et propose un correctif
en décrivant la cause racine (pas juste le fix).`}</CodeBlock>
      </Accordion>

      <Accordion title="Refactoring architectural" accent={ACCENT} badge="Difficile">
        <CodeBlock>{`J'ai un composant "Dashboard" de 400 lignes qui mélange
fetch de données, logique de filtres, et présentation.

Propose un découpage en composants + un hook custom pour
la logique. Justifie chaque frontière de composant.
Ne génère pas le code — décris d'abord l'architecture.`}</CodeBlock>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 8, lineStyle: 'italic' }}>
          Conseil : demander l'architecture <em>avant</em> le code évite de se retrouver avec
          1000 lignes à refactorer parce que l'IA a mal compris les besoins.
        </div>
      </Accordion>

      {/* Checklist */}
      <SectionTitle accent={ACCENT}>Checklist de revue de code IA</SectionTitle>
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 12, lineHeight: 1.7 }}>
        Avant d'intégrer du code généré, vérifiez systématiquement ces points.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { ok: '🏗️', label: 'Le state est au bon niveau', detail: 'Pas trop haut (prop drilling excessif), pas trop bas (partage impossible).' },
          { ok: '🔄', label: 'Pas d\'effet pour des calculs synchrones', detail: 'useMemo remplace useEffect + setState pour les valeurs dérivées.' },
          { ok: '🔒', label: 'Pas de mutation directe du state', detail: 'state.tableau.push() est un bug silencieux — toujours créer un nouveau tableau.' },
          { ok: '🗝️', label: 'Les clés dans les listes sont uniques et stables', detail: 'key={index} est problématique si la liste est réordonnée ou filtrée.' },
          { ok: '🧹', label: 'Les effets avec ressources externes ont un cleanup', detail: 'WebSocket, timer, subscription — sinon fuite mémoire et comportements fantômes.' },
          { ok: '📦', label: 'Pas de dépendances manquantes dans useEffect', detail: 'Utiliser l\'ESLint rule exhaustive-deps. Les deps manquantes causent des closures stales.' },
          { ok: '🛡️', label: 'Pas de dangerouslySetInnerHTML sans sanitisation', detail: 'Si l\'HTML vient d\'une source externe, utiliser DOMPurify ou équivalent.' },
        ].map(({ ok, label, detail }) => (
          <div key={label} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            background: T.panel, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: '10px 14px',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{ok}</span>
            <div>
              <div style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{label}</div>
              <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>{detail}</div>
            </div>
          </div>
        ))}
      </div>

      <Accordion title="Exercice — Formuler un prompt" accent={ACCENT} badge="Facile">
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 10 }}>
          Écrivez un prompt IA pour générer ce composant :<br/>
          <em>"Un sélecteur de plage de dates avec deux inputs (début / fin).
          Le début ne peut pas être après la fin. Afficher un message d'erreur si c'est le cas."</em>
        </p>
        <Demonstration accent={ACCENT} title="Exemple de prompt bien formulé">
          <DemoStep num={1} rule="Comportement" ruleDetail="ce que fait le composant" accent={ACCENT}>
            Deux inputs date (début, fin). Validation : début {'<='} fin.
          </DemoStep>
          <DemoStep num={2} rule="Interface" ruleDetail="props et callbacks" accent={ACCENT}>
            Props : <Badge>{'onRangeChange({ debut, fin })'}</Badge>.
            État interne pour les valeurs intermédiaires invalides.
          </DemoStep>
          <DemoStep num={3} rule="Contraintes" ruleDetail="ce qu'on ne veut pas" accent={ACCENT}>
            Pas de lib date externe. Validation côté composant, pas dans le parent.
            Message d'erreur accessible (aria-describedby).
          </DemoStep>
        </Demonstration>
      </Accordion>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export function ReactViteTab() {
  const [sub, setSub] = useState('Composants')
  const subTabs = ['Composants', 'Hooks', 'Écosystème', 'Avec l\'IA']

  return (
    <div>
      <TabBar tabs={subTabs} active={sub} onChange={setSub} accent={ACCENT} />
      <div style={{ marginTop: 16 }}>
        {sub === 'Composants'   && <ComposantsTab />}
        {sub === 'Hooks'        && <HooksTab />}
        {sub === 'Écosystème'   && <EcosystemeTab />}
        {sub === "Avec l'IA"    && <AvecIATab />}
      </div>
    </div>
  )
}
