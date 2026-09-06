# Himwiita Nkosilati Music — V4.1

V4.1 fixes the first-album problem by **not requiring the 10 bundled MP3s to be uploaded to Supabase Storage during startup**. The starter MP3s are already inside the application and are served from `/uploads/audio/...`.

## What changed
- 10 starter songs are seeded into the Supabase `songs` table with local playable URLs.
- If Supabase is temporarily unreachable, the public site falls back to the local content instead of showing an empty library.
- Admin uploads try Supabase Storage first.
- If Supabase Storage cannot be reached, an upload is saved locally so it can play immediately, with a warning explaining that Render Free storage is not permanent.
- Added `/api/health` for quick diagnostics.
- Better Supabase error logging.

## Important for permanent new uploads
For permanent admin uploads on Render, Supabase Storage must be reachable from the Render service. If it is not, the V4.1 local fallback is only temporary on Render Free.

Supabase currently recommends resumable/TUS uploads for files larger than 6 MB. The existing standard server upload remains for compatibility; this can be upgraded to TUS later if needed.

## Environment variables
Set these on Render:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or your current server-side Supabase key)
- `SESSION_SECRET`
- `ADMIN_USER`
- `ADMIN_PASS`

Never put a Supabase secret/service-role key in browser code or GitHub.
