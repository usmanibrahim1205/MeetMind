# MeetMind - AI Meeting Assistant

MeetMind is a complete, modern, production-quality AI Meeting Assistant web application designed for teams to transcribe audio recordings, generate structured AI summaries, log checklist action items, search history, and export professional PDF briefings.

Built with a fast **FastAPI Python backend** and a beautiful, responsive **React cardless minimalist frontend** (featuring clean typography, unified dark/light themes, and an edge-docked collapsible sidebar), MeetMind demonstrates full-stack architecture, clean coding practices, and scalable AI integrations.

---

## Technical Stack

### Backend
* **Python**
* **FastAPI** (High performance, type-safe API routing)
* **SQLAlchemy ORM**
* **SQLite** (Default local DB) / PostgreSQL compatibility
* **JWT Authentication & bcrypt cryptography** (direct native implementations)
* **ReportLab** (Professional PDF report document layout compiler)
* **Pydantic v2** (Strict data schema validation)

### AI Core & Local Pipeline
* **Local Offline faster-whisper CPU Model**: High-performance local speech-to-text transcription.
* **Voice Speaker Diarization & Clustering**: Analyzes voice frequency characteristics (MFCC features) and clusters dialog paths using Agglomerative algorithms to tag speakers ("Speaker 1", "Speaker 2").
* **Local Heuristic NLP Engine**: Extractive keyphrase summary compiler, sentiment classifier, and grammatical pronoun resolver that runs offline without any external cloud tokens.
* **Google Gemini API Fallback**: Structured analysis endpoint for cloud-scale summarization when keys are configured.

### Frontend
* **React.js** (Vite template SPA)
* **React Router Dom** (Declarative route paths and authentication guard walls)
* **Axios** (API communications client with header and 401 response interceptors)
* **Lucide React** (Consistent premium icon set)
* **Canvas Confetti** (UX micro-celebrations upon completing tasks)
* **Vanilla CSS Variables** (Unified dark/light mode toggle presets with a cardless, flowing flow)

---

## Folder Structure

```
MeetMind/
│
├── backend/
│   ├── app/
│   │   ├── api/          # Routers (auth, meetings, stats)
│   │   ├── auth/         # JWT and login middleware
│   │   ├── database/     # connection engine
│   │   ├── models/       # SQLAlchemy models (User, Meeting, Summary, etc.)
│   │   ├── schemas/      # Pydantic schemas (validations)
│   │   ├── services/     # Whisper, Gemini, and PDF utilities
│   │   ├── utils/        # audio length calculations and environment settings
│   │   └── main.py       # FastAPI Entrypoint
│   │
│   ├── uploads/          # Saved audio uploads (Git ignored)
│   ├── generated_pdfs/   # Generated PDF reports (Git ignored)
│   ├── requirements.txt  # Python packages list
│   ├── verify_backend.py # Integration test script
│   └── .env              # Backend configuration settings
│
├── frontend/
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── assets/       # Icons and logo files
│   │   ├── components/   # Sidebar, Navbar, Toast, Loader, ConfirmDialog
│   │   ├── hooks/        # React hook selectors (useToast)
│   │   ├── pages/        # LandingPage, Login, Register, Dashboard, Details, etc.
│   │   ├── services/     # Axios client configuration
│   │   ├── styles/       # Color theme presets
│   │   ├── App.jsx       # App main component
│   │   └── main.jsx      # Vite entrypoint mounting index
│   │
│   ├── index.html        # Main HTML layout wrapper
│   ├── vite.config.js    # Bundler config
│   └── package.json      # Node package list
│
└── README.md             # Documentation overview
```

---

## System Requirements
- **Python 3.9+** (Python 3.13 supported out-of-the-box)
- **Node.js 18+** & **npm**

---

## Setup & Installation

### 1. Backend Configuration

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure your environment variables. Create a `.env` file matching:
   ```env
   DATABASE_URL=sqlite:///./meetmind.db
   JWT_SECRET_KEY=supersecretjwtkeyforlocalmeetminddevelopment123!
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=120
   WHISPER_MODEL=small
   OPENAI_API_KEY=your_openai_api_key_here  # Leave empty to run Whisper fallback mock
   GEMINI_API_KEY=your_gemini_api_key_here  # Leave empty to run local NLP/Gemini fallback
   UPLOAD_DIR=uploads
   PDF_DIR=generated_pdfs
   ```
4. Verify compiling and database schemas using our validation script:
   ```bash
   python verify_backend.py
   ```
5. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   The API will be available at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

### 2. Frontend Configuration

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The frontend will start at `http://localhost:5173`.

---

## Key Features Guide

### Frictionless Sandbox Mode
If you run the app without entering API keys in `.env` (or setting personal keys in Settings), MeetMind runs in a sandbox mode:
- Uploading any file name containing keywords like `marketing` or `sales` returns a mock marketing alignment meeting.
- Filenames containing `product`, `dev`, or `roadmap` return a mock dashboard caching sync meeting.
- Any other filename returns a mock weekly operations review.
This lets you demo the full capabilities of transcription, summaries, checklists, tagging, and PDF downloads without paying for tokens.

### Interactive Checklist Tasks
Checklist items generated by the local NLP model on the details page can be clicked to toggle completion. When all tasks are completed, the interface fires a canvas-confetti celebration.

### Collapsible Docked Sidebar
Features a docked left navigation sidebar (`100vh` full vertical height) which can be collapsed/expanded on desktop screens to maximize focus space. State parameters are persisted across visits in browser storage.

### Off-White Light Mode Theme
The default application theme is set to **Light Mode** with a soft, non-glare off-white background (`#F4F5F8`) and pure white text canvases (`#FFFFFF`) to prevent screen glare.

### Account Deletion (Danger Zone)
Users can delete their profiles permanently in Settings. The server handles this by sweeping disk directories and deleting all uploaded audios and generated PDFs linked to the account.

---

## Future Roadmap Extensions
- **Zoom & Google Meet Integration**: Direct webhooks to pull recorded recordings.
- **RAG Semantic Search**: Index transcription segments into a Vector Database to support asking an AI bot queries across past meetings.
- **Real-time Recording**: Capture speaker audio inputs directly from the browser window.

---

## License
Distributed under the MIT License. See `LICENSE` for more information.
