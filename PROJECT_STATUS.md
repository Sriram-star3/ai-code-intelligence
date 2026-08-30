# AI Code Intelligence — Project Status

## What This Project Is
An AI-powered tool that parses codebases, generates documentation, detects
documentation drift, and (soon) visualizes architecture. Built for the
Developer AI Track hackathon problem statement: bridging the gap between
code and comprehension.

## Tech Stack
- **Backend:** Python + FastAPI (`/backend`)
- **Frontend:** React + Vite + Tailwind (`/frontend`)
- **Code Parsing:** Tree-sitter (`tree-sitter-language-pack`)
- **Semantic Search:** ChromaDB (vector embeddings)
- **Drift Tracking:** SQLite
- **AI Provider:** Google Gemini API (`gemini-3.6-flash`), swappable via `.env`

## AI Provider Architecture
All AI calls go through `backend/claude_client.py`, which exposes a single
`client` object with a `.messages.create(...)` interface (mimicking the
Anthropic SDK shape). This is controlled by `.env`:
AI_PROVIDER=gemini # options: "mock" | "claude" | "gemini"


- `mock` → `mock_claude.py` (free, fake responses, for offline dev)
- `claude` → real Anthropic API (`ANTHROPIC_API_KEY` required)
- `gemini` → real Gemini API via `gemini_client.py` (`GEMINI_API_KEY` required, currently active)

**Important:** any new feature should call AI through this same `client`
object, not a new provider-specific import — keeps everything swappable.

## Phase Status

| Phase | Description | Status |
|---|---|---|
| 0 | Project scaffold, FastAPI + React setup | ✅ Done |
| 1 | Tree-sitter repo ingestion → `code_map.json` | ✅ Done |
| 2 | `/summarize` endpoint — function explanation | ✅ Done (real AI) |
| 3 | Dependency graph + Chroma semantic search (`/related`) | ✅ Done |
| 4 | Drift detection (AST hashing) + auto doc-gen (`/docs-check`) | ✅ Done |
| 5 | Mermaid.js architecture diagrams | ⬜ Not started — NEXT UP |

## Key Files (`/backend`)

| File | Purpose |
|---|---|
| `main.py` | FastAPI app — all API endpoints |
| `parser.py` | Tree-sitter parsing: functions, classes, imports, dependency graph, source extraction, hashing |
| `vector_store.py` | Chroma setup — indexing + semantic search |
| `drift_tracker.py` | SQLite drift detection (new/changed function tracking) |
| `claude_client.py` | AI provider switch (mock/claude/gemini) |
| `gemini_client.py` | Gemini API wrapper (Anthropic-shaped interface) |
| `mock_claude.py` | Fake AI responses for free/offline dev |
| `code_map.json` | Generated — full parsed repo structure (gitignored) |
| `dependency_graph.json` | Generated — file-to-file import graph (gitignored) |
| `chroma_db/` | Generated — vector DB storage (gitignored) |
| `drift.db` | Generated — SQLite drift tracking (gitignored) |

## API Endpoints (all live in `main.py`)

- `GET /health` — sanity check
- `POST /summarize` — `{file_path, function_name}` → AI explanation of a function
- `POST /index` — re-parses repo, re-indexes into Chroma
- `POST /related` — `{file_path, function_name}` → semantically similar functions elsewhere in repo
- `POST /docs-check` — scans repo, flags new/drifted functions, auto-generates docstrings

## Frontend (`/frontend/src/App.jsx`)
Single-page form: enter file path + function name → calls `/summarize` →
displays source code + AI summary. Styled with Tailwind. Not yet wired to
`/related` or `/docs-check` (only `/summarize` currently has a UI).

## What's Next — Phase 5
Build Mermaid.js diagrams from `dependency_graph.json` to visualize
module-level architecture (which files depend on which). Should render in
the frontend, likely as a new tab/section alongside the existing summarizer.

## Known Setup Notes
- Windows/PowerShell environment — venv activation is `.venv\Scripts\activate`
- Gemini free tier: use `gemini-3.6-flash` (older model names like
  `gemini-2.0-flash` / `gemini-2.5-flash` are deprecated for new users)
- `.gitignore` excludes: `.env`, `__pycache__/`, `.venv/`, `node_modules/`,
  `code_map.json`, `dependency_graph.json`, `chroma_db/`, `drift.db`