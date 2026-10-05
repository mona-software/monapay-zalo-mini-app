# MONA Pay Zalo Mini App

A Zalo Mini App (ZMP + React) with a small Node.js backend proxy that lets a merchant create VietQR payment codes and view recent MONA Pay transactions from inside Zalo.

The app has three screens:

1. **Create QR**: enter an order ID, amount and description; the backend creates the QR and the app renders the VietQR code.
2. **Transactions**: loads the 50 most recent transactions of a virtual account (VA).
3. **Settings**: stores non-sensitive merchant/VA settings on the device and checks the proxy status.

Username, password, Bearer token and `X-Client-Secret` never enter the Mini App bundle. `backend/server.js` is a dependency-free Node.js 18+ proxy that logs in, caches the token and accepts requests only from the configured origin.

## Requirements

- Node.js 18 or later.
- A Zalo Developers account with a Mini App created in the Zalo Developers portal (App ID, permissions and review are handled there).
- A MONA Pay account with a client secret for creating QR codes.

## Install

```bash
git clone https://github.com/mona-software/monapay-zalo-mini-app.git
cd monapay-zalo-mini-app
npm install
cp backend/.env.example backend/.env
```

## Quick start

`backend/server.js` reads environment variables directly; Node does not load `.env` on its own. Export the variables (or use your platform's secret manager), then start the proxy:

```bash
export MONAPAY_USERNAME='...'
export MONAPAY_PASSWORD='...'
export MONAPAY_CLIENT_SECRET='...'
export ALLOWED_ORIGIN='http://localhost:3000'
npm run backend
```

In another terminal, start the Mini App:

```bash
npm start
```

Open **Settings** in the app, enter the merchant settings (owner number, owner type, merchant ID, terminal ID, VA prefix, beneficiary name and the VA number to view) and check that the proxy reports ready.

## Configuration

### Backend proxy

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `8787` | Port the proxy listens on |
| `MONAPAY_BASE_URL` | `https://api.monapay.vn` | MONA Pay API base URL |
| `MONAPAY_USERNAME`, `MONAPAY_PASSWORD` | none | MONA Pay login, required |
| `MONAPAY_CLIENT_SECRET` | none | Required for creating QR codes |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | The only origin allowed by CORS |

Endpoints:

| Method and path | Purpose |
| --- | --- |
| `GET /health` | Reports whether the credentials are set, and the base URL |
| `POST /api/qr` | Creates a dynamic VietQR |
| `GET /api/transactions?virtual_account_number=...&page=1&limit=50` | Lists transactions (limit up to 100) |

### Mini App

The app calls `http://localhost:8787` by default. For a real build, set the proxy URL before the app mounts:

```html
<script>window.MONAPAY_PROXY_URL = 'https://proxy.example.com';</script>
```

## Deploy

1. Deploy the backend proxy over HTTPS with the variables above. Set `ALLOWED_ORIGIN` to the exact origin, never `*`.
2. Put the proxy's HTTPS URL into the Mini App bootstrap.
3. Run `npm run build` and test in the Zalo Mini App Simulator and on a device.
4. In Zalo Developers, declare the domain and permissions, submit the version for review, then publish (`npm run deploy` uses `zmp deploy`).

CORS is not authentication. Before going public, put the proxy behind your infrastructure's authentication and rate limiting, or add a check of the Zalo access token. Keep credentials in a secret manager and never commit `.env`. Do not create real QR codes with a production account during smoke tests.

Documentation: https://monapay.vn/docs

**MONA Pay is part of MONA Cloud by The MONA Group.**
