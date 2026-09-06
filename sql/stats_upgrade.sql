-- HIMWIITA NKOSILATI MUSIC: STATS UPGRADE
-- Run this once in Supabase SQL Editor on your existing project.

alter table public.songs add column if not exists likes bigint default 0;
alter table public.songs add column if not exists downloads bigint default 0;

update public.songs set likes=coalesce(likes,0), downloads=coalesce(downloads,0), plays=coalesce(plays,0);

create or replace function public.increment_song_plays(song_id text)
returns void language sql security definer as $$
  update public.songs set plays=coalesce(plays,0)+1 where id=song_id;
$$;

create or replace function public.increment_song_likes(song_id text)
returns void language sql security definer as $$
  update public.songs set likes=coalesce(likes,0)+1 where id=song_id;
$$;

create or replace function public.increment_song_downloads(song_id text)
returns void language sql security definer as $$
  update public.songs set downloads=coalesce(downloads,0)+1 where id=song_id;
$$;
