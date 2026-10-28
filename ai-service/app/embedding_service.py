import numpy as np
from typing import List
from app.config import settings

_model = None

def get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print(f"🔄 Loading Sentence-BERT model: {settings.MODEL_NAME}...")
            _model = SentenceTransformer(settings.MODEL_NAME)
            print("✅ SBERT model loaded successfully!")
        except Exception as e:
            print(f"⚠️ Could not load sentence-transformers model ({e}). Using fallback vectorizer.")
            _model = "fallback"
    return _model

def encode_text(text: str) -> np.ndarray:
    model = get_model()
    if model != "fallback":
        vec = model.encode(text, convert_to_numpy=True)
        return vec / (np.linalg.norm(vec) + 1e-9)
    else:
        # Simple word frequency vector representation for offline fallback
        words = text.lower().split()
        vocab = sorted(list(set(words)))
        vec = np.array([words.count(w) for w in vocab], dtype=float)
        norm = np.linalg.norm(vec)
        return vec / (norm + 1e-9) if norm > 0 else vec

def encode_batch(texts: List[str]) -> List[np.ndarray]:
    model = get_model()
    if model != "fallback":
        vecs = model.encode(texts, convert_to_numpy=True)
        norms = np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-9
        return vecs / norms
    else:
        return [encode_text(t) for t in texts]

def compute_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    if vec1.shape != vec2.shape:
        # Pad vectors if lengths differ in fallback mode
        max_len = max(len(vec1), len(vec2))
        v1 = np.pad(vec1, (0, max_len - len(vec1)))
        v2 = np.pad(vec2, (0, max_len - len(vec2)))
    else:
        v1, v2 = vec1, vec2

    sim = float(np.dot(v1, v2))
    return max(0.0, min(1.0, sim))
