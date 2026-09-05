# Himwiita Nkosilati Music — Version 4

A production-oriented online music website for **Himwiita Nkosilati Music**.

## What is new in V4
- Supabase PostgreSQL database for songs, albums, videos, lyrics and audit history.
- Supabase Storage for permanent online audio/video/cover storage.
- Secure server-side admin session using an environment secret.
- Admin upload/delete tools.
- Play counters for songs.
- Public music player with next/previous/auto-next.
- Searchable track list.
- Responsive dark/gold design.
- Render deployment file included.
- Existing 10 Tushoma Ndiwe MP3 files are included as seed media.

## Before putting it online
1. Create a Supabase project.
2. Open SQL Editor and run `sql/supabase_setup.sql`.
3. Copy the Supabase project URL and **service role key** into Render environment variables. Never put the service role key in browser code or GitHub.
4. Set `ADMIN_PASS` to a strong private password.
5. Deploy this project to Render.

## Local test
Install Node.js 18+.

```bash
npm install
```

Create environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `ADMIN_USER` (default `admin`)
- `ADMIN_PASS`

Then:

```bash
npm start
```

Open `http://localhost:3000` and `/admin.html`.

## Important
The included MP3s are copied from the earlier website build. On first start with Supabase configured, V4 automatically uploads any seed songs that are not already in the database. This means the public site can use permanent Supabase URLs instead of Render's temporary filesystem.
