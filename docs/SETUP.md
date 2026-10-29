# FixTrack Setup & Installation Guide

## 1. Prerequisites
- **Python**: 3.10+ (tested on Python 3.11)
- **Node.js**: v18+ (tested on Node v24)
- **MongoDB**: Standalone or replica set (optional: FixTrack includes an automated mock database fallback for immediate local testing if MongoDB is not running locally).

## 2. Backend Setup

```bash
cd backend

# Create & activate a virtual environment (optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env if you wish to adjust secrets, ports, or MongoDB URI

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- Base API: `http://localhost:8000/api/v1`
- Interactive Swagger docs: `http://localhost:8000/docs`
- Redoc documentation: `http://localhost:8000/redoc`

## 3. Frontend Setup

```bash
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```

The web application will be accessible at:
- Web App: `http://localhost:5173`

## 4. Running Backend Tests

```bash
cd backend
pytest tests/ -v
```

## 5. Running with Docker Compose

If Docker is available:
```bash
docker-compose up --build
```
This boots up MongoDB, the FastAPI backend, and the React frontend in isolated containers.
