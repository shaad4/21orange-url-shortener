# QR Service

This microservice generates high-quality QR codes for active short URLs. It is completely stateless (has no database tables) and verifies the existence of short codes by dynamically calling the `shortener-service`.

## Port
Runs on port `8003` locally.

## Setup & Running
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the development server:
   ```bash
   python manage.py runserver 8003
   ```
   *(Note: No database migration is necessary since this service holds no state.)*

## Endpoints
- `GET /health/` — Health check endpoint. Returns `{"status": "ok"}`.
- `GET /api/qr/<code>/` — Generates a PNG QR code for the short code.
  - Returns: A raw PNG image of the QR code pointing to `http://localhost:8001/r/<code>/`.
  - Returns `404` if the short code does not exist.
