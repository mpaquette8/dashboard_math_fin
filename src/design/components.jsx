import React, { useState } from 'react'
import { T } from './tokens'

// ─── Panel ───────────────────────────────────────────────────────────────────
export function Panel({ children, style, accent }) {
  return (
    <div style={{
      background: T.panel,
      border: `1px solid ${accent ? accent + '33' : T.border}`,
      borderRadius: T.r2,
      padding: T.gap2,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── FormulaBox ──────────────────────────────────────────────────────────────
export function FormulaBox({ children, accent = T.a1, label }) {
  return (
    <div style={{
      background: T.panel2,
      border: `1px solid ${accent}55`,
      borderLeft: `4px solid ${accent}`,
      borderRadius: T.r,
      padding: '16px 20px',
      margin: '12px 0',
      fontFamily: 'monospace',
    }}>
      {label && (
        <div style={{ color: accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          {label}
        </div>
      )}
      <div style={{ color: T.text, fontSize: 16, lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

// ─── InfoChip ────────────────────────────────────────────────────────────────
export function InfoChip({ label, value, accent = T.a1, unit = '' }) {
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      background: T.panel2, border: `1px solid ${accent}44`,
      borderRadius: T.r, padding: '10px 16px', margin: 4, minWidth: 90,
    }}>
      <span style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
      <span style={{ color: accent, fontSize: 22, fontWeight: 700, marginTop: 2 }}>{value}<span style={{ fontSize: 13, color: T.muted, marginLeft: 2 }}>{unit}</span></span>
    </div>
  )
}

// ─── TabBar ──────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange, accent = T.a1 }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: T.gap2, flexWrap: 'wrap' }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            background: active === tab ? `${accent}22` : 'transparent',
            color: active === tab ? accent : T.muted,
            border: 'none',
            borderBottom: active === tab ? `2px solid ${accent}` : '2px solid transparent',
            padding: '10px 18px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: active === tab ? 700 : 400,
            transition: 'all 0.15s',
            borderRadius: '6px 6px 0 0',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ─── ModuleHeader ─────────────────────────────────────────────────────────────
export function ModuleHeader({ num, title, subtitle, accent }) {
  return (
    <div style={{ marginBottom: T.gap2, padding: '24px 0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <div style={{
          width: 48, height: 48, borderRadius: T.r,
          background: `${accent}22`, border: `1px solid ${accent}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 900, color: accent,
        }}>M{num}</div>
        <div>
          <div style={{ color: T.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Module {num}</div>
          <h1 style={{ color: T.text, fontSize: 24, fontWeight: 800 }}>{title}</h1>
        </div>
      </div>
      {subtitle && <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, maxWidth: 700 }}>{subtitle}</p>}
    </div>
  )
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────
export function SectionTitle({ children, accent = T.a1 }) {
  return (
    <h3 style={{ color: accent, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 24 }}>
      {children}
    </h3>
  )
}

// ─── Intuition Block ──────────────────────────────────────────────────────────
export function IntuitionBlock({ emoji = '💡', title, children, accent = T.a1 }) {
  return (
    <div style={{
      background: `${accent}0d`, border: `1px solid ${accent}33`,
      borderRadius: T.r2, padding: '20px 24px', margin: '16px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <span style={{ color: accent, fontWeight: 700, fontSize: 15 }}>{title}</span>
        <span style={{
          background: `${accent}22`, color: accent, fontSize: 10,
          padding: '2px 8px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
        }}>Intuition</span>
      </div>
      <div style={{ color: T.text, fontSize: 14, lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

// ─── Example Block ────────────────────────────────────────────────────────────
export function ExampleBlock({ title, children, accent = T.a4 }) {
  return (
    <div style={{
      background: `${accent}0a`, border: `1px solid ${accent}33`,
      borderRadius: T.r2, padding: '20px 24px', margin: '16px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>⚡</span>
        <span style={{ color: accent, fontWeight: 700, fontSize: 15 }}>{title}</span>
        <span style={{
          background: `${accent}22`, color: accent, fontSize: 10,
          padding: '2px 8px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
        }}>Exemple Énergie</span>
      </div>
      <div style={{ color: T.text, fontSize: 14, lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

// ─── Slider ──────────────────────────────────────────────────────────────────
export function Slider({ label, value, min, max, step = 0.01, onChange, accent = T.a1, format = v => v.toFixed(2) }) {
  return (
    <div style={{ margin: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: T.muted, fontSize: 13 }}>{label}</span>
        <span style={{ color: accent, fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%', height: 4, appearance: 'none', background: `linear-gradient(to right, ${accent} 0%, ${accent} ${((value-min)/(max-min))*100}%, ${T.border} ${((value-min)/(max-min))*100}%, ${T.border} 100%)`,
          borderRadius: 2, outline: 'none', cursor: 'pointer',
        }}
      />
    </div>
  )
}

// ─── Accordion (Exercices) ────────────────────────────────────────────────────
export function Accordion({ title, children, accent = T.a1, badge }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: T.r, marginBottom: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: open ? `${accent}11` : T.panel2, border: 'none', padding: '14px 18px',
          cursor: 'pointer', color: T.text, fontSize: 14, fontWeight: 600, textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {badge && <span style={{ background: `${accent}33`, color: accent, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{badge}</span>}
          {title}
        </span>
        <span style={{ color: accent, fontSize: 18, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '16px 18px', background: T.panel, borderTop: `1px solid ${T.border}` }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Step ────────────────────────────────────────────────────────────────────
export function Step({ num, children, accent = T.a1 }) {
  return (
    <div style={{ display: 'flex', gap: 12, margin: '10px 0', alignItems: 'flex-start' }}>
      <div style={{
        minWidth: 26, height: 26, borderRadius: '50%',
        background: `${accent}22`, border: `1px solid ${accent}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent, fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
      }}>{num}</div>
      <div style={{ color: T.text, fontSize: 14, lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

// ─── SymbolLegend ─────────────────────────────────────────────────────────────
export function SymbolLegend({ symbols, accent = T.a1 }) {
  return (
    <div style={{ background: T.panel2, borderRadius: T.r, padding: '14px 18px', margin: '12px 0' }}>
      <div style={{ color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Symboles</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
        {symbols.map(([sym, def]) => (
          <div key={sym} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <code style={{ color: accent, fontWeight: 700, minWidth: 40, fontFamily: 'monospace', fontSize: 14 }}>{sym}</code>
            <span style={{ color: T.muted, fontSize: 13 }}>— {def}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Grid ────────────────────────────────────────────────────────────────────
export function Grid({ cols = 2, children, gap = T.gap }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
      {children}
    </div>
  )
}

// ─── ChartWrapper ─────────────────────────────────────────────────────────────
export function ChartWrapper({ title, children, accent, height = 280 }) {
  return (
    <div style={{ background: T.panel2, borderRadius: T.r2, padding: '16px', border: `1px solid ${T.border}` }}>
      {title && <div style={{ color: accent || T.text, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{title}</div>}
      <div style={{ height }}>{children}</div>
    </div>
  )
}
