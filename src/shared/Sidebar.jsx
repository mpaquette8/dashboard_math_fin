import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { T, categoryInfo } from '../design/tokens'

// ─── Compact sidebar (56px) — icons only ──────────────────────────────────────
function SidebarCompact() {
  const location = useLocation()
  return (
    <nav style={{
      width: 56, minHeight: '100vh', background: T.panel,
      borderRight: `1px solid ${T.border}`, display: 'flex',
      flexDirection: 'column', alignItems: 'center',
      position: 'fixed', top: 0, left: 0, zIndex: 100, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        width: '100%', padding: '12px 0', borderBottom: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'center',
      }}>
        <NavLink to="/" style={{ textDecoration: 'none' }} title="Accueil">
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, #22d3ee22, #a78bfa22)',
            border: '1px solid #22d3ee44',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: T.a1, cursor: 'pointer',
          }}>Δ</div>
        </NavLink>
      </div>

      {/* Categories */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 3, padding: '8px 0',
      }}>
        {categoryInfo.map(cat => {
          const isActive = location.pathname.startsWith(cat.path)
          return (
            <NavLink
              key={cat.id}
              to={cat.path}
              title={cat.label}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: isActive ? `${cat.accent}33` : `${cat.accent}11`,
                border: isActive ? `1px solid ${cat.accent}66` : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, transition: 'all 0.15s', cursor: 'pointer',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = `${cat.accent}22` }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = `${cat.accent}11` }}
              >
                {cat.icon}
              </div>
            </NavLink>
          )
        })}

        {/* Checklist */}
        <div style={{ borderTop: `1px solid ${T.border}`, width: 40, paddingTop: 6, marginTop: 2, display: 'flex', justifyContent: 'center' }}>
          <NavLink to="/checklist" title="Checklist" style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: isActive ? '#ffffff22' : '#ffffff0a',
                border: isActive ? `1px solid ${T.border}` : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, cursor: 'pointer',
                color: isActive ? T.text : T.muted,
                transition: 'all 0.15s',
              }}>✓</div>
            )}
          </NavLink>
        </div>
      </div>
    </nav>
  )
}

// ─── Full sidebar (260px) or mobile slide-in ──────────────────────────────────
function SidebarFull({ layout, isOpen, onClose }) {
  const location = useLocation()
  const isMobile = layout === 'mobile'

  const handleNavClick = () => {
    if (isMobile) onClose()
  }

  return (
    <nav style={{
      width: 260, minHeight: '100vh', background: T.panel,
      borderRight: `1px solid ${T.border}`, display: 'flex',
      flexDirection: 'column', position: 'fixed', top: 0, left: 0,
      zIndex: 100, overflowY: 'auto',
      transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      transition: isMobile ? 'transform 0.25s ease' : 'none',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }} onClick={handleNavClick}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #22d3ee22, #a78bfa22)',
              border: '1px solid #22d3ee44',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: T.a1,
            }}>Δ</div>
            <div>
              <div style={{ color: T.text, fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>Dashboard Math</div>
              <div style={{ color: T.muted, fontSize: 10, letterSpacing: 0.5 }}>Maths · Finance · Énergie</div>
            </div>
          </NavLink>
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', color: T.muted,
                fontSize: 20, cursor: 'pointer', padding: 4, lineHeight: 1,
              }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Category sections */}
      <div style={{ padding: '10px 10px', flex: 1 }}>
        {categoryInfo.map((cat, catIdx) => {
          const isCatActive = location.pathname.startsWith(cat.path)
          return (
            <div key={cat.id} style={{ marginBottom: catIdx < categoryInfo.length - 1 ? 4 : 0 }}>
              {/* Category label row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 8px 4px 8px',
                borderTop: catIdx > 0 ? `1px solid ${T.border}` : 'none',
                marginTop: catIdx > 0 ? 6 : 0,
              }}>
                <span style={{ fontSize: 13 }}>{cat.icon}</span>
                <div style={{
                  color: isCatActive ? cat.accent : T.muted,
                  fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 1,
                }}>
                  {cat.label}
                </div>
              </div>

              {/* Tab links */}
              {cat.tabs.map(tabItem => {
                const tabPath = `${cat.path}/${tabItem.slug}`
                const isTabActive = location.pathname === tabPath
                return (
                  <NavLink
                    key={tabItem.slug}
                    to={tabPath}
                    onClick={handleNavClick}
                    style={{ textDecoration: 'none', display: 'block', marginBottom: 1 }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 10px 7px 26px', borderRadius: 6,
                      background: isTabActive ? `${cat.accent}18` : 'transparent',
                      border: isTabActive ? `1px solid ${cat.accent}44` : '1px solid transparent',
                      transition: 'all 0.12s', cursor: 'pointer',
                    }}
                      onMouseEnter={e => { if (!isTabActive) e.currentTarget.style.background = `${cat.accent}0a` }}
                      onMouseLeave={e => { if (!isTabActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                        background: isTabActive ? cat.accent : T.muted,
                        opacity: isTabActive ? 1 : 0.5,
                      }} />
                      <div style={{
                        color: isTabActive ? cat.accent : T.text,
                        fontSize: 12, fontWeight: isTabActive ? 600 : 400,
                        lineHeight: 1.3,
                      }}>
                        {tabItem.label}
                      </div>
                      {isTabActive && (
                        <div style={{
                          marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%',
                          background: cat.accent, flexShrink: 0,
                        }} />
                      )}
                    </div>
                  </NavLink>
                )
              })}
            </div>
          )
        })}

        {/* Checklist */}
        <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 10, paddingTop: 8 }}>
          <NavLink to="/checklist" onClick={handleNavClick} style={{ textDecoration: 'none', display: 'block' }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8,
                background: isActive ? '#ffffff11' : 'transparent',
                border: isActive ? `1px solid ${T.border}` : '1px solid transparent',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: isActive ? '#ffffff22' : '#ffffff0a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>✓</div>
                <div style={{ color: isActive ? T.text : T.muted, fontSize: 12, fontWeight: isActive ? 700 : 400 }}>
                  Checklist
                </div>
              </div>
            )}
          </NavLink>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ color: T.muted, fontSize: 10, textAlign: 'center' }}>
          Dashboard Personnel · 2026
        </div>
      </div>
    </nav>
  )
}

export default function Sidebar({ layout = 'full', isOpen = false, onClose = () => {} }) {
  if (layout === 'compact') return <SidebarCompact />
  return <SidebarFull layout={layout} isOpen={isOpen} onClose={onClose} />
}
