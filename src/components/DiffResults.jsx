import { useState } from 'react';
import { DIFF_TYPES } from '../utils/diffEngine.js';

export const TYPE_CONFIG = {
  [DIFF_TYPES.ADDED]:        { color: '#10B981', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.15)', label: 'ADDED',   icon: '+', pill: 'rgba(16,185,129,0.12)'  },
  [DIFF_TYPES.REMOVED]:      { color: '#F43F5E', bg: 'rgba(244,63,94,0.06)',   border: 'rgba(244,63,94,0.15)',  label: 'REMOVED', icon: '−', pill: 'rgba(244,63,94,0.12)'   },
  [DIFF_TYPES.CHANGED]:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.15)', label: 'CHANGED', icon: '⟳', pill: 'rgba(245,158,11,0.12)'  },
  [DIFF_TYPES.TYPE_CHANGED]: { color: '#A855F7', bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.15)', label: 'TYPE ⚡',  icon: '⚡', pill: 'rgba(168,85,247,0.12)' },
};

function DiffRow({ diff, index }) {
  const [hovered, setHovered] = useState(false);
  const cfg = TYPE_CONFIG[diff.type];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 0, borderRadius: 8, marginBottom: 5, overflow: 'hidden',
        background: hovered ? cfg.bg : '#070B14',
        border: `1px solid ${hovered ? cfg.border : '#0F1729'}`,
        transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
        transform: hovered ? 'translateX(2px)' : 'translateX(0)',
        animation: `fadeSlideIn 0.25s ease ${Math.min(index * 0.03, 0.5)}s both`,
        cursor: 'default',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        width: 3, background: cfg.color,
        opacity: hovered ? 1 : 0.4,
        transition: 'opacity 0.15s',
        flexShrink: 0,
      }} />

      <div style={{ padding: '10px 14px', flex: 1, minWidth: 0 }}>
        {/* Top row: badge + path */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: cfg.color,
            background: cfg.pill,
            border: `1px solid ${cfg.border}`,
            padding: '2px 7px', borderRadius: 4,
            letterSpacing: '0.08em', flexShrink: 0,
          }}>
            {cfg.icon} {cfg.label}
          </span>
          <code style={{
            fontSize: 12, color: '#94A3B8',
            fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
            wordBreak: 'break-all',
          }}>
            {diff.path}
          </code>
        </div>

        {/* Value row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingLeft: 2 }}>
          {diff.type === DIFF_TYPES.ADDED && (<>
            <span style={{ fontSize: 10, color: '#334155' }}>value</span>
            <code style={{ fontSize: 11, color: '#10B981', fontFamily: 'monospace' }}>{diff.newValue}</code>
            <span style={{ fontSize: 10, color: '#1E293B', fontFamily: 'monospace' }}>({diff.newType})</span>
          </>)}

          {diff.type === DIFF_TYPES.REMOVED && (<>
            <span style={{ fontSize: 10, color: '#334155' }}>was</span>
            <code style={{ fontSize: 11, color: '#F87171', fontFamily: 'monospace', textDecoration: 'line-through', textDecorationColor: '#F4345E60' }}>{diff.oldValue}</code>
            <span style={{ fontSize: 10, color: '#1E293B', fontFamily: 'monospace' }}>({diff.oldType})</span>
          </>)}

          {(diff.type === DIFF_TYPES.CHANGED || diff.type === DIFF_TYPES.TYPE_CHANGED) && (<>
            <code style={{ fontSize: 11, color: '#F87171', fontFamily: 'monospace', textDecoration: diff.type === DIFF_TYPES.REMOVED ? 'line-through' : 'none' }}>{diff.oldValue}</code>
            <span style={{ color: '#334155', fontSize: 14, lineHeight: 1 }}>→</span>
            <code style={{ fontSize: 11, color: '#10B981', fontFamily: 'monospace' }}>{diff.newValue}</code>
            {diff.type === DIFF_TYPES.TYPE_CHANGED && (
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 4,
                background: 'rgba(168,85,247,0.1)', color: '#C084FC',
                border: '1px solid rgba(168,85,247,0.25)',
                fontFamily: 'monospace', letterSpacing: '0.04em',
              }}>
                {diff.oldType} → {diff.newType}
              </span>
            )}
          </>)}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, count, active, color, bg, border, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 20, border: `1px solid ${active ? border : '#0F1729'}`,
      background: active ? bg : '#070B14',
      color: active ? color : '#334155',
      fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
      transition: 'all 0.15s',
      transform: active ? 'scale(1.02)' : 'scale(1)',
    }}>
      <span style={{ fontWeight: active ? 700 : 400 }}>{label}</span>
      <span style={{
        fontSize: 10, background: active ? `${color}20` : '#0F1729',
        color: active ? color : '#1E293B',
        padding: '0 5px', borderRadius: 10, lineHeight: '16px',
        minWidth: 18, textAlign: 'center',
      }}>{count}</span>
    </button>
  );
}

export default function DiffResults({ result }) {
  const [filter, setFilter] = useState('all');

  if (!result) return null;

  if (result.error) return (
    <div style={{
      padding: '14px 16px', background: 'rgba(239,68,68,0.05)',
      border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
      color: '#F87171', fontSize: 12, fontFamily: 'monospace',
    }}>
      ✗ Parse error: {result.error}
    </div>
  );

  if (result.diffs.length === 0) return (
    <div style={{
      textAlign: 'center', padding: '56px 20px',
      animation: 'fadeSlideIn 0.3s ease',
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
      <div style={{ fontSize: 15, color: '#10B981', fontWeight: 600 }}>Payloads are identical</div>
      <div style={{ fontSize: 12, color: '#334155', marginTop: 6 }}>No differences found between Version A and Version B</div>
    </div>
  );

  const filtered = result.diffs.filter(d => filter === 'all' || d.type === filter);
  const filterOpts = [
    { id: 'all', label: 'All',     count: result.diffs.length,                                color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
    ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({
      id: k, label: v.label, count: result.diffs.filter(d => d.type === k).length,
      color: v.color, bg: v.bg, border: v.border,
    })),
  ];

  return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#334155', letterSpacing: '0.08em', marginRight: 4 }}>FILTER</span>
        {filterOpts.map(f => (
          <FilterPill key={f.id} {...f} active={filter === f.id} onClick={() => setFilter(f.id)} />
        ))}
        {filter !== 'all' && (
          <span style={{ fontSize: 11, color: '#334155', marginLeft: 4 }}>
            Showing {filtered.length} of {result.diffs.length}
          </span>
        )}
      </div>

      {/* Rows */}
      <div style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 2 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#1E293B', fontSize: 12 }}>
            No changes of this type
          </div>
        ) : (
          filtered.map((diff, i) => <DiffRow key={`${diff.path}-${i}`} diff={diff} index={i} />)
        )}
      </div>
    </div>
  );
}
