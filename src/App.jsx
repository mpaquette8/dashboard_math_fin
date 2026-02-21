import React from 'react'
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

function Home() {
  return (
    <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>Δ</div>
      <h1 style={{ color: T.text, fontSize: 32, fontWeight: 800, marginBottom: 12 }}>DPH3V Dashboard</h1>
      <p style={{ color: T.muted, fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
        Plateforme d'apprentissage interactif pour le cours Advanced Derivatives Pricing, Hedging and Risk Management — Mennta Energy Solutions
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
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
              borderRadius: 10, padding: 16, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              <div style={{ color: m.c, fontWeight: 800, fontSize: 18, marginBottom: 4 }}>M{m.n}</div>
              <div style={{ color: T.muted, fontSize: 11 }}>{m.t}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', background: T.bg, minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', padding: '32px 24px 32px 32px' }}>
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
