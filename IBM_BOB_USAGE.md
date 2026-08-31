# How IBM Bob Was Used in This Project

## Overview

IBM Bob served as the primary development assistant throughout the entire lifecycle of
AI Code Intelligence — from initial architecture planning to production deployment debugging.
Rather than acting as a simple code generator, Bob functioned as a pair programmer: reading
existing files before suggesting changes, tracking task progress across a structured to-do
list, and making minimal, targeted edits that respected the existing code style and conventions.

> Every file Bob touched was read first, every change was grounded in the actual codebase,
> and every terminal command was run and verified before being marked complete.

---

## Key Development Activities

### 1. Frontend UI Design & Implementation

Bob designed and built the entire React + Tailwind frontend, including:

- Dark gradient header with a provider badge
- Underline-style tab navigation (`Summarize` / `Architecture Diagram`)
- Polished summarizer card with focus rings, uppercase labels, and a left-accent AI summary callout
- File upload interface with a dashed drop zone and an auto-populated function dropdown

All styling decisions matched the existing Tailwind conventions — Bob read the existing
`frontend/src/App.jsx` before writing a single line, and used `apply_diff` for surgical edits
rather than rewriting the whole file.

---

### 2. Mermaid.js Architecture Diagram

Bob implemented the Architecture Diagram tab end-to-end:

- Installed the `mermaid` npm package
- Created `frontend/src/DiagramView.jsx` with correct async `mermaid.render()` usage,
  keeping the ref DOM node always mounted to prevent rendering into a detached node
- Wired it to the backend's `GET /diagram` endpoint
- Fixed a JSX parse error caused by curly quotes (`"…"`) inside a string expression

---

### 3. Full-Stack Integration & Single-Command Startup

Bob connected frontend and backend so the project runs from one command:

- Added a **Vite dev proxy** (`vite.config.js`) forwarding all API routes to `localhost:8000`
- Replaced all hardcoded `http://localhost:8000` URLs with relative paths (`/summarize`, `/diagram`)
- Configured **FastAPI to serve the built React app** as static files using `StaticFiles`
  and a catch-all SPA fallback route
- Wrote `start.ps1` — a PowerShell script that builds the frontend and starts the backend
  in a single command: `.\start.ps1`

---

### 4. Railway Deployment — Iterative Debugging

Bob guided the entire Railway deployment across multiple failure cycles, reading each error
log precisely before making a fix:

| Error | Fix Applied |
|---|---|
| Railpack auto-detection ignoring `nixpacks.toml` | Switched to `railway.toml` with `builder = "dockerfile"` |
| Nix `cffi` package compilation failure | Rewrote as a `Dockerfile` using `python:3.12-slim` |
| Over-pinned `requirements.txt` with Python 3.14-only packages (e.g. `numpy==2.5.1`) | Replaced with a minimal 10-package direct-dependencies file |
| Module-level Gemini API crash at startup (`ValueError: No API key`) | Moved `genai.Client()` instantiation inside the class constructor; added startup debug logging |
| Wrong working directory — `test_target.py` not found | Changed `WORKDIR` to `/app/backend` in Dockerfile |
| `python-multipart` missing for file upload | Added to `requirements.txt` |

---

### 5. File Upload Features

**Summarize any file:**
Bob extended the summarizer to accept any `.py` file uploaded from the user's computer:
- `FileReader` in the browser reads the file content
- A regex-based extractor populates a function dropdown automatically
- The `file_content` field is sent in the POST body; the backend writes it to a temp file
  for Tree-sitter parsing, then cleans up

**Architecture diagram for any codebase:**
Bob added `POST /diagram/upload` to the backend:
- Accepts a `.zip` file via `python-multipart` / FastAPI `UploadFile`
- Extracts to a temp directory using Python's stdlib `zipfile`
- Auto-descends into single top-level folders (handles standard GitHub zip layout)
- Runs the existing `walk_repo → resolve_local_imports → build_mermaid_graph` pipeline
- Cleans up the temp directory in a `finally` block
- Returns the Mermaid syntax + file count to the frontend

---

### 6. Performance Optimisation

Bob identified slow Gemini responses and:
- Queried the available models list directly against the live API key using `execute_command`
- Tested candidate models with a real API call locally before committing
- Settled on `gemini-3.5-flash-lite` (verified working) and reduced `max_tokens` from 300 → 200
- Tightened the prompt to request a 3-4 sentence summary instead of a step-by-step breakdown

---

## Bob Features Used

| Feature | How It Was Used |
|---|---|
| **Codebase investigation** | `read_file`, `grep`, `FindSymbol` — Bob read every relevant file before editing, never speculating about unseen code |
| **Surgical edits** | `apply_diff` and `search_and_replace` for targeted changes — minimising unintended side effects |
| **Terminal execution** | `execute_command` to run builds, installs, and live API tests — output read before declaring tasks done |
| **Structured task tracking** | `update_todo_list` for every multi-step task — progress always visible, nothing skipped |
| **Plan before acting** | Bob proposed a plan with rationale before every significant change and waited for approval |
| **Artefact generation** | `create_html_artifact` for polished submission write-ups (problem statement, this document) |

---

## Summary

Bob was not used to generate boilerplate — it was used to build a real, deployed, working
product. Every interaction followed the same discipline: investigate first, plan, get approval,
make the minimal change, verify it works. The result is a codebase where every line added
traces directly to a user requirement, and a deployment that went from zero to live on Railway
through a series of precisely diagnosed and fixed issues.
