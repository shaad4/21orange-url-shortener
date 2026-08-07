# Shortener Service

This microservice owns the mapping between short codes and long target URLs. It performs redirection and notifies `stats-service` of redirection events.

## Port
Runs on port `8001` locally.

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
   python manage.py runserver 8001
   ```

## Endpoints
- `GET /health/` — Health check endpoint. Returns `{"status": "ok"}`.
- `POST /api/shorten/` — Shortens a URL.
  - Body: `{"long_url": "https://google.com"}`
  - Returns: `{"short_code": "abc123", "long_url": "...", "short_url": "http://localhost:8001/r/abc123/"}`
- `GET /api/urls/<code>/` — Retrieve the long URL mapping for a given short code.
  - Returns: `{"short_code": "abc123", "long_url": "..."}`
- `GET /r/<code>/` — Redirects to the original URL and triggers a click log to `stats-service`.
