import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { T } from '../../design/tokens'
import { TabBar } from '../../design/components'

import { ReactViteTab } from '../Simulation/tabs/ReactVite.jsx'

const ACCENT = T.a7  // sky blue

// ─── Coming soon placeholder ──────────────────────────────────────────────────
function ComingSoon({ title, description, items }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <div style={{ color: ACCENT, fontWeight: 800, fontSize: 22, marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ color: T.muted, fontSize: 14, lineHeight: 1.8, maxWidth: 520, margin: '0 auto 24px' }}>
        {description}
      </div>
      {items && (
        <div style={{
          background: T.panel, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: '16px 24px', maxWidth: 400, margin: '0 auto',
          textAlign: 'left',
        }}>
          <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Contenu prévu
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ color: ACCENT, fontSize: 12, marginTop: 1 }}>›</div>
              <div style={{ color: T.text, fontSize: 13 }}>{item}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Category header ──────────────────────────────────────────────────────────
function CategoryHeader() {
  return (
    <div style={{
      background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`,
      borderRadius: 12, padding: '20px 24px', marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>⌨️</div>
        <div>
          <div style={{ color: ACCENT, fontWeight: 800, fontSize: 22, letterSpacing: 0.3 }}>
            Informatique
          </div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>
            React & Vite · Algorithmique · Python & Data Science · Machine Learning · Bases de données
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab slugs → display names ────────────────────────────────────────────────
const TAB_SLUGS = {
  'react-vite':       'React & Vite',
  algo:               'Algorithmique',
  python:             'Python & Data Science',
  'machine-learning': 'Machine Learning',
  bdd:                'Bases de données',
}
const DISPLAY_TABS = Object.values(TAB_SLUGS)
const slugOf = (label) => Object.keys(TAB_SLUGS).find(k => TAB_SLUGS[k] === label) || 'react-vite'

// ─── Main component ───────────────────────────────────────────────────────────
export default function Informatique() {
  const { tab } = useParams()
  const navigate = useNavigate()

  const activeLabel = TAB_SLUGS[tab] || 'React & Vite'

  useEffect(() => {
    document.title = `Informatique — ${activeLabel}`
  }, [activeLabel])

  const handleTabChange = (label) => {
    navigate(`/informatique/${slugOf(label)}`)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      <CategoryHeader />
      <TabBar
        tabs={DISPLAY_TABS}
        active={activeLabel}
        onChange={handleTabChange}
        accent={ACCENT}
      />
      <div style={{ marginTop: 24 }}>
        {activeLabel === 'React & Vite' && <ReactViteTab />}

        {activeLabel === 'Algorithmique' && (
          <ComingSoon
            title="Algorithmique & Complexité"
            description="Structures de données, algorithmes classiques et analyse de complexité. Le socle de tout développeur."
            items={[
              'Complexité O(n) — notation asymptotique, cas moyen/pire',
              'Structures : listes, piles, files, arbres, graphes, tas',
              'Tri : insertion, fusion, rapide, tri par tas — comparatif',
              'Graphes : BFS, DFS, Dijkstra, Bellman-Ford, A*',
              'Programmation dynamique et mémoïsation',
              'Algorithmes gloutons et backtracking',
            ]}
          />
        )}

        {activeLabel === 'Python & Data Science' && (
          <ComingSoon
            title="Python & Data Science"
            description="Python scientifique pour l'analyse de données, la visualisation et le traitement de séries temporelles financières."
            items={[
              'NumPy — tableaux, broadcasting, algèbre linéaire',
              'Pandas — DataFrames, séries temporelles, groupby',
              'Matplotlib / Seaborn — visualisation de données',
              'SciPy — optimisation, interpolation, intégration numérique',
              'Cas pratique : analyse d\'un portefeuille actions',
              'Cas pratique : séries temporelles de prix énergie',
            ]}
          />
        )}

        {activeLabel === 'Machine Learning' && (
          <ComingSoon
            title="Machine Learning"
            description="Apprentissage automatique supervisé et non supervisé, avec applications aux données financières et énergétiques."
            items={[
              'Régression linéaire et ridge/lasso — théorie et implémentation',
              'Classification : logistique, SVM, k-NN',
              'Arbres de décision et Random Forest',
              'Réduction de dimension : PCA, t-SNE',
              'Réseaux de neurones — perceptron, backpropagation',
              'Application : prédiction de volatilité implicite',
            ]}
          />
        )}

        {activeLabel === 'Bases de données' && (
          <ComingSoon
            title="Bases de données & SQL"
            description="Modélisation relationnelle et requêtes SQL pour la gestion et l'analyse de données financières et de marché."
            items={[
              'Modèle relationnel — tables, clés, normalisation (1NF, 2NF, 3NF)',
              'SQL fondamental — SELECT, WHERE, JOIN, GROUP BY, HAVING',
              'Requêtes avancées — window functions, CTE, sous-requêtes',
              'Optimisation — index, EXPLAIN, plans d\'exécution',
              'Cas pratique : base de données de tick data marchés',
              'Introduction aux bases de données time-series (TimescaleDB)',
            ]}
          />
        )}
      </div>
    </div>
  )
}
