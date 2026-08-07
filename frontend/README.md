# 21ORANGE Frontend

This is the React client interface for the **21ORANGE** URL shortener microservices project. It is styled with raw Brutalist web design principles and communicates directly with all 3 backends via HTTP REST calls.

## Port
Runs on port `3000` locally.

## Setup & Running
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Key Views
- **Shorten Form**: Submit a long URL to generate a short link.
- **URL Card**: Display details of the shortened URL.
  - **Copy Link**: Copy short URL to clipboard.
  - **Show/Hide QR Code**: Toggle QR code image generation from `qr-service`.
  - **Refresh Stats**: Retrieve dynamic redirect clicks and last click timestamps from `stats-service`.
