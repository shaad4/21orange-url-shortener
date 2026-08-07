# Stats Service

This microservice logs click/redirect events and returns aggregate statistics for short codes. It acts purely as a consumer/logger, receiving notifications but never triggering cross-service calls itself.

## Port
Runs on port `8002` locally.

## Setup & Running
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run database migrations:
   ```bash
   python manage.py migrate
   ```
3. Run the development server:
   ```bash
   python manage.py runserver 8002
   ```

## Endpoints
- `GET /health/` — Health check endpoint. Returns `{"status": "ok"}`.
- `POST /api/clicks/` — Log a click for a short code.
  - Body: `{"short_code": "abc123"}`
  - Returns: `{"status": "success", "message": "..."}`
- `GET /api/stats/<code>/` — Retrieve the aggregate click count and latest click time for a code.
  - Returns: `{"short_code": "abc123", "click_count": 5, "last_clicked": "2026-08-06T14:45:00Z"}` (or `null` if never clicked)
