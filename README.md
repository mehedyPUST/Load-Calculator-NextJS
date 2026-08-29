# WZPDCL Bottail Load Calculator

33/11 kV substation load calculator for **WZPDCL Bottail-Kushtia**.

## Features

- Feeder MW calculation (formula unchanged)
- **Calculate Only** · **Calculate & Save** · **Copy Total**
- Saved history (left panel) · full detail view (right panel)
- Delete with confirmation modal

## Formula (unchanged)

```
MW = (√3 × V_kV × 0.95 × I_A) / 1000
```

## Stack

- **Next.js 16** (App Router) — UI + API routes
- **MongoDB Atlas** via Mongoose
- Tailwind CSS

> API lives under `/api/*` so **frontend and backend deploy together on Vercel**.

## Local development

```bash
cp .env.example .env.local
# set MONGODB_URI

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy on Vercel

1. Push repo to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. **Environment Variables** → add:
   - `MONGODB_URI` = your Atlas connection string
4. Deploy

Atlas checklist:

- Database user with password
- Network Access → allow `0.0.0.0/0` (or Vercel IPs)
- Connection string uses the `load-calculator` DB name (or any name you prefer)

Optional separate Express server remains in `/backend` for local/legacy use; production uses Next.js API routes.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health + DB status |
| GET | `/api/calculations` | List recent |
| POST | `/api/calculations` | Save |
| GET | `/api/calculations/:id` | One record |
| DELETE | `/api/calculations/:id` | Delete |

## License

© SBA-Bottail, WZPDCL
