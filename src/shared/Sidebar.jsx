import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { T, moduleInfo } from '../design/tokens'

export default function Sidebar({ isMobile = false, isOpen = false, onClose = () => {} }) {
  const location = useLocation()

  const handleNavClick = () => {
    if (isMobile) onClose()
  }

  return (
    <nav style={{
      width: 240, minHeight: '100vh', background: T.panel,
      borderRight: `1px solid ${T.border}`, display: 'flex',
      flexDirection: 'column', position: 'fixed', top: 0, left: 0,
      zIndex: 100, overflowY: 'auto',
      transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      transition: isMobile ? 'transform 0.25s ease' : 'none',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #22d3ee22, #a78bfa22)',
              border: '1px solid #22d3ee44',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: T.a1,
            }}>Δ</div>
            <div>
              <div style={{ color: T.text, fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>DPH3V</div>
              <div style={{ color: T.muted, fontSize: 10, letterSpacing: 0.5 }}>Mennta Energy</div>
            </div>
          </div>
          {/* Bouton fermer (mobile uniquement) */}
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
        <div style={{
          background: `${T.a1}11`, border: `1px solid ${T.a1}33`,
          borderRadius: 6, padding: '6px 10px', marginTop: 10,
        }}>
          <div style={{ color: T.a1, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Advanced Derivatives
          </div>
          <div style={{ color: T.muted, fontSize: 10 }}>Pricing, Hedging & Risk Mgmt</div>
        </div>
      </div>

      {/* Modules */}
      <div style={{ padding: '12px 12px', flex: 1 }}>
        <div style={{ color: T.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 8px', marginBottom: 4 }}>
          Modules
        </div>
        {moduleInfo.map(mod => {
          const isActive = location.pathname === mod.path || location.pathname.startsWith(mod.path + '/')
          return (
            <NavLink
              key={mod.id}
              to={mod.path}
              onClick={handleNavClick}
              style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8,
                background: isActive ? `${mod.accent}18` : 'transparent',
                border: isActive ? `1px solid ${mod.accent}44` : '1px solid transparent',
                transition: 'all 0.15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = `${mod.accent}0a` }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: isActive ? `${mod.accent}33` : `${mod.accent}11`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: mod.accent, fontSize: 11, fontWeight: 800,
                }}>
                  {mod.short}
                </div>
                <div>
                  <div style={{
                    color: isActive ? mod.accent : T.text,
                    fontSize: 12, fontWeight: isActive ? 700 : 400,
                    lineHeight: 1.3,
                  }}>{mod.label}</div>
                </div>
                {isActive && (
                  <div style={{
                    marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%',
                    background: mod.accent, flexShrink: 0,
                  }} />
                )}
              </div>
            </NavLink>
          )
        })}

        {/* Checklist */}
        <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 8 }}>
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
                  Checklist DPH3V
                </div>
              </div>
            )}
          </NavLink>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ color: T.muted, fontSize: 10, textAlign: 'center' }}>
          Préparation DPH3V · 2026
        </div>
      </div>
    </nav>
  )
}
