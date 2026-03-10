import { useState, useCallback, useEffect, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import JsonInput    from './components/JsonInput.jsx';
import SummaryBar   from './components/SummaryBar.jsx';
import DiffResults  from './components/DiffResults.jsx';
import AIChangelog  from './components/AIChangelog.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import { computeDiff }                                          from './utils/diffEngine.js';
import { buildShareURL, loadFromURL, exportAsJSON,
         saveToHistory, getHistory, clearHistory }              from './utils/shareExport.js';

// ── Sample data ───────────────────────────────────────────────────────────────
const SAMPLE_A = JSON.stringify({
  user: { id: 1042, name: 'Alice Chen', role: 'admin', email: 'alice@corp.com', active: true },
  subscription: { plan: 'pro', seats: 5, renewsAt: '2024-03-01' },
  permissions: ['read', 'write'],
  meta: { version: '1.0', createdAt: '2023-01-15' },
}, null, 2);

const SAMPLE_B = JSON.stringify({
  user: { id: 'usr_1042', name: 'Alice Chen', email: 'alice@corp.com', active: true, tier: 'enterprise' },
  subscription: { plan: 'enterprise', seats: 25, renewsAt: '2025-03-01', ssoEnabled: true },
  permissions: ['read', 'write', 'admin', 'billing'],
  meta: { version: '2.0', createdAt: '2023-01-15', updatedAt: '2024-01-20' },
}, null, 2);

function validate(v) {
  if (!v.trim()) return '';
  try { JSON.parse(v); return ''; } catch (e) { return e.message; }
}

// ── Settings drawer ───────────────────────────────────────────────────────────
function SettingsDrawer({ open, onClose, apiKey, onApiKey }) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, zIndex: 199,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.2s ease',
        }} />
      )}
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 340, zIndex: 200,
        background: '#060A13', borderLeft: '1px solid #0F1729',
        padding: '24px', display: 'flex', flexDirection: 'column', gap: 24,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: open ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', fontFamily: "'Syne',sans-serif" }}>Settings</span>
          <button onClick={onClose} style={{
            background: '#0F1729', border: '1px solid #1E293B',
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            color: '#475569', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit',
          }}>×</button>
        </div>

        {/* API Key section */}
        <div>
          <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>
            Anthropic API Key
          </div>
          <div style={{ fontSize: 11, color: '#334155', lineHeight: 1.6, marginBottom: 12 }}>
            Optional. Powers the AI Enhanced changelog mode. Your key is stored only in this browser session.
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={e => onApiKey(e.target.value)}
            placeholder="sk-ant-api03-…"
            style={{
              width: '100%', background: '#0A0F1E', border: '1px solid #1E293B',
              borderRadius: 7, padding: '9px 12px', color: '#94A3B8',
              fontSize: 12, outline: 'none', fontFamily: 'monospace',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#6366F1'}
            onBlur={e => e.target.style.borderColor = '#1E293B'}
          />
          {apiKey && (
            <div style={{ marginTop: 8, fontSize: 10, color: '#10B981', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              Key saved for this session
            </div>
          )}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{
            display: 'block', marginTop: 10, fontSize: 10, color: '#475569',
            textDecoration: 'none',
          }}>
            Get a free key at console.anthropic.com →
          </a>
        </div>

        {/* Keyboard shortcuts */}
        <div>
          <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>
            Keyboard Shortcuts
          </div>
          {[
            ['⌘ Enter', 'Run diff analysis'],
            ['⌘ K',     'Load sample data'],
            ['Esc',     'Close this panel'],
          ].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#334155' }}>{label}</span>
              <kbd style={{
                fontSize: 10, color: '#475569', background: '#0F1729',
                border: '1px solid #1E293B', borderRadius: 4,
                padding: '2px 7px', fontFamily: 'monospace',
              }}>{key}</kbd>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #0F1729', paddingTop: 16 }}>
          <div style={{ fontSize: 10, color: '#1E293B', lineHeight: 1.6 }}>
            APIWatch v1.0 · Built with React + Vite · $0 to run
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [jsonA,     setJsonA]     = useState('');
  const [jsonB,     setJsonB]     = useState('');
  const [errA,      setErrA]      = useState('');
  const [errB,      setErrB]      = useState('');
  const [result,    setResult]    = useState(null);
  const [tab,       setTab]       = useState('diff');
  const [apiKey,    setApiKey]    = useState('');
  const [shareMsg,  setShareMsg]  = useState('');
  const [history,   setHistory]   = useState([]);
  const [settings,  setSettings]  = useState(false);
  const [running,   setRunning]   = useState(false);
  const resultsRef  = useRef(null);

  useEffect(() => {
    setHistory(getHistory());
    const fromURL = loadFromURL();
    if (fromURL) {
      if (fromURL.a) setJsonA(fromURL.a);
      if (fromURL.b) setJsonB(fromURL.b);
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') setSettings(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); loadSample(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleA = v => { setJsonA(v); setErrA(validate(v)); };
  const handleB = v => { setJsonB(v); setErrB(validate(v)); };

  const runDiff = useCallback(() => {
    if (!jsonA.trim() || !jsonB.trim() || errA || errB) return;
    setRunning(true);
    // Tiny defer for the button animation to register
    setTimeout(() => {
      const r = computeDiff(jsonA, jsonB);
      setResult(r);
      setTab('diff');
      setRunning(false);
      if (r.diffs.length > 0) {
        setHistory(saveToHistory(jsonA, jsonB, r.diffs));
      }
      // Scroll results into view
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }, 80);
  }, [jsonA, jsonB, errA, errB]);

  const handleShare = async () => {
    const s = buildShareURL(jsonA, jsonB);
    if (!s) return;
    try { await navigator.clipboard.writeText(s.url); setShareMsg(`✓ Copied (${s.sizeKB}KB)`); }
    catch { setShareMsg('⚠ Copy failed'); }
    setTimeout(() => setShareMsg(''), 3000);
  };

  const loadSample = () => { setJsonA(SAMPLE_A); setJsonB(SAMPLE_B); setErrA(''); setErrB(''); setResult(null); };
  const loadHistoryEntry = h => { setJsonA(h.a); setJsonB(h.b); setErrA(''); setErrB(''); setResult(null); };
  const handleClearHistory = () => { clearHistory(); setHistory([]); };

  const canRun      = jsonA.trim() && jsonB.trim() && !errA && !errB;
  const hasResult   = !!result;
  const breakingCt  = (result?.summary?.removed || 0) + (result?.summary?.typeChanged || 0);

  const tabDefs = [
    { id: 'diff',    label: 'Diff View',    count: result?.diffs?.length,           dot: breakingCt > 0 ? '#F43F5E' : null },
    { id: 'ai',      label: 'Changelog',    count: null,                             dot: null },
    { id: 'history', label: 'History',      count: history.length || null,           dot: null },
  ];

  return (
    <div style={{
      fontFamily: "'DM Mono','Fira Code','Courier New',monospace",
      background: '#050810', minHeight: '100vh', color: '#CBD5E1',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        textarea::placeholder { color: #0F1729; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
        a { color: inherit; }
        button { font-family: inherit; }

        @keyframes fadeIn      { from { opacity: 0 }            to { opacity: 1 } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse       { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        @keyframes shimmer     { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        @keyframes spin        { to { transform: rotate(360deg) } }

        .run-btn:not(:disabled):hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(79,70,229,0.25) !important;
        }
        .run-btn:not(:disabled):active {
          transform: translateY(0px);
        }
        .run-btn { transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important; }

        .tab-btn { transition: color 0.15s, border-color 0.15s !important; }
        .tab-btn:hover { color: #94A3B8 !important; }

        .action-btn:hover { border-color: #1E293B !important; color: #64748B !important; }
        .action-btn { transition: all 0.15s !important; }
      `}</style>

      {/* ── SETTINGS DRAWER ─────────────────────────────────────────────── */}
      <SettingsDrawer open={settings} onClose={() => setSettings(false)} apiKey={apiKey} onApiKey={setApiKey} />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid #0A1120',
        padding: '0 28px',
        height: 56,
        display: 'flex', alignItems: 'center', gap: 20,
        background: 'rgba(5,8,16,0.98)',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(16px)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #4F46E5, #0EA5E9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, boxShadow: '0 2px 10px rgba(79,70,229,0.3)',
          }}>⇄</div>
          <span style={{
            fontFamily: "'Syne',sans-serif", fontSize: 19,
            fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em',
          }}>
            API<span style={{ color: '#38BDF8' }}>Watch</span>
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: '#0F1729' }} />

        {/* Tag */}
        <span style={{ fontSize: 10, color: '#1E293B', letterSpacing: '0.1em', display: 'none' }}>
          JSON DIFF · CHANGELOG · MONITOR
        </span>

        <div style={{ flex: 1 }} />

        {/* Nav actions */}
        <button onClick={loadSample} className="action-btn" style={{
          background: 'none', border: '1px solid #0F1729',
          borderRadius: 6, padding: '6px 12px', color: '#334155',
          fontSize: 11, cursor: 'pointer', letterSpacing: '0.04em',
        }}>
          Load Sample
          <kbd style={{ marginLeft: 7, fontSize: 9, color: '#1E293B', background: '#0A0F1E', border: '1px solid #0F1729', borderRadius: 3, padding: '1px 4px' }}>⌘K</kbd>
        </button>

        {/* Settings button */}
        <button onClick={() => setSettings(true)} className="action-btn" style={{
          background: apiKey ? 'rgba(99,102,241,0.1)' : 'none',
          border: `1px solid ${apiKey ? 'rgba(99,102,241,0.3)' : '#0F1729'}`,
          borderRadius: 6, padding: '6px 12px',
          color: apiKey ? '#818CF8' : '#334155',
          fontSize: 11, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>⚙</span>
          <span style={{ letterSpacing: '0.04em' }}>Settings</span>
          {apiKey && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />}
        </button>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1260, margin: '0 auto', padding: '32px 28px 60px' }}>

        {/* ── Hero label ── */}
        <div style={{ marginBottom: 24, animation: 'fadeSlideIn 0.4s ease' }}>
          <h1 style={{
            fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800,
            color: '#F1F5F9', letterSpacing: '-0.02em', marginBottom: 6,
          }}>
            API Response Diff
          </h1>
          <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
            Paste two JSON payloads to detect changes, breaking types, and generate a developer changelog.
          </p>
        </div>

        {/* ── Input panels ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
          marginBottom: 16, animation: 'fadeSlideIn 0.4s ease 0.05s both',
        }}>
          <JsonInput label="Version A" badge="BEFORE" badgeColor="#818CF8" value={jsonA} onChange={handleA} onRun={runDiff} />
          <JsonInput label="Version B" badge="AFTER"  badgeColor="#2DD4BF" value={jsonB} onChange={handleB} onRun={runDiff} />
        </div>

        {/* ── Run button ── */}
        <div style={{ marginBottom: 32, animation: 'fadeSlideIn 0.4s ease 0.1s both' }}>
          <button
            className="run-btn"
            onClick={runDiff}
            disabled={!canRun || running}
            style={{
              width: '100%', padding: '15px', borderRadius: 10, border: 'none',
              cursor: canRun && !running ? 'pointer' : 'not-allowed',
              background: canRun
                ? running
                  ? '#1E293B'
                  : 'linear-gradient(90deg, #4F46E5 0%, #0EA5E9 55%, #10B981 100%)'
                : '#0A0F1E',
              color: canRun ? '#fff' : '#1E293B',
              fontSize: 13, fontWeight: 800, letterSpacing: '0.1em',
              fontFamily: "'Syne',sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {running ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid #334155', borderTopColor: '#64748B', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                ANALYZING…
              </>
            ) : (
              <>
                ◈  RUN DIFF ANALYSIS
                <kbd style={{ fontSize: 10, color: canRun ? 'rgba(255,255,255,0.4)' : '#1E293B', background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.1)' }}>⌘↵</kbd>
              </>
            )}
          </button>

          {/* Hint text */}
          {!canRun && !jsonA && !jsonB && (
            <p style={{ textAlign: 'center', fontSize: 11, color: '#1E293B', marginTop: 10 }}>
              Paste JSON in both panels above, then run the diff
            </p>
          )}
        </div>

        {/* ── Results section ── */}
        {hasResult && (
          <div ref={resultsRef} style={{ animation: 'fadeSlideIn 0.35s ease' }}>
            <SummaryBar summary={result.summary} />

            {/* Tabs + Actions bar */}
            <div style={{
              display: 'flex', alignItems: 'center',
              borderBottom: '1px solid #0A1120', marginBottom: 20,
            }}>
              {/* Tabs */}
              <div style={{ display: 'flex', flex: 1, gap: 0 }}>
                {tabDefs.map(({ id, label, count, dot }) => (
                  <button key={id} className="tab-btn" onClick={() => setTab(id)} style={{
                    background: 'none', border: 'none',
                    padding: '11px 18px', fontSize: 12,
                    color: tab === id ? '#F1F5F9' : '#334155',
                    borderBottom: `2px solid ${tab === id ? '#38BDF8' : 'transparent'}`,
                    marginBottom: -1, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    letterSpacing: '0.02em',
                  }}>
                    {label}
                    {count != null && count > 0 && (
                      <span style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 20, lineHeight: '18px',
                        background: tab === id ? 'rgba(56,189,248,0.12)' : '#0A0F1E',
                        color:      tab === id ? '#38BDF8'               : '#334155',
                      }}>{count}</span>
                    )}
                    {dot && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, boxShadow: `0 0 6px ${dot}`, animation: 'pulse 1.5s infinite', marginLeft: 2 }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6, paddingBottom: 1 }}>
                <button onClick={handleShare} className="action-btn" style={{
                  background: '#070B14', border: '1px solid #0F1729',
                  borderRadius: 6, padding: '6px 13px',
                  color: shareMsg ? '#10B981' : '#334155',
                  fontSize: 10, cursor: 'pointer',
                  letterSpacing: '0.05em', minWidth: 110, textAlign: 'center',
                }}>
                  {shareMsg || '⤴  Share Link'}
                </button>
                <button onClick={() => exportAsJSON(result.diffs, result.summary)} className="action-btn" style={{
                  background: '#070B14', border: '1px solid #0F1729',
                  borderRadius: 6, padding: '6px 13px', color: '#334155',
                  fontSize: 10, cursor: 'pointer', letterSpacing: '0.05em',
                }}>
                  ↓  Export JSON
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div>
              {tab === 'diff'    && <DiffResults result={result} />}
              {tab === 'ai'      && <AIChangelog diffs={result.diffs} summary={result.summary} apiKey={apiKey} />}
              {tab === 'history' && <HistoryPanel history={history} onLoad={loadHistoryEntry} onClear={handleClearHistory} />}
            </div>
          </div>
        )}

        {/* ── Pre-run empty state ── */}
        {!hasResult && (jsonA || jsonB) && (
          <div style={{ textAlign: 'center', padding: '40px 0', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 12, color: '#1E293B' }}>
              {!canRun && (errA || errB)
                ? 'Fix the JSON errors above, then run the diff'
                : 'Both panels filled — click Run Diff Analysis'
              }
            </div>
          </div>
        )}
      </main>
      <Analytics />
    </div>
  );
}
