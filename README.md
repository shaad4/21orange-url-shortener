# 21ORANGE

**21ORANGE** is a minimal microservices URL shortener, QR code generator, and click analytics application. It is designed as a learning project for beginners getting familiar with Docker and Kubernetes concepts (application architecture only for this phase; no containers/manifests are present yet).

The project is split into 3 independent Python/Django REST services and 1 React frontend.

## Architecture & Services Overview

| Service | Port | Responsibility | Start Command |
| :--- | :--- | :--- | :--- |
| [**`shortener-service`**](file:///home/shaad/Projects/21orange/shortener-service) | `8001` | Manages code generation, resolution, redirects, and logs clicks to `stats-service`. Uses SQLite. | `cd shortener-service && python manage.py runserver 8001` |
| [**`stats-service`**](file:///home/shaad/Projects/21orange/stats-service) | `8002` | Tracks click/redirect events and reports aggregate clicks per code. Uses SQLite. | `cd stats-service && python manage.py runserver 8002` |
| [**`qr-service`**](file:///home/shaad/Projects/21orange/qr-service) | `8003` | Generates a PNG QR code for short URLs. Stateless (no database). | `cd qr-service && python manage.py runserver 8003` |
| [**`frontend`**](file:///home/shaad/Projects/21orange/frontend) | `3000` | React web application built with Vite and styled in a raw Brutalist aesthetic. | `cd frontend && npm run dev` |

---

## Getting Started (Run Concurrently in 4 Terminals)

Ensure you have Python 3.10+ and Node.js 18+ installed on your local machine.

### Terminal 1: Shortener Service
```bash
cd shortener-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

### Terminal 2: Stats Service
```bash
cd stats-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8002
```

### Terminal 3: QR Service
```bash
cd qr-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 8003
```

### Terminal 4: React Frontend
```bash
cd frontend
npm install
npm run dev
```

Open your browser at [http://localhost:3000](http://localhost:3000) to interact with the project!
