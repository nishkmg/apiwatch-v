import { useState, useRef } from 'react';

export default function JsonInput({ label, badge, badgeColor, value, onChange, onRun }) {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  const isEmpty   = !value.trim();
  let   parseErr  = '';
  if (!isEmpty) {
    try { JSON.parse(value); } catch (e) { parseErr = e.message; }
  }

  const isValid   = !isEmpty && !parseErr;
  const sizeBytes = new TextEncoder().encode(value).length;
  const sizeLabel = sizeBytes > 1024 ? `${(sizeBytes/1024).toFixed(1)} KB` : `${sizeBytes} B`;

  const accentColor = badgeColor;
  const borderColor = parseErr
    ? '#EF4444'
    : focused
    ? accentColor
    : 'transparent';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>

      {/* ── Label row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#475569',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>{label}</span>

        <span style={{
          fontSize: 10, padding: '2px 9px', borderRadius: 20,
          background: `${accentColor}14`,
          color: accentColor,
          border: `1px solid ${accentColor}30`,
          letterSpacing: '0.06em', fontWeight: 600,
        }}>{badge}</span>

        <div style={{ flex: 1 }} />

        {/* Validation + size */}
        {!isEmpty && (
          <span style={{
            fontSize: 10, color: isValid ? '#10B981' : '#EF4444',
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'color 0.2s',
          }}>
            {isValid ? '✓ valid' : '✗ invalid'}
          </span>
        )}
        {!isEmpty && isValid && (
          <span style={{ fontSize: 10, color: '#1E293B', fontFamily: 'monospace' }}>{sizeLabel}</span>
        )}
      </div>

      {/* ── Textarea wrapper — glows on focus ── */}
      <div style={{
        position: 'relative', flex: 1,
        borderRadius: 10,
        boxShadow: focused
          ? `0 0 0 1px ${accentColor}50, 0 0 20px ${accentColor}12`
          : parseErr
          ? '0 0 0 1px #EF444440'
          : '0 0 0 1px #0F172A',
        transition: 'box-shadow 0.25s ease',
        background: '#070B14',
        overflow: 'hidden',
      }}>
        {/* top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: focused ? accentColor : parseErr ? '#EF4444' : 'transparent',
          transition: 'background 0.25s ease',
          borderRadius: '10px 10px 0 0',
          opacity: focused || parseErr ? 1 : 0,
        }} />

        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onRun?.(); }}
          placeholder={`Paste JSON response (${badge.toLowerCase()})…`}
          spellCheck={false}
          style={{
            width: '100%', minHeight: 300,
            background: 'transparent',
            border: 'none', outline: 'none',
            color: '#CBD5E1',
            fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
            fontSize: 12.5, lineHeight: 1.8,
            padding: '16px',
            resize: 'vertical',
            caretColor: accentColor,
          }}
        />

        {/* Error tooltip pinned to bottom */}
        {parseErr && (
          <div style={{
            padding: '6px 14px 8px',
            background: 'rgba(239,68,68,0.06)',
            borderTop: '1px solid rgba(239,68,68,0.15)',
            fontSize: 10, color: '#F87171',
            fontFamily: 'monospace', lineHeight: 1.5,
          }}>
            ⚠ {parseErr}
          </div>
        )}
      </div>
    </div>
  );
}
