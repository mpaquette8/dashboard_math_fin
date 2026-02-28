import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { T, categoryInfo } from './design/tokens'
import Sidebar from './shared/Sidebar'
import Checklist from './shared/Checklist'
import MathsPures from './categories/MathsPures/index.jsx'
import MathsFinance from './categories/MathsFinance/index.jsx'
import MathsEnergie from './categories/MathsEnergie/index.jsx'
import Simulation from './categories/Simulation/index.jsx'
import Informatique from './categories/Informatique/index.jsx'

// 'mobile'  → < 480px  : hamburger + sidebar slide-in
// 'compact' → 480-767px: barre d'icônes 56px (paysage téléphone)
// 'full'    → ≥ 768px  : sidebar complète 240px
function useLayout() {
  const get = () => {
    const w = window.innerWidth
    if (w >= 768) return 'full'
    if (w >= 480) return 'compact'
    return 'mobile'
  }
  const [layout, setLayout] = useState(get)
  useEffect(() => {
    const handler = () => setLayout(get())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return layout
}

const SIDEBAR_WIDTH = { full: 260, compact: 56, mobile: 0 }

function Home() {
  useEffect(() => { document.title = 'Dashboard' }, [])
  const layout = useLayout()
  const cols = layout === 'full' ? 2 : 1
  return (
    <div style={{ maxWidth: 860, margin: '40px auto', padding: `0 ${layout === 'mobile' ? '16px' : '24px'}` }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>Δ</div>
        <h1 style={{ color: T.text, fontSize: layout === 'full' ? 30 : 22, fontWeight: 800, marginBottom: 10 }}>
          Dashboard Personnel — Mathématiques & Finance
        </h1>
        <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, maxWidth: 560, margin: '0 auto' }}>
          Plateforme d'apprentissage interactif organisée par grandes disciplines. À enrichir tout au long du parcours.
        </p>
      </div>

      {/* Category cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
        {categoryInfo.map(cat => (
          <Link key={cat.id} to={cat.path} style={{ textDecoration: 'none' }}>
            <div style={{
              background: T.panel,
              border: `1px solid ${cat.accent}33`,
              borderRadius: 14,
              padding: layout === 'full' ? '22px 24px' : '16px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              height: '100%',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${cat.accent}77`; e.currentTarget.style.background = `${cat.accent}0a` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${cat.accent}33`; e.currentTarget.style.background = T.panel }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${cat.accent}22`, border: `1px solid ${cat.accent}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>{cat.icon}</div>
                <div style={{ color: cat.accent, fontWeight: 800, fontSize: 16, lineHeight: 1.3 }}>
                  {cat.label}
                </div>
              </div>
              {/* Tabs list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cat.tabs.map(t => (
                  <div key={t.slug} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 6,
                    background: `${cat.accent}08`,
                  }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: cat.accent, flexShrink: 0, opacity: 0.7,
                    }} />
                    <span style={{ color: T.text, fontSize: 12 }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer note */}
      <div style={{ textAlign: 'center', marginTop: 36, color: T.muted, fontSize: 12, lineHeight: 1.8 }}>
        Utilisez la sidebar pour naviguer directement vers un sujet.
        <br />
        Certaines rubriques sont <span style={{ color: T.a3 }}>en cours de construction</span> et seront enrichies progressivement.
      </div>
    </div>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const layout = useLayout()

  useEffect(() => {
    if (layout !== 'mobile') setSidebarOpen(false)
  }, [layout])

  const sidebarW = SIDEBAR_WIDTH[layout]

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', background: T.bg, minHeight: '100vh' }}>
        <Sidebar
          layout={layout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Backdrop (mobile uniquement, quand sidebar ouverte) */}
        {layout === 'mobile' && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 99 }}
          />
        )}

        <main style={{
          marginLeft: sidebarW,
          flex: 1,
          minHeight: '100vh',
          padding: layout === 'mobile' ? '60px 16px 32px' : layout === 'compact' ? '24px 16px 32px' : '32px 24px 32px 32px',
          transition: 'margin-left 0.25s ease',
        }}>
          {/* Top bar (mobile uniquement) */}
          {layout === 'mobile' && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, height: 52,
              background: T.panel, borderBottom: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', padding: '0 16px',
              zIndex: 98,
            }}>
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: 'none', border: 'none', color: T.text,
                  fontSize: 22, cursor: 'pointer', padding: '0 12px 0 0',
                  display: 'flex', alignItems: 'center',
                }}
              >☰</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: 'linear-gradient(135deg, #22d3ee22, #a78bfa22)',
                  border: '1px solid #22d3ee44',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 900, color: T.a1,
                }}>Δ</div>
                <div style={{ color: T.text, fontWeight: 800, fontSize: 15 }}>Dashboard Math</div>
              </div>
            </div>
          )}

          <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />

            {/* New category routes */}
            <Route path="/maths-pures" element={<Navigate to="/maths-pures/calcul" replace />} />
            <Route path="/maths-pures/:tab" element={<MathsPures />} />

            <Route path="/maths-finance" element={<Navigate to="/maths-finance/pricing" replace />} />
            <Route path="/maths-finance/:tab" element={<MathsFinance />} />

            <Route path="/maths-energie" element={<Navigate to="/maths-energie/marches" replace />} />
            <Route path="/maths-energie/:tab" element={<MathsEnergie />} />

            <Route path="/simulation" element={<Navigate to="/simulation/monte-carlo" replace />} />
            <Route path="/simulation/:tab" element={<Simulation />} />

            <Route path="/informatique" element={<Navigate to="/informatique/react-vite" replace />} />
            <Route path="/informatique/:tab" element={<Informatique />} />

            {/* Checklist */}
            <Route path="/checklist" element={<Checklist />} />
{/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
