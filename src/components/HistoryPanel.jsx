export default function HistoryPanel({ history, onLoad, onClear }) {
  if (!history.length) return (
    <div style={{
      textAlign: 'center', padding: '56px 20px',
      animation: 'fadeSlideIn 0.3s ease',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, background: '#0F1729',
        border: '1px solid #1E293B', margin: '0 auto 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>⊙</div>
      <div style={{ fontSize: 14, color: '#334155', marginBottom: 6 }}>No history yet</div>
      <div style={{ fontSize: 11, color: '#1E293B' }}>Each diff you run is saved here automatically</div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 10, color: '#334155', letterSpacing: '0.08em' }}>
          SAVED COMPARISONS ({history.length}/10)
        </span>
        <button onClick={onClear} style={{
          background: 'none', border: '1px solid #0F1729', borderRadius: 5,
          padding: '4px 10px', color: '#334155', fontSize: 10,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'border-color 0.15s, color 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#F43F5E40'; e.currentTarget.style.color = '#F87171'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#0F1729';   e.currentTarget.style.color = '#334155'; }}
        >
          Clear all
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {history.map((h, i) => (
          <div
            key={h.id}
            onClick={() => onLoad(h)}
            style={{
              padding: '12px 16px',
              background: '#070B14',
              border: '1px solid #0F1729',
              borderRadius: 8, cursor: 'pointer',
              transition: 'all 0.15s',
              animation: `fadeSlideIn 0.25s ease ${i * 0.04}s both`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#1E293B';
              e.currentTarget.style.background = '#0A0F1E';
              e.currentTarget.style.transform = 'translateX(3px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#0F1729';
              e.currentTarget.style.background = '#070B14';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            {/* Icon */}
            <div style={{
              width: 32, height: 32, borderRadius: 7,
              background: '#0F1729', border: '1px solid #1E293B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, flexShrink: 0, color: '#334155',
            }}>⇄</div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, color: '#64748B',
                fontFamily: "'JetBrains Mono',monospace",
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                marginBottom: 3,
              }}>
                {h.title}
              </div>
              <div style={{
                fontSize: 10, color: '#1E293B',
                fontFamily: 'monospace',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {h.preview?.slice(0, 3).join('  ·  ')}
              </div>
            </div>

            {/* Change count badge */}
            {h.changeCount && (
              <span style={{
                fontSize: 10, color: '#334155', background: '#0F1729',
                border: '1px solid #1E293B', borderRadius: 20,
                padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {h.changeCount} changes
              </span>
            )}

            {/* Arrow */}
            <span style={{ fontSize: 14, color: '#1E293B', flexShrink: 0 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
