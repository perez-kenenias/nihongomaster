# NihongoMaster

A full-stack application for learning Japanese through spaced-repetition flashcards (FSRS), real-life conversation scenarios with AI, and pronunciation practice.

## Technologies

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | 0.115.6 | REST API framework |
| Uvicorn | 0.34.0 | ASGI server |
| SQLAlchemy | 2.0.36 | ORM / database access |
| Pydantic | 2.10.3 | Data validation & serialization |
| HTTPX | 0.28.1 | Async HTTP client (calls Ollama) |
| SQLite | — | Embedded database |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime |
| Next.js | 15.1.0 | React framework (App Router) |
| React | 19.0.0 | UI library |
| TypeScript | 5.7.2 | Type safety |
| Zustand | 5.0.2 | Lightweight state management |
| Tailwind CSS | 3.4.17 | Utility-first CSS framework |
| Lucide React | 0.468.0 | Icon library |
| PostCSS + Autoprefixer | — | CSS processing |

### AI / Speech
| Technology | Purpose |
|---|---|
| Ollama | Local LLM server (elyza-jp-8b model) |
| Whisper.cpp | Speech-to-text for pronunciation |
| Web Speech API | Browser-based speech synthesis & recognition |

### Infrastructure
| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Container orchestration |
| PowerShell (test script) | API testing |

---

## Prerequisites

### Option A — Run locally without Docker

1. **Python 3.11+** installed and on your PATH
2. **Node.js 20+** and **npm** installed
3. **Ollama** installed and running ([ollama.com](https://ollama.com))

### Option B — Run with Docker Compose

1. **Docker Desktop** (or Docker Engine + Docker Compose) installed
2. No need to install Python, Node, or Ollama separately

---

## Quick Start (Docker Compose)

```bash
# 1. Clone and enter the project
cd nihongomaster

# 2. Start all services
docker compose up -d

# 3. Pull the Japanese LLM model (needed for chat scenarios)
docker exec nihongomaster-ollama ollama pull elyza-jp-8b

# 4. Open the app
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Ollama**: http://localhost:11434
- **Whisper** (speech-to-text, optional): http://localhost:9000

### Stopping

```bash
docker compose down
```

To also delete volumes (database, ollama models):

```bash
docker compose down -v
```

---

## Manual Setup (without Docker)

### 1. Environment variables

Copy the example file and adjust if needed:

```bash
cp .env.example .env
```

`.env` contents:

```
OLLAMA_HOST=http://localhost:11434
DATABASE_URL=sqlite:///data/nihongomaster.db
```

### 2. Install & run Ollama

```bash
# Install Ollama from https://ollama.com, then pull the model:
ollama pull elyza-jp-8b
```

Ollama must be running at `http://localhost:11434`.

### 3. Backend

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API is now running at [http://localhost:8000](http://localhost:8000).

Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Frontend

Open a second terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The Next.js dev server proxies `/api/*` requests to the backend via the rewrite rule in `next.config.js`.

---

## Build for Production

### Backend

```bash
cd backend

# Create venv and install dependencies as shown above
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt

# Run with production settings
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

npm install
npm run build        # creates .next/ production bundle
npm start            # starts the production server on port 3000
```

The `next.config.js` sets `output: 'standalone'`, so the `.next/standalone/` folder is self-contained and can be deployed as-is.

### With Docker (production-like)

```bash
docker compose up -d --build
```

---

## Project Structure

```
nihongomaster/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile
│   ├── models/
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── db_models.py         # ORM models (Deck, Card, Conversation, Message)
│   │   └── schemas.py           # Pydantic request/response models
│   ├── routers/
│   │   ├── study.py             # Flashcards: decks, cards, SRS review
│   │   ├── curriculum.py        # Textbook lessons (Minna no Nihongo, Genki)
│   │   ├── chat.py              # AI conversation scenarios
│   │   ├── pronounce.py         # Pronunciation scoring
│   │   └── stats.py             # User statistics & dashboard
│   ├── services/
│   │   ├── srs_engine.py        # FSRS spaced-repetition algorithm
│   │   ├── ollama_client.py     # HTTP client for Ollama
│   │   ├── pronunciation_scorer.py  # Character-level scoring
│   │   └── scenario_data.py     # 8 scenario prompts + metadata
│   └── data/
│       ├── nihongomaster.db     # SQLite database (auto-created)
│       └── curriculum/
│           ├── minna_no_nihongo.json
│           ├── genki_i.json
│           └── genki_ii.json
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── Dockerfile
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       # Root layout (Navbar + metadata)
│       │   ├── globals.css      # Tailwind + custom design tokens
│       │   ├── page.tsx         # Home dashboard
│       │   ├── study/page.tsx   # Flashcard study session
│       │   ├── curriculum/page.tsx  # Textbook browser & importer
│       │   ├── scenarios/page.tsx   # AI conversation scenarios
│       │   ├── pronounce/page.tsx   # Pronunciation practice
│       │   ├── stats/page.tsx   # Learning statistics
│       │   └── settings/page.tsx    # Settings & data export
│       ├── components/
│       │   ├── Navbar.tsx
│       │   └── Flashcard.tsx    # SRS flashcard with flip animation
│       └── lib/
│           ├── api.ts           # Typed API client
│           └── store.ts         # Zustand global state
├── whisper/
│   ├── Dockerfile
│   ├── server.py                # Flask server wrapping whisper.cpp
│   └── entrypoint.sh            # Downloads model & starts server
├── docker-compose.yml
├── test_api.ps1                 # API test suite (PowerShell)
├── .env.example
├── .gitignore
└── README.md
```

---

## API Endpoints

### Study (SRS Flashcards)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/study/decks` | List all decks with card counts |
| `POST` | `/api/study/decks` | Create a new deck |
| `DELETE` | `/api/study/decks/{id}` | Delete a deck and all its cards |
| `GET` | `/api/study/decks/{id}/cards` | List cards in a deck |
| `POST` | `/api/study/decks/{id}/cards` | Add a card to a deck |
| `DELETE` | `/api/study/cards/{id}` | Delete a card |
| `POST` | `/api/study/session` | Start a study session (get due cards) |
| `POST` | `/api/study/review` | Submit a review (again/hard/good/easy) |

### Curriculum (Textbooks)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/curriculum/books` | List available textbooks |
| `GET` | `/api/curriculum/books/{id}` | Get book details with lessons |
| `GET` | `/api/curriculum/books/{id}/lessons/{id}` | Get full lesson (vocabulary + sentences) |

Available books: **Minna no Nihongo Shokyuu I**, **Genki I**, **Genki II**.

### Chat (AI Scenarios)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/chat/scenarios` | List 8 conversation scenarios |
| `GET` | `/api/chat/scenarios/{id}` | Get scenario details + system prompt |
| `POST` | `/api/chat/conversation` | Send a message in a conversation |
| `GET` | `/api/chat/conversations/{id}` | Get conversation history |

Requires Ollama with `elyza-jp-8b` model running.

### Pronunciation

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/pronounce/score` | Score pronunciation against expected text |

### Statistics

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/stats/dashboard` | Dashboard: streak, review counts, mastery per deck, 7-day history |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check (`{"status": "ok"}`) |

---

## Running Tests

```bash
# In PowerShell, from the project root:
powershell -ExecutionPolicy Bypass -File test_api.ps1
```

The test script covers all 14 endpoints. Requires the backend to be running at `http://localhost:8000`.

Example output:

```
=== NihongoMaster API Test Suite ===

  PASS  POST /api/study/decks
  PASS  POST /api/study/decks/{id}/cards
  PASS  POST /api/study/decks/{id}/cards (2)
  PASS  POST /api/study/session
  PASS  POST /api/study/review
  PASS  GET /api/stats/dashboard
  PASS  POST /api/pronounce/score
  PASS  GET /api/curriculum/books
  PASS  GET /api/curriculum/books/genki_i
  PASS  GET /api/curriculum/books/genki_i/lessons/genki1_l01
  PASS  GET /api/chat/scenarios
  PASS  GET /api/chat/scenarios/restaurant
  PASS  GET /api/health
  PASS  DELETE /api/study/decks/{id}

=== Results: 14 passed, 0 failed ===
```

---

## SRS Algorithm

NihongoMaster uses **FSRS** (Free Spaced Repetition Scheduler), a modern SRS algorithm that models memory retention with three parameters:
- **Stability** — how long the memory lasts
- **Difficulty** — intrinsic difficulty of the card
- **State** — 0=new, 1=learning, 2+=mature

The four review ratings map to different spacing:
- **Again** — reset, review again in 10 minutes
- **Hard** — small stability increase
- **Good** — normal stability increase
- **Easy** — large stability increase with bonus

Card intervals are calculated as `stability × 19/81` days.

---

## Features

- **Flashcards with FSRS** — scientifically optimized spaced repetition
- **Curriculum import** — one-click import of Genki I/II and Minna no Nihongo lessons
- **AI conversation scenarios** — 8 real-life situations (restaurant, airport, konbini, job interview, etc.) powered by Ollama
- **Pronunciation practice** — Web Speech API + phoneme-level scoring
- **Dashboard & stats** — daily streak, mastery percentage, study history chart
- **Dark theme** — Japanese-inspired dark UI with Noto Sans JP font
- **Data export** — backup all decks as JSON
- **Responsive** — works on desktop and mobile
- **Docker support** — one-command startup for all services
