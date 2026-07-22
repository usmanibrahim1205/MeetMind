from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.database.connection import engine, Base
import app.models # Triggers model registration
from app.api import auth, meetings, stats

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("meetmind.main")

# Auto-create tables on start
logger.info("Initializing SQLite database tables...")
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MeetMind API",
    description="Backend API services for MeetMind AI Meeting Assistant",
    version="1.0.0"
)

# CORS Configuration
# Allow frontend (typically localhost:5173) to communicate with API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler for general errors to keep API output clean
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception occurred: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check logs."}
    )

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to MeetMind AI Meeting Assistant API!"}

# Register Routers
app.include_router(auth.router, prefix="/api")
app.include_router(meetings.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
