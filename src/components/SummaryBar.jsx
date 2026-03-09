const STATS = [
  { key: 'added',       label: 'Added',       color: '#10B981', bg: 'rgba(16,185,129,0.07)',  border: 'rgba(16,185,129,0.18)', icon: '+' },
  { key: 'removed',     label: 'Removed',     color: '#F43F5E', bg: 'rgba(244,63,94,0.07)',   border: 'rgba(244,63,94,0.18)',  icon: '−', breaking: true },
  { key: 'changed',     label: 'Changed',     color: '#F59E0B', bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.18)', icon: '~' },
  { key: 'typeChanged', label: 'Type Breaks', color: '#A855F7', bg: 'rgba(168,85,247,0.07)', border: 'rgba(168,85,247,0.18)', icon: '⚡', breaking: true },
];

export default function SummaryBar({ summary }) {
  if (!summary) return null;

  const totalBreaking = (summary.removed || 0) + (summary.typeChanged || 0);
  const totalChanges  = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <div style={{ marginBottom: 24 }}>

      {/* ── Breaking-change banner (only when relevant) ── */}
      {totalBreaking > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderRadius: 8, marginBottom: 12,
          background: 'rgba(244,63,94,0.06)',
          border: '1px solid rgba(244,63,94,0.2)',
          animation: 'fadeSlideIn 0.3s ease',
        }}>
          <span style={{ fontSize: 15 }}>⚠️</span>
          <span style={{ fontSize: 12, color: '#F87171', fontWeight: 600 }}>
            {totalBreaking} breaking change{totalBreaking > 1 ? 's' : ''} detected
          </span>
          <span style={{ fontSize: 11, color: '#64748B' }}>
            — review before deploying to production
          </span>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {STATS.map(({ key, label, color, bg, border, icon, breaking }, i) => {
          const val   = summary[key] || 0;
          const muted = val === 0;
          return (
            <div key={key} style={{
              background: muted ? '#070B14' : bg,
              border: `1px solid ${muted ? '#0F1729' : border}`,
              borderRadius: 10, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: muted ? 0.4 : 1,
              transition: 'all 0.3s ease',
              animation: `fadeSlideIn 0.35s ease ${i * 0.05}s both`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: muted ? '#0F1729' : `${color}18`,
                border: `1px solid ${muted ? '#1E293B' : `${color}30`}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, color: muted ? '#1E293B' : color,
                flexShrink: 0,
              }}>{icon}</div>
              <div>
                <div style={{
                  fontSize: 26, fontWeight: 800, color: muted ? '#1E293B' : color,
                  fontFamily: "'Syne',sans-serif", lineHeight: 1,
                }}>{val}</div>
                <div style={{
                  fontSize: 10, color: muted ? '#1E293B' : '#475569',
                  marginTop: 4, letterSpacing: '0.07em', textTransform: 'uppercase',
                }}>{label}</div>
              </div>
              {breaking && val > 0 && (
                <div style={{ marginLeft: 'auto' }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                    animation: 'pulse 1.5s infinite',
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
