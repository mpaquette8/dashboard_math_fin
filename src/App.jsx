import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { T } from './design/tokens'
import Sidebar from './shared/Sidebar'
import Checklist from './shared/Checklist'
import Module1 from './modules/Module1/index.jsx'
import Module2 from './modules/Module2/index.jsx'
import Module3 from './modules/Module3/index.jsx'
import Module4 from './modules/Module4/index.jsx'
import Module5 from './modules/Module5/index.jsx'
import Module6 from './modules/Module6/index.jsx'
import Module7 from './modules/Module7/index.jsx'
import Module8 from './modules/Module8/index.jsx'

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

const SIDEBAR_WIDTH = { full: 240, compact: 56, mobile: 0 }

function Home() {
  const layout = useLayout()
  const cols = layout === 'full' ? 4 : 2
  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: `0 ${layout === 'mobile' ? '16px' : '24px'}`, textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 10 }}>Δ</div>
      <h1 style={{ color: T.text, fontSize: layout === 'full' ? 32 : 22, fontWeight: 800, marginBottom: 12 }}>DPH3V Dashboard</h1>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>
        Plateforme d'apprentissage interactif pour le cours Advanced Derivatives Pricing, Hedging and Risk Management — Mennta Energy Solutions
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
        {[
          { n: 1, c: T.a1, t: 'Fondations Math' },
          { n: 2, c: T.a2, t: 'Probabilités' },
          { n: 3, c: T.a3, t: 'Processus Stoch.' },
          { n: 4, c: T.a4, t: 'Pricing Options' },
          { n: 5, c: T.a5, t: 'Volatilité' },
          { n: 6, c: T.a6, t: 'VaR Avancée' },
          { n: 7, c: T.a7, t: 'Risk Mgmt' },
          { n: 8, c: T.a8, t: 'Applications Énergie' },
        ].map(m => (
          <a key={m.n} href={`/module${m.n}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: T.panel, border: `1px solid ${m.c}33`,
              borderRadius: 10, padding: layout === 'full' ? 16 : 12, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              <div style={{ color: m.c, fontWeight: 800, fontSize: 16, marginBottom: 4 }}>M{m.n}</div>
              <div style={{ color: T.muted, fontSize: 11 }}>{m.t}</div>
            </div>
          </a>
        ))}
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
                <div style={{ color: T.text, fontWeight: 800, fontSize: 15 }}>DPH3V</div>
              </div>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/module1" element={<Module1 />} />
            <Route path="/module2" element={<Module2 />} />
            <Route path="/module3" element={<Module3 />} />
            <Route path="/module4" element={<Module4 />} />
            <Route path="/module5" element={<Module5 />} />
            <Route path="/module6" element={<Module6 />} />
            <Route path="/module7" element={<Module7 />} />
            <Route path="/module8" element={<Module8 />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
