<div align="center">

<img src="https://img.shields.io/badge/APIWatch-v1.0.0-0EA5E9?style=for-the-badge&labelColor=050810" alt="version" />
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white&labelColor=050810" alt="react" />
<img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white&labelColor=050810" alt="vite" />
<img src="https://img.shields.io/badge/cost-%240%2Fmonth-10B981?style=for-the-badge&labelColor=050810" alt="cost" />
<img src="https://img.shields.io/badge/license-MIT-A855F7?style=for-the-badge&labelColor=050810" alt="license" />

<br /><br />

# ⇄ APIWatch

### Paste two JSON responses. See exactly what broke.

**Type-aware JSON diffing · Rule-based changelog · Shareable links · Zero backend**

<br />

[**🚀 Live Demo**](https://apiwatch-v.vercel.app/) &nbsp;·&nbsp; [**📖 Documentation**](#-getting-started) &nbsp;·&nbsp; [**🐛 Report Bug**](https://github.com/yourusername/apiwatch/issues) &nbsp;·&nbsp; [**✨ Request Feature**](https://github.com/yourusername/apiwatch/issues)

<br />

</div>

---

## The Problem

Your backend team deployed. Something broke. You open DevTools, copy the JSON response, and try to remember what the old one looked like. You miss the one field that silently changed from an integer to a string.

Two hours later, you find it.

**APIWatch catches it in under 5 seconds.**

---

## What Makes It Different

Most JSON tools show you *what's different*. APIWatch tells you *what it means*.

```
user.id       ⚡ TYPE BREAK   number → string   (update all parseInt() calls)
user.role     − REMOVED       "admin"            (remove all references)
user.tier     + ADDED         "enterprise"
subscription  ~ CHANGED       "pro" → "enterprise"
```

It separates **type changes** from **value changes** — because `int → string` on an ID field requires code changes. A value change usually doesn't. Most tools treat these identically.

---

## Features

| | Feature | Details |
|---|---|---|
| ⚡ | **Type-aware Diff** | Detects added, removed, changed, and type-broken fields separately |
| 🔴 | **Breaking Change Detection** | Flags removed fields and type coercions as breaking, with a production warning banner |
| 📋 | **Rule-based Changelog** | Generates structured migration notes with zero API credits |
| 🤖 | **AI Enhanced Changelog** | Optional Claude Sonnet integration for richer prose output |
| 🔗 | **Shareable Diff URLs** | Encodes both payloads in the URL hash — no backend, no database |
| 📥 | **Export** | Download as structured JSON report or Markdown changelog |
| 🕘 | **History** | Auto-saves last 10 comparisons to localStorage |
| ⌨️ | **Keyboard Shortcuts** | `⌘↵` to run diff, `⌘K` to load sample, `Esc` to close settings |

---

## The Changelog Engine (Free by Default)

Most tools call an LLM for this. APIWatch uses a **rule-based engine** that works with zero API credits, zero latency, and zero cost.

```js
// Breaking change classification
const BREAKING_PAIRS = new Set([
  'number:string', 'string:number',   // Type coercions
  'object:array',  'array:object',    // Structure changes
  'number:null',   'string:null',     // Nullification
]);

function isBreaking(diff) {
  if (diff.type === 'removed') return true;
  if (diff.type === 'type_changed')
    return BREAKING_PAIRS.has(`${diff.oldType}:${diff.newType}`);
  return false;
}
```

The engine detects patterns and writes **specific migration advice**:

```
⚠️ TYPE BREAK user.id — integer → string (update all parseInt() calls)
⚠️ REMOVED user.role — remove all references to this field
✅ ADDED user.tier (string) = "enterprise"
🔄 CHANGED subscription.plan — "pro" → "enterprise"
```

Claude API is available as an **optional upgrade** for more natural prose. If the API call fails, it falls back to the rule-based engine automatically.

---

## Getting Started

### Prerequisites

- Node.js 18+ — [download](https://nodejs.org)
- npm (bundled with Node)

### Run Locally

```bash
# Clone the repo
git clone https://github.com/yourusername/apiwatch.git
cd apiwatch

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the app is live.

### Quick Test

Click **Load Sample** in the header to instantly load a real-world diff scenario showing type breaks, added fields, and value changes.

---

## AI Changelog Setup (Optional)

The rule-based changelog works without any API key. If you want Claude-powered output:

1. Get a key at [console.anthropic.com](https://console.anthropic.com) (free tier available)
2. Click **⚙ Settings** in the top right of the app
3. Paste your `sk-ant-…` key — it stays in your browser session only
4. Run a diff → go to **Changelog** tab → switch to **AI Enhanced** → Generate

> Your key is sent directly from your browser to the Anthropic API. It is never stored on any server.

---

## Deploy to Vercel

```bash
# Install Vercel CLI (one time)
npm install -g vercel

# Login
vercel login

# Deploy to preview URL
vercel

# Deploy to production
vercel --prod
```

Your app will be live at `https://your-project.vercel.app` in under a minute. Vercel auto-detects Vite — no config needed.

**To pre-fill the AI key for all users**, add it as an environment variable in your Vercel dashboard:

```
Settings → Environment Variables → VITE_ANTHROPIC_API_KEY = sk-ant-...
```

---

## Project Structure

```
apiwatch/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx                        # Root layout, keyboard shortcuts, settings drawer
    ├── components/
    │   ├── JsonInput.jsx              # Textarea with focus glow, live validation, size indicator
    │   ├── SummaryBar.jsx             # Breaking change banner + stat cards
    │   ├── DiffResults.jsx            # Color-coded diff rows with left accent bars
    │   ├── AIChangelog.jsx            # Mode toggle: rule-based ↔ Claude API
    │   └── HistoryPanel.jsx           # localStorage comparison history
    └── utils/
        ├── diffEngine.js              # Recursive JSON diff — ~80 lines, zero deps
        ├── changelogGenerator.js      # Rule-based breaking change engine
        └── shareExport.js             # URL encoding, JSON/MD export, history CRUD
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18 + Vite 5 | Fast dev server, instant HMR |
| Styling | Inline styles only | Zero build-time CSS, no framework overhead |
| Diff engine | Vanilla JS (recursive) | No dependency, fully controllable |
| AI (optional) | Claude Sonnet 4 | Best JSON/code comprehension |
| State | useState + useReducer | No Redux needed at this scale |
| Persistence | localStorage | No backend, no database |
| URL sharing | btoa + URL hash | Stateless, no server required |
| Hosting | Vercel free tier | Instant deploy, zero config |

**Total runtime dependencies: 2** (react, react-dom)

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘ Enter` | Run diff analysis |
| `⌘ K` | Load sample data |
| `Esc` | Close settings drawer |

---

## Scripts

```bash
npm run dev       # Dev server → http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

---

## Roadmap

- [ ] Contract validator — paste an expected schema, validate any response against it
- [ ] Live URL fetch — hit a public endpoint directly, no paste needed
- [ ] Array key-based diffing — match array items by a specified key instead of index
- [ ] VS Code extension
- [ ] Dark / light mode toggle

---

## Contributing

Contributions are welcome. Please open an issue before submitting a PR for significant changes.

```bash
# Fork → clone → branch
git checkout -b feature/your-feature

# Make changes, then
git commit -m "feat: describe your change"
git push origin feature/your-feature

# Open a PR
```

---

## License

MIT — use it, fork it, ship it.

---

<div align="center">

Built with React + Vite · Deployed free on Vercel · $0/month

[**⇄ Try APIWatch Live**](https://apiwatch-v.vercel.app/)

</div>
