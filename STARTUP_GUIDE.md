# MyFiverr Platform — Complete System Startup Guide

Guide for starting the **React Frontend**, **Node/Express Backend**, and **Python SBERT AI Microservice**.

---

## 1. Node.js & Express Backend

```bash
cd backend
npm install
npm run dev
```

- **Server URL**: `http://localhost:8800`
- **MongoDB Connection**: Uses `MONGO_URI` in `backend/.env` (`mongodb://localhost:27017/freelancePlatform`).
- **Database Utilities**:
  - Run Schema Migration: `node scripts/migrate_database.js`
  - Seed Test Data: `node scripts/seed_database.js`
  - Seed Question Bank: `node scripts/seed_questions.js`

---

## 2. Python FastAPI SBERT Microservice

```bash
cd ai-service
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python app/main.py
```

- **Service URL**: `http://localhost:8000`
- **SBERT Model**: `sentence-transformers/all-MiniLM-L6-v2` (auto-downloads on first startup).
- **Test Endpoint**: `python test_matching.py`

---

## 3. React Frontend

```bash
cd frontend
npm install
npm run dev
```

- **Application URL**: `http://localhost:5173`
- Vite proxies `/api/*` HTTP requests to Node backend port `8800`.

---

## 4. Key API Endpoints Reference

| Service | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Node Backend** | `/api/recommendations/freelancers` | `POST` | SBERT semantic freelancer-to-gig recommendations |
| **Node Backend** | `/api/users/freelancers/:id/performance` | `GET` | Performance score index & weights breakdown |
| **Node Backend** | `/api/reviews` | `POST` | Order review submission with security checks |
| **Node Backend** | `/api/evaluations/start` | `POST` | Start freelancer skill verification test |
| **Node Backend** | `/api/evaluations/submit` | `POST` | Grade skill evaluation test server-side |
| **Python SBERT** | `/match` | `POST` | Calculate dense vector embeddings & cosine similarity ranking |
