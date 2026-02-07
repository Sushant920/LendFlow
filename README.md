# LendFlow – Loan Origination Platform

Smarter lending, faster growth. Streamline loan origination with AI-powered risk assessment, automated document analysis, and instant eligibility decisions.

## Tech Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express, Node.js
- **Database**: PostgreSQL, Supabase
- **Auth**: Supabase Auth

## Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:8080](http://localhost:8080).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

## Project Structure

- `src/` – React frontend
- `server/` – Express API (document processing, scoring, offers)
- `api/` – Edge/Vercel API handlers
- `supabase/` – Database migrations & config
