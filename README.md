# Group Availability

A simple app for friends to mark unavailable dates and find the best day to meet.

## Setup

1. Create a [Supabase](https://supabase.com) project
2. Run `supabase-schema.sql` in the SQL Editor
3. Copy `.env.example` to `.env` and fill in your Supabase URL + anon key
4. `npm install && npm run dev`

## Deploy to Vercel

1. Push this repo to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy
