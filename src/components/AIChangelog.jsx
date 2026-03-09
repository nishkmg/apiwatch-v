import { useState } from 'react';
import { generateRuleBasedChangelog } from '../utils/changelogGenerator.js';
import { exportAsMarkdown, copyToClipboard } from '../utils/shareExport.js';

export default function AIChangelog({ diffs, summary, apiKey }) {
  const [mode,    setMode]    = useState('auto');
  const [log,     setLog]     = useState('');
  const [source,  setSource]  = useState('auto');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [copied,  setCopied]  = useState(false);

  function generateAuto() {
    setError('');
    setLog(generateRuleBasedChangelog(diffs, summary));
    setSource('auto');
  }

  async function generateClaude() {
    setLoading(true); setError('');
    const diffText = diffs.map(d => {
      if (d.type === 'added')        return `ADDED: ${d.path} (${d.newType}) = ${d.newValue}`;
      if (d.type === 'removed')      return `REMOVED: ${d.path} was (${d.oldType}) ${d.oldValue}`;
      if (d.type === 'changed')      return `CHANGED: ${d.path}  ${d.oldValue} → ${d.newValue}`;
      if (d.type === 'type_changed') return `⚠️ TYPE BREAK: ${d.path} was ${d.oldType}(${d.oldValue}), now ${d.newType}(${d.newValue})`;
      return '';
    }).join('\n');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 700,
          system: `You are a senior API engineer writing a changelog. Given JSON diff changes, write a developer-friendly Markdown changelog. Flag breaking changes with ⚠️. Group by: Breaking Changes, Added, Changed, Removed. Include migration advice. Max 250 words.`,
          messages: [{ role: 'user', content: `Write a changelog:\n\n${diffText}\n\nSummary: ${summary.added} added, ${summary.removed} removed, ${summary.changed} changed, ${summary.typeChanged} type changes.` }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setLog(data.content?.[0]?.text || '');
      setSource('claude');
    } catch (e) {
      setError(e.message || 'API error — check your key or credit balance.');
      setLog(generateRuleBasedChangelog(diffs, summary));
      setSource('auto');
    }
    setLoading(false);
  }

  const handleGenerate = () => {
    if (!diffs.length) return;
    mode === 'auto' ? generateAuto() : generateClaude();
  };

  async function handleCopy() {
    await copyToClipboard(log);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const noDiffs  = diffs.length === 0;
  const needsKey = mode === 'claude' && !apiKey;
  const canRun   = !noDiffs && !needsKey && !loading;

  return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>

      {/* ── Mode selector ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#334155', letterSpacing: '0.08em', marginBottom: 10 }}>
          GENERATION MODE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { id: 'auto',   icon: '⚡', title: 'Smart (Free)',  sub: 'Rule-based · Instant · No API needed', color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)' },
            { id: 'claude', icon: '✦',  title: 'AI Enhanced',  sub: 'Claude Sonnet · Requires API key',      color: '#818CF8', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.3)'  },
          ].map(opt => (
            <button key={opt.id} onClick={() => setMode(opt.id)} style={{
              padding: '12px 14px', borderRadius: 8, border: `1px solid ${mode === opt.id ? opt.border : '#0F1729'}`,
              background: mode === opt.id ? opt.bg : '#070B14',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              transition: 'all 0.2s',
              boxShadow: mode === opt.id ? `0 0 14px ${opt.color}10` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{ fontSize: 14, color: mode === opt.id ? opt.color : '#334155' }}>{opt.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: mode === opt.id ? opt.color : '#475569', letterSpacing: '0.02em' }}>{opt.title}</span>
                {mode === opt.id && (
                  <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: opt.color, boxShadow: `0 0 6px ${opt.color}` }} />
                )}
              </div>
              <div style={{ fontSize: 10, color: mode === opt.id ? '#475569' : '#1E293B', lineHeight: 1.5 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── API key notice ── */}
      {mode === 'claude' && !apiKey && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 14,
          background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
          fontSize: 11, color: '#92400E', lineHeight: 1.6,
          animation: 'fadeSlideIn 0.2s ease',
        }}>
          ⚠ Enter your Anthropic API key in the settings panel (top right) to use AI Enhanced mode.
        </div>
      )}

      {/* ── Generate button ── */}
      <button onClick={handleGenerate} disabled={!canRun} style={{
        width: '100%', padding: '12px', borderRadius: 8, border: 'none',
        cursor: canRun ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
        background: !canRun ? '#0A0F1E'
          : mode === 'auto'   ? 'linear-gradient(135deg, #065F46, #059669)'
          : 'linear-gradient(135deg, #3730A3, #6366F1)',
        color: canRun ? '#fff' : '#1E293B',
        fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
        transition: 'all 0.2s',
        boxShadow: canRun ? (mode === 'auto' ? '0 4px 15px rgba(16,185,129,0.15)' : '0 4px 15px rgba(99,102,241,0.15)') : 'none',
      }}>
        {loading ? '⟳  Generating…' : mode === 'auto' ? '⚡  Generate Changelog — Free' : '✦  Generate AI Changelog'}
      </button>

      {/* ── Error ── */}
      {error && (
        <div style={{
          marginTop: 10, padding: '10px 14px',
          background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)',
          borderRadius: 8, fontSize: 11, color: '#F87171', lineHeight: 1.6,
          animation: 'fadeSlideIn 0.2s ease',
        }}>
          ✗ {error}
          {log && <span style={{ color: '#475569' }}> Showing Smart changelog as fallback.</span>}
        </div>
      )}

      {/* ── Output ── */}
      {log && (
        <div style={{ marginTop: 16, animation: 'fadeSlideIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 10, color: '#334155', letterSpacing: '0.08em' }}>OUTPUT</span>
              <span style={{
                fontSize: 9, padding: '2px 7px', borderRadius: 20, letterSpacing: '0.06em',
                background: source === 'claude' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.08)',
                color:      source === 'claude' ? '#818CF8'               : '#10B981',
                border: `1px solid ${source === 'claude' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.15)'}`,
              }}>
                {source === 'claude' ? '✦ AI ENHANCED' : '⚡ RULE-BASED'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleCopy} style={{
                background: 'none', border: '1px solid #0F1729', borderRadius: 5,
                padding: '4px 10px', fontSize: 10, color: copied ? '#10B981' : '#334155',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                {copied ? '✓ Copied' : 'Copy MD'}
              </button>
              <button onClick={() => exportAsMarkdown(log, summary)} style={{
                background: 'none', border: '1px solid #0F1729', borderRadius: 5,
                padding: '4px 10px', fontSize: 10, color: '#334155',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                ↓ Save .MD
              </button>
            </div>
          </div>
          <pre style={{
            background: '#050810', border: '1px solid #0F1729', borderRadius: 8,
            padding: '16px', fontSize: 12, color: '#94A3B8', lineHeight: 1.9,
            fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
            whiteSpace: 'pre-wrap', maxHeight: 420, overflowY: 'auto', margin: 0,
          }}>{log}</pre>
        </div>
      )}

      {noDiffs && !log && (
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: '#1E293B', padding: '12px 0' }}>
          Run a diff first to generate a changelog.
        </div>
      )}
    </div>
  );
}
