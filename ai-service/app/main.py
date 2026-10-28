import sys
import os

# Ensure parent directory is in sys.path so 'from app...' imports work regardless of entrypoint
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import MatchRequest, MatchResponse
from app.embedding_service import encode_text
from app.matching_service import rank_freelancers

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "service": settings.PROJECT_NAME,
        "model": settings.MODEL_NAME,
    }

@app.post("/embed")
def generate_embedding(data: dict):
    text = data.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text parameter is required")
    vec = encode_text(text)
    return {
        "model": settings.MODEL_NAME,
        "dimension": len(vec),
        "embedding": vec.tolist(),
    }

@app.post("/match", response_model=MatchResponse)
def match_freelancers(request: MatchRequest):
    try:
        recommendations = rank_freelancers(request.gig, request.freelancers)
        return MatchResponse(
            modelUsed=settings.MODEL_NAME,
            totalEvaluated=len(request.freelancers),
            recommendations=recommendations,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
