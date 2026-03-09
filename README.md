# APIWatch

> Paste two JSON responses. Get an instant visual diff, AI-written changelog, and shareable link. Free. No login. No backend.

---

## Local Setup (5 minutes)

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- npm (comes with Node)

### Steps

```bash
# 1. Unzip the project folder
unzip apiwatch.zip
cd apiwatch

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
apiwatch/
├── index.html                     # Entry point
├── vite.config.js                 # Vite config
├── package.json
└── src/
    ├── main.jsx                   # React root
    ├── App.jsx                    # Main app component
    ├── components/
    │   ├── JsonInput.jsx          # Dual JSON textarea with validation
    │   ├── DiffResults.jsx        # Color-coded diff rows + filter bar
    │   ├── SummaryBar.jsx         # Added/Removed/Changed/Type stats
    │   ├── AIChangelog.jsx        # Claude API integration
    │   └── HistoryPanel.jsx       # localStorage history
    └── utils/
        ├── diffEngine.js          # Recursive JSON diff algorithm
        └── shareExport.js         # URL sharing, export, history
```

---

## Features

| Feature | How to use |
|---|---|
| **JSON Diff** | Paste JSON in both panels → click Run Diff Analysis |
| **AI Changelog** | Enter Anthropic API key in header → go to AI Changelog tab |
| **Share Link** | Click ⤴ SHARE LINK — encodes both payloads in URL (no backend) |
| **Export JSON** | Click ↓ EXPORT JSON — downloads structured diff report |
| **History** | Auto-saved on every diff run — click History tab to reload |
| **Sample Data** | Click Load Sample in header for a quick demo |

---

## AI Changelog Setup

1. Get a free API key at [console.anthropic.com](https://console.anthropic.com)
2. Paste it in the `sk-ant-…` field in the top bar
3. Run a diff, go to the **AI Changelog** tab, click **Generate**

> The key is never sent anywhere except directly to the Anthropic API from your browser.

---

## Deploy to Vercel (free)

```bash
# Install Vercel CLI
npm install -g vercel

# Build + deploy
npm run build
vercel --prod
```

Add `VITE_ANTHROPIC_API_KEY` as an environment variable in Vercel dashboard if you want to pre-fill the key.

---

## Tech Stack

- **React 18** + **Vite 5** — framework and build tool
- **No CSS framework** — pure inline styles, zero dependencies
- **Claude API** — `claude-sonnet-4-20250514` for changelog generation
- **localStorage** — history storage, no database
- **URL hash encoding** — share diffs without a backend
- **Vercel** — free hosting

---

## Scripts

```bash
npm run dev      # Start dev server at localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```
