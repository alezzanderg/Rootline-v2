# Rootline-v2

Marketing site and admin dashboard for **Rootline Landscaping** — lawn care and property maintenance in Hudson County, NJ and North Jersey.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript, Tailwind CSS
- Prisma (dashboard / productos)

## Scripts

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run favicons     # regenerate public/favicons from public/images/logo.png
npm run seed         # prisma seed (requires DATABASE_URL)
```

## Environment

Copy `.env.example` to `.env.local` and set `DATABASE_URL` and other variables. Never commit `.env` files.

## Deploy

Configured for [Vercel](https://vercel.com).

Required in **Vercel → Project → Settings → Environment Variables** (Production):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon **pooled** connection string (`-pooler` host). Same DB you use locally if you want the same admin users. |
| `NEXT_PUBLIC_SITE_URL` | `https://www.rootlinenj.com` |

After adding or changing env vars, **redeploy** the project.

Admin login: `/auth` — if sign-in fails with a database message, `DATABASE_URL` is missing or wrong on Vercel. Create production users with `npm run reset-admin-password` using your local `.env` (must point at the production Neon DB).
